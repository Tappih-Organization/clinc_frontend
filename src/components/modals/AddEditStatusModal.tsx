import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Languages, Palette, Info, Hash, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

export interface AppointmentStatus {
  _id?: string;
  code: string;
  name_ar: string;
  name_en: string;
  color: string;
  order?: number;
  show_in_calendar?: boolean;
  is_active?: boolean;
  is_default?: boolean;
  is_deleted?: boolean;
}

interface AddEditStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: AppointmentStatus | null;
  existingStatuses: AppointmentStatus[];
  onSave: (status: AppointmentStatus) => void;
  mode: "add" | "edit";
}

const AddEditStatusModal: React.FC<AddEditStatusModalProps> = ({
  open,
  onOpenChange,
  status,
  existingStatuses,
  onSave,
  mode,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [currentLanguage, setCurrentLanguage] = useState<"ar" | "en">(
    i18n.language === "ar" ? "ar" : "en"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    name_ar: string;
    name_en: string;
    color: string;
    order: number;
    show_in_calendar: boolean;
  }>({
    name_ar: "",
    name_en: "",
    color: "#6b7280",
    order: 1,
    show_in_calendar: false,
  });

  // Generate code automatically
  const generateCode = (): string => {
    if (mode === "edit" && status?.code) {
      return status.code;
    }
    // Generate S001, S002, etc. based on existing statuses
    let maxNumber = 0;
    if (existingStatuses.length > 0) {
      existingStatuses.forEach(s => {
        if (s.code) {
          const match = s.code.match(/^S(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });
    }
    const nextNumber = maxNumber + 1;
    return `S${nextNumber.toString().padStart(3, '0')}`;
  };

  const generatedCode = generateCode();

  useEffect(() => {
    if (open) {
      if (mode === "edit" && status) {
        setFormData({
          name_ar: status.name_ar || "",
          name_en: status.name_en || "",
          color: status.color || "#6b7280",
          order: status.order || 1,
          show_in_calendar: status.show_in_calendar ?? false,
        });
      } else {
        // Get max order for new status
        const maxOrder = existingStatuses.length > 0 
          ? Math.max(...existingStatuses.map(s => s.order || 0))
          : 0;
        setFormData({
          name_ar: "",
          name_en: "",
          color: "#6b7280",
          order: maxOrder + 1,
          show_in_calendar: false, // Default is false (closed)
        });
      }
      setErrors({});
      setCurrentLanguage(i18n.language === "ar" ? "ar" : "en");
    }
  }, [open, status, mode, i18n.language, existingStatuses]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_ar.trim()) {
      newErrors.name_ar = t("Arabic name is required");
    }

    if (!formData.name_en.trim()) {
      newErrors.name_en = t("English name is required");
    }

    if (!formData.color || !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = t("Please select a valid color");
    }

    if (!formData.order || formData.order < 1) {
      newErrors.order = t("Order must be greater than 0");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: t("Error"),
        description: t("Please fix the errors before saving"),
        variant: "destructive",
      });
      return;
    }

    const statusData: AppointmentStatus = {
      ...(mode === "edit" && status?._id ? { _id: status._id } : {}),
      code: generatedCode,
      name_ar: formData.name_ar.trim(),
      name_en: formData.name_en.trim(),
      color: formData.color,
      order: formData.order,
      show_in_calendar: formData.show_in_calendar,
      is_active: mode === "edit" ? status?.is_active ?? true : true,
      is_default: mode === "edit" ? status?.is_default ?? false : false,
      is_deleted: false,
    };

    onSave(statusData);
    onOpenChange(false);
  };

  const presetColors = [
    "#6b7280", // gray
    "#3b82f6", // blue
    "#10b981", // green
    "#ef4444", // red
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[600px] max-h-[90vh] overflow-y-auto",
          isRTL && "rtl"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className={cn("text-xl font-semibold", isRTL && "text-right")}>
            {mode === "edit"
              ? t("Edit Appointment Status")
              : t("Add Appointment Status")}
          </DialogTitle>
          <DialogDescription className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
            {mode === "edit"
              ? t("Update the appointment status details")
              : t("Create a new appointment status")}
          </DialogDescription>
        </DialogHeader>

        <div className={cn("space-y-6 py-4", isRTL && "space-y-6")}>
          {/* Auto-generated Status Code (Display Only) */}
          <div className="space-y-2">
            <Label 
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-muted-foreground",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <Hash className="h-4 w-4 flex-shrink-0" />
              {t("Status Code")}
              <span className="text-xs font-normal">({t("Auto-generated")})</span>
            </Label>
            <div className={cn(
              "flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed",
              isRTL ? "flex-row-reverse" : ""
            )}>
              <code className={cn(
                "text-sm font-mono font-semibold text-primary",
                "dir-ltr"
              )}>
                {generatedCode}
              </code>
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground flex-1">
                {t("This code is automatically generated")}
              </span>
            </div>
          </div>

          {/* Language Switcher - Dropdown Style */}
          <div className="space-y-2">
            <Label 
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <Languages className="h-4 w-4 text-primary flex-shrink-0" />
              {t("Language")}
            </Label>
            <div className={cn(
              "flex gap-3",
              isRTL ? "flex-row-reverse" : ""
            )}>
              <Select
                value={currentLanguage}
                onValueChange={(value: "ar" | "en") => setCurrentLanguage(value)}
              >
                <SelectTrigger className={cn(
                  "w-[120px]",
                  isRTL ? "flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "flex-row-reverse" : ""
                  )}>
                    <span className={cn(
                      "text-xs font-medium",
                      currentLanguage === "ar" ? "dir-rtl" : "dir-ltr"
                    )}>
                      {currentLanguage === "ar" ? t("Arabic") : t("English")}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : ""
                    )}>
                      <span dir="rtl">{t("Arabic")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : ""
                    )}>
                      <span dir="ltr">{t("English")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {/* Status Name Input - Based on selected language */}
              <div className="flex-1">
                <Input
                  id={`name_${currentLanguage}`}
                  value={currentLanguage === "ar" ? formData.name_ar : formData.name_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [currentLanguage === "ar" ? "name_ar" : "name_en"]: e.target.value,
                    })
                  }
                  placeholder={
                    currentLanguage === "ar"
                      ? t("Enter status name in Arabic")
                      : t("Enter status name in English")
                  }
                  className={cn(
                    "w-full",
                    currentLanguage === "ar"
                      ? errors.name_ar
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                      : errors.name_en
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  )}
                  dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                />
                {currentLanguage === "ar" && errors.name_ar && (
                  <p className={cn(
                    "text-sm text-destructive flex items-center gap-1 mt-1",
                    isRTL ? "flex-row-reverse text-right" : ""
                  )}>
                    <Info className="h-3 w-3 flex-shrink-0" />
                    {errors.name_ar}
                  </p>
                )}
                {currentLanguage === "en" && errors.name_en && (
                  <p className={cn(
                    "text-sm text-destructive flex items-center gap-1 mt-1",
                    isRTL ? "flex-row-reverse text-right" : ""
                  )}>
                    <Info className="h-3 w-3 flex-shrink-0" />
                    {errors.name_en}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Color and Order Row */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-4",
            isRTL ? "rtl" : ""
          )}>
            {/* Color Picker */}
            <div className="space-y-2">
              <Label className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isRTL ? "flex-row-reverse" : ""
              )}>
                <Palette className="h-4 w-4 text-primary flex-shrink-0" />
                {t("Status Color")}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <div className={cn(
                "flex items-center gap-2",
                isRTL ? "flex-row-reverse" : ""
              )}>
                <div className="relative">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-10 w-16 cursor-pointer border-2"
                    title={t("Click to choose color")}
                  />
                </div>
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#6b7280"
                  className={cn(
                    "flex-1 font-mono text-sm",
                    errors.color ? "border-destructive focus-visible:ring-destructive" : ""
                  )}
                  dir="ltr"
                />
              </div>
              {errors.color && (
                <p className={cn(
                  "text-sm text-destructive flex items-center gap-1",
                  isRTL ? "flex-row-reverse text-right" : ""
                )}>
                  <Info className="h-3 w-3 flex-shrink-0" />
                  {errors.color}
                </p>
              )}
              {/* Preset Colors */}
              <div className={cn(
                "flex gap-2 flex-wrap pt-2",
                isRTL ? "flex-row-reverse" : ""
              )}>
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                      formData.color === color
                        ? "border-foreground scale-110 shadow-md ring-2 ring-primary ring-offset-1"
                        : "border-muted-foreground/30 hover:border-foreground/50"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={t("Select color") + ": " + color}
                  />
                ))}
              </div>
            </div>

            {/* Order Dropdown */}
            <div className="space-y-2">
              <Label className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isRTL ? "flex-row-reverse" : ""
              )}>
                {t("Order")}
                <span className="text-destructive font-bold">*</span>
              </Label>
              <Select
                value={formData.order.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, order: parseInt(value) })
                }
              >
                <SelectTrigger className={cn(
                  "w-full",
                  errors.order ? "border-destructive focus-visible:ring-destructive" : "",
                  isRTL ? "flex-row-reverse" : ""
                )}>
                  <SelectValue placeholder={t("Select order")} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.order && (
                <p className={cn(
                  "text-sm text-destructive flex items-center gap-1",
                  isRTL ? "flex-row-reverse text-right" : ""
                )}>
                  <Info className="h-3 w-3 flex-shrink-0" />
                  {errors.order}
                </p>
              )}
              <p className={cn(
                "text-xs text-muted-foreground",
                isRTL ? "text-right" : ""
              )}>
                {t("Display order of the status")}
              </p>
            </div>
          </div>

          {/* Show in Calendar Toggle */}
          <div className={cn(
            "flex items-center justify-between p-4 bg-muted/50 rounded-lg border gap-4",
            isRTL ? "flex-row-reverse" : ""
          )}>
            <div className={cn(
              "flex items-center gap-3 flex-1 min-w-0",
              isRTL ? "flex-row-reverse" : ""
            )}>
              <Calendar className={cn(
                "h-5 w-5 flex-shrink-0 transition-opacity",
                formData.show_in_calendar ? "text-primary opacity-100" : "text-muted-foreground opacity-50"
              )} />
              <div className={cn(
                "flex flex-col flex-1 min-w-0",
                isRTL ? "items-end text-right" : "items-start"
              )}>
                <Label 
                  htmlFor="show-in-calendar-toggle"
                  className={cn(
                    "text-sm font-semibold cursor-pointer select-none",
                    isRTL ? "text-right" : "text-left"
                  )}
                  onClick={() => setFormData({ ...formData, show_in_calendar: !formData.show_in_calendar })}
                >
                  {t("Show in Calendar")}
                </Label>
                <span className={cn(
                  "text-xs text-muted-foreground mt-0.5 leading-relaxed",
                  isRTL ? "text-right" : "text-left"
                )}>
                  {t("Display this status in the calendar view")}
                </span>
              </div>
            </div>
            <Switch
              id="show-in-calendar-toggle"
              checked={formData.show_in_calendar}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_in_calendar: checked })
              }
              className="data-[state=checked]:bg-primary flex-shrink-0"
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>

          {/* Color Preview */}
          <div className={cn(
            "p-4 bg-gradient-to-br from-muted/80 to-muted rounded-lg border space-y-3",
            isRTL && "text-right"
          )}>
            <Label className={cn(
              "text-sm font-semibold flex items-center gap-2",
              isRTL ? "flex-row-reverse" : ""
            )}>
              <Palette className="h-4 w-4 text-primary" />
              {t("Preview")}
            </Label>
            <div className={cn(
              "flex items-center gap-3 p-3 bg-background/50 rounded-lg",
              isRTL ? "flex-row-reverse" : ""
            )}>
              <div
                className="w-10 h-10 rounded-full border-2 border-border shadow-sm flex-shrink-0"
                style={{ backgroundColor: formData.color }}
              />
              <div className={cn(
                "flex flex-col flex-1 min-w-0",
                isRTL ? "items-end text-right" : "items-start"
              )}>
                {formData.name_ar && formData.name_en ? (
                  <>
                    <span className="text-sm font-semibold flex items-center gap-2 w-full">
                      <span dir="rtl" className="flex-1 text-right">{formData.name_ar}</span>
                      <span className="text-muted-foreground">/</span>
                      <span dir="ltr" className="flex-1 text-left">{formData.name_en}</span>
                    </span>
                    <span className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                      {formData.color}
                    </span>
                  </>
                ) : formData.name_ar || formData.name_en ? (
                  <>
                    <span className={cn(
                      "text-sm font-medium",
                      formData.name_ar ? "text-right dir-rtl" : "text-left dir-ltr"
                    )}>
                      {formData.name_ar || formData.name_en}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {t("Complete both names for full preview")}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                      {formData.color}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground italic">
                      {t("(Preview will appear here)")}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                      {formData.color}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "flex gap-3 pt-4 border-t",
          isRTL ? "flex-row-reverse justify-start" : "justify-end"
        )}>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-w-[100px]"
          >
            {t("Cancel")}
          </Button>
          <Button 
            onClick={handleSave}
            className="min-w-[100px]"
          >
            {mode === "edit" ? t("Update") : t("Add")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditStatusModal;

