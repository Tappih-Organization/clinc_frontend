import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Warehouse, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { useIsRTL } from "@/hooks/useIsRTL";
import { FormField } from "@/components/forms";

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  type: "MAIN" | "SUB";
  status: "ACTIVE" | "INACTIVE";
}

interface BranchWarehouseMapping {
  branchId: string;
  warehouseId: string;
}

interface BranchWarehouseSelectorProps {
  branches: Branch[];
  selectedBranches: string[];
  branchWarehouses: BranchWarehouseMapping[];
  onBranchesChange: (branchIds: string[]) => void;
  onWarehouseChange: (branchId: string, warehouseId: string) => void;
  onRemoveBranch: (branchId: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
  onWarehousesLoaded?: (branchWarehouses: BranchWarehouseMapping[]) => void; // Callback when warehouses are loaded
}

export const BranchWarehouseSelector: React.FC<BranchWarehouseSelectorProps> = ({
  branches,
  selectedBranches,
  branchWarehouses,
  onBranchesChange,
  onWarehouseChange,
  onRemoveBranch,
  required = false,
  error,
  className,
  onWarehousesLoaded,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [warehousesByBranch, setWarehousesByBranch] = useState<Record<string, Warehouse[]>>({});
  const [loadingWarehouses, setLoadingWarehouses] = useState<Record<string, boolean>>({});
  const [mainWarehouses, setMainWarehouses] = useState<Record<string, string>>({});
  const onWarehouseChangeRef = useRef(onWarehouseChange);
  const branchWarehousesRef = useRef(branchWarehouses);
  
  // Update refs when props change
  useEffect(() => {
    onWarehouseChangeRef.current = onWarehouseChange;
    branchWarehousesRef.current = branchWarehouses;
  }, [onWarehouseChange, branchWarehouses]);

  // Load warehouses for each selected branch
  useEffect(() => {
    const loadWarehousesForBranches = async () => {
      for (const branchId of selectedBranches) {
        if (!warehousesByBranch[branchId] && !loadingWarehouses[branchId]) {
          setLoadingWarehouses((prev) => ({ ...prev, [branchId]: true }));
          
          try {
            const response = await apiService.getWarehouses({
              branchId,
              status: "ACTIVE",
              limit: 100,
            });

            const warehouses = response.data || [];
            setWarehousesByBranch((prev) => ({ ...prev, [branchId]: warehouses }));

            // Find MAIN warehouse and set it as default
            const mainWarehouse = warehouses.find((w: Warehouse) => w.type === "MAIN");
            if (mainWarehouse) {
              setMainWarehouses((prev) => ({ ...prev, [branchId]: mainWarehouse._id }));
              
              // Auto-select MAIN warehouse if no warehouse is selected for this branch
              // Use ref to get latest branchWarehouses value
              const existingMapping = branchWarehousesRef.current.find((bw) => bw.branchId === branchId);
              if (!existingMapping || !existingMapping.warehouseId) {
                // Call onWarehouseChange using ref to ensure we have latest function
                // Use setTimeout to ensure state update happens after warehouses are loaded
                setTimeout(() => {
                  onWarehouseChangeRef.current(branchId, mainWarehouse._id);
                }, 100);
              }
            }
          } catch (error) {
            console.error(`Error loading warehouses for branch ${branchId}:`, error);
          } finally {
            setLoadingWarehouses((prev) => ({ ...prev, [branchId]: false }));
          }
        }
      }
    };

    if (selectedBranches.length > 0) {
      loadWarehousesForBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranches]); // Only depend on selectedBranches to avoid infinite loops

  // Clean up warehouses when branch is removed
  useEffect(() => {
    const activeBranchIds = new Set(selectedBranches);
    setWarehousesByBranch((prev) => {
      const filtered: Record<string, Warehouse[]> = {};
      Object.keys(prev).forEach((branchId) => {
        if (activeBranchIds.has(branchId)) {
          filtered[branchId] = prev[branchId];
        }
      });
      return filtered;
    });
  }, [selectedBranches]);

  const getSelectedWarehouse = (branchId: string): string => {
    const mapping = branchWarehouses.find((bw) => bw.branchId === branchId);
    return mapping?.warehouseId || mainWarehouses[branchId] || "";
  };

  const getBranchName = (branchId: string): string => {
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || branchId;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {selectedBranches.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
          {t("Please select branches first")}
        </div>
      ) : (
        selectedBranches.map((branchId) => {
          const warehouses = warehousesByBranch[branchId] || [];
          const selectedWarehouseId = getSelectedWarehouse(branchId);
          const isLoading = loadingWarehouses[branchId];

          return (
            <div
              key={branchId}
              className={cn(
                "p-4 border rounded-lg space-y-3",
                error && "border-red-500",
                isRTL && "text-right"
              )}
            >
              <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getBranchName(branchId)}</span>
                  {branches.find((b) => b.id === branchId)?.code && (
                    <Badge variant="outline" className="text-xs">
                      {branches.find((b) => b.id === branchId)?.code}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveBranch(branchId)}
                  className={cn("h-8 w-8 p-0", isRTL && "flex-row-reverse")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <FormField
                label={t("Select Warehouse")}
                required={required}
                htmlFor={`warehouse-${branchId}`}
              >
                <Select
                  value={selectedWarehouseId}
                  onValueChange={(value) => onWarehouseChange(branchId, value)}
                  disabled={isLoading || warehouses.length === 0}
                >
                  <SelectTrigger
                    id={`warehouse-${branchId}`}
                    className={error && !selectedWarehouseId ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        isLoading
                          ? t("Loading warehouses...")
                          : warehouses.length === 0
                          ? t("No warehouses available")
                          : t("Select warehouse")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse._id} value={warehouse._id}>
                        <div className="flex items-center gap-2">
                          <span>{warehouse.name}</span>
                          <Badge
                            variant={warehouse.type === "MAIN" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {warehouse.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {warehouses.length > 0 && warehouses.find((w) => w._id === selectedWarehouseId)?.type === "MAIN" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Default warehouse (Main)")}
                  </p>
                )}
              </FormField>
            </div>
          );
        })
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {required && selectedBranches.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("At least one branch must be selected")}
        </p>
      )}
    </div>
  );
};
