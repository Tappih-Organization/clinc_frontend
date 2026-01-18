import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Stethoscope,
  User,
  Calendar,
  Clock,
  Printer,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { Prescription } from "@/types";
import { ItemsDetailsView } from "@/components/forms/ItemsDetailsView";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface PrescriptionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescriptionId: string | null;
  onPrint?: (prescriptionId: string) => void;
  onSendToPharmacy?: (prescriptionId: string) => void;
}

const PrescriptionDetailModal: React.FC<PrescriptionDetailModalProps> = ({
  open,
  onOpenChange,
  prescriptionId,
  onPrint,
  onSendToPharmacy,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error("Error fetching prescription details:", err);
      setError(err.message || "Failed to fetch prescription details");
      toast({
        title: t("Error"),
        description: t("Failed to fetch prescription details. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "active": t("Active"),
      "completed": t("Completed"),
      "pending": t("Pending"),
      "cancelled": t("Cancelled"),
      "expired": t("Expired"),
    };
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (dateOfBirth: string | Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handlePrint = () => {
    if (prescription && onPrint) {
      onPrint(prescription._id);
    }
  };

  const handleSendToPharmacy = () => {
    if (prescription && onSendToPharmacy) {
      onSendToPharmacy(prescription._id);
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
            <Loader2 className={cn("h-8 w-8 animate-spin", isRTL && "order-2")} />
            <span 
              className={cn(isRTL ? "mr-2" : "ml-2")}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
            >
              {t("Loading prescription details...")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !prescription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
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

  // Standardized Info Row Component for consistent RTL alignment
  const InfoRow: React.FC<{
    label: string;
    value: React.ReactNode;
    valueDir?: "ltr" | "rtl";
    icon?: React.ReactNode;
    className?: string;
  }> = ({ label, value, valueDir, icon, className = "" }) => {
    const finalValueDir = valueDir || (isRTL ? "rtl" : "ltr");
    const isLTRContent = finalValueDir === "ltr";
    return (
      <div 
        className={cn("space-y-1.5", className)} 
        dir={isRTL ? "rtl" : "ltr"}
        style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
      >
        <label 
          className={cn(
            "text-sm font-medium text-gray-500 block leading-tight",
            isRTL ? "text-right" : "text-left"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
        >
          {label}
        </label>
        <div 
          className={cn(
            "flex items-baseline min-h-[1.5rem]",
            isRTL ? "flex-row-reverse justify-end" : "justify-start",
            icon && "gap-2"
          )}
          style={isRTL && !isLTRContent ? { justifyContent: 'flex-end' } : {}}
        >
          {icon && (
            <span className={cn("flex-shrink-0 self-center", isRTL && "order-2")}>
              {icon}
            </span>
          )}
          <p 
            className={cn(
              "text-base leading-normal break-words",
              isLTRContent ? "text-left" : isRTL ? "text-right" : "text-left"
            )}
            dir={finalValueDir}
            style={isLTRContent 
              ? { textAlign: 'left', direction: 'ltr' } 
              : isRTL 
                ? { textAlign: 'right', direction: 'rtl' } 
                : { textAlign: 'left', direction: 'ltr' }
            }
          >
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("max-w-5xl max-h-[95vh] overflow-y-auto z-50", isRTL && "rtl")} 
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <Stethoscope
              className={cn(
                "h-6 w-6 text-blue-600 flex-shrink-0",
                isRTL ? "order-2" : ""
              )}
            />
            <div className="flex-1 min-w-0">
              <DialogTitle
                className="text-xl font-semibold"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Prescription")} {prescription.prescription_id}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Detailed view of prescription and medication information")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Patient Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle 
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")} 
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <User className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Patient Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div 
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6",
                  isRTL && "text-right"
                )}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <div className={cn("space-y-4", isRTL && "text-right")} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                  <InfoRow
                    label={t("Full Name")}
                    value={
                      prescription.patient_id 
                        ? `${prescription.patient_id.first_name} ${prescription.patient_id.last_name}`
                        : t('Unknown Patient')
                    }
                    className="text-lg font-semibold"
                  />
                  <InfoRow
                    label={t("Date of Birth")}
                    value={prescription.patient_id?.date_of_birth ? formatDate(prescription.patient_id.date_of_birth) : t('N/A')}
                  />
                  <InfoRow
                    label={t("Age")}
                    value={prescription.patient_id?.date_of_birth ? `${calculateAge(prescription.patient_id.date_of_birth)} ${t("years old")}` : t('N/A')}
                  />
                </div>
                <div className={cn("space-y-4", isRTL && "text-right")} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                  <InfoRow
                    label={t("Gender")}
                    value={prescription.patient_id?.gender || t('N/A')}
                    className="capitalize"
                  />
                  {prescription.patient_id?.phone && (
                    <InfoRow
                      label={t("Phone")}
                      value={prescription.patient_id.phone}
                      valueDir="ltr"
                      icon={<Phone className="h-4 w-4 text-gray-500" />}
                    />
                  )}
                  {prescription.patient_id?.email && (
                    <InfoRow
                      label={t("Email")}
                      value={prescription.patient_id.email}
                      valueDir="ltr"
                      icon={<Mail className="h-4 w-4 text-gray-500" />}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle 
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")} 
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <Stethoscope className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Prescribing Doctor")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div 
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6",
                  isRTL && "text-right"
                )}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <InfoRow
                  label={t("Doctor Name")}
                  value={`${t("Dr.")} ${prescription.doctor_id.first_name} ${prescription.doctor_id.last_name}`}
                  className="text-lg font-semibold"
                />
                {prescription.doctor_id.specialization && (
                  <InfoRow
                    label={t("Specialization")}
                    value={prescription.doctor_id.specialization}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescription Details */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle 
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")} 
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Prescription Details")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div 
                className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6",
                  isRTL && "text-right"
                )}
                style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
              >
                <InfoRow
                  label={t("Diagnosis")}
                  value={prescription.diagnosis}
                  className="text-lg"
                />
                <InfoRow
                  label={t("Status")}
                  value={
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {getStatusIcon(prescription.status)}
                      <Badge
                        className={cn(getStatusColor(prescription.status))}
                        dir="ltr"
                        style={{ textAlign: "left", direction: "ltr" }}
                      >
                        {getStatusLabel(prescription.status)}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  label={t("Date Prescribed")}
                  value={`${formatDate(prescription.created_at)} ${t("at")} ${formatTime(prescription.created_at)}`}
                />
                {prescription.follow_up_date && (
                  <InfoRow
                    label={t("Follow-up Date")}
                    value={formatDate(prescription.follow_up_date)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                )}
                {prescription.appointment_id && (
                  <InfoRow
                    label={t("Related Appointment")}
                    value={prescription.appointment_id._id}
                    valueDir="ltr"
                  />
                )}
              </div>
              {prescription.notes && (
                <div 
                  className={cn("mt-6", isRTL && "text-right")} 
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <label 
                    className={cn(
                      "text-sm font-medium text-gray-500 block mb-2",
                      isRTL ? "text-right" : "text-left"
                    )} 
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                  >
                    {t("Clinical Notes")}
                  </label>
                  <p 
                    className={cn(
                      "p-3 bg-gray-50 rounded-lg break-words",
                      isRTL ? "text-right" : "text-left"
                    )} 
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: 'right', direction: 'rtl' } : { textAlign: 'left', direction: 'ltr' }}
                  >
                    {prescription.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <ItemsDetailsView
            items={prescription.medications}
            title={t("Medications")}
            itemLabel={t("Medication")}
            fields={{
              showName: true,
              showDosage: true,
              showFrequency: true,
              showDuration: true,
              showQuantity: true,
              showInstructions: true,
            }}
          />

          {/* Pharmacy Information */}
          {prescription.pharmacy_dispensed && (
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle 
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")} 
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  <CheckCircle className={cn("h-5 w-5 text-green-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Pharmacy Status")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                  <Badge 
                    className="bg-green-100 text-green-800"
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                  >
                    {t("Sent to Pharmacy")}
                  </Badge>
                  {prescription.dispensed_date && (
                    <p 
                      className="text-sm text-gray-600"
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                    >
                      {t("Dispensed on:")} {formatDate(prescription.dispensed_date)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div 
          className={cn("flex justify-between items-center pt-6 border-t", isRTL && "flex-row-reverse")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div 
            className="text-sm text-gray-500"
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            {t("Last updated:")} {formatDate(prescription.updated_at)} {t("at")} {formatTime(prescription.updated_at)}
          </div>
          <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              dir={isRTL ? "rtl" : "ltr"}
              style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
            >
              {t("Close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionDetailModal; 