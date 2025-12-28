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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreatePatient } from "@/hooks/useApi";
import { parseApiError } from "@/utils/errorHandler";
import type { Patient } from "@/services/api";

interface AddPatientModalProps {
  trigger?: React.ReactNode;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ trigger }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [open, setOpen] = useState(false);
  const createPatientMutation = useCreatePatient();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare patient data according to API schema
      const patientData: Omit<Patient, '_id' | 'created_at' | 'updated_at'> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
        address: formData.address,
        ...(formData.lastVisit && {
          last_visit: new Date(formData.lastVisit),
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
      await createPatientMutation.mutateAsync(patientData);

      toast({
        title: t("Patient added successfully"),
        description: `${formData.firstName} ${formData.lastName} ${t("has been added to the system.")}`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
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

      setOpen(false);
    } catch (error) {
      console.error('Error creating patient:', error);
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
            {t("Add Patient")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn("w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden p-0", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className={cn("px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b flex-shrink-0", isRTL && "text-right")}>
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
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="lastName" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Last Name")} *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        placeholder={t("Doe")}
                        required
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
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
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="phone" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Phone Number")} *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder={t("+1 (555) 123-4567")}
                        required
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="dateOfBirth" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Date of Birth")} *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                        required
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="gender" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Gender")} *</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={t("Select gender")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          <SelectItem value="male">{t("Male")}</SelectItem>
                          <SelectItem value="female">{t("Female")}</SelectItem>
                          <SelectItem value="other">{t("Other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="lastVisit" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Last Visit Date")}</Label>
                      <Input
                        id="lastVisit"
                        type="date"
                        value={formData.lastVisit}
                        onChange={(e) => handleChange("lastVisit", e.target.value)}
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
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
                      className={cn("min-h-[80px] resize-none", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
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
  );
};

export default AddPatientModal;
