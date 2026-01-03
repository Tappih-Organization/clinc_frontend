import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Phone, Mail, Globe, FileText, Image } from "lucide-react";

interface ClinicInfoTabProps {
  data: any;
  onChange: (data: any) => void;
}

const ClinicInfoTab: React.FC<ClinicInfoTabProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    logo: "",
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (field: string, value: string) => {
    const newData = {
      ...formData,
      [field]: value,
    };
    setFormData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {t("Clinic Information")}
          </CardTitle>
          <CardDescription>
            {t("Update your clinic's basic information and contact details")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clinic Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("Clinic Name")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("Enter clinic name")}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/200 {t("characters")}
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("Address")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder={t("Enter clinic address")}
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.address.length}/500 {t("characters")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t("Phone")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={t("Enter phone number")}
                maxLength={20}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("Email")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t("Enter email address")}
                required
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("Website")}
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder={t("Enter website URL (optional)")}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("Description")}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={t("Enter clinic description (optional)")}
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 {t("characters")}
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              {t("Logo URL")}
            </Label>
            <Input
              id="logo"
              type="url"
              value={formData.logo}
              onChange={(e) => handleChange("logo", e.target.value)}
              placeholder={t("Enter logo URL (optional)")}
            />
            <p className="text-xs text-muted-foreground">
              {t("Provide a URL to your clinic's logo image")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {formData.name && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">{t("Preview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.logo && (
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="h-16 w-16 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <h3 className="text-xl font-bold">{formData.name}</h3>
              {formData.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {formData.address}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {formData.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {formData.phone}
                  </span>
                )}
                {formData.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {formData.email}
                  </span>
                )}
                {formData.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {formData.website}
                  </span>
                )}
              </div>
              {formData.description && (
                <p className="text-sm mt-2">{formData.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClinicInfoTab;

