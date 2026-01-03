import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";

interface WorkingHoursTabProps {
  data: any;
  onChange: (data: any) => void;
}

const DAYS = [
  { key: "monday", label: "Monday", labelAr: "الإثنين" },
  { key: "tuesday", label: "Tuesday", labelAr: "الثلاثاء" },
  { key: "wednesday", label: "Wednesday", labelAr: "الأربعاء" },
  { key: "thursday", label: "Thursday", labelAr: "الخميس" },
  { key: "friday", label: "Friday", labelAr: "الجمعة" },
  { key: "saturday", label: "Saturday", labelAr: "السبت" },
  { key: "sunday", label: "Sunday", labelAr: "الأحد" },
];

const WorkingHoursTab: React.FC<WorkingHoursTabProps> = ({ data, onChange }) => {
  const { t, i18n } = useTranslation();
  const [workingHours, setWorkingHours] = useState<any>({});

  useEffect(() => {
    if (data) {
      setWorkingHours(data);
    }
  }, [data]);

  const handleToggle = (day: string) => {
    const newData = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        isOpen: !workingHours[day]?.isOpen,
      },
    };
    setWorkingHours(newData);
    onChange(newData);
  };

  const handleTimeChange = (day: string, field: "start" | "end", value: string) => {
    const newData = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value,
      },
    };
    setWorkingHours(newData);
    onChange(newData);
  };

  const getDayLabel = (day: any) => {
    return i18n.language === 'ar' ? day.labelAr : t(day.label);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t("Working Hours")}
          </CardTitle>
          <CardDescription>
            {t("Set your clinic's operating hours for each day of the week")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayData = workingHours[day.key] || { isOpen: false, start: "09:00", end: "17:00" };
            
            return (
              <Card key={day.key} className={dayData.isOpen ? "border-primary/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Day Name and Toggle */}
                    <div className="flex items-center justify-between sm:w-48">
                      <Label className="text-base font-medium">
                        {getDayLabel(day)}
                      </Label>
                      <Switch
                        checked={dayData.isOpen}
                        onCheckedChange={() => handleToggle(day.key)}
                      />
                    </div>

                    {/* Time Inputs */}
                    {dayData.isOpen ? (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <Label htmlFor={`${day.key}-start`} className="text-sm whitespace-nowrap">
                            {t("From")}:
                          </Label>
                          <Input
                            id={`${day.key}-start`}
                            type="time"
                            value={dayData.start}
                            onChange={(e) => handleTimeChange(day.key, "start", e.target.value)}
                            className="w-full sm:w-auto"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Label htmlFor={`${day.key}-end`} className="text-sm whitespace-nowrap">
                            {t("To")}:
                          </Label>
                          <Input
                            id={`${day.key}-end`}
                            type="time"
                            value={dayData.end}
                            onChange={(e) => handleTimeChange(day.key, "end", e.target.value)}
                            className="w-full sm:w-auto"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground">
                          {t("Closed")}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("Summary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const dayData = workingHours[day.key] || { isOpen: false, start: "09:00", end: "17:00" };
              
              return (
                <div key={day.key} className="flex justify-between items-center text-sm">
                  <span className={dayData.isOpen ? "font-medium" : "text-muted-foreground"}>
                    {getDayLabel(day)}
                  </span>
                  <span className={dayData.isOpen ? "font-medium text-primary" : "text-muted-foreground"}>
                    {dayData.isOpen ? `${dayData.start} - ${dayData.end}` : t("Closed")}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingHoursTab;

