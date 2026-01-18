import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  Calendar,
  Save,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { transformUserToStaff } from "@/hooks/useStaff";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface ManageScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: ReturnType<typeof transformUserToStaff> | null;
  onUpdate: (id: string, schedule: any) => Promise<void>;
}

const ManageScheduleModal: React.FC<ManageScheduleModalProps> = ({
  open,
  onOpenChange,
  staff,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<any>({});

  const daysOfWeek = [
    { key: "monday", label: t("Monday") },
    { key: "tuesday", label: t("Tuesday") },
    { key: "wednesday", label: t("Wednesday") },
    { key: "thursday", label: t("Thursday") },
    { key: "friday", label: t("Friday") },
    { key: "saturday", label: t("Saturday") },
    { key: "sunday", label: t("Sunday") },
  ];

  // Initialize schedule when staff changes
  useEffect(() => {
    if (staff) {
      setSchedule(staff.schedule);
    }
  }, [staff]);

  const handleWorkingDayChange = (day: string, isWorking: boolean) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isWorking,
        // Set default times when enabling a day
        start: isWorking ? (prev[day]?.start || "09:00") : prev[day]?.start,
        end: isWorking ? (prev[day]?.end || "17:00") : prev[day]?.end,
      },
    }));
  };

  const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const getWorkingDaysCount = () => {
    return Object.values(schedule).filter((day: any) => day?.isWorking).length;
  };

  const getTotalHours = () => {
    let totalMinutes = 0;
    Object.values(schedule).forEach((day: any) => {
      if (day?.isWorking && day.start && day.end) {
        const startMinutes = timeToMinutes(day.start);
        const endMinutes = timeToMinutes(day.end);
        if (endMinutes > startMinutes) {
          totalMinutes += endMinutes - startMinutes;
        }
      }
    });
    return (totalMinutes / 60).toFixed(1);
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateSchedule = () => {
    for (const [day, daySchedule] of Object.entries(schedule)) {
      const dayData = daySchedule as any;
      if (dayData.isWorking) {
        if (!dayData.start || !dayData.end) {
          toast({
            title: "Validation Error",
            description: `Please set both start and end times for ${day}`,
            variant: "destructive",
          });
          return false;
        }
        
        const startMinutes = timeToMinutes(dayData.start);
        const endMinutes = timeToMinutes(dayData.end);
        
        if (endMinutes <= startMinutes) {
          toast({
            title: "Validation Error",
            description: `End time must be after start time for ${day}`,
            variant: "destructive",
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staff || !validateSchedule()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the backend API to update the schedule
      await onUpdate(staff.id, schedule);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: t("Error"),
        description: t("Failed to update schedule. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setStandardSchedule = (type: 'fullTime' | 'partTime') => {
    const standardSchedules = {
      fullTime: {
        monday: { start: "09:00", end: "17:00", isWorking: true },
        tuesday: { start: "09:00", end: "17:00", isWorking: true },
        wednesday: { start: "09:00", end: "17:00", isWorking: true },
        thursday: { start: "09:00", end: "17:00", isWorking: true },
        friday: { start: "09:00", end: "17:00", isWorking: true },
        saturday: { start: "00:00", end: "00:00", isWorking: false },
        sunday: { start: "00:00", end: "00:00", isWorking: false },
      },
      partTime: {
        monday: { start: "09:00", end: "13:00", isWorking: true },
        tuesday: { start: "09:00", end: "13:00", isWorking: true },
        wednesday: { start: "09:00", end: "13:00", isWorking: true },
        thursday: { start: "00:00", end: "00:00", isWorking: false },
        friday: { start: "00:00", end: "00:00", isWorking: false },
        saturday: { start: "00:00", end: "00:00", isWorking: false },
        sunday: { start: "00:00", end: "00:00", isWorking: false },
      },
    };
    
    setSchedule(standardSchedules[type]);
  };

  if (!staff) return null;

  const staffName = staff ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim() : "";

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
            <Calendar
              className={cn(
                "h-6 w-6 text-blue-600 flex-shrink-0",
                isRTL ? "order-2" : ""
              )}
            />
            <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
              <DialogTitle
                className={cn(
                  "text-xl font-semibold",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
              >
                {t("Manage Work Schedule")}
              </DialogTitle>
              <DialogDescription
                className={cn(
                  "text-sm text-muted-foreground mt-1",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
              >
                {t("Set working hours for")} {staffName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Quick Schedule Templates */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Clock className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}>
                  {t("Quick Templates")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("flex gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStandardSchedule('fullTime')}
                  size="sm"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {t("Full Time (9-5, Mon-Fri)")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStandardSchedule('partTime')}
                  size="sm"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {t("Part Time (9-1, Mon-Wed)")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Overview */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Info className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}>
                  {t("Schedule Overview")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn(
                "grid grid-cols-2 md:grid-cols-3 gap-4 text-sm",
                isRTL && "text-right"
              )}>
                <div>
                  <span className={cn("text-gray-500", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    {t("Working Days")}:
                  </span>
                  <span className={cn("font-semibold", isRTL ? "mr-2" : "ml-2")} dir="ltr">
                    {getWorkingDaysCount()} {t("days/week")}
                  </span>
                </div>
                <div>
                  <span className={cn("text-gray-500", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    {t("Total Hours")}:
                  </span>
                  <span className={cn("font-semibold", isRTL ? "mr-2" : "ml-2")} dir="ltr">
                    {getTotalHours()} {t("hours/week")}
                  </span>
                </div>
                <div>
                  <span className={cn("text-gray-500", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    {t("Schedule Type")}:
                  </span>
                  <span className={cn("font-semibold", isRTL ? "mr-2" : "ml-2")} dir={isRTL ? "rtl" : "ltr"}>
                    {getWorkingDaysCount() >= 5 ? t("Full Time") : t("Part Time")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Clock className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}>
                  {t("Weekly Schedule")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent dir={isRTL ? "rtl" : "ltr"}>
              <div className="space-y-4">
                {daysOfWeek.map(({ key, label }) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center p-3 border rounded-lg",
                      isRTL ? "flex-row-reverse space-x-reverse" : "space-x-4"
                    )}
                  >
                    <div className={cn(
                      "flex items-center",
                      isRTL ? "flex-row-reverse space-x-reverse w-24" : "space-x-2 w-24"
                    )}>
                      <Checkbox
                        id={`working-${key}`}
                        checked={schedule[key]?.isWorking || false}
                        onCheckedChange={(checked) =>
                          handleWorkingDayChange(key, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`working-${key}`}
                        className="font-medium"
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {label}
                      </Label>
                    </div>

                    {schedule[key]?.isWorking ? (
                      <div className={cn(
                        "flex items-center flex-1",
                        isRTL ? "flex-row-reverse space-x-reverse" : "space-x-2"
                      )}>
                        <div className={cn(
                          "flex items-center",
                          isRTL ? "flex-row-reverse space-x-reverse" : "space-x-2"
                        )}>
                          <Label className={cn("text-sm", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                            {t("Start")}:
                          </Label>
                          <Input
                            type="time"
                            value={schedule[key]?.start || "09:00"}
                            onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                            className="w-24"
                            dir="ltr"
                          />
                        </div>
                        <div className={cn(
                          "flex items-center",
                          isRTL ? "flex-row-reverse space-x-reverse" : "space-x-2"
                        )}>
                          <Label className={cn("text-sm", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                            {t("End")}:
                          </Label>
                          <Input
                            type="time"
                            value={schedule[key]?.end || "17:00"}
                            onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                            className="w-24"
                            dir="ltr"
                          />
                        </div>
                        <div className={cn("text-sm text-gray-500", isRTL && "text-right")} dir="ltr">
                          ({schedule[key]?.start && schedule[key]?.end
                            ? Math.max(0, (timeToMinutes(schedule[key].end) - timeToMinutes(schedule[key].start)) / 60).toFixed(1)
                            : "0"} {t("hours")})
                        </div>
                      </div>
                    ) : (
                      <div className={cn("flex-1 text-gray-500 italic", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Off duty")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className={cn("flex justify-end pt-4 border-t gap-3", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Saving...")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("Save Schedule")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManageScheduleModal; 