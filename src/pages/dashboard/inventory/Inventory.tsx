import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Medicine } from "@/types";
import AddItemModal from "@/components/modals/AddItemModal";
import ViewDetailsModal from "@/components/modals/ViewDetailsModal";
import EditItemModal from "@/components/modals/EditItemModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import AdvancedFiltersModal from "@/components/modals/AdvancedFiltersModal";
import UpdateStockModal from "@/components/modals/UpdateStockModal";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useClinic } from "@/contexts/ClinicContext";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { apiService, type InventoryItem } from "@/services/api";
import Loading from "@/components/ui/Loading";
import { AssignedBranchesCell } from "@/components/inventory/AssignedBranchesCell";
import { BranchMultiSelect } from "@/components/inventory/BranchMultiSelect";
import { cn } from "@/lib/utils";
import { useIsRTL } from "@/hooks/useIsRTL";

interface Branch {
  id: string;
  name: string;
  code?: string;
}

const Inventory = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>(
    {},
  );
  const { formatAmount } = useCurrency();
  const { currentClinic, loading: clinicLoading, error: clinicError } = useClinic();

  // API state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    expiredItems: number;
    totalValue: number;
    categoryStats: Array<{
      _id: string;
      count: number;
      totalValue: number;
    }>;
  } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Modal states
  const [viewDetailsModal, setViewDetailsModal] = useState<{
    open: boolean;
    item: Medicine | null;
  }>({ open: false, item: null });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    item: Medicine | null;
  }>({ open: false, item: null });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    item: Medicine | null;
  }>({ open: false, item: null });

  const [stockModal, setStockModal] = useState<{
    open: boolean;
    item: Medicine | null;
    operation: "add" | "subtract";
  }>({ open: false, item: null, operation: "add" });

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
              shouldInclude = 
                clinicId === currentClinicId || 
                (!clinicIsMain && clinicParentId === currentClinicId);
            } else {
              shouldInclude = clinicId === currentClinicId;
            }
            
            if (shouldInclude && !uniqueBranchesMap.has(clinicId)) {
              uniqueBranchesMap.set(clinicId, {
                id: clinicId,
                name: clinic.name,
                code: clinic.code,
              });
            }
          }
        });
        
        // Convert to array
        const branchesData = Array.from(uniqueBranchesMap.values());
        setBranches(branchesData);
      } catch (error) {
        console.error("Error loading branches:", error);
      }
    };
    
    loadBranches();
  }, [currentClinic]);

  // Transform backend inventory data to frontend Medicine interface
  const transformInventoryItem = (item: any): Medicine => {
    // Extract assignedBranches from backend response (populated)
    const assignedBranches = (item.assignedBranches || []).map((branch: any) => ({
      id: branch._id?.toString() || branch._id || branch.id,
      name: branch.name,
      code: branch.code,
    }));
    
    // Extract branchWarehouses mapping
    const branchWarehousesMapping = (item.branchWarehouses || []).map((bw: any) => ({
      branchId: bw.branchId?._id?.toString() || bw.branchId?.toString() || bw.branchId,
      warehouseId: bw.warehouseId?._id?.toString() || bw.warehouseId?.toString() || bw.warehouseId,
      warehouseName: bw.warehouseId?.name || '',
      warehouseType: bw.warehouseId?.type || '',
      isShared: bw.warehouseId?.isShared || false,
    }));
    
    // Calculate quantity for current branch
    // For shared warehouses: use current_stock
    // For non-shared warehouses: use stock from stockByBranchWarehouse for current branch
    let displayQuantity = item.current_stock || 0;
    
    if (currentClinic && item.stockByBranchWarehouse && item.stockByBranchWarehouse.length > 0) {
      const currentClinicId = currentClinic._id?.toString();
      
      // Find stock entry for current branch
      // First, find the warehouse assigned to current branch
      const branchWarehouse = branchWarehousesMapping.find(
        (bw: any) => bw.branchId === currentClinicId
      );
      
      if (branchWarehouse) {
        const stockEntry = item.stockByBranchWarehouse.find(
          (entry: any) => 
            entry.branchId?.toString() === currentClinicId &&
            entry.warehouseId?.toString() === branchWarehouse.warehouseId
        );
        
        if (stockEntry) {
          // Non-shared warehouse: use stock from stockByBranchWarehouse
          displayQuantity = stockEntry.stock || 0;
        } else if (!branchWarehouse.isShared) {
          // Non-shared warehouse but no entry found: use current_stock as fallback
          displayQuantity = item.current_stock || 0;
        }
        // If shared warehouse, use current_stock (already set above)
      }
    }
    
    return {
      id: item._id,
      name: item.name,
      category: item.category,
      manufacturer: item.manufacturer || 'Unknown',
      batchNumber: item.sku, // Use SKU as batch number
      expiryDate: item.expiry_date ? new Date(item.expiry_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      quantity: displayQuantity, // Use calculated quantity for current branch
      unitPrice: item.unit_price || 0,
      supplier: item.supplier || '',
      description: item.description || '',
      lowStockAlert: item.minimum_stock,
      branches: assignedBranches,
      branchWarehouses: branchWarehousesMapping, // Add branch-warehouse mappings
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    };
  };

  // Load inventory from API
  const fetchInventory = async (showRefreshIndicator = false) => {
    if (!currentClinic) {
      console.warn("No clinic selected, skipping inventory fetch");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const filters = {
        search: searchTerm || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        branchId: selectedBranch !== "all" ? selectedBranch : undefined,
        page: pagination.page,
        limit: pagination.limit,
        ...advancedFilters,
      };

      const [inventoryResponse, statsResponse] = await Promise.all([
        apiService.getInventory(filters),
        apiService.getInventoryStats()
      ]);

      // Transform backend data to frontend format
      // Backend returns inventoryItems array
      const items = inventoryResponse.data.items || inventoryResponse.data.inventoryItems || [];
      let transformedItems = items.map(transformInventoryItem);
      
      // Log transformed items for debugging
      console.log('📦 Transformed items:', transformedItems.map(item => ({
        id: item.id,
        name: item.name,
        branches: item.branches,
        branchWarehouses: item.branchWarehouses
      })));
      
      // Client-side branch filtering (backup filter - backend should handle this)
      if (selectedBranch !== "all") {
        transformedItems = transformedItems.filter((item) => {
          const hasBranch = item.branches?.some((branch) => branch.id === selectedBranch);
          console.log(`🔍 Filtering item ${item.name} for branch ${selectedBranch}:`, hasBranch, item.branches);
          return hasBranch;
        });
      }
      
      setMedicines(transformedItems);
      setPagination(inventoryResponse.data.pagination);
      setStats(statsResponse);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      const errorMessage = error instanceof Error && error.message.includes('401') 
        ? t("Access denied. Please check your clinic permissions.") 
        : error instanceof Error && error.message.includes('403')
        ? t("Insufficient permissions to view inventory for this clinic.")
        : t("Failed to load inventory. Please try again.");
      
      toast({
        title: t("Error"),
        description: errorMessage,
        variant: "destructive",
      });
      setMedicines([]);
      setStats(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchInventory();
  }, [searchTerm, selectedCategory, selectedBranch, advancedFilters, pagination.page]);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchInventory();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Get available categories from API data
  const categories = [
    "all",
    ...Array.from(new Set(medicines.map((m) => m.category))),
  ];

  const getStockLevel = (quantity: number, lowStockAlert: number) => {
    const percentage = (quantity / (lowStockAlert * 2)) * 100;
    return Math.min(percentage, 100);
  };

  const getStockStatus = (quantity: number, lowStockAlert: number) => {
    if (quantity === 0)
      return {
        label: t("Out of Stock"),
        color: "bg-red-100 text-red-800",
        urgency: "critical",
      };
    if (quantity <= lowStockAlert / 2)
      return {
        label: t("Critical"),
        color: "bg-red-100 text-red-800",
        urgency: "critical",
      };
    if (quantity <= lowStockAlert)
      return {
        label: t("Low Stock"),
        color: "bg-orange-100 text-orange-800",
        urgency: "warning",
      };
    return {
      label: t("In Stock"),
      color: "bg-green-100 text-green-800",
      urgency: "good",
    };
  };

  const isExpiringSoon = (expiryDate: Date) => {
    const today = new Date();
    const monthsUntilExpiry =
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsUntilExpiry <= 6;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Using the currency context for dynamic currency formatting
  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount === undefined || amount === null || isNaN(amount) ? 0 : amount;
    return formatAmount(safeAmount);
  };

  // Action handlers
  const handleViewDetails = (item: Medicine) => {
    setViewDetailsModal({ open: true, item });
  };

  const handleEdit = (item: Medicine) => {
    setEditModal({ open: true, item });
  };

  const handleDelete = (item: Medicine) => {
    setDeleteModal({ open: true, item });
  };

  const handleItemAdded = async (newItem?: InventoryItem | any) => {
    // Add the new item directly to the list without refreshing
    if (newItem) {
      try {
        // Log received item from backend
        console.log('📥 Received new item from backend:', newItem);
        
        // Transform the new item to Medicine format
      const transformedItem = transformInventoryItem(newItem);
        
        // Log transformed item
        console.log('🔄 Transformed item:', {
          id: transformedItem.id,
          name: transformedItem.name,
          branches: transformedItem.branches,
          branchWarehouses: transformedItem.branchWarehouses
        });
        
        // Add to medicines list
      setMedicines((prevMedicines) => {
        // Check if item already exists (avoid duplicates)
        const exists = prevMedicines.some(med => med.id === transformedItem.id);
        if (exists) {
            // Update existing item instead
            return prevMedicines.map(med => 
              med.id === transformedItem.id ? transformedItem : med
            );
        }
        // Add new item at the beginning of the list
        return [transformedItem, ...prevMedicines];
      });
        
      // Update pagination total
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
      }));
        
        // Refresh stats to reflect the new item
      apiService.getInventoryStats().then(setStats).catch(console.error);
        
        // Show success message
        toast({
          title: t("Success"),
          description: t("Item added successfully and displayed in the table"),
        });
      } catch (error) {
        console.error("Error processing new item:", error);
        // Fallback to full refresh if transformation fails
        fetchInventory(true);
      }
    } else {
      // Fallback to full refresh if item data not provided
      fetchInventory(true);
    }
  };

  const handleSaveEdit = async (updatedData: Record<string, any>) => {
    try {
      if (!editModal.item) return;

      // Transform data to match backend format
      const updateData: any = {
        name: updatedData.name,
        category: updatedData.category,
        current_stock: parseInt(updatedData.quantity),
        minimum_stock: parseInt(updatedData.lowStockAlert),
        unit_price: parseFloat(updatedData.unitPrice),
        supplier: updatedData.supplier,
        expiry_date: updatedData.expiryDate ? new Date(updatedData.expiryDate).toISOString() : undefined,
        manufacturer: updatedData.manufacturer,
        batchNumber: updatedData.batchNumber,
        description: updatedData.description,
      };

      // Include assignedBranches if provided
      if (updatedData.assignedBranches && Array.isArray(updatedData.assignedBranches)) {
        updateData.assignedBranches = updatedData.assignedBranches;
      }

      // Include branchWarehouses if provided
      if (updatedData.branchWarehouses && Array.isArray(updatedData.branchWarehouses)) {
        updateData.branchWarehouses = updatedData.branchWarehouses;
      }

      const updatedItem = await apiService.updateInventoryItem(editModal.item.id, updateData);
      
      // Transform the updated item to Medicine format
      const transformedItem = transformInventoryItem(updatedItem);
      
      // Update the item directly in the list without refreshing
      setMedicines((prevMedicines) =>
        prevMedicines.map((med) =>
          med.id === editModal.item!.id ? transformedItem : med
        )
      );
      
      toast({
        title: t("Item updated"),
        description: `${updatedData.name} ${t('has been updated successfully.')}`,
      });

      setEditModal({ open: false, item: null });
      
      // Refresh stats to reflect changes
      const statsResponse = await apiService.getInventoryStats();
      setStats(statsResponse);
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: error.message || t("Failed to update item. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!deleteModal.item) return;

      await apiService.deleteInventoryItem(deleteModal.item.id);
      
      toast({
        title: t("Item deleted"),
        description: `${deleteModal.item.name} ${t('has been deleted successfully.')}`,
      });

      setDeleteModal({ open: false, item: null });
      fetchInventory(true);
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: error.message || t("Failed to delete item. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleAddStock = (item: Medicine) => {
    setStockModal({ open: true, item, operation: "add" });
  };

  const handleRemoveStock = (item: Medicine) => {
    setStockModal({ open: true, item, operation: "subtract" });
  };

  const handleConfirmStockUpdate = async (quantity: number, branchId: string, warehouseId: string) => {
    if (!stockModal.item) return;

    try {
      const updatedItem = await apiService.updateInventoryStock(stockModal.item.id, {
        quantity,
        operation: stockModal.operation,
        branchId,
        warehouseId,
      });

      // Reload the item from API to get updated stockByBranchWarehouse data
      const refreshedItem = await apiService.getInventoryItem(stockModal.item.id);
      
      // Transform and update in list
      const transformedItem = transformInventoryItem(refreshedItem.inventoryItem || refreshedItem);
      setMedicines((prevMedicines) =>
        prevMedicines.map((med) =>
          med.id === transformedItem.id ? transformedItem : med
        )
      );

      // Refresh stats
      apiService.getInventoryStats().then(setStats).catch(console.error);
      
      toast({
        title: t("Success"),
        description:
          stockModal.operation === "add"
            ? t("Added {{quantity}} units to {{name}}", {
                quantity,
                name: stockModal.item.name,
              })
            : t("Removed {{quantity}} units from {{name}}", {
                quantity,
                name: stockModal.item.name,
              }),
      });

      setStockModal({ open: false, item: null, operation: "add" });
    } catch (error: any) {
      throw error; // Let modal handle the error display
    }
  };

  // Filter handlers
  const handleApplyAdvancedFilters = (filters: Record<string, any>) => {
    setAdvancedFilters(filters);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
  };

  const handleRefresh = () => {
    fetchInventory(true);
  };

  // Filter configuration
  const filterFields = [
    {
      key: "manufacturer",
      label: t("Manufacturer"),
      type: "select" as const,
      options: Array.from(new Set(medicines.map((m) => m.manufacturer))),
    },
    {
      key: "supplier",
      label: t("Supplier"),
      type: "select" as const,
      options: Array.from(new Set(medicines.map((m) => m.supplier))),
    },
    {
      key: "minQuantity",
      label: t("Minimum Quantity"),
      type: "number" as const,
      placeholder: t("Enter minimum quantity"),
    },
    {
      key: "maxQuantity",
      label: t("Maximum Quantity"),
      type: "number" as const,
      placeholder: t("Enter maximum quantity"),
    },
    {
      key: "status",
      label: t("Stock Status"),
      type: "checkbox" as const,
      options: [t("In Stock"), t("Low Stock"), t("Out of Stock")],
    },
  ];

  // Calculate stats from API or fallback
  const totalItems = stats?.totalItems || medicines.length;
  const lowStockItems = stats?.lowStockItems || medicines.filter(
    (m) => m.quantity <= m.lowStockAlert,
  ).length;
  const outOfStockItems = stats?.outOfStockItems || medicines.filter((m) => m.quantity === 0).length;
  const totalValue = stats?.totalValue || medicines.reduce(
    (sum, m) => {
      const quantity = m.quantity || 0;
      const unitPrice = m.unitPrice || 0;
      return sum + (quantity * unitPrice);
    },
    0,
  );

  // Loading state
  if (isLoading && medicines.length === 0) {
    return (
      <div className="space-y-6">
        <Loading 
          text={t('Loading inventory...')} 
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('Inventory Management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('Track medical supplies and medication stock')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </Button>
          <AddItemModal onSuccess={handleItemAdded} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Total Items')}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {totalItems}
                  </p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Low Stock')}</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {lowStockItems}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Out of Stock')}
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {outOfStockItems}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('Total Value')}
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    <CurrencyDisplay amount={totalValue} variant="large" />
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0 sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search by name, manufacturer, or batch number...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('Category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? t("All Categories") : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('Branch')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Branches")}</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <AdvancedFiltersModal
                filterFields={filterFields}
                onApplyFilters={handleApplyAdvancedFilters}
                onClearFilters={handleClearAdvancedFilters}
                initialFilters={advancedFilters}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('Medicine & Supplies Inventory')}</CardTitle>
            <CardDescription>
              {t('Monitor stock levels, expiry dates, and inventory values')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      {t('Item Details')}
                    </TableHead>
                    <TableHead className="min-w-[120px]">{t('Category')}</TableHead>
                    <TableHead className="min-w-[140px]">{t('Stock Level')}</TableHead>
                    <TableHead className="min-w-[150px]">{t('Branches')}</TableHead>
                    <TableHead className="min-w-[120px]">{t('Unit Price')}</TableHead>
                    <TableHead className="min-w-[130px]">{t('Total Value')}</TableHead>
                    <TableHead className="min-w-[130px]">{t('Expiry Date')}</TableHead>
                    <TableHead className="min-w-[100px]">{t('Status')}</TableHead>
                    <TableHead className="text-right min-w-[120px]">
                      {t('Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine) => {
                    const stockStatus = getStockStatus(
                      medicine.quantity,
                      medicine.lowStockAlert,
                    );
                    const stockLevel = getStockLevel(
                      medicine.quantity,
                      medicine.lowStockAlert,
                    );
                    const isExpiring = isExpiringSoon(medicine.expiryDate);

                    return (
                      <TableRow key={medicine.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {medicine.manufacturer} • {t('Batch:')} {medicine.batchNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{medicine.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{medicine.quantity} {t('units')}</span>
                              <span className="text-muted-foreground">
                                {t('Min:')} {medicine.lowStockAlert}
                              </span>
                            </div>
                            <Progress value={stockLevel} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {medicine.branches && medicine.branches.length > 0 ? (
                            <AssignedBranchesCell branches={medicine.branches} />
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(medicine.unitPrice || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(
                              (medicine.quantity || 0) * (medicine.unitPrice || 0),
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={isExpiring ? "text-orange-600" : ""}>
                            {formatDate(medicine.expiryDate)}
                            {isExpiring && (
                              <div className="text-xs text-orange-600">
                                {t('Expiring Soon')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${stockStatus.color}`}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8">
                                <MoreVertical className="h-4 w-4 mr-1" />
                                {t('Actions')}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(medicine)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('View Details')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(medicine)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('Edit Item')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAddStock(medicine)}
                              >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                {t('Add Stock')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveStock(medicine)}
                              >
                                <TrendingDown className="mr-2 h-4 w-4" />
                                {t('Remove Stock')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(medicine)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('Delete Item')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {medicines.map((medicine) => {
                const stockStatus = getStockStatus(
                  medicine.quantity,
                  medicine.lowStockAlert,
                );
                const stockLevel = getStockLevel(
                  medicine.quantity,
                  medicine.lowStockAlert,
                );

                return (
                  <div
                    key={medicine.id}
                    className="border rounded-lg p-4 space-y-3 bg-card shadow-sm"
                  >
                    {/* Header with Item and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">
                          {medicine.name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {medicine.manufacturer}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <Badge className={`text-xs ${stockStatus.color}`}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Stock Level Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('Stock Level')}</span>
                        <span className="font-medium">
                          {medicine.quantity} {t('units')}
                        </span>
                      </div>
                      <Progress value={stockLevel} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {t('Low stock alert:')} {medicine.lowStockAlert} {t('units')}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {t('Category')}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {medicine.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {t('Unit Price')}
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(medicine.unitPrice || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {t('Total Value')}
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(
                            (medicine.quantity || 0) * (medicine.unitPrice || 0),
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {t('Expiry Date')}
                        </div>
                        <div className="text-sm">
                          {medicine.expiryDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        {t('Batch:')} {medicine.batchNumber}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4 mr-1" />
                            {t('Actions')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(medicine)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('View Details')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(medicine)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('Edit Item')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAddStock(medicine)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('Add Stock')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(medicine)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('Delete Item')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {medicines.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('No inventory items found')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('Get started by adding your first inventory item.')}
                </p>
                <AddItemModal onSuccess={handleItemAdded} />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Details Modal */}
      <ViewDetailsModal
        open={viewDetailsModal.open}
        onOpenChange={(open) => setViewDetailsModal({ open, item: null })}
        title={`${t('Medicine Details')} - ${viewDetailsModal.item?.name || ""}`}
        data={viewDetailsModal.item || {}}
        fields={[
          // Basic Information Section
          { key: "name", label: t("Name"), section: t("Basic Information") },
          { key: "category", label: t("Category"), type: "badge", section: t("Basic Information") },
          { key: "description", label: t("Description"), section: t("Basic Information") },
          
          // Stock & Pricing Section
          { key: "quantity", label: t("Quantity"), section: t("Stock & Pricing") },
          { key: "unitPrice", label: t("Unit Price"), type: "currency", section: t("Stock & Pricing") },
          { 
            key: "totalValue", 
            label: t("Total Value"), 
            type: "currency", 
            section: t("Stock & Pricing"),
            render: (value: any) => {
              const item = viewDetailsModal.item;
              const total = (item?.quantity || 0) * (item?.unitPrice || 0);
              return formatCurrency(total);
            }
          },
          { key: "lowStockAlert", label: t("Low Stock Alert"), section: t("Stock & Pricing") },
          
          // Manufacturer & Supplier Section
          { key: "manufacturer", label: t("Manufacturer"), section: t("Manufacturer & Supplier") },
          { key: "supplier", label: t("Supplier"), section: t("Manufacturer & Supplier") },
          { key: "batchNumber", label: t("Batch Number"), section: t("Manufacturer & Supplier") },
          
          // Expiry Information Section
          { key: "expiryDate", label: t("Expiry Date"), type: "date", section: t("Expiry Information") },
          
          // Branches & Warehouses Section
          { 
            key: "branches", 
            label: t("Assigned Branches"), 
            type: "branches", 
            section: t("Branches & Warehouses"),
            render: (value: any) => {
              if (!value || !Array.isArray(value) || value.length === 0) {
                return <span className="text-gray-400 italic">{t("No branches assigned")}</span>;
              }
              return (
                <div className="flex flex-wrap gap-2">
                  {value.map((branch: any, index: number) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {branch.name || branch.id}
                      {branch.code && <span className="ml-1 text-xs">({branch.code})</span>}
                    </Badge>
                  ))}
                </div>
              );
            }
          },
          { 
            key: "branchWarehouses", 
            label: t("Branch Warehouses"), 
            type: "branchWarehouses", 
            section: t("Branches & Warehouses"),
            render: (value: any) => {
              if (!value || !Array.isArray(value) || value.length === 0) {
                return <span className="text-gray-400 italic">{t("No warehouses assigned")}</span>;
              }
              // Get branch names from branches array
              const branchesMap = new Map(
                (viewDetailsModal.item?.branches || []).map((b: any) => [b.id || b._id, b.name])
              );
              
              return (
                <div className="space-y-2">
                  {value.map((bw: any, index: number) => {
                    const branchName = branchesMap.get(bw.branchId) || bw.branchId;
                    return (
                      <div key={index} className={cn("flex items-center gap-2 text-sm p-2 bg-white rounded border", isRTL && "flex-row-reverse")}>
                        <Package className={cn("h-4 w-4 text-blue-500", isRTL && "order-last")} />
                        <span className={cn("font-medium text-gray-700", isRTL && "text-right")}>{branchName}:</span>
                        <Warehouse className={cn("h-4 w-4 text-green-500", isRTL ? "mr-2 order-first" : "ml-2")} />
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {bw.warehouseName || bw.warehouseId}
                          {bw.warehouseType && (
                            <span className={cn("text-xs", isRTL ? "mr-1" : "ml-1")}>({bw.warehouseType})</span>
                          )}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              );
            }
          },
          
          // Additional Information Section
          { key: "createdAt", label: t("Created At"), type: "date", section: t("Additional Information") },
          { key: "updatedAt", label: t("Updated At"), type: "date", section: t("Additional Information") },
        ]}
      />

      {/* Edit Modal */}
      <EditItemModal
        open={editModal.open}
        onOpenChange={(open) => setEditModal({ open, item: null })}
        title={`${t('Edit Medicine')} - ${editModal.item?.name || ""}`}
        data={{
          ...editModal.item,
          assignedBranches: editModal.item?.branches?.map((b: any) => b.id || b._id) || [],
          branchWarehouses: editModal.item?.branchWarehouses || [],
        }}
        fields={[]}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, item: null })}
        title={t("Delete Medicine")}
        description={t("Are you sure you want to delete this medicine from the inventory?")}
        itemName={deleteModal.item?.name || ""}
        onConfirm={handleConfirmDelete}
      />

      {/* Update Stock Modal */}
      <UpdateStockModal
        open={stockModal.open}
        onOpenChange={(open) => setStockModal({ open, item: null, operation: "add" })}
        item={
          stockModal.item
            ? {
                id: stockModal.item.id,
                name: stockModal.item.name,
                quantity: stockModal.item.quantity,
                branches: stockModal.item.branches,
                branchWarehouses: stockModal.item.branchWarehouses,
              }
            : null
        }
        operation={stockModal.operation}
        onConfirm={handleConfirmStockUpdate}
      />
    </div>
  );
};

export default Inventory;
