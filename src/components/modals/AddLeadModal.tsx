import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Plus, Globe, Phone, Mail, Users, Loader2, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateLead, useConvertLeadToPatient } from "@/hooks/useApi";
import { parseApiError } from "@/utils/errorHandler";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface AddLeadModalProps {
  trigger?: React.ReactNode;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ trigger }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "" as "website" | "referral" | "social" | "advertisement" | "walk-in" | "",
    serviceInterest: "",
    status: "new" as const,
    assignedTo: "",
    notes: "",
  });

  const [autoConvertToPatient, setAutoConvertToPatient] = useState(false);
  const [patientData, setPatientData] = useState({
    date_of_birth: "",
    gender: "male" as "male" | "female",
    address: "",
  });

  const createLeadMutation = useCreateLead();
  const convertLeadMutation = useConvertLeadToPatient();

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

    // Auto convert patient data validation
    if (autoConvertToPatient) {
      if (!patientData.gender) {
        newErrors.gender = t("Gender is required for conversion");
      }
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

    // Patient data validation is now optional for auto convert
    // No validation needed - fields are optional

    try {
      // Create lead first
      const leadData: any = {
        ...formData,
        source: formData.source as "website" | "referral" | "social" | "advertisement" | "walk-in",
      };
      const newLead = await createLeadMutation.mutateAsync(leadData);

      // If auto convert is enabled, convert lead to patient immediately
      if (autoConvertToPatient && newLead._id) {
        try {
          // Prepare patient data with proper structure matching Patient model
          const convertPatientData: any = {
            first_name: formData.firstName.trim(),
            ...(formData.lastName?.trim() && { last_name: formData.lastName.trim() }),
            phone: formData.phone.trim(),
            gender: patientData.gender || 'male',
            ...(formData.email?.trim() && { email: formData.email.trim() }),
            ...(patientData.date_of_birth && { date_of_birth: patientData.date_of_birth }),
            ...(patientData.address?.trim() && { address: patientData.address.trim() }),
            emergency_contact: {
              name: "",
              relationship: "",
              phone: "",
            },
            insurance_info: {
              provider: "",
              policy_number: "",
              group_number: "",
            },
          };

          await convertLeadMutation.mutateAsync({
            id: newLead._id,
            patientData: convertPatientData,
          });

          toast({
            title: t("Success"),
            description: `${formData.firstName}${formData.lastName ? ` ${formData.lastName}` : ''} ${t("has been added as a lead and converted to a patient.")}`,
          });
        } catch (convertError: any) {
          // Lead was created but conversion failed
          console.error('Conversion error:', convertError);
          toast({
            title: t("Lead added, but conversion failed"),
            description: `${t("Lead was created successfully, but automatic conversion to patient failed.")} ${parseApiError(convertError)}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("Lead added successfully"),
          description: `${formData.firstName}${formData.lastName ? ` ${formData.lastName}` : ''} ${t("has been added as a new lead.")}`,
        });
      }

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        source: "" as "website" | "referral" | "social" | "advertisement" | "walk-in" | "",
        serviceInterest: "",
        status: "new" as const,
        assignedTo: "",
        notes: "",
      });
      setAutoConvertToPatient(false);
      setPatientData({
        date_of_birth: "",
        gender: "male",
        address: "",
      });
      setErrors({});

      setOpen(false);
    } catch (error) {
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Plus className="h-4 w-4" />
            {t("Add Lead")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className={cn("space-y-3", isRTL && "text-right")}>
          <DialogTitle className={cn("flex items-center gap-2 text-2xl font-semibold text-gray-900", isRTL && "flex-row-reverse")}>
            <UserPlus className="h-6 w-6 text-gray-700" />
            {t("Add New Lead")}
          </DialogTitle>
          <DialogDescription className={cn("text-sm text-gray-500 mt-2", isRTL && "text-right")}>
            {t("Capture information about potential patients and track them through the conversion process.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("text-lg font-semibold text-gray-900 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Phone className="h-5 w-5 text-gray-700" />
                {t("Contact Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-4", isRTL && "text-right")}>
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-4",
                isRTL && "md:grid-flow-col-dense"
              )}>
                <div className={cn("space-y-2", isRTL && "md:col-start-1")}>
                  <Label htmlFor="firstName" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                    {t("First Name *")}
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("Enter first name")}
                    className={cn("w-full", isRTL && "text-right", errors.firstName && "border-red-500")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.firstName && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.firstName}</p>
                  )}
                </div>

                <div className={cn("space-y-2", isRTL && "md:col-start-2")}>
                  <Label htmlFor="lastName" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                    {t("Last Name")}
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder={t("Enter last name")}
                    className={cn("w-full", isRTL && "text-right", errors.lastName && "border-red-500")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.lastName && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-4",
                isRTL && "md:grid-flow-col-dense"
              )}>
                <div className={cn("space-y-2", isRTL && "md:col-start-2")}>
                  <Label htmlFor="email" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                    {t("Email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder={t("Enter email address")}
                    className={cn("w-full", isRTL && "text-right", errors.email && "border-red-500")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  {errors.email && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.email}</p>
                  )}
                </div>

                <div className={cn("space-y-2", isRTL && "md:col-start-1")}>
                  <Label htmlFor="phone" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                    {t("Phone Number *")}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder={t("Enter phone number")}
                    className={cn("w-full", isRTL && "text-right", errors.phone && "border-red-500")}
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
            <CardHeader>
              <CardTitle className={cn("text-lg font-semibold text-gray-900 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Globe className="h-5 w-5 text-gray-700" />
                {t("Lead Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-4", isRTL && "text-right")}>
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-4",
                isRTL && "md:grid-flow-col-dense"
              )}>
                <div className={cn("space-y-2", isRTL && "md:col-start-2")}>
                  <Label htmlFor="source" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                    {t("Lead Source *")}
                  </Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleChange("source", value)}
                  >
                    <SelectTrigger className={cn("w-full", isRTL && "text-right", errors.source && "border-red-500")}>
                      <SelectValue placeholder={t("How did they find us?")} />
                    </SelectTrigger>
                    <SelectContent className={cn(isRTL && "text-right")}>
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

                <div className={cn("space-y-2", isRTL && "md:col-start-1")}>
                  <Label htmlFor="serviceInterest" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                    {t("Service Interest *")}
                  </Label>
                  <Select
                    value={formData.serviceInterest}
                    onValueChange={(value) =>
                      handleChange("serviceInterest", value)
                    }
                  >
                    <SelectTrigger className={cn("w-full", isRTL && "text-right", errors.serviceInterest && "border-red-500")}>
                      <SelectValue placeholder={t("What service are they interested in?")} />
                    </SelectTrigger>
                    <SelectContent className={cn(isRTL && "text-right")}>
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

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                  {t("Assigned To")}
                </Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
                  placeholder={t("Assign to staff member (optional)")}
                  className={cn("w-full", isRTL && "text-right")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className={cn("block text-sm font-medium text-gray-700", isRTL && "text-right")}>
                  {t("Notes")}
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder={t("Additional information about the lead, their needs, timeline, etc.")}
                  rows={3}
                  className={cn("w-full resize-none", isRTL && "text-right")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Auto Convert to Patient Toggle */}
              <div className={cn(
                "flex items-center justify-between p-4 border rounded-lg bg-muted/50 transition-colors",
                isRTL ? "flex-row-reverse gap-4" : "gap-4"
              )}>
                <div className={cn("flex items-center flex-1", isRTL ? "flex-row-reverse gap-3" : "gap-3")}>
                  <UserCheck className={cn(
                    "h-5 w-5 text-primary flex-shrink-0",
                    isRTL && "ml-2"
                  )} />
                  <div className={cn("flex flex-col flex-1", isRTL && "text-right items-end")}>
                    <Label htmlFor="autoConvert" className={cn(
                      "text-sm font-medium cursor-pointer mb-1",
                      isRTL && "text-right"
                    )}>
                      {t("Convert Lead to Patient")}
                    </Label>
                    <span className={cn(
                      "text-xs text-muted-foreground leading-relaxed",
                      isRTL && "text-right"
                    )}>
                      {t("Automatically convert this lead to a patient upon creation")}
                    </span>
                  </div>
                </div>
                <Switch
                  id="autoConvert"
                  checked={autoConvertToPatient}
                  onCheckedChange={setAutoConvertToPatient}
                  disabled={createLeadMutation.isPending || convertLeadMutation.isPending}
                  className={cn("flex-shrink-0", isRTL && "[&[data-state=checked]>*]:translate-x-[-1.25rem]")}
                />
              </div>

              {/* Patient Data Fields (shown when toggle is enabled) */}
              {autoConvertToPatient && (
                <div className={cn(
                  "space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 transition-all",
                  isRTL && "text-right"
                )}>
                  <div className={cn(
                    "flex items-center gap-2 mb-4",
                    isRTL ? "flex-row-reverse justify-end" : "justify-start"
                  )}>
                    <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <Label className={cn(
                      "text-sm font-medium text-blue-900 dark:text-blue-300",
                      isRTL && "text-right"
                    )}>
                      {t("Patient Information (Optional for Conversion)")}
                    </Label>
                  </div>
                  
                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-4",
                    isRTL && "md:grid-flow-col-dense"
                  )}>
                    <div className={cn("space-y-2", isRTL && "md:col-start-2")}>
                      <Label htmlFor="date_of_birth" className={cn(
                        "text-sm font-medium text-gray-700 block",
                        isRTL && "text-right"
                      )}>
                        {t("Date of Birth")}
                      </Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={patientData.date_of_birth}
                        onChange={(e) => setPatientData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        max={new Date().toISOString().split('T')[0]}
                        className={cn(
                          "w-full",
                          isRTL && "text-right"
                        )}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div className={cn("space-y-2", isRTL && "md:col-start-1")}>
                      <Label htmlFor="gender" className={cn(
                        "text-sm font-medium text-gray-700 block",
                        isRTL && "text-right"
                      )}>
                        {t("Gender *")}
                      </Label>
                      <Select
                        value={patientData.gender}
                        onValueChange={(value) => {
                          setPatientData(prev => ({ ...prev, gender: value as "male" | "female" }));
                          if (errors.gender) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.gender;
                              return newErrors;
                            });
                          }
                        }}
                      >
                        <SelectTrigger className={cn(
                          "w-full",
                          isRTL && "text-right",
                          errors.gender && "border-red-500"
                        )}>
                          <SelectValue placeholder={t("Select gender")} />
                        </SelectTrigger>
                        <SelectContent className={cn(isRTL && "text-right")}>
                          <SelectItem value="male" className={cn(isRTL && "text-right")}>{t("Male")}</SelectItem>
                          <SelectItem value="female" className={cn(isRTL && "text-right")}>{t("Female")}</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.gender}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className={cn(
                      "text-sm font-medium text-gray-700 block",
                      isRTL && "text-right"
                    )}>
                      {t("Address")}
                    </Label>
                    <Input
                      id="address"
                      value={patientData.address}
                      onChange={(e) => setPatientData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={t("Enter complete address")}
                      className={cn(
                        "w-full",
                        isRTL && "text-right"
                      )}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={cn(
            "flex pt-4 gap-3",
            isRTL ? "flex-row-reverse justify-start" : "justify-end"
          )}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createLeadMutation.isPending || convertLeadMutation.isPending}
              className={cn(isRTL && "flex-row-reverse")}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createLeadMutation.isPending || convertLeadMutation.isPending}
              className={cn("flex items-center gap-2 min-w-[140px]", isRTL && "flex-row-reverse")}
            >
              {(createLeadMutation.isPending || convertLeadMutation.isPending) ? (
                <>
                  <Loader2 className={cn("h-4 w-4 animate-spin", isRTL && "order-2")} />
                  <span>{autoConvertToPatient ? t("Adding and Converting...") : t("Adding Lead...")}</span>
                </>
              ) : (
                <>
                  {autoConvertToPatient ? (
                    <>
                      <UserCheck className={cn("h-4 w-4", isRTL && "order-2")} />
                      <span>{t("Add Lead & Convert")}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className={cn("h-4 w-4", isRTL && "order-2")} />
                      <span>{t("Add Lead")}</span>
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadModal;


