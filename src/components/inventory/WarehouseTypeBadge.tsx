import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WarehouseTypeBadgeProps {
  type: "main" | "sub";
  className?: string;
}

export const WarehouseTypeBadge: React.FC<WarehouseTypeBadgeProps> = ({
  type,
  className,
}) => {
  return (
    <Badge
      variant={type === "main" ? "default" : "secondary"}
      className={cn(
        type === "main"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        className
      )}
    >
      {type === "main" ? "Main" : "Sub"}
    </Badge>
  );
};
