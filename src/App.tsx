import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequirePermission from "@/components/RequirePermission";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import TenantSelector from "@/components/tenant/TenantSelector";
import Loading from "@/components/ui/Loading";

// Essential pages - load immediately
import MainLogin from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ClinicSelection from "./pages/ClinicSelection";
import Dashboard from "./pages/dashboard/Dashboard";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";

// Helper function to retry dynamic imports
const retryLazyImport = (importFn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const attempt = (remaining: number) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          if (remaining > 0) {
            console.warn(`Failed to load module, retrying... (${retries - remaining + 1}/${retries})`);
            setTimeout(() => attempt(remaining - 1), delay);
          } else {
            console.error('Failed to load module after retries:', error);
            reject(error);
          }
        });
    };
    attempt(retries);
  });
};

// Lazy load heavy components for better initial load performance
const XrayAnalysis = lazy(() => retryLazyImport(() => import("./pages/dashboard/xray-analysis/XrayAnalysis")));
const AITestAnalysis = lazy(() => retryLazyImport(() => import("./pages/dashboard/ai-test-analysis/AITestAnalysis")));
const AITestComparison = lazy(() => retryLazyImport(() => import("./pages/dashboard/ai-test-comparison/AITestComparison")));
const Patients = lazy(() => retryLazyImport(() => import("./pages/dashboard/patients/Patients")));
const AppointmentsTable = lazy(() => retryLazyImport(() => import("./pages/dashboard/appointments/AppointmentsTable")));
const AppointmentsCalendar = lazy(() => retryLazyImport(() => import("./pages/dashboard/appointments/AppointmentsCalendar")));
const AddAppointment = lazy(() => retryLazyImport(() => import("./pages/dashboard/appointments/AddAppointment")));
const Billing = lazy(() => import("./pages/dashboard/billing/Billing"));
const Leads = lazy(() => import("./pages/dashboard/leads/Leads"));
const Services = lazy(() => import("./pages/dashboard/services/Services"));
const Inventory = lazy(() => import("./pages/dashboard/inventory/Inventory"));
const Staff = lazy(() => import("./pages/dashboard/staff/Staff"));
const Invoices = lazy(() => import("./pages/dashboard/invoices/Invoices"));
const Payments = lazy(() => import("./pages/dashboard/payments/Payments"));
const Payroll = lazy(() => import("./pages/dashboard/payroll/Payroll"));
const Expenses = lazy(() => import("./pages/dashboard/expenses/Expenses"));
const Performance = lazy(() => import("./pages/dashboard/performance/Performance"));
const Prescriptions = lazy(() => import("./pages/dashboard/prescriptions/Prescriptions"));
const Odontograms = lazy(() => import("./pages/dashboard/odontograms/Odontograms"));
const Analytics = lazy(() => import("./pages/dashboard/analytics/Analytics"));
const TestReports = lazy(() => import("./pages/dashboard/test-reports/TestReports"));
const Tests = lazy(() => import("./pages/dashboard/tests/Tests"));
const LabVendors = lazy(() => import("./pages/dashboard/lab-vendors/LabVendors"));
const Methodology = lazy(() => import("./pages/dashboard/test-modules/methodology/Methodology"));
const TurnaroundTime = lazy(() => import("./pages/dashboard/test-modules/turnaround-time/TurnaroundTime"));
const SampleType = lazy(() => import("./pages/dashboard/test-modules/sample-type/SampleType"));
const Category = lazy(() => import("./pages/dashboard/test-modules/category/Category"));
const Calendar = lazy(() => import("./pages/dashboard/calendar/Calendar"));
const Settings = lazy(() => import("./pages/dashboard/settings/Settings"));
const Profile = lazy(() => import("./pages/dashboard/profile/Profile"));
const Departments = lazy(() => import("./pages/dashboard/departments/Departments"));
const Clinics = lazy(() => import("./pages/dashboard/clinics/Clinics"));
const Permissions = lazy(() => import("./pages/dashboard/permissions/Permissions"));
const SuperAdminLogin = lazy(() => import("./pages/super-admin/SuperAdminLogin"));
const SuperAdminLayout = lazy(() => import("./components/layout/SuperAdminLayout"));
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/SuperAdminDashboard"));
const Tenants = lazy(() => import("./pages/super-admin/Tenants"));
const Users = lazy(() => import("./pages/super-admin/users/Users"));
const PaymentSuccess = lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentCancelled = lazy(() => import("./pages/payments/PaymentCancelled"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Global error handler for Google Translate DOM conflicts
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error && 
          (event.error.message?.includes('removeChild') || 
           event.error.message?.includes('Node') ||
           event.error.message?.includes('translate'))) {
        
        console.warn('Google Translate DOM conflict caught globally:', event.error.message);
        
        // Prevent the error from propagating and crashing the app
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && 
          (event.reason.message?.includes('removeChild') || 
           event.reason.message?.includes('Node') ||
           event.reason.message?.includes('translate'))) {
        
        console.warn('Google Translate DOM conflict caught (promise rejection):', event.reason.message);
        
        // Prevent the error from propagating
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="clinicpro-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <ClinicProvider>
                <CurrencyProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MainLogin />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<MainLogin />} />
            
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Super Admin routes */}
            <Route path="/admin" element={
              <Suspense fallback={<Loading fullScreen />}>
                <SuperAdminLogin />
              </Suspense>
            } />
            
            {/* Super Admin Dashboard routes */}
            <Route path="/admin/dashboard" element={
              <Suspense fallback={<Loading fullScreen />}>
                <SuperAdminLayout />
              </Suspense>
            }>
              <Route index element={
                <Suspense fallback={<Loading size="default" />}>
                  <SuperAdminDashboard />
                </Suspense>
              } />
            </Route>
            <Route path="/admin/tenants" element={
              <Suspense fallback={<Loading fullScreen />}>
                <SuperAdminLayout />
              </Suspense>
            }>
              <Route index element={
                <Suspense fallback={<Loading size="default" />}>
                  <Tenants />
                </Suspense>
              } />
            </Route>
            <Route path="/admin/users" element={
              <Suspense fallback={<Loading fullScreen />}>
                <SuperAdminLayout />
              </Suspense>
            }>
              <Route index element={
                <Suspense fallback={<Loading size="default" />}>
                  <Users />
                </Suspense>
              } />
            </Route>
            
            {/* Payment Result Pages - public routes for Stripe redirects */}
            <Route path="/payments/success" element={
              <Suspense fallback={<Loading fullScreen />}>
                <PaymentSuccess />
              </Suspense>
            } />
            <Route path="/payments/cancelled" element={
              <Suspense fallback={<Loading fullScreen />}>
                <PaymentCancelled />
              </Suspense>
            } />

            {/* Clinic selection - requires auth but no clinic context */}
            <Route
              path="/select-clinic"
              element={
                <ProtectedRoute requireClinic={false}>
                  <PageErrorBoundary>
                    <ClinicSelection />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* Protected dashboard routes with role-based access */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - accessible to all authenticated users */}
              <Route index element={
                <PageErrorBoundary>
                  <Dashboard />
                </PageErrorBoundary>
              } />

              {/* Dental AI X-ray Analysis - requires xray_analysis.view permission */}
              <Route
                path="xray-analysis"
                element={
                  <RequirePermission permissions="xray_analysis.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <XrayAnalysis />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* AI Test Report Analysis - requires test_reports.view permission */}
              <Route
                path="ai-test-analysis"
                element={
                  <RequirePermission permissions="test_reports.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <AITestAnalysis />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* AI Test Report Comparison - requires test_reports.view permission */}
              <Route
                path="ai-test-comparison"
                element={
                  <RequirePermission permissions="test_reports.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <AITestComparison />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Settings - requires settings.view permission */}
              <Route
                path="settings"
                element={
                  <RequirePermission permissions="settings.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Settings />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />






              {/* Patients - requires patients.view permission */}
              <Route
                path="patients"
                element={
                  <RequirePermission permissions="patients.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Patients />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Appointments Table - requires appointments.view permission */}
              <Route
                path="appointments-table"
                element={
                  <RequirePermission permissions="appointments.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <AppointmentsTable />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Appointments Calendar - requires appointments.view permission */}
              <Route
                path="appointments-calendar"
                element={
                  <RequirePermission permissions="appointments.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <AppointmentsCalendar />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Add Appointment - requires appointments.view permission */}
              <Route
                path="add-appointment"
                element={
                  <RequirePermission permissions="appointments.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <AddAppointment />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Leads - requires leads.view permission */}
              <Route
                path="leads"
                element={
                  <RequirePermission permissions="leads.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Leads />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Billing - requires invoice or payment view permissions */}
              <Route
                path="billing"
                element={
                  <RequirePermission permissions={["invoices.view", "payments.view"]} operator="OR">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Billing />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Financial Management - require specific permissions */}
              <Route
                path="invoices"
                element={
                  <RequirePermission permissions="invoices.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Invoices />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              <Route
                path="payments"
                element={
                  <RequirePermission permissions="payments.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Payments />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              <Route
                path="payroll"
                element={
                  <RequirePermission permissions="payroll.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Payroll />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              <Route
                path="expenses"
                element={
                  <RequirePermission permissions="expenses.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Expenses />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              <Route
                path="performance"
                element={
                  <RequirePermission permissions="analytics.reports">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Performance />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Services - requires services.view permission */}
              <Route
                path="services"
                element={
                  <RequirePermission permissions="services.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Services />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Departments - requires departments.view permission */}
              <Route
                path="departments"
                element={
                  <RequirePermission permissions="departments.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Departments />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Clinics - requires clinics.view permission */}
              <Route
                path="clinics"
                element={
                  <RequirePermission permissions="clinics.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Clinics />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Permissions - requires permissions.view permission */}
              <Route
                path="permissions"
                element={
                  <RequirePermission permissions="permissions.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Permissions />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Inventory - requires inventory.view permission */}
              <Route
                path="inventory"
                element={
                  <RequirePermission permissions="inventory.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Inventory />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Staff Management - requires users.view permission */}
              <Route
                path="staff"
                element={
                  <RequirePermission permissions="users.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Staff />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Prescriptions - requires prescriptions.view permission */}
              <Route
                path="prescriptions"
                element={
                  <RequirePermission permissions="prescriptions.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Prescriptions />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Odontograms - requires odontogram.view permission */}
              <Route
                path="odontograms"
                element={
                  <RequirePermission permissions="odontogram.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Odontograms />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Tests - requires tests.view permission */}
              <Route
                path="tests"
                element={
                  <RequirePermission permissions="tests.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Tests />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Test Reports - requires test_reports.view permission */}
              <Route
                path="test-reports"
                element={
                  <RequirePermission permissions="test_reports.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <TestReports />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Lab Vendors - requires lab_vendors.view permission */}
              <Route
                path="lab-vendors"
                element={
                  <RequirePermission permissions="lab_vendors.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <LabVendors />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Test Modules - requires tests.view permission */}
              <Route
                path="test-modules/methodology"
                element={
                  <RequirePermission permissions="tests.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Methodology />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />
              <Route
                path="test-modules/turnaround-time"
                element={
                  <RequirePermission permissions="tests.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <TurnaroundTime />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />
              <Route
                path="test-modules/sample-type"
                element={
                  <RequirePermission permissions="tests.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <SampleType />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />
              <Route
                path="test-modules/category"
                element={
                  <RequirePermission permissions="tests.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Category />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Calendar - requires appointments.view permission */}
              <Route
                path="calendar"
                element={
                  <RequirePermission permissions="appointments.view">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Calendar />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />

              {/* Reports - requires analytics.dashboard permission */}
              <Route
                path="reports"
                element={
                  <RequirePermission permissions={["analytics.dashboard", "analytics.reports"]} operator="OR">
                    <PageErrorBoundary>
                      <Suspense fallback={<Loading size="default" />}>
                        <Analytics />
                      </Suspense>
                    </PageErrorBoundary>
                  </RequirePermission>
                }
              />





              {/* Profile - accessible to all authenticated users */}
              <Route
                path="profile"
                element={
                  <PageErrorBoundary>
                    <Suspense fallback={<Loading size="default" />}>
                      <Profile />
                    </Suspense>
                  </PageErrorBoundary>
                }
              />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </CurrencyProvider>
      </ClinicProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
