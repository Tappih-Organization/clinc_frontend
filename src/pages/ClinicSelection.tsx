import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, MapPin, Phone, Mail, Users, Clock, ChevronRight, Lock, Plus, RefreshCw, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import { Skeleton } from '@/components/ui/skeleton';
import { useClinic, useClinicSelection } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PublicHeader from '@/components/layout/PublicHeader';
import apiService from '@/services/api';
import AddClinicModal from '@/components/modals/AddClinicModal';
import { clinicCookies } from '@/utils/cookies';
import { useIsRTL } from '@/hooks/useIsRTL';
import { cn } from '@/lib/utils';


// Clinic interface for forms (based on backend model)
interface Clinic {
  id: string;
  name: string;
  code: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    working_hours: {
      monday: { start: string; end: string; isWorking: boolean };
      tuesday: { start: string; end: string; isWorking: boolean };
      wednesday: { start: string; end: string; isWorking: boolean };
      thursday: { start: string; end: string; isWorking: boolean };
      friday: { start: string; end: string; isWorking: boolean };
      saturday: { start: string; end: string; isWorking: boolean };
      sunday: { start: string; end: string; isWorking: boolean };
    };
  };
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}


const ClinicSelection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectClinic, refreshClinics } = useClinic();
  const { userClinics, loading: userClinicsLoading, requiresSelection, hasClinics } = useClinicSelection();
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRTL = useIsRTL();

  // Debug modal state in console
  console.log('🎭 ClinicSelection render - Modal state:', { isAddModalOpen, userClinicsLoading, hasClinics });

  // Removed admin check - all authenticated users can create clinics


  // Refresh functionality
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Manual refresh triggered...');
      await refreshClinics();
      console.log('✅ Manual refresh completed');
      toast.success(t('Clinics refreshed successfully'));
    } catch (error) {
      console.error('Error refreshing clinics:', error);
      toast.error(t('Failed to refresh clinics'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add new clinic functionality (similar to Clinics.tsx)
  const handleAddClinic = async (clinicData: Omit<Clinic, "id" | "createdAt" | "updatedAt">) => {
    try {
      // Clean up contact data - only include website if it has a value
      const contactData = {
        phone: clinicData.contact.phone,
        email: clinicData.contact.email,
        ...(clinicData.contact.website && clinicData.contact.website.trim() && {
          website: clinicData.contact.website.trim()
        })
      };

      const createRequest = {
        name: clinicData.name,
        code: clinicData.code,
        description: clinicData.description,
        address: clinicData.address,
        contact: contactData,
        settings: clinicData.settings,
        is_active: clinicData.is_active,
      };

      console.log('🏥 Creating clinic...');
      const response = await apiService.createClinic(createRequest);
      console.log('✅ Clinic created successfully:', response);
      
      setIsAddModalOpen(false);
      toast.success(`${clinicData.name} ${t('has been successfully added.')}`);
      
      // Refresh the clinic list to show the newly created clinic
      console.log('🔄 Refreshing clinic list...');
      await refreshClinics();
      console.log('✅ Clinic list refreshed');
      
      // Auto-select the newly created clinic if user has no other clinics
      if (userClinics.length === 0 && response.data?._id) {
        console.log('🎯 Auto-selecting newly created clinic:', response.data._id);
        try {
          const success = await selectClinic(response.data._id);
          if (success) {
            console.log('✅ Auto-selection successful, checking for redirect path');
            toast.success(t('Clinic selected successfully'));
            // Check if there's a stored redirect path
            const redirectPath = sessionStorage.getItem('redirectAfterClinicSelection');
            if (redirectPath) {
              sessionStorage.removeItem('redirectAfterClinicSelection');
              navigate(redirectPath, { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error('❌ Auto-selection failed:', error);
          // Don't show error toast - clinic was created successfully
        }
      }
      
    } catch (error: any) {
      console.error('Error adding clinic:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => `${err.path}: ${err.msg}`).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(error.response?.data?.message || 'Failed to add clinic. Please try again.');
      }
    }
  };


  // REMOVED: Auto-redirect to dashboard
  // Users must always manually select a clinic, even if they have one selected
  // This ensures they see the clinic selection page every time they log in
  // The redirect will only happen after they manually click to select a clinic

  // REMOVED: Auto-open modal for users when no clinics are available
  // Users must manually click the "Create New Clinic" button to open the form
  // This provides better user experience and prevents unwanted modal popups

  const handleSelectClinic = async (clinicId: string, hasAccess: boolean) => {
    if (!hasAccess) {
      toast.error(t('You do not have access to this clinic. Contact your administrator.'));
      return;
    }

    try {
      setIsSelecting(true);
      setSelectedClinicId(clinicId);

      console.log('🎯 ClinicSelection - Starting clinic selection:', clinicId);
      const success = await selectClinic(clinicId);
      
      if (success) {
        console.log('✅ ClinicSelection - Clinic selected successfully');
        toast.success(t('Clinic selected successfully'));
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if there's a stored redirect path
        const redirectPath = sessionStorage.getItem('redirectAfterClinicSelection');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterClinicSelection');
          console.log('📍 ClinicSelection - Redirecting to stored path:', redirectPath);
          navigate(redirectPath, { replace: true });
        } else {
          console.log('📍 ClinicSelection - Redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else {
        console.error('❌ ClinicSelection - selectClinic returned false');
        toast.error(t('Failed to select clinic. Please try again.'));
      }
    } catch (error: any) {
      console.error('❌ ClinicSelection - Error selecting clinic:', error);
      
      // Provide more specific error messages
      let errorMessage = t('Failed to select clinic');
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSelecting(false);
      setSelectedClinicId(null);
    }
  };

  const getClinicInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatAddress = (clinic: any): string => {
    const addr = clinic.address;
    return `${addr.city}, ${addr.state}`;
  };

  const getRoleBadgeColor = (role: string): string => {
    const colors: { [key: string]: string } = {
      super_admin: 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border-red-300 dark:border-red-700 font-bold',
      admin: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
      doctor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      nurse: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      receptionist: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      accountant: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      staff: 'bg-muted text-muted-foreground border-border'
    };
    return colors[role] || colors.staff;
  };

  // Show loading state while clinics are being fetched
  // This prevents showing "No Clinics Available" before data is loaded
  if (userClinicsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <PublicHeader showActions={false} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header Skeleton */}
          <div className="mb-10">
            <div className="flex flex-col space-y-6 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-10 w-64" />
                </div>
                <Skeleton className="h-5 w-96 ml-12" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>

          {/* Clinic Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-4 flex-1">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="space-y-2 pt-2 border-t">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="pt-4 border-t">
                    <Skeleton className="h-11 w-full rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Only show "No Clinics Available" after loading is complete and there are truly no clinics
  if (!hasClinics && !userClinicsLoading) {
    console.log('📋 No clinics page - Modal state:', { 
      isAddModalOpen, 
      userClinicsLoading, 
      hasClinics,
      userClinicsLength: userClinics.length
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <PublicHeader showActions={false} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="border-2 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center space-y-4 pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                >
                  <Building2 className="h-10 w-10 text-primary" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">{t('No Clinics Available')}</CardTitle>
                  <CardDescription className="text-base">
                    {t("You don't have access to any clinics yet. Create a new clinic to get started with your practice.")}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={() => {
                      console.log('🎯 Create New Clinic button clicked (no clinics page)');
                      setIsAddModalOpen(true);
                    }}
                    className="w-full h-12 text-base font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                    size="lg"
                  >
                    <Plus className={cn("h-5 w-5", isRTL ? "ml-2" : "mr-2")} />
                    {t('Create New Clinic')}
                  </Button>
                </motion.div>
                <Button 
                  variant="outline" 
                  className="w-full h-11"
                  onClick={() => navigate('/login')}
                >
                  {t('Back to Login')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Modal should be here for no-clinics case */}
        <AddClinicModal 
          isOpen={isAddModalOpen}
          onClose={() => {
            console.log('🔒 Modal close triggered (no clinics page)');
            setIsAddModalOpen(false);
          }}
          onSubmit={handleAddClinic}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicHeader showActions={false} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-col space-y-6 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {t('Select Your Clinic')}
                </h1>
              </div>
              <p className="text-muted-foreground text-base sm:text-lg ml-12">
                {t('You have access to')} <span className="font-semibold text-primary">{userClinics.filter(uc => uc.hasRelationship).length}</span> {t('clinic')}{userClinics.filter(uc => uc.hasRelationship).length !== 1 ? t('s') : ''}. 
                {t(' Choose one to continue to your dashboard.')}
              </p>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-3 sm:ml-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || userClinicsLoading}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin", isRTL ? "ml-2" : "mr-2")} />
                {t('Refresh')}
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => {
                    console.log('🎯 Add Clinic button clicked');
                    setIsAddModalOpen(true);
                  }}
                  disabled={userClinicsLoading}
                  className="shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t('Add Clinic')}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {userClinics.map((userClinic, index) => {
            const clinic = userClinic.clinic_id;
            const isCurrentlySelecting = selectedClinicId === clinic._id;
            const hasAccess = userClinic.hasRelationship === true;

            return (
              <motion.div
                key={clinic._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={hasAccess ? { y: -4 } : {}}
                className="h-full"
              >
                <Card 
                  className={`h-full transition-all duration-300 relative overflow-hidden border-2 ${
                    hasAccess 
                      ? 'hover:shadow-2xl hover:border-primary/50 cursor-pointer group bg-card' 
                      : 'opacity-60 cursor-not-allowed bg-muted/20 border-muted'
                  } ${isCurrentlySelecting ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => !isSelecting && handleSelectClinic(clinic._id, hasAccess)}
                >
                  {/* Gradient overlay on hover */}
                  {hasAccess && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  )}

                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <motion.div
                          whileHover={hasAccess ? { scale: 1.1, rotate: 5 } : {}}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Avatar className={`h-14 w-14 border-2 ${
                            hasAccess 
                              ? 'border-primary/20 group-hover:border-primary/40' 
                              : 'border-muted'
                          } transition-colors`}>
                            <AvatarFallback className={`font-bold text-lg ${
                              hasAccess 
                                ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {getClinicInitials(clinic.name)}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className={`text-xl font-bold transition-colors truncate ${
                              hasAccess 
                                ? 'group-hover:text-primary' 
                                : 'text-muted-foreground'
                            }`}>
                              {clinic.name}
                            </CardTitle>
                            {!hasAccess && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                            {clinic.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {hasAccess && userClinic.role && (
                          <Badge className={`${getRoleBadgeColor(userClinic.role)} shadow-sm`}>
                            {userClinic.role}
                          </Badge>
                        )}
                        {!hasAccess && (
                          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border">
                            {t('No Access')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 relative z-10">
                    {clinic.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {clinic.description}
                      </p>
                    )}

                    <div className="space-y-2.5 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        <MapPin className="h-4 w-4 text-primary/60 flex-shrink-0" />
                        <span className="truncate">{formatAddress(clinic)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        <Phone className="h-4 w-4 text-primary/60 flex-shrink-0" />
                        <span className="truncate">{clinic.contact.phone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        <Mail className="h-4 w-4 text-primary/60 flex-shrink-0" />
                        <span className="truncate">{clinic.contact.email}</span>
                      </div>

                      {hasAccess && userClinic.joined_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <Clock className="h-3.5 w-3.5 text-primary/60" />
                          <span>{t('Joined')} {new Date(userClinic.joined_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      {!hasAccess && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <Lock className="h-3.5 w-3.5" />
                          <span>{t('Contact administrator for access')}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <motion.div
                        whileHover={hasAccess && !isSelecting ? { scale: 1.02 } : {}}
                        whileTap={hasAccess && !isSelecting ? { scale: 0.98 } : {}}
                      >
                        <Button 
                          className={`w-full h-11 font-semibold transition-all ${
                            hasAccess 
                              ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl' 
                              : ''
                          }`}
                          variant={
                            !hasAccess 
                              ? "secondary" 
                              : isCurrentlySelecting 
                                ? "default" 
                                : "default"
                          }
                          disabled={isSelecting || !hasAccess}
                        >
                          {isCurrentlySelecting ? (
                            <>
                              <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                              {t('Selecting...')}
                            </>
                          ) : !hasAccess ? (
                            <>
                              <Lock className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                              {t('No Access')}
                            </>
                          ) : (
                            <>
                              {t('Access Clinic')}
                              <ArrowRight className={cn("h-4 w-4 group-hover:translate-x-1 transition-transform", isRTL ? "mr-2 group-hover:-translate-x-1" : "ml-2")} />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <Sparkles className="h-4 w-4 text-primary/60" />
            <p className="text-sm text-muted-foreground">
              {t('Need access to another clinic? Contact your administrator.')}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Add Clinic Modal - Available for users with clinics */}
      <AddClinicModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          console.log('🔒 Modal close triggered');
          setIsAddModalOpen(false);
        }}
        onSubmit={handleAddClinic}
      />
    </div>
  );
};

export default ClinicSelection; 