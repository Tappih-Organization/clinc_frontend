import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Package,
  Factory,
  Calendar,
  DollarSign,
  AlertTriangle,
  Save,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCurrencyFormat } from "@/hooks/useCurrencyFormat";
import { cn } from "@/lib/utils";
import { BranchMultiSelect } from "@/components/inventory/BranchMultiSelect";
import { BranchWarehouseSelector } from "@/components/inventory/BranchWarehouseSelector";
import { useIsRTL } from "@/hooks/useIsRTL";
import { useClinic } from "@/contexts/ClinicContext";
import { apiService } from "@/services/api";
import {
  FormDialog,
  FormCardSection,
  FormField,
} from "@/components/forms";

interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, any>;
  fields: Array<{
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: any[];
  }>;
  onSave: (updatedData: Record<string, any>) => Promise<void>;
}

const predefinedCategories = [
  "medications",
  "medical-devices",
  "consumables",
  "equipment",
  "laboratory",
  "office-supplies",
  "other",
];

const predefinedSuppliers = [
  "Supplier A",
  "Supplier B",
  "Supplier C",
  "Local Supplier",
  "International Supplier",
];

const EditItemModal: React.FC<EditItemModalProps> = ({
  open,
  onOpenChange,
  title,
  data,
  fields,
  onSave,
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const isRTL = useIsRTL();
  const { currentClinic } = useClinic();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchWarehouses, setBranchWarehouses] = useState<Array<{ branchId: string; warehouseId: string }>>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    manufacturer: "",
    batchNumber: "",
    expiryDate: "",
    quantity: "",
    unitPrice: "",
    supplier: "",
    description: "",
    lowStockAlert: "",
  });

  // Load branches from backend API and filter based on clinic type
  useEffect(() => {
    const loadBranches = async () => {
      if (!currentClinic) {
        console.warn("No clinic selected, skipping branches load");
        return;
      }

      try {
        const branchesResponse = await apiService.getBranches();
        
        // Convert branches from backend format
        const responseData = branchesResponse.data as any;
        const branchesArray = Array.isArray(responseData) 
          ? responseData 
          : responseData?.clinics || responseData?.data || [];
        
        // Extract clinic data and remove duplicates based on clinic ID
        const uniqueBranchesMap = new Map<string, Branch>();
        
        // Get current clinic info
        const currentClinicId = currentClinic._id?.toString();
        const isMainClinic = currentClinic.is_main_clinic === true;
        
        branchesArray.forEach((item: any) => {
          // Handle different response structures
          const clinic = item.clinic_id || item;
          const clinicId = clinic?._id?.toString() || clinic?._id || clinic?.id;
          const clinicIsMain = clinic?.is_main_clinic === true;
          const clinicParentId = clinic?.parent_clinic_id?.toString() || clinic?.parent_clinic_id;
          
          if (clinicId && clinic?.name) {
            // Filter branches based on clinic type:
            // 1. If current clinic is MAIN → show main clinic itself + all sub clinics
            // 2. If current clinic is SUB → show only current clinic
            let shouldInclude = false;
            
            if (isMainClinic) {
              // Main clinic: show itself + all sub clinics
              if (clinicId === currentClinicId || clinicParentId === currentClinicId) {
                shouldInclude = true;
              }
            } else {
              // Sub clinic: show only itself
              if (clinicId === currentClinicId) {
                shouldInclude = true;
              }
            }
            
            if (shouldInclude && !uniqueBranchesMap.has(clinicId)) {
              uniqueBranchesMap.set(clinicId, {
                id: clinicId,
                name: clinic.name,
                code: clinic.code || clinic.clinic_code,
              });
            }
          }
        });
        
        const filteredBranches = Array.from(uniqueBranchesMap.values());
        setBranches(filteredBranches);
      } catch (error) {
        console.error("Error loading branches:", error);
        toast({
          title: t("Error"),
          description: t("Failed to load branches. Please try again."),
          variant: "destructive",
        });
      }
    };

    if (open && currentClinic) {
      loadBranches();
    }
  }, [open, currentClinic, t]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && data) {
      // Format date for input
      const expiryDate = data.expiryDate 
        ? (data.expiryDate instanceof Date 
            ? data.expiryDate.toISOString().split("T")[0]
            : new Date(data.expiryDate).toISOString().split("T")[0])
        : "";

      setFormData({
        name: data.name || "",
        category: data.category || "",
        manufacturer: data.manufacturer || "",
        batchNumber: data.batchNumber || "",
        expiryDate: expiryDate,
        quantity: data.quantity?.toString() || "",
        unitPrice: data.unitPrice?.toString() || "",
        supplier: data.supplier || "",
        description: data.description || "",
        lowStockAlert: data.lowStockAlert?.toString() || "",
      });

      // Initialize branches
      const assignedBranches = data.assignedBranches || data.branches?.map((b: any) => b.id || b._id) || [];
      setSelectedBranches(assignedBranches);

      // Initialize branchWarehouses
      if (data.branchWarehouses && Array.isArray(data.branchWarehouses)) {
        setBranchWarehouses(data.branchWarehouses.map((bw: any) => ({
          branchId: bw.branchId || bw.branch_id?.toString() || "",
          warehouseId: bw.warehouseId || bw.warehouse_id?.toString() || "",
        })));
      } else {
        setBranchWarehouses([]);
      }
    }
  }, [open, data]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("Item name is required");
    }

    if (!formData.category) {
      newErrors.category = t("Category is required");
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = t("Manufacturer is required");
    }

    if (selectedBranches.length === 0) {
      newErrors.branches = t("At least one branch must be selected");
    }

    // Validate that each selected branch has a warehouse selected
    if (selectedBranches.length > 0) {
      for (const branchId of selectedBranches) {
        const warehouseMapping = branchWarehouses.find((bw) => bw.branchId === branchId);
        if (!warehouseMapping || !warehouseMapping.warehouseId || warehouseMapping.warehouseId.trim() === '') {
          newErrors.branches = t("Please select a warehouse for each branch");
          break;
        }
      }
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = t("Quantity is required");
    } else {
      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = t("Quantity must be greater than 0");
      }
    }

    if (!formData.unitPrice.trim()) {
      newErrors.unitPrice = t("Unit price is required");
    } else {
      const unitPrice = parseFloat(formData.unitPrice);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        newErrors.unitPrice = t("Unit price must be greater than 0");
      }
    }

    if (formData.lowStockAlert) {
      const lowStockAlert = parseInt(formData.lowStockAlert);
      if (!isNaN(lowStockAlert) && lowStockAlert < 0) {
        newErrors.lowStockAlert = t("Low stock alert cannot be negative");
      }
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        newErrors.expiryDate = t("Expiry date must be in the future");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Small delay to ensure branchWarehouses state is updated after async warehouse loading
    await new Promise(resolve => setTimeout(resolve, 150));

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare updated data
      const updatedData = {
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate || undefined,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        supplier: formData.supplier,
        description: formData.description,
        lowStockAlert: formData.lowStockAlert,
        assignedBranches: selectedBranches,
        branchWarehouses: branchWarehouses,
      };

      await onSave(updatedData);
      toast({
        title: t("Success"),
        description: t("Item updated successfully"),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to update item. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBatchNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const manufacturerCode =
      formData.manufacturer.substring(0, 2).toUpperCase() || "XX";
    return `${manufacturerCode}${year}${random}`;
  };

  const handleGenerateBatch = () => {
    if (formData.manufacturer) {
      const batchNumber = generateBatchNumber();
      handleChange("batchNumber", batchNumber);
    } else {
      toast({
        title: t("Info"),
        description: t("Please select a manufacturer first to generate batch number"),
        variant: "default",
      });
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t("Update item information and settings")}
      icon={Edit}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormCardSection
          title={t("Basic Information")}
          icon={Package}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("Item Name")}
              required
              error={errors.name}
              htmlFor="name"
            >
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t("e.g., Paracetamol 500mg")}
                required
                className={errors.name ? "border-red-500" : ""}
                dir="auto"
              />
            </FormField>
            <FormField
              label={t("Category")}
              required
              error={errors.category}
              htmlFor="category"
            >
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder={t("Select category")} />
                </SelectTrigger>
                <SelectContent dir="auto">
                  {predefinedCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField
            label={t("Description")}
            htmlFor="description"
          >
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={t("Brief description of the item...")}
              rows={2}
              dir="auto"
            />
          </FormField>
        </FormCardSection>

        {/* Branches Assignment */}
        <FormCardSection
          title={t("Branches / Clinics Assignment")}
          icon={Package}
        >
          <FormField
            label={t("Select Branches")}
            required
            error={errors.branches}
            description={t("Select the branches/clinics where this item will be available")}
          >
            <BranchMultiSelect
              branches={branches}
              selectedBranchIds={selectedBranches}
              onSelectionChange={(ids) => {
                setSelectedBranches(ids);
                // Remove warehouse mappings for unselected branches
                setBranchWarehouses((prev) => 
                  prev.filter((bw) => ids.includes(bw.branchId))
                );
                if (errors.branches) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.branches;
                    return newErrors;
                  });
                }
              }}
              placeholder={t("Select branches...")}
              required
              error={errors.branches}
            />
          </FormField>

          {selectedBranches.length > 0 && (
            <div className="mt-4">
              <BranchWarehouseSelector
                branches={branches}
                selectedBranches={selectedBranches}
                branchWarehouses={branchWarehouses}
                onBranchesChange={setSelectedBranches}
                onWarehouseChange={(branchId, warehouseId) => {
                  setBranchWarehouses((prev) => {
                    const existing = prev.find((bw) => bw.branchId === branchId);
                    if (existing) {
                      return prev.map((bw) =>
                        bw.branchId === branchId ? { branchId, warehouseId } : bw
                      );
                    }
                    return [...prev, { branchId, warehouseId }];
                  });
                  if (errors.branches) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.branches;
                      return newErrors;
                    });
                  }
                }}
                onRemoveBranch={(branchId) => {
                  setSelectedBranches((prev) => prev.filter((id) => id !== branchId));
                  setBranchWarehouses((prev) => prev.filter((bw) => bw.branchId !== branchId));
                }}
                required
                error={errors.branches}
              />
            </div>
          )}
        </FormCardSection>

        {/* Manufacturer & Supplier Information */}
        <FormCardSection
          title={t("Manufacturer & Supplier")}
          icon={Factory}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("Manufacturer")}
              required
              error={errors.manufacturer}
              htmlFor="manufacturer"
            >
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  handleChange("manufacturer", e.target.value)
                }
                placeholder={t("e.g., PharmaCorp")}
                required
                className={errors.manufacturer ? "border-red-500" : ""}
                dir="auto"
              />
            </FormField>
            <FormField
              label={t("Supplier")}
              htmlFor="supplier"
            >
              <Select
                value={formData.supplier}
                onValueChange={(value) => handleChange("supplier", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select supplier")} />
                </SelectTrigger>
                <SelectContent dir="auto">
                  {predefinedSuppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField
            label={t("Batch Number")}
            htmlFor="batchNumber"
          >
            <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) =>
                  handleChange("batchNumber", e.target.value)
                }
                placeholder={t("e.g., PC2024001")}
                className="flex-1"
                dir="auto"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateBatch}
                className="whitespace-nowrap"
              >
                {t("Generate")}
              </Button>
            </div>
          </FormField>
        </FormCardSection>

        {/* Stock & Pricing Information */}
        <FormCardSection
          title={t("Stock & Pricing")}
          icon={DollarSign}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label={t("Quantity")}
              required
              error={errors.quantity}
              htmlFor="quantity"
            >
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="100"
                required
                className={errors.quantity ? "border-red-500" : ""}
                dir="ltr"
              />
            </FormField>
            <FormField
              label={`${t("Unit Price")} ($) *`}
              required
              error={errors.unitPrice}
              htmlFor="unitPrice"
            >
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => handleChange("unitPrice", e.target.value)}
                placeholder="0.25"
                required
                className={errors.unitPrice ? "border-red-500" : ""}
                dir="ltr"
              />
            </FormField>
            <FormField
              label={t("Low Stock Alert")}
              error={errors.lowStockAlert}
              htmlFor="lowStockAlert"
            >
              <Input
                id="lowStockAlert"
                type="number"
                min="0"
                value={formData.lowStockAlert}
                onChange={(e) =>
                  handleChange("lowStockAlert", e.target.value)
                }
                placeholder="20"
                className={errors.lowStockAlert ? "border-red-500" : ""}
                dir="ltr"
              />
            </FormField>
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className={cn("p-4 bg-blue-50 rounded-lg", isRTL && "text-right")}>
              <div className={cn("flex items-center text-blue-700", isRTL && "flex-row-reverse")}>
                <DollarSign className={cn("h-4 w-4", isRTL ? "ms-2" : "me-2")} />
                <span className="font-medium">
                  {t("Total Value")}: {formatCurrency(
                    parseInt(formData.quantity || "0") *
                    parseFloat(formData.unitPrice || "0")
                  )}
                </span>
              </div>
            </div>
          )}
        </FormCardSection>

        {/* Expiry Information */}
        <FormCardSection
          title={t("Expiry Information")}
          icon={Calendar}
        >
          <FormField
            label={t("Expiry Date")}
            error={errors.expiryDate}
            htmlFor="expiryDate"
          >
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={errors.expiryDate ? "border-red-500" : ""}
              dir="ltr"
            />
          </FormField>

          {formData.expiryDate && (
            <div className={cn("p-4 bg-orange-50 rounded-lg", isRTL && "text-right")}>
              <div className={cn("flex items-center text-orange-700", isRTL && "flex-row-reverse")}>
                <AlertTriangle className={cn("h-4 w-4", isRTL ? "ms-2" : "me-2")} />
                <span className="text-sm">
                  {t("Expires on")}{" "}
                  {new Date(formData.expiryDate).toLocaleDateString(
                    isRTL ? "ar-SA" : "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </span>
              </div>
            </div>
          )}
        </FormCardSection>

        {/* Form Actions */}
        <div className={cn("flex justify-end gap-3 pt-4", isRTL && "flex-row-reverse")}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className={cn("h-4 w-4", isRTL ? "ms-2" : "me-2")} />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className={cn("w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin", isRTL ? "ms-2" : "me-2")} />
                {t("Saving...")}
              </>
            ) : (
              <>
                <Save className={cn("h-4 w-4", isRTL ? "ms-2" : "me-2")} />
                {t("Save Changes")}
              </>
            )}
          </Button>
        </div>
      </form>
    </FormDialog>
  );
};

export default EditItemModal;
