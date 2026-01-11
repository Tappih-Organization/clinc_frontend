import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Palette, Loader2, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react";
import AddEditStatusModal, { AppointmentStatus } from "@/components/modals/AddEditStatusModal";
import { toast } from "@/hooks/use-toast";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import {
  useAppointmentStatuses,
  useCreateAppointmentStatus,
  useUpdateAppointmentStatus,
  useDeleteAppointmentStatus,
} from "@/hooks/useAppointmentStatuses";
import Loading from "@/components/ui/Loading";
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

const AppointmentSettingsTab: React.FC<AppointmentSettingsTabProps> = ({
  data,
  onChange,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  
  // API hooks - include inactive statuses for settings page
  const { data: statuses = [], isLoading, error: statusesError } = useAppointmentStatuses(true);
  const createStatus = useCreateAppointmentStatus();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteStatus = useDeleteAppointmentStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<AppointmentStatus | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<AppointmentStatus | null>(null);
  const [mode, setMode] = useState<"add" | "edit">("add");

  // Debug: Log statuses data
  React.useEffect(() => {
    console.log('🔍 AppointmentStatuses Debug:', {
      totalStatuses: statuses.length,
      statuses,
      isLoading,
      error: statusesError,
      activeCount: statuses.filter((s) => s.is_active !== false).length,
      deletedCount: statuses.filter((s) => s.is_active === false).length
    });
  }, [statuses, isLoading, statusesError]);

  // Sort statuses by order, then by name
  const sortedStatuses = [...statuses].sort((a, b) => {
    if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
    return (a.name_en || '').localeCompare(b.name_en || '');
  });

  // Filter active and deleted statuses - handle undefined/null is_active
  const activeStatuses = sortedStatuses.filter((s) => s.is_active !== false);
  const deletedStatuses = sortedStatuses.filter((s) => s.is_active === false);

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

  const handleSaveStatus = async (statusData: AppointmentStatus) => {
    try {
      if (mode === "add") {
        const newStatus = await createStatus.mutateAsync({
          code: statusData.code.toLowerCase().replace(/\s+/g, '-'),
          name_ar: statusData.name_ar,
          name_en: statusData.name_en,
          color: statusData.color,
          icon: statusData.icon || 'Clock',
          order: statusData.order || statuses.length + 1,
          show_in_calendar: statusData.show_in_calendar ?? false,
          is_default: statusData.is_default ?? false,
          description: statusData.description,
        });
        
        console.log('✅ Status created successfully:', newStatus);
        
        // Close modal immediately after success
        setModalOpen(false);
        setEditingStatus(null);
        
        // The mutation hook will handle cache invalidation and refetch
      } else if (editingStatus?._id) {
        const updatedStatus = await updateStatus.mutateAsync({
          id: editingStatus._id,
          data: {
            name_ar: statusData.name_ar,
            name_en: statusData.name_en,
            color: statusData.color,
            icon: statusData.icon,
            order: statusData.order,
            show_in_calendar: statusData.show_in_calendar,
            is_default: statusData.is_default,
            description: statusData.description,
          },
        });
        
        console.log('✅ Status updated successfully:', updatedStatus);
        
        // Close modal immediately after success
        setModalOpen(false);
        setEditingStatus(null);
        
        // The mutation hook will handle cache invalidation and refetch
      }
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('❌ Error saving status:', error);
      // Don't close modal on error - let user see the error and retry
    }
  };

  const handleDeleteStatus = (status: AppointmentStatus) => {
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

  const confirmDelete = async () => {
    if (!statusToDelete?._id) return;

    try {
      await deleteStatus.mutateAsync(statusToDelete._id);
      setDeleteDialogOpen(false);
      setStatusToDelete(null);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Error deleting status:', error);
    }
  };

  const getStatusName = (status: AppointmentStatus) => {
    return i18n.language === "ar" ? status.name_ar : status.name_en;
  };

  // Get icon component from icon name
  const getStatusIconComponent = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'Clock': Clock,
      'CheckCircle': CheckCircle,
      'XCircle': XCircle,
      'AlertCircle': AlertCircle,
      'AlertTriangle': AlertTriangle,
      'Loader2': Loader2,
    };
    const IconComponent = iconMap[iconName || 'Clock'] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="default" />
      </div>
    );
  }

  // Show error state if there's an error
  if (statusesError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        isRTL && "text-right"
      )}>
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("Error Loading Statuses")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {statusesError instanceof Error ? statusesError.message : t("Failed to load appointment statuses")}
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className={cn(
            "gap-2",
            isRTL ? "flex-row-reverse" : ""
          )}
        >
          <Loader2 className="h-4 w-4" />
          {t("Retry")}
        </Button>
      </div>
    );
  }

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
          {activeStatuses.length === 0 && !isLoading ? (
            <div className={cn(
              "text-center py-12 text-muted-foreground",
              isRTL && "text-right"
            )}>
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">{t("No statuses configured yet")}</p>
              <p className="text-sm mb-4">
                {statuses.length === 0 
                  ? t("No appointment statuses found. Start by adding your first status.")
                  : t("All statuses are currently inactive. Add a new status or restore a deleted one.")
                }
              </p>
              <div className={cn(
                "flex gap-2 justify-center flex-wrap",
                isRTL ? "flex-row-reverse" : ""
              )}>
                <Button
                  onClick={handleAddStatus}
                  variant="default"
                  className={cn(
                    "gap-2",
                    isRTL ? "flex-row-reverse" : ""
                  )}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  {t("Add First Status")}
                </Button>
                {deletedStatuses.length > 0 && (
                  <Button
                    onClick={() => {
                      // Scroll to deleted statuses section
                      const deletedSection = document.getElementById('deleted-statuses');
                      deletedSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    variant="outline"
                    className={cn(
                      "gap-2",
                      isRTL ? "flex-row-reverse" : ""
                    )}
                    size="sm"
                  >
                    {t("View Deleted Statuses")} ({deletedStatuses.length})
                  </Button>
                )}
              </div>
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
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-border shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: status.color }}
                      >
                        {status.icon ? (
                          <div className="text-white drop-shadow-sm">
                            {getStatusIconComponent(status.icon)}
                          </div>
                        ) : null}
                      </div>
                    </div>
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
                        {status.show_in_calendar && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 text-primary border-primary">
                            {t("Calendar")}
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
                        {status.icon && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {t("Icon")}: {status.icon}
                          </Badge>
                        )}
                        <span
                          className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-muted/50 rounded"
                          style={{ color: status.color }}
                          dir="ltr"
                        >
                          {status.color}
                        </span>
                      </div>
                      {status.description && (
                        <div className={cn(
                          "mt-2 text-xs text-muted-foreground italic",
                          isRTL ? "text-right" : ""
                        )}>
                          {status.description}
                        </div>
                      )}
                      {(status.created_at || status.updated_at) && (
                        <div className={cn(
                          "mt-1.5 flex items-center gap-2 text-xs text-muted-foreground",
                          isRTL ? "flex-row-reverse justify-end" : ""
                        )}>
                          {status.created_at && (
                            <span>
                              {t("Created")}: {new Date(status.created_at).toLocaleDateString(i18n.language)}
                            </span>
                          )}
                          {status.updated_at && status.updated_at !== status.created_at && (
                            <span>
                              {t("Updated")}: {new Date(status.updated_at).toLocaleDateString(i18n.language)}
                            </span>
                          )}
                        </div>
                      )}
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
                    {!status.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStatus(status);
                        }}
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={t("Delete")}
                        disabled={deleteStatus.isPending}
                      >
                        {deleteStatus.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
        <Card id="deleted-statuses" className="border-dashed">
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
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-border opacity-50 flex items-center justify-center"
                        style={{ backgroundColor: status.color }}
                      >
                        {status.icon ? (
                          <div className="text-white drop-shadow-sm opacity-70">
                            {getStatusIconComponent(status.icon)}
                          </div>
                        ) : null}
                      </div>
                    </div>
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
                        {status.is_default && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 opacity-70">
                            {t("Default")}
                          </Badge>
                        )}
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 mt-1.5 flex-wrap",
                        isRTL ? "flex-row-reverse justify-end" : ""
                      )}>
                        <code className={cn(
                          "text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono",
                          "dir-ltr"
                        )}>
                          {status.code}
                        </code>
                        {status.order && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 opacity-70">
                            {t("Order")}: {status.order}
                          </Badge>
                        )}
                        <span className={cn(
                          "text-xs text-muted-foreground",
                          i18n.language === "ar" ? "dir-ltr text-left" : "dir-rtl text-right"
                        )}>
                          {i18n.language === "ar" ? status.name_en : status.name_ar}
                        </span>
                        {status.icon && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 opacity-70">
                            {t("Icon")}: {status.icon}
                          </Badge>
                        )}
                        <span
                          className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-muted/50 rounded opacity-70"
                          style={{ color: status.color }}
                          dir="ltr"
                        >
                          {status.color}
                        </span>
                      </div>
                      {status.description && (
                        <div className={cn(
                          "mt-2 text-xs text-muted-foreground italic opacity-70",
                          isRTL ? "text-right" : ""
                        )}>
                          {status.description}
                        </div>
                      )}
                      {(status.created_at || status.updated_at) && (
                        <div className={cn(
                          "mt-1.5 flex items-center gap-2 text-xs text-muted-foreground opacity-70",
                          isRTL ? "flex-row-reverse justify-end" : ""
                        )}>
                          {status.created_at && (
                            <span>
                              {t("Created")}: {new Date(status.created_at).toLocaleDateString(i18n.language)}
                            </span>
                          )}
                          {status.updated_at && status.updated_at !== status.created_at && (
                            <span>
                              {t("Updated")}: {new Date(status.updated_at).toLocaleDateString(i18n.language)}
                            </span>
                          )}
                        </div>
                      )}
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

                      // Restore status by updating is_active to true
                      if (status._id) {
                        updateStatus.mutate({
                          id: status._id,
                          data: { is_active: true },
                        });
                      }
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

