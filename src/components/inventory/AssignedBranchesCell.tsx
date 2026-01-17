import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Building2 } from "lucide-react";

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface AssignedBranchesCellProps {
  branches: Branch[];
  maxVisible?: number;
}

export const AssignedBranchesCell: React.FC<AssignedBranchesCellProps> = ({
  branches,
  maxVisible = 2,
}) => {
  const { t } = useTranslation();
  
  if (branches.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const visibleBranches = branches.slice(0, maxVisible);
  const remainingCount = branches.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleBranches.map((branch) => (
        <Badge
          key={branch.id}
          variant="outline"
          className="text-xs"
        >
          {branch.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className="text-xs cursor-pointer hover:bg-accent"
            >
              +{remainingCount} {t("more")}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start" dir="auto">
            <div className="space-y-2">
              <div className="font-medium text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("All Assigned Branches")} ({branches.length})
              </div>
              <div className="space-y-1">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="text-sm py-1 px-2 rounded hover:bg-accent"
                  >
                    {branch.name}
                    {branch.code && (
                      <span className="text-muted-foreground ms-2">
                        ({branch.code})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
