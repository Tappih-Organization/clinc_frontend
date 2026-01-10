import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsRTL } from "@/hooks/useIsRTL";
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
import { Loader2, Edit, Globe, Phone, Mail, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseApiError } from "@/utils/errorHandler";
import { Lead } from "@/types";
import { useUpdateLead } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

interface EditLeadModalProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ lead, open, onOpenChange }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "",
    serviceInterest: "",
    status: "new" as Lead['status'],
    assignedTo: "",
    notes: "",
  });

  const updateLeadMutation = useUpdateLead();

  // Validation helper functions
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s'-]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  };

  const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    const cleanedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
      return { isValid: false, error: t("Phone number must be between 8 and 15 digits") };
    }
    if (!/^\d+$/.test(cleanedPhone)) {
      return { isValid: false, error: t("Phone number can only contain digits") };
    }
    return { isValid: true };
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || "",
        phone: lead.phone,
        source: lead.source,
        serviceInterest: lead.serviceInterest,
        status: lead.status,
        assignedTo: lead.assignedTo || "",
        notes: lead.notes || "",
      });
    }
  }, [lead]);

  const leadSources = [
    { value: "website", label: t("Website Form") },
    { value: "referral", label: t("Patient Referral") },
    { value: "social", label: t("Social Media") },
    { value: "advertisement", label: t("Advertisement") },
    { value: "walk-in", label: t("Walk-in") },
  ];

  const services = [
    t("General Consultation"),
    t("Cardiology"),
    t("Neurology"),
    t("Pediatrics"),
    t("Dermatology"),
    t("Orthopedics"),
    t("Gynecology"),
    t("Mental Health"),
    t("Dental Care"),
    t("Physical Therapy"),
  ];

  const statusOptions = [
    { value: "new", label: t("New") },
    { value: "contacted", label: t("Contacted") },
    { value: "converted", label: t("Converted") },
    { value: "lost", label: t("Lost") },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    // First Name validation (required)
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("First name is required");
    } else if (!validateName(formData.firstName)) {
      if (formData.firstName.trim().length < 2) {
        newErrors.firstName = t("First name must be at least 2 characters");
      } else {
        newErrors.firstName = t("First name can only contain letters, spaces, hyphens, and apostrophes");
      }
    }

    // Last Name validation (optional)
    if (formData.lastName.trim() && !validateName(formData.lastName)) {
      if (formData.lastName.trim().length < 2) {
        newErrors.lastName = t("Last name must be at least 2 characters");
      } else {
        newErrors.lastName = t("Last name can only contain letters, spaces, hyphens, and apostrophes");
      }
    }

    // Phone Number validation (required)
    if (!formData.phone.trim()) {
      newErrors.phone = t("Phone number is required");
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || t("Please enter a valid phone number");
      }
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email.trim() && !validateEmail(formData.email)) {
      newErrors.email = t("Please enter a valid email address");
    }

    // Lead Source validation (required)
    if (!formData.source) {
      newErrors.source = t("Lead source is required");
    }

    // Service Interest validation (required)
    if (!formData.serviceInterest.trim()) {
      newErrors.serviceInterest = t("Service interest is required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      await updateLeadMutation.mutateAsync({
        id: lead._id || lead.id,
        data: formData,
      });

      toast({
        title: t("Lead updated successfully"),
        description: `${formData.firstName}${formData.lastName ? ` ${formData.lastName}` : ''} ${t("has been updated.")}`
      });

      setErrors({});
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 mt-5" dir={isRTL ? 'ltr' : 'ltr'}>
            <Edit className="h-5 w-5" />
            {t("Edit Lead")}
          </DialogTitle>
          <DialogDescription className={isRTL ? 'text-right' : ''}>
            {t("Update lead information and track their progress.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center" dir={isRTL ? 'ltr' : 'ltr'}>
                <Phone className="h-4 w-4 mr-2" />
                {t("Contact Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <Label htmlFor="firstName" className={cn(isRTL && "text-right")}>{t("First Name")} *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("Enter first name")}
                    className={cn(errors.firstName && "border-red-500", isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.firstName && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.firstName}</p>
                  )}
                </div>

                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <Label htmlFor="lastName" className={cn(isRTL && "text-right")}>{t("Last Name")}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder={t("Enter last name")}
                    className={cn(errors.lastName && "border-red-500", isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.lastName && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <Label htmlFor="email" className={cn(isRTL && "text-right")}>{t("Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder={t("Enter email address")}
                    className={cn(errors.email && "border-red-500", isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.email && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.email}</p>
                  )}
                </div>

                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <Label htmlFor="phone" className={cn(isRTL && "text-right")}>{t("Phone Number")} *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder={t("Enter phone number")}
                    className={cn(errors.phone && "border-red-500", isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.phone && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader dir={isRTL ? 'ltr' : 'ltr'}>
              <CardTitle className="text-lg flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                {t("Lead Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <Label htmlFor="source" className={cn(isRTL && "text-right")}>{t("leadSource")} *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleChange("source", value)}
                  >
                    <SelectTrigger className={cn(errors.source && "border-red-500", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t("How did they find us?")} />
                    </SelectTrigger>
                    <SelectContent dir={isRTL ? 'rtl' : 'ltr'} className={cn(isRTL && "text-right")}>
                      {leadSources.map((source) => (
                        <SelectItem key={source.value} value={source.value} className={cn(isRTL && "text-right")}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.source && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.source}</p>
                  )}
                </div>

                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <Label htmlFor="serviceInterest" className={cn(isRTL && "text-right")}>{t("Service Interest")} *</Label>
                  <Select
                    value={formData.serviceInterest}
                    onValueChange={(value) =>
                      handleChange("serviceInterest", value)
                    }
                  >
                    <SelectTrigger className={cn(errors.serviceInterest && "border-red-500", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t("What service are they interested in?")} />
                    </SelectTrigger>
                    <SelectContent dir={isRTL ? 'rtl' : 'ltr'} className={cn(isRTL && "text-right")}>
                      {services.map((service) => (
                        <SelectItem key={service} value={service} className={cn(isRTL && "text-right")}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceInterest && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.serviceInterest}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("Status")}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select status")} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">{t("Assigned To")}</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => handleChange("assignedTo", e.target.value)}
                    placeholder={t("Assign to staff member")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("Notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder={t("Additional information about the lead, their needs, timeline, etc.")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4" dir={isRTL ? 'ltr' : 'ltr'}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateLeadMutation.isPending}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateLeadMutation.isPending}
            >
              {updateLeadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Updating Lead...")}
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("Update Lead")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal; 