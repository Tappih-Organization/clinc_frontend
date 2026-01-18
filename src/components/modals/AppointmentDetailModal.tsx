import React from "react";
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
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  FileText,
  Info,
  Download,
  Edit,
  CheckCircle,
} from "lucide-react";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { useAppointmentStatusConfig } from "@/hooks/useAppointmentStatuses";

interface AppointmentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any | null;
  onEdit?: (appointment: any) => void;
  onMarkComplete?: (appointment: any) => void;
  onDownloadSlip?: (appointment: any) => void;
  isLoading?: boolean;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onMarkComplete,
  onDownloadSlip,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { getStatusName, getStatusColorClass, getStatusIcon } = useAppointmentStatusConfig();

  const formatDateDisplay = (date: Date | string) => {
    if (!date) return "-";
    return formatDate(date);
  };

  const formatTimeDisplay = (date: Date | string) => {
    if (!date) return "-";
    return formatTime(date);
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

  if (!appointment) {
    return null;
  }

  const StatusIcon = getStatusIcon(appointment.status);

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
            <CalendarIcon
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
                {t("Appointment Details")}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("View complete appointment information")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Basic Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Info className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Basic Information")}</span>
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
                  label={t("Date & Time")}
                  value={`${formatDateDisplay(appointment.date)} ${t("at")} ${formatTimeDisplay(appointment.date)}`}
                  icon={<CalendarIcon className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Status")}
                  value={
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {StatusIcon && (
                        <span className="flex-shrink-0">
                          {StatusIcon}
                        </span>
                      )}
                      <Badge
                        className={cn(getStatusColorClass(appointment.status))}
                        dir="ltr"
                        style={{ textAlign: "left", direction: "ltr" }}
                      >
                        {getStatusName(appointment.status)}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  label={t("Duration")}
                  value={`${appointment.duration || 30} ${t("minutes")}`}
                  icon={<Clock className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Type")}
                  value={appointment.type ? appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1) : t("Consultation")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
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
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <InfoRow
                  label={t("Patient Name")}
                  value={appointment.patient?.name || t("Unknown Patient")}
                  className="text-lg font-semibold"
                />
                {appointment.patient?.phone && (
                  <InfoRow
                    label={t("Phone")}
                    value={appointment.patient.phone}
                    valueDir="ltr"
                  />
                )}
                {appointment.patient?.email && (
                  <InfoRow
                    label={t("Email")}
                    value={appointment.patient.email}
                    valueDir="ltr"
                    className="md:col-span-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Stethoscope className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Doctor Information")}</span>
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
                  label={t("Doctor Name")}
                  value={appointment.doctor?.name || t("Unknown Doctor")}
                  className="text-lg font-semibold"
                />
                {appointment.doctor?.specialty && (
                  <InfoRow
                    label={t("Specialty")}
                    value={appointment.doctor.specialty}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {appointment.notes && (
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Notes")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "p-3 bg-gray-50 rounded-lg",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
                >
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {appointment.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={cn("flex justify-end items-center pt-6 border-t gap-3", isRTL && "flex-row-reverse")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
          >
            {t("Close")}
          </Button>
          {onDownloadSlip && (
            <Button
              variant="outline"
              onClick={() => onDownloadSlip(appointment)}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              <Download className="h-4 w-4" />
              {t("Download Slip")}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit(appointment);
              }}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              <Edit className="h-4 w-4" />
              {t("Edit")}
            </Button>
          )}
          {onMarkComplete && appointment.status !== "completed" && (
            <Button
              onClick={() => onMarkComplete(appointment)}
              disabled={isLoading}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              <CheckCircle className="h-4 w-4" />
              {isLoading ? t("Saving...") : t("Mark Complete")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailModal;
