import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
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
import { Calendar, Plus, Clock, User, Stethoscope } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseApiError } from "@/utils/errorHandler";
import { apiService } from "@/services/api";
import { useCreateAppointment } from "@/hooks/useApi";
import type { Patient, User as Doctor, Appointment } from "@/services/api";
import type { Service } from "@/types";
import { serviceApi } from "@/services/api/serviceApi";

interface NewAppointmentModalProps {
  trigger?: React.ReactNode;
  preSelectedPatientId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  trigger,
  preSelectedPatientId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [loadingData, setLoadingData] = useState(false);
  
  // Add validation state
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [validationVariant, setValidationVariant] = useState<"default" | "destructive">("default");
  
  // React Query mutation for creating appointments
  const createAppointmentMutation = useCreateAppointment();
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    nurseId: "",
    serviceId: "",
    date: "",
    time: "",
    duration: "30",
    symptoms: "",
    notes: "",
    appointmentType: "consultation",
  });

  // State for API data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  // Load patients, doctors, and services when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Set pre-selected patient when available
  useEffect(() => {
    if (preSelectedPatientId && open) {
      setFormData(prev => ({ ...prev, patientId: preSelectedPatientId }));
    }
  }, [preSelectedPatientId, open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [patientsResponse, doctorsResponse, nursesResponse, servicesResponse] = await Promise.all([
        apiService.getPatients({ limit: 100 }),
        apiService.getDoctors({ limit: 100 }),
        apiService.getNurses({ limit: 100 }),
        serviceApi.getServices({ isActive: true, limit: 100 })
      ]);

      setPatients(patientsResponse.data.patients);
      setDoctors(doctorsResponse.data.items);
      setNurses(nursesResponse.data.items);
      setServices(servicesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      
      toast({
        title: "Error loading data",
        description: parseApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Validation helper function
  const validateDateTime = (date: string, time: string) => {
    if (!date || !time) {
      setValidationMessage("");
      return;
    }

    // Parse the date and time components separately for consistent timezone handling
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create date in local timezone
    const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    if (selectedDateTime <= now) {
      setValidationMessage("⚠️ Selected date and time is in the past");
      setValidationVariant("destructive");
      return false;
    }

    if (selectedDateTime <= thirtyMinutesFromNow) {
      setValidationMessage("⚠️ Appointments must be scheduled at least 30 minutes in advance");
      setValidationVariant("destructive");
      return false;
    }

    const dayOfWeek = selectedDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setValidationMessage("💡 Weekend appointment - please confirm availability");
      setValidationVariant("default");
      return true;
    }

    setValidationMessage("✅ Valid appointment time");
    setValidationVariant("default");
    return true;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-set duration when service is selected
    if (field === "serviceId") {
      const selectedService = services.find((s) => s.id === value);
      if (selectedService) {
        setFormData((prev) => ({
          ...prev,
          duration: selectedService.duration.toString(),
        }));
      }
    }

    // Validate date/time when either is changed
    if (field === "date" || field === "time") {
      const newDate = field === "date" ? value : formData.date;
      const newTime = field === "time" ? value : formData.time;
      validateDateTime(newDate, newTime);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.patientId) {
      toast({
        title: "Validation Error",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.doctorId) {
      toast({
        title: "Validation Error",
        description: "Please select a doctor.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.date || !formData.time) {
      toast({
        title: "Validation Error",
        description: "Please select both date and time.",
        variant: "destructive",
      });
      return;
    }

    // Final date/time validation
    if (!validateDateTime(formData.date, formData.time)) {
      toast({
        title: "Validation Error",
        description: "Please select a valid future date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a proper Date object ensuring local timezone interpretation
      // Parse the date and time components separately to avoid timezone confusion
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      // Create date in local timezone
      const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Prepare appointment data according to API schema
      const appointmentData: Omit<Appointment, '_id' | 'created_at' | 'updated_at'> = {
        patient_id: formData.patientId,
        doctor_id: formData.doctorId,
        ...(formData.nurseId && { nurse_id: formData.nurseId }),
        ...(formData.serviceId && { service_id: formData.serviceId }),
        appointment_date: appointmentDateTime.toISOString(),
        duration: parseInt(formData.duration),
        status: 'scheduled',
        type: formData.appointmentType,
        notes: formData.notes,
      };

      // Create appointment via mutation
      await createAppointmentMutation.mutateAsync(appointmentData);

      toast({
        title: "Appointment scheduled successfully",
        description: `Appointment has been scheduled for ${appointmentDateTime.toLocaleString()}.`,
      });

      // Reset form
      setFormData({
        patientId: "",
        doctorId: "",
        nurseId: "",
        serviceId: "",
        date: "",
        time: "",
        duration: "30",
        symptoms: "",
        notes: "",
        appointmentType: "consultation",
      });

      setValidationMessage("");
      setOpen(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
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
            {t("New Appointment")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn("w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden p-0", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col h-full min-h-0">
          <DialogHeader className={cn("px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b flex-shrink-0", isRTL && "text-right")}>
            <DialogTitle className={cn("flex items-center gap-2 text-lg sm:text-xl", isRTL && "flex-row-reverse justify-end")}>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {t("Schedule New Appointment")}
            </DialogTitle>
            <DialogDescription className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
              {t("Create a new appointment for a patient with a doctor.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Patient & Doctor Selection */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <User className="h-4 w-4" />
                    {t("Patient & Doctor Selection")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="patientId" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Patient")} *</Label>
                      <Select
                        value={formData.patientId}
                        onValueChange={(value) => handleChange("patientId", value)}
                        disabled={loadingData}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={loadingData ? t("Loading patients...") : t("Select a patient")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          {patients.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.first_name} {patient.last_name} - {patient.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="doctorId" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Doctor")} *</Label>
                      <Select
                        value={formData.doctorId}
                        onValueChange={(value) => handleChange("doctorId", value)}
                        disabled={loadingData}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={loadingData ? t("Loading doctors...") : t("Select a doctor")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor._id} value={doctor._id}>
                              Dr. {doctor.first_name} {doctor.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="nurseId" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Nurse (Optional)")}</Label>
                      <Select
                        value={formData.nurseId}
                        onValueChange={(value) => handleChange("nurseId", value)}
                        disabled={loadingData}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={loadingData ? t("Loading nurses...") : t("Select a nurse")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          {nurses.map((nurse) => (
                            <SelectItem key={nurse._id} value={nurse._id}>
                              {nurse.first_name} {nurse.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="serviceId" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Service (Optional)")}</Label>
                      <Select
                        value={formData.serviceId}
                        onValueChange={(value) => handleChange("serviceId", value)}
                        disabled={loadingData}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={loadingData ? t("Loading services...") : t("Select a service")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.price} ({service.duration}min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <Clock className="h-4 w-4" />
                    {t("Date & Time")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="date" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Date")} *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange("date", e.target.value)}
                        required
                        className={cn("h-9 sm:h-10", isRTL && "text-right")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="time" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Time")} *</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(value) => handleChange("time", value)}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={t("Select time")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="duration" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Duration")} ({t("minutes")})</Label>
                      <Select
                        value={formData.duration}
                        onValueChange={(value) => handleChange("duration", value)}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={t("Duration")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          <SelectItem value="15">15 {t("minutes")}</SelectItem>
                          <SelectItem value="30">30 {t("minutes")}</SelectItem>
                          <SelectItem value="45">45 {t("minutes")}</SelectItem>
                          <SelectItem value="60">60 {t("minutes")}</SelectItem>
                          <SelectItem value="90">90 {t("minutes")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={cn("space-y-2", isRTL && "text-right")}>
                      <Label htmlFor="appointmentType" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Type")}</Label>
                      <Select
                        value={formData.appointmentType}
                        onValueChange={(value) => handleChange("appointmentType", value)}
                      >
                        <SelectTrigger className={cn("h-9 sm:h-10", isRTL && "text-right")}>
                          <SelectValue placeholder={t("Type")} />
                        </SelectTrigger>
                        <SelectContent align={isRTL ? "start" : "end"}>
                          <SelectItem value="consultation">{t("Consultation")}</SelectItem>
                          <SelectItem value="follow-up">{t("Follow-up")}</SelectItem>
                          <SelectItem value="check-up">{t("Check-up")}</SelectItem>
                          <SelectItem value="vaccination">{t("Vaccination")}</SelectItem>
                          <SelectItem value="procedure">{t("Procedure")}</SelectItem>
                          <SelectItem value="emergency">{t("Emergency")}</SelectItem>
                          <SelectItem value="screening">{t("Screening")}</SelectItem>
                          <SelectItem value="therapy">{t("Therapy")}</SelectItem>
                          <SelectItem value="other">{t("Other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {validationMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      validationVariant === "destructive" 
                        ? "bg-red-50 text-red-700 border border-red-200" 
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {validationMessage}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border border-border">
                <CardHeader className={cn("pb-3", isRTL && "text-right")}>
                  <CardTitle className={cn("text-base sm:text-lg flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                    <Stethoscope className="h-4 w-4" />
                    {t("Additional Information")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <Label htmlFor="symptoms" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Symptoms")}</Label>
                    <Textarea
                      id="symptoms"
                      value={formData.symptoms}
                      onChange={(e) => handleChange("symptoms", e.target.value)}
                      placeholder={t("Describe the patient's symptoms...")}
                      className={cn("min-h-[80px] resize-none", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div className={cn("space-y-2", isRTL && "text-right")}>
                    <Label htmlFor="notes" className={cn("text-sm font-medium", isRTL && "text-right")}>{t("Notes")}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder={t("Any additional notes for the appointment...")}
                      className={cn("min-h-[80px] resize-none", isRTL && "text-right")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
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
                disabled={createAppointmentMutation.isPending}
                className="w-full sm:w-auto"
              >
                {t("Cancel")}
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={createAppointmentMutation.isPending || loadingData}
                className={cn("w-full sm:w-auto flex items-center gap-2", isRTL && "flex-row-reverse")}
              >
                {createAppointmentMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("Scheduling...")}
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    {t("Schedule Appointment")}
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

export default NewAppointmentModal;

