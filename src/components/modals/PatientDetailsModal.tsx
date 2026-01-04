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
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Eye, 
  Zap, 
  Calendar, 
  Stethoscope, 
  User,
  Phone,
  Mail,
  MapPin,
  Users,
  Heart
} from "lucide-react";
import { Patient } from "@/types";
import OdontogramDetailModal from "./OdontogramDetailModal";
import odontogramApi from "@/services/api/odontogramApi";
import { toast } from "@/hooks/use-toast";

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
  const formatDate = (value: any) => {
    if (!value) return "Not specified";
    try {
      const date = new Date(value);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
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
      
      // Try to get the active odontogram for this patient
      const activeOdontogram = await odontogramApi.getActiveOdontogramByPatient(patient.id);
      setActiveOdontogramId(activeOdontogram._id);
      setOdontogramModalOpen(true);
      
    } catch (error: any) {
      if (error.message.includes("No active odontogram found")) {
        toast({
          title: "No Dental Records",
          description: "No dental chart found for this patient. Please create one first.",
          variant: "default",
        });
      } else {
        console.error("Error fetching odontogram:", error);
        toast({
          title: "Error",
          description: "Failed to load dental chart",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingOdontogram(false);
    }
  };

  const patientSections = [
    {
      title: t("personalInformation"),
      icon: <User className="h-5 w-5" />,
      fields: [
        { label: t("fullName"), value: `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() },
        { label: t("dateOfBirth"), value: formatDate(patient?.dateOfBirth) },
        { label: t("age"), value: patient?.dateOfBirth ? `${calculateAge(patient.dateOfBirth)} years` : "N/A" },
        { label: t("gender"), value: patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "Not specified" },
        { label: t("bloodGroup"), value: patient?.bloodGroup || "Not specified" },
      ]
    },
    {
      title: t("contactInformation"),
      icon: <Phone className="h-5 w-5" />,
      fields: [
        { label: t("phone"), value: patient?.phone || "Not specified", type: "phone" },
        { label: t("email"), value: patient?.email || "Not specified", type: "email" },
        { label: t("address"), value: patient?.address || "Not specified" },
      ]
    },
    {
      title: t("emergencyContact"),
      icon: <Users className="h-5 w-5" />,
      fields: [
        { label: t("name"), value: patient?.emergencyContact?.name || "Not specified" },
        { label: t("phone"), value: patient?.emergencyContact?.phone || "Not specified", type: "phone" },
        { label: t("relationship"), value: patient?.emergencyContact?.relationship || "Not specified" },
      ]
    },
    {
      title: t("medicalInformation"),
      icon: <Heart className="h-5 w-5" />,
      fields: [
        { label: t("height"), value: patient?.height ? `${patient.height} cm` : "Not specified" },
        { label: t("weight"), value: patient?.weight ? `${patient.weight} kg` : "Not specified" },
        { label: t("allergies"), value: patient?.allergies?.length ? patient.allergies.join(", ") : "None recorded" },
        { label: t("medicalHistory"), value: patient?.medicalHistory?.length ? patient.medicalHistory.join(", ") : "None recorded" },
      ]
    }
  ];

  const formatFieldValue = (value: string, type?: string) => {
    if (!value || value === "Not specified") {
      return <span className="text-gray-400 italic">{value || "Not specified"}</span>;
    }

    switch (type) {
      case "phone":
        return (
          <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {value}
          </span>
        );
      case "email":
        return (
          <span className="text-blue-600 hover:text-blue-800 font-medium">
            {value}
          </span>
        );
      default:
        return <span className="text-gray-900">{value}</span>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-hidden ", isRTL && 'dir-rtl', isRTL && 'flex-row-reverse')}>
          <DialogHeader className={cn("border-b pb-4")}>
            <DialogTitle className={cn("flex items-center text-xl font-semibold", isRTL && 'flex-row-reverse')}>
              <Eye className={cn("h-5 w-5 mr-3 text-blue-600 ")} />
              {t("patientDetails")}
            </DialogTitle>
            <DialogDescription className={cn("text-sm text-gray-600 mt-1", isRTL && 'text-right')}>
              {t("patientDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] py-4">
            {patient ? (
              <div className="space-y-6">

                {/* Patient Information Sections */}
                {patientSections.map((section, sectionIndex) => (
                  <div key={section.title}>
                    {/* Section Header */}
                    <div className="mb-4">
                      <h3 className={cn("text-lg font-semibold text-gray-900 mb-3 flex items-center", isRTL && 'flex-row-reverse' )}>
                        {section.icon}
                        <span className="ml-2">{section.title}</span>
                      </h3>
                    </div>

                    {/* Section Content */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="space-y-1">
                            <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                              {field.label}
                            </h4>
                            <div className="text-sm font-medium">
                              {formatFieldValue(field.value, field.type)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {sectionIndex < patientSections.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}

                {/* Patient Stats */}
                <div className={cn("bg-green-50 border border-green-200 rounded-lg p-4", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
                  <h3 className={cn("text-lg font-semibold text-green-900 mb-3", isRTL && 'text-right', isRTL && 'flex-row-reverse', isRTL && 'flex justify-end')}>
                    {t("patientStatistics")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{patient.totalVisits || 0}</div>
                      <div className="text-sm text-green-600">{t("totalVisits")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {patient.lastVisit ? formatDate(patient.lastVisit) : "Never"}
                      </div>
                      <div className="text-sm text-green-600">{t("lastVisit")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {patient.status || "Active"}
                        </Badge>
                      </div>
                      <div className="text-sm text-green-600">{t("status")}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4 opacity-50">👤</div>
                <p className="text-lg font-medium">{t("noPatientDataAvailable")}</p>
                <p className="text-sm mt-1">{t("patientInformationCouldNotBeLoaded")}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className={cn("min-w-[100px]", isRTL && 'flex-row-reverse', isRTL && 'text-right')}
            >
              <X className={cn("h-4 w-4 mr-2")} />
              {t("close")}
            </Button>
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
