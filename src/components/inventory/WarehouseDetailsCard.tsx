import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "@/data/mockWarehouseData";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Calendar,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatTime } from "@/utils/dateUtils";

interface WarehouseDetailsCardProps {
  warehouse: Warehouse;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WarehouseDetailsCard: React.FC<WarehouseDetailsCardProps> = ({
  warehouse,
  onEdit,
  onToggleStatus,
  onDelete,
  open,
  onOpenChange,
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

  const getTypeLabel = (type: string) => {
    return type === "main" ? t("Main") : t("Sub");
  };

  const getTypeColor = (type: string) => {
    return type === "main"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";
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
                {warehouse.name}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Detailed view of warehouse information")}
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
                  label={t("Warehouse Name")}
                  value={warehouse.name}
                  className="text-lg font-semibold"
                />
                <InfoRow
                  label={t("Status")}
                  value={
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                      {getStatusIcon(warehouse.status)}
                      <Badge
                        className={cn(getStatusColor(warehouse.status))}
                        dir="ltr"
                        style={{ textAlign: "left", direction: "ltr" }}
                      >
                        {getStatusLabel(warehouse.status)}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  label={t("Warehouse Type")}
                  value={
                    <Badge
                      className={cn(getTypeColor(warehouse.type))}
                      dir="ltr"
                      style={{ textAlign: "left", direction: "ltr" }}
                    >
                      {getTypeLabel(warehouse.type)}
                    </Badge>
                  }
                />
                {warehouse.isShared !== undefined && (
                  <InfoRow
                    label={t("Warehouse Type")}
                    value={
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <Info className={cn("h-4 w-4 text-primary flex-shrink-0", isRTL && "order-2")} />
                        <span className={cn("text-sm font-medium", isRTL && "text-right")}>
                          {warehouse.isShared
                            ? t("Shared Warehouse")
                            : t("Branch-Specific Warehouse")}
                        </span>
                      </div>
                    }
                    className="md:col-span-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Branches */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Building2 className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Assigned Branches / Clinics")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              {warehouse.assignedBranches.length > 0 ? (
                <div className="space-y-2">
                  {warehouse.assignedBranches.map((branch, index) => (
                    <div key={branch.id}>
                      <div
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          isRTL && "flex-row-reverse text-right"
                        )}
                      >
                        <div className="flex-1">
                          <div
                            className={cn(
                              "font-medium text-foreground",
                              isRTL && "text-right"
                            )}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                          >
                            {branch.name}
                          </div>
                          {branch.code && (
                            <div
                              className={cn(
                                "text-sm text-muted-foreground mt-1",
                                isRTL && "text-right"
                              )}
                              dir={isRTL ? "rtl" : "ltr"}
                              style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                            >
                              {t("Code")}: {branch.code}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < warehouse.assignedBranches.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "p-4 text-center border border-dashed rounded-lg",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <p className="text-muted-foreground">{t("No branches assigned")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manager & Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <User className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Manager & Information")}</span>
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
                {warehouse.manager ? (
                  <InfoRow
                    label={t("Warehouse Manager")}
                    value={
                      <div className={cn("flex items-start gap-3", isRTL && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0",
                            isRTL && "order-2"
                          )}
                        >
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "font-medium text-foreground",
                              isRTL && "text-right"
                            )}
                            dir={isRTL ? "rtl" : "ltr"}
                            style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                          >
                            {warehouse.manager.fullName}
                          </div>
                          {warehouse.manager.email && (
                            <div
                              className={cn(
                                "text-sm text-muted-foreground mt-1",
                                isRTL && "text-right"
                              )}
                              dir="ltr"
                              style={{ textAlign: "left", direction: "ltr" }}
                            >
                              {warehouse.manager.email}
                            </div>
                          )}
                          {warehouse.manager.role && (
                            <Badge variant="outline" className="mt-2">
                              {warehouse.manager.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    }
                    className="md:col-span-2"
                  />
                ) : (
                  <InfoRow
                    label={t("Warehouse Manager")}
                    value={t("No manager assigned")}
                    className="md:col-span-2"
                  />
                )}
                <InfoRow
                  label={t("Created Date")}
                  value={formatDate(warehouse.createdAt)}
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
                />
                {warehouse.updatedAt && (
                  <InfoRow
                    label={t("Last Updated")}
                    value={formatDate(warehouse.updatedAt)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                )}
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
