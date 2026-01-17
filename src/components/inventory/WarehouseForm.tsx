import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Warehouse, Branch, User } from "@/data/mockWarehouseData";
import { BranchMultiSelect } from "./BranchMultiSelect";
import { WarehouseTypeBadge } from "./WarehouseTypeBadge";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Building2, User as UserIcon } from "lucide-react";
import {
  FormDialog,
  FormCardSection,
  FormField,
  StatusToggleField,
} from "@/components/forms";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WarehouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  branches: Branch[];
  users: User[];
  onSave: (data: {
    name: string;
    type: "main" | "sub";
    assignedBranches: string[];
    managerId?: string;
    status: "active" | "inactive";
    isShared?: boolean;
  }) => Promise<void>;
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({
  open,
  onOpenChange,
  warehouse,
  branches,
  users,
  onSave,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: "",
    type: "main" as "main" | "sub",
    assignedBranches: [] as string[],
    managerId: "none", // Use "none" instead of empty string
    status: "active" as "active" | "inactive",
    isShared: false,
  });

  // Filter branches based on warehouse type
  // For MAIN warehouses: show all branches
  // For SUB warehouses: show only assigned branches (if editing) or all branches (if creating)
  const availableBranches = React.useMemo(() => {
    if (formData.type === "main") {
      // MAIN warehouses can be assigned to all branches
      return branches;
    } else {
      // SUB warehouses: if editing and has assigned branches, show only those
      // Otherwise, show all branches (for new SUB warehouses)
      if (warehouse && warehouse.assignedBranches.length > 0) {
        const assignedBranchIds = warehouse.assignedBranches.map(b => b.id);
        return branches.filter(b => assignedBranchIds.includes(b.id));
      }
      return branches;
    }
  }, [formData.type, branches, warehouse]);

  // Reset form when warehouse changes
  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        type: warehouse.type,
        assignedBranches: warehouse.assignedBranches.map((b) => b.id),
        managerId: warehouse.manager?.id || "none",
        status: warehouse.status,
        isShared: warehouse.isShared || false,
      });
    } else {
      setFormData({
        name: "",
        type: "main",
        assignedBranches: [],
        managerId: "none",
        status: "active",
        isShared: false,
      });
    }
    setErrors({});
  }, [warehouse, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("Warehouse name is required");
    }

    if (formData.assignedBranches.length === 0) {
      newErrors.assignedBranches = t("At least one branch must be selected");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: formData.name,
        type: formData.type,
        assignedBranches: formData.assignedBranches,
        managerId: formData.managerId === "none" ? undefined : formData.managerId,
        status: formData.status,
        isShared: formData.isShared,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving warehouse:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={warehouse ? t("Edit Warehouse") : t("Add New Warehouse")}
      description={
        warehouse
          ? t("Update warehouse information and settings")
          : t("Create a new warehouse and assign it to branches")
      }
      icon={Building2}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormCardSection
          title={t("Basic Information")}
          icon={Building2}
        >
          <FormField
            label={t("Warehouse Name")}
            required
            error={errors.name}
            htmlFor="name"
          >
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                  });
                }
              }}
              placeholder={t("e.g., Main Warehouse - Central")}
              className={errors.name ? "border-red-500" : ""}
              dir="auto"
            />
          </FormField>

          <FormField
            label={t("Warehouse Type")}
            required
            htmlFor="type"
          >
            <Select
              value={formData.type}
              onValueChange={(value: "main" | "sub") => {
                setFormData((prev) => ({ ...prev, type: value }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="auto">
                <SelectItem value="main">
                  <div className="flex items-center gap-2">
                    <WarehouseTypeBadge type="main" />
                    <span>{t("Main Warehouse")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="sub">
                  <div className="flex items-center gap-2">
                    <WarehouseTypeBadge type="sub" />
                    <span>{t("Sub Warehouse")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </FormCardSection>

        {/* Assigned Branches */}
        <FormCardSection
          title={t("Assigned Branches / Clinics")}
          icon={Building2}
        >
          <FormField
            label={t("Select Branches")}
            required
            error={errors.assignedBranches}
            description={
              formData.type === "main"
                ? t("Main warehouses can be assigned to multiple branches")
                : t("Sub warehouses are typically assigned to specific branches")
            }
          >
            <BranchMultiSelect
              branches={availableBranches}
              selectedBranchIds={formData.assignedBranches}
              onSelectionChange={(ids) => {
                setFormData((prev) => ({ ...prev, assignedBranches: ids }));
                if (errors.assignedBranches) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.assignedBranches;
                    return newErrors;
                  });
                }
              }}
              placeholder={t("Select branches...")}
              required
              error={errors.assignedBranches}
            />
          </FormField>

          {/* Shared Warehouse Toggle */}
          {formData.assignedBranches.length > 0 && (
            <FormField
              label={t("Shared Warehouse")}
              description={t("Enable this option to make inventory deductions and additions affect all branches using this warehouse")}
            >
              <div
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg bg-muted/50 transition-colors",
                  isRTL ? "flex-row-reverse gap-4" : "gap-4"
                )}
              >
                <div
                  className={cn(
                    "flex items-center flex-1",
                    isRTL ? "flex-row-reverse gap-3" : "gap-3"
                  )}
                >
                  <Info
                    className={cn(
                      "h-5 w-5 text-primary flex-shrink-0",
                      isRTL && "ml-2"
                    )}
                  />
                  <div
                    className={cn(
                      "flex flex-col flex-1",
                      isRTL && "text-right items-end"
                    )}
                  >
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      <Label
                        htmlFor="isShared"
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          isRTL && "text-right"
                        )}
                      >
                        {t("Specify this warehouse is shared between branches")}
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            className={cn("max-w-xs", isRTL && "text-right")}
                            side={isRTL ? "left" : "right"}
                          >
                            <p className="text-sm">
                              {t("When enabled, inventory deductions and additions in this warehouse will affect all branches assigned to it. When disabled, each branch maintains separate inventory quantities.")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span
                      className={cn(
                        "text-xs text-muted-foreground leading-relaxed mt-1",
                        isRTL && "text-right"
                      )}
                    >
                      {formData.isShared
                        ? t("Inventory is shared across all assigned branches")
                        : t("Each branch maintains separate inventory quantities")}
                    </span>
                  </div>
                </div>
                <Switch
                  id="isShared"
                  checked={formData.isShared}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({ ...prev, isShared: checked }));
                  }}
                  className={cn(
                    "flex-shrink-0",
                    isRTL && "[&[data-state=checked]>*]:translate-x-[-1.25rem]"
                  )}
                />
              </div>
            </FormField>
          )}
        </FormCardSection>

        {/* Manager & Status */}
        <FormCardSection
          title={t("Manager & Status")}
          icon={UserIcon}
        >
          <FormField
            label={t("Warehouse Manager")}
            htmlFor="manager"
          >
            <Select
              value={formData.managerId}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  managerId: value,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select a manager (optional)")} />
              </SelectTrigger>
              <SelectContent dir="auto">
                <SelectItem value="none">{t("No Manager")}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName}
                    {user.role && (
                      <span className="text-muted-foreground ms-2">
                        ({user.role})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <StatusToggleField
            label={t("Status")}
            checked={formData.status === "active"}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({
                ...prev,
                status: checked ? "active" : "inactive",
              }));
            }}
            activeDescription={t("Warehouse is active and operational")}
            inactiveDescription={t("Warehouse is inactive")}
          />
        </FormCardSection>

        {/* Form Actions */}
        <div className={cn("flex justify-end gap-3 pt-4", isRTL && "flex-row-reverse")}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className={cn("w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin", isRTL ? "ms-2" : "me-2")} />
                {t("Saving...")}
              </>
            ) : (
              <>
                {warehouse ? t("Update Warehouse") : t("Create Warehouse")}
              </>
            )}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
};
