import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "@/data/mockWarehouseData";
import { WarehouseTypeBadge } from "./WarehouseTypeBadge";
import { StatusBadge } from "./StatusBadge";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Calendar,
  Info,
} from "lucide-react";
import {
  FormDialog,
  FormCardSection,
  FormField,
} from "@/components/forms";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/dateUtils";

interface WarehouseDetailsCardProps {
  warehouse: Warehouse;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WarehouseDetailsCard: React.FC<WarehouseDetailsCardProps> = ({
  warehouse,
  onEdit,
  onToggleStatus,
  onDelete,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("Warehouse Details")}
      description={warehouse.name}
      icon={Building2}
      maxWidth="4xl"
    >
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Basic Information Section */}
        <FormCardSection
          title={t("Basic Information")}
          icon={Building2}
        >
          <FormField
            label={t("Warehouse Name")}
            htmlFor="warehouse-name"
          >
            <div className={cn(
              "px-3 py-2 rounded-md border",
              isRTL && "text-right"
            )}>
              <span className="font-medium text-foreground">{warehouse.name}</span>
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("Warehouse Type")}
              htmlFor="warehouse-type"
            >
              <div className={cn(
                "px-3 py-2 rounded-md border",
                isRTL && "text-right"
              )}>
                <WarehouseTypeBadge type={warehouse.type} />
              </div>
            </FormField>

            <FormField
              label={t("Status")}
              htmlFor="warehouse-status"
            >
              <div className={cn(
                "px-3 py-2 rounded-md border",
                isRTL && "text-right"
              )}>
                <StatusBadge status={warehouse.status} />
              </div>
            </FormField>
          </div>

          {warehouse.isShared !== undefined && (
            <FormField
              label={t("Warehouse Type")}
              description={warehouse.isShared 
                ? t("This warehouse is shared between branches. Inventory changes affect all assigned branches.")
                : t("Each branch maintains separate inventory quantities for this warehouse.")}
            >
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-md border",
                isRTL && "flex-row-reverse"
              )}>
                <Info className={cn(
                  "h-4 w-4 text-primary flex-shrink-0",
                  isRTL && "ml-2"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isRTL && "text-right"
                )}>
                  {warehouse.isShared 
                    ? t("Shared Warehouse")
                    : t("Branch-Specific Warehouse")}
                </span>
              </div>
            </FormField>
          )}
        </FormCardSection>

        {/* Assigned Branches Section */}
        <FormCardSection
          title={t("Assigned Branches / Clinics")}
          icon={Building2}
        >
          <FormField
            label={t("Branches")}
            description={t("Branches that have access to this warehouse")}
          >
            {warehouse.assignedBranches.length > 0 ? (
              <div className="space-y-2">
                {warehouse.assignedBranches.map((branch, index) => (
                  <div key={branch.id}>
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      isRTL && "flex-row-reverse text-right"
                    )}>
                      <div className="flex-1">
                        <div 
                          className={cn(
                            "font-medium text-foreground",
                            isRTL && "text-right"
                          )}
                          dir={isRTL ? "rtl" : "ltr"}
                          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                        >
                          {branch.name}
                        </div>
                        {branch.code && (
                          <div 
                            className={cn(
                              "text-sm text-muted-foreground mt-1",
                              isRTL && "text-right"
                            )}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                          >
                            {t("Code")}: {branch.code}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < warehouse.assignedBranches.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn(
                "p-4 text-center border border-dashed rounded-lg",
                isRTL && "text-right"
              )}>
                <p className="text-muted-foreground">
                  {t("No branches assigned")}
                </p>
              </div>
            )}
          </FormField>
        </FormCardSection>

        {/* Manager & Dates Section */}
        <FormCardSection
          title={t("Manager & Information")}
          icon={User}
        >
          <FormField
            label={t("Warehouse Manager")}
            description={warehouse.manager 
              ? t("The person responsible for managing this warehouse")
              : t("No manager has been assigned to this warehouse")}
          >
            {warehouse.manager ? (
              <div className={cn(
                "p-4 rounded-lg border",
                isRTL && "text-right"
              )}>
                <div className={cn(
                  "flex items-start gap-3",
                  isRTL && "flex-row-reverse"
                )}>
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0",
                    isRTL && "ml-3"
                  )}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-foreground",
                      isRTL && "text-right"
                    )}>
                      {warehouse.manager.fullName}
                    </div>
                    {warehouse.manager.email && (
                      <div className={cn(
                        "text-sm text-muted-foreground mt-1",
                        isRTL && "text-right"
                      )}>
                        {warehouse.manager.email}
                      </div>
                    )}
                    {warehouse.manager.role && (
                      <Badge variant="outline" className={cn("mt-2", isRTL && "inline-block")}>
                        {warehouse.manager.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(
                "p-4 border border-dashed rounded-lg",
                isRTL ? "text-right" : "text-center"
              )}>
                <p 
                  className="text-muted-foreground"
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'center' }}
                >
                  {t("No manager assigned")}
                </p>
              </div>
            )}
          </FormField>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("Created Date")}
              htmlFor="created-date"
            >
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-md border",
                isRTL && "flex-row-reverse text-right"
              )}>
                <Calendar className={cn(
                  "h-4 w-4 text-muted-foreground flex-shrink-0",
                  isRTL && "ml-2"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isRTL && "text-right"
                )}>
                  {formatDate(warehouse.createdAt)}
                </span>
              </div>
            </FormField>

            {warehouse.updatedAt && (
              <FormField
                label={t("Last Updated")}
                htmlFor="updated-date"
              >
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-md border",
                  isRTL && "flex-row-reverse text-right"
                )}>
                  <Calendar className={cn(
                    "h-4 w-4 text-muted-foreground flex-shrink-0",
                    isRTL && "ml-2"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    isRTL && "text-right"
                  )}>
                    {formatDate(warehouse.updatedAt)}
                  </span>
                </div>
              </FormField>
            )}
          </div>
        </FormCardSection>
      </div>
    </FormDialog>
  );
};
