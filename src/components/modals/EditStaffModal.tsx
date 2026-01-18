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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { transformUserToStaff } from "@/hooks/useStaff";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";
import { useIsRTL } from "@/hooks/useIsRTL";

interface EditStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: ReturnType<typeof transformUserToStaff> | null;
  onUpdate: (id: string, data: any) => Promise<ReturnType<typeof transformUserToStaff>>;
}

const EditStaffModal: React.FC<EditStaffModalProps> = ({
  open,
  onOpenChange,
  staff,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    sales_percentage: "0",
  });

  const roles = [
    { value: "super_admin", label: "Super Administrator" },
    { value: "admin", label: "Administrator" },
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "receptionist", label: "Receptionist" },
    { value: "staff", label: "Staff" },
  ];

  // Check if current user is admin
  const isAdmin = user?.role === "admin";

  // Initialize form data when staff changes
  useEffect(() => {
    if (staff) {
      setFormData({
        first_name: staff.firstName,
        last_name: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        password: "",
        sales_percentage: String(staff.salesPercentage || 0),
      });
      setErrors({});
    }
  }, [staff]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // Password validation (only if provided and user is admin)
    if (formData.password && isAdmin) {
      if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(formData.password)) {
          newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        }
      }
    }

    // Sales percentage validation for doctors
    if (formData.role === 'doctor') {
      const salesPercentage = parseFloat(formData.sales_percentage);
      if (isNaN(salesPercentage) || salesPercentage < 0 || salesPercentage > 100) {
        newErrors.sales_percentage = "Sales percentage must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staff || !validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Update basic staff information
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === 'doctor' && {
          sales_percentage: parseFloat(formData.sales_percentage) || 0
        })
      };

      const updatedStaff = await onUpdate(staff.id, updateData);

      // Update password separately if provided and user is admin
      if (formData.password && isAdmin) {
        await apiService.adminChangeUserPassword(staff.id, formData.password);
        toast({
          title: "Password Updated",
          description: `Password for ${formData.first_name} ${formData.last_name} has been updated successfully.`,
        });
      }
      
      toast({
        title: "Staff Updated",
        description: `${formData.first_name} ${formData.last_name}'s information has been updated successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating staff member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!staff) return null;

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
            <User
              className={cn(
                "h-6 w-6 text-blue-600 flex-shrink-0",
                isRTL ? "order-2" : ""
              )}
            />
            <div className="flex-1 min-w-0">
              <DialogTitle
                className="text-xl font-semibold"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Edit Staff Member")}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {t("Update information for")} {staff.firstName} {staff.lastName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
          {/* Personal Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <User className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Personal Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                <div className="space-y-2">
                  <Label htmlFor="firstName" dir={isRTL ? "rtl" : "ltr"}>{t("First Name")} *</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    placeholder={t("John")}
                    required
                    dir="ltr"
                    className={isRTL && "text-right"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" dir={isRTL ? "rtl" : "ltr"}>{t("Last Name")} *</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    placeholder={t("Doe")}
                    required
                    dir="ltr"
                    className={isRTL && "text-right"}
                  />
                </div>
              </div>

              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                <div className="space-y-2">
                  <Label htmlFor="email" dir={isRTL ? "rtl" : "ltr"}>{t("Email")} *</Label>
                  <div className={cn("relative", isRTL && "flex-row-reverse")}>
                    <Mail className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john.doe@clinic.com"
                      className={cn(
                        errors.email && "border-red-500",
                        isRTL ? "pr-10 text-right" : "pl-10"
                      )}
                      dir="ltr"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" dir={isRTL ? "rtl" : "ltr"}>{t("Phone Number")}</Label>
                  <div className={cn("relative", isRTL && "flex-row-reverse")}>
                    <Phone className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={isRTL ? "pr-10 text-right" : "pl-10"}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Briefcase className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")}>{t("Role Information")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className="space-y-2">
                <Label htmlFor="role" dir={isRTL ? "rtl" : "ltr"}>{t("Role")} *</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                  <SelectTrigger className={cn(errors.role ? "border-red-500" : "", isRTL && "text-right")}>
                    <SelectValue placeholder={t("Select a role")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {t(role.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.role}</p>
                )}
              </div>
              
              {/* Sales Percentage for Doctors */}
              {formData.role === 'doctor' && (
                <div className="space-y-2">
                  <Label htmlFor="sales_percentage" dir={isRTL ? "rtl" : "ltr"}>{t("Sales Percentage")} (%) *</Label>
                  <Input
                    id="sales_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.sales_percentage}
                    onChange={(e) => handleChange("sales_percentage", e.target.value)}
                    placeholder="10.0"
                    dir="ltr"
                    className={isRTL && "text-right"}
                  />
                  <p className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
                    {t("Percentage of revenue generated from appointments that will be added as sales incentive")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password Information - Admin Only */}
          {isAdmin && (
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Lock className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Password Management")}</span>
                </CardTitle>
                <p className={cn("text-sm text-gray-600 mt-1", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                  {t("Only administrators can update user passwords. Leave blank to keep current password.")}
                </p>
              </CardHeader>
              <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
                <div className="space-y-2">
                  <Label htmlFor="password" dir={isRTL ? "rtl" : "ltr"}>{t("New Password")}</Label>
                  <div className={cn("relative", isRTL && "flex-row-reverse")}>
                    <Lock className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder={t("Enter new password (optional)")}
                      className={cn(
                        isRTL ? "pr-10 pl-10 text-right" : "pl-10 pr-10"
                      )}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        "absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600",
                        isRTL ? "left-3" : "right-3"
                      )}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className={cn("text-xs text-gray-500", isRTL && "text-right")}>
                    {t("Password must be at least 6 characters and contain uppercase, lowercase, and number.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  {t("Updating...")}
                </>
              ) : (
                t("Update Staff")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffModal; 