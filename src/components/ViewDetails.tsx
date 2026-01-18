import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Warehouse, Calendar, Eye, LucideIcon, Info } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateUtils";

export interface ViewDetailsField {
  key: string;
  label: string;
  type?: "text" | "badge" | "date" | "currency" | "array" | "boolean" | "phone" | "email" | "branches" | "branchWarehouses";
  render?: (value: any) => React.ReactNode;
  section?: string;
}

export interface ViewDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  data: Record<string, any> | null;
  fields: ViewDetailsField[];
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
}

/**
 * Reusable ViewDetails Component
 * 
 * A modern, RTL-compatible component for displaying detailed information in a modal dialog.
 * Uses the same design system as ServiceDetailModal with Dialog, Card, and InfoRow components.
 * 
 * Features:
 * - Modern design with Dialog, Card, CardHeader, CardContent components
 * - Full RTL support for Arabic and English
 * - Multiple field types: text, badge, date, currency, array, boolean, phone, email, branches, branchWarehouses
 * - Automatic section grouping
 * - Consistent InfoRow component for all fields
 */
export const ViewDetails: React.FC<ViewDetailsProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon = Eye,
  data,
  fields,
  maxWidth = "4xl",
}) => {
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  // Standardized Info Row Component for consistent RTL alignment
  const InfoRow: React.FC<{
    label: string;
    value: React.ReactNode;
    valueDir?: "ltr" | "rtl";
    icon?: React.ReactNode;
    className?: string;
  }> = ({ label, value, valueDir, icon, className = "" }) => {
    const finalValueDir = valueDir || (isRTL ? "rtl" : "ltr");
    const isLTRContent = finalValueDir === "ltr";
    return (
      <div
        className={cn("space-y-1.5", className)}
        dir={isRTL ? "rtl" : "ltr"}
        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
      >
        <label
          className={cn(
            "text-sm font-medium text-gray-500 block leading-tight",
            isRTL ? "text-right" : "text-left"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
        >
          {label}
        </label>
        <div
          className={cn(
            "flex items-baseline min-h-[1.5rem]",
            isRTL ? "flex-row-reverse justify-end" : "justify-start",
            icon && "gap-2"
          )}
          style={isRTL && !isLTRContent ? { justifyContent: "flex-end" } : {}}
        >
          {icon && (
            <span className={cn("flex-shrink-0 self-center", isRTL && "order-2")}>
              {icon}
            </span>
          )}
          <p
            className={cn(
              "text-base leading-normal break-words",
              isLTRContent ? "text-left" : isRTL ? "text-right" : "text-left"
            )}
            dir={finalValueDir}
            style={
              isLTRContent
                ? { textAlign: "left", direction: "ltr" }
                : isRTL
                  ? { textAlign: "right", direction: "rtl" }
                  : { textAlign: "left", direction: "ltr" }
            }
          >
            {value}
          </p>
        </div>
      </div>
    );
  };

  const formatValue = (value: any, type: string = "text") => {
    if (value === null || value === undefined || value === "") return t("Not specified");

    switch (type) {
      case "date":
        try {
          return formatDate(value);
        } catch (e) {
          return value.toString();
        }
      case "currency":
        if (typeof value === 'number') {
          return formatAmount(value);
        }
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value || 0);
      case "boolean":
        return value ? t("Yes") : t("No");
      case "array":
        if (Array.isArray(value)) {
          if (value.length === 0) return t("None");
          return value.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              return item.name || item.label || JSON.stringify(item);
            }
            return item;
          }).join(", ");
        }
        return value;
      case "branches":
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return (
              <div className={cn(
                "p-4 border border-dashed rounded-lg",
                isRTL ? "text-right" : "text-center"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              >
                <p className="text-muted-foreground">{t("No branches assigned")}</p>
              </div>
            );
          }
          return (
            <div className="space-y-2">
              {value.map((branch: any, index: number) => (
                <div key={index}>
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
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        {branch.name || branch.id}
                      </div>
                      {branch.code && (
                        <div 
                          className={cn(
                            "text-sm text-muted-foreground mt-1",
                            isRTL && "text-right"
                          )}
                          dir={isRTL ? "rtl" : "ltr"}
                          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                        >
                          {t("Code")}: {branch.code}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < value.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className={cn(
            "p-4 border border-dashed rounded-lg",
            isRTL ? "text-right" : "text-center"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          >
            <p className="text-muted-foreground">{t("No branches assigned")}</p>
          </div>
        );
      case "branchWarehouses":
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return (
              <div className={cn(
                "p-4 border border-dashed rounded-lg",
                isRTL ? "text-right" : "text-center"
              )}
              dir={isRTL ? "rtl" : "ltr"}
              >
                <p className="text-muted-foreground">{t("No warehouses assigned")}</p>
              </div>
            );
          }
          return (
            <div className="space-y-2">
              {value.map((bw: any, index: number) => (
                <div key={index}>
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
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        {bw.branchName || bw.branchId}
                      </div>
                      <div 
                        className={cn(
                          "text-sm text-muted-foreground mt-1",
                          isRTL && "text-right"
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        <Badge variant="outline" className="inline-block">
                          {bw.warehouseName || bw.warehouseId}
                          {bw.warehouseType && (
                            <span className={cn("text-xs", isRTL ? "mr-1" : "ml-1")}>
                              ({bw.warehouseType})
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {index < value.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className={cn(
            "p-4 border border-dashed rounded-lg",
            isRTL ? "text-right" : "text-center"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          >
            <p className="text-muted-foreground">{t("No warehouses assigned")}</p>
          </div>
        );
      case "badge":
        return (
          <Badge variant="secondary">
            {value}
          </Badge>
        );
      case "phone":
        return (
          <span className="font-mono text-sm px-2 py-1 rounded border" dir="ltr" style={{ direction: "ltr" }}>
            {value}
          </span>
        );
      case "email":
        return (
          <span className="text-blue-600 hover:text-blue-800 font-medium" dir="ltr" style={{ direction: "ltr" }}>
            {value}
          </span>
        );
      default:
        return value.toString();
    }
  };

  // Group fields by section
  const groupedFields = fields.reduce((acc, field) => {
    const section = field.section || t("General Information");
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(field);
    return acc;
  }, {} as Record<string, ViewDetailsField[]>);

  // Get icon for section
  const getSectionIcon = (sectionName: string): LucideIcon => {
    const lowerSection = sectionName.toLowerCase();
    if (lowerSection.includes("basic") || lowerSection.includes("معلومات أساسية")) return Info;
    if (lowerSection.includes("stock") || lowerSection.includes("مخزون") || lowerSection.includes("pricing")) return Warehouse;
    if (lowerSection.includes("manufacturer") || lowerSection.includes("مصنع") || lowerSection.includes("supplier")) return Package;
    if (lowerSection.includes("expiry") || lowerSection.includes("انتهاء")) return Calendar;
    if (lowerSection.includes("branches") || lowerSection.includes("فروع") || lowerSection.includes("warehouses")) return Warehouse;
    if (lowerSection.includes("additional") || lowerSection.includes("إضافية") || lowerSection.includes("information")) return Calendar;
    return Info;
  };

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  }[maxWidth] || "max-w-4xl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(`${maxWidthClass} max-h-[95vh] overflow-y-auto z-50`, isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <Icon
              className={cn(
                "h-6 w-6 text-blue-600 flex-shrink-0",
                isRTL ? "order-2" : ""
              )}
            />
            <div className="flex-1 min-w-0">
              <DialogTitle
                className="text-xl font-semibold"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {title}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {description || t("View complete information and details")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {data ? (
            <>
              {Object.entries(groupedFields).map(([sectionName, sectionFields]) => {
                const SectionIcon = getSectionIcon(sectionName);
                
                return (
                  <Card key={sectionName} dir={isRTL ? "rtl" : "ltr"}>
                    <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                      <CardTitle
                        className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        <SectionIcon className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                        <span className={cn(isRTL && "text-right")}>{sectionName}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent dir={isRTL ? "rtl" : "ltr"}>
                      <div
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-2 gap-6",
                          isRTL && "text-right"
                        )}
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        {sectionFields.map((field) => {
                          const value = data?.[field.key];
                          const isEmpty = value === null || value === undefined || value === "" || 
                            (Array.isArray(value) && value.length === 0);
                          
                          // Fields that span full width
                          if (field.type === 'branchWarehouses' || field.type === 'branches') {
                            return (
                              <InfoRow
                                key={field.key}
                                label={field.label}
                                value={
                                  field.render
                                    ? field.render(value)
                                    : formatValue(value, field.type)
                                }
                                className="md:col-span-2"
                              />
                            );
                          }
                          
                          return (
                            <InfoRow
                              key={field.key}
                              label={field.label}
                              value={
                                field.render
                                  ? field.render(value)
                                  : formatValue(value, field.type)
                              }
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn(
                  "p-4 border border-dashed rounded-lg",
                  isRTL ? "text-right" : "text-center"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                >
                  <p className="text-muted-foreground">{t("No data available")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={cn("flex justify-end items-center pt-6 border-t", isRTL && "flex-row-reverse")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
            >
              {t("Close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDetails;
