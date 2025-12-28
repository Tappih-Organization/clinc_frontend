import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Beaker,
  TestTube2,
  Heart,
  Zap,
  Microscope,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Folder,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AddCategoryModal from "@/components/modals/AddCategoryModal";
import EditCategoryModal from "@/components/modals/EditCategoryModal";
import ViewCategoryModal from "@/components/modals/ViewCategoryModal";
import {
  useTestCategories,
  useTestCategoryStats,
  useDeleteTestCategory,
  useToggleTestCategoryStatus,
} from "@/hooks/useApi";
import { TestCategory } from "@/types";

const Category = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // API Hooks
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useTestCategories({
    page,
    limit,
    search: searchTerm || undefined,
    department: selectedDepartment !== "all" ? selectedDepartment : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useTestCategoryStats();

  const deleteCategory = useDeleteTestCategory();
  const toggleStatus = useToggleTestCategoryStatus();

  // Extract data from API response
  const categories = categoriesResponse?.data?.categories || [];
  const pagination = categoriesResponse?.data?.pagination;
  const stats = statsData || {
    totalCategories: 0,
    activeCategories: 0,
    totalTests: 0,
    departmentsCount: 0,
  };

  // Get unique departments from categories for filter
  const departments = ["all", ...Array.from(new Set(categories.map((cat) => cat.department)))];

  const getCategoryIcon = (iconName: string, color: string) => {
    const iconProps = { className: "h-4 w-4", style: { color } };
    switch (iconName) {
      case "beaker":
        return <Beaker {...iconProps} />;
      case "test-tube":
        return <TestTube2 {...iconProps} />;
      case "heart":
        return <Heart {...iconProps} />;
      case "zap":
        return <Zap {...iconProps} />;
      case "microscope":
        return <Microscope {...iconProps} />;
      default:
        return <Folder {...iconProps} />;
    }
  };

  const handleView = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setViewModalOpen(true);
  };

  const handleEdit = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditModalOpen(true);
  };

  const handleViewTests = (categoryId: string) => {
    // Navigate to tests page with category filter
    navigate(`/dashboard/tests?category=${categoryId}`);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory.mutateAsync(categoryId);
      toast({
        title: t("Category Deleted"),
        description: t("Category has been successfully deleted"),
      });
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to delete category"),
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (categoryId: string) => {
    try {
      await toggleStatus.mutateAsync(categoryId);
      toast({
        title: t("Status Updated"),
        description: t("Category status has been updated successfully"),
      });
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to update category status"),
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetchCategories();
    refetchStats();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (categoriesLoading) {
    return (
      <div className={cn("flex items-center justify-center h-96", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("Loading categories...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6 lg:space-y-8", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={cn("min-w-0 flex-1", isRTL && "text-right sm:order-2")}>
          <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight truncate", isRTL && "text-right")}>{t("Test Categories")}</h1>
          <p className={cn("text-sm sm:text-base text-muted-foreground mt-1", isRTL && "text-right")}>
            {t("Manage laboratory test categories and their configurations")}
          </p>
        </div>
        <div className={cn("flex items-center gap-2 flex-shrink-0", isRTL && "flex-row-reverse sm:order-1")}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={categoriesLoading}
            className={cn("h-9 flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <RefreshCw className={cn(`h-4 w-4 ${categoriesLoading ? 'animate-spin' : ''}`)} />
            <span className="hidden sm:inline">{t("Refresh")}</span>
          </Button>
          <AddCategoryModal 
            trigger={
              <Button size="sm" className={cn("h-9 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Add Category")}</span>
                <span className="sm:hidden">{t("Add")}</span>
              </Button>
            }

          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <Folder className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Total Categories")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCategories} {t("active")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Active Categories")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeCategories}</div>
            <p className="text-xs text-muted-foreground">{t("Currently active")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <TestTube2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Total Tests")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">{t("Across all categories")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Departments")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{stats.departmentsCount}</div>
            <p className="text-xs text-muted-foreground">{t("Different departments")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className={cn("space-y-3 sm:space-y-0 sm:flex sm:gap-4", isRTL && "sm:flex-row-reverse")}>
            <div className="flex-1">
              <div className="relative">
                <Search className={cn("absolute top-2.5 h-4 w-4 text-muted-foreground", isRTL ? "right-2" : "left-2")} />
                <Input
                  placeholder={t("Search categories...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn("h-9 sm:h-10", isRTL ? "pr-8" : "pl-8")}
                />
              </div>
            </div>
            <div className={cn("flex flex-col xs:flex-row gap-2", isRTL && "xs:flex-row-reverse")}>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className={cn("w-full xs:w-[160px] sm:w-[180px] h-9 sm:h-10", isRTL && "text-right")}>
                  <SelectValue placeholder={t("Department")} />
                </SelectTrigger>
                <SelectContent align={isRTL ? "start" : "end"}>
                  <SelectItem value="all">{t("All Departments")}</SelectItem>
                  {departments.slice(1).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className={cn("w-full xs:w-[100px] sm:w-[120px] h-9 sm:h-10", isRTL && "text-right")}>
                  <SelectValue placeholder={t("Status")} />
                </SelectTrigger>
                <SelectContent align={isRTL ? "start" : "end"}>
                  <SelectItem value="all">{t("All Status")}</SelectItem>
                  <SelectItem value="active">{t("Active")}</SelectItem>
                  <SelectItem value="inactive">{t("Inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader className={isRTL && "text-right"}>
          <CardTitle className={cn("text-lg sm:text-xl", isRTL && "text-right")}>{t("Categories")} ({stats.totalCategories})</CardTitle>
          <CardDescription className={cn("text-sm", isRTL && "text-right")}>
            {t("Manage your laboratory test categories and their properties.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {categoriesLoading ? (
            <div className={cn("flex justify-center items-center py-12 gap-2", isRTL && "flex-row-reverse")}>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>{t("Loading categories...")}</span>
            </div>
          ) : categories.length === 0 ? (
            <div className={cn("text-center py-12", isRTL && "text-right")}>
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className={cn("text-gray-500 mb-4", isRTL && "text-right")}>
                {searchTerm || selectedDepartment !== "all" || selectedStatus !== "all" 
                  ? t("No categories found matching your filters.") 
                  : t("No categories found. Add your first category to get started.")}
              </p>
              <AddCategoryModal 
                trigger={
                  <Button className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Plus className="h-4 w-4" />
                    {t("Add Your First Category")}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table dir={isRTL ? 'rtl' : 'ltr'}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={cn("min-w-[200px] pr-3", isRTL && "text-right")}>{t("Category Details")}</TableHead>
                  <TableHead className={cn("min-w-[120px] hidden sm:table-cell pr-3", isRTL && "text-right")}>{t("Department")}</TableHead>
                  <TableHead className={cn("min-w-[100px] hidden md:table-cell pr-3", isRTL && "text-right")}>{t("Icon")}</TableHead>
                  <TableHead className={cn("min-w-[80px] hidden lg:table-cell pr-3", isRTL && "text-right")}>{t("Tests Count")}</TableHead>
                  <TableHead className={cn("min-w-[80px] pr-3", isRTL && "text-right")}>{t("Status")}</TableHead>
                  <TableHead className={cn("min-w-[70px] pr-3", isRTL ? "text-right" : "text-right")}>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell className={cn("pr-3", isRTL && "text-right")}>
                      <div className={cn("space-y-1", isRTL && "text-right")}>
                        <div className="font-medium text-sm sm:text-base">{category.name}</div>
                        <div className={cn("text-xs sm:text-sm text-muted-foreground", isRTL && "text-right")}>
                          {t("Code:")} {category.code}
                        </div>
                        {category.description && (
                          <div className={cn("text-xs text-muted-foreground max-w-[180px] truncate", isRTL && "text-right")}>
                            {category.description}
                          </div>
                        )}
                        {/* Mobile-only additional info */}
                        <div className={cn("sm:hidden space-y-1 pt-1 border-t border-muted", isRTL && "text-right")}>
                          <div className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                            {t("Department:")} {category.department}
                          </div>
                          <div className={cn("flex items-center gap-2 text-xs", isRTL && "flex-row-reverse justify-end")}>
                            {getCategoryIcon(category.icon, category.color)}
                            <span>{t("Icon")}: {category.icon}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={cn("hidden sm:table-cell pr-3", isRTL && "text-right")}>
                      <Badge variant="outline" className="text-xs">
                        {category.department}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("hidden md:table-cell pr-3", isRTL && "text-right")}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                        {getCategoryIcon(category.icon, category.color)}
                        <span className="text-sm">{category.icon}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("hidden lg:table-cell pr-3", isRTL && "text-right")}>
                      <span className="text-sm">{category.testCount || 0}</span>
                    </TableCell>
                    <TableCell className={cn("pr-3", isRTL && "text-right")}>
                      <Badge
                        variant={category.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {category.isActive ? t("Active") : t("Inactive")}
                      </Badge>
                    </TableCell>
                                          <TableCell className={cn("pr-3", isRTL ? "text-right" : "text-right")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={cn("h-8 flex items-center gap-1", isRTL && "flex-row-reverse")}>
                              <MoreVertical className="h-4 w-4" />
                              {t("Actions")}
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem onClick={() => handleView(category._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Eye className="h-4 w-4" />
                            {t("View Details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(category._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Edit className="h-4 w-4" />
                            {t("Edit Category")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewTests(category._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <TestTube2 className="h-4 w-4" />
                            {t("View Tests")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(category._id)}>
                            {category.isActive ? t("Deactivate") : t("Activate")}
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <div className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground text-red-600 gap-2", isRTL && "flex-row-reverse")}>
                                <Trash2 className="h-4 w-4" />
                                {t("Delete")}
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent className={isRTL && "text-right"}>
                              <AlertDialogHeader>
                                <AlertDialogTitle className={isRTL && "text-right"}>{t("Delete Category")}</AlertDialogTitle>
                                <AlertDialogDescription className={isRTL && "text-right"}>
                                  {t("Are you sure you want to delete this category? This action cannot be undone.")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className={cn("gap-2", isRTL && "flex-row-reverse")}>
                                <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(category._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t("Delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className={cn("text-center py-8", isRTL && "text-right")}>
                      <div className="text-muted-foreground">
                        {t("No categories found.")} {searchTerm || selectedDepartment !== "all" || selectedStatus !== "all" 
                          ? t("Try adjusting your filters.") 
                          : t("Add your first category to get started.")}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className={cn("md:hidden space-y-4 p-4", isRTL && "text-right")}>
            {categories.map((category) => (
              <div
                key={category._id}
                className={cn("border rounded-lg p-4 space-y-3 bg-white shadow-sm", isRTL && "text-right")}
              >
                {/* Header with Category Name and Status */}
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className={cn("min-w-0 flex-1", isRTL && "text-right")}>
                    <div className={cn("font-semibold text-sm truncate", isRTL && "text-right")}>
                      {category.name}
                    </div>
                    <div className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                      {t("Code:")} {category.code}
                    </div>
                  </div>
                  <Badge
                    variant={category.isActive ? "default" : "secondary"}
                    className={cn("text-xs", isRTL ? "mr-2" : "ml-2")}
                  >
                    {category.isActive ? t("Active") : t("Inactive")}
                  </Badge>
                </div>

                {/* Description */}
                {category.description && (
                  <div className={cn("p-3 bg-gray-50 rounded-lg", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide mb-1", isRTL && "text-right")}>
                      {t("Description")}
                    </div>
                    <div className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                      {category.description}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Department")}
                    </div>
                    <Badge variant="outline" className={cn("text-xs w-fit", isRTL && "ml-auto")}>
                      {category.department}
                    </Badge>
                  </div>
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Icon")}
                    </div>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      {getCategoryIcon(category.icon, category.color)}
                      <span className="text-sm text-gray-900">{category.icon}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Tests Count")}
                    </div>
                    <div className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                      {category.testCount || 0} {t("tests")}
                    </div>
                  </div>
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Status")}
                    </div>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      {category.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                        {category.isActive ? t("Active") : t("Inactive")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={cn("flex items-center justify-between pt-2 border-t", isRTL && "flex-row-reverse")}>
                  <div className={cn("text-xs text-gray-400", isRTL && "text-right")}>
                    ID: {category._id.slice(-8)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <MoreVertical className="h-4 w-4" />
                        {t("Actions")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? "start" : "end"}>
                      <DropdownMenuItem onClick={() => handleView(category._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Eye className="h-4 w-4" />
                        {t("View Details")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(category._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Edit className="h-4 w-4" />
                        {t("Edit Category")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewTests(category._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <TestTube2 className="h-4 w-4" />
                        {t("View Tests")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(category._id)}>
                        {category.isActive ? t("Deactivate") : t("Activate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(category._id)}
                        className={cn("text-red-600 flex items-center gap-2", isRTL && "flex-row-reverse")}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3", isRTL && "sm:flex-row-reverse")}>
              <div className={cn("text-xs sm:text-sm text-muted-foreground order-2 sm:order-1", isRTL && "sm:order-2 text-right")}>
                {t("Showing")} {((page - 1) * limit) + 1} {t("to")} {Math.min(page * limit, pagination.total)} {t("of")} {pagination.total} {t("categories")}
              </div>
              <div className={cn("flex items-center gap-2 order-1 sm:order-2", isRTL && "sm:order-1 flex-row-reverse")}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="h-8"
                >
                  {t("Previous")}
                </Button>
                <div className={cn("text-xs sm:text-sm px-2", isRTL && "text-right")}>
                  {t("Page")} {page} {t("of")} {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="h-8"
                >
                  {t("Next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ViewCategoryModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        categoryId={selectedCategoryId}
      />

      <EditCategoryModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        categoryId={selectedCategoryId}

      />
    </div>
  );
};

export default Category;
