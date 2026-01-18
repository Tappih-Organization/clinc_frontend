# Reusable Form Components

مكونات Form قابلة لإعادة الاستخدام مع دعم كامل للغة العربية والإنجليزية (RTL/LTR)

## المكونات المتاحة

### 1. `FormDialog`
Dialog wrapper للفورم مع دعم RTL

**الخصائص:**
- `open`: boolean - حالة فتح/إغلاق الـ Dialog
- `onOpenChange`: (open: boolean) => void - دالة تغيير الحالة
- `title`: string - عنوان الـ Dialog
- `description?`: string - وصف اختياري
- `icon?`: LucideIcon - أيقونة اختيارية
- `maxWidth?`: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full" - عرض الـ Dialog
- `children`: React.ReactNode - محتوى الـ Dialog

**مثال الاستخدام:**
```tsx
import { FormDialog } from "@/components/forms";
import { Building2 } from "lucide-react";

<FormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Add New Item"
  description="Create a new item in the inventory"
  icon={Building2}
  maxWidth="3xl"
>
  <form onSubmit={handleSubmit}>
    {/* Form content */}
  </form>
</FormDialog>
```

---

### 2. `FormCardSection`
قسم Card لتجميع الحقول ذات الصلة

**الخصائص:**
- `title`: string - عنوان القسم
- `icon?`: LucideIcon - أيقونة اختيارية
- `children`: React.ReactNode - محتوى القسم
- `className?`: string - كلاسات CSS إضافية

**مثال الاستخدام:**
```tsx
import { FormCardSection } from "@/components/forms";
import { User } from "lucide-react";

<FormCardSection title="Basic Information" icon={User}>
  {/* Form fields */}
</FormCardSection>
```

---

### 3. `FormField`
حقل Form مع Label ورسالة الخطأ

**الخصائص:**
- `label`: string - نص الـ Label
- `required?`: boolean - هل الحقل مطلوب
- `error?`: string - رسالة الخطأ
- `children`: React.ReactNode - عنصر الإدخال (Input, Select, etc.)
- `htmlFor?`: string - ID العنصر المرتبط
- `className?`: string - كلاسات CSS إضافية
- `description?`: string - وصف اختياري للحقل

**مثال الاستخدام:**
```tsx
import { FormField } from "@/components/forms";
import { Input } from "@/components/ui/input";

<FormField
  label="Item Name"
  required
  error={errors.name}
  htmlFor="name"
>
  <Input
    id="name"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    placeholder="Enter item name"
    dir="auto"
  />
</FormField>
```

---

### 4. `StatusToggleField`
حقل تبديل الحالة مع Switch وأيقونة ووصف

**الخصائص:**
- `label`: string - نص الـ Label
- `checked`: boolean - حالة الـ Switch
- `onCheckedChange`: (checked: boolean) => void - دالة تغيير الحالة
- `activeDescription?`: string - الوصف عند التفعيل
- `inactiveDescription?`: string - الوصف عند التعطيل
- `icon?`: LucideIcon - أيقونة (افتراضي: Power)
- `id?`: string - ID العنصر (افتراضي: "status")
- `className?`: string - كلاسات CSS إضافية

**مثال الاستخدام:**
```tsx
import { StatusToggleField } from "@/components/forms";
import { useTranslation } from "react-i18next";

const { t } = useTranslation();

<StatusToggleField
  label={t("Status")}
  checked={formData.status === "active"}
  onCheckedChange={(checked) => {
    setFormData({ ...formData, status: checked ? "active" : "inactive" });
  }}
  activeDescription={t("Item is active and operational")}
  inactiveDescription={t("Item is inactive")}
/>
```

---

### 5. `ItemsDetails`
مكون قابل لإعادة الاستخدام لإدارة قوائم الأصناف (أدوية، مخزون، إلخ) مع دعم RTL كامل

**الخصائص:**
- `items`: FormItem[] - قائمة الأصناف
- `onItemsChange`: (items: FormItem[]) => void - دالة تحديث القائمة
- `title?`: string - عنوان القسم (افتراضي: "Items")
- `itemLabel?`: string - تسمية الصنف (افتراضي: "Item")
- `addButtonLabel?`: string - نص زر الإضافة (افتراضي: "Add Item")
- `showCommonItems?`: boolean - عرض قائمة الأصناف الشائعة
- `commonItems?`: Array<{ name: string; dosages?: string[] }> - قائمة الأصناف الشائعة
- `frequencies?`: string[] - قائمة التكرارات (للأدوية)
- `durations?`: string[] - قائمة المدد (للأدوية)
- `fields?`: object - تحديد الحقول المعروضة:
  - `showName?`: boolean - عرض حقل الاسم
  - `showDosage?`: boolean - عرض حقل الجرعة
  - `showFrequency?`: boolean - عرض حقل التكرار
  - `showDuration?`: boolean - عرض حقل المدة
  - `showQuantity?`: boolean - عرض حقل الكمية
  - `showInstructions?`: boolean - عرض حقل التعليمات
  - `customFields?`: Array - حقول مخصصة إضافية
- `calculateTotal?`: (items: FormItem[]) => number - دالة حساب المجموع المخصصة
- `totalLabel?`: string - نص المجموع (افتراضي: "Total:")
- `minItems?`: number - الحد الأدنى لعدد الأصناف (افتراضي: 1)
- `className?`: string - كلاسات CSS إضافية

**مثال الاستخدام الأساسي:**
```tsx
import { ItemsDetails, FormItem } from "@/components/forms";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const { t } = useTranslation();
const [medications, setMedications] = useState<FormItem[]>([]);

const commonMedications = [
  { name: "Paracetamol", dosages: ["500mg", "650mg", "1000mg"] },
  { name: "Amoxicillin", dosages: ["250mg", "500mg", "875mg"] },
];

const frequencies = [
  "Once daily",
  "Twice daily",
  "Three times daily",
];

<ItemsDetails
  items={medications}
  onItemsChange={setMedications}
  title={t("Medications")}
  itemLabel={t("Medication")}
  addButtonLabel={t("Add Medication")}
  showCommonItems={true}
  commonItems={commonMedications}
  frequencies={frequencies}
  durations={["3 days", "7 days", "14 days"]}
  fields={{
    showName: true,
    showDosage: true,
    showFrequency: true,
    showDuration: true,
    showQuantity: true,
    showInstructions: true,
  }}
  minItems={1}
/>
```

**مثال مع حقول مخصصة:**
```tsx
<ItemsDetails
  items={inventoryItems}
  onItemsChange={setInventoryItems}
  title={t("Inventory Items")}
  itemLabel={t("Item")}
  fields={{
    showName: true,
    showQuantity: true,
    customFields: [
      {
        key: "price",
        label: t("Price"),
        type: "number",
        required: true,
        placeholder: t("Enter price"),
      },
      {
        key: "category",
        label: t("Category"),
        type: "select",
        options: ["Medicine", "Equipment", "Supply"],
        required: true,
      },
      {
        key: "notes",
        label: t("Notes"),
        type: "textarea",
        placeholder: t("Additional notes..."),
      },
    ],
  }}
/>
```

---

## مثال كامل

```tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormDialog,
  FormCardSection,
  FormField,
  StatusToggleField,
} from "@/components/forms";
import { Building2, Package } from "lucide-react";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

const MyForm = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    status: "active" as "active" | "inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title={t("Add New Item")}
      description={t("Create a new item in the inventory")}
      icon={Package}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCardSection title={t("Basic Information")} icon={Building2}>
          <FormField
            label={t("Item Name")}
            required
            error={errors.name}
            htmlFor="name"
          >
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t("Enter item name")}
              dir="auto"
            />
          </FormField>
        </FormCardSection>

        <FormCardSection title={t("Status")} icon={Package}>
          <StatusToggleField
            label={t("Status")}
            checked={formData.status === "active"}
            onCheckedChange={(checked) => {
              setFormData({
                ...formData,
                status: checked ? "active" : "inactive",
              });
            }}
            activeDescription={t("Item is active and operational")}
            inactiveDescription={t("Item is inactive")}
          />
        </FormCardSection>

        <div className={cn("flex justify-end gap-3 pt-4", isRTL && "flex-row-reverse")}>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button type="submit">{t("Save")}</Button>
        </div>
      </form>
    </FormDialog>
  );
};

export default MyForm;
```

---

## المميزات

✅ **دعم RTL كامل**: جميع المكونات تدعم العربية والإنجليزية تلقائياً  
✅ **تصميم موحد**: نفس التصميم المستخدم في WarehouseForm  
✅ **سهولة الاستخدام**: واجهة برمجية بسيطة وواضحة  
✅ **قابل للتخصيص**: يمكن إضافة كلاسات CSS إضافية  
✅ **TypeScript**: دعم كامل لـ TypeScript مع type safety  
✅ **مكونات قابلة لإعادة الاستخدام**: مثل `ItemsDetails` لإدارة قوائم الأصناف  

---

## ملاحظات

- جميع المكونات تستخدم `useIsRTL` hook تلقائياً لتحديد اتجاه النص
- استخدم `dir="auto"` في عناصر الإدخال لدعم اللغات المختلفة
- استخدم `cn()` utility لتطبيق كلاسات CSS شرطية بناءً على RTL
