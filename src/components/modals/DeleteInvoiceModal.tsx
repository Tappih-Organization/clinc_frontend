import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import {
  AlertTriangle,
  Trash2,
  Receipt,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService, type Invoice } from "@/services/api";
import { formatDate } from "@/utils/dateUtils";

interface DeleteInvoiceModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteInvoiceModal: React.FC<DeleteInvoiceModalProps> = ({
  invoiceId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!invoiceId) return;

    try {
      setDeleting(true);
      await apiService.deleteInvoice(invoiceId);

      toast({
        title: t("Invoice deleted successfully"),
        description: t("Invoice {{number}} has been permanently deleted.", { number: invoice?.invoice_number }),
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: t("Error"),
        description: t("Failed to delete invoice. Please try again."),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // formatDate is now imported from dateUtils

  const getPatientDisplay = (patient: string | { _id: string; first_name: string; last_name: string; phone?: string; email?: string }) => {
    if (typeof patient === 'string') {
      return patient;
    }
    return `${patient.first_name} ${patient.last_name}`;
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

  const canBeDeleted = invoice && (
    invoice.status === "pending" || 
    invoice.status === "cancelled" || 
    invoice.status === "draft"
  );

  const isDangerous = invoice && invoice.status === "paid";

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-md", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center text-xl text-red-600", isRTL && "flex-row-reverse")}>
            <AlertTriangle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
            {t("Delete Invoice")}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && "text-right")}>
            {t("This action cannot be undone. Please review the invoice details before confirming.")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className={cn("flex items-center justify-center h-32", isRTL && "flex-row-reverse")}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>{t("Loading invoice...")}</span>
          </div>
        ) : invoice ? (
          <div className="space-y-4">
            {/* Warning message */}
            <div className={cn(`p-4 rounded-lg border ${
              isDangerous 
                ? "bg-red-50 border-red-200" 
                : canBeDeleted 
                  ? "bg-yellow-50 border-yellow-200" 
                  : "bg-gray-50 border-gray-200"
            }`, isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("flex items-start", isRTL ? "flex-row-reverse space-x-reverse space-x-3" : "space-x-3")}>
                <AlertTriangle className={cn(`h-5 w-5 mt-0.5 flex-shrink-0`, {
                  "text-red-600": isDangerous,
                  "text-yellow-600": canBeDeleted && !isDangerous,
                  "text-gray-600": !canBeDeleted && !isDangerous
                })} />
                <div className={cn("text-sm flex-1", isRTL && "text-right")}>
                  {isDangerous ? (
                    <>
                      <p className={cn("font-semibold text-red-800 mb-1", isRTL && "text-right")}>
                        ⚠️ {t("High Risk Operation")}
                      </p>
                      <p className={cn("text-red-700", isRTL && "text-right")}>
                        {t("This invoice has been paid and deleting it may cause accounting discrepancies. Consider cancelling instead of deleting.")}
                      </p>
                    </>
                  ) : canBeDeleted ? (
                    <>
                      <p className={cn("font-semibold text-yellow-800 mb-1", isRTL && "text-right")}>
                        {t("Confirm Deletion")}
                      </p>
                      <p className={cn("text-yellow-700", isRTL && "text-right")}>
                        {t("This will permanently remove the invoice and all associated records.")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={cn("font-semibold text-gray-800 mb-1", isRTL && "text-right")}>
                        {t("Cannot Delete")}
                      </p>
                      <p className={cn("text-gray-700", isRTL && "text-right")}>
                        {t("This invoice cannot be deleted due to its current status.")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <Card>
              <CardContent className={cn("p-4 space-y-3", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                    <Receipt className={cn("h-4 w-4 text-blue-600 flex-shrink-0", isRTL ? "ml-2" : "mr-0")} />
                    <span className={cn("font-semibold", isRTL && "text-right")}>#{invoice.invoice_number}</span>
                  </div>
                  <Badge className={cn(`text-xs ${getStatusColor(invoice.status)}`, isRTL && "mr-2")}>
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>

                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <User className={cn("h-3 w-3 text-gray-500 flex-shrink-0", isRTL ? "ml-2" : "mr-0")} />
                      <span className={cn("text-gray-600", isRTL && "text-right")}>{t("Patient")}:</span>
                    </div>
                    <span className={cn("font-medium", isRTL && "text-right")}>{getPatientDisplay(invoice.patient_id)}</span>
                  </div>

                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <DollarSign className={cn("h-3 w-3 text-gray-500 flex-shrink-0", isRTL ? "ml-2" : "mr-0")} />
                      <span className={cn("text-gray-600", isRTL && "text-right")}>{t("Amount")}:</span>
                    </div>
                    <span className={cn("font-semibold text-green-600", isRTL && "text-right")}>
                      <CurrencyDisplay amount={invoice.total_amount} />
                    </span>
                  </div>

                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <Calendar className={cn("h-3 w-3 text-gray-500 flex-shrink-0", isRTL ? "ml-2" : "mr-0")} />
                      <span className={cn("text-gray-600", isRTL && "text-right")}>{t("Created")}:</span>
                    </div>
                    <span className={cn(isRTL && "text-right")}>{formatDate(invoice.created_at)}</span>
                  </div>

                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <Calendar className={cn("h-3 w-3 text-gray-500 flex-shrink-0", isRTL ? "ml-2" : "mr-0")} />
                      <span className={cn("text-gray-600", isRTL && "text-right")}>{t("Due Date")}:</span>
                    </div>
                    <span className={cn(isRTL && "text-right")}>{formatDate(invoice.due_date)}</span>
                  </div>

                  {invoice.paid_at && (
                    <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                        <Calendar className={cn("h-3 w-3 text-gray-500 flex-shrink-0", isRTL ? "ml-2" : "mr-0")} />
                        <span className={cn("text-gray-600", isRTL && "text-right")}>{t("Paid")}:</span>
                      </div>
                      <span className={cn("text-green-600 font-medium", isRTL && "text-right")}>
                        {formatDate(invoice.paid_at)}
                      </span>
                    </div>
                  )}
                </div>

                {invoice.services && invoice.services.length > 0 && (
                  <div className={cn("pt-2 border-t", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <p className={cn("text-xs text-gray-500 mb-1", isRTL && "text-right")}>{t("Services")}:</p>
                    <div className={cn("text-sm space-y-1", isRTL && "text-right")}>
                      {invoice.services.slice(0, 3).map((service, index) => (
                        <div key={index} className={cn("flex justify-between items-center", isRTL && "flex-row-reverse")}>
                          <span className={cn("text-gray-700 truncate flex-1", isRTL && "text-right ml-2")}>
                            {service.description}
                          </span>
                          <span className={cn("text-gray-600 flex-shrink-0", isRTL && "mr-2")}>
                            <CurrencyDisplay amount={service.total} />
                          </span>
                        </div>
                      ))}
                      {invoice.services.length > 3 && (
                        <p className={cn("text-xs text-gray-500", isRTL && "text-right")}>
                          +{invoice.services.length - 3} {t("more items")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className={cn("flex items-center justify-center h-32", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
            <div className={cn("text-center", isRTL && "text-right")}>
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className={cn("text-gray-500", isRTL && "text-right")}>{t("Invoice not found")}</p>
            </div>
          </div>
        )}

        <DialogFooter className={cn(isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")} dir={isRTL ? "rtl" : "ltr"}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className={cn(isRTL && "flex-row-reverse")}
          >
            {t("Cancel")}
          </Button>
          
          {invoice && canBeDeleted && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className={cn(isRTL && "flex-row-reverse")}
            >
              {deleting ? (
                <>
                  <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-white flex-shrink-0", isRTL ? "ml-2" : "mr-2")}></div>
                  <span>{t("Deleting...")}</span>
                </>
              ) : (
                <>
                  <Trash2 className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t("Delete Invoice")}</span>
                </>
              )}
            </Button>
          )}
          
          {invoice && isDangerous && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className={cn("bg-red-700 hover:bg-red-800", isRTL && "flex-row-reverse")}
            >
              {deleting ? (
                <>
                  <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-white flex-shrink-0", isRTL ? "ml-2" : "mr-2")}></div>
                  <span>{t("Force Deleting...")}</span>
                </>
              ) : (
                <>
                  <Trash2 className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2" : "mr-2")} />
                  <span>{t("Force Delete")}</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteInvoiceModal; 