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
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  head: string;
  location: string;
  phone: string;
  email: string;
  staffCount: number;
  budget: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface ViewDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
}

const ViewDepartmentModal: React.FC<ViewDepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const getStatusIcon = (status: string) => {
    return status === "active" ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-gray-600" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    return status === "active" ? t("Active") : t("Inactive");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-5xl max-h-[95vh] overflow-y-auto z-50", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <Building2
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
                {department.name}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Detailed view of department information")}
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
                  label={t("Department Name")}
                  value={department.name}
                  className="text-lg font-semibold"
                />
                <InfoRow
                  label={t("Status")}
                  value={
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {getStatusIcon(department.status)}
                      <Badge
                        className={cn(getStatusColor(department.status))}
                        dir="ltr"
                        style={{ textAlign: "left", direction: "ltr" }}
                      >
                        {getStatusLabel(department.status)}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  label={t("Department Code")}
                  value={
                    <Badge variant="outline" className={cn(isRTL && "text-right")}>
                      {department.code}
                    </Badge>
                  }
                  valueDir="ltr"
                />
                <InfoRow
                  label={t("Description")}
                  value={department.description || t("Not specified")}
                  className="md:col-span-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <MapPin className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Contact & Location")}</span>
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
                  label={t("Department Location")}
                  value={department.location || t("Not specified")}
                  icon={<MapPin className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Phone")}
                  value={department.phone || t("Not specified")}
                  valueDir="ltr"
                  icon={<Phone className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Email")}
                  value={department.email || t("Not specified")}
                  valueDir="ltr"
                  icon={<Mail className="h-4 w-4 text-gray-500" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Management & Statistics */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Users className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Management & Statistics")}</span>
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
                  label={t("Department Head")}
                  value={department.head || t("Not specified")}
                  icon={<User className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Staff Count")}
                  value={`${department.staffCount} ${t("members")}`}
                  icon={<Users className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Annual Budget")}
                  value={<CurrencyDisplay amount={department.budget} />}
                  valueDir="ltr"
                  icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Department Status")}
                  value={
                    <span
                      className={cn("text-gray-600", isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
                    >
                      {department.status === "active"
                        ? t("Department is currently operational")
                        : t("Department is currently inactive")}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

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
                    department.createdAt
                      ? `${formatDate(department.createdAt)} ${t("at")} ${formatTime(department.createdAt)}`
                      : "-"
                  }
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Last Updated")}
                  value={
                    department.updatedAt
                      ? `${formatDate(department.updatedAt)} ${t("at")} ${formatTime(department.updatedAt)}`
                      : "-"
                  }
                  icon={<Activity className="h-4 w-4 text-gray-500" />}
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
              onClick={onClose}
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

export default ViewDepartmentModal;
