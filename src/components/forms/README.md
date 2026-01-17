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

---

## ملاحظات

- جميع المكونات تستخدم `useIsRTL` hook تلقائياً لتحديد اتجاه النص
- استخدم `dir="auto"` في عناصر الإدخال لدعم اللغات المختلفة
- استخدم `cn()` utility لتطبيق كلاسات CSS شرطية بناءً على RTL
