import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full",
};

/**
 * Reusable Form Dialog component with RTL support
 * Provides consistent dialog structure for forms across the application
 */
export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  maxWidth = "3xl",
  className,
}) => {
  const isRTL = useIsRTL();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          `${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`,
          className
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader 
          dir={isRTL ? "rtl" : "ltr"}
          className={cn(isRTL && "text-right")}
        >
          <DialogTitle
            className={cn("flex items-center text-xl", isRTL && "flex-row-reverse")}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            {Icon && (
              <Icon
                className={cn("h-5 w-5 text-blue-600", isRTL ? "ms-2" : "me-2")}
              />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription 
              className={cn("block w-full", isRTL && "text-right")}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
