import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { parseApiError } from "@/utils/errorHandler";
import { getDepartmentOptions } from "@/utils/departments";
import { apiService } from "@/services/api";
import { useClinic } from "@/contexts/ClinicContext";
import type { User as StaffUser } from "@/services/api";
import { transformUserToStaff } from "@/hooks/useStaff";
import { cn } from "@/lib/utils";
import { useIsRTL } from "@/hooks/useIsRTL";

interface AddStaffModalProps {
  trigger?: React.ReactNode;
  onStaffAdded?: (staff?: ReturnType<typeof transformUserToStaff>) => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ trigger, onStaffAdded }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentClinic } = useClinic();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    salary: "",
    salesPercentage: "0",
    joiningDate: "",
    address: "",
    qualifications: "",
    // Schedule
    mondayStart: "09:00",
    mondayEnd: "17:00",
    mondayWorking: true,
    tuesdayStart: "09:00",
    tuesdayEnd: "17:00",
    tuesdayWorking: true,
    wednesdayStart: "09:00",
    wednesdayEnd: "17:00",
    wednesdayWorking: true,
    thursdayStart: "09:00",
    thursdayEnd: "17:00",
    thursdayWorking: true,
    fridayStart: "09:00",
    fridayEnd: "17:00",
    fridayWorking: true,
    saturdayStart: "09:00",
    saturdayEnd: "13:00",
    saturdayWorking: false,
    sundayStart: "00:00",
    sundayEnd: "00:00",
    sundayWorking: false,
  });

  const roles = [
    { value: "super_admin", label: "Super Administrator" },
    { value: "admin", label: "Administrator" },
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "receptionist", label: "Receptionist" },
    { value: "technician", label: "Technician" },
    { value: "accountant", label: "Accountant" },
  ];

  // Get departments from utility to match Departments module
  const departments = getDepartmentOptions();

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const handleChange = (field: string, value: any) => {
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

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
    let password = "";

    // Ensure at least one character from each required category
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(
      Math.floor(Math.random() * 26),
    ); // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz".charAt(
      Math.floor(Math.random() * 26),
    ); // Lowercase
    password += "0123456789".charAt(Math.floor(Math.random() * 10)); // Number
    password += "@$!%*?&".charAt(Math.floor(Math.random() * 7)); // Special char

    // Add 8 more random characters to make it 12 characters total
    for (let i = 0; i < 8; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password
    const shuffled = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setFormData((prev) => ({
      ...prev,
      password: shuffled,
      confirmPassword: shuffled,
    }));

    toast({
      title: t("Password Generated"),
      description: t("A strong password has been generated and filled in both fields."),
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("First name is required");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("Last name is required");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("Email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t("Please enter a valid email address");
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("Phone number is required");
    }

    if (!formData.password) {
      newErrors.password = t("Password is required");
    } else if (formData.password.length < 8) {
      newErrors.password = t("Password must be at least 8 characters long");
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = t("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("Please confirm your password");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("Passwords do not match");
    }

    if (!formData.role) {
      newErrors.role = t("Role is required");
    }

    if (!formData.department) {
      newErrors.department = t("Department is required");
    }

    if (!formData.salary.trim()) {
      newErrors.salary = t("Salary is required");
    } else {
      const salary = parseFloat(formData.salary);
      if (isNaN(salary) || salary <= 0) {
        newErrors.salary = t("Salary must be greater than 0");
      }
    }

    // Sales percentage validation for doctors
    if (formData.role === 'doctor') {
      const salesPercentage = parseFloat(formData.salesPercentage);
      if (isNaN(salesPercentage) || salesPercentage < 0 || salesPercentage > 100) {
        newErrors.salesPercentage = t("Sales percentage must be between 0 and 100");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if current clinic is selected
    if (!currentClinic?._id) {
      toast({
        title: t("Error"),
        description: t("No clinic selected. Please select a clinic before adding staff."),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare staff data according to API schema
      const staffData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'staff',
        phone: formData.phone,
        clinic_id: currentClinic._id, // Add the clinic_id from context
        ...(formData.role === 'doctor' && {
          sales_percentage: parseFloat(formData.salesPercentage) || 0
        })
      };

      // Create staff member via API
      const response = await apiService.register(staffData);
      const newUser = response.user;
      const transformedStaff = transformUserToStaff(newUser);

      const formattedSalary = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parseFloat(formData.salary));

      toast({
        title: t("Staff member added successfully"),
        description: t("{{firstName}} {{lastName}} has been added as {{role}} with salary {{salary}}.", {
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: t(newUser.role),
          salary: formattedSalary,
        }),
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
        department: "",
        salary: "",
        salesPercentage: "0",
        joiningDate: "",
        address: "",
        qualifications: "",
        mondayStart: "09:00",
        mondayEnd: "17:00",
        mondayWorking: true,
        tuesdayStart: "09:00",
        tuesdayEnd: "17:00",
        tuesdayWorking: true,
        wednesdayStart: "09:00",
        wednesdayEnd: "17:00",
        wednesdayWorking: true,
        thursdayStart: "09:00",
        thursdayEnd: "17:00",
        thursdayWorking: true,
        fridayStart: "09:00",
        fridayEnd: "17:00",
        fridayWorking: true,
        saturdayStart: "09:00",
        saturdayEnd: "13:00",
        saturdayWorking: false,
        sundayStart: "00:00",
        sundayEnd: "00:00",
        sundayWorking: false,
      });

      setErrors({});
      setOpen(false);
      
      // Call the callback with the transformed staff member
      if (onStaffAdded) {
        onStaffAdded(transformedStaff);
      }
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      
      // Handle server-side validation errors
      if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors: Record<string, string> = {};
        
        error.response.data.errors.forEach((err: any) => {
          const fieldMapping: Record<string, string> = {
            'first_name': 'firstName',
            'last_name': 'lastName',
            'email': 'email',
            'phone': 'phone',
            'password': 'password',
            'role': 'role',
            'department': 'department',
            'salary': 'salary',
          };
          
          const fieldName = fieldMapping[err.path] || err.path;
          if (fieldName) {
            validationErrors[fieldName] = err.msg || t("Invalid value");
          }
        });
        
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }
      
      // For non-validation errors, show toast
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("Add Staff Member")}
          </Button>
        )}
      </DialogTrigger>
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
            <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
              <DialogTitle
                className={cn(
                  "text-xl font-semibold",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
              >
                {t("Add New Staff Member")}
              </DialogTitle>
              <DialogDescription
                className={cn(
                  "text-sm text-muted-foreground mt-1",
                  isRTL && "text-right"
                )}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}
              >
                {currentClinic ? (
                  <>{t("Enter staff member information to add them to")} <strong>{currentClinic.name}</strong>.</>
                ) : (
                  t("Enter staff member information to add them to your clinic team.")
                )}
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
                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}>
                  {t("Personal Information")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                <div className="space-y-2">
                  <Label htmlFor="firstName" dir={isRTL ? "rtl" : "ltr"}>{t("First Name")} *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("John")}
                    required
                    className={cn(errors.firstName ? "border-red-500" : "", isRTL && "text-right")}
                    dir="ltr"
                  />
                  {errors.firstName && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" dir={isRTL ? "rtl" : "ltr"}>{t("Last Name")} *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder={t("Doe")}
                    required
                    className={cn(errors.lastName ? "border-red-500" : "", isRTL && "text-right")}
                    dir="ltr"
                  />
                  {errors.lastName && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.lastName}</p>
                  )}
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
                        errors.email ? "border-red-500" : "",
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
                  <Label htmlFor="phone" dir={isRTL ? "rtl" : "ltr"}>{t("Phone Number")} *</Label>
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
                      className={cn(
                        errors.phone ? "border-red-500" : "",
                        isRTL ? "pr-10 text-right" : "pl-10"
                      )}
                      dir="ltr"
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                <div className="space-y-2">
                  <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                    <Label htmlFor="password" dir={isRTL ? "rtl" : "ltr"}>{t("Password")} *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generatePassword}
                      className={cn("text-xs", isRTL && "flex-row-reverse")}
                    >
                      {t("Generate")}
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder={t("Enter a strong password")}
                    required
                    minLength={8}
                    dir="ltr"
                    className={cn(
                      errors.password && "border-red-500",
                      !errors.password && formData.password.length > 0 &&
                      formData.password.length < 8
                        ? "border-red-300 focus:border-red-500"
                        : !errors.password && formData.password.length >= 8 &&
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
                              formData.password,
                            )
                          ? "border-green-300 focus:border-green-500"
                          : ""
                    )}
                  />
                  {errors.password && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.password}</p>
                  )}
                  <div className={cn("text-xs space-y-1", isRTL && "text-right")}>
                    <p className="text-gray-500">{t("Password must contain")}:</p>
                    <ul className={cn("space-y-1", isRTL ? "mr-2" : "ml-2")}>
                      <li
                        className={
                          formData.password.length >= 8
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        ✓ {t("At least 8 characters")}
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        ✓ {t("One uppercase letter")}
                      </li>
                      <li
                        className={
                          /[a-z]/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        ✓ {t("One lowercase letter")}
                      </li>
                      <li
                        className={
                          /\d/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        ✓ {t("One number")}
                      </li>
                      <li
                        className={
                          /[@$!%*?&]/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        ✓ {t("One special character")} (@$!%*?&)
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" dir={isRTL ? "rtl" : "ltr"}>{t("Confirm Password")} *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    placeholder={t("Confirm password")}
                    required
                    minLength={8}
                    dir="ltr"
                    className={cn(
                      errors.confirmPassword && "border-red-500",
                      !errors.confirmPassword && formData.confirmPassword.length > 0
                        ? formData.password === formData.confirmPassword
                          ? "border-green-300 focus:border-green-500"
                          : "border-red-300 focus:border-red-500"
                        : ""
                    )}
                  />
                  {errors.confirmPassword && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.confirmPassword}</p>
                  )}
                  {!errors.confirmPassword && formData.confirmPassword.length > 0 && (
                    <p
                      className={cn(
                        "text-xs",
                        formData.password === formData.confirmPassword
                          ? "text-green-600"
                          : "text-red-600",
                        isRTL && "text-right"
                      )}
                    >
                      {formData.password === formData.confirmPassword
                        ? `✓ ${t("Passwords match")}`
                        : `✗ ${t("Passwords do not match")}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" dir={isRTL ? "rtl" : "ltr"}>{t("Address")}</Label>
                <div className={cn("relative", isRTL && "flex-row-reverse")}>
                  <MapPin className={cn(
                    "absolute top-3 h-4 w-4 text-gray-400",
                    isRTL ? "right-3" : "left-3"
                  )} />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder={t("123 Main Street, City, State, ZIP")}
                    className={isRTL ? "pr-10 text-right" : "pl-10"}
                    rows={2}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Briefcase className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}>
                  {t("Professional Information")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                <div className="space-y-2">
                  <Label htmlFor="role" dir={isRTL ? "rtl" : "ltr"}>{t("Role")} *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                  >
                    <SelectTrigger className={cn(errors.role ? "border-red-500" : "", isRTL && "text-right")}>
                      <SelectValue placeholder={t("Select role")} />
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
                <div className="space-y-2">
                  <Label htmlFor="department" dir={isRTL ? "rtl" : "ltr"}>{t("Department")} *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange("department", value)}
                  >
                    <SelectTrigger className={cn(errors.department ? "border-red-500" : "", isRTL && "text-right")}>
                      <SelectValue placeholder={t("Select department")} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.code} value={dept.name}>
                          <div className={cn("flex items-center", isRTL ? "flex-row-reverse space-x-reverse" : "space-x-2")}>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {dept.code}
                            </span>
                            <span>{dept.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.department}</p>
                  )}
                </div>
              </div>

              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                <div className="space-y-2">
                  <Label htmlFor="salary" dir={isRTL ? "rtl" : "ltr"}>{t("Annual Salary")} ($) *</Label>
                  <div className={cn("relative", isRTL && "flex-row-reverse")}>
                    <DollarSign className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      id="salary"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.salary}
                      onChange={(e) => handleChange("salary", e.target.value)}
                      placeholder="50000"
                      dir="ltr"
                      className={cn(
                        errors.salary && "border-red-500",
                        isRTL ? "pr-10 text-right" : "pl-10"
                      )}
                      required
                    />
                  </div>
                  {errors.salary && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.salary}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate" dir={isRTL ? "rtl" : "ltr"}>{t("Joining Date")}</Label>
                  <div className={cn("relative", isRTL && "flex-row-reverse")}>
                    <Calendar className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) =>
                        handleChange("joiningDate", e.target.value)
                      }
                      className={isRTL ? "pr-10" : "pl-10"}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Sales Percentage for Doctors */}
              {formData.role === 'doctor' && (
                <div className="space-y-2">
                  <Label htmlFor="salesPercentage" dir={isRTL ? "rtl" : "ltr"}>{t("Sales Percentage")} (%) *</Label>
                  <div className={cn("relative", isRTL && "flex-row-reverse")}>
                    <DollarSign className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400",
                      isRTL ? "right-3" : "left-3"
                    )} />
                    <Input
                      id="salesPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.salesPercentage}
                      onChange={(e) => handleChange("salesPercentage", e.target.value)}
                      placeholder="10.0"
                      dir="ltr"
                      className={cn(
                        errors.salesPercentage && "border-red-500",
                        isRTL ? "pr-10 text-right" : "pl-10"
                      )}
                    />
                  </div>
                  {errors.salesPercentage && (
                    <p className={cn("text-sm text-red-500", isRTL && "text-right")}>{errors.salesPercentage}</p>
                  )}
                  <p className={cn("text-sm text-muted-foreground", isRTL && "text-right")}>
                    {t("Percentage of revenue generated from appointments that will be added as sales incentive")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="qualifications" dir={isRTL ? "rtl" : "ltr"}>{t("Qualifications")}</Label>
                <div className={cn("relative", isRTL && "flex-row-reverse")}>
                  <GraduationCap className={cn(
                    "absolute top-3 h-4 w-4 text-gray-400",
                    isRTL ? "right-3" : "left-3"
                  )} />
                  <Textarea
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) =>
                      handleChange("qualifications", e.target.value)
                    }
                    placeholder={t("MD, MBBS, Certifications, etc. (separate with commas)")}
                    className={isRTL ? "pr-10 text-right" : "pl-10"}
                    rows={2}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Schedule */}
          <Card dir={isRTL ? "rtl" : "ltr"}>
            <CardHeader dir={isRTL ? "rtl" : "ltr"}>
              <CardTitle
                className={cn("text-lg flex items-center", isRTL && "flex-row-reverse")}
                dir={isRTL ? "rtl" : "ltr"}
                style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
              >
                <Clock className={cn("h-4 w-4 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                <span className={cn(isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"} style={isRTL ? { textAlign: "right", direction: "rtl" } : { textAlign: "left", direction: "ltr" }}>
                  {t("Work Schedule")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              <div className="space-y-3">
                {daysOfWeek.map((day) => (
                  <div
                    key={day.key}
                    className={cn(
                      "flex items-center p-3 border rounded-lg",
                      isRTL ? "flex-row-reverse space-x-reverse" : "space-x-4"
                    )}
                  >
                    <div className={cn(
                      "flex items-center min-w-[100px]",
                      isRTL ? "flex-row-reverse space-x-reverse" : "space-x-2"
                    )}>
                      <Checkbox
                        id={`${day.key}Working`}
                        checked={
                          formData[
                            `${day.key}Working` as keyof typeof formData
                          ] as boolean
                        }
                        onCheckedChange={(checked) =>
                          handleChange(`${day.key}Working`, checked)
                        }
                      />
                      <Label
                        htmlFor={`${day.key}Working`}
                        className="font-medium"
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {t(day.label)}
                      </Label>
                    </div>

                    {formData[`${day.key}Working` as keyof typeof formData] && (
                      <div className={cn(
                        "flex items-center flex-1",
                        isRTL ? "flex-row-reverse space-x-reverse" : "space-x-2"
                      )}>
                        <Label className={cn("text-sm text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("From")}:
                        </Label>
                        <Input
                          type="time"
                          value={
                            formData[
                              `${day.key}Start` as keyof typeof formData
                            ] as string
                          }
                          onChange={(e) =>
                            handleChange(`${day.key}Start`, e.target.value)
                          }
                          className="w-32"
                          dir="ltr"
                        />
                        <Label className={cn("text-sm text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("To")}:
                        </Label>
                        <Input
                          type="time"
                          value={
                            formData[
                              `${day.key}End` as keyof typeof formData
                            ] as string
                          }
                          onChange={(e) =>
                            handleChange(`${day.key}End`, e.target.value)
                          }
                          className="w-32"
                          dir="ltr"
                        />
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
              onClick={() => setOpen(false)}
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("Adding Staff...")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t("Add Staff Member")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffModal;
