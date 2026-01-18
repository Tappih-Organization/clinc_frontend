import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pill } from "lucide-react";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { FormField } from "./FormField";

export interface ItemField {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  instructions?: string;
  [key: string]: any; // Allow additional fields
}

export interface FormItem extends ItemField {
  id: string;
}

export interface ItemsDetailsProps {
  items: FormItem[];
  onItemsChange: (items: FormItem[]) => void;
  title?: string;
  itemLabel?: string; // e.g., "Medication", "Item"
  addButtonLabel?: string;
  showCommonItems?: boolean;
  commonItems?: Array<{ name: string; dosages?: string[] }>;
  frequencies?: string[];
  durations?: string[];
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
      type?: "text" | "number" | "select" | "textarea";
      options?: string[];
      required?: boolean;
      placeholder?: string;
    }>;
  };
  calculateTotal?: (items: FormItem[]) => number;
  totalLabel?: string;
  minItems?: number;
  className?: string;
}

/**
 * Reusable Items Details Component with full RTL support
 * Can be used for medications, inventory items, or any list of items with details
 */
export const ItemsDetails: React.FC<ItemsDetailsProps> = ({
  items,
  onItemsChange,
  title,
  itemLabel = "Item",
  addButtonLabel,
  showCommonItems = false,
  commonItems = [],
  frequencies = [],
  durations = [],
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
  minItems = 1,
  className,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const defaultFrequencies = [
    "Once daily",
    "Twice daily",
    "Three times daily",
    "Four times daily",
    "Every 4 hours",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "As needed",
    "Before meals",
    "After meals",
    "At bedtime",
  ];

  const defaultDurations = [
    "3 days",
    "5 days",
    "7 days",
    "10 days",
    "14 days",
    "21 days",
    "30 days",
    "60 days",
    "90 days",
    "Until finished",
    "As needed",
  ];

  const frequenciesList = frequencies.length > 0 ? frequencies : defaultFrequencies;
  const durationsList = durations.length > 0 ? durations : defaultDurations;

  const addItem = () => {
    const newItem: FormItem = {
      id: `item_${Date.now()}`,
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      quantity: 1,
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > minItems) {
      onItemsChange(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof FormItem,
    value: string | number,
  ) => {
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const selectCommonItem = (itemId: string, itemName: string) => {
    const selectedItem = commonItems.find((item) => item.name === itemName);
    if (selectedItem) {
      updateItem(itemId, "name", selectedItem.name);
      // Auto-select first dosage if available
      if (selectedItem.dosages && selectedItem.dosages.length > 0) {
        updateItem(itemId, "dosage", selectedItem.dosages[0]);
      }
    }
  };

  const calculateTotalQuantity = () => {
    if (calculateTotal) {
      return calculateTotal(items);
    }
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const displayTitle = title || t("Items");
  const displayAddLabel = addButtonLabel || t("Add Item");
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
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Pill className={cn("h-4 w-4 flex-shrink-0", isRTL && "order-2")} />
            <span className={cn(isRTL && "text-right")}>{displayTitle}</span>
          </div>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Badge variant="outline" className={cn(isRTL && "text-right")}>
              {displayTotalLabel} {calculateTotalQuantity()} {t("units")}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              <Plus className={cn("h-4 w-4 flex-shrink-0", isRTL && "order-2")} />
              <span className={cn(isRTL && "text-right")}>{displayAddLabel}</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "border rounded-lg p-4 space-y-4 bg-gray-50",
              isRTL && "text-right"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div
              className={cn(
                "flex justify-between items-center",
                isRTL && "flex-row-reverse"
              )}
            >
              <h4
                className={cn(
                  "font-medium",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                {displayItemLabel} {index + 1}
              </h4>
              {items.length > minItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Name and Dosage Row */}
            {(fields.showName || fields.showDosage) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.showName && (
                  <FormField
                    label={t(`${displayItemLabel} Name`)}
                    required
                    className={cn(isRTL && "text-right")}
                  >
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      placeholder={t(`Enter ${displayItemLabel.toLowerCase()} name`)}
                      required
                      dir={isRTL ? "rtl" : "ltr"}
                      className={cn(isRTL && "text-right")}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    />
                    {showCommonItems && commonItems.length > 0 && (
                      <Select
                        onValueChange={(value) => selectCommonItem(item.id, value)}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <SelectTrigger
                          dir={isRTL ? "rtl" : "ltr"}
                          className={cn(isRTL && "text-right")}
                        >
                          <SelectValue
                            placeholder={t("Or select from common items")}
                            dir={isRTL ? "rtl" : "ltr"}
                          />
                        </SelectTrigger>
                        <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                          {commonItems.map((commonItem) => (
                            <SelectItem
                              key={commonItem.name}
                              value={commonItem.name}
                              dir={isRTL ? "rtl" : "ltr"}
                            >
                              {commonItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                )}

                {fields.showDosage && (
                  <FormField
                    label={t("Dosage")}
                    required
                    className={cn(isRTL && "text-right")}
                  >
                    <Input
                      value={item.dosage || ""}
                      onChange={(e) => updateItem(item.id, "dosage", e.target.value)}
                      placeholder={t("e.g., 500mg")}
                      required
                      dir={isRTL ? "rtl" : "ltr"}
                      className={cn(isRTL && "text-right")}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    />
                  </FormField>
                )}
              </div>
            )}

            {/* Frequency, Duration, Quantity Row */}
            {(fields.showFrequency || fields.showDuration || fields.showQuantity) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fields.showFrequency && (
                  <FormField
                    label={t("Frequency")}
                    required
                    className={cn(isRTL && "text-right")}
                  >
                    <Select
                      value={item.frequency || ""}
                      onValueChange={(value) => updateItem(item.id, "frequency", value)}
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <SelectTrigger
                        dir={isRTL ? "rtl" : "ltr"}
                        className={cn(isRTL && "text-right")}
                      >
                        <SelectValue
                          placeholder={t("How often")}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      </SelectTrigger>
                      <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                        {frequenciesList.map((freq) => (
                          <SelectItem
                            key={freq}
                            value={freq}
                            dir={isRTL ? "rtl" : "ltr"}
                          >
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {fields.showDuration && (
                  <FormField
                    label={t("Duration")}
                    required
                    className={cn(isRTL && "text-right")}
                  >
                    <Select
                      value={item.duration || ""}
                      onValueChange={(value) => updateItem(item.id, "duration", value)}
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <SelectTrigger
                        dir={isRTL ? "rtl" : "ltr"}
                        className={cn(isRTL && "text-right")}
                      >
                        <SelectValue
                          placeholder={t("How long")}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      </SelectTrigger>
                      <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                        {durationsList.map((duration) => (
                          <SelectItem
                            key={duration}
                            value={duration}
                            dir={isRTL ? "rtl" : "ltr"}
                          >
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}

                {fields.showQuantity && (
                  <FormField
                    label={t("Quantity")}
                    className={cn(isRTL && "text-right")}
                  >
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      dir={isRTL ? "rtl" : "ltr"}
                      className={cn(isRTL && "text-right")}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    />
                  </FormField>
                )}
              </div>
            )}

            {/* Custom Fields */}
            {fields.customFields && fields.customFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.customFields.map((customField) => {
                  const fieldValue = item[customField.key] || "";

                  if (customField.type === "select" && customField.options) {
                    return (
                      <FormField
                        key={customField.key}
                        label={customField.label}
                        required={customField.required}
                        className={cn(isRTL && "text-right")}
                      >
                        <Select
                          value={fieldValue}
                          onValueChange={(value) =>
                            updateItem(item.id, customField.key, value)
                          }
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <SelectTrigger
                            dir={isRTL ? "rtl" : "ltr"}
                            className={cn(isRTL && "text-right")}
                          >
                            <SelectValue
                              placeholder={customField.placeholder || ""}
                              dir={isRTL ? "rtl" : "ltr"}
                            />
                          </SelectTrigger>
                          <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                            {customField.options.map((option) => (
                              <SelectItem
                                key={option}
                                value={option}
                                dir={isRTL ? "rtl" : "ltr"}
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    );
                  }

                  if (customField.type === "textarea") {
                    return (
                      <FormField
                        key={customField.key}
                        label={customField.label}
                        required={customField.required}
                        className={cn(isRTL && "text-right")}
                      >
                        <Textarea
                          value={fieldValue}
                          onChange={(e) =>
                            updateItem(item.id, customField.key, e.target.value)
                          }
                          placeholder={customField.placeholder || ""}
                          rows={2}
                          dir={isRTL ? "rtl" : "ltr"}
                          className={cn(isRTL && "text-right")}
                          style={
                            isRTL ? { textAlign: "right" } : { textAlign: "left" }
                          }
                        />
                      </FormField>
                    );
                  }

                  return (
                    <FormField
                      key={customField.key}
                      label={customField.label}
                      required={customField.required}
                      className={cn(isRTL && "text-right")}
                    >
                      <Input
                        type={customField.type || "text"}
                        value={fieldValue}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            customField.key,
                            customField.type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value,
                          )
                        }
                        placeholder={customField.placeholder || ""}
                        required={customField.required}
                        dir={isRTL ? "rtl" : "ltr"}
                        className={cn(isRTL && "text-right")}
                        style={
                          isRTL ? { textAlign: "right" } : { textAlign: "left" }
                        }
                      />
                    </FormField>
                  );
                })}
              </div>
            )}

            {/* Instructions */}
            {fields.showInstructions && (
              <FormField
                label={t("Instructions")}
                className={cn(isRTL && "text-right")}
              >
                <Textarea
                  value={item.instructions || ""}
                  onChange={(e) =>
                    updateItem(item.id, "instructions", e.target.value)
                  }
                  placeholder={t("Special instructions...")}
                  rows={2}
                  dir={isRTL ? "rtl" : "ltr"}
                  className={cn(isRTL && "text-right")}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                />
              </FormField>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ItemsDetails;
