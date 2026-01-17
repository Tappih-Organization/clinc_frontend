import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Power, LucideIcon } from "lucide-react";

interface StatusToggleFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  activeDescription?: string;
  inactiveDescription?: string;
  icon?: LucideIcon;
  id?: string;
  className?: string;
}

/**
 * Reusable Status Toggle Field component with Switch, Icon, and RTL support
 * Matches the design pattern from WarehouseForm and AddLeadModal
 */
export const StatusToggleField: React.FC<StatusToggleFieldProps> = ({
  label,
  checked,
  onCheckedChange,
  activeDescription,
  inactiveDescription,
  icon: Icon = Power,
  id = "status",
  className,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const defaultActiveDescription = t("Item is active and operational");
  const defaultInactiveDescription = t("Item is inactive");

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg bg-muted/50 transition-colors",
        isRTL ? "flex-row-reverse gap-4" : "gap-4",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center flex-1",
          isRTL ? "flex-row-reverse gap-3" : "gap-3"
        )}
      >
        <Icon
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
          <Label
            htmlFor={id}
            className={cn(
              "text-sm font-medium cursor-pointer mb-1",
              isRTL && "text-left"
            )}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : undefined}
          >
            {label}
          </Label>
          <span
            className="text-xs text-muted-foreground leading-relaxed"
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            {checked
              ? activeDescription || defaultActiveDescription
              : inactiveDescription || defaultInactiveDescription}
          </span>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "flex-shrink-0",
          isRTL && "[&[data-state=checked]>*]:translate-x-[-1.25rem]"
        )}
      />
    </div>
  );
};
