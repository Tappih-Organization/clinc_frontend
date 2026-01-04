import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX,
  TrendingUp,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { Lead } from "@/types";

interface ViewLeadModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ViewLeadModal: React.FC<ViewLeadModalProps> = ({ lead, open, onOpenChange }) => {
  const { t } = useTranslation();
    const isRTL = useIsRTL();
  if (!lead) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "contacted":
        return <Phone className="h-4 w-4 text-orange-600" />;
      case "converted":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "lost":
        return <UserX className="h-4 w-4 text-red-600" />;
      default:
        return <UserPlus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-orange-100 text-orange-800";
      case "converted":
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "website":
        return <Globe className="h-4 w-4" />;
      case "referral":
        return <Users className="h-4 w-4" />;
      case "social":
        return <UserPlus className="h-4 w-4" />;
      case "advertisement":
        return <TrendingUp className="h-4 w-4" />;
      case "walk-in":
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) {
      return "N/A";
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      
      return dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 mt-5" dir={isRTL ? 'ltr' : 'ltr'}>
            <Eye className="h-5 w-5" />
            {t("Lead Details")}
          </DialogTitle>
          <DialogDescription className={cn("text-sm ", isRTL && 'text-right')}>
            {t("View detailed information about this lead.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Header */}
          <Card>
            <CardContent className={cn("p-0")} dir={isRTL ? 'ltr' : 'ltr'}>
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex ">
                 
                    {/* <User className={cn("h-6 w-6 text-blue-600", isRTL && 'rtl')} />
                 */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{t("Lead #")}{lead._id || lead.id}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-2 ml-5")} dir={isRTL ? 'rtl' : 'ltr'}>
                  {getStatusIcon(lead.status)}
                  <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center" dir={isRTL ? 'ltr' : 'ltr'}>
                <Phone className="h-4 w-4 mr-2" />
                {t("Contact Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-4 ", isRTL && 'rtl' ,isRTL && 'ml-20')} dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir={isRTL ? 'ltr' : 'ltr'}>
                {lead.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500" dir={isRTL ? 'rtl' : 'ltr'}>{t("Email")}</p>
                      <p className="text-gray-900">{lead.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500" dir={isRTL ? 'rtl' : 'ltr'}>{t("Phone")}</p>
                    <p className="text-gray-900">{lead.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader >
              <CardTitle className="text-lg flex items-center" dir={isRTL ? 'ltr' : 'ltr'}>
                <Globe className="h-4 w-4 mr-2" />
                {t("Lead Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? 'ltr' : 'ltr'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  {getSourceIcon(lead.source)}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Source")}</p>
                    <p className="text-gray-900 capitalize">{lead.source}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Service Interest")}</p>
                    <Badge variant="outline" className="mt-1">
                      {lead.serviceInterest}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4" , isRTL && 'rtl' ,isRTL && 'pl-16')} dir={isRTL ? 'rtl' : 'ltr'}>
                {lead.assignedTo && (
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t("Assigned To")}</p>
                      <p className="text-gray-900">{lead.assignedTo}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Created")}</p>
                    <p className="text-gray-900">{formatDate(lead.created_at || lead.createdAt)}</p>
                  </div>
                </div>
              </div>

              {(lead.updated_at || lead.updatedAt) && (lead.updated_at || lead.updatedAt) !== (lead.created_at || lead.createdAt) && (
                <div className={cn("flex items-center ",isRTL && 'rtl' ,isRTL && 'flex-row-reverse')} dir={isRTL ? 'rtl' : 'ltr'}>
                 {!isRTL && <Calendar className={cn("h-4 w-4 text-gray-400",isRTL && 'ltr' ,isRTL && 'flex-row-reverse')} />}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Last Updated")}</p>
                    <p className="text-gray-900">{formatDate(lead.updated_at || lead.updatedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("Notes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("Close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLeadModal; 