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
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Award,
  TestTube2,
  Star,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { labVendorApi } from "@/services/api/labVendorApi";
import { LabVendor } from "@/types";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";

interface ViewVendorDetailsModalProps {
  vendorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewVendorDetailsModal: React.FC<ViewVendorDetailsModalProps> = ({
  vendorId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [vendor, setVendor] = useState<LabVendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (vendorId && isOpen) {
      fetchVendorDetails();
    }
  }, [vendorId, isOpen]);

  const fetchVendorDetails = async () => {
    if (!vendorId) return;
    
    try {
      setIsLoading(true);
      const vendorData = await labVendorApi.getLabVendorById(vendorId);
      setVendor(vendorData);
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      toast({
        title: t("Error"),
        description: t("Failed to load vendor details. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "active": t("Active"),
      "inactive": t("Inactive"),
      "pending": t("Pending"),
      "suspended": t("Suspended"),
    };
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case "budget":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-blue-100 text-blue-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPricingLabel = (pricing: string) => {
    const pricingMap: Record<string, string> = {
      "budget": t("Budget"),
      "moderate": t("Moderate"),
      "premium": t("Premium"),
    };
    return pricingMap[pricing.toLowerCase()] || pricing.charAt(0).toUpperCase() + pricing.slice(1);
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      "diagnostic_lab": t("Diagnostic Lab"),
      "pathology_lab": t("Pathology Lab"),
      "imaging_center": t("Imaging Center"),
      "reference_lab": t("Reference Lab"),
      "specialty_lab": t("Specialty Lab"),
    };
    return typeMap[type] || type;
  };

  const renderStars = (rating: number) => {
    return (
      <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-1 flex-row-reverse" : "space-x-1")}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn("h-4 w-4", star <= rating ? "text-yellow-400 fill-current" : "text-gray-300")}
          />
        ))}
        <span className={cn("text-sm text-gray-600", isRTL ? "mr-2" : "ml-2")}>({rating})</span>
      </div>
    );
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

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
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
              {t("Loading vendor details...")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!vendor) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{t("Vendor not found")}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <TestTube2
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
                {vendor.name}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Detailed view of lab vendor information")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {vendor ? (
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
                    label={t("Vendor Name")}
                    value={vendor.name}
                    className="text-lg font-semibold"
                  />
                  <InfoRow
                    label={t("Status")}
                    value={
                      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        {getStatusIcon(vendor.status)}
                        <Badge
                          className={cn(getStatusColor(vendor.status))}
                          dir="ltr"
                          style={{ textAlign: "left", direction: "ltr" }}
                        >
                          {getStatusLabel(vendor.status)}
                        </Badge>
                      </div>
                    }
                  />
                  <InfoRow
                    label={t("Vendor Code")}
                    value={
                      <Badge variant="outline" className={cn(isRTL && "text-right")}>
                        {vendor.code}
                      </Badge>
                    }
                    valueDir="ltr"
                  />
                  <InfoRow
                    label={t("Type")}
                    value={getTypeLabel(vendor.type)}
                  />
                  <InfoRow
                    label={t("License Number")}
                    value={vendor.license || t("Not specified")}
                    valueDir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance & Rating */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <TestTube2 className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Performance")}</span>
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
                    label={t("Rating")}
                    value={renderStars(vendor.rating)}
                  />
                  <InfoRow
                    label={t("Total Tests")}
                    value={vendor.totalTests.toLocaleString()}
                    icon={<TestTube2 className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Average Turnaround")}
                    value={vendor.averageTurnaround}
                    icon={<Clock className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Pricing Tier")}
                    value={
                      <Badge
                        className={cn(getPricingColor(vendor.pricing), isRTL && "text-right")}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {getPricingLabel(vendor.pricing)}
                      </Badge>
                    }
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
                  <User className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
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
                    label={t("Contact Person")}
                    value={vendor.contactPerson || t("Not specified")}
                    icon={<User className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Email")}
                    value={
                      vendor.email ? (
                        <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                          {vendor.email}
                        </a>
                      ) : (
                        t("Not specified")
                      )
                    }
                    valueDir="ltr"
                    icon={<Mail className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Phone")}
                    value={
                      vendor.phone ? (
                        <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">
                          {vendor.phone}
                        </a>
                      ) : (
                        t("Not specified")
                      )
                    }
                    valueDir="ltr"
                    icon={<Phone className="h-4 w-4 text-gray-500" />}
                  />
                  {vendor.website && (
                    <InfoRow
                      label={t("Website")}
                      value={
                        <a
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      }
                      valueDir="ltr"
                      icon={<Globe className="h-4 w-4 text-gray-500" />}
                    />
                  )}
                  <InfoRow
                    label={t("Address")}
                    value={
                      vendor.address
                        ? `${vendor.address}, ${vendor.city}, ${vendor.state} ${vendor.zipCode}`
                        : t("Not specified")
                    }
                    className="md:col-span-2"
                    icon={<MapPin className="h-4 w-4 text-gray-500" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Specialties & Services */}
            {vendor.specialties && vendor.specialties.length > 0 && (
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <TestTube2 className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Specialties & Services")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    {vendor.specialties.map((specialty) => (
                      <div
                        key={specialty}
                        className={cn("flex items-center p-3 bg-blue-50 rounded-lg", isRTL && "flex-row-reverse")}
                      >
                        <TestTube2 className={cn("h-4 w-4 text-blue-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                        <span className={cn("text-sm font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {specialty}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accreditations */}
            {vendor.accreditation && vendor.accreditation.length > 0 && (
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <Award className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Accreditations")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("flex flex-wrap gap-2", isRTL && "flex-row-reverse")}>
                    {vendor.accreditation.map((acc) => (
                      <Badge key={acc} variant="outline" className={cn("bg-green-50", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Contract Information")}</span>
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
                    label={t("Contract Start Date")}
                    value={formatDate(vendor.contractStart)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Contract End Date")}
                    value={formatDate(vendor.contractEnd)}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Days Remaining")}
                    value={`${Math.ceil((new Date(vendor.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} ${t("days")}`}
                  />
                  <InfoRow
                    label={t("Last Test Date")}
                    value={vendor.lastTestDate ? formatDate(vendor.lastTestDate) : t("No tests yet")}
                    icon={<Clock className="h-4 w-4 text-gray-500" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {vendor.notes && (
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
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <p
                      className={cn("text-sm text-gray-700 whitespace-pre-wrap", isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
                    >
                      {vendor.notes}
                    </p>
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
                      vendor.createdAt
                        ? `${formatDate(vendor.createdAt)} ${t("at")} ${formatTime(vendor.createdAt)}`
                        : "-"
                    }
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Last Updated")}
                    value={
                      vendor.updatedAt
                        ? `${formatDate(vendor.updatedAt)} ${t("at")} ${formatTime(vendor.updatedAt)}`
                        : "-"
                    }
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

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

export default ViewVendorDetailsModal; 