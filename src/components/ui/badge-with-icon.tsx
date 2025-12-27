import * as React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

/**
 * BadgeWithIcon component that automatically handles icon positioning
 * based on RTL/LTR direction. In RTL (Arabic), icon appears after text.
 * In LTR, icon appears before text.
 */
export interface BadgeWithIconProps extends Omit<BadgeProps, "children"> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  iconClassName?: string;
}

export function BadgeWithIcon({ 
  icon, 
  children, 
  iconClassName,
  className,
  ...badgeProps 
}: BadgeWithIconProps) {
  const isRTL = useIsRTL();

  if (!icon) {
    return <Badge className={className} {...badgeProps}>{children}</Badge>;
  }

  return (
    <Badge 
      className={cn("inline-flex items-center gap-1.5", className)} 
      {...badgeProps}
    >
      {isRTL ? (
        <>
          <span>{children}</span>
          <span className={iconClassName}>{icon}</span>
        </>
      ) : (
        <>
          <span className={iconClassName}>{icon}</span>
          <span>{children}</span>
        </>
      )}
    </Badge>
  );
}

