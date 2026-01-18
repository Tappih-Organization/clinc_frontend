import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Clock,
  User,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useClinic } from "@/contexts/ClinicContext";
import { useAppointments, useUpdateAppointment } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import appointmentApi, { CalendarEvent, BackendAppointment } from "@/services/api/appointmentApi";
import userApi, { Doctor } from "@/services/api/userApi";
import { getLocale, formatDateShort, formatDateShortWithWeekday, formatTime as formatTimeUtil } from "@/utils/dateUtils";
import NewAppointmentModal from "@/components/modals/NewAppointmentModal";
import AppointmentDetailModal from "@/components/modals/AppointmentDetailModal";
import { AppointmentSlipPDFGenerator, convertToAppointmentSlipData, type ClinicInfo } from "@/utils/appointmentSlipPdf";
import { useAppointmentStatusConfig } from "@/hooks/useAppointmentStatuses";

const AppointmentsCalendar = () => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const currentLocale = getLocale();
  const { currentClinic, loading: clinicLoading, error: clinicError } = useClinic();
  
  // Get dynamic appointment statuses
  const { statuses, isLoading: statusesLoading, getStatusConfig, getStatusColor, getStatusName, getStatusColorClass, getStatusIcon, getCalendarStatuses } = useAppointmentStatusConfig();
  
  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Filter states (same as AppointmentsTable)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [selectedDatefilter, setSelectedDatefilter] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  
  // Modal states
  const [viewDetailsModal, setViewDetailsModal] = useState<{
    open: boolean;
    appointment: any | null;
  }>({ open: false, appointment: null });
  
  // API data states
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mutations
  const updateAppointmentMutation = useUpdateAppointment();
  
  // Build API parameters with date filtering (same as AppointmentsTable)
  const getDateRangeParams = () => {
    // Handle custom date selection
    if (selectedDateFilter === "custom-date" && selectedDatefilter) {
      const selected = new Date(selectedDatefilter);
      selected.setHours(0, 0, 0, 0);

      const end = new Date(selected);
      end.setHours(23, 59, 59, 999);

      return {
        start_date: selected.toISOString(),
        end_date: end.toISOString(),
      };
    }

    if (selectedDateFilter === "all" || selectedDateFilter === "custom-date") return {};
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedDateFilter) {
      case "today":
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        return {
          start_date: today.toISOString(),
          end_date: endOfToday.toISOString(),
        };
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        return {
          start_date: tomorrow.toISOString(),
          end_date: endOfTomorrow.toISOString(),
        };
      case "this-week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          start_date: startOfWeek.toISOString(),
          end_date: endOfWeek.toISOString(),
        };
      case "next-week":
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
        nextWeekStart.setHours(0, 0, 0, 0);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        nextWeekEnd.setHours(23, 59, 59, 999);
        return {
          start_date: nextWeekStart.toISOString(),
          end_date: nextWeekEnd.toISOString(),
        };
      default:
        return {};
    }
  };
  
  // Build API params for appointments list (for stats and filtering)
  // Note: We fetch all appointments and filter by status on client side for better control
  const apiParams = {
    limit: 1000,
    ...getDateRangeParams(),
    // Don't filter by status in API - we'll filter on client side for consistency
  };
  
  // Fetch all appointments for stats (using useAppointments like AppointmentsTable)
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(apiParams);
  
  // Convert API appointment to unified format
  const convertAppointment = (apiAppointment: any) => {
    const patient = apiAppointment.patient_id;
    const doctor = apiAppointment.doctor_id;
    const nurse = apiAppointment.nurse_id;
    
    return {
      id: apiAppointment._id,
      patientId: typeof patient === 'string' ? patient : patient?._id,
      doctorId: typeof doctor === 'string' ? doctor : doctor?._id,
      nurseId: typeof nurse === 'string' ? nurse : nurse?._id,
      patient_id: patient,
      doctor_id: doctor,
      nurse_id: nurse,
      date: new Date(apiAppointment.appointment_date),
      duration: apiAppointment.duration,
      status: apiAppointment.status,
      notes: apiAppointment.notes || "",
      type: apiAppointment.type,
      createdAt: new Date(apiAppointment.created_at),
      updatedAt: new Date(apiAppointment.updated_at),
      patient: patient ? {
        id: patient._id,
        name: `${patient.first_name} ${patient.last_name}`,
        phone: patient.phone,
        email: patient.email,
        avatar: ""
      } : null,
      doctor: doctor ? {
        id: doctor._id,
        name: `${doctor.first_name} ${doctor.last_name}`,
        specialty: doctor.role === 'doctor' ? 'General Medicine' : doctor.role
      } : null,
      nurse: nurse ? {
        id: nurse._id,
        name: `${nurse.first_name} ${nurse.last_name}`,
        specialty: nurse.role
      } : null
    };
  };
  
  const appointments = (appointmentsData as any)?.data?.appointments || [];
  const processedAppointments = useMemo(() => appointments.map(convertAppointment), [appointments]);
  
  // Helper function to get color based on status (using dynamic statuses)
  const getStatusColorForCalendar = (status: string): string => {
    return getStatusColor(status);
  };
  
  // Helper function to convert appointment to CalendarEvent
  const appointmentToCalendarEvent = (appointment: any): CalendarEvent => {
    const patientName = appointment.patient ? `${appointment.patient.name}` : '';
    const doctorName = appointment.doctor ? `${appointment.doctor.name}` : t("Unknown Doctor");
    const title = patientName || t("Appointment");
    
    return {
      id: appointment.id,
      title: title,
      type: appointment.type as any,
      patientName: patientName || undefined,
      doctorName: doctorName,
      startTime: new Date(appointment.date),
      endTime: new Date(new Date(appointment.date).getTime() + (appointment.duration || 30) * 60000),
      status: appointment.status as any,
      notes: appointment.notes || undefined,
      color: getStatusColorForCalendar(appointment.status),
    };
  };
  
  // Apply filters (search and status - date filter is handled by API)
  const allFilteredAppointments = useMemo(() => {
    return processedAppointments.filter((appointment) => {
      // Apply search filter
      const matchesSearch = !searchTerm || 
        appointment.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply status filter (client-side filtering for consistency)
      // Use dynamic status codes - selectedStatus can be "all" or a status code
      const matchesStatus = selectedStatus === "all" || 
        appointment.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [processedAppointments, searchTerm, selectedStatus]);
  
  // Calculate stats based on all filtered appointments
  const todayStats = {
    total: allFilteredAppointments.length,
    today: allFilteredAppointments.filter(apt => 
      apt.date.toDateString() === new Date().toDateString()
    ).length,
    completed: allFilteredAppointments.filter((a) => a.status === "completed").length,
    scheduled: allFilteredAppointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length,
    cancelled: allFilteredAppointments.filter((a) => a.status === "cancelled" || a.status === "no-show").length,
  };

  // Helper function to get date range based on view mode
  const getDateRange = (date: Date, mode: "month" | "week" | "day") => {
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    switch (mode) {
      case "month":
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(date.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        const day = date.getDay();
        startDate.setDate(date.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "day":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };


  // Load initial data when clinic is available
  useEffect(() => {
    const loadData = async () => {
      if (!currentClinic) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Load doctors
        const doctorsData = await userApi.getDoctors();
        setDoctors(doctorsData);
      } catch (err) {
        console.error("Error loading calendar data:", err);
        const errorMessage = err instanceof Error && err.message.includes('401') 
          ? t("Access denied. Please check your clinic permissions.") 
          : err instanceof Error && err.message.includes('403')
          ? t("Insufficient permissions to view appointments for this clinic.")
          : t("Failed to load calendar data. Please try again.");
        
        setError(errorMessage);
        toast({
          title: t("Error"),
          description: errorMessage,
          variant: "destructive",
        });
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentClinic, t]);
  
  // Update events when filtered appointments change
  useEffect(() => {
    if (allFilteredAppointments.length > 0) {
      const calendarEvents = allFilteredAppointments.map(appointmentToCalendarEvent);
      setEvents(calendarEvents);
    } else {
      setEvents([]);
    }
  }, [allFilteredAppointments]);
  
  // Reset date filter when switching filter options
  useEffect(() => {
    if (selectedDateFilter !== "all" && selectedDateFilter !== "custom-date") {
      setSelectedDatefilter(null);
    }
  }, [selectedDateFilter]);
  
  // When custom date is selected, switch to day view and update currentDate
  useEffect(() => {
    if (selectedDateFilter === "custom-date" && selectedDatefilter) {
      const selectedDate = new Date(selectedDatefilter);
      selectedDate.setHours(0, 0, 0, 0);
      
      // Update currentDate to the selected date
      setCurrentDate(selectedDate);
      
      // Switch to day view
      setViewMode("day");
    }
  }, [selectedDateFilter, selectedDatefilter]);

  // Listen for appointment changes and reload calendar
  useEffect(() => {
    if (!currentClinic) return;

    const handleAppointmentChange = () => {
      // Refresh will be handled by useEffect when allFilteredAppointments changes
    };

    window.addEventListener('appointmentCreated', handleAppointmentChange);
    window.addEventListener('appointmentUpdated', handleAppointmentChange);
    window.addEventListener('appointmentDeleted', handleAppointmentChange);

    return () => {
      window.removeEventListener('appointmentCreated', handleAppointmentChange);
      window.removeEventListener('appointmentUpdated', handleAppointmentChange);
      window.removeEventListener('appointmentDeleted', handleAppointmentChange);
    };
  }, [currentClinic]);



  
  // Handle appointment actions
  const handleViewAppointment = async (appointmentId: string) => {
    try {
      // Find appointment in processed appointments
      const appointment = processedAppointments.find(apt => apt.id === appointmentId);
      
      if (appointment) {
        setViewDetailsModal({ open: true, appointment });
      } else {
        // If not found, try to fetch from API
        const apiAppointment = await appointmentApi.getAppointmentById(appointmentId);
        // Convert CalendarEvent back to appointment format for modal
        const convertedAppointment = {
          id: apiAppointment.id,
          date: apiAppointment.startTime,
          duration: Math.round((apiAppointment.endTime.getTime() - apiAppointment.startTime.getTime()) / 60000),
          status: apiAppointment.status,
          type: apiAppointment.type,
          notes: apiAppointment.notes || "",
          patient: apiAppointment.patientName ? {
            name: apiAppointment.patientName,
            phone: "",
            email: ""
          } : null,
          doctor: {
            name: apiAppointment.doctorName,
            specialty: ""
          }
        };
        setViewDetailsModal({ open: true, appointment: convertedAppointment });
      }
    } catch (err) {
      console.error("Error loading appointment details:", err);
      toast({
        title: t("Error"),
        description: t("Failed to load appointment details."),
        variant: "destructive",
      });
    }
  };
  
  const handleViewDetails = (appointment: any) => {
    setViewDetailsModal({ open: true, appointment });
  };
  
  const handleDownloadSlip = async (appointment: any) => {
    try {
      const appointmentSlipData = convertToAppointmentSlipData(appointment);
      
      const clinicInfo: ClinicInfo = {
        name: currentClinic?.name || "ClinicPro Medical Center",
        address: {
          street: (currentClinic as any)?.address?.street || "123 Healthcare Avenue",
          city: (currentClinic as any)?.address?.city || t("Medical District"), 
          state: (currentClinic as any)?.address?.state || "CA",
          zipCode: (currentClinic as any)?.address?.zipCode || "90210"
        },
        contact: {
          phone: (currentClinic as any)?.phone || "+1 (555) 123-4567",
          email: (currentClinic as any)?.email || "info@clinicpro.com",
          website: (currentClinic as any)?.website || "www.clinicpro.com"
        }
      };

      await AppointmentSlipPDFGenerator.generateAppointmentSlipPDF(
        appointmentSlipData,
        clinicInfo,
        {
          includeHeader: true,
          includeFooter: true,
          includeNotes: true
        }
      );

      toast({
        title: t("Success"),
        description: t("Appointment slip downloaded successfully."),
      });
    } catch (error) {
      console.error('Download appointment slip error:', error);
      toast({
        title: t("Error"),
        description: t("Failed to download appointment slip."),
        variant: "destructive",
      });
    }
  };
  
  const handleMarkComplete = async (appointment: any) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointment.id,
        data: { status: 'completed' }
      });
      
      toast({
        title: t("Success"),
        description: t("Appointment marked as completed."),
      });
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: t("Error"),
        description: t("Failed to update appointment status."),
        variant: "destructive",
      });
    }
  };

  const handleEditAppointment = (appointment: any) => {
    // For now, just show a toast - can be extended to open edit modal
    toast({
      title: t("Edit Appointment"),
      description: t("Edit functionality would open here."),
    });
  };

  const handleCancelAppointment = async (appointment: any) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointment.id,
        data: { status: 'cancelled' }
      });
      
      toast({
        title: t("Success"),
        description: t("Appointment cancelled successfully."),
      });
    } catch (err) {
      toast({
        title: t("Error"),
        description: t("Failed to cancel appointment."),
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    // Refresh will be handled by useEffect when appointmentsData changes
    // Force a re-render by updating a dummy state if needed
    toast({
      title: t("Success"),
      description: t("Calendar refreshed successfully."),
    });
  };

  // Date navigation functions
  const handlePreviousPeriod = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "month":
      default:
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "month":
      default:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig(status);
    const statusName = getStatusName(status);
    const statusColor = getStatusColorClass(status);
    const Icon = getStatusIcon(status);

    return (
      <Badge className={statusColor}>
        {isRTL ? (
          <>
            {statusName}
            {Icon}
          </>
        ) : (
          <>
            {Icon}
            {statusName}
          </>
        )}
      </Badge>
    );
  };

  // Deprecated: Use getStatusColorClass instead - keeping for backward compatibility
  const getEventTypeColor = (type: string) => {
    const colors = {
      appointment: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
      surgery: "bg-red-100 text-red-800",
      consultation: "bg-purple-100 text-purple-800",
      emergency: "bg-red-100 text-red-800",
      meeting: "bg-muted text-muted-foreground",
    };
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const formatTimeDisplay = (date: Date) => {
    return formatTimeUtil(date);
  };

  const formatDateDisplay = (date: Date) => {
    return formatDateShort(date);
  };

  const formatHeaderDate = (date: Date, mode: "month" | "week" | "day") => {
    // Use English locale for numbers while keeping Arabic/English text based on currentLocale
    const numericLocale = "en-US";
    const textLocale = currentLocale;
    
    switch (mode) {
      case "day":
        return date.toLocaleDateString(textLocale, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          numberingSystem: "latn", // Use Latin numerals
        }).replace(/\d+/g, (match) => {
          // Convert Arabic-Indic numerals to Western numerals if needed
          const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
          const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
          return match.split("").map(char => {
            const index = arabicNumerals.indexOf(char);
            return index !== -1 ? westernNumerals[index] : char;
          }).join("");
        });
      case "week":
        const { startDate, endDate } = getDateRange(date, mode);
        if (startDate.getMonth() === endDate.getMonth()) {
          const start = startDate.toLocaleDateString(textLocale, {
            month: "long",
            day: "numeric",
            numberingSystem: "latn",
          }).replace(/\d+/g, (match) => {
            const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
            const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
            return match.split("").map(char => {
              const index = arabicNumerals.indexOf(char);
              return index !== -1 ? westernNumerals[index] : char;
            }).join("");
          });
          const end = endDate.toLocaleDateString(textLocale, {
            day: "numeric",
            year: "numeric",
            numberingSystem: "latn",
          }).replace(/\d+/g, (match) => {
            const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
            const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
            return match.split("").map(char => {
              const index = arabicNumerals.indexOf(char);
              return index !== -1 ? westernNumerals[index] : char;
            }).join("");
          });
          return `${start} - ${end}`;
        } else {
          const start = startDate.toLocaleDateString(textLocale, {
            month: "short",
            day: "numeric",
            numberingSystem: "latn",
          }).replace(/\d+/g, (match) => {
            const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
            const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
            return match.split("").map(char => {
              const index = arabicNumerals.indexOf(char);
              return index !== -1 ? westernNumerals[index] : char;
            }).join("");
          });
          const end = endDate.toLocaleDateString(textLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
            numberingSystem: "latn",
          }).replace(/\d+/g, (match) => {
            const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
            const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
            return match.split("").map(char => {
              const index = arabicNumerals.indexOf(char);
              return index !== -1 ? westernNumerals[index] : char;
            }).join("");
          });
          return `${start} - ${end}`;
        }
      case "month":
      default:
        return date.toLocaleDateString(textLocale, {
          month: "long",
          year: "numeric",
          numberingSystem: "latn",
        }).replace(/\d+/g, (match) => {
          const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
          const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
          return match.split("").map(char => {
            const index = arabicNumerals.indexOf(char);
            return index !== -1 ? westernNumerals[index] : char;
          }).join("");
        });
    }
  };

  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toDateString();
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === dateStr;
    });
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Helper function to get all days in month view
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add previous month's days to fill the week
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Add next month's days to fill the week (42 days total = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  // Helper function to get all days in week view
  const getDaysInWeek = (date: Date): Date[] => {
    const { startDate } = getDateRange(date, "week");
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Helper function to get hour slots for day view
  const getHourSlots = (): Date[] => {
    const slots: Date[] = [];
    const date = new Date(currentDate);
    for (let hour = 0; hour < 24; hour++) {
      const slot = new Date(date);
      slot.setHours(hour, 0, 0, 0);
      slots.push(slot);
    }
    return slots;
  };

  // Client-side filtering (search and status - already filtered by date from API)
  const filteredEvents = events.filter((event) => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.patientName && event.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.notes && event.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply status filter (note: API already filters by status, but we apply it again for consistency)
    const matchesStatus = selectedStatus === "all" || 
      event.status === selectedStatus ||
      (selectedStatus === "scheduled" && (event.status === "scheduled" || event.status === "confirmed"));

    return matchesSearch && matchesStatus;
  });

  // Handle clinic loading state
  if (clinicLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">{t('Loading clinic context...')}</span>
      </div>
    );
  }

  // Handle no clinic selected state
  if (!currentClinic && !clinicLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('No Clinic Selected')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('Please select a clinic to view and manage appointments.')}
          </p>
          {clinicError && (
            <p className="text-red-600 text-sm">
              {t('Error:')} {clinicError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground">
            {t('Appointments Calendar')}
          </h1>
          <p className="text-xs xs:text-sm sm:text-base text-muted-foreground mt-1">
            {t('View and manage all clinic appointments in a calendar view')}
          </p>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <NewAppointmentModal />
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className={cn("p-3 xs:p-4 sm:p-6 py-4", isRTL && "text-right")}>
          <div className={cn("flex flex-col gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className={cn(
                "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
                isRTL ? "right-3" : "left-3"
              )} />
              <Input
                placeholder={t("Search appointments by patient or doctor...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("w-full h-10", isRTL ? "pr-10" : "pl-10")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Filter Controls */}
            <div className={cn("flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4", isRTL && "flex-row-reverse")}>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full xs:w-40">
                  <SelectValue placeholder={t("All Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Status")}</SelectItem>
                  {statusesLoading ? (
                    <SelectItem value="loading" disabled>{t("Loading...")}</SelectItem>
                  ) : (
                    statuses.filter(s => s.is_active).map((status) => (
                      <SelectItem key={status.code} value={status.code}>
                        {getStatusName(status.code)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Select value={selectedDateFilter} onValueChange={(value) => {
                setSelectedDateFilter(value);
                // If switching to custom-date and no date is selected, set today as default
                if (value === "custom-date" && !selectedDatefilter) {
                  const today = new Date();
                  const todayString = today.toISOString().split("T")[0];
                  setSelectedDatefilter(todayString);
                  // Switch to day view and update currentDate immediately
                  setViewMode("day");
                  setCurrentDate(new Date(todayString));
                }
              }}>
                <SelectTrigger className="w-full xs:w-48">
                  <SelectValue placeholder={t("All Dates")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t("Today")}</SelectItem>
                  <SelectItem value="tomorrow">{t("Tomorrow")}</SelectItem>
                  <SelectItem value="this-week">{t("This Week")}</SelectItem>
                  <SelectItem value="next-week">{t("Next Week")}</SelectItem>
                  <SelectItem value="custom-date">{t("Custom Date")}</SelectItem>
                  <SelectItem value="all">{t("All Dates")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Show date picker only when custom-date is selected */}
              {selectedDateFilter === "custom-date" && (
                <Input
                  id="date"
                  type="date"
                  value={selectedDatefilter || ""}
                  onChange={(e) => {
                    const selectedDateValue = e.target.value;
                    setSelectedDatefilter(selectedDateValue);
                    // Immediately switch to day view and update currentDate when date is selected
                    if (selectedDateValue) {
                      const selectedDate = new Date(selectedDateValue);
                      selectedDate.setHours(0, 0, 0, 0);
                      setViewMode("day");
                      setCurrentDate(selectedDate);
                    }
                  }}
                  required
                  className={cn("w-full xs:w-40 h-9 sm:h-10", isRTL && "pr-3")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {t("Today's Appointments")}
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    {appointmentsLoading ? "..." : todayStats.today}
                  </p>
                </div>
                <CalendarIcon className="h-6 w-6 xs:h-8 xs:w-8 text-primary flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {t("Completed")}
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    {appointmentsLoading ? "..." : todayStats.completed}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 xs:h-8 xs:w-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {t("Pending")}
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    {appointmentsLoading ? "..." : todayStats.scheduled}
                  </p>
                </div>
                <Clock className="h-6 w-6 xs:h-8 xs:w-8 text-orange-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {t("Cancelled")}
                  </p>
                  <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    {appointmentsLoading ? "..." : todayStats.cancelled}
                  </p>
                </div>
                <XCircle className="h-6 w-6 xs:h-8 xs:w-8 text-red-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Date Navigation */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousPeriod}
                disabled={loading || appointmentsLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-0 text-center">
                {formatHeaderDate(currentDate, viewMode)}
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPeriod}
                disabled={loading || appointmentsLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode and Actions */}
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                disabled={loading || appointmentsLoading}
              >
                {t('Month')}
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                disabled={loading || appointmentsLoading}
              >
                {t('Week')}
              </Button>
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
                disabled={loading || appointmentsLoading}
              >
                {t('Day')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || appointmentsLoading}
                className={cn(isRTL && "flex-row-reverse")}
              >
                {loading || appointmentsLoading ? (
                  <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                ) : (
                  <RefreshCw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                )}
                {loading || appointmentsLoading ? t("Loading...") : t("Refresh")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardContent className="p-3 xs:p-4 sm:p-6">
          <div className={cn("flex flex-wrap items-center gap-4", isRTL && "flex-row-reverse justify-end")}>
            <div className={cn("flex flex-wrap items-center gap-3", isRTL && "flex-row-reverse")}>
              {/* Completed */}
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className="w-4 h-4 rounded-full bg-green-100 border border-green-200" style={{ backgroundColor: "#10b981" }}></div>
                <span className="text-sm text-muted-foreground">{t("Completed")}</span>
              </div>
              {/* Scheduled */}
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-200" style={{ backgroundColor: "#3b82f6" }}></div>
                <span className="text-sm text-muted-foreground">{t("Scheduled")}</span>
              </div>
              {/* Cancelled */}
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className="w-4 h-4 rounded-full bg-red-100 border border-red-200" style={{ backgroundColor: "#ef4444" }}></div>
                <span className="text-sm text-muted-foreground">{t("Cancelled")}</span>
              </div>
              {/* No Show */}
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div className="w-4 h-4 rounded-full bg-orange-100 border border-orange-200" style={{ backgroundColor: "#f59e0b" }}></div>
                <span className="text-sm text-muted-foreground">{t("No Show")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid View (Desktop - Large Screens) */}
      {!loading && !appointmentsLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden lg:block"
        >
          <Card>
            <CardContent className="p-0">
              {viewMode === "month" && (
                <div className="border rounded-lg overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
                  {/* Month Header - Days of Week */}
                  <div className="grid grid-cols-7 border-b bg-muted/50">
                    {(isRTL 
                      ? ["السبت", "الجمعة", "الخميس", "الأربعاء", "الثلاثاء", "الاثنين", "الأحد"]
                      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                    ).map((day, index) => (
                      <div
                        key={day}
                        className={cn(
                          "p-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0",
                          isRTL && "text-right"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Month Grid */}
                  <div className="grid grid-cols-7 divide-x divide-y">
                    {getDaysInMonth(currentDate).map((day, index) => {
                        const dayEvents = getEventsForDate(day);
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = isSameDay(day, new Date());
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                          <div
                            key={index}
                            className={cn(
                              "min-h-[120px] p-2 hover:bg-muted/50 transition-colors cursor-pointer",
                              !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                              isToday && "bg-primary/10 border-2 border-primary",
                              isSelected && "bg-primary/20"
                            )}
                            onClick={() => setSelectedDate(day)}
                          >
                            <div className={cn(
                              "text-sm font-medium mb-1",
                              isToday && "text-primary font-bold",
                              isRTL && "text-right"
                            )}>
                              {day.getDate().toLocaleString("en-US")}
                            </div>
                            <div className={cn("space-y-1", isRTL && "text-right")}>
                              {dayEvents.slice(0, 3).map((event) => {
                                // Find the appointment in processedAppointments
                                const appointment = processedAppointments.find(apt => apt.id === event.id);
                                return (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 border",
                                      getStatusColorClass(event.status)
                                    )}
                                    style={{ 
                                      borderLeftColor: event.color, 
                                      borderLeftWidth: "3px",
                                      backgroundColor: `${event.color}15`,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (appointment) {
                                        handleViewDetails(appointment);
                                      } else {
                                        handleViewAppointment(event.id);
                                      }
                                    }}
                                    title={event.title}
                                  >
                                    <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{formatTimeDisplay(event.startTime)}</span>
                                    </div>
                                    <div className="truncate font-medium">{event.title}</div>
                                  </div>
                                );
                              })}
                              {dayEvents.length > 3 && (
                                <div className={cn("text-xs text-muted-foreground font-medium", isRTL && "text-right")}>
                                  +{dayEvents.length - 3} {t("more")}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "week" && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Week Header - Days */}
                  <div className="grid grid-cols-8 border-b bg-muted/50">
                    <div className={cn("p-3 text-center text-sm font-semibold text-muted-foreground border-r", isRTL && "text-right")}>
                      {t("Time")}
                    </div>
                    {getDaysInWeek(currentDate).map((day, index) => {
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={index}
                          className={cn(
                            "p-3 text-center text-sm font-semibold border-r last:border-r-0",
                            isToday && "bg-primary/10 text-primary",
                            isRTL && "text-right"
                          )}
                        >
                          <div>{day.toLocaleDateString(currentLocale, { weekday: "short" })}</div>
                          <div className={cn("text-xs mt-1", isToday && "font-bold")}>
                            {day.getDate().toLocaleString("en-US")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Week Grid - Hours */}
                  <div className="max-h-[600px] overflow-y-auto">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="grid grid-cols-8 divide-x border-b">
                        <div className={cn("p-2 text-xs text-muted-foreground border-r", isRTL && "text-right")}>
                          {hour.toLocaleString("en-US", { minimumIntegerDigits: 2 })}:00
                        </div>
                        {getDaysInWeek(currentDate).map((day, dayIndex) => {
                          const hourStart = new Date(day);
                          hourStart.setHours(hour, 0, 0, 0);
                          const hourEnd = new Date(day);
                          hourEnd.setHours(hour + 1, 0, 0, 0);
                          
                          const hourEvents = filteredEvents.filter((event) => {
                            const eventStart = new Date(event.startTime);
                            return eventStart >= hourStart && eventStart < hourEnd;
                          });

                          return (
                            <div
                              key={dayIndex}
                              className="min-h-[60px] p-1 space-y-1"
                              onClick={() => setSelectedDate(day)}
                            >
                              {hourEvents.map((event) => {
                                // Find the appointment in processedAppointments
                                const appointment = processedAppointments.find(apt => apt.id === event.id);
                                return (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate border",
                                      getStatusColorClass(event.status)
                                    )}
                                    style={{ 
                                      borderLeftColor: event.color, 
                                      borderLeftWidth: "3px",
                                      backgroundColor: `${event.color}15`,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (appointment) {
                                        handleViewDetails(appointment);
                                      } else {
                                        handleViewAppointment(event.id);
                                      }
                                    }}
                                    title={event.title}
                                  >
                                    <div className="truncate font-medium">{event.title}</div>
                                    <div className="truncate text-[10px]">{formatTimeDisplay(event.startTime)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === "day" && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Day Header */}
                  <div className="border-b bg-muted/50 p-4">
                    <div className={cn("text-lg font-semibold", isRTL && "text-right")}>
                      {currentDate.toLocaleDateString(currentLocale, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        numberingSystem: "latn",
                      }).replace(/\d+/g, (match) => {
                        const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
                        const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                        return match.split("").map(char => {
                          const index = arabicNumerals.indexOf(char);
                          return index !== -1 ? westernNumerals[index] : char;
                        }).join("");
                      })}
                    </div>
                  </div>
                  {/* Day Grid - Hours */}
                  <div className="max-h-[700px] overflow-y-auto">
                    {getHourSlots().map((hourSlot, index) => {
                      const hourStart = new Date(hourSlot);
                      const hourEnd = new Date(hourSlot);
                      hourEnd.setHours(hourSlot.getHours() + 1, 0, 0, 0);
                      
                      const hourEvents = filteredEvents.filter((event) => {
                        const eventStart = new Date(event.startTime);
                        return eventStart >= hourStart && eventStart < hourEnd;
                      });

                      return (
                        <div key={index} className="grid grid-cols-12 divide-x border-b">
                          <div className={cn("p-3 text-sm font-medium border-r", isRTL && "text-right")}>
                            {hourSlot.toLocaleTimeString(currentLocale, {
                              hour: "2-digit",
                              minute: "2-digit",
                              numberingSystem: "latn",
                            }).replace(/\d+/g, (match) => {
                              const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
                              const westernNumerals = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                              return match.split("").map(char => {
                                const index = arabicNumerals.indexOf(char);
                                return index !== -1 ? westernNumerals[index] : char;
                              }).join("");
                            })}
                          </div>
                          <div className="col-span-11 p-3 space-y-2">
                            {hourEvents.length === 0 ? (
                              <div className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
                                {t("No events")}
                              </div>
                            ) : (
                              hourEvents.map((event) => {
                                // Find the appointment in processedAppointments
                                const appointment = processedAppointments.find(apt => apt.id === event.id);
                                return (
                                  <div
                                    key={event.id}
                                    className={cn(
                                      "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                                      getStatusColorClass(event.status),
                                      "border-l-4"
                                    )}
                                    style={{ 
                                      borderLeftColor: event.color,
                                      backgroundColor: `${event.color}15`,
                                    }}
                                    onClick={() => {
                                      if (appointment) {
                                        handleViewDetails(appointment);
                                      } else {
                                        handleViewAppointment(event.id);
                                      }
                                    }}
                                  >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold">{event.title}</div>
                                    {getStatusBadge(event.status)}
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      {formatTimeDisplay(event.startTime)} - {formatTimeDisplay(event.endTime)}
                                    </div>
                                    {event.doctorName && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {event.doctorName}
                                      </div>
                                    )}
                                    {event.patientName && (
                                      <div className="font-medium">
                                        {t("Patient:")} {event.patientName}
                                      </div>
                                    )}
                                    {event.room && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {event.room}
                                      </div>
                                    )}
                                  </div>
                                    {event.notes && (
                                      <div className="mt-2 text-sm text-muted-foreground">
                                        {event.notes}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Events List (Mobile - Small Screens) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="lg:hidden"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === "day" ? t("Today's Events") : 
               viewMode === "week" ? t("This Week's Events") : 
               t("Upcoming Events")}
            </CardTitle>
            <CardDescription>
              {viewMode === "day" 
                ? `${t('Events for')} ${formatDateDisplay(currentDate)}`
                : viewMode === "week"
                ? t("All appointments and events for this week")
                : t("All scheduled appointments, consultations, and events")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {(loading || appointmentsLoading) && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  {loading ? t("Loading appointments...") : t("Applying filters...")}
                </span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && !appointmentsLoading && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('Error Loading Appointments')}
                </h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {t('Try Again')}
                </Button>
              </div>
            )}

            {/* Mobile Card View */}
            {!loading && !appointmentsLoading && !error && (
              <div className="lg:hidden space-y-4">
                {filteredEvents.map((event) => {
                  // Find the appointment in processedAppointments
                  const appointment = processedAppointments.find(apt => apt.id === event.id);
                  return (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 space-y-3 bg-card shadow-sm"
                      style={{
                        borderLeftColor: event.color,
                        borderLeftWidth: "4px",
                      }}
                    >
                    {/* Header with Event Title and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-semibold text-lg">
                            {event.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateDisplay(event.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getStatusColorClass(event.status)}>
                          {t(event.status.charAt(0).toUpperCase() + event.status.slice(1).replace("-", " "))}
                        </Badge>
                      </div>
                    </div>

                    {/* Time and Location */}
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-foreground">
                          {formatTimeDisplay(event.startTime)} -{" "}
                          {formatTimeDisplay(event.endTime)}
                        </span>
                      </div>
                      {event.room && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-foreground">{event.room}</span>
                        </div>
                      )}
                    </div>

                    {/* People Involved */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          {t('Doctor')}
                        </div>
                        <div className="text-sm font-medium">
                          {event.doctorName}
                        </div>
                      </div>
                      {event.patientName && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            {t('Patient')}
                          </div>
                          <div className="text-sm font-medium">
                            {event.patientName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {event.notes && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          {t('Notes')}
                        </div>
                        <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                          {event.notes}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {t('Event ID:')} #{event.id}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4 mr-1" />
                            {t('Actions')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (appointment) {
                                handleViewDetails(appointment);
                              } else {
                                handleViewAppointment(event.id);
                              }
                            }}
                            className={cn(isRTL && "flex-row-reverse")}
                          >
                            <Eye className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t('View Details')}
                          </DropdownMenuItem>
                          {appointment && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleEditAppointment(appointment)} 
                                className={cn(isRTL && "flex-row-reverse")}
                              >
                                <Edit className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                {t('Edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadSlip(appointment)}
                                className={cn(isRTL && "flex-row-reverse")}
                              >
                                <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                {t('Download Slip')}
                              </DropdownMenuItem>
                              {appointment.status !== "completed" && (
                                <DropdownMenuItem 
                                  onClick={() => handleMarkComplete(appointment)}
                                  className={cn(isRTL && "flex-row-reverse")}
                                >
                                  <CheckCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                  {t('Mark Complete')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className={cn("text-red-600", isRTL && "flex-row-reverse")}
                                onClick={() => handleCancelAppointment(appointment)}
                                disabled={appointment.status === "cancelled" || appointment.status === "completed"}
                              >
                                <XCircle className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                {t('Cancel')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* No Events State */}
            {!loading && !appointmentsLoading && !error && filteredEvents.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {t('No events found')}
                </h3>
                <p className="text-muted-foreground">
                  {t('Try adjusting your search criteria or add a new event.')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* View Details Modal */}
      <AppointmentDetailModal
        open={viewDetailsModal.open}
        onOpenChange={(open) => setViewDetailsModal({ open, appointment: null })}
        appointment={viewDetailsModal.appointment}
        onEdit={handleEditAppointment}
        onMarkComplete={handleMarkComplete}
        onDownloadSlip={handleDownloadSlip}
        isLoading={updateAppointmentMutation.isPending}
      />
    </div>
  );
};

export default AppointmentsCalendar;
