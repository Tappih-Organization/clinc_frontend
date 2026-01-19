import React, { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Stethoscope,
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
} from "lucide-react";
import { ItemsDetails, FormItem } from "@/components/forms/ItemsDetails";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { Prescription, CreatePrescriptionRequest, Medication } from "@/types";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface EditPrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescriptionId: string | null;
  onSuccess?: () => void;
}

interface FormMedication extends Medication {
  id: string;
}

const EditPrescriptionModal: React.FC<EditPrescriptionModalProps> = ({
  open,
  onOpenChange,
  prescriptionId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    diagnosis: string;
    notes: string;
    followUpDate: string;
    status: "pending" | "active" | "completed" | "cancelled" | "expired";
  }>({
    diagnosis: "",
    notes: "",
    followUpDate: "",
    status: "pending",
  });

  const [medications, setMedications] = useState<FormMedication[]>([]);

  const commonMedications = [
    { name: "Paracetamol", dosages: ["500mg", "650mg", "1000mg"] },
    { name: "Amoxicillin", dosages: ["250mg", "500mg", "875mg"] },
    { name: "Ibuprofen", dosages: ["200mg", "400mg", "600mg"] },
    { name: "Metformin", dosages: ["500mg", "850mg", "1000mg"] },
    { name: "Amlodipine", dosages: ["2.5mg", "5mg", "10mg"] },
    { name: "Lisinopril", dosages: ["5mg", "10mg", "20mg"] },
    { name: "Omeprazole", dosages: ["20mg", "40mg"] },
    { name: "Atorvastatin", dosages: ["10mg", "20mg", "40mg", "80mg"] },
    { name: "Aspirin", dosages: ["75mg", "100mg", "325mg"] },
    { name: "Simvastatin", dosages: ["10mg", "20mg", "40mg"] },
  ];

  const frequencies = [
    t("Once daily"),
    t("Twice daily"),
    t("Three times daily"),
    t("Four times daily"),
    t("Every 4 hours"),
    t("Every 6 hours"),
    t("Every 8 hours"),
    t("Every 12 hours"),
    t("As needed"),
    t("Before meals"),
    t("After meals"),
    t("At bedtime"),
  ];

  const durations = [
    t("3 days"),
    t("5 days"),
    t("7 days"),
    t("10 days"),
    t("14 days"),
    t("21 days"),
    t("30 days"),
    t("60 days"),
    t("90 days"),
    t("Until finished"),
    t("As needed"),
  ];

  useEffect(() => {
    if (open && prescriptionId) {
      fetchPrescriptionDetails();
    }
  }, [open, prescriptionId]);

  const fetchPrescriptionDetails = async () => {
    if (!prescriptionId) return;

    try {
      setLoading(true);
      setError(null);
      const prescriptionData = await apiService.getPrescription(prescriptionId);
      setPrescription(prescriptionData);

      // Populate form data
      setFormData({
        diagnosis: prescriptionData.diagnosis || "",
        notes: prescriptionData.notes || "",
        followUpDate: prescriptionData.follow_up_date
          ? new Date(prescriptionData.follow_up_date).toISOString().split('T')[0]
          : "",
        status: (prescriptionData.status || "pending") as "pending" | "active" | "completed" | "cancelled" | "expired",
      });

      // Populate medications with IDs for form handling
      const medicationsWithIds = prescriptionData.medications.map((med, index) => ({
        ...med,
        id: `med_${index}`,
      }));
      setMedications(medicationsWithIds);

    } catch (err: any) {
      console.error("Error fetching prescription details:", err);
      setError(err.message || t("Failed to fetch prescription details"));
      toast({
        title: t("Error"),
        description: t("Failed to fetch prescription details. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicationsChange = (updatedMedications: FormItem[]) => {
    setMedications(updatedMedications as FormMedication[]);
  };

  const resetForm = () => {
    setFormData({
      diagnosis: "",
      notes: "",
      followUpDate: "",
      status: "pending",
    });
    setMedications([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prescription) {
      toast({
        title: t("Error"),
        description: t("Prescription data not loaded"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.diagnosis) {
        throw new Error(t("Please fill in the diagnosis"));
      }

      // Validate medications
      const validMedications = medications.filter(
        (med) => med.name && med.dosage && med.frequency && med.duration,
      );
      if (validMedications.length === 0) {
        throw new Error(t("Please add at least one complete medication"));
      }

      // Prepare prescription data for API
      const prescriptionData: Partial<CreatePrescriptionRequest> = {
        patient_id: prescription.patient_id._id,
        doctor_id: prescription.doctor_id._id,
        diagnosis: formData.diagnosis,
        medications: validMedications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || "",
          quantity: med.quantity,
        })),
        status: formData.status,
        notes: formData.notes || undefined,
        follow_up_date: formData.followUpDate || undefined,
      };

      // Update prescription via API
      const updatedPrescription = await apiService.updatePrescription(
        prescription._id,
        prescriptionData
      );

      toast({
        title: t("Prescription updated successfully"),
        description: t("Prescription {{id}} has been updated with {{count}} medication(s).", {
          id: updatedPrescription.prescription_id,
          count: validMedications.length
        }),
      });

      // Close modal and call success callback
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error updating prescription:", error);

      // Handle validation errors from backend
      let errorMessage = t("Failed to update prescription. Please try again.");

      if (error.response?.data?.errors) {
        // Handle express-validator errors
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map((err: any) => err.msg).join(", ");
      } else if (error.response?.data?.message) {
        // Handle other backend errors
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Handle client-side errors
        errorMessage = error.message;
      }

      toast({
        title: t("Error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className={cn(isRTL ? "mr-2" : "ml-2")}>{t("Loading prescription...")}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !prescription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error || t("Prescription not found")}</p>
              <Button
                onClick={fetchPrescriptionDetails}
                className="mt-2"
                disabled={!prescriptionId}
              >
                {t("Try Again")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-4xl max-h-[90vh] overflow-y-auto", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <DialogTitle
            className={cn("flex items-center text-xl", isRTL && "flex-row-reverse")}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            <Stethoscope className={cn("h-5 w-5 text-blue-600", isRTL ? "ml-2" : "mr-2")} />
            {t("Edit Prescription")} {prescription.prescription_id}
          </DialogTitle>
          <DialogDescription
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            {isRTL
              ? "تحديث تفاصيل الوصفة والأدوية والتعليمات."
              : t("Update prescription details, medications, and instructions.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Patient and Doctor Information (Read-only) */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className="text-lg"
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                {t("Patient & Doctor Information")}
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                  <Label className="text-sm font-medium text-gray-500">{t("Patient")}</Label>
                  <p className="text-lg font-semibold">
                    {prescription.patient_id
                      ? `${prescription.patient_id.first_name} ${prescription.patient_id.last_name}`
                      : t('Unknown Patient')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {prescription.patient_id
                      ? `${t(prescription.patient_id.gender)} • ${new Date().getFullYear() - new Date(prescription.patient_id.date_of_birth).getFullYear()} ${t("years old")}`
                      : t('N/A')}
                  </p>
                </div>
                <div dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                  <Label className="text-sm font-medium text-gray-500">{t("Doctor")}</Label>
                  <p className="text-lg font-semibold">
                    {t("Dr.")} {prescription.doctor_id.first_name} {prescription.doctor_id.last_name}
                  </p>
                  {prescription.doctor_id.specialization && (
                    <p className="text-sm text-gray-600">{prescription.doctor_id.specialization}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Details */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className="text-lg"
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                {t("Prescription Details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2" dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                  <Label htmlFor="diagnosis">{t("Diagnosis")} *</Label>
                  <Input
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => handleChange("diagnosis", e.target.value)}
                    placeholder={t("Primary diagnosis")}
                    required
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                  />
                </div>

                <div className="space-y-2" dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                  <Label htmlFor="status">{t("Status")}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <SelectTrigger dir={isRTL ? "rtl" : "ltr"}>
                      <SelectValue placeholder={t("Select status")} />
                    </SelectTrigger>
                    <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                      <SelectItem value="pending">{t("Pending")}</SelectItem>
                      <SelectItem value="active">{t("Active")}</SelectItem>
                      <SelectItem value="completed">{t("Completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                      <SelectItem value="expired">{t("Expired")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <ItemsDetails
            items={medications}
            onItemsChange={handleMedicationsChange}
            title={t("Medications")}
            itemLabel={t("Medication")}
            addButtonLabel={t("Add Medication")}
            showCommonItems={true}
            commonItems={commonMedications}
            frequencies={frequencies}
            durations={durations}
            fields={{
              showName: true,
              showDosage: true,
              showFrequency: true,
              showDuration: true,
              showQuantity: true,
              showInstructions: true,
            }}
            minItems={1}
          />

          {/* Additional Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <Calendar className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t("Additional Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className="space-y-2" dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                <Label htmlFor="followUpDate">{t("Follow-up Date")}</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleChange("followUpDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                />
              </div>

              <div className="space-y-2" dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                <Label htmlFor="notes">{t("Clinical Notes")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder={t("Additional clinical notes, warnings, or special instructions...")}
                  rows={3}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                />
              </div>

              {/* Warning for drug interactions */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg" dir={isRTL ? "rtl" : "ltr"}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                    <h4 className="font-medium text-yellow-800">
                      {t("Drug Interaction Check")}
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {isRTL
                        ? "يرجى التحقق من التفاعلات الدوائية وحساسية المريض قبل إنهاء التغييرات على هذه الوصفة."
                        : t("Please verify drug interactions and patient allergies before finalizing changes to this prescription.")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div
            className={cn("flex pt-4", isRTL ? "justify-start space-x-reverse space-x-4" : "justify-end space-x-4")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                  {isRTL ? "جاري تحديث الوصفة..." : t("Updating Prescription...")}
                </>
              ) : (
                <>
                  <Save className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {isRTL ? "تحديث الوصفة" : t("Update Prescription")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPrescriptionModal;
