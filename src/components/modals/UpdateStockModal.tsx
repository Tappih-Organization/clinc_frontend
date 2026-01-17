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
import { TrendingUp, TrendingDown, Package, Warehouse, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsRTL } from "@/hooks/useIsRTL";
import {
  FormDialog,
  FormCardSection,
  FormField,
} from "@/components/forms";
import { apiService } from "@/services/api";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "@/hooks/use-toast";

interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface Warehouse {
  _id: string;
  name: string;
  type: 'MAIN' | 'SUB';
}

interface UpdateStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    quantity: number;
    branches?: Array<{ id: string; name: string; code?: string }>;
    branchWarehouses?: Array<{ branchId: string; warehouseId: string; warehouseName?: string; warehouseType?: string }>;
  } | null;
  operation: "add" | "subtract";
  onConfirm: (quantity: number, branchId: string, warehouseId: string) => Promise<void>;
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = ({
  open,
  onOpenChange,
  item,
  operation,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { currentClinic } = useClinic();
  const [quantity, setQuantity] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [warehouseError, setWarehouseError] = useState("");

  // Filter available branches based on current clinic type
  // Main clinic: show main clinic + all sub clinics
  // Sub clinic: show only current clinic
  const availableBranches: Branch[] = React.useMemo(() => {
    if (!item?.branches || !currentClinic) {
      return item?.branches || [];
    }
    
    const isMainClinic = currentClinic.is_main_clinic === true;
    const currentClinicId = currentClinic._id?.toString();
    
    if (isMainClinic) {
      // Main clinic: show main clinic + all sub clinics
      return item.branches.filter((branch: Branch) => {
        // Include main clinic itself or sub clinics that belong to this main clinic
        return branch.id === currentClinicId || 
               // Note: We need to check if branch is a sub clinic of current main clinic
               // This will be handled by backend filtering, but we can also filter here
               true; // For now, show all branches assigned to the item
      });
    } else {
      // Sub clinic: show only current clinic
      return item.branches.filter((branch: Branch) => branch.id === currentClinicId);
    }
  }, [item?.branches, currentClinic]);

  // Load warehouses when branch is selected
  useEffect(() => {
    const loadWarehouses = async () => {
      if (!selectedBranchId) {
        setWarehouses([]);
        setSelectedWarehouseId("");
        return;
      }

      setLoadingWarehouses(true);
      setWarehouseError("");
      try {
        const response = await apiService.getWarehouses({
          branchId: selectedBranchId,
          status: "ACTIVE",
          limit: 100,
        });

        const fetchedWarehouses = response.data || [];
        setWarehouses(fetchedWarehouses);

        // Auto-select MAIN warehouse if available
        const mainWarehouse = fetchedWarehouses.find((w: Warehouse) => w.type === "MAIN");
        if (mainWarehouse) {
          setSelectedWarehouseId(mainWarehouse._id);
        } else if (fetchedWarehouses.length > 0) {
          // If no MAIN warehouse, select first available
          setSelectedWarehouseId(fetchedWarehouses[0]._id);
        }
      } catch (error) {
        console.error("Error loading warehouses:", error);
        setWarehouseError(t("Failed to load warehouses"));
        toast({
          title: t("Error"),
          description: t("Failed to load warehouses for this branch"),
          variant: "destructive",
        });
      } finally {
        setLoadingWarehouses(false);
      }
    };

    loadWarehouses();
  }, [selectedBranchId, t]);

  // Initialize branch selection when modal opens
  useEffect(() => {
    if (open && item) {
      setQuantity("");
      setError("");
      setBranchError("");
      setWarehouseError("");
      
      // Auto-select current clinic branch if available
      if (currentClinic && availableBranches.length > 0) {
        const currentClinicBranch = availableBranches.find(
          (b) => b.id === currentClinic._id?.toString()
        );
        if (currentClinicBranch) {
          setSelectedBranchId(currentClinicBranch.id);
        } else {
          // Select first branch if current clinic not in list
          setSelectedBranchId(availableBranches[0].id);
        }
      } else if (availableBranches.length > 0) {
        setSelectedBranchId(availableBranches[0].id);
      }
    }
  }, [open, item, currentClinic, availableBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBranchError("");
    setWarehouseError("");

    // Validation
    if (!selectedBranchId) {
      setBranchError(t("Please select a branch"));
      return;
    }

    if (!selectedWarehouseId) {
      setWarehouseError(t("Please select a warehouse"));
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      setError(t("Please enter a valid quantity greater than 0"));
      return;
    }

    if (operation === "subtract" && item && quantityNum > item.quantity) {
      setError(
        t("Cannot subtract more than current stock. Current stock: {{stock}}", {
          stock: item.quantity,
        })
      );
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(quantityNum, selectedBranchId, selectedWarehouseId);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || t("Failed to update stock. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const operationLabel =
    operation === "add" ? t("Add Stock") : t("Remove Stock");
  const OperationIcon =
    operation === "add" ? TrendingUp : TrendingDown;
  const operationDescription = operation === "add" 
    ? t("Add items to inventory stock")
    : t("Remove items from inventory stock");

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={operationLabel}
      description={item ? `${t("Item")}: ${item.name}` : operationDescription}
      icon={OperationIcon}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Item Information */}
        {item && (
          <FormCardSection
            title={t("Item Information")}
            icon={Package}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t("Item Name")}
                htmlFor="item-name"
              >
                <div className={cn(
                  "px-3 py-2 rounded-md border",
                  isRTL && "text-right"
                )}>
                  <span className={cn(
                    "font-medium text-foreground",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                  >
                    {item.name}
                  </span>
                </div>
              </FormField>

              <FormField
                label={t("Current Stock")}
                htmlFor="current-stock"
              >
                <div className={cn(
                  "px-3 py-2 rounded-md border",
                  isRTL && "text-right"
                )}>
                  <span className={cn(
                    "font-medium text-foreground",
                    isRTL && "text-right"
                  )}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                  >
                    {item.quantity} {t("units")}
                  </span>
                </div>
              </FormField>
            </div>
          </FormCardSection>
        )}

        {/* Branch & Warehouse Selection */}
        <FormCardSection
          title={t("Branch & Warehouse Selection")}
          icon={Building2}
        >
          {/* Branch Selection */}
          {availableBranches.length > 0 && (
            <FormField
              label={t("Select Branch")}
              required
              error={branchError}
              htmlFor="branch"
              description={t("Select the branch where the stock operation will be performed")}
            >
              <Select
                value={selectedBranchId}
                onValueChange={(value) => {
                  setSelectedBranchId(value);
                  setSelectedWarehouseId("");
                  setBranchError("");
                }}
              >
                <SelectTrigger
                  id="branch"
                  className={cn(
                    branchError ? "border-red-500" : "",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <SelectValue placeholder={t("Select branch")} />
                </SelectTrigger>
                <SelectContent 
                  dir={isRTL ? "rtl" : "ltr"} 
                  className={cn(
                    isRTL && "text-right [&>div]:text-right"
                  )}
                >
                  {availableBranches.map((branch) => (
                    <SelectItem 
                      key={branch.id} 
                      value={branch.id} 
                      className={cn(
                        isRTL && "pr-8 pl-2 [&>span]:right-2 [&>span]:left-auto text-right"
                      )}
                    >
                      <div className={cn("flex items-center w-full", isRTL ? "flex-row-reverse gap-2 justify-end" : "gap-2")}>
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>{branch.name}</span>
                        {branch.code && (
                          <span className="text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                            ({branch.code})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Warehouse Selection */}
          {selectedBranchId && (
            <FormField
              label={t("Select Warehouse")}
              required
              error={warehouseError}
              htmlFor="warehouse"
              description={t("Select the warehouse where the stock will be updated")}
            >
              <Select
                value={selectedWarehouseId}
                onValueChange={(value) => {
                  setSelectedWarehouseId(value);
                  setWarehouseError("");
                }}
                disabled={loadingWarehouses}
              >
                <SelectTrigger
                  id="warehouse"
                  className={cn(
                    warehouseError ? "border-red-500" : "",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <SelectValue
                    placeholder={
                      loadingWarehouses
                        ? t("Loading warehouses...")
                        : t("Select warehouse")
                    }
                  />
                </SelectTrigger>
                <SelectContent 
                  dir={isRTL ? "rtl" : "ltr"} 
                  className={cn(
                    isRTL && "text-right [&>div]:text-right"
                  )}
                >
                  {loadingWarehouses ? (
                    <SelectItem 
                      value="loading" 
                      disabled 
                      className={cn(
                        isRTL && "pr-8 pl-2 [&>span]:right-2 [&>span]:left-auto text-right"
                      )}
                    >
                      <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>{t("Loading warehouses...")}</span>
                    </SelectItem>
                  ) : warehouses.length === 0 ? (
                    <SelectItem 
                      value="no-warehouses" 
                      disabled 
                      className={cn(
                        isRTL && "pr-8 pl-2 [&>span]:right-2 [&>span]:left-auto text-right"
                      )}
                    >
                      <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>{t("No warehouses found for this branch")}</span>
                    </SelectItem>
                  ) : (
                    warehouses.map((warehouse) => (
                      <SelectItem 
                        key={warehouse._id} 
                        value={warehouse._id} 
                        className={cn(
                          isRTL && "pr-8 pl-2 [&>span]:right-2 [&>span]:left-auto text-right"
                        )}
                      >
                        <div className={cn("flex items-center w-full", isRTL ? "flex-row-reverse gap-2 justify-end" : "gap-2")}>
                          <Warehouse className="h-4 w-4 flex-shrink-0" />
                          <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>{warehouse.name}</span>
                          <span className="text-xs text-muted-foreground" dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                            ({t(warehouse.type)})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </FormCardSection>

        {/* Quantity Input */}
        <FormCardSection
          title={operation === "add" ? t("Add Stock") : t("Remove Stock")}
          icon={OperationIcon}
        >
          <FormField
            label={t("Quantity")}
            required
            error={error}
            htmlFor="quantity"
            description={
              operation === "subtract" && item
                ? t("Maximum available: {{stock}} units", { stock: item.quantity })
                : t("Enter the quantity to add to stock")
            }
          >
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              placeholder={t("Enter quantity")}
              required
              className={cn(
                error ? "border-red-500" : ""
              )}
              dir="ltr"
              autoFocus
            />
          </FormField>
        </FormCardSection>

        {/* Form Actions */}
        <div className={cn(
          "flex justify-end gap-3 pt-4",
          isRTL && "flex-row-reverse"
        )}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              operation === "add"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isLoading ? (
              <>
                <div className={cn(
                  "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin",
                  isRTL ? "ms-2" : "me-2"
                )} />
                {t("Processing...")}
              </>
            ) : (
              operationLabel
            )}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
};

export default UpdateStockModal;
