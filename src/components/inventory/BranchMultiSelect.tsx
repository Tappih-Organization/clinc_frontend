import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface BranchMultiSelectProps {
  branches: Branch[];
  selectedBranchIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export const BranchMultiSelect: React.FC<BranchMultiSelectProps> = ({
  branches,
  selectedBranchIds,
  onSelectionChange,
  placeholder = "Select branches...",
  disabled = false,
  required = false,
  error,
  className,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selectedBranches = branches.filter((b) =>
    selectedBranchIds.includes(b.id)
  );

  const handleToggle = (branchId: string) => {
    if (selectedBranchIds.includes(branchId)) {
      onSelectionChange(selectedBranchIds.filter((id) => id !== branchId));
    } else {
      onSelectionChange([...selectedBranchIds, branchId]);
    }
  };

  const handleRemove = (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedBranchIds.filter((id) => id !== branchId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-[42px] h-auto",
              error && "border-red-500",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedBranches.length === 0 ? (
                <span className="text-muted-foreground">
                  {placeholder}
                  {required && " *"}
                </span>
              ) : (
                selectedBranches.map((branch) => (
                  <Badge
                    key={branch.id}
                    variant="secondary"
                    className="me-1 mb-1 flex items-center gap-1"
                  >
                    <span>{branch.name}</span>
                    <span
                      className="ms-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-muted-foreground/20 p-0.5"
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${branch.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRemove(branch.id, e as any);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(branch.id, e);
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={t("Search branches...")} />
            <CommandList>
              <CommandEmpty>{t("No branches found.")}</CommandEmpty>
              <CommandGroup>
                {branches.map((branch) => {
                  const isSelected = selectedBranchIds.includes(branch.id);
                  return (
                    <CommandItem
                      key={branch.id}
                      value={branch.name}
                      onSelect={() => handleToggle(branch.id)}
                    >
                      <Check
                        className={cn(
                          "me-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{branch.name}</div>
                        {branch.code && (
                          <div className="text-xs text-muted-foreground">
                            {branch.code}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {required && selectedBranchIds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("At least one branch must be selected")}
        </p>
      )}
    </div>
  );
};
