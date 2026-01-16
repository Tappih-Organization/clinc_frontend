import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import {
  Receipt,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Save,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseApiError } from "@/utils/errorHandler";
import { apiService, type Invoice, type Patient } from "@/services/api";

interface EditInvoiceModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (invoice?: Invoice) => void;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: "service" | "medicine" | "test";
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ 
  invoiceId, 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    dueDate: "",
    notes: "",
    discount: 0,
    tax: 10,
    status: "pending",
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && invoiceId) {
      loadData();
    }
  }, [isOpen, invoiceId]);

  const loadData = async () => {
    if (!invoiceId) return;
    
    setLoadingData(true);
    try {
      const [invoiceData, patientsResponse] = await Promise.all([
        apiService.getInvoice(invoiceId),
        apiService.getPatients({ limit: 100 })
      ]);

      setInvoice(invoiceData);
      setPatients(patientsResponse?.data?.patients || []);

     
      setFormData({
        patientId: typeof invoiceData.patient_id === 'string' 
          ? invoiceData.patient_id 
          : invoiceData.patient_id._id,
        dueDate: invoiceData.due_date.split('T')[0], // Format for date input
        notes: invoiceData.notes || "",
        discount: invoiceData.discount || 0,
        tax: (invoiceData.tax_amount / invoiceData.subtotal) * 100, // Calculate tax percentage
        status: invoiceData.status,
      });

      // Populate items
      const invoiceItems: InvoiceItem[] = invoiceData.services.map((service, index) => ({
        id: service.id || index.toString(),
        description: service.description,
        quantity: service.quantity,
        unitPrice: service.unit_price,
        total: service.total,
        type: (service.type as "service" | "medicine" | "test") || "service",
      }));
      setItems(invoiceItems);

    } catch (error) {
      console.error('Error loading invoice:', error);
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoadingData(false);
    }
  };

  const predefinedServices = [
    { name: "General Consultation", price: 100, type: "service" },
    { name: "Follow-up Visit", price: 75, type: "service" },
    { name: "Blood Test", price: 50, type: "test" },
    { name: "X-Ray", price: 120, type: "test" },
    { name: "Paracetamol 500mg", price: 5, type: "medicine" },
    { name: "Amoxicillin 250mg", price: 15, type: "medicine" },
  ];

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      type: "service",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate total when quantity or unit price changes
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }

          return updatedItem;
        }
        return item;
      }),
    );
  };

  const selectPredefinedService = (itemId: string, serviceName: string) => {
    const service = predefinedServices.find((s) => s.name === serviceName);
    if (service) {
      updateItem(itemId, "description", service.name);
      updateItem(itemId, "unitPrice", service.price);
      updateItem(itemId, "type", service.type);
      updateItem(
        itemId,
        "total",
        service.price * (items.find((i) => i.id === itemId)?.quantity || 1),
      );
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * formData.tax) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - formData.discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;

    setIsLoading(true);

    try {
      // Prepare updated invoice data
      const updatedInvoiceData: Partial<Invoice> = {
        patient_id: formData.patientId,
        services: items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          type: item.type
        })),
        subtotal: calculateSubtotal(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal(),
        discount: formData.discount,
        due_date: formData.dueDate,
        notes: formData.notes || undefined,
        status: formData.status as any,
      };

      // Update invoice via API
      const updatedInvoice = await apiService.updateInvoice(invoiceId, updatedInvoiceData);

      toast({
        title: t("Invoice updated successfully"),
        description: t("Invoice {{number}} has been updated.", { number: invoice?.invoice_number }),
      });

      if (onSuccess) {
        onSuccess(updatedInvoice);
      }
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center text-xl", isRTL && "flex-row-reverse")}>
            <Receipt className={cn("h-5 w-5 text-blue-600", isRTL ? "ml-3" : "mr-3")} />
            {t("Edit Invoice")} {invoice?.invoice_number}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && "text-right font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
            {t("Update invoice details, services, and payment information.")}
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>{t("Loading invoice...")}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient and Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}>
                  <User className={cn("h-4 w-4", isRTL ? "ml-3" : "mr-3")} />
                  {t("Invoice Information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientId">{t("Select Patient")} *</Label>
                    <Select
                      value={formData.patientId}
                      onValueChange={(value) => handleChange("patientId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Choose a patient")} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient._id} value={patient._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {patient.first_name} {patient.last_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {patient.phone}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">{t("Due Date")} *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleChange("dueDate", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t("Status")}</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("Pending")}</SelectItem>
                        <SelectItem value="paid">{t("Paid")}</SelectItem>
                        <SelectItem value="overdue">{t("Overdue")}</SelectItem>
                        <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className={cn(isRTL && "flex-row-reverse")}
                  >
                    <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {t("Add Item")}
                  </Button>
                  <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                    <DollarSign className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {t("Invoice Items")}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <h4 className="font-medium">{t("Item")} {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>{t("Description")} *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder={t("Service or item description")}
                          required
                        />
                        <Select
                          onValueChange={(value) =>
                            selectPredefinedService(item.id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("Or select from list")} />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedServices.map((service) => (
                              <SelectItem key={service.name} value={service.name}>
                                <div className="flex justify-between w-full">
                                  <span>{service.name}</span>
                                  <Badge variant="outline" className="ml-2">
                                    {service.type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("Type")}</Label>
                        <Select
                          value={item.type}
                          onValueChange={(value) =>
                            updateItem(item.id, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">{t("Service")}</SelectItem>
                            <SelectItem value="medicine">{t("Medicine")}</SelectItem>
                            <SelectItem value="test">{t("Test")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("Quantity")}</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t("Unit Price")} ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className={cn("text-right", isRTL && "text-left")}>
                      <span className="text-lg font-semibold">
                        {t("Total")}: <CurrencyDisplay amount={item.total} />
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Invoice Summary */}
            <Card>
            <CardHeader>
              <CardTitle className={cn("text-lg", isRTL && "text-right font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Invoice Summary")}</CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount" className={cn(isRTL && "text-right font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Discount")} ($)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount}
                      onChange={(e) =>
                        handleChange("discount", parseFloat(e.target.value) || 0)
                      }
                      className={cn(isRTL && "text-right")}
                      dir={isRTL ? "ltr" : "ltr"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax" className={cn(isRTL && "text-right font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Tax")} (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.tax}
                      onChange={(e) =>
                        handleChange("tax", parseFloat(e.target.value) || 0)
                      }
                      className={cn(isRTL && "text-right")}
                      dir={isRTL ? "ltr" : "ltr"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={cn(isRTL && "text-right font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Total Amount")}</Label>
                    <div className={cn("text-2xl font-bold text-green-600", isRTL && "text-right")}>
                      <CurrencyDisplay amount={calculateTotal()} variant="large" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2" dir={isRTL ? "ltr" : "ltr"}>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span className={cn(isRTL && "font-arabic" )} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Subtotal")}</span>
                    <span><CurrencyDisplay amount={calculateSubtotal()} /></span>
                  </div>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span className={cn(isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Tax")} ({formData.tax}%)</span>
                    <span><CurrencyDisplay amount={calculateTax()} /></span>
                  </div>
                  <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                    <span className={cn(isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Discount")}</span>
                    <span>-<CurrencyDisplay amount={formData.discount} /></span>
                  </div>
                  <hr />
                  <div className={cn("flex justify-between font-bold text-lg", isRTL && "flex-row-reverse")}>
                    <span className={cn(isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Total")}</span>
                    <span><CurrencyDisplay amount={calculateTotal()} /></span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className={cn(isRTL && "text-right font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Notes")}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder={t("Additional notes or payment terms...")}
                    rows={3}
                    className={cn(isRTL && "text-right font-arabic")}
                    style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className={cn("flex justify-end pt-4 border-t", isRTL ? "flex-row-reverse space-x-reverse space-x-4" : "space-x-4")}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className={cn(isRTL && "mr-2 ")}
              >
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading} className={cn(isRTL && "flex-row-reverse")}>
                {isLoading ? (
                  <>
                    <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-white", isRTL ? "ml-3" : "mr-3")}></div>
                    {t("Updating Invoice...")}
                  </>
                ) : (
                  <>
                    <Save className={cn("h-4 w-4", isRTL ? "ml-3" : "mr-3")} />
                    {t("Update Invoice")}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceModal; 