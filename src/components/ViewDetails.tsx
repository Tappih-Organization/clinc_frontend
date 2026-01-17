import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Warehouse, Calendar, Eye, LucideIcon } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  FormDialog,
  FormCardSection,
  FormField,
} from "@/components/forms";
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
 * Supports multiple field types, sections, and full RTL (Right-to-Left) layout for Arabic.
 * 
 * Features:
 * - Modern design with FormDialog, FormCardSection, and FormField components
 * - Full RTL support for Arabic and English
 * - Multiple field types: text, badge, date, currency, array, boolean, phone, email, branches, branchWarehouses
 * - Automatic section grouping
 * - Clean design without background colors on fields
 * 
 * @example
 * ```tsx
 * <ViewDetails
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Item Details"
 *   description="View complete information"
 *   icon={Package}
 *   data={itemData}
 *   fields={[
 *     { key: "name", label: "Name", section: "Basic Information" },
 *     { key: "price", label: "Price", type: "currency", section: "Basic Information" },
 *     { key: "createdAt", label: "Created At", type: "date", section: "Additional Information" },
 *   ]}
 * />
 * ```
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
              )}>
                <p 
                  className="text-muted-foreground"
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'center' }}
                >
                  {t("No branches assigned")}
                </p>
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
                        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
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
                          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
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
          )}>
            <p 
              className="text-muted-foreground"
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'center' }}
            >
              {t("No branches assigned")}
            </p>
          </div>
        );
      case "branchWarehouses":
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return (
              <div className={cn(
                "p-4 border border-dashed rounded-lg",
                isRTL ? "text-right" : "text-center"
              )}>
                <p 
                  className="text-muted-foreground"
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'center' }}
                >
                  {t("No warehouses assigned")}
                </p>
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
                        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                      >
                        {bw.branchName || bw.branchId}
                      </div>
                      <div 
                        className={cn(
                          "text-sm text-muted-foreground mt-1",
                          isRTL && "text-right"
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
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
          )}>
            <p 
              className="text-muted-foreground"
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'center' }}
            >
              {t("No warehouses assigned")}
            </p>
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
          <span className="font-mono text-sm px-2 py-1 rounded border">
            {value}
          </span>
        );
      case "email":
        return (
          <span className="text-blue-600 hover:text-blue-800 font-medium">
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
    if (lowerSection.includes("basic") || lowerSection.includes("معلومات أساسية")) return Package;
    if (lowerSection.includes("stock") || lowerSection.includes("مخزون") || lowerSection.includes("pricing")) return Warehouse;
    if (lowerSection.includes("manufacturer") || lowerSection.includes("مصنع") || lowerSection.includes("supplier")) return Package;
    if (lowerSection.includes("expiry") || lowerSection.includes("انتهاء")) return Calendar;
    if (lowerSection.includes("branches") || lowerSection.includes("فروع") || lowerSection.includes("warehouses")) return Warehouse;
    if (lowerSection.includes("additional") || lowerSection.includes("إضافية") || lowerSection.includes("information")) return Calendar;
    return Package;
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description || t("View complete information and details")}
      icon={Icon}
      maxWidth={maxWidth}
    >
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {data ? (
          <>
            {Object.entries(groupedFields).map(([sectionName, sectionFields]) => {
              const SectionIcon = getSectionIcon(sectionName);
              
              return (
                <FormCardSection
                  key={sectionName}
                  title={sectionName}
                  icon={SectionIcon}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionFields.map((field) => {
                      const value = data?.[field.key];
                      const isEmpty = value === null || value === undefined || value === "" || 
                        (Array.isArray(value) && value.length === 0);
                      
                      // Fields that span full width
                      if (field.type === 'branchWarehouses' || field.type === 'branches') {
                        return (
                          <FormField
                            key={field.key}
                            label={field.label}
                            htmlFor={`field-${field.key}`}
                            className="md:col-span-2"
                          >
                            <div className={cn(
                              "p-3 rounded-md border",
                              isEmpty && "border-dashed",
                              isRTL && "text-right"
                            )}>
                              {field.render
                                ? field.render(value)
                                : formatValue(value, field.type)}
                            </div>
                          </FormField>
                        );
                      }
                      
                      return (
                        <FormField
                          key={field.key}
                          label={field.label}
                          htmlFor={`field-${field.key}`}
                        >
                          <div className={cn(
                            "px-3 py-2 rounded-md border",
                            isEmpty && "border-dashed",
                            isRTL && "text-right"
                          )}>
                            <span className={cn(
                              "font-medium text-foreground",
                              isEmpty && "text-muted-foreground italic",
                              isRTL && "text-right"
                            )}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                            >
                              {field.render
                                ? field.render(value)
                                : formatValue(value, field.type)}
                            </span>
                          </div>
                        </FormField>
                      );
                    })}
                  </div>
                </FormCardSection>
              );
            })}
          </>
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
              {t("No data available")}
            </p>
          </div>
        )}
      </div>
    </FormDialog>
  );
};

export default ViewDetails;
