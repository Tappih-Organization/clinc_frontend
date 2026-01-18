import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { 
  User,
  Phone,
  Mail,
  Users,
  Heart,
  Info,
  Calendar,
} from "lucide-react";
import { Patient } from "@/types";
import OdontogramDetailModal from "./OdontogramDetailModal";
import odontogramApi from "@/services/api/odontogramApi";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/dateUtils";

interface PatientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  open,
  onOpenChange,
  patient,
}) => {
  const [odontogramModalOpen, setOdontogramModalOpen] = useState(false);
  const [activeOdontogramId, setActiveOdontogramId] = useState<string | null>(null);
  const [loadingOdontogram, setLoadingOdontogram] = useState(false);

  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const formatDateValue = (value: any) => {
    if (!value) return t("Not specified");
    try {
      return formatDate(value);
    } catch (e) {
      return value.toString();
    }
  };

  const calculateAge = (dateOfBirth: Date) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleViewOdontogram = async () => {
    if (!patient?.id) return;
    
    try {
      setLoadingOdontogram(true);
      const activeOdontogram = await odontogramApi.getActiveOdontogramByPatient(patient.id);
      setActiveOdontogramId(activeOdontogram._id);
      setOdontogramModalOpen(true);
    } catch (error: any) {
      if (error.message.includes("No active odontogram found")) {
        toast({
          title: t("No Dental Records"),
          description: t("No dental chart found for this patient. Please create one first."),
          variant: "default",
        });
      } else {
        console.error("Error fetching odontogram:", error);
        toast({
          title: t("Error"),
          description: t("Failed to load dental chart"),
          variant: "destructive",
        });
      }
    } finally {
      setLoadingOdontogram(false);
    }
  };

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
        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
      >
        <label
          className={cn(
            "text-sm font-medium text-gray-500 block leading-tight",
            isRTL ? "text-right" : "text-left"
          )}
          dir={isRTL ? "rtl" : "ltr"}
          style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
        >
          {label}
        </label>
        <div
          className={cn(
            "flex items-baseline min-h-[1.5rem]",
            isRTL ? "flex-row-reverse justify-end" : "justify-start",
            icon && "gap-2"
          )}
          style={isRTL && !isLTRContent ? { justifyContent: "flex-end" } : {}}
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
            style={
              isLTRContent
                ? { textAlign: "left", direction: "ltr" }
                : isRTL
                  ? { textAlign: "right", direction: "rtl" }
                  : { textAlign: "left", direction: "ltr" }
            }
          >
            {value}
          </p>
        </div>
      </div>
    );
  };

  if (!patient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
              <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">{t("No patient data available")}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const patientName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

  return (
    <>
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
              <User
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
                  {patientName}
                </DialogTitle>
                <DialogDescription
                  className="text-sm text-muted-foreground mt-1"
                  dir="ltr"
                  style={{ textAlign: "left", direction: "ltr" }}
                >
                  {t("Detailed view of patient information")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Personal Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Info className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Personal Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Full Name")}
                    value={patientName}
                    className="text-lg font-semibold"
                  />
                  <InfoRow
                    label={t("Date of Birth")}
                    value={formatDateValue(patient.dateOfBirth)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Age")}
                    value={patient.dateOfBirth ? `${calculateAge(patient.dateOfBirth)} ${t("years")}` : t("N/A")}
                  />
                  <InfoRow
                    label={t("Gender")}
                    value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : t("Not specified")}
                  />
                  <InfoRow
                    label={t("Blood Group")}
                    value={patient.bloodGroup || t("Not specified")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Phone className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Contact Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Phone")}
                    value={patient.phone || t("Not specified")}
                    valueDir="ltr"
                    icon={<Phone className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Email")}
                    value={patient.email || t("Not specified")}
                    valueDir="ltr"
                    icon={<Mail className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Address")}
                    value={patient.address || t("Not specified")}
                    className="md:col-span-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Users className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Emergency Contact")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Name")}
                    value={patient.emergencyContact?.name || t("Not specified")}
                  />
                  <InfoRow
                    label={t("Phone")}
                    value={patient.emergencyContact?.phone || t("Not specified")}
                    valueDir="ltr"
                    icon={<Phone className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Relationship")}
                    value={patient.emergencyContact?.relationship || t("Not specified")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Heart className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Medical Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Height")}
                    value={patient.height ? `${patient.height} cm` : t("Not specified")}
                  />
                  <InfoRow
                    label={t("Weight")}
                    value={patient.weight ? `${patient.weight} kg` : t("Not specified")}
                  />
                  <InfoRow
                    label={t("Allergies")}
                    value={patient.allergies?.length ? patient.allergies.join(", ") : t("None recorded")}
                    className="md:col-span-2"
                  />
                  <InfoRow
                    label={t("Medical History")}
                    value={patient.medicalHistory?.length ? patient.medicalHistory.join(", ") : t("None recorded")}
                    className="md:col-span-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patient Statistics */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Patient Statistics")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-3 gap-6",
                    isRTL && "text-right"
                  )}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <InfoRow
                    label={t("Total Visits")}
                    value={patient.totalVisits || 0}
                  />
                  <InfoRow
                    label={t("Last Visit")}
                    value={patient.lastVisit ? formatDateValue(patient.lastVisit) : t("Never")}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Status")}
                    value={
                      <Badge variant="secondary">
                        {patient.status || t("Active")}
                      </Badge>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div
            className={cn("flex justify-end items-center pt-6 border-t", isRTL && "flex-row-reverse")}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                {t("Close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Odontogram Detail Modal */}
      <OdontogramDetailModal
        open={odontogramModalOpen}
        onOpenChange={setOdontogramModalOpen}
        odontogramId={activeOdontogramId}
        editable={true}
      />
    </>
  );
};

export default PatientDetailsModal;
