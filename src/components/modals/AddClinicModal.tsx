import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useIsRTL } from "@/hooks/useIsRTL";
import { useNavigate } from "react-router-dom";
import apiService from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Phone, Mail, Globe, Settings } from "lucide-react";
import { middleEastCountries, timezones, currencies } from "@/data/countries";

interface AddClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clinicData: ClinicFormData) => void;
}

interface ClinicFormData {
  name: string;
  code: string;
  description?: string;
  address: {
    street: string;
    city: string;
    neighborhood: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    working_hours: {
      monday: { start: string; end: string; isWorking: boolean };
      tuesday: { start: string; end: string; isWorking: boolean };
      wednesday: { start: string; end: string; isWorking: boolean };
      thursday: { start: string; end: string; isWorking: boolean };
      friday: { start: string; end: string; isWorking: boolean };
      saturday: { start: string; end: string; isWorking: boolean };
      sunday: { start: string; end: string; isWorking: boolean };
    };
  };
  is_active: boolean;
}

const languages = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const defaultWorkingHours = {
  monday: { start: "09:00", end: "17:00", isWorking: true },
  tuesday: { start: "09:00", end: "17:00", isWorking: true },
  wednesday: { start: "09:00", end: "17:00", isWorking: true },
  thursday: { start: "09:00", end: "17:00", isWorking: true },
  friday: { start: "09:00", end: "17:00", isWorking: true },
  saturday: { start: "09:00", end: "13:00", isWorking: false },
  sunday: { start: "00:00", end: "00:00", isWorking: false },
};

const AddClinicModal: React.FC<AddClinicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  console.log('🎭 AddClinicModal rendered with props:', { isOpen });
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const [clinicsCount, setClinicsCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState<boolean>(true);
  
  // Generate a unique clinic code based on clinics count
  const generateClinicCode = (count: number) => {
    const nextNumber = count + 1;
    return `CL${nextNumber.toString().padStart(3, '0')}`; // CL001, CL002, etc.
  };

  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    code: "CL001", // Default value until count is fetched
    description: "",
    address: {
      street: "",
      city: "",
      neighborhood: "",
      country: "EG",
    },
    contact: {
      phone: "",
      email: "",
      website: undefined,
    },
    settings: {
      timezone: "Africa/Cairo",
      currency: "EGP",
      language: "en",
      working_hours: defaultWorkingHours,
    },
    is_active: true,
  });

  const [selectedCountry, setSelectedCountry] = useState<string>("EG");

  const [errors, setErrors] = useState<any>({});

  // Fetch clinics count when modal opens
  useEffect(() => {
    const fetchClinicsCount = async () => {
      if (isOpen) {
        try {
          setLoadingCount(true);
          const response = await apiService.getClinics({ tenantScoped: true });
          
          // Get unique clinics count
          const uniqueClinics = new Set();
          response.data.forEach((userClinic: any) => {
            if (userClinic.clinic_id && userClinic.clinic_id._id) {
              uniqueClinics.add(userClinic.clinic_id._id);
            }
          });
          
          const count = uniqueClinics.size;
          setClinicsCount(count);
          
          // Update form with new code
          setFormData(prev => ({
            ...prev,
            code: generateClinicCode(count)
          }));
          
          console.log(`✅ Fetched clinics count: ${count}, Next code: ${generateClinicCode(count)}`);
        } catch (error) {
          console.error('❌ Error fetching clinics count:', error);
          // Keep default CL001 on error
          setClinicsCount(0);
        } finally {
          setLoadingCount(false);
        }
      }
    };

    fetchClinicsCount();
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    
    // Handle clinic code with CL prefix and numbers only
    let finalValue = value;
    if (name === 'code') {
      const upperValue = value.toUpperCase();
      
      // If user tries to delete CL, reset to CL
      if (upperValue === '' || upperValue === 'C') {
        finalValue = 'CL';
      } else if (!upperValue.startsWith('CL')) {
        // If doesn't start with CL, add it
        finalValue = 'CL' + upperValue.replace(/[^0-9]/g, ''); // Only numbers after CL
      } else {
        // Starts with CL, ensure only numbers after it
        const afterCL = upperValue.substring(2);
        finalValue = 'CL' + afterCL.replace(/[^0-9]/g, '');
      }
    }

    if (keys.length === 1) {
      setFormData({ ...formData, [name]: finalValue });
    } else if (keys.length === 2) {
      const [parentKey, childKey] = keys;
      setFormData({
        ...formData,
        [parentKey]: { ...(formData as any)[parentKey], [childKey]: finalValue },
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    const keys = name.split(".");
    
    // Handle country change - reset city
    if (name === "address.country") {
      setSelectedCountry(value);
      setFormData({
        ...formData,
        address: { ...formData.address, country: value, city: "" },
      });
      return;
    }
    
    if (keys.length === 1) {
      setFormData({ ...formData, [name]: value });
    } else if (keys.length === 2) {
      const [parentKey, childKey] = keys;
      setFormData({
        ...formData,
        [parentKey]: { ...(formData as any)[parentKey], [childKey]: value },
      });
    }
  };

  const handleWorkingHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        working_hours: {
          ...formData.settings.working_hours,
          [day]: {
            ...formData.settings.working_hours[day as keyof typeof formData.settings.working_hours],
            [field]: value,
          },
        },
      },
    });
  };

  const validateForm = async () => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = t("Clinic name is required");
    if (!formData.code.trim()) {
      newErrors.code = t("Clinic code is required");
    } else {
      // Clinic code validation - must start with CL followed by digits
      const codeRegex = /^CL\d{3,}$/;
      if (!codeRegex.test(formData.code)) {
        newErrors.code = t("Clinic code must start with CL followed by numbers (e.g., CL001)");
      } else if (formData.code.length < 5) {
        newErrors.code = t("Clinic code must be at least 5 characters (e.g., CL001)");
      } else {
        // Check if code already exists
        try {
          const response = await apiService.getClinics({ tenantScoped: true });
          const existingCodes = response.data
            .filter((userClinic: any) => userClinic.clinic_id && userClinic.clinic_id.code)
            .map((userClinic: any) => userClinic.clinic_id.code.toUpperCase());
          
          if (existingCodes.includes(formData.code.toUpperCase())) {
            newErrors.code = t("This clinic code already exists. Please use a different code.");
          }
        } catch (error) {
          console.error('Error checking clinic code:', error);
        }
      }
    }
    if (!formData.address.street.trim()) newErrors["address.street"] = t("Street address is required");
    if (!formData.address.city.trim()) newErrors["address.city"] = t("City is required");
    if (!formData.address.country.trim()) newErrors["address.country"] = t("Country is required");
    if (!formData.contact.phone.trim()) newErrors["contact.phone"] = t("Phone number is required");
    if (!formData.contact.email.trim()) newErrors["contact.email"] = t("Email is required");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact.email && !emailRegex.test(formData.contact.email)) {
      newErrors["contact.email"] = t("Please enter a valid email address");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      code: generateClinicCode(clinicsCount),
      description: "",
      address: {
        street: "",
        city: "",
        neighborhood: "",
        country: "EG",
      },
      contact: {
        phone: "",
        email: "",
        website: undefined,
      },
      settings: {
        timezone: "Africa/Cairo",
        currency: "EGP",
        language: "en",
        working_hours: defaultWorkingHours,
      },
      is_active: true,
    });
    setSelectedCountry("EG");
    setErrors({});
    onClose();
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('🎭 Dialog onOpenChange called with:', open);
        if (!open) handleClose();
      }}
    >
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isRTL ? "rtl" : "ltr")}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center space-x-2", isRTL ? "ltr" : "ltr" ,isRTL && 'pt-5')} dir={isRTL ? "ltr" : "ltr"}>
            <Building2 className="h-5 w-5" />
            <span>{t("addNew")}</span>
          </DialogTitle>
          <DialogDescription className={isRTL ? "text-right" : "text-left"} dir={isRTL ? "rtl" : "ltr"}>
            {t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Basic Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")} *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t("namePlaceholder")}
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">{t("code")} *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder={t("Auto-generated (e.g., CL123456)")}
                    value={formData.code}
                    onChange={handleInputChange}
                    className={errors.code ? "border-red-500" : ""}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="text-xs text-gray-500">{t("Auto-generated code with CL prefix. You can edit it if needed.")}</p>
                  {errors.code && (
                    <p className="text-sm text-red-500">{errors.code}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t("descriptionPlaceholder")}
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className={cn("flex items-center space-x-2 ", isRTL && "space-x-reverse" )} dir={isRTL ? "ltr" : "ltr"}>
                <Switch
                className={isRTL ? "mr-2" : "mr-2"}
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label className={isRTL ? "pr-2" : "mr-2"} htmlFor="is_active">{t("Active")}</Label>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2" dir={isRTL ? "ltr" : "ltr"}>
                <MapPin className="h-4 w-4" />
                <span >{t("addressInformation")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address.street">{t("streetAddress")} *</Label>
                <Input
                  id="address.street"
                  name="address.street"
                  placeholder={t("streetAddressPlaceholder")}
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className={errors["address.street"] ? "border-red-500" : ""}
                />
                {errors["address.street"] && (
                  <p className="text-sm text-red-500">{errors["address.street"]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.country">{t("country")} *</Label>
                  <Select
                    value={formData.address.country}
                    onValueChange={(value) => handleSelectChange("address.country", value)}
                  >
                    <SelectTrigger className={errors["address.country"] ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("Select country")} />
                    </SelectTrigger>
                    <SelectContent>
                      {middleEastCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {i18n.language === "ar" ? country.nameAr : country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors["address.country"] && (
                    <p className="text-sm text-red-500">{errors["address.country"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.city">{t("city")} *</Label>
                  <Select
                    value={formData.address.city}
                    onValueChange={(value) => handleSelectChange("address.city", value)}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger className={errors["address.city"] ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("Select city")} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCountry && middleEastCountries
                        .find(c => c.code === selectedCountry)
                        ?.cities.map((city, index) => (
                          <SelectItem key={city} value={city}>
                            {i18n.language === "ar" 
                              ? middleEastCountries.find(c => c.code === selectedCountry)?.citiesAr[index] 
                              : city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors["address.city"] && (
                    <p className="text-sm text-red-500">{errors["address.city"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.neighborhood">{t("Neighborhood")}</Label>
                  <Input
                    id="address.neighborhood"
                    name="address.neighborhood"
                    placeholder={t("Enter neighborhood")}
                    value={formData.address.neighborhood}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2" dir={isRTL ? "ltr" : "ltr"}>
                <Phone className="h-4 w-4" />
                <span>{t("Contact Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact.phone">{t("Phone Number")} *</Label>
                  <Input
                    id="contact.phone"
                    name="contact.phone"
                    placeholder={t("Enter phone number")}
                    value={formData.contact.phone}
                    onChange={handleInputChange}
                    className={errors["contact.phone"] ? "border-red-500" : ""}
                  />
                  {errors["contact.phone"] && (
                    <p className="text-sm text-red-500">{errors["contact.phone"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact.email">{t("Email Address")} *</Label>
                  <Input
                    id="contact.email"
                    name="contact.email"
                    type="email"
                    placeholder={t("Enter email address")}
                    value={formData.contact.email}
                    onChange={handleInputChange}
                    className={errors["contact.email"] ? "border-red-500" : ""}
                  />
                  {errors["contact.email"] && (
                    <p className="text-sm text-red-500">{errors["contact.email"]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact.website">{t("websiteOptional")}</Label>
                <Input
                  id="contact.website"
                  name="contact.website"
                  placeholder="https://www.example.com"
                                      value={formData.contact.website || ""}
                    onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2" dir={isRTL ? "ltr" : "ltr"}>
                <Settings className="h-4 w-4" />
                <span>{t("clincsettings")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings.timezone">{t("Timezone")}</Label>
                  <Select
                    value={formData.settings.timezone}
                    onValueChange={(value) => handleSelectChange("settings.timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select timezone")} />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((timezone) => (
                        <SelectItem key={timezone.value} value={timezone.value}>
                          {i18n.language === "ar" ? timezone.labelAr : timezone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings.currency">{t("Currency")}</Label>
                  <Select
                    value={formData.settings.currency}
                    onValueChange={(value) => handleSelectChange("settings.currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select currency")} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {i18n.language === "ar" ? currency.labelAr : currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings.language">{t("Language")}</Label>
                  <Select
                    value={formData.settings.language}
                    onValueChange={(value) => handleSelectChange("settings.language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select language")} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Working Hours */}
              <div className={cn("space-y-3", isRTL && "text-right")} dir={isRTL ? "ltr" : "ltr"}>
                <Label className={cn("text-sm font-medium", isRTL && "text-right")} >{t("Working Hours")}</Label>
                <div className="space-y-3">
                  {Object.entries(formData.settings.working_hours).map(([day, schedule]) => (
                    <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-20">
                        <span className="text-sm font-medium capitalize"> {t(`${day}`)}</span>
                      </div>
                      <Switch
                        checked={schedule.isWorking}
                        onCheckedChange={(checked) =>
                          handleWorkingHoursChange(day, "isWorking", checked)
                        }
                      />
                      {schedule.isWorking && (
                        <div className={cn("flex items-center space-x-4", isRTL && 'space-x-reverse', isRTL && "flex-row-reverse")}>
                          <Input
                            type="time"
                            value={schedule.start}
                            onChange={(e) =>
                              handleWorkingHoursChange(day, "start", e.target.value)
                            }
                            className="w-30 "
                          />
                          <span className="text-sm text-gray-500">{t("to")}</span>
                          <Input
                            type="time"
                            value={schedule.end}
                            onChange={(e) =>
                              handleWorkingHoursChange(day, "end", e.target.value)
                            }
                            className="w-30"
                          />
                        </div>
                      )}
                      {!schedule.isWorking && (
                        <span className="text-sm text-gray-500">{t("closed")}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className={cn("flex justify-end space-x-2 pt-4", isRTL && "text-right")} dir={isRTL ? "ltr" : "ltr"}>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t("Cancel")}
            </Button>
            <Button type="submit">{t("Add Clinic")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClinicModal; 