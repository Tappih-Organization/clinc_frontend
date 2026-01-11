import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  Shield,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreatePatient, usePatients } from "@/hooks/useApi";
import { parseApiError } from "@/utils/errorHandler";
import type { Patient } from "@/services/api";

interface AddPatientModalProps {
  trigger?: React.ReactNode;
  onSuccess?: (patient: Patient) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ 
  trigger, 
  onSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
  const createPatientMutation = useCreatePatient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch all patients to check for duplicate phone numbers
  const { data: patientsData } = usePatients({ 
    limit: 10000, // Get all patients to check for duplicates
    tenantScoped: true 
  });
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    bloodGroup: "",
    allergies: "",
    medicalHistory: "",
    height: "",
    weight: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    lastVisit: "",
  });

  // Validation helper functions
  const validateName = (name: string): boolean => {
    // Allow alphabetic characters, spaces, hyphens, and apostrophes (for names like O'Brien, Mary-Jane)
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s'-]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  };

  const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    // Remove spaces, dashes, parentheses, and plus signs for validation
    const cleanedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Check if contains only digits
    if (!/^\d+$/.test(cleanedPhone)) {
      return { isValid: false, error: t("Phone number must contain only digits") };
    }
    
    // Validate length (international format: 7-15 digits)
    if (cleanedPhone.length < 7) {
      return { isValid: false, error: t("Phone number must be at least 7 digits") };
    }
    
    if (cleanedPhone.length > 15) {
      return { isValid: false, error: t("Phone number cannot exceed 15 digits") };
    }
    
    return { isValid: true };
  };

  const validateAddress = (address: string): boolean => {
    // Address should not be empty and should contain valid characters
    // Allow letters, numbers, spaces, common punctuation, and special characters for addresses
    const addressRegex = /^[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\.,\-#\/\(\)]+$/;
    return address.trim().length > 0 && addressRegex.test(address);
  };

  const handleChange = (field: string, value: string) => {
    // Real-time validation for specific fields
    if (field === 'firstName' || field === 'lastName') {
      // Allow only valid name characters
      if (value === '' || /^[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s'-]*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else if (field === 'phone') {
      // Allow digits, spaces, dashes, parentheses, and plus sign
      if (value === '' || /^[\d\s\-\(\)\+]*$/.test(value)) {
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

    // First Name validation
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

    // Phone Number validation
    if (!formData.phone.trim()) {
      newErrors.phone = t("Phone number is required");
    } else {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || t("Please enter a valid phone number");
      } else {
        // Check for duplicate phone number
        const cleanedPhone = formData.phone.replace(/[\s\-\(\)\+]/g, '');
        const existingPatients = patientsData?.data?.patients || [];
        const duplicatePatient = existingPatients.find((patient: any) => {
          const existingPhone = patient.phone?.replace(/[\s\-\(\)\+]/g, '') || '';
          return existingPhone === cleanedPhone;
        });
        
        if (duplicatePatient) {
          newErrors.phone = t("This phone number is already registered");
        }
      }
    }

    // Date of Birth validation (optional - skip if empty)
    // No validation needed if dateOfBirth is empty

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = t("Gender is required");
    }

    // Address validation (optional)
    if (formData.address.trim() && !validateAddress(formData.address)) {
      newErrors.address = t("Address contains invalid characters");
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t("Please enter a valid email address");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare patient data according to API schema
      const patientData: Omit<Patient, '_id' | 'created_at' | 'updated_at'> = {
        first_name: formData.firstName,
        ...(formData.lastName && { last_name: formData.lastName }),
        email: formData.email || `${formData.firstName.toLowerCase().replace(/\s+/g, '')}@temp.clinic`,
        phone: formData.phone,
        ...(formData.dateOfBirth && { date_of_birth: formData.dateOfBirth }),
        gender: (formData.gender || 'male') as 'male' | 'female',
        ...(formData.address && { address: formData.address }),
        ...(formData.lastVisit && {
          last_visit: formData.lastVisit,
        }),
        ...(formData.emergencyContactName && {
          emergency_contact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyContactRelationship,
            phone: formData.emergencyContactPhone,
          }
        }),
        ...((formData.insuranceProvider || formData.insurancePolicyNumber) && {
          insurance_info: {
            provider: formData.insuranceProvider,
            policy_number: formData.insurancePolicyNumber,
          }
        })
      };

      // Create patient via mutation
      const newPatient = await createPatientMutation.mutateAsync(patientData);

      toast({
        title: t("Patient added successfully"),
        description: `${formData.firstName}${formData.lastName ? ` ${formData.lastName}` : ''} ${t("has been added to the system.")}`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "male",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        bloodGroup: "",
        allergies: "",
        medicalHistory: "",
        height: "",
        weight: "",
        insuranceProvider: "",
        insurancePolicyNumber: "",
        lastVisit: "",
      });

      setErrors({});
      setOpen(false);
      
      // Call onSuccess callback if provided
      if (onSuccess && newPatient) {
        onSuccess(newPatient);
      }
    } catch (error: any) {
      console.error('Error creating patient:', error);
      
      // Handle server-side validation errors
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors: Record<string, string> = {};
        
        error.response.data.errors.forEach((err: any) => {
          // Map server field names to form field names
          const fieldMapping: Record<string, string> = {
            'first_name': 'firstName',
            'last_name': 'lastName',
            'date_of_birth': 'dateOfBirth',
            'phone': 'phone',
            'email': 'email',
            'address': 'address',
            'gender': 'gender',
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
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
    if (!newOpen) {
      // Reset errors when dialog closes
      setErrors({});
    }
  };

  return (
    <>
      {externalOpen !== undefined && trigger && (
        <div onClick={() => handleOpenChange(true)} style={{ display: 'inline-block' }}>
          {trigger}
        </div>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {externalOpen === undefined && trigger && (
          <DialogTrigger asChild>
            {trigger}
          </DialogTrigger>
        )}
        {!trigger && (
          <DialogTrigger asChild>
            <Button className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Plus className="h-4 w-4" />
              {t("Add Patient")}
            </Button>
          </DialogTrigger>
        )}
      <DialogContent className={cn("w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden p-0", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className={cn("px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b flex-shrink-0", isRTL && "text-right", isRTL ? "pr-12 sm:pr-14" : "pl-12 sm:pl-14")}>
            <DialogTitle className={cn("flex items-center gap-2 text-lg sm:text-xl", isRTL && "flex-row-reverse justify-end")}>
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {t("Add New Patient")}
            </DialogTitle>
            <DialogDescription className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
              {t("Enter patient information to create a new medical record in the system.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <User className="h-4 w-4" />
                    {t("Personal Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="firstName" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("First Name")} *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        placeholder={t("John")}
                        required
                        className={cn("h-9 sm:h-10", errors.firstName && "border-red-500", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      {errors.firstName && (
                        <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.firstName}</p>
                      )}
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="lastName" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Last Name")}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        placeholder={t("Doe")}
                        className={cn("h-9 sm:h-10", errors.lastName && "border-red-500", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      {errors.lastName && (
                        <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="email" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder={t("john.doe@email.com")}
                        className={cn("h-9 sm:h-10", errors.email && "border-red-500", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      {errors.email && (
                        <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.email}</p>
                      )}
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="phone" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Phone Number")} *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder={t("+1 (555) 123-4567")}
                        required
                        className={cn("h-9 sm:h-10", errors.phone && "border-red-500", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      {errors.phone && (
                        <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="dateOfBirth" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Date of Birth")}</Label>
                      <div className="relative">
                        <Calendar className={cn(
                          "absolute top-1/2 transform -translate-y-1/2 h-4 w-4",
                          isRTL ? "right-3" : "left-3",
                          "text-muted-foreground dark:text-gray-300"
                        )} />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className={cn(
                            "h-9 sm:h-10",
                            isRTL ? "pr-10" : "pl-10",
                            errors.dateOfBirth && "border-red-500",
                            isRTL && "text-right"
                          )}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          style={isRTL ? { direction: 'rtl' } : { direction: 'ltr' }}
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.dateOfBirth}</p>
                      )}
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="gender" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Gender")} *</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                        <SelectTrigger className={cn("h-9 sm:h-10", errors.gender && "border-red-500", isRTL && "text-right")}>
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="lastVisit" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Last Visit Date")}</Label>
                      <div className="relative">
                        <Calendar className={cn(
                          "absolute top-1/2 transform -translate-y-1/2 h-4 w-4",
                          isRTL ? "right-3" : "left-3",
                          "text-muted-foreground dark:text-gray-300"
                        )} />
                        <Input
                          id="lastVisit"
                          type="date"
                          value={formData.lastVisit}
                          onChange={(e) => handleChange("lastVisit", e.target.value)}
                          className={cn(
                            "h-9 sm:h-10",
                            isRTL ? "pr-10" : "pl-10",
                            isRTL && "text-right"
                          )}
                          dir={isRTL ? 'rtl' : 'ltr'}
                          style={isRTL ? { direction: 'rtl' } : { direction: 'ltr' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* Empty space for alignment */}
                    </div>
                  </div>

                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <Label htmlFor="address" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Address")}</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      placeholder={t("Street address, city, state, ZIP code")}
                      className={cn("min-h-[80px] resize-none", errors.address && "border-red-500", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {errors.address && (
                      <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <Phone className="h-4 w-4" />
                    {t("Emergency Contact")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="emergencyContactName" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Contact Name")}</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                        placeholder={t("Jane Doe")}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="emergencyContactRelationship" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Relationship")}</Label>
                      <Input
                        id="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={(e) => handleChange("emergencyContactRelationship", e.target.value)}
                        placeholder={t("Spouse, Parent, Sibling...")}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <Label htmlFor="emergencyContactPhone" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Contact Phone")}</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                      placeholder={t("+1 (555) 987-6543")}
                      className={cn("h-9 sm:h-10", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <Heart className="h-4 w-4" />
                    {t("Medical Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="bloodGroup" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Blood Group")}</Label>
                      <Select value={formData.bloodGroup} onValueChange={(value) => handleChange("bloodGroup", value)}>
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={t("Select blood group")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="height" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Height (cm)")}</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleChange("height", e.target.value)}
                        placeholder={t("170")}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="weight" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Weight (kg)")}</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleChange("weight", e.target.value)}
                        placeholder={t("70")}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>

                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <Label htmlFor="allergies" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Allergies")}</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleChange("allergies", e.target.value)}
                      placeholder={t("List any known allergies (medications, food, environmental)")}
                      className={cn("min-h-[80px] resize-none", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <Label htmlFor="medicalHistory" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Medical History")}</Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={(e) => handleChange("medicalHistory", e.target.value)}
                      placeholder={t("Previous medical conditions, surgeries, medications")}
                      className={cn("min-h-[80px] resize-none", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Information */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <Shield className="h-4 w-4" />
                    {t("Insurance Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="insuranceProvider" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Insurance Provider")}</Label>
                      <Input
                        id="insuranceProvider"
                        value={formData.insuranceProvider}
                        onChange={(e) => handleChange("insuranceProvider", e.target.value)}
                        placeholder={t("Blue Cross Blue Shield")}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="insurancePolicyNumber" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Policy Number")}</Label>
                      <Input
                        id="insurancePolicyNumber"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => handleChange("insurancePolicyNumber", e.target.value)}
                        placeholder={t("ABC123456789")}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Footer with buttons */}
          <div className={cn("border-t bg-background px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0", isRTL && "text-right")}>
            <div className={cn("flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3", isRTL && "sm:flex-row-reverse")}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
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
                    <Plus className="h-4 w-4" />
                    {t("Add Patient")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AddPatientModal;
