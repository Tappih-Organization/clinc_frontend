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
  MoreVertical,
  Building2,
  RefreshCw,
  Eye,
  Edit,
  Power,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Warehouse, Branch, User } from "@/data/mockWarehouseData";
import { apiService } from "@/services/api";
import { parseApiError } from "@/utils/errorHandler";
import { useClinic } from "@/contexts/ClinicContext";
import {
  convertBackendWarehouseToFrontend,
  convertFrontendWarehouseToBackend,
  convertBackendBranchToFrontend,
  convertBackendUserToFrontend,
} from "@/utils/warehouseUtils";
import { WarehouseForm } from "@/components/inventory/WarehouseForm";
import { WarehouseDetailsCard } from "@/components/inventory/WarehouseDetailsCard";
import { WarehouseTypeBadge } from "@/components/inventory/WarehouseTypeBadge";
import { StatusBadge } from "@/components/inventory/StatusBadge";
import { AssignedBranchesCell } from "@/components/inventory/AssignedBranchesCell";
import Loading from "@/components/ui/Loading";
import WarehouseItemsModal from "@/components/modals/WarehouseItemsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Warehouses: React.FC = () => {
  const { t } = useTranslation();
  const { currentClinic, hasPermission } = useClinic();
  
  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "main" | "sub">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  
  // Sorting
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Modals
  const [formModal, setFormModal] = useState<{
    open: boolean;
    warehouse: Warehouse | null;
  }>({ open: false, warehouse: null });
  
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    warehouse: Warehouse | null;
  }>({ open: false, warehouse: null });
  
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    warehouse: Warehouse | null;
  }>({ open: false, warehouse: null });

  const [warehouseItemsModal, setWarehouseItemsModal] = useState<{
    open: boolean;
    warehouse: Warehouse | null;
  }>({ open: false, warehouse: null });

  // Load data
  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load branches and users in parallel
      const [branchesResponse, usersResponse, warehousesResponse] = await Promise.all([
        apiService.getBranches(),
        apiService.getUsers(),
        apiService.getWarehouses({
          search: searchTerm || undefined,
          type: typeFilter !== "all" ? typeFilter.toUpperCase() as 'MAIN' | 'SUB' : undefined,
          status: statusFilter !== "all" ? statusFilter.toUpperCase() as 'ACTIVE' | 'INACTIVE' : undefined,
          branchId: branchFilter !== "all" ? branchFilter : undefined,
          page: pagination.page,
          limit: pagination.limit,
          sortBy: sortBy === "createdAt" ? "created_at" : sortBy,
          sortOrder,
        }),
      ]);

      // Convert branches from backend format
      // Handle different response structures
      const branchesArray = Array.isArray(branchesResponse.data) 
        ? branchesResponse.data 
        : branchesResponse.data?.clinics || branchesResponse.data?.data || [];
      
      // Extract clinic data and remove duplicates based on clinic ID
      const uniqueBranchesMap = new Map<string, any>();
      
      // Get current clinic info
      const currentClinicId = currentClinic?._id?.toString();
      const isMainClinic = currentClinic?.is_main_clinic === true;
      
      branchesArray.forEach((item: any) => {
        // Handle different response structures:
        // 1. Direct clinic object: { _id, name, code, is_main_clinic, parent_clinic_id, ... }
        // 2. UserClinic with populated clinic_id: { clinic_id: { _id, name, code, ... }, ... }
        const clinic = item.clinic_id || item;
        const clinicId = clinic?._id?.toString() || clinic?._id || clinic?.id;
        const clinicIsMain = clinic?.is_main_clinic === true;
        const clinicParentId = clinic?.parent_clinic_id?.toString() || clinic?.parent_clinic_id;
        
        if (clinicId && clinic?.name) {
          // Filter branches based on clinic type:
          // 1. If current clinic is MAIN → show main clinic itself + all sub clinics (parent_clinic_id = current_clinic_id)
          // 2. If current clinic is SUB → show only current clinic
          let shouldInclude = false;
          
          if (isMainClinic) {
            // Main clinic: show main clinic itself + sub clinics that belong to this main clinic
            shouldInclude = 
              clinicId === currentClinicId || // Include the main clinic itself
              (!clinicIsMain && clinicParentId === currentClinicId); // Include sub clinics
          } else {
            // Sub clinic: show only the current clinic
            shouldInclude = clinicId === currentClinicId;
          }
          
          if (shouldInclude && !uniqueBranchesMap.has(clinicId)) {
            uniqueBranchesMap.set(clinicId, {
              _id: clinicId,
              name: clinic.name,
              code: clinic.code,
            });
          }
        }
      });
      
      // Convert to array and transform to frontend format
      const branchesData = Array.from(uniqueBranchesMap.values()).map((branch: any) =>
        convertBackendBranchToFrontend(branch)
      );
      
      // Sort by name for better UX
      branchesData.sort((a, b) => a.name.localeCompare(b.name));
      
      setBranches(branchesData);

      // Convert users from backend format
      // Handle different response structures - getUsers returns { success, data: { users: [], pagination: {} } }
      const usersArray = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data?.users || usersResponse.data?.data || [];
      
      const usersData = usersArray.map((user: any) =>
        convertBackendUserToFrontend({
          _id: user._id || user.id,
          fullName: user.fullName || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          role: user.role,
        })
      );
      setUsers(usersData);

      // Convert warehouses from backend format
      const warehousesData = warehousesResponse.data.map((warehouse: any) =>
        convertBackendWarehouseToFrontend(warehouse)
      );
      setWarehouses(warehousesData);
      setPagination(warehousesResponse.pagination);
    } catch (error) {
      console.error("Error loading warehouses:", error);
      toast({
        title: t("Error"),
        description: parseApiError(error) || t("Failed to load warehouses. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination.page, typeFilter, statusFilter, branchFilter, sortBy, sortOrder]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        loadData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers
  const handleCreate = () => {
    setFormModal({ open: true, warehouse: null });
  };

  const handleEdit = (warehouse: Warehouse) => {
    setFormModal({ open: true, warehouse });
  };

  const handleViewDetails = async (warehouse: Warehouse) => {
    try {
      const response = await apiService.getWarehouseById(warehouse.id);
      if (response.success && response.data) {
        const convertedWarehouse = convertBackendWarehouseToFrontend(response.data);
        setDetailsModal({ open: true, warehouse: convertedWarehouse });
      } else {
        setDetailsModal({ open: true, warehouse });
      }
    } catch (error) {
      console.error("Error loading warehouse details:", error);
      setDetailsModal({ open: true, warehouse });
    }
  };

  const handleDelete = (warehouse: Warehouse) => {
    setDeleteModal({ open: true, warehouse });
  };

  const handleViewWarehouseItems = (warehouse: Warehouse) => {
    setWarehouseItemsModal({ open: true, warehouse });
  };

  const handleSave = async (data: {
    name: string;
    type: "main" | "sub";
    assignedBranches: string[];
    managerId?: string;
    status: "active" | "inactive";
    isShared?: boolean;
  }) => {
    try {
      // Log frontend data before conversion
      console.log('📤 Frontend - Sending warehouse data:', {
        name: data.name,
        type: data.type,
        assignedBranches: data.assignedBranches,
        assignedBranchesCount: data.assignedBranches.length,
        managerId: data.managerId,
        status: data.status
      });

      const backendData = convertFrontendWarehouseToBackend(data);
      
      // Log backend data after conversion
      console.log('📤 Frontend - Converted to backend format:', {
        name: backendData.name,
        type: backendData.type,
        assignedBranches: backendData.assignedBranches,
        assignedBranchesCount: backendData.assignedBranches.length,
        managerUserId: backendData.managerUserId,
        status: backendData.status
      });
      
      if (formModal.warehouse) {
        await apiService.updateWarehouse(formModal.warehouse.id, backendData);
        toast({
          title: t("Success"),
          description: t("Warehouse updated successfully"),
        });
      } else {
        const response = await apiService.createWarehouse(backendData);
        
        // Log response data
        console.log('📥 Frontend - Received response:', {
          success: response.success,
          message: response.message,
          assignedBranchesCount: response.data?.assignedBranches?.length || 0,
          assignedBranches: response.data?.assignedBranches?.map((b: any) => ({
            id: b._id?.toString() || b.id,
            name: b.name
          })) || []
        });
        
        toast({
          title: t("Success"),
          description: t("Warehouse created successfully"),
        });
      }
      loadData(true);
      setFormModal({ open: false, warehouse: null });
    } catch (error: any) {
      console.error('❌ Frontend - Error saving warehouse:', error);
      toast({
        title: t("Error"),
        description: parseApiError(error) || t("Failed to save warehouse"),
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.warehouse) return;

    try {
      await apiService.deleteWarehouse(deleteModal.warehouse.id);
      toast({
        title: t("Success"),
        description: t("Warehouse deleted successfully"),
      });
      setDeleteModal({ open: false, warehouse: null });
      loadData(true);
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: parseApiError(error) || t("Failed to delete warehouse"),
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (warehouse: Warehouse) => {
    try {
      const newStatus = warehouse.status === "active" ? "INACTIVE" : "ACTIVE";
      await apiService.updateWarehouseStatus(warehouse.id, newStatus);
      toast({
        title: t("Success"),
        description: t("Warehouse status updated successfully"),
      });
      loadData(true);
      if (detailsModal.warehouse?.id === warehouse.id) {
        const response = await apiService.getWarehouseById(warehouse.id);
        if (response.success && response.data) {
          const updated = convertBackendWarehouseToFrontend(response.data);
          setDetailsModal({ open: true, warehouse: updated });
        }
      }
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: parseApiError(error) || t("Failed to update status"),
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: "name" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading && warehouses.length === 0) {
    return (
      <div className="space-y-6">
        <Loading text={t("Loading warehouses...")} size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("Warehouses Management")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Manage warehouses and their assigned branches")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 me-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("Refresh")}
          </Button>
          {hasPermission('warehouse.create') && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 me-2" />
              {t("Add Warehouse")}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-0 sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search by warehouse name...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value: "all" | "main" | "sub") => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("Warehouse Type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Types")}</SelectItem>
                <SelectItem value="main">{t("Main")}</SelectItem>
                <SelectItem value="sub">{t("Sub")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Status")}</SelectItem>
                <SelectItem value="active">{t("Active")}</SelectItem>
                <SelectItem value="inactive">{t("Inactive")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Branch Filter */}
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("Branch")} />
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
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("Warehouses")}</CardTitle>
            <CardDescription>
              {t("List of all warehouses with their assigned branches")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("No warehouses found")}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t("Get started by creating your first warehouse.")}
                </p>
                {hasPermission('warehouse.create') && (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 me-2" />
                    {t("Add Warehouse")}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleSort("name")}
                          >
                            {t("Warehouse Name")}
                            <ArrowUpDown className="ms-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>{t("Type")}</TableHead>
                        <TableHead>{t("Assigned Branches")}</TableHead>
                        <TableHead>{t("Number of Items")}</TableHead>
                        <TableHead>{t("Manager")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleSort("createdAt")}
                          >
                            {t("Created Date")}
                            <ArrowUpDown className="ms-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        {(hasPermission('warehouse.update') || hasPermission('warehouse.delete') || hasPermission('item.view')) && (
                          <TableHead className="text-end">{t("Actions")}</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouses.map((warehouse) => (
                        <TableRow key={warehouse.id}>
                          <TableCell className="font-medium">
                            {warehouse.name}
                          </TableCell>
                          <TableCell>
                            <WarehouseTypeBadge type={warehouse.type} />
                          </TableCell>
                          <TableCell>
                            <AssignedBranchesCell branches={warehouse.assignedBranches} />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{warehouse.itemCount ?? 0}</span>
                          </TableCell>
                          <TableCell>
                            {warehouse.manager ? (
                              <div>
                                <div className="font-medium">{warehouse.manager.fullName}</div>
                                {warehouse.manager.role && (
                                  <div className="text-sm text-muted-foreground">
                                    {warehouse.manager.role}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={warehouse.status} />
                          </TableCell>
                          <TableCell>
                            {formatDate(warehouse.createdAt)}
                          </TableCell>
                          {(hasPermission('warehouse.update') || hasPermission('warehouse.delete') || hasPermission('item.view')) && (
                            <TableCell className="text-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8">
                                    <MoreVertical className="h-4 w-4 me-1" />
                                    {t("Actions")}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {hasPermission('warehouse.view') && (
                                    <DropdownMenuItem onClick={() => handleViewDetails(warehouse)}>
                                      <Eye className="me-2 h-4 w-4" />
                                      {t("View Details")}
                                    </DropdownMenuItem>
                                  )}
                                  {hasPermission('item.view') && (
                                    <DropdownMenuItem onClick={() => handleViewWarehouseItems(warehouse)}>
                                      <Building2 className="me-2 h-4 w-4" />
                                      {t("Warehouse Items")}
                                    </DropdownMenuItem>
                                  )}
                                  {hasPermission('warehouse.update') && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleEdit(warehouse)}>
                                        <Edit className="me-2 h-4 w-4" />
                                        {t("Edit")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleToggleStatus(warehouse)}>
                                        <Power className="me-2 h-4 w-4" />
                                        {warehouse.status === "active"
                                          ? t("Deactivate")
                                          : t("Activate")}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {hasPermission('warehouse.delete') && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDelete(warehouse)}
                                    >
                                      <Trash2 className="me-2 h-4 w-4" />
                                      {t("Delete")}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {warehouses.map((warehouse) => (
                    <Card key={warehouse.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <WarehouseTypeBadge type={warehouse.type} />
                              <StatusBadge status={warehouse.status} />
                            </div>
                          </div>
                          {(hasPermission('warehouse.update') || hasPermission('warehouse.delete') || hasPermission('item.view')) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {hasPermission('warehouse.view') && (
                                  <DropdownMenuItem onClick={() => handleViewDetails(warehouse)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("View Details")}
                                  </DropdownMenuItem>
                                )}
                                {hasPermission('item.view') && (
                                  <DropdownMenuItem onClick={() => handleViewWarehouseItems(warehouse)}>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    {t("Warehouse Items")}
                                  </DropdownMenuItem>
                                )}
                                {hasPermission('warehouse.update') && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEdit(warehouse)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      {t("Edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleStatus(warehouse)}>
                                      <Power className="mr-2 h-4 w-4" />
                                      {warehouse.status === "active"
                                        ? t("Deactivate")
                                        : t("Activate")}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {hasPermission('warehouse.delete') && (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(warehouse)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("Delete")}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {t("Assigned Branches")}
                          </div>
                          <AssignedBranchesCell branches={warehouse.assignedBranches} />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {t("Number of Items")}
                          </div>
                          <div className="font-medium">{warehouse.itemCount ?? 0}</div>
                        </div>
                        {warehouse.manager && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">
                              {t("Manager")}
                            </div>
                            <div className="font-medium">{warehouse.manager.fullName}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {t("Created Date")}
                          </div>
                          <div>{formatDate(warehouse.createdAt)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      {t("Showing")} {(pagination.page - 1) * pagination.limit + 1} {t("to")}{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} {t("of")}{" "}
                      {pagination.total} {t("warehouses")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        {t("Previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.pages}
                      >
                        {t("Next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Modal */}
      <WarehouseForm
        open={formModal.open}
        onOpenChange={(open) => setFormModal({ open, warehouse: null })}
        warehouse={formModal.warehouse}
        branches={branches}
        users={users}
        onSave={handleSave}
      />

      {/* Details Modal */}
      {detailsModal.warehouse && (
        <WarehouseDetailsCard
          warehouse={detailsModal.warehouse}
          open={detailsModal.open}
          onOpenChange={(open) => setDetailsModal({ open, warehouse: null })}
          onEdit={() => {
            setDetailsModal({ open: false, warehouse: null });
            handleEdit(detailsModal.warehouse!);
          }}
          onToggleStatus={() => handleToggleStatus(detailsModal.warehouse!)}
          onDelete={() => {
            setDetailsModal({ open: false, warehouse: null });
            handleDelete(detailsModal.warehouse!);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, warehouse: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Warehouse")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete")} "{deleteModal.warehouse?.name}"?{" "}
              {t("This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warehouse Items Modal */}
      <WarehouseItemsModal
        open={warehouseItemsModal.open}
        onOpenChange={(open) => setWarehouseItemsModal({ open, warehouse: null })}
        warehouse={warehouseItemsModal.warehouse}
      />
    </div>
  );
};

export default Warehouses;
