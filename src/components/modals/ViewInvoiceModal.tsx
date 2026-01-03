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

  const formatDate = (dateString: string) => {
    const locale = i18n.language || 'en';
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center text-xl", isRTL && "flex-row-reverse")}>
            <Receipt className={cn("h-5 w-5 text-blue-600", isRTL ? "ml-2" : "mr-2")} />
            {t("Invoice Details")}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && "text-right")}>
            {t("View complete invoice information and payment details")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>{t("Loading invoice...")}</span>
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className={cn(isRTL && "text-right")}>
                    <CardTitle className="text-lg">{t("Invoice #")} {invoice.invoice_number}</CardTitle>
                    <p className={cn("text-sm text-gray-600", isRTL && "text-right")}>
                      {t("Created on")} {formatDate(invoice.created_at)}
                    </p>
                  </div>
                  <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className={`${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                    <span className={cn(isRTL ? "ml-2" : "mr-2")}>
                      {getStatusIcon(invoice.status)}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}>
                  <User className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("Patient Information")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={cn(isRTL && "text-right")}>
                    <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")}>{t("Patient Name")}</p>
                    <p className={cn("text-lg font-semibold", isRTL && "text-right")}>{getPatientDisplay(invoice.patient_id)}</p>
                  </div>
                  {getPatientContact(invoice.patient_id).phone && (
                    <div className={cn(isRTL && "text-right")}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")}>{t("Phone")}</p>
                      <p className={cn("text-lg", isRTL && "text-right")}>{getPatientContact(invoice.patient_id).phone}</p>
                    </div>
                  )}
                  {getPatientContact(invoice.patient_id).email && (
                    <div className={cn(isRTL && "text-right")}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")}>{t("Email")}</p>
                      <p className={cn("text-lg", isRTL && "text-right")}>{getPatientContact(invoice.patient_id).email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Dates */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}>
                  <Calendar className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("Important Dates")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={cn(isRTL && "text-right")}>
                    <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")}>{t("Issue Date")}</p>
                    <p className={cn("text-lg", isRTL && "text-right")}>{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div className={cn(isRTL && "text-right")}>
                    <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")}>{t("Due Date")}</p>
                    <p className={cn(`text-lg ${invoice.status === "overdue" ? "text-red-600 font-semibold" : ""}`, isRTL && "text-right")}>
                      {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  {invoice.paid_at && (
                    <div className={cn(isRTL && "text-right")}>
                      <p className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")}>{t("Payment Date")}</p>
                      <p className={cn("text-lg text-green-600", isRTL && "text-right")}>{formatDate(invoice.paid_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}>
                  <FileText className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("Services & Items")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.services.map((service, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={cn("md:col-span-2", isRTL && "text-right")}>
                          <p className={cn("font-medium", isRTL && "text-right")}>{service.description}</p>
                          <Badge variant="outline" className={cn("mt-1", isRTL && "mr-0")}>
                            {service.type}
                          </Badge>
                        </div>
                        <div className={cn("text-center", isRTL && "text-right")}>
                          <p className={cn("text-sm text-gray-600", isRTL && "text-right")}>{t("Quantity")}</p>
                          <p className={cn("font-semibold", isRTL && "text-right")}>{service.quantity}</p>
                        </div>
                        <div className={cn("text-center", isRTL && "text-right")}>
                          <p className={cn("text-sm text-gray-600", isRTL && "text-right")}>{t("Unit Price")}</p>
                          <p className={cn("font-semibold", isRTL && "text-right")}>
                            <CurrencyDisplay amount={service.unit_price} />
                          </p>
                        </div>
                      </div>
                      <div className={cn("mt-2", isRTL ? "text-left" : "text-right")}>
                        <p className={cn("text-lg font-bold", isRTL && "text-right")}>
                          {t("Total")}: <CurrencyDisplay amount={service.total} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}>
                  <DollarSign className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("Payment Summary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("bg-gray-50 p-4 rounded-lg space-y-2", isRTL && "text-right")}>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span>{t("Subtotal")}:</span>
                    <span><CurrencyDisplay amount={invoice.subtotal} /></span>
                  </div>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span>{t("Tax")}:</span>
                    <span><CurrencyDisplay amount={invoice.tax_amount} /></span>
                  </div>
                  {invoice.discount && invoice.discount > 0 && (
                    <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                      <span>{t("Discount")}:</span>
                      <span className="text-green-600">-<CurrencyDisplay amount={invoice.discount} /></span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className={cn("flex justify-between font-bold text-xl", isRTL && "flex-row-reverse")}>
                    <span>{t("Total Amount")}:</span>
                    <span className="text-green-600">
                      <CurrencyDisplay amount={invoice.total_amount} variant="large" />
                    </span>
                  </div>
                  {invoice.payment_method && (
                    <div className={cn("mt-4 pt-2 border-t", isRTL && "text-right")}>
                      <p className={cn("text-sm text-gray-600", isRTL && "text-right")}>{t("Payment Method")}:</p>
                      <p className={cn("font-medium capitalize", isRTL && "text-right")}>{invoice.payment_method.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className={cn("text-lg", isRTL && "text-right")}>{t("Notes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={cn("text-gray-700 whitespace-pre-wrap", isRTL && "text-right")}>{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className={cn("text-center", isRTL && "text-right")}>
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className={cn("text-lg font-medium text-gray-900", isRTL && "text-right")}>{t("Invoice not found")}</p>
              <p className={cn("text-gray-500", isRTL && "text-right")}>{t("The requested invoice could not be loaded.")}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={cn("flex pt-4 border-t", isRTL ? "justify-start space-x-reverse space-x-4" : "justify-end space-x-4")}>
          <Button variant="outline" onClick={onClose}>
            {t("Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInvoiceModal; 