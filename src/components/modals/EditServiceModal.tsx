import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    Edit,
    Stethoscope,
    Clock,
    DollarSign,
    Users,
    AlertCircle,
    Loader2,
    Save,
    X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { serviceApi, CreateServiceRequest } from "@/services/api/serviceApi";
import { Service } from "@/types";

interface EditServiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    onServiceUpdated?: (service: Service) => void;
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({
    open,
    onOpenChange,
    service,
    onServiceUpdated
}) => {
    const { t } = useTranslation();
    const isRTL = useIsRTL();
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

    // Initialize form when service changes
    useEffect(() => {
        if (service && open) {
            setServiceData({
                name: service.name || "",
                category: service.category || "",
                department: service.department || "",
                description: service.description || "",
                duration: service.duration?.toString() || "",
                price: service.price?.toString() || "",
                maxBookingsPerDay: service.maxBookingsPerDay?.toString() || "",
                prerequisites: service.prerequisites || "",
                specialInstructions: service.specialInstructions || "",
                followUpRequired: service.followUpRequired || false,
                isActive: service.isActive ?? true,
            });
            setErrors({});
            setActiveTab("basic");
        }
    }, [service, open]);

    const handleInputChange = (field: string, value: any) => {
        setServiceData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
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
        if (!service || !validateForm()) return;

        setIsLoading(true);

        try {
            const requestData: Partial<CreateServiceRequest> = {
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

            const updatedService = await serviceApi.updateService(service.id, requestData);

            toast({
                title: t("Service Updated"),
                description: `${updatedService.name} ${t("has been updated successfully.")}`,
            });

            if (onServiceUpdated) {
                onServiceUpdated(updatedService);
            }
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating service:", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || t("Failed to update service. Please try again."),
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
        return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
    };

    const formatCurrency = (amount: string) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(num);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-[800px] max-h-[90vh] overflow-y-auto")}>
                <DialogHeader>
                    <DialogTitle className={cn("flex items-center", isRTL ? "flex-row-reverse" : "space-x-2")}>
                        <Edit className="h-5 w-5" />
                        <span>{t("Edit Service")}: {service?.name}</span>
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
                                <Label htmlFor="name" className={cn(isRTL && "text-right")}>{t("Service Name")}*</Label>
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
                                    onValueChange={(value) => handleInputChange("category", value)}
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
                                onValueChange={(value) => handleInputChange("department", value)}
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
                            <Label htmlFor="description" className={cn(isRTL && "text-right")}>{t("Description")}*</Label>
                            <Textarea
                                id="description"
                                value={serviceData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
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
                                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                            />
                            <Label htmlFor="isActive" className={cn(isRTL && "text-right")}>{t("Active Service")}</Label>
                        </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration" className={cn(isRTL && "text-right")}>{t("Duration (minutes)")}*</Label>
                                <div className="relative">
                                    <Clock className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={serviceData.duration}
                                        onChange={(e) => handleInputChange("duration", e.target.value)}
                                        placeholder={t("Enter duration in minutes")}
                                        className={cn(isRTL ? "pr-10 text-right" : "pl-10", errors.duration && "border-red-500")}
                                        dir={isRTL ? "rtl" : "ltr"}
                                    />
                                </div>
                                {errors.duration && (
                                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.duration}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price" className={cn(isRTL && "text-right")}>{t("Price (USD)")}*</Label>
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
                    </TabsContent>

                    {/* ... Other tabs follow AddServiceModal logic ... */}
                    <TabsContent value="scheduling" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxBookingsPerDay" className={cn(isRTL && "text-right")}>
                                {t("Maximum Bookings Per Day")}*
                            </Label>
                            <div className="relative">
                                <Users className={cn("absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
                                <Input
                                    id="maxBookingsPerDay"
                                    type="number"
                                    value={serviceData.maxBookingsPerDay}
                                    onChange={(e) => handleInputChange("maxBookingsPerDay", e.target.value)}
                                    placeholder={t("Enter maximum bookings per day")}
                                    className={cn(isRTL ? "pr-10 text-right" : "pl-10", errors.maxBookingsPerDay && "border-red-500")}
                                    dir={isRTL ? "rtl" : "ltr"}
                                />
                            </div>
                        </div>
                        <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                            <Switch
                                id="followUpRequired"
                                checked={serviceData.followUpRequired}
                                onCheckedChange={(checked) => handleInputChange("followUpRequired", checked)}
                            />
                            <Label htmlFor="followUpRequired" className={cn(isRTL && "text-right")}>{t("Follow-up Required")}</Label>
                        </div>
                        {/* Prerequisites */}
                        <div className="space-y-2">
                            <Label htmlFor="prerequisites" className={cn(isRTL && "text-right")}>{t("Prerequisites")}</Label>
                            <Textarea
                                id="prerequisites"
                                value={serviceData.prerequisites}
                                onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                                placeholder={t("Enter any prerequisites")}
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
                                onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                                placeholder={t("Enter special instructions")}
                                rows={4}
                                className={cn(isRTL && "text-right")}
                                dir={isRTL ? "rtl" : "ltr"}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <Separator />

                <div className={cn("flex justify-end pt-4 gap-2", isRTL && "flex-row-reverse")}>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        {t("Cancel")}
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        )}
                        {t("Update Service")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EditServiceModal;
