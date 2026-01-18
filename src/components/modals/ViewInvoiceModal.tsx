import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import {
  Receipt,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService, type Invoice } from "@/services/api";
import { formatDate } from "@/utils/dateUtils";

interface ViewInvoiceModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({ 
  invoiceId, 
  isOpen, 
  onClose 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice();
    }
  }, [isOpen, invoiceId]);

  const loadInvoice = async () => {
    if (!invoiceId) return;
    
    try {
      setLoading(true);
      const invoiceData = await apiService.getInvoice(invoiceId);
      setInvoice(invoiceData);
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast({
        title: t("Error"),
        description: t("Failed to load invoice details."),
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // formatDate is now imported from dateUtils

  const getPatientDisplay = (patient: string | { _id: string; first_name: string; last_name: string; phone?: string; email?: string }) => {
    if (typeof patient === 'string') {
      return patient;
    }
    return `${patient.first_name} ${patient.last_name}`;
  };

  const getPatientContact = (patient: string | { _id: string; first_name: string; last_name: string; phone?: string; email?: string }) => {
    if (typeof patient === 'string') {
      return {};
    }
    return {
      phone: patient.phone,
      email: patient.email,
    };
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
        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
      >
        <label 
          className={cn(
            "text-sm font-medium text-gray-500 block leading-tight",
            isRTL ? "text-right" : "text-left"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
        >
          {label}
        </label>
        <div 
          className={cn(
            "flex items-baseline min-h-[1.5rem]",
            isRTL ? "flex-row-reverse justify-end" : "justify-start",
            icon && "gap-2"
          )}
          style={isRTL && !isLTRContent ? { justifyContent: 'flex-end' } : {}}
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
            style={isLTRContent 
              ? { textAlign: 'left', direction: 'ltr' } 
              : isRTL 
                ? { textAlign: 'right', direction: 'rtl' } 
                : { textAlign: 'left', direction: 'ltr' }
            }
          >
            {value}
          </p>
        </div>
      </div>
    );
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "paid": t("Paid"),
      "pending": t("Pending"),
      "overdue": t("Overdue"),
      "cancelled": t("Cancelled"),
    };
    return statusMap[status.toLowerCase()] || status.toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isRTL && "rtl")} 
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <Receipt
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
                {t("Invoice Details")}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("View complete invoice information and payment details")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div 
            className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span 
              className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
            >
              {t("Loading invoice...")}
            </span>
          </div>
        ) : invoice ? (
          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Invoice Header */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle 
                  className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Basic Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div 
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <InfoRow
                    label={t("Invoice Number")}
                    value={invoice.invoice_number}
                    className="text-lg font-semibold"
                    valueDir="ltr"
                  />
                  <InfoRow
                    label={t("Status")}
                    value={
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {getStatusIcon(invoice.status)}
                        <Badge
                          className={cn(getStatusColor(invoice.status))}
                          dir="ltr"
                          style={{ textAlign: "left", direction: "ltr" }}
                        >
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </div>
                    }
                  />
                  <InfoRow
                    label={t("Created on")}
                    value={formatDate(invoice.created_at)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patient Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle 
                  className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <User className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Patient Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div 
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <InfoRow
                    label={t("Patient Name")}
                    value={getPatientDisplay(invoice.patient_id)}
                    className="text-lg font-semibold"
                  />
                  {getPatientContact(invoice.patient_id).phone && (
                    <InfoRow
                      label={t("Phone")}
                      value={getPatientContact(invoice.patient_id).phone}
                      valueDir="ltr"
                    />
                  )}
                  {getPatientContact(invoice.patient_id).email && (
                    <InfoRow
                      label={t("Email")}
                      value={getPatientContact(invoice.patient_id).email}
                      valueDir="ltr"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Dates */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle 
                  className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Important Dates")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div 
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-3 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <InfoRow
                    label={t("Issue Date")}
                    value={formatDate(invoice.issue_date)}
                  />
                  <InfoRow
                    label={t("Due Date")}
                    value={formatDate(invoice.due_date)}
                    className={invoice.status === "overdue" ? "text-red-600 font-semibold" : ""}
                  />
                  {invoice.paid_at && (
                    <InfoRow
                      label={t("Payment Date")}
                      value={formatDate(invoice.paid_at)}
                      className="text-green-600"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle 
                  className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Services & Items")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className="space-y-4">
                  {invoice.services.map((service, index) => (
                    <div 
                      key={index} 
                      className={cn("border rounded-lg p-4", isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                    >
                      <div 
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-4 gap-6",
                          isRTL && "text-right"
                        )}
                        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                      >
                        {/* Description - Right side in RTL */}
                        <div className={cn("md:col-span-2", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          <p 
                            className={cn("font-medium text-lg", isRTL && "text-right")}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                          >
                            {service.description}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn("mt-2", isRTL && "text-right")}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                          >
                            {service.type}
                          </Badge>
                        </div>
                        {/* Quantity - Right aligned in RTL */}
                        <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          <p 
                            className={cn("text-sm font-medium text-gray-500 block mb-1", isRTL && "text-right")}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                          >
                            {t("Quantity")}
                          </p>
                          <p 
                            className="font-semibold text-lg"
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                          >
                            {service.quantity}
                          </p>
                        </div>
                        {/* Unit Price - Right aligned in RTL */}
                        <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          <p 
                            className={cn("text-sm font-medium text-gray-500 block mb-1", isRTL && "text-right")}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                          >
                            {t("Unit Price")}
                          </p>
                          <p 
                            className="font-semibold text-lg"
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                          >
                            <CurrencyDisplay amount={service.unit_price} />
                          </p>
                        </div>
                      </div>
                      {/* Total - Right aligned in RTL */}
                      <div 
                        className={cn("mt-4 pt-3 border-t", isRTL && "text-right")}
                        dir="ltr"
                        style={{ textAlign: 'right' }}
                      >
                        <p className="text-lg font-bold">
                          {t("Total")}: <CurrencyDisplay amount={service.total} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle 
                  className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <DollarSign className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Payment Summary")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div 
                  className={cn("bg-gray-50 p-4 rounded-lg space-y-2", isRTL && "text-right")} 
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                      {t("Subtotal")}
                    </span>
                    <span dir="ltr" style={{ textAlign: 'right' }}>
                      <CurrencyDisplay amount={invoice.subtotal} />
                    </span>
                  </div>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                      {t("Tax")}
                    </span>
                    <span dir="ltr" style={{ textAlign: 'right' }}>
                      <CurrencyDisplay amount={invoice.tax_amount} />
                    </span>
                  </div>
                  {invoice.discount && invoice.discount > 0 && (
                    <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                      <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                        {t("Discount")}
                      </span>
                      <span className="text-green-600" dir="ltr" style={{ textAlign: 'right' }}>
                        -<CurrencyDisplay amount={invoice.discount} />
                      </span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className={cn("flex justify-between font-bold text-xl", isRTL && "flex-row-reverse")}>
                    <span dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                      {t("Total Amount")}
                    </span>
                    <span className="text-green-600" dir="ltr" style={{ textAlign: 'right' }}>
                      <CurrencyDisplay amount={invoice.total_amount} variant="large" />
                    </span>
                  </div>
                  {invoice.payment_method && (
                    <div 
                      className={cn("mt-4 pt-2 border-t", isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                    >
                      <p 
                        className={cn("text-sm text-gray-600", isRTL && "text-right")}
                        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                      >
                        {t("Payment Method")}:
                      </p>
                      <p 
                        className={cn("font-medium capitalize", isRTL && "text-right")}
                        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                      >
                        {invoice.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle 
                    className={cn("text-lg", isRTL && "text-right")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                  >
                    {t("Notes")}
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <p 
                    className={cn("text-gray-700 whitespace-pre-wrap break-words", isRTL && "text-right")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: 'right', direction: 'rtl' } : { textAlign: 'left', direction: 'ltr' }}
                  >
                    {invoice.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div 
            className="flex items-center justify-center h-64"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div 
              className={cn("text-center", isRTL && "text-right")}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
            >
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p 
                className={cn("text-lg font-medium text-gray-900", isRTL && "text-right")}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                {t("Invoice not found")}
              </p>
              <p 
                className={cn("text-gray-500", isRTL && "text-right")}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                {t("The requested invoice could not be loaded.")}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div 
          className={cn("flex pt-6 border-t", isRTL && "flex-row-reverse")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Button 
            variant="outline" 
            onClick={onClose}
            className={cn(isRTL && "text-right")}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            {t("Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInvoiceModal; 