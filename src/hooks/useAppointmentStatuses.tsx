import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import appointmentStatusApi, { 
  AppointmentStatus, 
  CreateAppointmentStatusRequest, 
  UpdateAppointmentStatusRequest,
  BatchUpdateRequest 
} from '@/services/api/appointmentStatusApi';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';

// Query Keys
export const appointmentStatusQueryKeys = {
  all: (clinicId: string | null) => ['appointment-statuses', clinicId] as const,
  list: (clinicId: string | null) => ['appointment-statuses', clinicId, 'list'] as const,
  detail: (clinicId: string | null, id: string) => ['appointment-statuses', clinicId, id] as const,
};

// Hook to get all appointment statuses
export const useAppointmentStatuses = (includeInactive: boolean = false) => {
  const { currentClinic } = useClinic();
  const clinicId = currentClinic?._id || null;
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: appointmentStatusQueryKeys.list(clinicId),
    queryFn: () => appointmentStatusApi.getStatuses(includeInactive),
    staleTime: 0, // Always consider data stale to allow immediate refetch after mutations
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!clinicId,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts
  });
};

// Hook to get single appointment status
export const useAppointmentStatus = (id: string) => {
  const { currentClinic } = useClinic();
  const clinicId = currentClinic?._id || null;

  return useQuery({
    queryKey: appointmentStatusQueryKeys.detail(clinicId, id),
    queryFn: () => appointmentStatusApi.getStatusById(id),
    enabled: !!clinicId && !!id,
  });
};

// Hook to create appointment status
export const useCreateAppointmentStatus = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentClinic } = useClinic();
  const clinicId = currentClinic?._id || null;

  return useMutation({
    mutationFn: (data: CreateAppointmentStatusRequest) => appointmentStatusApi.createStatus(data),
    onSuccess: (newStatus) => {
      // Invalidate and refetch queries immediately
      queryClient.invalidateQueries({ 
        queryKey: appointmentStatusQueryKeys.all(clinicId),
        refetchType: 'active' // Only refetch active queries
      });
      
      // Also update the cache optimistically by adding the new status
      queryClient.setQueryData(
        appointmentStatusQueryKeys.list(clinicId),
        (oldData: AppointmentStatus[] = []) => {
          // Add new status to the list
          const updatedData = [...oldData, newStatus];
          // Sort by order
          return updatedData.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      );
      
      // Force refetch to ensure we have the latest data
      queryClient.refetchQueries({ 
        queryKey: appointmentStatusQueryKeys.all(clinicId),
        type: 'active'
      });
      
      toast({
        title: t("Success"),
        description: t("Appointment status created successfully"),
      });
    },
    onError: (error: any) => {
      console.error('Create appointment status error:', error);
      toast({
        title: t("Error"),
        description: error.response?.data?.message || t("Failed to create appointment status"),
        variant: "destructive",
      });
    },
  });
};

// Hook to update appointment status
export const useUpdateAppointmentStatus = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentClinic } = useClinic();
  const clinicId = currentClinic?._id || null;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentStatusRequest }) =>
      appointmentStatusApi.updateStatus(id, data),
    onSuccess: (updatedStatus, variables) => {
      // Update cache optimistically
      queryClient.setQueryData(
        appointmentStatusQueryKeys.list(clinicId),
        (oldData: AppointmentStatus[] = []) => {
          return oldData.map(status => 
            status._id === variables.id ? { ...status, ...updatedStatus } : status
          ).sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      );
      
      // Invalidate and refetch queries immediately
      queryClient.invalidateQueries({ 
        queryKey: appointmentStatusQueryKeys.all(clinicId),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: appointmentStatusQueryKeys.detail(clinicId, variables.id) 
      });
      
      // Force refetch to ensure we have the latest data
      queryClient.refetchQueries({ 
        queryKey: appointmentStatusQueryKeys.all(clinicId),
        type: 'active'
      });
      
      toast({
        title: t("Success"),
        description: t("Appointment status updated successfully"),
      });
    },
    onError: (error: any) => {
      console.error('Update appointment status error:', error);
      toast({
        title: t("Error"),
        description: error.response?.data?.message || t("Failed to update appointment status"),
        variant: "destructive",
      });
    },
  });
};

// Hook to delete appointment status
export const useDeleteAppointmentStatus = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentClinic } = useClinic();
  const clinicId = currentClinic?._id || null;

  return useMutation({
    mutationFn: (id: string) => appointmentStatusApi.deleteStatus(id),
    onSuccess: (_, deletedId) => {
      // Update cache optimistically by marking as inactive
      queryClient.setQueryData(
        appointmentStatusQueryKeys.list(clinicId),
        (oldData: AppointmentStatus[] = []) => {
          return oldData.map(status => 
            status._id === deletedId ? { ...status, is_active: false } : status
          );
        }
      );
      
      // Invalidate and refetch queries immediately
      queryClient.invalidateQueries({ 
        queryKey: appointmentStatusQueryKeys.all(clinicId),
        refetchType: 'active'
      });
      
      // Force refetch to ensure we have the latest data
      queryClient.refetchQueries({ 
        queryKey: appointmentStatusQueryKeys.all(clinicId),
        type: 'active'
      });
      
      toast({
        title: t("Success"),
        description: t("Appointment status deleted successfully"),
      });
    },
    onError: (error: any) => {
      console.error('Delete appointment status error:', error);
      toast({
        title: t("Error"),
        description: error.response?.data?.message || t("Failed to delete appointment status"),
        variant: "destructive",
      });
    },
  });
};

// Hook to batch update appointment statuses
export const useBatchUpdateAppointmentStatuses = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { currentClinic } = useClinic();
  const clinicId = currentClinic?._id || null;

  return useMutation({
    mutationFn: (data: BatchUpdateRequest) => appointmentStatusApi.batchUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentStatusQueryKeys.all(clinicId) });
      toast({
        title: t("Success"),
        description: t("Appointment statuses updated successfully"),
      });
    },
    onError: (error: any) => {
      console.error('Batch update appointment statuses error:', error);
      toast({
        title: t("Error"),
        description: error.response?.data?.message || t("Failed to update appointment statuses"),
        variant: "destructive",
      });
    },
  });
};

// Helper hook to get status config by code
export const useAppointmentStatusConfig = () => {
  // Only get active statuses for display in calendar/table
  const { data: statuses = [], isLoading } = useAppointmentStatuses(false);
  const { i18n } = useTranslation();

  // Use fallback statuses if API returns empty and not loading
  const effectiveStatuses = (!isLoading && statuses.length === 0) ? [
    { code: 'scheduled', name_en: 'Scheduled', name_ar: 'مجدول', color: '#3b82f6', order: 1, show_in_calendar: true, is_active: true, is_default: true, icon: 'Clock' },
    { code: 'confirmed', name_en: 'Confirmed', name_ar: 'مؤكد', color: '#10b981', order: 2, show_in_calendar: true, is_active: true, is_default: false, icon: 'CheckCircle' },
    { code: 'in-progress', name_en: 'In Progress', name_ar: 'قيد التنفيذ', color: '#f59e0b', order: 3, show_in_calendar: true, is_active: true, is_default: false, icon: 'Loader2' },
    { code: 'completed', name_en: 'Completed', name_ar: 'مكتمل', color: '#10b981', order: 4, show_in_calendar: true, is_active: true, is_default: false, icon: 'CheckCircle' },
    { code: 'cancelled', name_en: 'Cancelled', name_ar: 'ملغي', color: '#ef4444', order: 5, show_in_calendar: false, is_active: true, is_default: false, icon: 'XCircle' },
    { code: 'no-show', name_en: 'No Show', name_ar: 'لم يحضر', color: '#f59e0b', order: 6, show_in_calendar: false, is_active: true, is_default: false, icon: 'AlertCircle' },
  ] : statuses;

  const getStatusConfig = (code: string): AppointmentStatus | undefined => {
    return effectiveStatuses.find(status => status.code === code);
  };

  const getStatusName = (code: string): string => {
    const config = getStatusConfig(code);
    if (!config) {
      // Fallback: return formatted code
      return code.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return i18n.language === 'ar' ? config.name_ar : config.name_en;
  };

  const getStatusColor = (code: string): string => {
    const config = getStatusConfig(code);
    return config?.color || '#6b7280';
  };

  const getStatusColorClass = (code: string): string => {
    const color = getStatusColor(code);
    // Convert hex color to Tailwind-like classes
    const colorMap: Record<string, string> = {
      '#10b981': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200',
      '#3b82f6': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200',
      '#ef4444': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200',
      '#f59e0b': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200',
      '#8b5cf6': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200',
      '#ec4899': 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300 border-pink-200',
      '#06b6d4': 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300 border-cyan-200',
    };
    return colorMap[color.toLowerCase()] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200';
  };

  const getStatusIcon = (code: string): React.ReactNode => {
    const config = getStatusConfig(code);
    const iconName = config?.icon || 'Clock';
    const color = getStatusColor(code);
    
    // Map icon names to React components
    const iconMap: Record<string, React.ComponentType<any>> = {
      'Clock': Clock,
      'CheckCircle': CheckCircle,
      'XCircle': XCircle,
      'AlertCircle': AlertCircle,
      'AlertTriangle': AlertTriangle,
      'Loader2': Loader2,
    };
    
    const IconComponent = iconMap[iconName] || Clock;
    
    // Determine icon color based on status color
    let iconColor = 'text-muted-foreground';
    if (color === '#10b981') iconColor = 'text-green-600';
    else if (color === '#3b82f6') iconColor = 'text-blue-600';
    else if (color === '#ef4444') iconColor = 'text-red-600';
    else if (color === '#f59e0b') iconColor = 'text-orange-600';
    else if (color === '#8b5cf6') iconColor = 'text-purple-600';
    else if (color === '#ec4899') iconColor = 'text-pink-600';
    else if (color === '#06b6d4') iconColor = 'text-cyan-600';
    
    return <IconComponent className={`h-4 w-4 ${iconColor}`} />;
  };

  const getCalendarStatuses = (): AppointmentStatus[] => {
    return effectiveStatuses.filter(status => status.show_in_calendar && status.is_active);
  };

  return {
    statuses: effectiveStatuses,
    isLoading,
    getStatusConfig,
    getStatusName,
    getStatusColor,
    getStatusColorClass,
    getStatusIcon,
    getCalendarStatuses,
  };
};

