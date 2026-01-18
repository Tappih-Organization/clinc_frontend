import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TestTube2,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  User,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { labVendorApi, TestRecord } from "@/services/api/labVendorApi";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface TestHistoryModalProps {
  vendorId: string | null;
  vendorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const TestHistoryModal: React.FC<TestHistoryModalProps> = ({
  vendorId,
  vendorName,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { formatAmount } = useCurrency();
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Mock data for demonstration
  const mockTests: TestRecord[] = [
    {
      id: "T-001",
      testId: "LAB001",
      patientId: "P-12345",
      patientName: "John Doe",
      testType: "Complete Blood Count",
      orderDate: new Date("2024-01-20"),
      completionDate: new Date("2024-01-21"),
      status: "completed",
      cost: 45.00,
      results: "Normal values within range",
      notes: "Fasting sample collected",
    },
    {
      id: "T-002",
      testId: "LAB002",
      patientId: "P-12346",
      patientName: "Jane Smith",
      testType: "Lipid Panel",
      orderDate: new Date("2024-01-19"),
      completionDate: new Date("2024-01-20"),
      status: "completed",
      cost: 78.50,
      results: "Elevated cholesterol levels",
      notes: "12-hour fasting required",
    },
    {
      id: "T-003",
      testId: "LAB003",
      patientId: "P-12347",
      patientName: "Mike Johnson",
      testType: "Thyroid Function",
      orderDate: new Date("2024-01-18"),
      status: "in_progress",
      cost: 120.00,
      notes: "Follow-up test",
    },
    {
      id: "T-004",
      testId: "LAB004",
      patientId: "P-12348",
      patientName: "Sarah Wilson",
      testType: "HbA1c",
      orderDate: new Date("2024-01-17"),
      status: "pending",
      cost: 65.00,
      notes: "Diabetes monitoring",
    },
    {
      id: "T-005",
      testId: "LAB005",
      patientId: "P-12349",
      patientName: "Robert Brown",
      testType: "Liver Function Panel",
      orderDate: new Date("2024-01-16"),
      completionDate: new Date("2024-01-17"),
      status: "completed",
      cost: 95.75,
      results: "Slightly elevated ALT",
      notes: "Recheck in 3 months",
    },
  ];

  useEffect(() => {
    if (vendorId && isOpen) {
      fetchTestHistory();
    }
  }, [vendorId, isOpen, pagination.page, statusFilter, dateFromFilter, dateToFilter]);

  const fetchTestHistory = async () => {
    if (!vendorId) return;
    
    try {
      setIsLoading(true);
      const filters = {
        page: pagination.page,
        limit: pagination.limit,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
      };
      
      const response = await labVendorApi.getTestHistory(vendorId, filters);
      setTests(response.tests);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching test history:", error);
      toast({
        title: t("Error"),
        description: t("Failed to load test history. Showing sample data."),
        variant: "destructive",
      });
      // Fallback to mock data
      setTests(mockTests);
      setPagination({
        page: 1,
        limit: 10,
        total: mockTests.length,
        pages: 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "completed": t("Completed"),
      "in_progress": t("In Progress"),
      "pending": t("Pending"),
      "cancelled": t("Cancelled"),
    };
    return statusMap[status] || status.replace("_", " ").toUpperCase();
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || test.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCost = filteredTests.reduce((sum, test) => sum + test.cost, 0);
  const completedTests = filteredTests.filter((test) => test.status === "completed").length;
  const pendingTests = filteredTests.filter((test) => test.status === "pending").length;
  const inProgressTests = filteredTests.filter((test) => test.status === "in_progress").length;

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-6xl max-h-[95vh] overflow-y-auto z-50", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div
            className={cn("flex items-start justify-between gap-4")}
            style={isRTL ? { flexDirection: "row-reverse" } : { flexDirection: "row" }}
          >
            {/* Title and Description */}
            <div className={cn("flex items-center gap-3 flex-1", isRTL && "flex-row-reverse justify-end")}>
              <TestTube2
                className={cn("h-6 w-6 text-blue-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")}
              />
              <div className={cn(isRTL && "text-right", "flex-1")}>
                <DialogTitle
                  className={cn("text-xl", isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("Test History")} - {vendorName || t("Vendor")}
                </DialogTitle>
                <DialogDescription
                  className={cn(isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("View and manage test records for this vendor")}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("Total Tests")}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {filteredTests.length}
                    </p>
                  </div>
                  <TestTube2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("Completed")}
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {completedTests}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("In Progress")}
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {inProgressTests}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("Total Value")}
                    </p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatAmount(totalCost)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardContent className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                {/* Search */}
                <div className={cn("relative flex-1 min-w-0 sm:min-w-[250px]", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                  <Search className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
                  <Input
                    placeholder={t("Search by patient name, test type, or test ID...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={cn("w-full sm:w-40", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <SelectValue placeholder={t("Status")} />
                  </SelectTrigger>
                  <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                    <SelectItem value="all" dir={isRTL ? "rtl" : "ltr"}>{t("All Status")}</SelectItem>
                    <SelectItem value="completed" dir={isRTL ? "rtl" : "ltr"}>{t("Completed")}</SelectItem>
                    <SelectItem value="in_progress" dir={isRTL ? "rtl" : "ltr"}>{t("In Progress")}</SelectItem>
                    <SelectItem value="pending" dir={isRTL ? "rtl" : "ltr"}>{t("Pending")}</SelectItem>
                    <SelectItem value="cancelled" dir={isRTL ? "rtl" : "ltr"}>{t("Cancelled")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filters */}
                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className={cn("w-full sm:w-auto", isRTL && "text-right")}
                    placeholder={t("From date")}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className={cn("w-full sm:w-auto", isRTL && "text-right")}
                    placeholder={t("To date")}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test History Table */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <TestTube2 className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Test Records")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              {isLoading ? (
                <div className={cn("flex items-center justify-center py-8", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Loader2 className={cn("h-8 w-8 animate-spin mx-auto mb-4", isRTL && "order-2")} />
                    <p className={cn("text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Loading test history...")}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto" dir={isRTL ? "rtl" : "ltr"}>
                    <Table dir={isRTL ? "rtl" : "ltr"}>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Test ID")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Patient")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Test Type")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Order Date")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Completion Date")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Status")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Cost")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Results")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell className={cn("font-mono font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {test.testId}
                            </TableCell>
                            <TableCell>
                              <div className={cn("flex items-center", isRTL ? "flex-row-reverse" : "")}>
                                <User className={cn("h-4 w-4 text-gray-400 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                                <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                  <div className={cn("font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                    {test.patientName}
                                  </div>
                                  <div className={cn("text-sm text-gray-500", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                    {t("ID:")} {test.patientId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={cn("font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {test.testType}
                            </TableCell>
                            <TableCell className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {formatDate(test.orderDate)}
                            </TableCell>
                            <TableCell className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {test.completionDate ? formatDate(test.completionDate) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2 flex-row-reverse" : "space-x-2")}>
                                {getStatusIcon(test.status)}
                                <Badge className={cn(getStatusColor(test.status), isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                  {getStatusLabel(test.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className={cn("font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {formatAmount(test.cost)}
                            </TableCell>
                            <TableCell>
                              {test.results ? (
                                <div className={cn("max-w-xs", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                  <p className={cn("text-sm truncate", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} title={test.results}>
                                    {test.results}
                                  </p>
                                  {test.notes && (
                                    <p className={cn("text-xs text-gray-500 truncate", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} title={test.notes}>
                                      {test.notes}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className={cn("text-gray-400", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                  {t("Pending")}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {filteredTests.length === 0 && (
                    <div className={cn("text-center py-8", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <TestTube2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className={cn("text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("No test records found")}
                      </p>
                      <p className={cn("text-sm text-gray-500", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Try adjusting your search criteria")}
                      </p>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className={cn("flex items-center mt-6", isRTL ? "justify-between flex-row-reverse" : "justify-between")} dir={isRTL ? "rtl" : "ltr"}>
                      <p className={cn("text-sm text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Showing {{from}} to {{to}} of {{total}} results", {
                          from: ((pagination.page - 1) * pagination.limit) + 1,
                          to: Math.min(pagination.page * pagination.limit, pagination.total),
                          total: pagination.total
                        })}
                      </p>
                      <div className={cn("flex", isRTL ? "space-x-reverse space-x-2 flex-row-reverse" : "space-x-2")}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          {t("Previous")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                          dir={isRTL ? "rtl" : "ltr"}
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
        </div>

        {/* Action Buttons */}
        <div
          className={cn("flex justify-end items-center pt-6 border-t", isRTL && "flex-row-reverse")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
            <Button
              variant="outline"
              onClick={onClose}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
            >
              {t("Close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestHistoryModal; 