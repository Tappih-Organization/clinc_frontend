import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import apiService from '../services/api';
import { clinicCookies } from '@/utils/cookies';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Address {
  street: string;
  city: string;
  neighborhood?: string;
  country: string;
  // Legacy fields (keeping for backward compatibility)
  state?: string;
  zipCode?: string;
}

export interface Contact {
  phone: string;
  email: string;
  website?: string;
}

export interface WorkingHours {
  monday: { start: string; end: string; isWorking: boolean; };
  tuesday: { start: string; end: string; isWorking: boolean; };
  wednesday: { start: string; end: string; isWorking: boolean; };
  thursday: { start: string; end: string; isWorking: boolean; };
  friday: { start: string; end: string; isWorking: boolean; };
  saturday: { start: string; end: string; isWorking: boolean; };
  sunday: { start: string; end: string; isWorking: boolean; };
}

export interface ClinicSettings {
  timezone: string;
  currency: string;
  language: string;
  working_hours: WorkingHours;
}

export interface Clinic {
  _id: string;
  name: string;
  code: string;
  description?: string;
  address: Address;
  contact: Contact;
  settings: ClinicSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserClinicRelation {
  _id: string | null;
  user_id: string;
  clinic_id: Clinic;
  role: 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'accountant' | 'staff';
  permissions: string[];
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
  hasRelationship?: boolean; // Flag to indicate if actual UserClinic relationship exists
}

interface ClinicContextType {
  // Current state
  currentClinic: Clinic | null;
  userClinics: UserClinicRelation[];
  currentUserClinic: UserClinicRelation | null;
  loading: boolean;
  error: string | null;

  // Actions
  selectClinic: (clinicId: string) => Promise<boolean>;
  switchClinic: (clinicId: string) => Promise<boolean>;
  clearClinicSelection: () => Promise<void>;
  refreshClinics: () => Promise<void>;
  refreshCurrentClinic: () => Promise<void>;

  // Utilities
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  isClinicAdmin: () => boolean;
  getClinicRole: () => string | null;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider: React.FC<ClinicProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  // Initialize from cache if available to avoid loading screen on refresh
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(() => {
    try {
      const cached = localStorage.getItem('cached_current_clinic');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [userClinics, setUserClinics] = useState<UserClinicRelation[]>(() => {
    try {
      const cached = localStorage.getItem('cached_user_clinics');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [currentUserClinic, setCurrentUserClinic] = useState<UserClinicRelation | null>(() => {
    try {
      const cached = localStorage.getItem('cached_current_user_clinic');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearError = () => setError(null);

  const handleError = (error: any, message: string = 'An error occurred') => {
    console.error(message, error);
    setError(error?.response?.data?.message || message);
  };

  // ============================================================================
  // CORE FUNCTIONS
  // ============================================================================

    /**
   * Load current clinic details
   */
  const loadCurrentClinic = async (): Promise<void> => {
    try {
      // Migrate from localStorage to cookies if needed
      clinicCookies.migrateFromLocalStorage();
      
      const selectedClinicId = clinicCookies.getClinicId();
      const clinicToken = clinicCookies.getClinicToken();
      
      console.log('🏥 loadCurrentClinic - Starting:', { selectedClinicId: !!selectedClinicId, clinicToken: !!clinicToken });
      
      if (!selectedClinicId || !clinicToken) {
        console.log('🏥 loadCurrentClinic - No clinic ID or token in cookies');
        setCurrentClinic(null);
        setCurrentUserClinic(null);
        setLoading(false);
        return;
      }
      
      // Set loading to true immediately when we have cookies but clinic not loaded yet
      // This prevents race condition where ProtectedRoute checks before clinic is loaded
      if (!currentClinic && selectedClinicId && clinicToken) {
        setLoading(true);
      }

      // Try to load clinic details from API
      try {
        console.log('🏥 loadCurrentClinic - Attempting API call to /user/current-clinic');
        const response = await apiService.get('/user/current-clinic');
        const clinicData = response.data;
        
        console.log('🏥 loadCurrentClinic - API call successful:', clinicData.clinic?.name);
        setCurrentClinic(clinicData.clinic);
        const userClinicData = {
          ...clinicData,
          clinic_id: clinicData.clinic
        };
        setCurrentUserClinic(userClinicData);
        // Cache the data for instant loading on refresh
        localStorage.setItem('cached_current_clinic', JSON.stringify(clinicData.clinic));
        localStorage.setItem('cached_current_user_clinic', JSON.stringify(userClinicData));
      } catch (apiError: any) {
        console.warn('🏥 loadCurrentClinic - API call failed:', apiError?.response?.status, apiError?.message);
        
        // Only clear cookies for definitive auth/permission errors
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          console.log('🏥 loadCurrentClinic - Auth error, clearing cookies');
          clinicCookies.clearClinicData();
          setCurrentClinic(null);
          setCurrentUserClinic(null);
          setLoading(false);
          return;
        }
        
        // For other errors (network, 500, etc.), create a minimal clinic object from cookies
        // This allows the user to continue using the app even if the API is temporarily down
        if (selectedClinicId && clinicToken) {
          console.log('🏥 loadCurrentClinic - Using fallback clinic data from cookies');
          
          // Create a minimal clinic object with all required properties
          const fallbackClinic: Clinic = {
            _id: selectedClinicId,
            name: t('Selected Clinic'), // Will be updated when API is available
            code: 'TEMP',
            description: t('Clinic data temporarily unavailable'),
            address: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            },
            contact: {
              phone: '',
              email: ''
            },
            settings: {
              timezone: 'UTC',
              currency: 'USD',
              language: 'en',
              working_hours: {
                monday: { start: '09:00', end: '17:00', isWorking: true },
                tuesday: { start: '09:00', end: '17:00', isWorking: true },
                wednesday: { start: '09:00', end: '17:00', isWorking: true },
                thursday: { start: '09:00', end: '17:00', isWorking: true },
                friday: { start: '09:00', end: '17:00', isWorking: true },
                saturday: { start: '09:00', end: '17:00', isWorking: false },
                sunday: { start: '09:00', end: '17:00', isWorking: false }
              }
            },
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const fallbackUserClinic: UserClinicRelation = {
            _id: null,
            user_id: user?.id || '',
            clinic_id: fallbackClinic,
            role: 'staff',
            permissions: [],
            is_active: true,
            joined_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            hasRelationship: false
          };
          
          setCurrentClinic(fallbackClinic);
          setCurrentUserClinic(fallbackUserClinic);
          console.log('🏥 loadCurrentClinic - Fallback clinic set successfully');
          setLoading(false); // Fallback clinic set
        } else {
          // No valid localStorage data
          console.log('🏥 loadCurrentClinic - No valid localStorage data available');
          setCurrentClinic(null);
          setCurrentUserClinic(null);
          setLoading(false);
        }
      }

    } catch (error) {
      console.error('🏥 loadCurrentClinic - Unexpected error:', error);
      // Don't clear localStorage for general errors
      setCurrentClinic(null);
      setCurrentUserClinic(null);
      setLoading(false);
    }
  };

  /**
   * Load user's clinics from the API
   */
  const loadUserClinics = async (): Promise<void> => {
    try {
      // Only set loading if we don't have cached data
      // This prevents showing loading screen on refresh when data is already cached
      const hasCachedData = userClinics.length > 0 || localStorage.getItem('cached_user_clinics');
      if (!hasCachedData) {
        setLoading(true);
      }
      clearError();

      console.log('🏥 loadUserClinics - Starting');
      
      // Load user clinics and current clinic in parallel for better performance
      const [clinicsResponse, currentClinicResult] = await Promise.allSettled([
        apiService.get('/user/clinics'),
        loadCurrentClinic()
      ]);
      
      // Handle user clinics response
      let clinicsData: UserClinicRelation[] = [];
      if (clinicsResponse.status === 'fulfilled') {
        clinicsData = clinicsResponse.value.data || [];
        console.log('🏥 loadUserClinics - Got clinics data:', clinicsData.length);
        setUserClinics(clinicsData);
        // Cache the data
        localStorage.setItem('cached_user_clinics', JSON.stringify(clinicsData));
      } else {
        console.error('🏥 loadUserClinics - Failed to load clinics:', clinicsResponse.reason);
        handleError(clinicsResponse.reason, 'Failed to load clinics');
        setUserClinics([]);
      }
      
      // Handle current clinic result (already handled in loadCurrentClinic, but log if failed)
      if (currentClinicResult.status === 'rejected') {
        console.warn('🏥 loadUserClinics - Current clinic load failed:', currentClinicResult.reason);
      } else {
        console.log('🏥 loadUserClinics - Current clinic loaded');
      }
      
      // REMOVED: Auto-selection of clinic
      // Users must always manually select a clinic from the selection page
      // This ensures they see the clinic selection page every time they log in

    } catch (error) {
      console.error('🏥 loadUserClinics - Error:', error);
      handleError(error, 'Failed to load clinics');
      setUserClinics([]);
      
      // Still try to load current clinic even if userClinics failed
      // This handles cases where clinic selection API works but user clinics API doesn't
      try {
        console.log('🏥 loadUserClinics - Attempting current clinic load after error');
        await loadCurrentClinic();
      } catch (currentClinicError) {
        console.error('🏥 loadUserClinics - Current clinic load also failed:', currentClinicError);
      }
        } finally {
      console.log('🏥 loadUserClinics - Setting loading to false');
      setLoading(false);
    }
  };

  /**
   * Select a clinic and update the session
   */
  const selectClinic = async (clinicId: string): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      // Debug: Check if we have auth token before making the request
      const currentToken = clinicCookies.getClinicToken();
      console.log('🏥 selectClinic - About to make select-clinic request:', {
        clinicId,
        hasToken: !!currentToken,
        tokenPreview: currentToken ? `${currentToken.substring(0, 20)}...` : 'none',
        isAuthenticated,
        userExists: !!user
      });

      // Check if we have authentication
      if (!currentToken || !clinicCookies.hasAuthToken()) {
        console.error('🏥 selectClinic - No auth token available');
        setError('Authentication required. Please log in again.');
        return false;
      }

      if (!clinicCookies.isTokenValid()) {
        console.error('🏥 selectClinic - Invalid token format');
        setError('Invalid authentication token. Please log in again.');
        clinicCookies.clearClinicData();
        return false;
      }

      if (!isAuthenticated || !user) {
        console.error('🏥 selectClinic - User not authenticated');
        setError('Please log in to select a clinic.');
        return false;
      }

      const response = await apiService.post('/user/select-clinic', {
        clinic_id: clinicId
      });

      console.log('🏥 selectClinic - API response:', {
        hasResponse: !!response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        hasSuccess: response?.success,
        hasData: !!response?.data,
        hasToken: !!response?.data?.token,
        hasClinic: !!response?.data?.clinic,
        fullResponse: JSON.stringify(response, null, 2)
      });

      // Check if response has success property
      // apiService.post returns response.data, so response is the full API response object
      if (response && (response.success === true || response.success === undefined)) {
        // The data is in response.data (since apiService.post already extracts response.data)
        const responseData = response.data;
        
        console.log('🏥 selectClinic - Response data:', {
          hasResponseData: !!responseData,
          responseDataType: typeof responseData,
          responseDataKeys: responseData ? Object.keys(responseData) : [],
          hasToken: !!responseData?.token,
          hasClinic: !!responseData?.clinic,
          tokenType: typeof responseData?.token,
          clinicType: typeof responseData?.clinic,
          clinicIsObject: responseData?.clinic && typeof responseData.clinic === 'object'
        });
        
        if (!responseData || !responseData.token) {
          console.error('🏥 selectClinic - No token in response', {
            responseData,
            response,
            responseKeys: response ? Object.keys(response) : []
          });
          setError('Invalid response from server. Please try again.');
          return false;
        }

        if (!responseData.clinic) {
          console.error('🏥 selectClinic - No clinic data in response', {
            responseData,
            response,
            responseKeys: response ? Object.keys(response) : []
          });
          setError('Invalid clinic data received. Please try again.');
          return false;
        }

        console.log('🏥 selectClinic - Success, updating clinic data');
        // Update clinic data in cookies
        clinicCookies.setClinicData(clinicId, responseData.token);

        // Update state
        setCurrentClinic(responseData.clinic);

        // Prefer backend-provided role and effective permissions
        const backendRole: string | undefined = responseData.role;
        const backendPermissions: string[] = responseData.permissions || [];

        // Build a fresh relation using backend data
        const relationFromBackend: UserClinicRelation = {
          _id: null,
          user_id: user?.id || '',
          clinic_id: responseData.clinic,
          role: (backendRole as any) || 'staff',
          permissions: backendPermissions,
          is_active: true,
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          hasRelationship: true
        };

        setCurrentUserClinic(relationFromBackend);

        // Cache the clinic data
        localStorage.setItem('cached_current_clinic', JSON.stringify(responseData.clinic));

        return true;
      }

      console.error('🏥 selectClinic - Response indicates failure:', {
        response,
        success: response?.success,
        message: response?.message
      });
      if (response?.message) {
        setError(response.message);
      } else {
        setError('Failed to select clinic. Please try again.');
      }
      return false;
    } catch (error: any) {
      console.error('🏥 selectClinic - Error details:', error);
      
      // Handle 401 specifically
      if (error?.response?.status === 401) {
        console.error('🏥 selectClinic - 401 Unauthorized - clearing auth data');
        setError('Session expired. Please log in again.');
        // Clear authentication data
        clinicCookies.clearClinicData();
        localStorage.removeItem('clinic_user');
        // You might want to trigger a logout here
      } else {
        handleError(error, 'Failed to select clinic');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Switch to a different clinic (alias for selectClinic)
   */
  const switchClinic = async (clinicId: string): Promise<boolean> => {
    return await selectClinic(clinicId);
  };

  /**
   * Clear clinic selection and return to clinic selection state
   */
  const clearClinicSelection = async (): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.post('/user/clear-clinic');

      if (response.success) {
        // Clear clinic data from cookies and update token
        clinicCookies.clearClinicData();
        if (response.data.token) {
          // Set new token without clinic ID
          clinicCookies.getClinicToken = () => null;
          // We only store the token without clinic ID
          document.cookie = `clinic_token=${response.data.token}; path=/; max-age=${30 * 24 * 60 * 60}`;
        }

        // Clear state
        setCurrentClinic(null);
        setCurrentUserClinic(null);
      }
    } catch (error) {
      handleError(error, 'Failed to clear clinic selection');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh user's clinics from the server
   */
  const refreshClinics = async (): Promise<void> => {
    await loadUserClinics();
  };

  /**
   * Refresh current clinic details
   */
  const refreshCurrentClinic = async (): Promise<void> => {
    await loadCurrentClinic();
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Check if user has a specific permission in current clinic
   */
  const hasPermission = (permission: string): boolean => {
    if (!currentUserClinic) return false;
    
    // Super Admin has unrestricted access - bypass all permission checks
    if (user?.role === 'super_admin' || currentUserClinic.role === 'super_admin') {
      return true;
    }
    
    return currentUserClinic.permissions.includes(permission);
  };

  /**
   * Check if user has a specific role in current clinic
   */
  const hasRole = (roles: string | string[]): boolean => {
    if (!currentUserClinic) return false;
    
    // Super Admin has unrestricted access - bypass all role checks
    if (user?.role === 'super_admin' || currentUserClinic.role === 'super_admin') {
      return true;
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(currentUserClinic.role);
  };

  /**
   * Check if user is admin in current clinic
   */
  const isClinicAdmin = (): boolean => {
    return hasRole(['super_admin', 'admin']);
  };

  /**
   * Get user's role in current clinic
   */
  const getClinicRole = (): string | null => {
    return currentUserClinic?.role || null;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initialize clinic context when user authenticates
   */
  useEffect(() => {
    console.log('🏥 ClinicContext useEffect - Triggered:', { 
      isAuthenticated, 
      user: !!user,
      userEmail: user?.email,
      authLoading,
      clinicLoading: loading // Distinguish between auth and clinic loading
    });
    
    // Only proceed if auth is not loading
    if (!authLoading) {
      if (isAuthenticated && user) {
        console.log('🏥 ClinicContext - Starting loadUserClinics');
        loadUserClinics();
      } else {
        console.log('🏥 ClinicContext - Clearing state (not authenticated or no user)');
        // Clear state when user logs out or auth fails
        setUserClinics([]);
        setCurrentClinic(null);
        setCurrentUserClinic(null);
        
        // Only clear cookies if explicitly not authenticated (not just loading)
        if (!isAuthenticated) {
          clinicCookies.clearClinicData();
        }
      }
    } else {
      console.log('🏥 ClinicContext - Auth still loading, waiting...');
    }
  }, [isAuthenticated, user, authLoading]); // Fixed: removed clinic loading from dependencies

  /**
   * Update API service headers when clinic changes
   */
  useEffect(() => {
    const clinicId = clinicCookies.getClinicId();
    if (clinicId) {
      // This will be handled by the API service to add X-Clinic-Id header
      apiService.setClinicId(clinicId);
    } else {
      apiService.clearClinicId();
    }
  }, [currentClinic]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: ClinicContextType = {
    // State
    currentClinic,
    userClinics,
    currentUserClinic,
    loading,
    error,

    // Actions
    selectClinic,
    switchClinic,
    clearClinicSelection,
    refreshClinics,
    refreshCurrentClinic,

    // Utilities
    hasPermission,
    hasRole,
    isClinicAdmin,
    getClinicRole,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook to get clinic-specific permissions
 */
export const useClinicPermissions = () => {
  const { hasPermission, hasRole, isClinicAdmin, getClinicRole, currentUserClinic } = useClinic();

  return {
    hasPermission,
    hasRole,
    isClinicAdmin,
    getClinicRole,
    permissions: currentUserClinic?.permissions || [],
    role: currentUserClinic?.role || null,
  };
};

/**
 * Hook to check if clinic is selected
 */
export const useClinicSelected = () => {
  const { currentClinic, loading } = useClinic();
  
  // Check cookie values
  const selectedClinicId = clinicCookies.getClinicId();
  const clinicToken = clinicCookies.getClinicToken();
  const hasStoredData = !!(selectedClinicId && clinicToken);
  
  console.log('🔍 useClinicSelected - Detailed check:', { 
    currentClinic: currentClinic?.name || null,
    selectedClinicId,
    clinicToken: clinicToken ? `${clinicToken.substring(0, 20)}...` : null,
    hasStoredData,
    loading,
    result: !!currentClinic || hasStoredData
  });
  
  // Return true if we have a currentClinic OR valid cookie data
  return !!currentClinic || hasStoredData;
};

/**
 * Hook for clinic selection state
 */
export const useClinicSelection = () => {
  const { userClinics, currentClinic, selectClinic, loading } = useClinic();
  const isClinicSelected = useClinicSelected();

  // Fixed logic: User requires selection only if they have clinics but no clinic is selected
  // This includes checking both currentClinic state AND cookie data via useClinicSelected
  const requiresSelection = userClinics.length > 0 && !isClinicSelected;
  const hasMultipleClinics = userClinics.length > 1;
  const hasClinics = userClinics.length > 0;

  console.log('🔍 useClinicSelection - Debug:', {
    userClinicsLength: userClinics.length,
    currentClinic: currentClinic?.name || null,
    isClinicSelected,
    requiresSelection,
    loading
  });

  return {
    userClinics,
    currentClinic,
    selectClinic,
    loading,
    requiresSelection,
    hasMultipleClinics,
    hasClinics,
  };
};

export default ClinicContext; 