import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
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
  Search,
  Plus,
  Filter,
  MoreVertical,
  TestTube2,
  Beaker,
  Heart,
  Zap,
  Microscope,
  Clock,
  Edit,
  Trash2,
  Eye,
  Copy,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Test, TestCategory, SampleType, TestMethodology, TurnaroundTime } from "@/types";
import { apiService } from "@/services/api";
import AddTestModal from "@/components/modals/AddTestModal";
import ViewTestModal from "@/components/modals/ViewTestModal";
import EditTestModal from "@/components/modals/EditTestModal";

const Tests = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Data states
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [sampleTypes, setSampleTypes] = useState<SampleType[]>([]);
  const [methodologies, setMethodologies] = useState<TestMethodology[]>([]);
  const [turnaroundTimes, setTurnaroundTimes] = useState<TurnaroundTime[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Memoized fetch data function to prevent unnecessary re-renders
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Build API parameters
      const apiParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      };

      // Debug logging
      console.log('Tests API Parameters:', apiParams);
      console.log('Selected Category:', selectedCategory);
      console.log('Available Categories Count:', categories.length);

      // Fetch tests with current filters
      const testsResponse = await apiService.getTests(apiParams);

      // Only fetch supporting data on first load or when not initialized
      if (!isInitialized) {
        const [categoriesResponse, sampleTypesResponse, methodologiesResponse, turnaroundResponse] = await Promise.all([
          apiService.getTestCategories({ limit: 100, status: 'active' }),
          apiService.getSampleTypes({ limit: 100, status: 'active' }),
          apiService.getTestMethodologies({ limit: 100, status: 'active' }),
          apiService.getTurnaroundTimes({ limit: 100, status: 'active' }),
        ]);

        setCategories(categoriesResponse.data?.categories || []);
        setSampleTypes(sampleTypesResponse.data?.sampleTypes || []);
        setMethodologies(methodologiesResponse.data?.methodologies || []);
        setTurnaroundTimes(turnaroundResponse.data?.turnaroundTimes || []);
      }

      setTests(testsResponse.data?.items || []);
      setTotalPages(testsResponse.data?.pagination?.pages || 1);
      setTotalItems(testsResponse.data?.pagination?.total || 0);
    } catch (err: any) {
      console.error('Error fetching tests data:', err);
      setError(err.response?.data?.message || 'Failed to fetch tests data');
      // Reset states to prevent render errors
      setTests([]);
      if (!isInitialized) {
        setCategories([]);
        setSampleTypes([]);
        setMethodologies([]);
        setTurnaroundTimes([]);
      }
      setTotalPages(1);
      setTotalItems(0);
      toast({
        title: t("Error"),
        description: t("Failed to fetch tests data. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, selectedCategory, selectedStatus, searchTerm, isInitialized]);

  // Handle URL parameter changes
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, selectedCategory]);

  // Single effect for data fetching - handles initial load and all changes
  useEffect(() => {
    // Mark as initialized on first run
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // Debounce search term changes
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        if (currentPage !== 1) {
          setCurrentPage(1);
          return; // Exit early, the currentPage change will trigger this effect again
        }
        fetchData();
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      // For non-search changes, fetch immediately
      fetchData();
    }
  }, [currentPage, selectedCategory, selectedStatus, searchTerm, fetchData]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedCategory, selectedStatus]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const getCategoryName = (categoryId: string) => {
    if (typeof categoryId === 'object' && categoryId !== null) {
      return (categoryId as TestCategory).name;
    }
    const category = (categories || []).find(c => c._id === categoryId);
    return category?.name || categoryId;
  };

  const getSampleTypeName = (sampleTypeId: string | SampleType | undefined): string => {
    if (!sampleTypeId) return 'N/A';
    if (typeof sampleTypeId === 'object' && sampleTypeId !== null) {
      return (sampleTypeId as SampleType).name;
    }
    const sampleType = (sampleTypes || []).find(st => st._id === sampleTypeId);
    return sampleType?.name || String(sampleTypeId);
  };

  const getMethodologyName = (methodologyId: string | TestMethodology | undefined): string => {
    if (!methodologyId) return 'N/A';
    if (typeof methodologyId === 'object' && methodologyId !== null) {
      return (methodologyId as TestMethodology).name;
    }
    const methodology = (methodologies || []).find(m => m._id === methodologyId);
    return methodology?.name || String(methodologyId);
  };

  const getTurnaroundTimeName = (turnaroundId: string | TurnaroundTime): string => {
    if (typeof turnaroundId === 'object' && turnaroundId !== null) {
      const tat = turnaroundId as TurnaroundTime;
      return `${tat.name} (${Math.round(tat.durationMinutes / 60)}h)`;
    }
    const turnaround = (turnaroundTimes || []).find(t => t._id === turnaroundId);
    return turnaround ? `${turnaround.name} (${Math.round(turnaround.durationMinutes / 60)}h)` : String(turnaroundId);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "hematology":
        return <Beaker className="h-4 w-4 text-red-600" />;
      case "clinical chemistry":
        return <TestTube2 className="h-4 w-4 text-blue-600" />;
      case "cardiology":
        return <Heart className="h-4 w-4 text-pink-600" />;
      case "endocrinology":
        return <Zap className="h-4 w-4 text-purple-600" />;
      default:
        return <Microscope className="h-4 w-4 text-green-600" />;
    }
  };

  const handleViewTest = (testId: string) => {
    setSelectedTestId(testId);
    setIsViewModalOpen(true);
  };

  const handleEditTest = (testId: string) => {
    setSelectedTestId(testId);
    setIsEditModalOpen(true);
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm(t("Are you sure you want to delete this test?"))) return;

    try {
      await apiService.deleteTest(testId);
      toast({
        title: t("Success"),
        description: t("Test deleted successfully."),
      });
      fetchData(false);
    } catch (err: any) {
      console.error('Error deleting test:', err);
      toast({
        title: t("Error"),
        description: err.response?.data?.message || t("Failed to delete test."),
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (testId: string) => {
    try {
      const test = (tests || []).find(t => t._id === testId);
      if (!test) return;

      await apiService.toggleTestStatus(testId);
      toast({
        title: t("Success"),
        description: test.isActive ? t("Test deactivated successfully.") : t("Test activated successfully."),
      });
      fetchData(false);
    } catch (err: any) {
      console.error('Error toggling test status:', err);
      toast({
        title: t("Error"),
        description: err.response?.data?.message || t("Failed to update test status."),
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTest = async (testId: string) => {
    try {
      const test = (tests || []).find(t => t._id === testId);
      if (!test) return;

      const duplicateData = {
        name: `${test.name} (Copy)`,
        code: `${test.code}_COPY`,
        category: typeof test.category === 'string' ? test.category : test.category._id,
        sampleType: typeof test.sampleType === 'string' ? test.sampleType : test.sampleType?._id,
        methodology: typeof test.methodology === 'string' ? test.methodology : test.methodology?._id,
        turnaroundTime: typeof test.turnaroundTime === 'string' ? test.turnaroundTime : test.turnaroundTime._id,
        description: test.description || "",
        normalRange: test.normalRange || "",
        units: test.units || "",
      };

      await apiService.createTest(duplicateData);
      toast({
        title: t("Success"),
        description: t("Test duplicated successfully."),
      });
      fetchData(false);
    } catch (err: any) {
      console.error('Error duplicating test:', err);
      toast({
        title: t("Error"),
        description: err.response?.data?.message || t("Failed to duplicate test."),
        variant: "destructive",
      });
    }
  };

  const handleAddTest = () => {
    setIsAddModalOpen(true);
  };

  const handleTestAdded = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  const handleTestUpdated = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("Loading tests...")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("Error Loading Tests")}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchData()} variant="outline" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <RefreshCw className="h-4 w-4" />
            {t("Try Again")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6 lg:space-y-8", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={cn("min-w-0 flex-1", isRTL && "text-right sm:order-2")}>
          <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight truncate flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
            {isRTL ? (
              <>
                {t("Laboratory Tests")}
                <TestTube2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </>
            ) : (
              <>
                <TestTube2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                {t("Laboratory Tests")}
              </>
            )}
          </h1>
          <p className={cn("text-sm sm:text-base text-muted-foreground mt-1", isRTL && "text-right")}>
            {t("Manage your laboratory test catalog and configurations")}
          </p>
        </div>
        <div className={cn("flex items-center gap-2 flex-shrink-0", isRTL && "flex-row-reverse sm:order-1")}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn("h-9 flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <RefreshCw className={cn(`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`)} />
            <span className="hidden sm:inline">{t("Refresh")}</span>
          </Button>
          <Button onClick={handleAddTest} size="sm" className={cn("h-9 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("Add New Test")}</span>
            <span className="sm:hidden">{t("Add")}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <TestTube2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Total Tests")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {(tests || []).filter(t => t.isActive).length} {t("active")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <Beaker className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Categories")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{(categories || []).length}</div>
            <p className="text-xs text-muted-foreground">{t("Test categories")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <Microscope className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Sample Types")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{(sampleTypes || []).length}</div>
            <p className="text-xs text-muted-foreground">{t("Different sample types")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Methodologies")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{(methodologies || []).length}</div>
            <p className="text-xs text-muted-foreground">{t("Test methodologies")}</p>
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
                  placeholder={t("Search tests...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn("h-9 sm:h-10", isRTL ? "pr-8" : "pl-8")}
                />
              </div>
            </div>
            <div className={cn("flex flex-col xs:flex-row gap-2", isRTL && "xs:flex-row-reverse")}>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className={cn("w-full xs:w-[160px] sm:w-[180px] h-9 sm:h-10", isRTL && "text-right")}>
                  <SelectValue placeholder={t("Category")} />
                </SelectTrigger>
                <SelectContent align={isRTL ? "start" : "end"}>
                  <SelectItem value="all">{t("All Categories")}</SelectItem>
                  {(categories || []).map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
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

      {/* Tests Table */}
      <Card>
        <CardHeader className={isRTL && "text-right"}>
          <CardTitle className={cn("text-lg sm:text-xl", isRTL && "text-right")}>{t("Tests")} ({totalItems})</CardTitle>
          <CardDescription className={cn("text-sm", isRTL && "text-right")}>
            {t("A list of all laboratory tests in your catalog.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table dir={isRTL ? 'rtl' : 'ltr'}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={cn("min-w-[200px] py-3", isRTL && "text-right")}>{t("Test Details")}</TableHead>
                  <TableHead className={cn("min-w-[110px] py-3", isRTL && "text-right")}>{t("Category")}</TableHead>
                  <TableHead className={cn("min-w-[100px] hidden lg:table-cell py-3", isRTL && "text-right")}>{t("Sample Type")}</TableHead>
                  <TableHead className={cn("min-w-[120px] hidden lg:table-cell py-3", isRTL && "text-right")}>{t("Methodology")}</TableHead>
                  <TableHead className={cn("min-w-[140px] hidden lg:table-cell py-3", isRTL && "text-right")}>{t("Turnaround Time")}</TableHead>
                  <TableHead className={cn("min-w-[80px] hidden xl:table-cell py-3", isRTL && "text-right")}>{t("Price")}</TableHead>
                  <TableHead className={cn("min-w-[80px] py-3", isRTL && "text-right")}>{t("Status")}</TableHead>
                  <TableHead className={cn("min-w-[70px] py-3", isRTL ? "text-left" : "text-right")}>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tests || []).map((test) => (
                  <TableRow key={test._id} className="hover:bg-muted/50">
                    <TableCell className={cn("py-3", isRTL && "text-right")}>
                      <div className={cn("space-y-0.5", isRTL && "text-right")}>
                        <div className="font-medium text-sm leading-tight">{test.name}</div>
                        <div className="text-xs text-muted-foreground leading-tight">
                          {t("Code:")} {test.code}
                        </div>
                        {test.description && (
                          <div className="text-xs text-muted-foreground max-w-[180px] truncate leading-tight mt-0.5">
                            {test.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cn("py-3", isRTL ? "text-right pr-4" : "text-left pl-4")}>
                      <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse justify-end")}>
                        {getCategoryIcon(getCategoryName(test.category as string))}
                        <span className="text-sm leading-tight whitespace-nowrap">{getCategoryName(test.category as string)}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("hidden lg:table-cell py-3", isRTL && "text-right")}>
                      <span className="text-sm leading-tight">{getSampleTypeName(test.sampleType)}</span>
                    </TableCell>
                    <TableCell className={cn("hidden lg:table-cell py-3", isRTL && "text-right")}>
                      <span className="text-sm leading-tight">{getMethodologyName(test.methodology)}</span>
                    </TableCell>
                    <TableCell className={cn("hidden lg:table-cell py-3", isRTL ? "text-right pr-3" : "text-left pl-4")}>
                      <div className={cn("flex items-center gap-1", isRTL ? "flex-row-reverse justify-end" : "justify-start")}>
                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm leading-tight">{getTurnaroundTimeName(test.turnaroundTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("hidden xl:table-cell py-3", isRTL && "text-right")}>
                      <span className="text-sm text-muted-foreground leading-tight">-</span>
                    </TableCell>
                    <TableCell className={cn("py-3", isRTL && "text-right")}>
                      <Badge
                        variant={test.isActive ? "default" : "secondary"}
                        className="text-xs leading-tight"
                      >
                        {test.isActive ? t("Active") : t("Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("py-3", isRTL ? "text-left" : "text-right")}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("h-7 flex items-center gap-1 px-2", isRTL && "flex-row-reverse")}>
                            <MoreVertical className="h-3.5 w-3.5" />
                            <span className="text-xs">{t("Actions")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem onClick={() => handleViewTest(test._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Eye className="h-4 w-4" />
                            {t("View Details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTest(test._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Edit className="h-4 w-4" />
                            {t("Edit Test")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTest(test._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <Copy className="h-4 w-4" />
                            {t("Duplicate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(test._id)}>
                            {test.isActive ? t("Deactivate") : t("Activate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTest(test._id)}
                            className={cn("text-red-600 flex items-center gap-2", isRTL && "flex-row-reverse")}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {(tests || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className={cn("py-8", isRTL ? "text-right" : "text-center")}>
                      <div className="text-muted-foreground">
                        {t("No tests found.")} {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                          ? t("Try adjusting your filters.") 
                          : t("Add your first test to get started.")}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className={cn("md:hidden space-y-3 p-4", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
            {(tests || []).length === 0 ? (
              <div className={cn("py-8 text-gray-500", isRTL ? "text-right" : "text-center")}>
                <TestTube2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">{t("No tests found")}</p>
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" ? (
                  <p className="text-xs mt-1">{t("Try adjusting your filters")}</p>
                ) : (
                  <p className="text-xs mt-1">{t("Add your first test to get started")}</p>
                )}
              </div>
            ) : (
              (tests || []).map((test) => (
                <Card key={test._id} className={cn("p-4 space-y-3 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow", isRTL && "text-right")}>
                  {/* Header with test name and status */}
                  <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center flex-1 min-w-0 gap-2", isRTL && "flex-row-reverse")}>
                      <TestTube2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{test.name}</div>
                        <div className="text-xs text-gray-500">{t("Code:")} {test.code}</div>
                      </div>
                    </div>
                    <Badge
                      variant={test.isActive ? "default" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {test.isActive ? t("Active") : t("Inactive")}
                    </Badge>
                  </div>

                  {/* Description */}
                  {test.description && (
                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                      {test.description}
                    </div>
                  )}

                  {/* Test details */}
                  <div className="space-y-2">
                    <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {getCategoryIcon(getCategoryName(test.category as string))}
                        <span className="font-medium text-gray-500">{t("Category")}</span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {getCategoryName(test.category as string)}
                      </span>
                    </div>
                    <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Microscope className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-gray-500">{t("Sample")}</span>
                      </div>
                      <span className="text-gray-900">
                        {getSampleTypeName(test.sampleType)}
                      </span>
                    </div>
                    <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Beaker className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-500">{t("Methodology")}</span>
                      </div>
                      <span className="text-gray-900">
                        {getMethodologyName(test.methodology)}
                      </span>
                    </div>
                    <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-gray-500">{t("TAT")}</span>
                      </div>
                      <span className="text-gray-900">
                        {getTurnaroundTimeName(test.turnaroundTime)}
                      </span>
                    </div>
                  </div>

                  {/* Units and normal range */}
                  <div className={cn("flex items-center justify-between text-xs bg-blue-50 p-2 rounded", isRTL && "flex-row-reverse")}>
                    <div>
                      <span className="font-medium text-gray-500">{t("Units:")} </span>
                      <span className="text-gray-900">{test.units || t('N/A')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">{t("Range:")} </span>
                      <span className="text-gray-900">{test.normalRange || t('N/A')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={cn("flex pt-2 border-t", isRTL ? "justify-start" : "justify-end")}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-8 flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <MoreVertical className="h-4 w-4" />
                          {t("Actions")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? "start" : "end"}>
                        <DropdownMenuItem onClick={() => handleViewTest(test._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <Eye className="h-4 w-4" />
                          {t("View Details")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTest(test._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <Edit className="h-4 w-4" />
                          {t("Edit Test")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTest(test._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <Copy className="h-4 w-4" />
                          {t("Duplicate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(test._id)}>
                          {test.isActive ? t("Deactivate") : t("Activate")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTest(test._id)}
                          className={cn("text-red-600 flex items-center gap-2", isRTL && "flex-row-reverse")}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("Delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3", isRTL && "sm:flex-row-reverse")}>
              <div className={cn("text-xs sm:text-sm text-muted-foreground", isRTL ? "order-2 sm:order-1 text-right" : "order-2 sm:order-1")}>
                {t("Showing")} {((currentPage - 1) * pageSize) + 1} {t("to")} {Math.min(currentPage * pageSize, totalItems)} {t("of")} {totalItems} {t("tests")}
              </div>
              <div className={cn("flex items-center gap-2 order-1 sm:order-2", isRTL && "flex-row-reverse")}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  {t("Previous")}
                </Button>
                <div className="text-xs sm:text-sm px-2">
                  {t("Page")} {currentPage} {t("of")} {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  {t("Next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Test Modal */}
      <AddTestModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onTestAdded={handleTestAdded}
      />

      {/* View Test Modal */}
      <ViewTestModal
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setSelectedTestId(null);
        }}
        testId={selectedTestId}
      />

      {/* Edit Test Modal */}
      <EditTestModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedTestId(null);
        }}
        testId={selectedTestId}
        onTestUpdated={handleTestUpdated}
      />
    </div>
  );
};

export default Tests;
