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
import { Label } from "@/components/ui/label";
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
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { labVendorApi, PaymentRecord, BillingSummary } from "@/services/api/labVendorApi";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface BillingPaymentsModalProps {
  vendorId: string | null;
  vendorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const BillingPaymentsModal: React.FC<BillingPaymentsModalProps> = ({
  vendorId,
  vendorName,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { formatAmount } = useCurrency();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Mock data for demonstration
  const mockPayments: PaymentRecord[] = [
    {
      id: "PAY-001",
      vendorId: vendorId || "",
      amount: 1250.75,
      paymentDate: new Date("2024-01-15"),
      paymentMethod: "bank_transfer",
      reference: "INV-2024-001",
      status: "completed",
      notes: "Monthly lab services payment",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "PAY-002",
      vendorId: vendorId || "",
      amount: 890.50,
      paymentDate: new Date("2024-01-02"),
      paymentMethod: "ach",
      reference: "INV-2023-128",
      status: "completed",
      notes: "December services payment",
      createdAt: new Date("2024-01-02"),
    },
    {
      id: "PAY-003",
      vendorId: vendorId || "",
      amount: 2150.00,
      paymentDate: new Date("2024-01-25"),
      paymentMethod: "check",
      reference: "INV-2024-002",
      status: "pending",
      notes: "Quarterly contract payment",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: "PAY-004",
      vendorId: vendorId || "",
      amount: 675.25,
      paymentDate: new Date("2023-12-28"),
      paymentMethod: "credit_card",
      reference: "INV-2023-127",
      status: "completed",
      notes: "Emergency testing services",
      createdAt: new Date("2023-12-28"),
    },
    {
      id: "PAY-005",
      vendorId: vendorId || "",
      amount: 1425.80,
      paymentDate: new Date("2023-12-15"),
      paymentMethod: "wire",
      reference: "INV-2023-126",
      status: "failed",
      notes: "Failed wire transfer - retry needed",
      createdAt: new Date("2023-12-15"),
    },
  ];

  const mockSummary: BillingSummary = {
    totalAmount: 15432.75,
    paidAmount: 12856.50,
    pendingAmount: 2150.00,
    overdueAmount: 426.25,
    lastPaymentDate: new Date("2024-01-15"),
    nextPaymentDue: new Date("2024-02-15"),
    averageMonthlySpend: 1287.73,
  };

  useEffect(() => {
    if (vendorId && isOpen) {
      fetchBillingData();
    }
  }, [vendorId, isOpen, selectedYear, selectedMonth, pagination.page]);

  const fetchBillingData = async () => {
    if (!vendorId) return;
    
    try {
      setIsLoading(true);
      const filters = {
        page: pagination.page,
        limit: pagination.limit,
        year: parseInt(selectedYear) || undefined,
        month: selectedMonth !== "all" ? parseInt(selectedMonth) : undefined,
      };
      
      const response = await labVendorApi.getBillingPayments(vendorId, filters);
      setPayments(response.payments);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast({
        title: t("Error"),
        description: t("Failed to load billing data. Showing sample data."),
        variant: "destructive",
      });
      // Fallback to mock data
      setPayments(mockPayments);
      setSummary(mockSummary);
      setPagination({
        page: 1,
        limit: 10,
        total: mockPayments.length,
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
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "completed": t("Completed"),
      "pending": t("Pending"),
      "failed": t("Failed"),
    };
    return statusMap[status] || status.toUpperCase();
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      "bank_transfer": t("Bank Transfer"),
      "check": t("Check"),
      "credit_card": t("Credit Card"),
      "ach": t("ACH"),
      "wire": t("Wire Transfer"),
    };
    return methodMap[method] || method;
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: "1", label: t("January") },
    { value: "2", label: t("February") },
    { value: "3", label: t("March") },
    { value: "4", label: t("April") },
    { value: "5", label: t("May") },
    { value: "6", label: t("June") },
    { value: "7", label: t("July") },
    { value: "8", label: t("August") },
    { value: "9", label: t("September") },
    { value: "10", label: t("October") },
    { value: "11", label: t("November") },
    { value: "12", label: t("December") },
  ];

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
              <DollarSign
                className={cn("h-6 w-6 text-blue-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")}
              />
              <div className={cn(isRTL && "text-right", "flex-1")}>
                <DialogTitle
                  className={cn("text-xl", isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("Billing & Payments")} - {vendorName || t("Vendor")}
                </DialogTitle>
                <DialogDescription
                  className={cn(isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("View and manage billing and payment records")}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir={isRTL ? "rtl" : "ltr"}>
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardContent className="p-4" dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("flex items-center", isRTL ? "justify-between flex-row-reverse" : "justify-between")}>
                    <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Total Amount")}
                      </p>
                      <p className={cn("text-2xl font-bold text-blue-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {formatAmount(summary.totalAmount)}
                      </p>
                    </div>
                    <DollarSign className={cn("h-8 w-8 text-blue-600 flex-shrink-0", isRTL && "order-2")} />
                  </div>
                </CardContent>
              </Card>

              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardContent className="p-4" dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("flex items-center", isRTL ? "justify-between flex-row-reverse" : "justify-between")}>
                    <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Paid Amount")}
                      </p>
                      <p className={cn("text-2xl font-bold text-green-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {formatAmount(summary.paidAmount)}
                      </p>
                    </div>
                    <CheckCircle className={cn("h-8 w-8 text-green-600 flex-shrink-0", isRTL && "order-2")} />
                  </div>
                </CardContent>
              </Card>

              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardContent className="p-4" dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("flex items-center", isRTL ? "justify-between flex-row-reverse" : "justify-between")}>
                    <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Pending")}
                      </p>
                      <p className={cn("text-2xl font-bold text-orange-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {formatAmount(summary.pendingAmount)}
                      </p>
                    </div>
                    <Clock className={cn("h-8 w-8 text-orange-600 flex-shrink-0", isRTL && "order-2")} />
                  </div>
                </CardContent>
              </Card>

              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardContent className="p-4" dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("flex items-center", isRTL ? "justify-between flex-row-reverse" : "justify-between")}>
                    <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Monthly Avg")}
                      </p>
                      <p className={cn("text-2xl font-bold text-purple-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {formatAmount(summary.averageMonthlySpend)}
                      </p>
                    </div>
                    <TrendingUp className={cn("h-8 w-8 text-purple-600 flex-shrink-0", isRTL && "order-2")} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Status */}
          {summary?.overdueAmount > 0 && (
            <div className={cn("bg-red-50 border border-red-200 rounded-lg p-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                <AlertTriangle className={cn("h-5 w-5 text-red-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                  <h3 className={cn("text-sm font-medium text-red-800", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    {t("Overdue Payments")}
                  </h3>
                  <p className={cn("text-sm text-red-700", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    {t("You have {{amount}} in overdue payments.", { amount: formatAmount(summary.overdueAmount) })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardContent className="p-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn("flex gap-4", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Label htmlFor="year-filter" className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Year")}
                    </Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className={cn("w-32", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()} dir={isRTL ? "rtl" : "ltr"}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Label htmlFor="month-filter" className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Month")}
                    </Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className={cn("w-40", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        <SelectValue placeholder={t("All months")} />
                      </SelectTrigger>
                      <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                        <SelectItem value="all" dir={isRTL ? "rtl" : "ltr"}>{t("All months")}</SelectItem>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value} dir={isRTL ? "rtl" : "ltr"}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                  <Button variant="outline" size="sm" className={cn("flex items-center", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                    <Download className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-1 order-2" : "mr-1")} />
                    {t("Export")}
                  </Button>
                  <Button variant="outline" size="sm" className={cn("flex items-center", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                    <Plus className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-1 order-2" : "mr-1")} />
                    {t("Record Payment")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <CreditCard className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Payment History")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              {isLoading ? (
                <div className={cn("flex items-center justify-center py-8", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <Loader2 className={cn("h-8 w-8 animate-spin mx-auto mb-4", isRTL && "order-2")} />
                    <p className={cn("text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Loading payment history...")}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto" dir={isRTL ? "rtl" : "ltr"}>
                    <Table dir={isRTL ? "rtl" : "ltr"}>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Date")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Amount")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Method")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Reference")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Status")}</TableHead>
                          <TableHead className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>{t("Notes")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className={cn("font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {formatDate(payment.paymentDate)}
                            </TableCell>
                            <TableCell className={cn("font-semibold", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {formatAmount(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                                <CreditCard className={cn("h-4 w-4 text-gray-400 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                  {getPaymentMethodLabel(payment.paymentMethod)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className={cn("font-mono text-sm", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                              {payment.reference || "-"}
                            </TableCell>
                            <TableCell>
                              <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2 flex-row-reverse" : "space-x-2")}>
                                {getStatusIcon(payment.status)}
                                <Badge className={cn(getStatusColor(payment.status), isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                  {getStatusLabel(payment.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={cn("max-w-xs", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                <p className={cn("text-sm truncate", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} title={payment.notes}>
                                  {payment.notes || "-"}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {payments.length === 0 && (
                    <div className={cn("text-center py-8", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className={cn("text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("No payment records found")}
                      </p>
                      <p className={cn("text-sm text-gray-500", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Try adjusting your filters or date range")}
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

          {/* Payment Summary */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir={isRTL ? "rtl" : "ltr"}>
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Payment Schedule")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      isRTL && "text-right"
                    )}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <div className={cn("space-y-1.5", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <label className={cn("text-sm font-medium text-gray-500 block", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Last Payment")}
                      </label>
                      <p className={cn("text-sm", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {summary.lastPaymentDate
                          ? formatDate(summary.lastPaymentDate)
                          : t("No payments yet")}
                      </p>
                    </div>
                    <div className={cn("space-y-1.5", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <label className={cn("text-sm font-medium text-gray-500 block", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Next Payment Due")}
                      </label>
                      <p className={cn("text-sm", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {summary.nextPaymentDue
                          ? formatDate(summary.nextPaymentDue)
                          : t("No scheduled payments")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <TrendingUp className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Payment Statistics")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      isRTL && "text-right"
                    )}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <div className={cn("space-y-1.5", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <label className={cn("text-sm font-medium text-gray-500 block", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Payment Completion Rate")}
                      </label>
                      <p className={cn("text-lg font-semibold text-green-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {summary.totalAmount > 0 
                          ? Math.round((summary.paidAmount / summary.totalAmount) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className={cn("space-y-1.5", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      <label className={cn("text-sm font-medium text-gray-500 block", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Outstanding Balance")}
                      </label>
                      <p className={cn("text-lg font-semibold text-blue-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {formatAmount(summary.totalAmount - summary.paidAmount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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

export default BillingPaymentsModal; 