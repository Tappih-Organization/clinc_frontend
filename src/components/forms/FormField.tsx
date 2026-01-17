import React from "react";
import { Label } from "@/components/ui/label";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  description?: string;
}

/**
 * Reusable Form Field component with Label, Error message, and RTL support
 * Wraps form inputs with consistent styling and validation display
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  htmlFor,
  className,
  description,
}) => {
  const isRTL = useIsRTL();

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={htmlFor} 
        className={cn(isRTL && "text-right")}
        dir={isRTL ? "rtl" : "ltr"}
        style={isRTL ? { textAlign: 'right' } : undefined}
      >
        {label}
        {required && " *"}
      </Label>
      {description && (
        <p 
          className="text-sm text-muted-foreground block w-full"
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
        >
          {description}
        </p>
      )}
      <div dir={isRTL ? "rtl" : "ltr"}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childType = child.type;
            const isInput = 
              childType === 'input' ||
              (typeof childType === 'object' && (childType as any)?.displayName === 'Input') ||
              (typeof childType === 'function' && (childType as any)?.name === 'Input');
            
            // If child is an input element and doesn't have dir prop, add it
            if (isInput && !child.props.dir) {
              return React.cloneElement(child as React.ReactElement<any>, {
                dir: isRTL ? 'rtl' : (child.props.dir || 'ltr'),
                style: {
                  ...child.props.style,
                  textAlign: isRTL ? 'right' : (child.props.style?.textAlign || 'left'),
                },
              });
            }
          }
          return child;
        })}
      </div>
      {error && (
        <p 
          className="text-sm text-red-500"
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
