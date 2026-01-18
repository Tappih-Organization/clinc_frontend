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
    <div 
      className={cn("space-y-2", isRTL && "text-right", className)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Label 
        htmlFor={htmlFor} 
        className={cn(
          "block w-full",
          isRTL && "text-right"
        )}
        dir={isRTL ? "rtl" : "ltr"}
        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
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
      <div dir={isRTL ? "rtl" : "ltr"} className={cn(isRTL && "text-right")}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childType = child.type;
            const childClassName = typeof child.props.className === 'string' ? child.props.className : '';
            const childDisplayName = (childType as any)?.displayName;
            
            // Check if it's an Input component
            const isInput = 
              childType === 'input' ||
              childDisplayName === 'Input' ||
              (typeof childType === 'function' && (childType as any)?.name === 'Input');
            
            // Check if it's a Textarea component
            const isTextarea = 
              childType === 'textarea' ||
              childDisplayName === 'Textarea' ||
              (typeof childType === 'function' && (childType as any)?.name === 'Textarea');
            
            // Check if it's a Select component (Radix UI Select Root)
            const isSelectRoot = 
              childDisplayName === 'Select' ||
              (typeof childType === 'object' && childType !== null && 'Root' in (childType as Record<string, unknown>));
            
            // Check if it's a SelectTrigger component
            const isSelectTrigger = childDisplayName === 'SelectTrigger';
            
            // Check if it's a SelectContent component
            const isSelectContent = childDisplayName === 'SelectContent';
            
            // Apply RTL styles to input elements
            if (isInput || isTextarea) {
              const currentDir = child.props.dir || (isRTL ? 'rtl' : 'ltr');
              return React.cloneElement(child as React.ReactElement<any>, {
                dir: currentDir,
                className: cn(
                  child.props.className,
                  isRTL && "text-right"
                ),
                style: {
                  ...child.props.style,
                  textAlign: isRTL ? 'right' : (child.props.style?.textAlign || 'left'),
                  direction: isRTL ? 'rtl' : (child.props.style?.direction || 'ltr'),
                },
              });
            }
            
            // Apply RTL styles to Select components
            if (isSelectRoot || isSelectTrigger || isSelectContent) {
              return React.cloneElement(child as React.ReactElement<any>, {
                dir: isRTL ? 'rtl' : 'ltr',
                ...(isRTL && {
                  className: cn(
                    child.props.className,
                    "text-right"
                  ),
                }),
              });
            }
            
            // Recursively handle Select children (SelectTrigger, SelectContent, etc.)
            if (isSelectRoot && child.props.children) {
              return React.cloneElement(child as React.ReactElement<any>, {
                dir: isRTL ? 'rtl' : 'ltr',
                children: React.Children.map(child.props.children, (grandChild) => {
                  if (React.isValidElement(grandChild)) {
                    const grandChildDisplayName = (grandChild.type as any)?.displayName;
                    if (grandChildDisplayName === 'SelectTrigger' || grandChildDisplayName === 'SelectContent') {
                      return React.cloneElement(grandChild as React.ReactElement<any>, {
                        dir: isRTL ? 'rtl' : 'ltr',
                      });
                    }
                  }
                  return grandChild;
                }),
              });
            }
            
            // Apply RTL styles to other form elements that don't have explicit direction
            if (!child.props.dir && !childClassName.includes('text-right') && !childClassName.includes('text-left')) {
              // Only apply if it's likely a form element (has className with form-related classes)
              const isFormElement = childClassName.includes('input') || 
                                   childClassName.includes('select') || 
                                   childClassName.includes('textarea');
              
              // Only apply RTL styles to form elements
              if (isFormElement && isRTL) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  dir: 'rtl',
                  className: cn(
                    child.props.className,
                    "text-right"
                  ),
                  style: {
                    ...child.props.style,
                    textAlign: 'right',
                  },
                });
              }
            }
          }
          return child;
        })}
      </div>
      {error && (
        <p 
          className="text-sm text-red-500 block w-full"
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
