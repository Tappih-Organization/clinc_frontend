import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Briefcase,
  Calendar,
  Calculator,
  Save,
  X,
  CheckCircle,
  Clock,
  FileText,
  Info,
  User,
  Mail,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { apiService, type Payroll, type User } from "@/services/api";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface UpdateSalaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  onUpdate: () => void;
}

const UpdateSalaryModal: React.FC<UpdateSalaryModalProps> = ({
  open,
  onOpenChange,
  employeeId,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [employeeData, setEmployeeData] = useState<User | null>(null);
  const [payrollData, setPayrollData] = useState<Payroll | null>(null);
  const [editForm, setEditForm] = useState<Partial<Payroll>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { formatAmount } = useCurrency();

  // Helper function to parse numeric input values
  const parseNumericValue = (value: string): number => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to parse integer input values
  const parseIntegerValue = (value: string): number => {
    if (value === '' || value === null || value === undefined) {
      return 0;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate net salary automatically
  const calculateNetSalary = (formData: Partial<Payroll>) => {
    const baseSalary = formData.base_salary || 0;
    const overtime = formData.overtime || 0;
    const bonus = formData.bonus || 0;
    const allowances = formData.allowances || 0;
    const tax = formData.tax || 0;
    const deductions = formData.deductions || 0;

    const grossSalary = baseSalary + overtime + bonus + allowances;
    const totalDeductions = tax + deductions;
    return grossSalary - totalDeductions;
  };

  // Update edit form with automatic net salary calculation
  const updateEditForm = (updates: Partial<Payroll>) => {
    const newFormData = { ...editForm, ...updates };
    const calculatedNetSalary = calculateNetSalary(newFormData);
    
    setEditForm({
      ...newFormData,
      net_salary: calculatedNetSalary
    });
  };

  // Load employee and payroll data
  useEffect(() => {
    if (open && employeeId) {
      loadEmployeeData();
    }
  }, [open, employeeId]);

  const loadEmployeeData = async () => {
    try {
      setIsFetching(true);
      
      // Fetch employee data and payroll data in parallel
      const [userResponse, payrollResponse] = await Promise.allSettled([
        apiService.getUser(employeeId!),
        apiService.getPayrolls({ employee_id: employeeId, limit: 10 })
      ]);

      // Handle employee data
      if (userResponse.status === 'fulfilled') {
        setEmployeeData(userResponse.value);
      } else {
        console.error('Error fetching employee data:', userResponse.reason);
        toast({
          title: "Error",
          description: "Failed to load employee data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Handle payroll data
      if (payrollResponse.status === 'fulfilled' && 
          payrollResponse.value.data.items && 
          payrollResponse.value.data.items.length > 0) {
        
        // Find the most recent payroll entry
        const latestPayroll = payrollResponse.value.data.items.reduce((latest, current) => {
          const latestDate = new Date(latest.created_at || latest.updated_at);
          const currentDate = new Date(current.created_at || current.updated_at);
          return currentDate > latestDate ? current : latest;
        });
        
        setPayrollData(latestPayroll);
        
        // Set the edit form with calculated net salary
        const calculatedNetSalary = calculateNetSalary(latestPayroll);
        setEditForm({
          ...latestPayroll,
          net_salary: calculatedNetSalary
        });
      } else {
        // No existing payroll found, create a new one
        const currentDate = new Date();
        const newPayrollData: Partial<Payroll> = {
          employee_id: employeeId,
          month: currentDate.toLocaleString('default', { month: 'long' }),
          year: currentDate.getFullYear(),
          base_salary: 0,
          overtime: 0,
          bonus: 0,
          allowances: 0,
          tax: 0,
          deductions: 0,
          net_salary: 0,
          working_days: 22,
          total_days: 30,
          leaves: 0,
          status: 'draft'
        };
        
        setPayrollData(null);
        setEditForm(newPayrollData);
      }
    } catch (error: any) {
      console.error('Error loading employee/payroll data:', error);
      toast({
        title: t("Error"),
        description: t("Failed to load employee data. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const getEmployeeDisplay = (employee: string | User) => {
    if (typeof employee === 'string') {
      return employee;
    }
    return `${employee.first_name} ${employee.last_name}`;
  };

  const getEmployeeEmail = (employee: string | User) => {
    if (typeof employee === 'string') {
      return employee;
    }
    return employee.email || '';
  };

  const getEmployeeRole = (employee: string | User) => {
    if (typeof employee === 'string') {
      return t('Staff Member');
    }
    return employee.role || t('Staff Member');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processed":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "draft":
        return <FileText className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "processed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSavePayroll = async () => {
    if (!editForm || !employeeId) return;

    try {
      setIsLoading(true);
      
      // Prepare the payload
      const payload = {
        ...editForm,
        employee_id: employeeId
      };

      let updatedPayroll: Payroll;

      if (payrollData?._id) {
        // Update existing payroll
        updatedPayroll = await apiService.updatePayroll(payrollData._id, payload);
        toast({
          title: t("Success"),
          description: t("Payroll details updated successfully."),
        });
      } else {
        // Create new payroll
        updatedPayroll = await apiService.createPayroll(payload as Omit<Payroll, '_id' | 'created_at' | 'updated_at'>);
        toast({
          title: t("Success"),
          description: t("New payroll record created successfully."),
        });
      }

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving payroll:', error);
      
      // Handle validation errors specifically
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((err: any) => 
          `${err.path}: ${err.msg}`
        ).join(', ');
        
        toast({
          title: t("Validation Error"),
          description: `${t("Please check the following fields")}: ${errorMessages}`,
          variant: "destructive",
        });
      } else if (error.response?.data?.message) {
        toast({
          title: t("Error"),
          description: error.response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("Error"),
          description: t("Failed to save payroll details. Please try again."),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setEmployeeData(null);
    setPayrollData(null);
    setEditForm({});
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent
        className={cn("max-w-5xl max-h-[95vh] overflow-y-auto z-50", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader dir={isRTL ? "rtl" : "ltr"}>
          <div className={cn(
            "flex items-center gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <DollarSign
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
                {t("Update Salary & Payroll Details")}
              </DialogTitle>
              <DialogDescription
                className="text-sm text-muted-foreground mt-1"
                dir="ltr"
                style={{ textAlign: "left", direction: "ltr" }}
              >
                {payrollData
                  ? t('Edit payroll information. Only non-paid entries can be modified.')
                  : t('Create new payroll record for this employee.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isFetching ? (
          <div className={cn("flex items-center justify-center py-8", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className={cn(isRTL ? "mr-2" : "ml-2")}>{t("Loading employee data...")}</span>
          </div>
        ) : editForm && (
          <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
            {/* Employee Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Briefcase className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Employee Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg",
                  isRTL && "text-right"
                )}>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Name")}
                    </Label>
                    <p className={cn("text-sm font-semibold", isRTL && "text-right")}>
                      {employeeData ? getEmployeeDisplay(employeeData) : t('Loading...')}
                    </p>
                  </div>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Email")}
                    </Label>
                    <p className={cn("text-sm", isRTL && "text-right")} dir="ltr">
                      {employeeData ? getEmployeeEmail(employeeData) : t('Loading...')}
                    </p>
                  </div>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Role")}
                    </Label>
                    <p className={cn("text-sm", isRTL && "text-right")}>
                      {employeeData ? getEmployeeRole(employeeData) : t('Loading...')}
                    </p>
                  </div>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Employee ID")}
                    </Label>
                    <p className={cn("text-sm", isRTL && "text-right")} dir="ltr">
                      {employeeId}
                    </p>
                  </div>
                  {payrollData && (
                    <div>
                      <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                        {t("Status")}
                      </Label>
                      <div className={cn("flex items-center gap-2 mt-1", isRTL && "flex-row-reverse")}>
                        {getStatusIcon(payrollData.status)}
                        <Badge className={getStatusColor(payrollData.status)} dir="ltr" style={{ textAlign: "left", direction: "ltr" }}>
                          {payrollData.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pay Period Information */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <Calendar className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Pay Period Information")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg",
                  isRTL && "text-right"
                )}>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Month & Year")}
                    </Label>
                    <p className={cn("text-sm font-semibold", isRTL && "text-right")}>
                      {editForm.month} {editForm.year}
                    </p>
                  </div>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Working Days")}
                    </Label>
                    <Input
                      type="number"
                      value={editForm.working_days ?? 0}
                      onChange={(e) => updateEditForm({
                        working_days: parseIntegerValue(e.target.value)
                      })}
                      className="mt-1"
                      min="0"
                      max="31"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                      {t("Leaves Taken")}
                    </Label>
                    <Input
                      type="number"
                      value={editForm.leaves ?? 0}
                      onChange={(e) => updateEditForm({
                        leaves: parseIntegerValue(e.target.value)
                      })}
                      className="mt-1"
                      min="0"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Breakdown */}
            <Card dir={isRTL ? "rtl" : "ltr"}>
              <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                <CardTitle
                  className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                >
                  <DollarSign className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                  <span className={cn(isRTL && "text-right")}>{t("Salary Breakdown")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent dir={isRTL ? "rtl" : "ltr"}>
                <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
                  {/* Base Salary */}
                  <div className={cn("p-4 bg-gray-50 rounded-lg", isRTL && "text-right")}>
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Base Salary")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.base_salary ?? 0}
                          onChange={(e) => updateEditForm({
                            base_salary: parseNumericValue(e.target.value)
                          })}
                          className="mt-1"
                          min="0"
                          step="0.01"
                          placeholder={t("Enter base salary")}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Total Days")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.total_days ?? 30}
                          onChange={(e) => updateEditForm({
                            total_days: parseIntegerValue(e.target.value)
                          })}
                          className="mt-1"
                          min="1"
                          max="31"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additions */}
                  <div className={cn("p-4 bg-green-50 rounded-lg", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold text-green-800 mb-3", isRTL && "text-right")}>
                      {t('Additions')}
                    </h4>
                    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", isRTL && "text-right")}>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Overtime")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.overtime ?? 0}
                          onChange={(e) => updateEditForm({
                            overtime: parseNumericValue(e.target.value)
                          })}
                          className="mt-1"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Bonus")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.bonus ?? 0}
                          onChange={(e) => updateEditForm({
                            bonus: parseNumericValue(e.target.value)
                          })}
                          className="mt-1"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Allowances")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.allowances ?? 0}
                          onChange={(e) => updateEditForm({
                            allowances: parseNumericValue(e.target.value)
                          })}
                          className="mt-1"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className={cn("p-4 bg-red-50 rounded-lg", isRTL && "text-right")}>
                    <h4 className={cn("font-semibold text-red-800 mb-3", isRTL && "text-right")}>
                      {t('Deductions')}
                    </h4>
                    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", isRTL && "text-right")}>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Tax")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.tax ?? 0}
                          onChange={(e) => updateEditForm({
                            tax: parseNumericValue(e.target.value)
                          })}
                          className="mt-1"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          {t("Other Deductions")}
                        </Label>
                        <Input
                          type="number"
                          value={editForm.deductions ?? 0}
                          onChange={(e) => updateEditForm({
                            deductions: parseNumericValue(e.target.value)
                          })}
                          className="mt-1"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div className={cn("p-4 bg-blue-50 rounded-lg", isRTL && "text-right")}>
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <div>
                        <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <span>{t('Net Salary')}</span>
                            <span className="text-xs text-blue-600 font-normal">
                              <Calculator className="inline h-3 w-3" />
                              {t('Auto-calculated')}
                            </span>
                          </div>
                        </Label>
                        <p className={cn("text-2xl font-bold text-blue-700", isRTL && "text-right")}>
                          <CurrencyDisplay
                            amount={editForm.net_salary ?? 0}
                            variant="large"
                          />
                        </p>
                      </div>
                      {payrollData?.pay_date && (
                        <div className={cn("text-right", isRTL && "text-left")}>
                          <Label className={cn("text-sm font-medium text-gray-600", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                            {t("Pay Date")}
                          </Label>
                          <p className={cn("text-sm font-semibold", isRTL && "text-right")} dir="ltr">
                            {new Date(payrollData.pay_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current vs New Salary Comparison */}
            {payrollData && editForm.base_salary !== payrollData.base_salary && (
              <Card dir={isRTL ? "rtl" : "ltr"}>
                <CardHeader dir={isRTL ? "rtl" : "ltr"}>
                  <CardTitle
                    className={cn("flex items-center text-lg", isRTL && "flex-row-reverse")}
                    dir={isRTL ? "rtl" : "ltr"}
                    style={isRTL ? { textAlign: "right" } : { textAlign: "left" }}
                  >
                    <Info className={cn("h-5 w-5 flex-shrink-0", isRTL ? "ml-2 order-2" : "mr-2")} />
                    <span className={cn(isRTL && "text-right")}>{t("Salary Change Summary")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent dir={isRTL ? "rtl" : "ltr"}>
                  <div className={cn("grid grid-cols-2 gap-4 text-center", isRTL && "text-right")}>
                    <div className="p-3 bg-white rounded-lg">
                      <div className={cn("text-sm text-gray-500", isRTL && "text-right")}>{t("Previous Base Salary")}</div>
                      <div className="text-lg font-semibold">
                        <CurrencyDisplay amount={payrollData.base_salary} />
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className={cn("text-sm text-gray-500", isRTL && "text-right")}>{t("New Base Salary")}</div>
                      <div className="text-lg font-semibold text-blue-600">
                        <CurrencyDisplay amount={editForm.base_salary ?? 0} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter className={cn("space-x-2", isRTL && "flex-row-reverse")} dir={isRTL ? "rtl" : "ltr"}>
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={isLoading}
            className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <X className="h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleSavePayroll}
            disabled={isLoading || isFetching}
            className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}
          >
            <Save className="h-4 w-4" />
            {isLoading
              ? t('Saving...')
              : payrollData
                ? t('Update Payroll')
                : t('Create Payroll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSalaryModal; 