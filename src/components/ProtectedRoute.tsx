import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic, useClinicSelected } from "@/contexts/ClinicContext";
import { clinicCookies } from "@/utils/cookies";
import Loading from "@/components/ui/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "super_admin" | "admin" | "doctor" | "nurse" | "staff" | "receptionist" | "accountant";
  requireClinic?: boolean; // Whether this route requires clinic selection
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireClinic = true,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { loading: clinicLoading, userClinics, hasRole, hasPermission } = useClinic();
  const isClinicSelected = useClinicSelected();

  console.log('🛡️ ProtectedRoute - State:', {
    authLoading,
    clinicLoading,
    isAuthenticated,
    isClinicSelected,
    requireClinic,
    userClinicsLength: userClinics.length,
    user: user?.email || null,
    cookie_clinic_id: clinicCookies.getClinicId(),
    cookie_clinic_token: !!clinicCookies.getClinicToken()
  });

  // Show loading if auth is loading or clinic is loading
  // Critical: Wait for auth to complete before making any decisions
  if (authLoading || (requireClinic && clinicLoading)) {
    console.log('🛡️ ProtectedRoute - Showing loading screen', { authLoading, clinicLoading });
    return <Loading fullScreen />;
  }

  // Check authentication first
  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute - Not authenticated, redirecting to login');
    // Store the current location so we can redirect back after login
    const currentPath = location.pathname + location.search;
    if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    return <Navigate to="/login" replace />;
  }

  // Check clinic requirements
  if (requireClinic) {
    console.log('🛡️ ProtectedRoute - Clinic required, checking conditions');
    
    // If user has no clinics, redirect to clinic selection page
    if (userClinics.length === 0 && !clinicLoading) {
      console.log('🛡️ ProtectedRoute - No clinics available, redirecting to /select-clinic');
      // Store the current location so we can redirect back after clinic selection
      const currentPath = location.pathname + location.search;
      if (currentPath !== '/select-clinic') {
        sessionStorage.setItem('redirectAfterClinicSelection', currentPath);
      }
      return <Navigate to="/select-clinic" replace />;
    }

    // If clinic is required but not selected, redirect to clinic selection
    // Only redirect if we're sure clinic loading is complete and user has clinics
    // Also check cookies directly to avoid race condition on refresh
    const hasClinicInCookies = !!clinicCookies.getClinicId() && !!clinicCookies.getClinicToken();
    const shouldRedirect = !isClinicSelected && !clinicLoading && userClinics.length > 0 && !hasClinicInCookies;
    
    if (shouldRedirect) {
      console.log('🛡️ ProtectedRoute - Clinic not selected, redirecting to /select-clinic');
      // Store the current location so we can redirect back after clinic selection
      const currentPath = location.pathname + location.search;
      if (currentPath !== '/select-clinic') {
        sessionStorage.setItem('redirectAfterClinicSelection', currentPath);
      }
      return <Navigate to="/select-clinic" replace />;
    }

    console.log('🛡️ ProtectedRoute - Clinic requirements handled');
    
    // Check clinic-specific role if required
    if (requiredRole && !hasRole([requiredRole, 'super_admin', 'admin'])) {
      console.log('🛡️ ProtectedRoute - Role check failed');
      return (
        <div className="w-full flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">
              You don't have the required role ({requiredRole}) in this clinic.
            </p>
          </div>
        </div>
      );
    }
  } else {
    console.log('🛡️ ProtectedRoute - Clinic not required');
    // For routes that don't require clinic context, use global role check
    if (requiredRole && user?.role !== requiredRole && user?.role !== "super_admin" && user?.role !== "admin") {
      console.log('🛡️ ProtectedRoute - Global role check failed');
      return (
        <div className="w-full flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  console.log('🛡️ ProtectedRoute - All checks passed, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
