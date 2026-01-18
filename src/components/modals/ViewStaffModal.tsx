import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Clock,
  DollarSign,
  Shield,
  Stethoscope,
  UserCheck,
  Users,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { transformUserToStaff } from "@/hooks/useStaff";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateUtils";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

interface ViewStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: ReturnType<typeof transformUserToStaff> | null;
}

const ViewStaffModal: React.FC<ViewStaffModalProps> = ({
  open,
  onOpenChange,
  staff,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  if (!staff) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "doctor":
        return <Stethoscope className="h-4 w-4 text-blue-600" />;
      case "nurse":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "receptionist":
        return <Users className="h-4 w-4 text-orange-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "doctor":
        return "bg-blue-100 text-blue-800";
      case "nurse":
        return "bg-green-100 text-green-800";
      case "receptionist":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkingDays = () => {
    return Object.values(staff.schedule).filter((day: any) => day.isWorking).length;
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

  const staffName = `${staff.firstName || ""} ${staff.lastName || ""}`.trim();

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
                {staffName}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Complete profile information for")} {staffName}
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
                  label={t("Staff Name")}
                  value={staffName}
                  className="text-lg font-semibold"
                />
                <InfoRow
                  label={t("Employee ID")}
                  value={`#${staff.id}`}
                  valueDir="ltr"
                />
                <InfoRow
                  label={t("Role")}
                  value={
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {getRoleIcon(staff.role)}
                      <Badge
                        className={cn(getRoleColor(staff.role))}
                        dir="ltr"
                        style={{ textAlign: "left", direction: "ltr" }}
                      >
                        {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  label={t("Status")}
                  value={
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {staff.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-600" />
                      )}
                      <Badge
                        variant={staff.isActive ? "default" : "secondary"}
                        dir="ltr"
                        style={{ textAlign: "left", direction: "ltr" }}
                      >
                        {staff.isActive ? t("Active") : t("Inactive")}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  label={t("Department")}
                  value={staff.department}
                />
                <InfoRow
                  label={t("Joining Date")}
                  value={formatDate(staff.joiningDate)}
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
                />
                {staff.salary > 0 && (
                  <InfoRow
                    label={t("Annual Salary")}
                    value={<CurrencyDisplay amount={staff.salary} />}
                    icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                  />
                )}
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
                <Mail className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
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
                  label={t("Email")}
                  value={staff.email}
                  valueDir="ltr"
                  icon={<Mail className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Phone")}
                  value={staff.phone || t("Not provided")}
                  valueDir="ltr"
                  icon={<Phone className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Address")}
                  value={staff.address || t("Not provided")}
                  className="md:col-span-2"
                  icon={<MapPin className="h-4 w-4 text-gray-500" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          {staff.qualifications && staff.qualifications.length > 0 && (
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <GraduationCap className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Qualifications")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div
                  className={cn(
                    "space-y-2",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {staff.qualifications.map((qualification, index) => (
                    <div
                      key={index}
                      className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                      <span className="text-sm">{qualification}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Schedule */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Clock className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Work Schedule")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div
                className={cn(
                  "space-y-4",
                  isRTL && "text-right"
                )}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <InfoRow
                  label={t("Working Days per Week")}
                  value={`${getWorkingDays()} ${t("days")}`}
                />
                <div
                  className={cn(
                    "space-y-2 pt-2 border-t",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {Object.entries(staff.schedule).map(([day, schedule]: [string, any]) => (
                    <div
                      key={day}
                      className={cn(
                        "flex items-center justify-between text-sm",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <span className="capitalize font-medium">{t(day)}:</span>
                      <span className={schedule.isWorking ? "text-green-600" : "text-gray-400"}>
                        {schedule.isWorking
                          ? `${schedule.start} - ${schedule.end}`
                          : t("Off")
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <User className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Account Information")}</span>
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
                  value={formatDate(staff.createdAt)}
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
                />
                <InfoRow
                  label={t("Last Updated")}
                  value={formatDate(staff.updatedAt)}
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
          >
            {t("Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewStaffModal;
