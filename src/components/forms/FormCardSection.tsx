import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormCardSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable Card Section component for forms with RTL support
 * Used to group related form fields with a title and optional icon
 */
export const FormCardSection: React.FC<FormCardSectionProps> = ({
  title,
  icon: Icon,
  children,
  className,
}) => {
  const isRTL = useIsRTL();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle
          className={cn(
            "text-lg flex items-center",
            isRTL && "flex-row-reverse"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
        >
          {Icon && (
            <Icon
              className={cn("h-4 w-4", isRTL ? "ms-2" : "me-2")}
            />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};
