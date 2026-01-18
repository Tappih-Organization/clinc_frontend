import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill } from "lucide-react";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface ItemField {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  instructions?: string;
  [key: string]: any; // Allow additional fields
}

export interface ItemsDetailsViewProps {
  items: ItemField[];
  title?: string;
  itemLabel?: string; // e.g., "Medication", "Item"
  fields?: {
    showName?: boolean;
    showDosage?: boolean;
    showFrequency?: boolean;
    showDuration?: boolean;
    showQuantity?: boolean;
    showInstructions?: boolean;
    customFields?: Array<{
      key: string;
      label: string;
    }>;
  };
  calculateTotal?: (items: ItemField[]) => number;
  totalLabel?: string;
  className?: string;
}

/**
 * Read-only Items Details View Component with full RTL support
 * Used for displaying items in detail views (prescriptions, invoices, etc.)
 */
export const ItemsDetailsView: React.FC<ItemsDetailsViewProps> = ({
  items,
  title,
  itemLabel = "Item",
  fields = {
    showName: true,
    showDosage: true,
    showFrequency: true,
    showDuration: true,
    showQuantity: true,
    showInstructions: true,
  },
  calculateTotal,
  totalLabel,
  className,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const calculateTotalQuantity = () => {
    if (calculateTotal) {
      return calculateTotal(items);
    }
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const displayTitle = title || t("Items");
  const displayTotalLabel = totalLabel || t("Total:");
  const displayItemLabel = itemLabel || t("Item");

  return (
    <Card className={className} dir={isRTL ? "rtl" : "ltr"}>
      <CardHeader dir={isRTL ? "rtl" : "ltr"}>
        <CardTitle
          className={cn(
            "text-lg flex items-center justify-between w-full",
            isRTL && "flex-row-reverse"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
        >
          {/* Badge - First in code, appears on RIGHT in RTL */}
          <Badge 
            variant="outline" 
            className={cn(isRTL && "text-right")}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            {displayTotalLabel} {calculateTotalQuantity()} {t("units")}
          </Badge>
          {/* Title - Second in code, appears on LEFT in RTL */}
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Pill className={cn("h-4 w-4 flex-shrink-0", isRTL && "order-2")} />
            <span 
              className={cn(isRTL && "text-right")}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
            >
              {displayTitle} ({items.length})
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "border rounded-lg p-4 bg-white",
              isRTL && "text-right"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div
              className={cn(
                "flex items-start justify-between mb-3",
                isRTL && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse"
                )}
              >
                <Pill className={cn("h-5 w-5 text-blue-600 mt-1 flex-shrink-0", isRTL && "order-2")} />
                <div className={cn(isRTL && "text-right")}>
                  {fields.showName && (
                    <>
                      <h4
                        className={cn(
                          "font-semibold text-lg",
                          isRTL && "text-right"
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        {item.name}
                      </h4>
                      {fields.showDosage && item.dosage && (
                        <p
                          className={cn("text-gray-600", isRTL && "text-right")}
                          dir={isRTL ? "rtl" : "ltr"}
                          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                        >
                          {item.dosage}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              {fields.showQuantity && (
                <Badge variant="secondary" className={cn(isRTL && "text-right")}>
                  {t("Qty:")} {item.quantity}
                </Badge>
              )}
            </div>

            {(fields.showFrequency || fields.showDuration || fields.showQuantity || fields.customFields) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {fields.showFrequency && item.frequency && (
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Label
                      className={cn(
                        "text-sm font-medium text-gray-500 block",
                        isRTL && "text-right"
                      )}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      {t("Frequency")}
                    </Label>
                    <p
                      className={cn(isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      {item.frequency}
                    </p>
                  </div>
                )}

                {fields.showDuration && item.duration && (
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Label
                      className={cn(
                        "text-sm font-medium text-gray-500 block",
                        isRTL && "text-right"
                      )}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      {t("Duration")}
                    </Label>
                    <p
                      className={cn(isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      {item.duration}
                    </p>
                  </div>
                )}

                {fields.showQuantity && (
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Label
                      className={cn(
                        "text-sm font-medium text-gray-500 block",
                        isRTL && "text-right"
                      )}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      {t("Quantity")}
                    </Label>
                    <p
                      className={cn(isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      {item.quantity} {t("units")}
                    </p>
                  </div>
                )}

                {/* Custom Fields */}
                {fields.customFields &&
                  fields.customFields.map((customField) => {
                    const fieldValue = item[customField.key];
                    if (!fieldValue) return null;

                    return (
                      <div
                        key={customField.key}
                        className={cn(isRTL && "text-right")}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <Label
                          className={cn(
                            "text-sm font-medium text-gray-500 block",
                            isRTL && "text-right"
                          )}
                          dir={isRTL ? "rtl" : "ltr"}
                          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                        >
                          {customField.label}
                        </Label>
                        <p
                          className={cn(isRTL && "text-right")}
                          dir={isRTL ? "rtl" : "ltr"}
                          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                        >
                          {String(fieldValue)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}

            {fields.showInstructions && item.instructions && (
              <div className={cn("mt-3", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <Label
                  className={cn(
                    "text-sm font-medium text-gray-500 block",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("Instructions")}
                </Label>
                <p
                  className={cn(
                    "mt-1 p-2 bg-blue-50 rounded text-sm",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {item.instructions}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ItemsDetailsView;
