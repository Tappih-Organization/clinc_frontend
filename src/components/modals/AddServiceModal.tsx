import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus,
  Stethoscope,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { serviceApi, CreateServiceRequest } from "@/services/api/serviceApi";
import { Service } from "@/types";

interface AddServiceModalProps {
  onServiceCreated?: (service?: Service) => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ onServiceCreated }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [serviceData, setServiceData] = useState({
    name: "",
    category: "",
    department: "",
    description: "",
    duration: "",
    price: "",
    maxBookingsPerDay: "",
    prerequisites: "",
    specialInstructions: "",
    followUpRequired: false,
    isActive: true,
  });

  // Predefined options - using English keys for storage, translated for display
  const categoryOptions = [
    { value: "Consultation", label: t("Consultation") },
    { value: "Specialist Consultation", label: t("Specialist Consultation") },
    { value: "Diagnostic", label: t("Diagnostic") },
    { value: "Treatment", label: t("Treatment") },
    { value: "Imaging", label: t("Imaging") },
    { value: "Preventive", label: t("Preventive") },
    { value: "Emergency", label: t("Emergency") },
    { value: "Surgery", label: t("Surgery") },
    { value: "Therapy", label: t("Therapy") },
  ];

  const departmentOptions = [
    { value: "General Medicine", label: t("General Medicine") },
    { value: "Cardiology", label: t("Cardiology") },
    { value: "Neurology", label: t("Neurology") },
    { value: "Orthopedics", label: t("Orthopedics") },
    { value: "Pediatrics", label: t("Pediatrics") },
    { value: "Gynecology", label: t("Gynecology") },
    { value: "Dermatology", label: t("Dermatology") },
    { value: "Ophthalmology", label: t("Ophthalmology") },
    { value: "ENT", label: t("ENT") },
    { value: "Psychiatry", label: t("Psychiatry") },
    { value: "Radiology", label: t("Radiology") },
    { value: "Laboratory", label: t("Laboratory") },
    { value: "Physiotherapy", label: t("Physiotherapy") },
    { value: "Dentistry", label: t("Dentistry") },
    { value: "Emergency", label: t("Emergency") },
  ];

  const handleInputChange = (field: string, value: any) => {
    setServiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateServiceCode = () => {
    const categoryCode = serviceData.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `SVC${categoryCode}${timestamp}`;
  };

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(serviceData.price) || 0;
    // Add any additional calculations here if needed
    return basePrice;
  };

  const resetForm = () => {
    setServiceData({
      name: "",
      category: "",
      department: "",
      description: "",
      duration: "",
      price: "",
      maxBookingsPerDay: "",
      prerequisites: "",
      specialInstructions: "",
      followUpRequired: false,
      isActive: true,
    });
    setErrors({});
    setActiveTab("basic");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!serviceData.name.trim()) {
      newErrors.name = t("Service name is required");
    }

    if (!serviceData.category) {
      newErrors.category = t("Category is required");
    }

    if (!serviceData.department) {
      newErrors.department = t("Department is required");
    }

    if (!serviceData.description.trim()) {
      newErrors.description = t("Description is required");
    }

    if (!serviceData.duration.trim()) {
      newErrors.duration = t("Duration is required");
    } else {
      const duration = parseInt(serviceData.duration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.duration = t("Duration must be greater than 0");
      }
    }

    if (!serviceData.price.trim()) {
      newErrors.price = t("Price is required");
    } else {
      const price = parseFloat(serviceData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = t("Price must be greater than 0");
      }
    }

    if (!serviceData.maxBookingsPerDay.trim()) {
      newErrors.maxBookingsPerDay = t("Max bookings per day is required");
    } else {
      const maxBookings = parseInt(serviceData.maxBookingsPerDay);
      if (isNaN(maxBookings) || maxBookings <= 0) {
        newErrors.maxBookingsPerDay = t("Max bookings per day must be greater than 0");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Prepare the request data
      const requestData: CreateServiceRequest = {
        name: serviceData.name,
        category: serviceData.category,
        department: serviceData.department,
        description: serviceData.description,
        duration: parseInt(serviceData.duration),
        price: parseFloat(serviceData.price),
        maxBookingsPerDay: parseInt(serviceData.maxBookingsPerDay),
        prerequisites: serviceData.prerequisites || undefined,
        specialInstructions: serviceData.specialInstructions || undefined,
        followUpRequired: serviceData.followUpRequired,
        isActive: serviceData.isActive,
      };

      // Call the API to create the service
      const createdService = await serviceApi.createService(requestData);

      toast({
        title: t("Service Created"),
        description: `${createdService.name} ${t("has been created successfully.")}`,
      });

      setErrors({});
      setOpen(false);
      resetForm();

      // Notify parent component with the created service data
      if (onServiceCreated) {
        onServiceCreated(createdService);
      }
    } catch (error: any) {
      console.error("Error creating service:", error);

      // Handle server-side validation errors
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors: Record<string, string> = {};

        error.response.data.errors.forEach((err: any) => {
          const fieldName = err.path || err.param;
          if (fieldName) {
            validationErrors[fieldName] = err.msg || t("Invalid value");
          }
        });

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      toast({
        title: "Error",
        description: error?.response?.data?.message || (error instanceof Error ? error.message : "Failed to create service. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: string) => {
    const mins = parseInt(minutes) || 0;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
          {t("Add Service")}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn("sm:max-w-[800px] max-h-[90vh] overflow-y-auto")}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center", isRTL ? "flex-row-reverse" : "space-x-2")}>
            <Stethoscope className="h-5 w-5" />
            <span>{t("Add New Service")}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={isRTL ? "rtl" : "ltr"}>
          <TabsList className={cn("grid w-full grid-cols-4")}>
            <TabsTrigger value="basic">{t("Basic Info")}</TabsTrigger>
            <TabsTrigger value="pricing">{t("Pricing")}</TabsTrigger>
            <TabsTrigger value="scheduling">{t("Scheduling")}</TabsTrigger>
            <TabsTrigger value="instructions">{t("Instructions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={cn(isRTL && "text-right")}>{t("Service Name *")}</Label>
                <Input
                  id="name"
                  value={serviceData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("Enter service name")}
                  className={cn(errors.name ? "border-red-500" : "", isRTL && "text-right")}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {errors.name && (
                  <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className={cn(isRTL && "text-right")}>{t("Category")}*</Label>
                <Select
                  value={serviceData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger className={cn(errors.category ? "border-red-500" : "", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                    <SelectValue placeholder={t("Select category")} />
                  </SelectTrigger>
                  <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value} className={cn(isRTL && "text-right")}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.category}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className={cn(isRTL && "text-right")}>{t("Department")}*</Label>
              <Select
                value={serviceData.department}
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger className={cn(errors.department ? "border-red-500" : "", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                  <SelectValue placeholder={t("Select department")} />
                </SelectTrigger>
                <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department.value} value={department.value} className={cn(isRTL && "text-right")}>
                      {department.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={cn(isRTL && "text-right")}>{t("Description *")}</Label>
              <Textarea
                id="description"
                value={serviceData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder={t("Enter service description")}
                rows={3}
                className={cn(errors.description ? "border-red-500" : "", isRTL && "text-right")}
                dir={isRTL ? "rtl" : "ltr"}
              />
              {errors.description && (
                <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.description}</p>
              )}
            </div>

            <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
              <Switch
                id="isActive"
                checked={serviceData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive" className={cn(isRTL && "text-right")}>{t("Active Service")}</Label>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className={cn(isRTL && "text-right")}>{t("Duration (minutes) *")}</Label>
                <div className="relative">
                  <Clock className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
                  <Input
                    id="duration"
                    type="number"
                    value={serviceData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    placeholder={t("Enter duration in minutes")}
                    className={cn(isRTL ? "pr-10 text-right" : "pl-10", errors.duration && "border-red-500")}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                {errors.duration && (
                  <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.duration}</p>
                )}
                {serviceData.duration && !errors.duration && (
                  <p className={cn("text-sm text-gray-500", isRTL && "text-right")}>
                    {t("Duration:")} {formatDuration(serviceData.duration)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className={cn(isRTL && "text-right")}>{t("Price (USD) *")}</Label>
                <div className="relative">
                  <DollarSign className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={serviceData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder={t("Enter price")}
                    className={cn(isRTL ? "pr-10 text-right" : "pl-10", errors.price && "border-red-500")}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                {errors.price && (
                  <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.price}</p>
                )}
              </div>
            </div>

            {serviceData.price && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Service Price:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(serviceData.price)}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxBookingsPerDay" className={cn(isRTL && "text-right")}>
                {t("Maximum Bookings Per Day *")}
              </Label>
              <div className="relative">
                <Users className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
                <Input
                  id="maxBookingsPerDay"
                  type="number"
                  value={serviceData.maxBookingsPerDay}
                  onChange={(e) =>
                    handleInputChange("maxBookingsPerDay", e.target.value)
                  }
                  placeholder={t("Enter maximum bookings per day")}
                  className={cn(isRTL ? "pr-10 text-right" : "pl-10", errors.maxBookingsPerDay && "border-red-500")}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              {errors.maxBookingsPerDay && (
                <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.maxBookingsPerDay}</p>
              )}
              {!errors.maxBookingsPerDay && (
                <p className={cn("text-sm text-gray-500",)} dir={isRTL ? "rtl" : "ltr"}>
                  {t("Maximum number of appointments that can be scheduled for this service per day")}
                </p>
              )}
            </div>

            <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
              <Switch
                id="followUpRequired"
                checked={serviceData.followUpRequired}
                onCheckedChange={(checked) =>
                  handleInputChange("followUpRequired", checked)
                }
              />
              <Label htmlFor="followUpRequired" className={cn(isRTL && "text-right")}>{t("Follow-up Required")}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites" className={cn(isRTL && "text-right")}>{t("Prerequisites")}</Label>
              <Textarea
                id="prerequisites"
                value={serviceData.prerequisites}
                onChange={(e) =>
                  handleInputChange("prerequisites", e.target.value)
                }
                placeholder={t("Enter any prerequisites for this service (e.g., doctor's referral, fasting)")}
                rows={2}
                className={cn(isRTL && "text-right")}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialInstructions" className={cn(isRTL && "text-right")}>{t("Special Instructions")}</Label>
              <Textarea
                id="specialInstructions"
                value={serviceData.specialInstructions}
                onChange={(e) =>
                  handleInputChange("specialInstructions", e.target.value)
                }
                placeholder={t("Enter special instructions for patients (e.g., what to bring, preparation needed)")}
                rows={4}
                className={cn(isRTL && "text-right")}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>

            <div className={cn("p-4 bg-yellow-50 rounded-lg",)}>
              <div className={cn("flex items-center mb-2", isRTL ? "flex-row-reverse" : "space-x-2")}>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {t("Service Summary")}
                </span>
              </div>
              <div className={cn("space-y-1 text-sm", )} >
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Name:")}</strong> {serviceData.name || t("Not specified")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Category:")}</strong>{" "}
                  {serviceData.category ? categoryOptions.find(c => c.value === serviceData.category)?.label || serviceData.category : t("Not specified")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Department:")}</strong>{" "}
                  {serviceData.department ? departmentOptions.find(d => d.value === serviceData.department)?.label || serviceData.department : t("Not specified")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Duration:")}</strong>{" "}
                  {serviceData.duration
                    ? formatDuration(serviceData.duration)
                    : t("Not specified")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Price:")}</strong>{" "}
                  {serviceData.price
                    ? formatCurrency(serviceData.price)
                    : t("Not specified")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Max Bookings/Day:")}</strong>{" "}
                  {serviceData.maxBookingsPerDay || t("Not specified")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Follow-up Required:")}</strong>{" "}
                  {serviceData.followUpRequired ? t("Yes") : t("No")}
                </p>
                <p dir={isRTL ? "rtl" : "ltr"}>
                  <strong>{t("Status:")}</strong>
                  <Badge
                    className={cn(
                      serviceData.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800",
                      isRTL ? "mr-1" : "ml-1"
                    )}
                  >
                    {serviceData.isActive ? t("Active") : t("Inactive")}
                  </Badge>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className={cn("flex justify-between pt-4", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
          <Button variant="outline" onClick={resetForm} disabled={isLoading}>
            {t("Reset Form")}
          </Button>
          <div className={cn("flex", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                  {t("Creating...")}
                </>
              ) : (
                t("Create Service")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
