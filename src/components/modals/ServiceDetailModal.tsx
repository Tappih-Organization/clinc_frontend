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
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  FileText,
  Loader2,
  Package,
  Building2,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Service } from "@/types";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ServiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  open,
  onOpenChange,
  service,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-gray-600" />
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? t("Active") : t("Inactive");
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} ${t("hours")} ${mins} ${t("minutes")}`;
    } else if (hours > 0) {
      return `${hours} ${t("hours")}`;
    } else {
      return `${mins} ${t("minutes")}`;
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
              style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
            >
              {t("Loading service details...")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!service) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{t("Service not found")}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("max-w-5xl max-h-[95vh] overflow-y-auto z-50", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div
            className={cn("flex items-start justify-between gap-4")}
            style={isRTL ? { flexDirection: "row-reverse" } : { flexDirection: "row" }}
          >
            {/* Status Badge - First element, appears on LEFT in RTL */}
            <div className={cn("flex items-center gap-2 flex-shrink-0", isRTL && "flex-row-reverse")}>
              {getStatusIcon(service.isActive)}
              <Badge
                className={cn(getStatusColor(service.isActive), isRTL && "text-right")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                {getStatusLabel(service.isActive)}
              </Badge>
            </div>
            {/* Title and Description - Second element, appears on RIGHT in RTL */}
            <div className={cn("flex items-center gap-3 flex-1", isRTL && "flex-row-reverse justify-end")}>
              <Stethoscope
                className={cn("h-6 w-6 text-blue-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")}
              />
              <div className={cn(isRTL && "text-right", "flex-1")}>
                <DialogTitle
                  className={cn("text-xl", isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {service.name}
                </DialogTitle>
                <DialogDescription
                  className={cn(isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("Detailed view of service information")}
                </DialogDescription>
              </div>
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
                  label={t("Service Name")}
                  value={service.name}
                  className="text-lg font-semibold"
                />
                <InfoRow
                  label={t("Service ID")}
                  value={service.id || "-"}
                  valueDir="ltr"
                />
                <InfoRow
                  label={t("Category")}
                  value={
                    <Badge variant="secondary" className={cn(isRTL && "text-right")}>
                      {service.category}
                    </Badge>
                  }
                />
                <InfoRow
                  label={t("Department")}
                  value={service.department}
                  icon={<Building2 className="h-4 w-4 text-gray-500" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Service Details")}</span>
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
                  label={t("Description")}
                  value={service.description || t("Not specified")}
                  className="text-lg md:col-span-2"
                />
                <InfoRow
                  label={t("Duration")}
                  value={formatDuration(service.duration)}
                  icon={<Clock className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Price")}
                  value={formatAmount(service.price)}
                  valueDir="ltr"
                  icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Max Bookings/Day")}
                  value={service.maxBookingsPerDay?.toString() || "-"}
                />
                <InfoRow
                  label={t("Follow-up Required")}
                  value={
                    <Badge
                      variant={service.followUpRequired ? "default" : "outline"}
                      className={cn(isRTL && "text-right")}
                    >
                      {service.followUpRequired ? t("Yes") : t("No")}
                    </Badge>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(service.prerequisites || service.specialInstructions) && (
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Package className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Additional Information")}</span>
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
                  {service.prerequisites && (
                    <InfoRow
                      label={t("Prerequisites")}
                      value={service.prerequisites}
                      className="md:col-span-2"
                    />
                  )}
                  {service.specialInstructions && (
                    <div
                      className={cn("md:col-span-2", isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                    >
                      <label
                        className={cn(
                          "text-sm font-medium text-gray-500 block mb-2",
                          isRTL ? "text-right" : "text-left"
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                      >
                        {t("Special Instructions")}
                      </label>
                      <p
                        className={cn(
                          "p-3 bg-gray-50 rounded-lg break-words",
                          isRTL ? "text-right" : "text-left"
                        )}
                        dir={isRTL ? "rtl" : "ltr"}
                        style={
                          isRTL
                            ? { textAlign: "right", direction: "rtl" }
                            : { textAlign: "left", direction: "ltr" }
                        }
                      >
                        {service.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Timestamps")}</span>
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
                  label={t("Created")}
                  value={
                    service.createdAt
                      ? `${formatDate(service.createdAt)} ${t("at")} ${formatTime(service.createdAt)}`
                      : "-"
                  }
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Last Updated")}
                  value={
                    service.updatedAt
                      ? `${formatDate(service.updatedAt)} ${t("at")} ${formatTime(service.updatedAt)}`
                      : "-"
                  }
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
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
  );
};

export default ServiceDetailModal;
