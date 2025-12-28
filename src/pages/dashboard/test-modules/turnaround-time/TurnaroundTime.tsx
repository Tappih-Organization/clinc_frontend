import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AddTurnaroundTimeModal from "@/components/modals/AddTurnaroundTimeModal";
import ViewTurnaroundTimeModal from "@/components/modals/ViewTurnaroundTimeModal";
import EditTurnaroundTimeModal from "@/components/modals/EditTurnaroundTimeModal";
import { 
  useTurnaroundTimes, 
  useTurnaroundTimeStats, 
  useDeleteTurnaroundTime, 
  useToggleTurnaroundTimeStatus 
} from "@/hooks/useApi";
import { TurnaroundTime as TurnaroundTimeType } from "@/types";

// Remove the local interface since we're using the one from types

const TurnaroundTimePage = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTurnaroundTimeId, setSelectedTurnaroundTimeId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API Hooks
  const { data: turnaroundData, isLoading, error, refetch } = useTurnaroundTimes({
    page: currentPage,
    limit: pageLimit,
    search: debouncedSearch || undefined,
    priority: selectedPriority !== "all" ? selectedPriority : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useTurnaroundTimeStats();
  
  const deleteMutation = useDeleteTurnaroundTime();
  const toggleStatusMutation = useToggleTurnaroundTimeStatus();

  // Extract data from API response
  const turnaroundTimes = turnaroundData?.data?.turnaroundTimes || [];
  const pagination = turnaroundData?.data?.pagination;

  const priorities = ["all", "stat", "urgent", "routine", "extended"];

  // All filtering is now handled by the API

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "stat":
        return <Zap className="h-4 w-4 text-red-600" />;
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "routine":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "extended":
        return <Clock className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat":
        return "bg-red-100 text-red-800 border-red-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "routine":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "extended":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} ${t("min")}`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} ${t("hrs")}`;
    return `${Math.round(minutes / 1440)} ${t("days")}`;
  };

  const handleView = (timeId: string) => {
    setSelectedTurnaroundTimeId(timeId);
    setViewModalOpen(true);
  };

  const handleEdit = (timeId: string) => {
    setSelectedTurnaroundTimeId(timeId);
    setEditModalOpen(true);
  };

  const handleDelete = async (timeId: string) => {
    try {
      await deleteMutation.mutateAsync(timeId);
      toast({
        title: t("Success"),
        description: t("Turnaround time deleted successfully"),
      });
      refetch();
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to delete turnaround time"),
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (timeId: string) => {
    try {
      await toggleStatusMutation.mutateAsync(timeId);
      toast({
        title: t("Success"),
        description: t("Turnaround time status updated successfully"),
      });
      refetch();
    } catch (error) {
      toast({
        title: t("Error"),
        description: t("Failed to update turnaround time status"),
        variant: "destructive",
      });
    }
  };

  // Use stats from API
  const totalTimes = statsData?.totalTimes || 0;
  const activeTimes = statsData?.activeTimes || 0;
  const statTimes = statsData?.statTimes || 0;
  const averageMinutes = statsData?.averageMinutes || 0;

  // Handle loading and error states
  if (error) {
    return (
      <div className={cn("space-y-6", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={cn("text-center py-10", isRTL && "text-right")}>
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className={cn("text-xl font-semibold text-gray-900 mb-2", isRTL && "text-right")}>
            {t("Error Loading Turnaround Times")}
          </h2>
          <p className={cn("text-gray-600 mb-4", isRTL && "text-right")}>
            {t("Failed to load turnaround time data. Please try again.")}
          </p>
          <Button onClick={() => refetch()} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
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
          <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight truncate", isRTL && "text-right")}>{t("Turnaround Times")}</h1>
          <p className={cn("text-sm sm:text-base text-muted-foreground mt-1", isRTL && "text-right")}>
            {t("Manage laboratory test turnaround times and priorities")}
          </p>
        </div>
        <div className={cn("flex items-center gap-2 flex-shrink-0", isRTL && "flex-row-reverse sm:order-1")}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className={cn("h-9 flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <RefreshCw className={cn(`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`)} />
            <span className="hidden sm:inline">{t("Refresh")}</span>
          </Button>
          <AddTurnaroundTimeModal 
            trigger={
              <Button size="sm" className={cn("h-9 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Add Turnaround Time")}</span>
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
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Total Times")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{totalTimes}</div>
            <p className="text-xs text-muted-foreground">
              {activeTimes} {t("active")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("STAT Tests")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{statTimes}</div>
            <p className="text-xs text-muted-foreground">{t("Emergency priority")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Average Time")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{formatDuration(averageMinutes)}</div>
            <p className="text-xs text-muted-foreground">{t("Across all tests")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2 gap-2", isRTL && "flex-row-reverse")}>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
            <CardTitle className={cn("text-xs sm:text-sm font-medium", isRTL && "text-right")}>{t("Active Times")}</CardTitle>
          </CardHeader>
          <CardContent className={isRTL && "text-right"}>
            <div className="text-xl sm:text-2xl font-bold">{activeTimes}</div>
            <p className="text-xs text-muted-foreground">{t("Currently active")}</p>
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
                  placeholder={t("Search turnaround times...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn("h-9 sm:h-10", isRTL ? "pr-8" : "pl-8")}
                />
              </div>
            </div>
            <div className={cn("flex flex-col xs:flex-row gap-2", isRTL && "xs:flex-row-reverse")}>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className={cn("w-full xs:w-[160px] sm:w-[180px] h-9 sm:h-10", isRTL && "text-right")}>
                  <SelectValue placeholder={t("Priority")} />
                </SelectTrigger>
                <SelectContent align={isRTL ? "start" : "end"}>
                  <SelectItem value="all">{t("All Priorities")}</SelectItem>
                  {priorities.slice(1).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
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

      {/* Turnaround Times Table */}
      <Card>
        <CardHeader className={isRTL && "text-right"}>
          <CardTitle className={cn("text-lg sm:text-xl", isRTL && "text-right")}>{t("Turnaround Times")} ({totalTimes})</CardTitle>
          <CardDescription className={cn("text-sm", isRTL && "text-right")}>
            {t("Manage your laboratory test turnaround times and their priorities.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className={cn("flex justify-center items-center py-12 gap-2", isRTL && "flex-row-reverse")}>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>{t("Loading turnaround times...")}</span>
            </div>
          ) : turnaroundTimes.length === 0 ? (
            <div className={cn("text-center py-12", isRTL && "text-right")}>
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className={cn("text-gray-500 mb-4", isRTL && "text-right")}>
                {searchTerm || selectedPriority !== "all" || selectedStatus !== "all" 
                  ? t("No turnaround times found matching your filters.") 
                  : t("No turnaround times found. Add your first turnaround time to get started.")}
              </p>
              <AddTurnaroundTimeModal 
                trigger={
                  <Button className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    <Plus className="h-4 w-4" />
                    {t("Add Your First Turnaround Time")}
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
                  <TableHead className={cn("min-w-[200px] pr-3", isRTL && "text-right")}>{t("Time Details")}</TableHead>
                  <TableHead className={cn("min-w-[120px] hidden sm:table-cell pr-3", isRTL && "text-right")}>{t("Priority")}</TableHead>
                  <TableHead className={cn("min-w-[100px] hidden md:table-cell pr-3", isRTL && "text-right")}>{t("Duration")}</TableHead>
                  <TableHead className={cn("min-w-[80px] hidden lg:table-cell pr-3", isRTL && "text-right")}>{t("Category")}</TableHead>
                  <TableHead className={cn("min-w-[80px] pr-3", isRTL && "text-right")}>{t("Status")}</TableHead>
                  <TableHead className={cn("min-w-[70px] pr-3", isRTL ? "text-right" : "text-right")}>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="h-6 bg-gray-100 rounded animate-pulse w-20"></div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-12"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 bg-gray-100 rounded animate-pulse w-16"></div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-8 w-8 bg-gray-100 rounded animate-pulse ml-auto"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : turnaroundTimes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className={cn("text-center py-8", isRTL && "text-right")}>
                      <div className="text-muted-foreground">
                        {t("No turnaround times found.")} {searchTerm || selectedPriority !== "all" || selectedStatus !== "all" 
                          ? t("Try adjusting your filters.") 
                          : t("Add your first turnaround time to get started.")}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  turnaroundTimes.map((time) => (
                    <TableRow key={time._id}>
                      <TableCell className={cn("pr-3", isRTL && "text-right")}>
                        <div className={cn("space-y-1", isRTL && "text-right")}>
                          <div className="font-medium text-sm sm:text-base">{time.name}</div>
                          <div className={cn("text-xs sm:text-sm text-muted-foreground", isRTL && "text-right")}>
                            {t("Code")}: {time.code}
                          </div>
                          {time.description && (
                            <div className={cn("text-xs text-muted-foreground max-w-[180px] truncate", isRTL && "text-right")}>
                              {time.description}
                            </div>
                          )}
                          {/* Mobile-only additional info */}
                          <div className={cn("sm:hidden space-y-1 pt-1 border-t border-muted", isRTL && "text-right")}>
                            <div className={cn("flex items-center gap-2 text-xs", isRTL && "flex-row-reverse justify-end")}>
                              {getPriorityIcon(time.priority)}
                              <span className={`px-2 py-1 rounded-full ${getPriorityColor(time.priority)}`}>
                                {time.priority.charAt(0).toUpperCase() + time.priority.slice(1)}
                              </span>
                            </div>
                            <div className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                              {t("Duration")}: {formatDuration(time.durationMinutes)}
                            </div>
                            <div className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                              {t("Category")}: {time.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={cn("hidden sm:table-cell pr-3", isRTL && "text-right")}>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                          {getPriorityIcon(time.priority)}
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(time.priority)}`}>
                            {time.priority.charAt(0).toUpperCase() + time.priority.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className={cn("hidden md:table-cell pr-3", isRTL && "text-right")}>
                        <span className="text-sm">{formatDuration(time.durationMinutes)}</span>
                      </TableCell>
                      <TableCell className={cn("hidden lg:table-cell pr-3", isRTL && "text-right")}>
                        <span className="text-sm">{time.category}</span>
                      </TableCell>
                      <TableCell className={cn("pr-3", isRTL && "text-right")}>
                        <Badge
                          variant={time.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {time.isActive ? t("Active") : t("Inactive")}
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
                            <DropdownMenuItem onClick={() => handleView(time._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                              <Eye className="h-4 w-4" />
                              {t("View Details")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(time._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                              <Edit className="h-4 w-4" />
                              {t("Edit Time")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(time._id)}>
                              {time.isActive ? t("Deactivate") : t("Activate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(time._id)}
                              className={cn("text-red-600 flex items-center gap-2", isRTL && "flex-row-reverse")}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className={cn("md:hidden space-y-4 p-4", isRTL && "text-right")}>
            {turnaroundTimes.map((time) => (
              <div
                key={time._id}
                className={cn("border rounded-lg p-4 space-y-3 bg-white shadow-sm", isRTL && "text-right")}
              >
                {/* Header with Name and Status */}
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className={cn("min-w-0 flex-1", isRTL && "text-right")}>
                    <div className={cn("font-semibold text-sm truncate", isRTL && "text-right")}>
                      {time.name}
                    </div>
                    <div className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                      {t("Code")}: {time.code}
                    </div>
                  </div>
                  <Badge
                    variant={time.isActive ? "default" : "secondary"}
                    className={cn("text-xs", isRTL ? "mr-2" : "ml-2")}
                  >
                    {time.isActive ? t("Active") : t("Inactive")}
                  </Badge>
                </div>

                {/* Description */}
                {time.description && (
                  <div className={cn("p-3 bg-gray-50 rounded-lg", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide mb-1", isRTL && "text-right")}>
                      {t("Description")}
                    </div>
                    <div className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                      {time.description}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Priority")}
                    </div>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      {getPriorityIcon(time.priority)}
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(time.priority)}`}>
                        {time.priority.charAt(0).toUpperCase() + time.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Duration")}
                    </div>
                    <div className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                      {formatDuration(time.durationMinutes)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Category")}
                    </div>
                    <div className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                      {time.category}
                    </div>
                  </div>
                  <div className={cn("space-y-1", isRTL && "text-right")}>
                    <div className={cn("text-xs text-gray-500 uppercase tracking-wide", isRTL && "text-right")}>
                      {t("Status")}
                    </div>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      {time.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={cn("text-sm text-gray-900", isRTL && "text-right")}>
                        {time.isActive ? t("Active") : t("Inactive")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={cn("flex items-center justify-between pt-2 border-t", isRTL && "flex-row-reverse")}>
                  <div className={cn("text-xs text-gray-400", isRTL && "text-right")}>
                    ID: {time._id.slice(-8)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                        <MoreVertical className="h-4 w-4" />
                        {t("Actions")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? "start" : "end"}>
                      <DropdownMenuItem onClick={() => handleView(time._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Eye className="h-4 w-4" />
                        {t("View Details")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(time._id)} className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Edit className="h-4 w-4" />
                        {t("Edit Time")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(time._id)}>
                        {time.isActive ? t("Deactivate") : t("Activate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(time._id)}
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
                {t("Showing")} {((currentPage - 1) * pageLimit) + 1} {t("to")} {Math.min(currentPage * pageLimit, pagination.total)} {t("of")} {pagination.total} {t("turnaround times")}
              </div>
              <div className={cn("flex items-center gap-2 order-1 sm:order-2", isRTL && "sm:order-1 flex-row-reverse")}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  {t("Previous")}
                </Button>
                <div className={cn("text-xs sm:text-sm px-2", isRTL && "text-right")}>
                  {t("Page")} {currentPage} {t("of")} {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
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
      <ViewTurnaroundTimeModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        turnaroundTimeId={selectedTurnaroundTimeId}
      />

      <EditTurnaroundTimeModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        turnaroundTimeId={selectedTurnaroundTimeId}

      />
    </div>
  );
};

export default TurnaroundTimePage;
