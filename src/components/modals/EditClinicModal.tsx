import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

interface EditClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clinicData: ClinicFormData) => void;
  clinic: Clinic;
}

interface Clinic {
  id: string;
  name: string;
  code: string;
  description?: string;
  address: {
    street: string;
    city: string;
    neighborhood?: string;
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
  createdAt: string;
  updatedAt: string;
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

const EditClinicModal: React.FC<EditClinicModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clinic,
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    code: "",
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
      working_hours: {
        monday: { start: "09:00", end: "17:00", isWorking: true },
        tuesday: { start: "09:00", end: "17:00", isWorking: true },
        wednesday: { start: "09:00", end: "17:00", isWorking: true },
        thursday: { start: "09:00", end: "17:00", isWorking: true },
        friday: { start: "09:00", end: "17:00", isWorking: true },
        saturday: { start: "09:00", end: "13:00", isWorking: false },
        sunday: { start: "00:00", end: "00:00", isWorking: false },
      },
    },
    is_active: true,
  });

  const [selectedCountry, setSelectedCountry] = useState<string>("EG");
  const [errors, setErrors] = useState<any>({});

  // Populate form with clinic data when modal opens
  useEffect(() => {
    if (isOpen && clinic) {
      setFormData({
        name: clinic.name,
        code: clinic.code,
        description: clinic.description || "",
        address: {
          street: clinic.address.street,
          city: clinic.address.city,
          neighborhood: clinic.address.neighborhood || "",
          country: clinic.address.country || "EG",
        },
        contact: {
          ...clinic.contact,
          website: clinic.contact.website || undefined,
        },
        settings: clinic.settings,
        is_active: clinic.is_active,
      });
      setSelectedCountry(clinic.address.country || "EG");
    }
  }, [isOpen, clinic]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    
    // Auto-uppercase clinic code
    const finalValue = name === 'code' ? value.toUpperCase() : value;

    if (keys.length === 1) {
      setFormData({ ...formData, [name]: finalValue });
    } else if (keys.length === 2) {
      setFormData({
        ...formData,
        [keys[0]]: { ...formData[keys[0] as keyof ClinicFormData], [keys[1]]: finalValue },
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
      setFormData({
        ...formData,
        [keys[0]]: { ...formData[keys[0] as keyof ClinicFormData], [keys[1]]: value },
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

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = "Clinic name is required";
    if (!formData.code.trim()) {
      newErrors.code = "Clinic code is required";
    } else {
      // Clinic code validation - must contain only uppercase letters and numbers
      const codeRegex = /^[A-Z0-9]+$/;
      if (!codeRegex.test(formData.code)) {
        newErrors.code = "Clinic code must contain only uppercase letters and numbers";
      }
    }
    if (!formData.address.street.trim()) newErrors["address.street"] = "Street address is required";
    if (!formData.address.city.trim()) newErrors["address.city"] = "City is required";
    if (!formData.address.country.trim()) newErrors["address.country"] = "Country is required";
    if (!formData.contact.phone.trim()) newErrors["contact.phone"] = "Phone number is required";
    if (!formData.contact.email.trim()) newErrors["contact.email"] = "Email is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact.email && !emailRegex.test(formData.contact.email)) {
      newErrors["contact.email"] = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Edit Clinic</span>
          </DialogTitle>
          <DialogDescription>
            Update clinic information, contact details, and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter clinic name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Clinic Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="Enter clinic code (e.g., CLN001)"
                    value={formData.code}
                    onChange={handleInputChange}
                    className={errors.code ? "border-red-500" : ""}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="text-xs text-gray-500">Only uppercase letters and numbers allowed (automatically converted)</p>
                  {errors.code && (
                    <p className="text-sm text-red-500">{errors.code}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter clinic description (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Address Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address.street">Street Address *</Label>
                <Input
                  id="address.street"
                  name="address.street"
                  placeholder="Enter street address"
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
                  <Label htmlFor="address.country">Country *</Label>
                  <Select
                    value={formData.address.country}
                    onValueChange={(value) => handleSelectChange("address.country", value)}
                  >
                    <SelectTrigger className={errors["address.country"] ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select country" />
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
                  <Label htmlFor="address.city">City *</Label>
                  <Select
                    value={formData.address.city}
                    onValueChange={(value) => handleSelectChange("address.city", value)}
                    disabled={!selectedCountry}
                  >
                    <SelectTrigger className={errors["address.city"] ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select city" />
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
                  <Label htmlFor="address.neighborhood">Neighborhood</Label>
                  <Input
                    id="address.neighborhood"
                    name="address.neighborhood"
                    placeholder="Enter neighborhood"
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
              <CardTitle className="text-lg flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact.phone">Phone Number *</Label>
                  <Input
                    id="contact.phone"
                    name="contact.phone"
                    placeholder="Enter phone number"
                    value={formData.contact.phone}
                    onChange={handleInputChange}
                    className={errors["contact.phone"] ? "border-red-500" : ""}
                  />
                  {errors["contact.phone"] && (
                    <p className="text-sm text-red-500">{errors["contact.phone"]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact.email">Email Address *</Label>
                  <Input
                    id="contact.email"
                    name="contact.email"
                    type="email"
                    placeholder="Enter email address"
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
                <Label htmlFor="contact.website">Website (Optional)</Label>
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
              <CardTitle className="text-lg flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Clinic Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings.timezone">Timezone</Label>
                  <Select
                    value={formData.settings.timezone}
                    onValueChange={(value) => handleSelectChange("settings.timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
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
                  <Label htmlFor="settings.currency">Currency</Label>
                  <Select
                    value={formData.settings.currency}
                    onValueChange={(value) => handleSelectChange("settings.currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
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
                  <Label htmlFor="settings.language">Language</Label>
                  <Select
                    value={formData.settings.language}
                    onValueChange={(value) => handleSelectChange("settings.language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
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
              <div className="space-y-3">
                <Label className="text-sm font-medium">Working Hours</Label>
                <div className="space-y-3">
                  {Object.entries(formData.settings.working_hours).map(([day, schedule]) => (
                    <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-20">
                        <span className="text-sm font-medium capitalize">{day}</span>
                      </div>
                      <Switch
                        checked={schedule.isWorking}
                        onCheckedChange={(checked) =>
                          handleWorkingHoursChange(day, "isWorking", checked)
                        }
                      />
                      {schedule.isWorking && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={schedule.start}
                            onChange={(e) =>
                              handleWorkingHoursChange(day, "start", e.target.value)
                            }
                            className="w-24"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <Input
                            type="time"
                            value={schedule.end}
                            onChange={(e) =>
                              handleWorkingHoursChange(day, "end", e.target.value)
                            }
                            className="w-24"
                          />
                        </div>
                      )}
                      {!schedule.isWorking && (
                        <span className="text-sm text-gray-500">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Update Clinic</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClinicModal; 