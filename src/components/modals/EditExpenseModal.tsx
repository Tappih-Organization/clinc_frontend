import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/forms";
import { expenseApi, type Expense, type UpdateExpenseRequest } from "@/services/api/expenseApi";

interface EditExpenseModalProps {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSuccess: (expense?: Expense) => void;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  open,
  expense,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<UpdateExpenseRequest>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title,
        description: expense.description || "",
        amount: expense.amount,
        category: expense.category,
        vendor: expense.vendor || "",
        payment_method: expense.payment_method,
        date: expense.date,
        status: expense.status,
        receipt_url: expense.receipt_url || "",
        notes: expense.notes || "",
      });
      setSelectedDate(new Date(expense.date));
    }
  }, [expense]);

  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const handleInputChange = (field: keyof UpdateExpenseRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim() === "") {
      newErrors.title = t("Title is required");
    }

    if (!formData.category || formData.category.trim() === "") {
      newErrors.category = t("Category is required");
    }

    if (!formData.payment_method || formData.payment_method.trim() === "") {
      newErrors.payment_method = t("Payment method is required");
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = t("Amount must be greater than 0");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expense || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await expenseApi.updateExpense(expense._id, formData);
      const updatedExpense = response.data.data;
      toast.success("Expense updated successfully");
      // Call onSuccess with the updated expense
      if (onSuccess) {
        onSuccess(updatedExpense);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setSelectedDate(undefined);
    setErrors({});
    onClose();
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("editExpense")}</DialogTitle>
          <DialogDescription className={cn(isRTL ? "text-right" : "text-left")}>
            {t("updateExpenseDetails")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("title")}
              required
              error={errors.title}
              htmlFor="title"
              className="md:col-span-2"
            >
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Office supplies"
                required
                className={errors.title ? "border-red-500" : ""}
                dir="auto"
              />
            </FormField>

            <FormField
              label={t("description")}
              htmlFor="description"
              className="md:col-span-2"
            >
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Additional details about the expense..."
                className={cn("min-h-[80px]", errors.description ? "border-red-500" : "")}
                dir="auto"
              />
            </FormField>

            <FormField
              label={t("amount")}
              required
              error={errors.amount}
              htmlFor="amount"
            >
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ""}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
                className={errors.amount ? "border-red-500" : ""}
                dir="ltr"
              />
            </FormField>

            <FormField
              label={t("category")}
              required
              error={errors.category}
              htmlFor="category"
            >
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplies">{t("supplies")}</SelectItem>
                  <SelectItem value="equipment">{t("equipment")}</SelectItem>
                  <SelectItem value="utilities">{t("utilities")}</SelectItem>
                  <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
                  <SelectItem value="staff">{t("staff")}</SelectItem>
                  <SelectItem value="marketing">{t("marketing")}</SelectItem>
                  <SelectItem value="insurance">{t("insurance")}</SelectItem>
                  <SelectItem value="rent">{t("rent")}</SelectItem>
                  <SelectItem value="other">{t("other")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("paymentMethod")}
              required
              error={errors.payment_method}
              htmlFor="payment_method"
            >
              <Select value={formData.payment_method} onValueChange={(value) => handleInputChange("payment_method", value)}>
                <SelectTrigger className={errors.payment_method ? "border-red-500" : ""}>
                  <SelectValue placeholder={t("selectPaymentMethod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("cash")}</SelectItem>
                  <SelectItem value="card">{t("creditCard")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("bankTransfer")}</SelectItem>
                  <SelectItem value="check">{t("check")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("status")}
              htmlFor="status"
            >
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="paid">{t("paid")}</SelectItem>
                  <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("date")}
              required
              htmlFor="date"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal",
                      isRTL ? "text-right" : "text-left",
                      !selectedDate && "text-muted-foreground"
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <CalendarIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {selectedDate ? format(selectedDate, "PPP") : t("Pick a date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align={isRTL ? "end" : "start"}>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormField>

            <FormField
              label={t("vendor")}
              htmlFor="vendor"
            >
              <Input
                id="vendor"
                value={formData.vendor || ""}
                onChange={(e) => handleInputChange("vendor", e.target.value)}
                placeholder="e.g., ABC Medical Supplies"
                dir="auto"
              />
            </FormField>

            <FormField
              label={t("receiptUrl")}
              htmlFor="receipt_url"
              className="md:col-span-2"
            >
              <Input
                id="receipt_url"
                type="url"
                value={formData.receipt_url || ""}
                onChange={(e) => handleInputChange("receipt_url", e.target.value)}
                placeholder="https://example.com/receipt.pdf"
                dir="ltr"
              />
            </FormField>

            <FormField
              label={t("notes")}
              htmlFor="notes"
              className="md:col-span-2"
            >
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes or remarks..."
                className="min-h-[60px]"
                dir="auto"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("updateExpense")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseModal;
