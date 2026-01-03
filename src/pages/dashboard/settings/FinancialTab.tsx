import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Percent, FileText, Calendar, Tag } from "lucide-react";

interface FinancialTabProps {
  data: any;
  onChange: (data: any) => void;
}

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD) - $", symbol: "$" },
  { value: "EUR", label: "Euro (EUR) - €", symbol: "€" },
  { value: "GBP", label: "British Pound (GBP) - £", symbol: "£" },
  { value: "CAD", label: "Canadian Dollar (CAD) - C$", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar (AUD) - A$", symbol: "A$" },
  { value: "JPY", label: "Japanese Yen (JPY) - ¥", symbol: "¥" },
  { value: "CNY", label: "Chinese Yuan (CNY) - ¥", symbol: "¥" },
  { value: "INR", label: "Indian Rupee (INR) - ₹", symbol: "₹" },
  { value: "AED", label: "UAE Dirham (AED) - د.إ", symbol: "د.إ" },
  { value: "SAR", label: "Saudi Riyal (SAR) - ر.س", symbol: "ر.س" },
  { value: "NGN", label: "Nigerian Naira (NGN) - ₦", symbol: "₦" },
  { value: "VND", label: "Vietnamese Dong (VND) - ₫", symbol: "₫" },
  { value: "DOP", label: "Dominican Peso (DOP) - RD$", symbol: "RD$" },
];

const FinancialTab: React.FC<FinancialTabProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currency: "USD",
    taxRate: 10,
    invoicePrefix: "INV",
    paymentTerms: 30,
    defaultDiscount: 0,
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    const newData = {
      ...formData,
      [field]: value,
    };
    setFormData(newData);
    onChange(newData);
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find((c) => c.value === formData.currency)?.symbol || "$";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t("Financial Settings")}
          </CardTitle>
          <CardDescription>
            {t("Configure your clinic's financial and billing settings")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("Currency")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleChange("currency", value)}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("This currency will be used for all financial transactions")}
            </p>
          </div>

          {/* Tax Rate */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                {t("Tax Rate")}
              </Label>
              <span className="text-sm font-medium">
                {formData.taxRate}%
              </span>
            </div>
            <Slider
              value={[formData.taxRate]}
              onValueChange={([value]) => handleChange("taxRate", value)}
              min={0}
              max={100}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Tax rate applied to invoices")}
            </p>
          </div>

          {/* Invoice Prefix */}
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("Invoice Prefix")}
            </Label>
            <Input
              id="invoicePrefix"
              value={formData.invoicePrefix}
              onChange={(e) => handleChange("invoicePrefix", e.target.value.toUpperCase())}
              placeholder="INV"
              maxLength={10}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              {t("Example")}: {formData.invoicePrefix || "INV"}-001, {formData.invoicePrefix || "INV"}-002
            </p>
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <Label htmlFor="paymentTerms" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("Payment Terms (days)")}
            </Label>
            <Input
              id="paymentTerms"
              type="number"
              value={formData.paymentTerms}
              onChange={(e) => handleChange("paymentTerms", parseInt(e.target.value) || 0)}
              min={0}
              max={365}
            />
            <p className="text-xs text-muted-foreground">
              {t("Number of days until payment is due")} (0-365)
            </p>
          </div>

          {/* Default Discount */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t("Default Discount")}
              </Label>
              <span className="text-sm font-medium">
                {formData.defaultDiscount}%
              </span>
            </div>
            <Slider
              value={[formData.defaultDiscount]}
              onValueChange={([value]) => handleChange("defaultDiscount", value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Default discount percentage for invoices")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{t("Invoice Preview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4 bg-background rounded-lg border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-bold">
                  {t("INVOICE")} {formData.invoicePrefix}-001
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Due")}: {formData.paymentTerms} {t("days")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t("Date")}</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>{t("Subtotal")}</span>
                <span>{getCurrencySymbol()} 100.00</span>
              </div>
              {formData.defaultDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("Discount")} ({formData.defaultDiscount}%)</span>
                  <span>-{getCurrencySymbol()} {(100 * formData.defaultDiscount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("Tax")} ({formData.taxRate}%)</span>
                <span>
                  {getCurrencySymbol()}{" "}
                  {((100 - (100 * formData.defaultDiscount / 100)) * formData.taxRate / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>{t("Total")}</span>
                <span>
                  {getCurrencySymbol()}{" "}
                  {(
                    100 - (100 * formData.defaultDiscount / 100) +
                    ((100 - (100 * formData.defaultDiscount / 100)) * formData.taxRate / 100)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialTab;

