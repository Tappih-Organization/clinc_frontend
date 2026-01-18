import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { useIsRTL } from "@/hooks/useIsRTL";
import { FormField } from "@/components/forms";
import { expenseApi, type CreateExpenseRequest, type Expense } from "@/services/api/expenseApi";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (expense?: Expense) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    title: "",
    description: "",
    amount: 0,
    category: "",
    vendor: "",
    payment_method: "",
    date: new Date().toISOString().split('T')[0],
    status: "pending",
    receipt_url: "",
    notes: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleInputChange = (field: keyof CreateExpenseRequest, value: string | number) => {
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
 
   const isRTL = useIsRTL(); 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.payment_method || formData.amount <= 0) {
      toast.error(t("Please fill in all required fields"));
      return;
    }

    try {
      setLoading(true);
      const response = await expenseApi.createExpense(formData);
      const newExpense = response.data.data;
      toast.success(t("Expense created successfully"));
      handleClose();
      // Call onSuccess with the created expense
      if (onSuccess) {
        onSuccess(newExpense);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("Failed to create expense"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      amount: 0,
      category: "",
      vendor: "",
      payment_method: "",
      date: new Date().toISOString().split('T')[0],
      status: "pending",
      receipt_url: "",
      notes: "",
    });
    setSelectedDate(new Date());
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("addNewExpense")}</DialogTitle>
          <DialogDescription className={cn(isRTL ? "text-right" : "text-left")}>
            {t("createExpenseDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("Title")}
              required
              error={errors.title}
              htmlFor="title"
              className="md:col-span-2"
            >
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t("titlePlaceholder")}
                required
                className={errors.title ? "border-red-500" : ""}
                dir="auto"
              />
            </FormField>

            <FormField
              label={t("Description")}
              htmlFor="description"
              className="md:col-span-2"
            >
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className={cn("min-h-[80px]", errors.description ? "border-red-500" : "")}
                dir="auto"
              />
            </FormField>

            <FormField
              label={t("Amount")}
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
                placeholder={t("0.00")}
                required
                className={errors.amount ? "border-red-500" : ""}
                dir="ltr"
              />
            </FormField>

            <FormField
              label={t("Category")}
              required
              error={errors.category}
              htmlFor="category"
            >
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplies">{t("Supplies")}</SelectItem>
                  <SelectItem value="equipment">{t("Equipment")}</SelectItem>
                  <SelectItem value="utilities">{t("Utilities")}</SelectItem>
                  <SelectItem value="maintenance">{t("Maintenance")}</SelectItem>
                  <SelectItem value="staff">{t("Staff")}</SelectItem>
                  <SelectItem value="marketing">{t("Marketing")}</SelectItem>
                  <SelectItem value="insurance">{t("Insurance")}</SelectItem>
                  <SelectItem value="rent">{t("Rent")}</SelectItem>
                  <SelectItem value="other">{t("Other")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("Payment Method")}
              required
              error={errors.payment_method}
              htmlFor="payment_method"
            >
              <Select value={formData.payment_method} onValueChange={(value) => handleInputChange("payment_method", value)}>
                <SelectTrigger className={errors.payment_method ? "border-red-500" : ""}>
                  <SelectValue placeholder={t("Select payment method")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("cash")}</SelectItem>
                  <SelectItem value="card">{t("creditCard")}</SelectItem>
                  <SelectItem value="bank_transfer">{t("Bank Transfer")}</SelectItem>
                  <SelectItem value="check">{t("Check")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("Status")}
              htmlFor="status"
            >
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("Pending")}</SelectItem>
                  <SelectItem value="paid">{t("Paid")}</SelectItem>
                  <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("Date")}
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
                value={formData.vendor}
                onChange={(e) => handleInputChange("vendor", e.target.value)}
                placeholder={t("vendorPlaceholder")}
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
                value={formData.receipt_url}
                onChange={(e) => handleInputChange("receipt_url", e.target.value)}
                placeholder="https://example.com/receipt.pdf"
                dir="ltr"
              />
            </FormField>

            <FormField
              label={t("Notes")}
              htmlFor="notes"
              className="md:col-span-2"
            >
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="min-h-[60px]"
                dir="auto"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createExpense")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
