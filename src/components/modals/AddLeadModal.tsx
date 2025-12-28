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
import { UserPlus, Plus, Globe, Phone, Mail, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateLead } from "@/hooks/useApi";
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

  const createLeadMutation = useCreateLead();

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.source) {
      toast({
        title: t("Error"),
        description: t("Please select a lead source."),
        variant: "destructive",
      });
      return;
    }

    try {
      await createLeadMutation.mutateAsync({
        ...formData,
        source: formData.source as "website" | "referral" | "social" | "advertisement" | "walk-in",
      });

      toast({
        title: t("Lead added successfully"),
        description: `${formData.firstName} ${formData.lastName} ${t("has been added as a new lead.")}`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        source: "",
        serviceInterest: "",
        status: "new" as const,
        assignedTo: "",
        notes: "",
      });

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
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <UserPlus className="h-5 w-5" />
            {t("Add New Lead")}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && "text-right")}>
            {t("Capture information about potential patients and track them through the conversion process.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Phone className="h-4 w-4" />
                {t("Contact Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className={cn(isRTL && "text-right")}>{t("First Name *")}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("Enter first name")}
                    required
                    className={cn(isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className={cn(isRTL && "text-right")}>{t("Last Name *")}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder={t("Enter last name")}
                    required
                    className={cn(isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className={cn(isRTL && "text-right")}>{t("Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder={t("Enter email address")}
                    className={cn(isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className={cn(isRTL && "text-right")}>{t("Phone Number *")}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder={t("Enter phone number")}
                    required
                    className={cn(isRTL && "text-right")}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Globe className="h-4 w-4" />
                {t("Lead Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source" className={cn(isRTL && "text-right")}>{t("Lead Source *")}</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleChange("source", value)}
                  >
                    <SelectTrigger className={cn(isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t("How did they find us?")} />
                    </SelectTrigger>
                    <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                      {leadSources.map((source) => (
                        <SelectItem key={source.value} value={source.value} className={cn(isRTL && "text-right")}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceInterest" className={cn(isRTL && "text-right")}>{t("Service Interest *")}</Label>
                  <Select
                    value={formData.serviceInterest}
                    onValueChange={(value) =>
                      handleChange("serviceInterest", value)
                    }
                  >
                    <SelectTrigger className={cn(isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue placeholder={t("What service are they interested in?")} />
                    </SelectTrigger>
                    <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                      {services.map((service) => (
                        <SelectItem key={service} value={service} className={cn(isRTL && "text-right")}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo" className={cn(isRTL && "text-right")}>{t("Assigned To")}</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
                  placeholder={t("Assign to staff member (optional)")}
                  className={cn(isRTL && "text-right")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className={cn(isRTL && "text-right")}>{t("Notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder={t("Additional information about the lead, their needs, timeline, etc.")}
                  rows={3}
                  className={cn(isRTL && "text-right")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={cn("flex pt-4", isRTL ? "justify-end gap-3 flex-row-reverse" : "justify-end gap-3")}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createLeadMutation.isPending}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createLeadMutation.isPending}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              {createLeadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Adding Lead...")}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {t("Add Lead")}
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
