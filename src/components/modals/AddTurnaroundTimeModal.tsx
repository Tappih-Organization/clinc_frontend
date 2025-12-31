import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Timer,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCreateTurnaroundTime } from "@/hooks/useApi";

interface AddTurnaroundTimeModalProps {
  trigger?: React.ReactNode;
}

const AddTurnaroundTimeModal: React.FC<AddTurnaroundTimeModalProps> = ({
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateTurnaroundTime();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    duration: "",
    durationMinutes: "",
    priority: "",
    category: "",
    description: "",
    examples: "",
    sla: "",
    reportingHours: "",
    criticalNotes: "",
    escalationProcedure: "",
    businessRules: "",
    isActive: true,
  });

  const priorities = [
    {
      value: "stat",
      label: "STAT (Emergency)",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "urgent",
      label: "Urgent",
      color: "bg-orange-100 text-orange-800",
    },
    { value: "routine", label: "Routine", color: "bg-blue-100 text-blue-800" },
    {
      value: "extended",
      label: "Extended",
      color: "bg-purple-100 text-purple-800",
    },
  ];
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const categories = [
    "Emergency",
    "Urgent",
    "Routine",
    "Standard",
    "Extended",
    "Specialized",
    "Batch",
    "Reference",
  ];

  const durationPresets = [
    { display: t("preset30Min"), minutes: 30 },
    { display: t("preset1Hour"), minutes: 60 },
    { display: t("preset1To2Hours"), minutes: 120 },
    { display: t("preset2To4Hours"), minutes: 240 },
    { display: t("preset4To6Hours"), minutes: 360 },
    { display: t("preset6To8Hours"), minutes: 480 },
    { display: t("preset8To12Hours"), minutes: 720 },
    { display: t("preset12To24Hours"), minutes: 1440 },
    { display: t("preset1To2Days"), minutes: 2880 },
    { display: t("preset2To3Days"), minutes: 4320 },
    { display: t("preset3To5Days"), minutes: 7200 },
    { display: t("preset1To2Weeks"), minutes: 20160 },
  ];

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDurationPreset = (preset: {
    display: string;
    minutes: number;
  }) => {
    handleChange("duration", preset.display);
    handleChange("durationMinutes", preset.minutes.toString());
  };

  const generateCode = () => {
    if (formData.name && formData.priority) {
      const nameCode = formData.name
        .split(" ")
        .map((word) => word.substring(0, 2))
        .join("")
        .toUpperCase();
      const priorityCode = formData.priority.substring(0, 2).toUpperCase();
      const randomNum = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");
      const generatedCode = `TAT-${priorityCode}${nameCode}${randomNum}`;
      handleChange("code", generatedCode);
    } else {
      toast({
        title: "Info",
        description: "Please enter name and select priority first",
        variant: "default",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "stat":
        return <Zap className="h-4 w-4 text-red-600" />;
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "routine":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "extended":
        return <Timer className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const validateForm = () => {
    const required = [
      "name",
      "code",
      "duration",
      "durationMinutes",
      "priority",
      "category",
      "description",
    ];
    const missing = required.filter(
      (field) => !formData[field as keyof typeof formData],
    );

    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    const minutes = parseInt(formData.durationMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast({
        title: "Validation Error",
        description: "Duration in minutes must be a positive number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for API
      const apiData = {
        name: formData.name,
        code: formData.code,
        duration: formData.duration,
        durationMinutes: parseInt(formData.durationMinutes),
        priority: formData.priority as "stat" | "urgent" | "routine" | "extended",
        category: formData.category,
        description: formData.description,
        examples: formData.examples.split(',').map(ex => ex.trim()).filter(ex => ex),
        isActive: formData.isActive,
      };

      await createMutation.mutateAsync(apiData);

      toast({
        title: "Success",
        description: `${formData.name} (${formData.code}) has been created successfully.`,
      });

      // Reset form
      setFormData({
        name: "",
        code: "",
        duration: "",
        durationMinutes: "",
        priority: "",
        category: "",
        description: "",
        examples: "",
        sla: "",
        reportingHours: "",
        criticalNotes: "",
        escalationProcedure: "",
        businessRules: "",
        isActive: true,
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create turnaround time. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Turnaround Time
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className= {cn("max-w-4xl max-h-[90vh] overflow-y-auto", isRTL && 'dir-rtl')} aria-describedby="add-turnaround-time-description">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center text-xl", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            {t("addTatCategoryTitle")}
          </DialogTitle>
          <DialogDescription className={cn(isRTL && 'text-right', isRTL && 'flex-row-reverse')} id="add-turnaround-time-description">
            {t("addTatCategoryDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
                <Timer className="h-4 w-4 mr-2" />
                {t("basicInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name"> {t("tatCategoryNameLabel")} </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder = {t("tatCategoryNamePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code"> {t("tatCategoryCodeLabel")} </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        handleChange("code", e.target.value.toUpperCase())
                      }
                      placeholder = {t("tatCategoryCodePlaceholder")}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCode}
                      className="whitespace-nowrap"
                    >
                        {t("generate")}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority"> {t("priorityLabel")} </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder= {t("priorityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center space-x-2">
                            {getPriorityIcon(priority.value)}
                            <span>{priority.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category"> {t("categoryLabel")} </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder= {t("categoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description"> {t("descriptionLabel")} </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder= {t("descriptionPlaceholder")}
                  rows={3}
                  required
                />
              </div>

              {formData.priority && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-blue-700">
                    {getPriorityIcon(formData.priority)}
                    <span className="font-medium ml-2">
                      Priority:{" "}
                      {
                        priorities.find((p) => p.value === formData.priority)
                          ?.label
                      }
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className= {cn("text-lg flex items-center", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
                <Clock className="h-4 w-4 mr-2" />
                {t("durationSettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration"> {t("durationDisplayLabel")} </Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleChange("duration", e.target.value)}
                    placeholder= {t("durationDisplayPlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes"> {t("durationMinutesLabel")}</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      handleChange("durationMinutes", e.target.value)
                    }
                    placeholder={t("durationMinutesPlaceholder")} 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("quickDurationPresets")} </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {durationPresets.map((preset) => (
                    <Button
                      key={preset.display}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDurationPreset(preset)}
                      className="text-xs"
                    >
                      {preset.display}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sla"> {t("slaCommitmentLabel")}</Label>
                  <Input
                    id="sla"
                    value={formData.sla}
                    onChange={(e) => handleChange("sla", e.target.value)}
                    placeholder={t("slaCommitmentPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportingHours"> {t("reportingHoursLabel")}</Label>
                  <Input
                    id="reportingHours"
                    value={formData.reportingHours}
                    onChange={(e) =>
                      handleChange("reportingHours", e.target.value)
                    }
                    placeholder={t("reportingHoursPlaceholder")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Examples & Applications */}
          <Card>
            <CardHeader>
              <CardTitle className= {cn("text-lg flex items-center", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("testExamplesAndApplications")}
              </CardTitle> 
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="examples"> {t("testExamplesLabel")}</Label>
                <Textarea
                  id="examples"
                  value={formData.examples}
                  onChange={(e) => handleChange("examples", e.target.value)}
                  placeholder={t("testExamplesPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessRules">{t("businessRulesLabel")}</Label>
                <Textarea
                  id="businessRules"
                  value={formData.businessRules}
                  onChange={(e) =>
                    handleChange("businessRules", e.target.value)
                  }
                  placeholder={t("businessRulesPlaceholder")}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Critical Handling */}
          <Card>
            <CardHeader>
              <CardTitle className= {cn("text-lg flex items-center", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t("criticalHandling")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="criticalNotes">{t("criticalNotesLabel")}</Label>
                <Textarea
                  id="criticalNotes"
                  value={formData.criticalNotes}
                  onChange={(e) =>
                    handleChange("criticalNotes", e.target.value)
                  }
                  placeholder={t("criticalNotesPlaceholder")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escalationProcedure">
                   {t("escalationProcedureLabel")}
                </Label>
                <Textarea
                  id="escalationProcedure"
                  value={formData.escalationProcedure}
                  onChange={(e) =>
                    handleChange("escalationProcedure", e.target.value)
                  }
                  placeholder={t("escalationProcedurePlaceholder")}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className= {cn("text-lg flex items-center", isRTL && 'text-right', isRTL && 'flex-row-reverse')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("Status")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className= {cn("flex items-center space-x-2", isRTL && 'flex-row-reverse')}>
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleChange("isActive", checked)
                  }
                />
                <Label htmlFor="isActive" className="text-sm">
                 {t("statusDescription")}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className= {cn("flex justify-end space-x-3 pt-4", isRTL && 'flex-row-reverse')}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                   <span className="flex items-center gap-2">
    {isRTL ? t("buttonscreateTurnaroundTime") : <Plus className="h-4 w-4" />}
    {!isRTL ? t("buttonscreateTurnaroundTime") : <Plus className="h-4 w-4" />}
  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTurnaroundTimeModal;
