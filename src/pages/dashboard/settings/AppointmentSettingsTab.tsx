import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Palette } from "lucide-react";
import AddEditStatusModal, { AppointmentStatus } from "@/components/modals/AddEditStatusModal";
import { toast } from "@/hooks/use-toast";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppointmentSettingsTabProps {
  data?: any;
  onChange?: (data: any) => void;
}

const STORAGE_KEY = "appointment_statuses";

// Default statuses based on the backend schema
const DEFAULT_STATUSES: AppointmentStatus[] = [
  {
    code: "S001",
    name_ar: "مجدول",
    name_en: "Scheduled",
    color: "#3b82f6",
    order: 1,
    show_in_calendar: false,
    is_active: true,
    is_default: true,
    is_deleted: false,
  },
  {
    code: "S002",
    name_ar: "مؤكد",
    name_en: "Confirmed",
    color: "#10b981",
    order: 2,
    show_in_calendar: false,
    is_active: true,
    is_default: false,
    is_deleted: false,
  },
  {
    code: "S003",
    name_ar: "قيد التنفيذ",
    name_en: "In Progress",
    color: "#f59e0b",
    order: 3,
    show_in_calendar: false,
    is_active: true,
    is_default: false,
    is_deleted: false,
  },
  {
    code: "S004",
    name_ar: "مكتمل",
    name_en: "Completed",
    color: "#10b981",
    order: 4,
    show_in_calendar: false,
    is_active: true,
    is_default: false,
    is_deleted: false,
  },
  {
    code: "S005",
    name_ar: "ملغي",
    name_en: "Cancelled",
    color: "#ef4444",
    order: 5,
    show_in_calendar: false,
    is_active: true,
    is_default: false,
    is_deleted: false,
  },
  {
    code: "S006",
    name_ar: "لم يحضر",
    name_en: "No Show",
    color: "#f59e0b",
    order: 6,
    show_in_calendar: false,
    is_active: true,
    is_default: false,
    is_deleted: false,
  },
];

const AppointmentSettingsTab: React.FC<AppointmentSettingsTabProps> = ({
  data,
  onChange,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<AppointmentStatus[]>([]);
  const [deletedStatuses, setDeletedStatuses] = useState<AppointmentStatus[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<AppointmentStatus | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<AppointmentStatus | null>(null);
  const [mode, setMode] = useState<"add" | "edit">("add");

  // Load statuses from localStorage on mount
  useEffect(() => {
    const loadStatuses = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setStatuses(parsed);
          setActiveStatuses(parsed.filter((s: AppointmentStatus) => !s.is_deleted));
          setDeletedStatuses(parsed.filter((s: AppointmentStatus) => s.is_deleted));
        } else {
          // Initialize with default statuses
          setStatuses(DEFAULT_STATUSES);
          setActiveStatuses(DEFAULT_STATUSES.filter((s) => !s.is_deleted));
          setDeletedStatuses(DEFAULT_STATUSES.filter((s) => s.is_deleted));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATUSES));
        }
      } catch (error) {
        console.error("Error loading statuses:", error);
        setStatuses(DEFAULT_STATUSES);
        setActiveStatuses(DEFAULT_STATUSES.filter((s) => !s.is_deleted));
      }
    };

    loadStatuses();
  }, []);

  // Save statuses to localStorage whenever they change
  const saveStatuses = (newStatuses: AppointmentStatus[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatuses));
      setStatuses(newStatuses);
      setActiveStatuses(newStatuses.filter((s) => !s.is_deleted));
      setDeletedStatuses(newStatuses.filter((s) => s.is_deleted));
      if (onChange) {
        onChange({ appointmentStatuses: newStatuses });
      }
      toast({
        title: t("Success"),
        description: t("Appointment statuses updated successfully"),
      });
    } catch (error) {
      console.error("Error saving statuses:", error);
      toast({
        title: t("Error"),
        description: t("Failed to save appointment statuses"),
        variant: "destructive",
      });
    }
  };

  const handleAddStatus = () => {
    setEditingStatus(null);
    setMode("add");
    setModalOpen(true);
  };

  const handleEditStatus = (status: AppointmentStatus) => {
    setEditingStatus(status);
    setMode("edit");
    setModalOpen(true);
  };

  const handleSaveStatus = (statusData: AppointmentStatus) => {
    if (mode === "add") {
      const newStatus: AppointmentStatus = {
        ...statusData,
        _id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        order: statusData.order || statuses.length + 1,
      };
      const updated = [...statuses, newStatus].sort((a, b) => (a.order || 0) - (b.order || 0));
      saveStatuses(updated);
    } else {
      // Edit mode - find exact status and update it
      const statusIndex = statuses.findIndex((s) => {
        if (editingStatus?._id && s._id) {
          return s._id === editingStatus._id;
        }
        if (editingStatus?.code && s.code && s.code === editingStatus.code) {
          return (
            s.name_ar === editingStatus.name_ar &&
            s.name_en === editingStatus.name_en &&
            s.color === editingStatus.color
          );
        }
        return false;
      });

      if (statusIndex === -1) {
        toast({
          title: t("Error"),
          description: t("Status not found. Please refresh and try again."),
          variant: "destructive",
        });
        return;
      }

      // Preserve original _id and code, update other fields
      const updated = statuses.map((s, index) => {
        if (index === statusIndex) {
          return {
            ...s,
            ...statusData,
            _id: s._id || statusData._id, // Preserve original _id
            code: s.code, // Preserve original code in edit mode (cannot change)
          };
        }
        return s;
      }).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      saveStatuses(updated);
    }
    setModalOpen(false);
    setEditingStatus(null);
  };

  // List of status codes that cannot be deleted
  const PROTECTED_STATUS_CODES = ["S001", "S002", "S004", "S005"]; // مجدول, مؤكد, مكتمل, ملغي

  const handleDeleteStatus = (status: AppointmentStatus) => {
    // Check if it's a protected status (cannot be deleted)
    if (status.code && PROTECTED_STATUS_CODES.includes(status.code)) {
      toast({
        title: t("Error"),
        description: t("Cannot delete this protected status"),
        variant: "destructive",
      });
      return;
    }

    // Check if it's a default status
    if (status.is_default) {
      toast({
        title: t("Error"),
        description: t("Cannot delete default status"),
        variant: "destructive",
      });
      return;
    }

    setStatusToDelete(status);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!statusToDelete) return;

    // Double check that it's not a protected status
    if (statusToDelete.code && PROTECTED_STATUS_CODES.includes(statusToDelete.code)) {
      toast({
        title: t("Error"),
        description: t("Cannot delete this protected status"),
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setStatusToDelete(null);
      return;
    }

    // Find the exact status to delete using multiple criteria for safety
    const statusIndex = statuses.findIndex((s) => {
      // First try to match by _id if both exist
      if (statusToDelete._id && s._id) {
        return s._id === statusToDelete._id;
      }
      // If no _id match, match by code and verify it's the same status
      if (statusToDelete.code && s.code && s.code === statusToDelete.code) {
        // Verify it's the exact same status by checking name and color
        return (
          s.name_ar === statusToDelete.name_ar &&
          s.name_en === statusToDelete.name_en &&
          s.color === statusToDelete.color
        );
      }
      return false;
    });

    if (statusIndex === -1) {
      console.error("Error: Status not found for deletion");
      toast({
        title: t("Error"),
        description: t("Status not found. Please refresh and try again."),
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setStatusToDelete(null);
      return;
    }

    // Create updated array with only the matched status marked as deleted
    const updated = statuses.map((s, index) => {
      if (index === statusIndex) {
        return { ...s, is_deleted: true, is_active: false };
      }
      return s;
    });

    saveStatuses(updated);
    setDeleteDialogOpen(false);
    setStatusToDelete(null);
  };

  const getStatusName = (status: AppointmentStatus) => {
    return i18n.language === "ar" ? status.name_ar : status.name_en;
  };

  return (
    <div className={cn("space-y-6", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <div className={cn(
            "flex items-center justify-between",
            isRTL ? "flex-row-reverse" : ""
          )}>
            <div className={cn(isRTL && "text-right")}>
              <CardTitle className={cn(
                "flex items-center gap-2 text-xl font-semibold",
                isRTL ? "flex-row-reverse" : ""
              )}>
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                {t("Status Configuration")}
              </CardTitle>
              <CardDescription className={cn(
                "text-sm text-muted-foreground mt-1",
                isRTL && "text-right"
              )}>
                {t("Configure appointment statuses with names and colors")}
              </CardDescription>
            </div>
            <Button 
              onClick={handleAddStatus} 
              size="sm"
              className={cn(
                "gap-2",
                isRTL ? "flex-row-reverse" : ""
              )}
            >
              <Plus className="h-4 w-4" />
              {t("Add Status")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeStatuses.length === 0 ? (
            <div className={cn(
              "text-center py-12 text-muted-foreground",
              isRTL && "text-right"
            )}>
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">{t("No statuses configured yet")}</p>
              <p className="text-sm mb-4">{t("Start by adding your first appointment status")}</p>
              <Button
                onClick={handleAddStatus}
                variant="outline"
                className={cn(
                  "mt-4 gap-2",
                  isRTL ? "flex-row-reverse" : ""
                )}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                {t("Add First Status")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeStatuses.map((status) => (
                <div
                  key={status._id || status.code}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm",
                    isRTL ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-3 flex-1 min-w-0",
                    isRTL ? "flex-row-reverse" : ""
                  )}>
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-border shadow-sm"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className={cn(
                      "flex-1 min-w-0",
                      isRTL ? "text-right" : ""
                    )}>
                      <div className={cn(
                        "flex items-center gap-2 mb-1",
                        isRTL ? "flex-row-reverse justify-end" : ""
                      )}>
                        <span className={cn(
                          "font-semibold text-base",
                          isRTL ? "text-right" : ""
                        )}>
                          {getStatusName(status)}
                        </span>
                        {status.is_default && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {t("Default")}
                          </Badge>
                        )}
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 mt-1.5 flex-wrap",
                        isRTL ? "flex-row-reverse justify-end" : ""
                      )}>
                        <code className={cn(
                          "text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded font-mono",
                          "dir-ltr"
                        )}>
                          {status.code || "N/A"}
                        </code>
                        {status.order && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {t("Order")}: {status.order}
                          </Badge>
                        )}
                        <span className={cn(
                          "text-xs text-muted-foreground",
                          i18n.language === "ar" ? "dir-ltr text-left" : "dir-rtl text-right"
                        )}>
                          {i18n.language === "ar" ? status.name_en : status.name_ar}
                        </span>
                        <span
                          className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-muted/50 rounded"
                          style={{ color: status.color }}
                          dir="ltr"
                        >
                          {status.color}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 flex-shrink-0",
                    isRTL ? "flex-row-reverse mr-2" : "ml-2"
                  )}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStatus(status)}
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                      title={t("Edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!status.is_default && 
                     !(status.code && PROTECTED_STATUS_CODES.includes(status.code)) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStatus(status);
                        }}
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={t("Delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current System Statuses Section */}
      {deletedStatuses.length > 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className={cn(
              "flex items-center gap-2 text-lg font-semibold",
              isRTL ? "flex-row-reverse text-right" : ""
            )}>
              <Palette className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              {t("Deleted Statuses")}
            </CardTitle>
            <CardDescription className={cn(
              "text-sm text-muted-foreground",
              isRTL && "text-right"
            )}>
              {t("These statuses are deleted (soft delete). You can restore them by editing.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deletedStatuses.map((status) => (
                <div
                  key={status._id || status.code}
                  className={cn(
                    "flex items-center justify-between p-4 border border-dashed rounded-lg bg-muted/30 opacity-70",
                    isRTL ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-3 flex-1 min-w-0",
                    isRTL ? "flex-row-reverse" : ""
                  )}>
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-border opacity-50"
                      style={{ backgroundColor: status.color }}
                    />
                    <div className={cn(
                      "flex-1 min-w-0",
                      isRTL ? "text-right" : ""
                    )}>
                      <div className={cn(
                        "flex items-center gap-2 mb-1",
                        isRTL ? "flex-row-reverse justify-end" : ""
                      )}>
                        <span className={cn(
                          "font-medium line-through text-muted-foreground",
                          isRTL ? "text-right" : ""
                        )}>
                          {getStatusName(status)}
                        </span>
                        <Badge variant="destructive" className="text-xs px-2 py-0.5">
                          {t("Deleted")}
                        </Badge>
                      </div>
                      <code className={cn(
                        "text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono",
                        "dir-ltr"
                      )}>
                        {status.code}
                      </code>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Restore status - find exact match first
                      const statusIndex = statuses.findIndex((s) => {
                        if (status._id && s._id) {
                          return s._id === status._id;
                        }
                        if (status.code && s.code && s.code === status.code) {
                          return (
                            s.name_ar === status.name_ar &&
                            s.name_en === status.name_en &&
                            s.color === status.color
                          );
                        }
                        return false;
                      });

                      if (statusIndex === -1) {
                        toast({
                          title: t("Error"),
                          description: t("Status not found. Please refresh and try again."),
                          variant: "destructive",
                        });
                        return;
                      }

                      const updated = statuses.map((s, index) => {
                        if (index === statusIndex) {
                          return { ...s, is_deleted: false, is_active: true };
                        }
                        return s;
                      });
                      saveStatuses(updated);
                    }}
                    className={cn(
                      "gap-2",
                      isRTL ? "flex-row-reverse" : ""
                    )}
                  >
                    {t("Restore")}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <AddEditStatusModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        status={editingStatus}
        existingStatuses={activeStatuses}
        onSave={handleSaveStatus}
        mode={mode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader className={cn(isRTL && "text-right")}>
            <AlertDialogTitle className={cn(isRTL && "text-right")}>
              {t("Delete Status")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isRTL && "text-right")}>
              {t("Are you sure you want to delete this status? This action will mark it as deleted (soft delete).")}
              <br />
              <strong className="mt-2 block">{statusToDelete && getStatusName(statusToDelete)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(
            "gap-2",
            isRTL ? "flex-row-reverse" : ""
          )}>
            <AlertDialogCancel className={cn(
              "min-w-[100px]",
              isRTL ? "mr-0" : ""
            )}>
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[100px]",
                isRTL ? "ml-0" : ""
              )}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppointmentSettingsTab;

