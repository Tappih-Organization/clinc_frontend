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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  CreditCard,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService, type Payment } from "@/services/api";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateUtils";

interface ViewPaymentModalProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewPaymentModal: React.FC<ViewPaymentModalProps> = ({
  paymentId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchPayment();
    }
  }, [isOpen, paymentId]);

  const fetchPayment = async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      const paymentData = await apiService.getPayment(paymentId);
      setPayment(paymentData);
    } catch (error) {
      console.error("Error fetching payment:", error);
      toast({
        title: t("Error"),
        description: t("Failed to load payment details. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "refunded":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-orange-100 text-orange-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="h-4 w-4 text-gray-500" />;
      case "cash":
        return <DollarSign className="h-4 w-4 text-gray-500" />;
      case "bank_transfer":
        return <DollarSign className="h-4 w-4 text-gray-500" />;
      case "upi":
        return <CreditCard className="h-4 w-4 text-gray-500" />;
      case "insurance":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("Copied"),
      description: `${label} ${t("copied to clipboard")}`,
    });
  };

  const getPatientDisplay = (patient: string | { _id: string; first_name: string; last_name: string; email?: string } | null) => {
    if (!patient) return t("Unknown Patient");
    if (typeof patient === 'string') return patient;
    return `${patient.first_name} ${patient.last_name}`;
  };

  const getPatientEmail = (patient: string | { _id: string; first_name: string; last_name: string; email?: string } | null) => {
    if (!patient || typeof patient === 'string') return '';
    return patient.email || '';
  };

  const getInvoiceDisplay = (invoice: string | { _id: string; invoice_number: string; total_amount: number } | null) => {
    if (!invoice) return t("N/A");
    if (typeof invoice === 'string') return invoice;
    return invoice.invoice_number || invoice._id;
  };

  // Standardized Info Row Component for consistent RTL alignment
  const InfoRow: React.FC<{
    label: string;
    value: React.ReactNode;
    valueDir?: "ltr" | "rtl";
    icon?: React.ReactNode;
    className?: string;
  }> = ({ label, value, valueDir, icon, className = "" }) => {
    const finalValueDir = valueDir || (isRTL ? "rtl" : "ltr");
    const isLTRContent = finalValueDir === "ltr";
    return (
      <div
        className={cn("space-y-1.5", className)}
        dir={isRTL ? "rtl" : "ltr"}
        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
      >
        <label
          className={cn(
            "text-sm font-medium text-gray-500 block leading-tight",
            isRTL ? "text-right" : "text-left"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
        >
          {label}
        </label>
        <div
          className={cn(
            "flex items-baseline min-h-[1.5rem]",
            isRTL ? "flex-row-reverse justify-end" : "justify-start",
            icon && "gap-2"
          )}
          style={isRTL && !isLTRContent ? { justifyContent: "flex-end" } : {}}
        >
          {icon && (
            <span className={cn("flex-shrink-0 self-center", isRTL && "order-2")}>
              {icon}
            </span>
          )}
          <p
            className={cn(
              "text-base leading-normal break-words",
              isLTRContent ? "text-left" : isRTL ? "text-right" : "text-left"
            )}
            dir={finalValueDir}
            style={
              isLTRContent
                ? { textAlign: "left", direction: "ltr" }
                : isRTL
                  ? { textAlign: "right", direction: "rtl" }
                  : { textAlign: "left", direction: "ltr" }
            }
          >
            {value}
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-5xl max-h-[95vh] overflow-y-auto z-50", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <CreditCard
              className={cn(
                "h-6 w-6 text-blue-600 flex-shrink-0",
                isRTL ? "order-2" : ""
              )}
            />
            <div className="flex-1 min-w-0">
              <DialogTitle
                className="text-xl font-semibold"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Payment Details")}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Complete information about this payment transaction")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : payment ? (
          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Basic Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Info className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Basic Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Payment ID")}
                    value={
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <span className="font-mono text-sm">{payment._id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(payment._id, t("Payment ID"))}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    }
                    valueDir="ltr"
                  />
                  {payment.transaction_id && (
                    <InfoRow
                      label={t("Transaction ID")}
                      value={
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          <span className="font-mono text-sm">{payment.transaction_id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(payment.transaction_id!, t("Transaction ID"))}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      }
                      valueDir="ltr"
                    />
                  )}
                  <InfoRow
                    label={t("Status")}
                    value={
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {getStatusIcon(payment.status)}
                        <Badge
                          className={cn(getStatusColor(payment.status))}
                          dir="ltr"
                          style={{ textAlign: "left", direction: "ltr" }}
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                    }
                  />
                  <InfoRow
                    label={t("Payment Date")}
                    value={formatDate(payment.payment_date)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Amount Details */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <DollarSign className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Amount Details")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-3 gap-4",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <div className={cn("text-center p-4 bg-gray-50 rounded-lg", isRTL && "text-right")}>
                    <p className="text-sm font-medium text-gray-600">{t("Total Amount")}</p>
                    <CurrencyDisplay 
                      amount={payment.amount} 
                      className="text-2xl font-bold text-gray-900"
                    />
                  </div>
                  <div className={cn("text-center p-4 bg-gray-50 rounded-lg", isRTL && "text-right")}>
                    <p className="text-sm font-medium text-gray-600">{t("Processing Fee")}</p>
                    <CurrencyDisplay 
                      amount={payment.processing_fee || 0} 
                      className="text-xl font-semibold text-orange-600"
                    />
                  </div>
                  <div className={cn("text-center p-4 bg-green-50 rounded-lg", isRTL && "text-right")}>
                    <p className="text-sm font-medium text-gray-600">{t("Net Amount")}</p>
                    <CurrencyDisplay 
                      amount={payment.net_amount || payment.amount} 
                      className="text-xl font-semibold text-green-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {getPaymentMethodIcon(payment.method)}
                  <span className={cn(isRTL ? "mr-2" : "ml-2")}>{t("Payment Method")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Method")}
                    value={payment.method.replace('_', ' ').charAt(0).toUpperCase() + payment.method.replace('_', ' ').slice(1)}
                  />
                  {payment.card_last4 && (
                    <InfoRow
                      label={t("Card Ending")}
                      value={<span className="font-mono">****{payment.card_last4}</span>}
                      valueDir="ltr"
                    />
                  )}
                  {payment.insurance_provider && (
                    <InfoRow
                      label={t("Insurance Provider")}
                      value={payment.insurance_provider}
                      className="md:col-span-2"
                    />
                  )}
                  {payment.description && (
                    <InfoRow
                      label={t("Description")}
                      value={payment.description}
                      className="md:col-span-2"
                    />
                  )}
                  {payment.failure_reason && (
                    <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className={cn("text-sm font-medium text-red-600", isRTL && "text-right")}>
                        {t("Failure Reason")}
                      </p>
                      <p className={cn("text-sm text-red-700 mt-1", isRTL && "text-right")}>
                        {payment.failure_reason}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Related Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Patient")}
                    value={
                      <div>
                        <p className="font-medium">{getPatientDisplay(payment.patient_id)}</p>
                        {getPatientEmail(payment.patient_id) && (
                          <p className="text-sm text-gray-500 mt-1">{getPatientEmail(payment.patient_id)}</p>
                        )}
                      </div>
                    }
                    icon={<User className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Invoice")}
                    value={
                      <div>
                        <p className="font-medium">{getInvoiceDisplay(payment.invoice_id)}</p>
                        {typeof payment.invoice_id === 'object' && payment.invoice_id && (
                          <p className="text-sm text-gray-500 mt-1">
                            {t("Total")}: <CurrencyDisplay amount={payment.invoice_id.total_amount} />
                          </p>
                        )}
                      </div>
                    }
                  />
                  <InfoRow
                    label={t("Created")}
                    value={formatDate(payment.created_at)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Updated")}
                    value={formatDate(payment.updated_at)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className={cn("text-center py-8", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">{t("Payment not found")}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className={cn("flex justify-end items-center pt-6 border-t", isRTL && "flex-row-reverse")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Button
            variant="outline"
            onClick={onClose}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
          >
            {t("Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPaymentModal;
