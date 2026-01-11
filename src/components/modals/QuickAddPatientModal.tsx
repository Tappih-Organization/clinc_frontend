import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
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
import { User, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreatePatient, usePatients } from "@/hooks/useApi";
import { parseApiError } from "@/utils/errorHandler";
import type { Patient } from "@/services/api";

interface QuickAddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (patient: Patient) => void;
}

const QuickAddPatientModal: React.FC<QuickAddPatientModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const createPatientMutation = useCreatePatient();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch all patients to check for duplicate phone numbers
  const { data: patientsData } = usePatients({
    limit: 10000,
    tenantScoped: true,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    gender: "male" as "male" | "female",
  });

  // Validation helper functions
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s'-]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  };

  const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    const cleanedPhone = phone.replace(/[\s\-\(\)\+]/g, "");

    if (!/^\d+$/.test(cleanedPhone)) {
      return { isValid: false, error: t("Phone number must contain only digits") };
    }

    if (cleanedPhone.length < 7) {
      return { isValid: false, error: t("Phone number must be at least 7 digits") };
    }

    if (cleanedPhone.length > 15) {
      return { isValid: false, error: t("Phone number cannot exceed 15 digits") };
    }

    return { isValid: true };
  };

  const handleChange = (field: string, value: string) => {
    if (field === "firstName") {
      if (value === "" || /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s'-]*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else if (field === "phone") {
      if (value === "" || /^[\d\s\-\(\)\+]*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First Name validation - trim whitespace first
    const trimmedFirstName = formData.firstName.trim();
    if (!trimmedFirstName) {
      newErrors.firstName = t("First name is required");
    } else if (!validateName(trimmedFirstName)) {
      if (trimmedFirstName.length < 2) {
        newErrors.firstName = t("First name must be at least 2 characters");
      } else {
        newErrors.firstName = t("First name can only contain letters, spaces, hyphens, and apostrophes");
      }
    }

    // Phone Number validation
    if (!formData.phone.trim()) {
      newErrors.phone = t("Phone number is required");
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || t("Please enter a valid phone number");
      } else {
        // Check for duplicate phone number
        const cleanedPhone = formData.phone.replace(/[\s\-\(\)\+]/g, "");
        const existingPatients = patientsData?.data?.patients || [];
        const duplicatePatient = existingPatients.find((patient: any) => {
          const existingPhone = patient.phone?.replace(/[\s\-\(\)\+]/g, "") || "";
          return existingPhone === cleanedPhone;
        });

        if (duplicatePatient) {
          newErrors.phone = t("This phone number is already registered");
        }
      }
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = t("Gender is required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Clean first name (trim whitespace)
      const cleanedFirstName = formData.firstName.trim();
      
      // Prepare patient data according to API schema
      // Email is optional and not included
      const patientData: Omit<Patient, "_id" | "created_at" | "updated_at"> = {
        first_name: cleanedFirstName,
        phone: formData.phone.trim(),
        gender: formData.gender,
      };

      // Create patient via mutation
      const newPatient = await createPatientMutation.mutateAsync(patientData);

      toast({
        title: t("Patient added successfully"),
        description: `${formData.firstName} ${t("has been added to the system.")}`,
      });

      // Reset form
      setFormData({
        firstName: "",
        phone: "",
        gender: "male",
      });

      setErrors({});

      // Call onSuccess callback if provided (before closing modal)
      if (onSuccess && newPatient) {
        onSuccess(newPatient);
      }

      // Close modal after callback is called
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating patient:", error);

      // Handle server-side validation errors
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors: Record<string, string> = {};

        error.response.data.errors.forEach((err: any) => {
          const fieldMapping: Record<string, string> = {
            first_name: "firstName",
            phone: "phone",
            gender: "gender",
          };

          const fieldName = fieldMapping[err.path] || err.path;
          if (fieldName) {
            validationErrors[fieldName] = err.msg || t("Invalid value");
          }
        });

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      // For non-validation errors, show toast
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form and errors when dialog closes
      setFormData({
        firstName: "",
        phone: "",
        gender: "male",
      });
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("w-[95vw] max-w-md", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className={cn(isRTL && "text-right")}>
          <DialogTitle className={cn("flex items-center gap-2 text-lg sm:text-xl", isRTL && "flex-row-reverse justify-end")}>
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            {t("Add New Patient")}
          </DialogTitle>
          <DialogDescription className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
            {t("Enter required patient information")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div className={cn("space-y-2", isRTL && "text-right")}>
            <Label htmlFor="firstName" className={cn("text-sm font-medium", isRTL && "text-right")}>
              {t("First Name")} *
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder={t("John")}
              required
              className={cn("h-10", errors.firstName && "border-red-500", isRTL && "text-right")}
              dir={isRTL ? "rtl" : "ltr"}
            />
            {errors.firstName && (
              <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.firstName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className={cn("space-y-2", isRTL && "text-right")}>
            <Label htmlFor="phone" className={cn("text-sm font-medium", isRTL && "text-right")}>
              {t("Phone Number")} *
            </Label>
            <div className="relative">
              <Phone className={cn(
                "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={t("+1 (555) 123-4567")}
                required
                className={cn(
                  "h-10",
                  isRTL ? "pr-10" : "pl-10",
                  errors.phone && "border-red-500",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            {errors.phone && (
              <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.phone}</p>
            )}
          </div>

          {/* Gender */}
          <div className={cn("space-y-2", isRTL && "text-right")}>
            <Label htmlFor="gender" className={cn("text-sm font-medium", isRTL && "text-right")}>
              {t("Gender")} *
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleChange("gender", value)}
            >
              <SelectTrigger className={cn("h-10", errors.gender && "border-red-500", isRTL && "text-right")}>
                <SelectValue placeholder={t("Select gender")} />
              </SelectTrigger>
              <SelectContent align={isRTL ? "start" : "end"}>
                <SelectItem value="male">{t("Male")}</SelectItem>
                <SelectItem value="female">{t("Female")}</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.gender}</p>
            )}
          </div>
        </form>

        {/* Footer with buttons */}
        <div className={cn("border-t bg-background pt-4 flex-shrink-0", isRTL && "text-right")}>
          <div className={cn("flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3", isRTL && "sm:flex-row-reverse")}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={createPatientMutation.isPending}
              className={cn("w-full sm:w-auto flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              {createPatientMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("Adding Patient...")}
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  {t("Add Patient")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddPatientModal;

