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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center text-xl text-red-600", isRTL && "flex-row-reverse")}>
            <AlertTriangle className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
            {t("Delete Invoice")}
          </DialogTitle>
          <DialogDescription>
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
            <div className={`p-4 rounded-lg border ${
              isDangerous 
                ? "bg-red-50 border-red-200" 
                : canBeDeleted 
                  ? "bg-yellow-50 border-yellow-200" 
                  : "bg-gray-50 border-gray-200"
            }`}>
              <div className={cn("flex items-start", isRTL ? "flex-row-reverse space-x-reverse space-x-3" : "space-x-3")}>
                <AlertTriangle className={cn(`h-5 w-5 mt-0.5`, isRTL && "mt-0.5", {
                  "text-red-600": isDangerous,
                  "text-yellow-600": canBeDeleted && !isDangerous,
                  "text-gray-600": !canBeDeleted && !isDangerous
                })} />
                <div className="text-sm">
                  {isDangerous ? (
                    <>
                      <p className="font-semibold text-red-800 mb-1">
                        ⚠️ {t("High Risk Operation")}
                      </p>
                      <p className="text-red-700">
                        {t("This invoice has been paid and deleting it may cause accounting discrepancies. Consider cancelling instead of deleting.")}
                      </p>
                    </>
                  ) : canBeDeleted ? (
                    <>
                      <p className="font-semibold text-yellow-800 mb-1">
                        {t("Confirm Deletion")}
                      </p>
                      <p className="text-yellow-700">
                        {t("This will permanently remove the invoice and all associated records.")}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800 mb-1">
                        {t("Cannot Delete")}
                      </p>
                      <p className="text-gray-700">
                        {t("This invoice cannot be deleted due to its current status.")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                    <Receipt className={cn("h-4 w-4 text-blue-600", isRTL && "ml-0")} />
                    <span className="font-semibold">#{invoice.invoice_number}</span>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <User className={cn("h-3 w-3 text-gray-500", isRTL && "ml-0")} />
                      <span className="text-gray-600">{t("Patient")}:</span>
                    </div>
                    <span className="font-medium">{getPatientDisplay(invoice.patient_id)}</span>
                  </div>

                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <DollarSign className={cn("h-3 w-3 text-gray-500", isRTL && "ml-0")} />
                      <span className="text-gray-600">{t("Amount")}:</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      <CurrencyDisplay amount={invoice.total_amount} />
                    </span>
                  </div>

                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <Calendar className={cn("h-3 w-3 text-gray-500", isRTL && "ml-0")} />
                      <span className="text-gray-600">{t("Created")}:</span>
                    </div>
                    <span>{formatDate(invoice.created_at)}</span>
                  </div>

                  <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                    <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                      <Calendar className={cn("h-3 w-3 text-gray-500", isRTL && "ml-0")} />
                      <span className="text-gray-600">{t("Due Date")}:</span>
                    </div>
                    <span>{formatDate(invoice.due_date)}</span>
                  </div>

                  {invoice.paid_at && (
                    <div className={cn("flex items-center justify-between text-sm", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
                        <Calendar className={cn("h-3 w-3 text-gray-500", isRTL && "ml-0")} />
                        <span className="text-gray-600">{t("Paid")}:</span>
                      </div>
                      <span className="text-green-600 font-medium">
                        {formatDate(invoice.paid_at)}
                      </span>
                    </div>
                  )}
                </div>

                {invoice.services && invoice.services.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">{t("Services")}:</p>
                    <div className="text-sm space-y-1">
                      {invoice.services.slice(0, 3).map((service, index) => (
                        <div key={index} className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                          <span className="text-gray-700 truncate">
                            {service.description}
                          </span>
                          <span className="text-gray-600">
                            <CurrencyDisplay amount={service.total} />
                          </span>
                        </div>
                      ))}
                      {invoice.services.length > 3 && (
                        <p className="text-xs text-gray-500">
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
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t("Invoice not found")}</p>
            </div>
          </div>
        )}

        <DialogFooter className={cn(isRTL ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2")}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
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
                  <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-white", isRTL ? "ml-2" : "mr-2")}></div>
                  {t("Deleting...")}
                </>
              ) : (
                <>
                  <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("Delete Invoice")}
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
                  <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-white", isRTL ? "ml-2" : "mr-2")}></div>
                  {t("Force Deleting...")}
                </>
              ) : (
                <>
                  <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("Force Delete")}
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