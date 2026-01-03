import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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

interface AddServiceModalProps {
  onServiceCreated?: () => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({ onServiceCreated }) => {
  const { t } = useTranslation();
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

  // Predefined options
  const categories = [
    "Consultation",
    "Specialist Consultation",
    "Diagnostic",
    "Treatment",
    "Imaging",
    "Preventive",
    "Emergency",
    "Surgery",
    "Therapy",
  ];

  const departments = [
    "General Medicine",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Gynecology",
    "Dermatology",
    "Ophthalmology",
    "ENT",
    "Psychiatry",
    "Radiology",
    "Laboratory",
    "Physiotherapy",
    "Dentistry",
    "Emergency",
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
      newErrors.name = "Service name is required";
    }

    if (!serviceData.category) {
      newErrors.category = "Category is required";
    }

    if (!serviceData.department) {
      newErrors.department = "Department is required";
    }

    if (!serviceData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!serviceData.duration.trim()) {
      newErrors.duration = "Duration is required";
    } else {
      const duration = parseInt(serviceData.duration);
      if (isNaN(duration) || duration <= 0) {
        newErrors.duration = "Duration must be greater than 0";
      }
    }

    if (!serviceData.price.trim()) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(serviceData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = "Price must be greater than 0";
      }
    }

    if (!serviceData.maxBookingsPerDay.trim()) {
      newErrors.maxBookingsPerDay = "Max bookings per day is required";
    } else {
      const maxBookings = parseInt(serviceData.maxBookingsPerDay);
      if (isNaN(maxBookings) || maxBookings <= 0) {
        newErrors.maxBookingsPerDay = "Max bookings per day must be greater than 0";
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
        title: "Service Created",
        description: `${createdService.name} has been created successfully.`,
      });

      setErrors({});
      setOpen(false);
      resetForm();
      
      // Notify parent component to refresh data
      if (onServiceCreated) {
        onServiceCreated();
      }
    } catch (error: any) {
      console.error("Error creating service:", error);
      
      // Handle server-side validation errors
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors: Record<string, string> = {};
        
        error.response.data.errors.forEach((err: any) => {
          const fieldName = err.path || err.param;
          if (fieldName) {
            validationErrors[fieldName] = err.msg || "Invalid value";
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
          <Plus className="h-4 w-4 mr-2" />
          {t("Add Service")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5" />
            <span>Add New Service</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={serviceData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter service name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={serviceData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={serviceData.department}
                onValueChange={(value) =>
                  handleInputChange("department", value)
                }
              >
                <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-red-500">{errors.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={serviceData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter service description"
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={serviceData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive">Active Service</Label>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="duration"
                    type="number"
                    value={serviceData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    placeholder="Enter duration in minutes"
                    className={cn("pl-10", errors.duration && "border-red-500")}
                  />
                </div>
                {errors.duration && (
                  <p className="text-sm text-red-500">{errors.duration}</p>
                )}
                {serviceData.duration && !errors.duration && (
                  <p className="text-sm text-gray-500">
                    Duration: {formatDuration(serviceData.duration)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={serviceData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="Enter price"
                    className={cn("pl-10", errors.price && "border-red-500")}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
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
              <Label htmlFor="maxBookingsPerDay">
                Maximum Bookings Per Day *
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="maxBookingsPerDay"
                  type="number"
                  value={serviceData.maxBookingsPerDay}
                  onChange={(e) =>
                    handleInputChange("maxBookingsPerDay", e.target.value)
                  }
                  placeholder="Enter maximum bookings per day"
                  className={cn("pl-10", errors.maxBookingsPerDay && "border-red-500")}
                />
              </div>
              {errors.maxBookingsPerDay && (
                <p className="text-sm text-red-500">{errors.maxBookingsPerDay}</p>
              )}
              {!errors.maxBookingsPerDay && (
                <p className="text-sm text-gray-500">
                  Maximum number of appointments that can be scheduled for this
                  service per day
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="followUpRequired"
                checked={serviceData.followUpRequired}
                onCheckedChange={(checked) =>
                  handleInputChange("followUpRequired", checked)
                }
              />
              <Label htmlFor="followUpRequired">Follow-up Required</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Prerequisites</Label>
              <Textarea
                id="prerequisites"
                value={serviceData.prerequisites}
                onChange={(e) =>
                  handleInputChange("prerequisites", e.target.value)
                }
                placeholder="Enter any prerequisites for this service (e.g., doctor's referral, fasting)"
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                value={serviceData.specialInstructions}
                onChange={(e) =>
                  handleInputChange("specialInstructions", e.target.value)
                }
                placeholder="Enter special instructions for patients (e.g., what to bring, preparation needed)"
                rows={4}
              />
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  Service Summary
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {serviceData.name || "Not specified"}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {serviceData.category || "Not specified"}
                </p>
                <p>
                  <strong>Department:</strong>{" "}
                  {serviceData.department || "Not specified"}
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {serviceData.duration
                    ? formatDuration(serviceData.duration)
                    : "Not specified"}
                </p>
                <p>
                  <strong>Price:</strong>{" "}
                  {serviceData.price
                    ? formatCurrency(serviceData.price)
                    : "Not specified"}
                </p>
                <p>
                  <strong>Max Bookings/Day:</strong>{" "}
                  {serviceData.maxBookingsPerDay || "Not specified"}
                </p>
                <p>
                  <strong>Follow-up Required:</strong>{" "}
                  {serviceData.followUpRequired ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Status:</strong>
                  <Badge
                    className={
                      serviceData.isActive
                        ? "ml-1 bg-green-100 text-green-800"
                        : "ml-1 bg-gray-100 text-gray-800"
                    }
                  >
                    {serviceData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between space-x-2 pt-4">
          <Button variant="outline" onClick={resetForm} disabled={isLoading}>
            Reset Form
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
