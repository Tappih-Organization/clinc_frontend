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
  Calendar,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { labVendorApi, ContractDetails } from "@/services/api/labVendorApi";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ContractDetailsModalProps {
  vendorId: string | null;
  vendorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  vendorId,
  vendorName,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { formatAmount } = useCurrency();
  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock contract data for demonstration
  const mockContract: ContractDetails = {
    id: "CON-001",
    vendorId: vendorId || "",
    contractNumber: "LAB-CON-2024-001",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    renewalDate: new Date("2024-11-01"),
    status: "active",
    terms: "Standard laboratory services contract with guaranteed turnaround times and quality metrics. Vendor agrees to maintain CLIA and CAP accreditations throughout the contract period.",
    paymentTerms: "Net 30 days from invoice date. Early payment discount of 2% available for payments within 10 days.",
    serviceLevels: {
      turnaroundTime: "24-48 hours for routine tests",
      accuracyGuarantee: 99.5,
      availabilityHours: "24/7 emergency services, business hours for routine",
    },
    pricing: {
      baseRate: 100.00,
      discountPercentage: 15,
      minimumVolume: 50,
      penalties: "Late delivery penalty: $50 per day for tests exceeding turnaround time",
    },
    autoRenewal: true,
    notificationDays: 60,
    createdAt: new Date("2023-11-01"),
    updatedAt: new Date("2024-01-15"),
  };

  useEffect(() => {
    if (vendorId && isOpen) {
      fetchContractDetails();
    }
  }, [vendorId, isOpen]);

  const fetchContractDetails = async () => {
    if (!vendorId) return;
    
    try {
      setIsLoading(true);
      const contractData = await labVendorApi.getContractDetails(vendorId);
      setContract(contractData);
    } catch (error) {
      console.error("Error fetching contract details:", error);
      toast({
        title: t("Error"),
        description: t("Failed to load contract details. Showing sample data."),
        variant: "destructive",
      });
      // Fallback to mock data
      setContract(mockContract);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "pending_renewal":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "terminated":
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "pending_renewal":
        return "bg-orange-100 text-orange-800";
      case "terminated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "active": t("Active"),
      "expired": t("Expired"),
      "pending_renewal": t("Pending Renewal"),
      "terminated": t("Terminated"),
    };
    return statusMap[status] || status.replace("_", " ").toUpperCase();
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

  const daysUntilExpiry = contract ? Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

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
              {t("Loading contract details...")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contract) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn("max-w-4xl max-h-[90vh]", isRTL && "rtl")}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className={cn("flex items-center justify-center h-64", isRTL && "flex-row-reverse")}>
            <div className={cn("text-center", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{t("Contract not found")}</p>
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
          <div
            className={cn("flex items-start justify-between gap-4")}
            style={isRTL ? { flexDirection: "row-reverse" } : { flexDirection: "row" }}
          >
            {/* Status Badge - First element, appears on LEFT in RTL */}
            <div className={cn("flex items-center gap-2 flex-shrink-0", isRTL && "flex-row-reverse")}>
              {getStatusIcon(contract.status)}
              <Badge
                className={cn(getStatusColor(contract.status), isRTL && "text-right")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                {getStatusLabel(contract.status)}
              </Badge>
            </div>
            {/* Title and Description - Second element, appears on RIGHT in RTL */}
            <div className={cn("flex items-center gap-3 flex-1", isRTL && "flex-row-reverse justify-end")}>
              <FileText
                className={cn("h-6 w-6 text-blue-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")}
              />
              <div className={cn(isRTL && "text-right", "flex-1")}>
                <DialogTitle
                  className={cn("text-xl", isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("Contract Details")} - {vendorName || t("Vendor")}
                </DialogTitle>
                <DialogDescription
                  className={cn(isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  {t("Detailed view of contract information")}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {contract ? (
          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Status Alert */}
            {isExpired && (
              <div className={cn("bg-red-50 border border-red-200 rounded-lg p-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                  <AlertTriangle className={cn("h-5 w-5 text-red-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <h3 className={cn("text-sm font-medium text-red-800", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Contract Expired")}
                    </h3>
                    <p className={cn("text-sm text-red-700", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("This contract expired {{days}} days ago. Please renew or terminate.", { days: Math.abs(daysUntilExpiry) })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isExpiringSoon && (
              <div className={cn("bg-orange-50 border border-orange-200 rounded-lg p-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                  <Bell className={cn("h-5 w-5 text-orange-600 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <h3 className={cn("text-sm font-medium text-orange-800", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Contract Expiring Soon")}
                    </h3>
                    <p className={cn("text-sm text-orange-700", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("This contract expires in {{days}} days. Consider renewal.", { days: daysUntilExpiry })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir={isRTL ? "rtl" : "ltr"}>
              {/* Basic Information */}
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <Info className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Contract Information")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      isRTL && "text-right"
                    )}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <InfoRow
                      label={t("Contract Number")}
                      value={
                        <Badge variant="outline" className={cn(isRTL && "text-right")}>
                          {contract.contractNumber}
                        </Badge>
                      }
                      valueDir="ltr"
                    />
                    <InfoRow
                      label={t("Status")}
                      value={
                        <Badge
                          className={cn(getStatusColor(contract.status), isRTL && "text-right")}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          {getStatusLabel(contract.status)}
                        </Badge>
                      }
                    />
                    <InfoRow
                      label={t("Auto Renewal")}
                      value={
                        <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2 flex-row-reverse" : "space-x-2")}>
                          <CheckCircle className={cn(`h-4 w-4 flex-shrink-0 ${contract.autoRenewal ? 'text-green-600' : 'text-gray-400'}`, isRTL && "order-2")} />
                          <span className={cn("text-sm", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                            {contract.autoRenewal ? t("Enabled") : t("Disabled")}
                          </span>
                        </div>
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contract Period */}
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Contract Period")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      isRTL && "text-right"
                    )}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <InfoRow
                      label={t("Start Date")}
                      value={formatDate(contract.startDate)}
                      icon={<Calendar className="h-4 w-4 text-gray-500" />}
                    />
                    <InfoRow
                      label={t("End Date")}
                      value={formatDate(contract.endDate)}
                      icon={<Calendar className="h-4 w-4 text-gray-500" />}
                    />
                    <InfoRow
                      label={t("Days Remaining")}
                      value={
                        <span className={cn(`text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-900'}`, isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {isExpired
                            ? t("Expired {{days}} days ago", { days: Math.abs(daysUntilExpiry) })
                            : `${daysUntilExpiry} ${t("days")}`}
                        </span>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir={isRTL ? "rtl" : "ltr"}>
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <DollarSign className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Pricing Structure")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      isRTL && "text-right"
                    )}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <InfoRow
                      label={t("Base Rate")}
                      value={formatAmount(contract.pricing.baseRate)}
                      valueDir="ltr"
                      icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                      className="text-lg font-semibold text-green-600"
                    />
                    <InfoRow
                      label={t("Volume Discount")}
                      value={`${contract.pricing.discountPercentage}%`}
                      className="text-lg font-semibold text-blue-600"
                    />
                    {contract.pricing.minimumVolume && (
                      <InfoRow
                        label={t("Minimum Volume")}
                        value={`${contract.pricing.minimumVolume} ${t("tests/month")}`}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <Clock className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Service Levels")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      isRTL && "text-right"
                    )}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <InfoRow
                      label={t("Turnaround Time")}
                      value={contract.serviceLevels.turnaroundTime}
                      icon={<Clock className="h-4 w-4 text-gray-500" />}
                    />
                    <InfoRow
                      label={t("Accuracy Guarantee")}
                      value={`${contract.serviceLevels.accuracyGuarantee}%`}
                      className="text-lg font-semibold text-green-600"
                    />
                    <InfoRow
                      label={t("Availability")}
                      value={contract.serviceLevels.availabilityHours}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contract Terms */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <FileText className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Contract Terms")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                  <p
                    className={cn("text-sm text-gray-700 whitespace-pre-wrap", isRTL && "text-right")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
                  >
                    {contract.terms}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <DollarSign className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Payment Terms")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                  <p
                    className={cn("text-sm text-gray-700 whitespace-pre-wrap", isRTL && "text-right")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
                  >
                    {contract.paymentTerms}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Penalties */}
            {contract.pricing.penalties && (
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <AlertTriangle className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Penalties & SLA")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <p
                      className={cn("text-sm text-gray-700 whitespace-pre-wrap", isRTL && "text-right")}
                      dir={isRTL ? "rtl" : "ltr"}
                      style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
                    >
                      {contract.pricing.penalties}
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
                      contract.createdAt
                        ? `${formatDate(contract.createdAt)} ${t("at")} ${formatTime(contract.createdAt)}`
                        : "-"
                    }
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  />
                  <InfoRow
                    label={t("Last Updated")}
                    value={
                      contract.updatedAt
                        ? `${formatDate(contract.updatedAt)} ${t("at")} ${formatTime(contract.updatedAt)}`
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

export default ContractDetailsModal; 