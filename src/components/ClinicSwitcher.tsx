import React, { useState } from 'react';
import { ChevronDown, Building2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useClinic } from '@/contexts/ClinicContext';
import { toast } from 'sonner';
import { clinicCookies } from '@/utils/cookies';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/hooks/useIsRTL';

const ClinicSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { 
    currentClinic, 
    userClinics, 
    currentUserClinic, 
    switchClinic, 
    loading
  } = useClinic();
  
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);



  const handleSwitchClinic = async (clinicId: string) => {
    if (clinicId === currentClinic?._id) return;

    try {
      setSwitchingTo(clinicId);
      const success = await switchClinic(clinicId);
      
      if (success) {
        toast.success('Clinic switched successfully');
        
        // Refresh the page to ensure all components load data for the new clinic
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small delay to show the success toast
      } else {
        toast.error('Failed to switch clinic');
      }
    } catch (error) {
      console.error('Error switching clinic:', error);
      toast.error('Failed to switch clinic');
    } finally {
      setSwitchingTo(null);
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

  const getRoleBadgeColor = (role: string): string => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
      doctor: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      nurse: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      receptionist: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      accountant: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      staff: 'bg-muted text-muted-foreground border-border'
    };
    return colors[role] || colors.staff;
  };

  // Always show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2 h-10 px-3 bg-muted border border-border rounded-md">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading clinics...</span>
      </div>
    );
  }

  // Filter clinics to only show ones user has access to
  const accessibleClinics = userClinics?.filter(uc => uc.hasRelationship === true) || [];

  // Show message if no clinics are available
  if (!userClinics || userClinics.length === 0) {
    return (
      <div className="flex items-center space-x-2 h-10 px-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <Building2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <span className="text-sm text-yellow-700 dark:text-yellow-300">No clinics available</span>
      </div>
    );
  }

  // Show message if no accessible clinics
  if (accessibleClinics.length === 0) {
    return (
      <div className="flex items-center space-x-2 h-10 px-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
        <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <span className="text-sm text-orange-700 dark:text-orange-300">No clinic access</span>
      </div>
    );
  }

  // Show message if no clinic is selected but clinics are available
  if (!currentClinic) {
    return (
      <div className="flex items-center space-x-2 h-10 px-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-700 dark:text-blue-300">Select a clinic</span>
      </div>
    );
  }

  // Get current user's role in the selected clinic
  const currentUserRole = accessibleClinics.find(uc => uc.clinic_id._id === currentClinic._id)?.role || 'staff';

  // Always show the clinic switcher with all accessible clinics
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-8 px-2.5 bg-background/50 hover:bg-background border border-border/50 rounded-md shadow-sm w-auto min-w-fit justify-start transition-all hover:shadow-md"
          disabled={loading}
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold leading-none">
              {getClinicInitials(currentClinic.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
              {currentClinic.name}
            </span>
            <Badge variant="outline" className={`${getRoleBadgeColor(currentUserRole)} text-[10px] px-1.5 py-0 h-4 leading-none font-medium`}>
              {currentUserRole.replace('_', ' ')}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground/70 font-mono ml-auto">
            {currentClinic.code}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72 p-1.5">
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <DropdownMenuLabel className={cn("font-medium px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-wide", isRTL && "text-right")}>
            {t("Switch Branch")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />

          {accessibleClinics.map((userClinic) => {
          const clinic = userClinic.clinic_id;
          const isCurrentClinic = clinic._id === currentClinic._id;
          const isSwitching = switchingTo === clinic._id;
          const userRole = userClinic.role || 'staff';

          return (
            <DropdownMenuItem
              key={clinic._id}
              className={cn(
                "cursor-pointer px-2 py-1.5 rounded-md transition-colors",
                isCurrentClinic && "bg-primary/5 hover:bg-primary/10",
                !isCurrentClinic && "hover:bg-muted/50"
              )}
              onClick={() => !isCurrentClinic && handleSwitchClinic(clinic._id)}
              disabled={isCurrentClinic || isSwitching}
            >
              <div className={cn("flex items-center gap-2 w-full", isRTL && "flex-row-reverse")}>
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold leading-none">
                    {getClinicInitials(clinic.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                    <p className="text-xs font-medium text-foreground truncate">
                      {clinic.name}
                    </p>
                    <Badge variant="outline" className={`${getRoleBadgeColor(userRole)} text-[10px] px-1.5 py-0 h-4 leading-none font-medium shrink-0`}>
                      {userRole.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className={cn("flex items-center gap-2 mt-0.5", isRTL && "flex-row-reverse")}>
                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                      {clinic.code}
                    </span>
                    {clinic.address && (
                      <span className="text-[10px] text-muted-foreground/60 truncate">
                        {isRTL ? `${clinic.address.city} •` : `• ${clinic.address.city}`}
                      </span>
                    )}
                  </div>
                </div>
                
                {isCurrentClinic && (
                  <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                )}
                {isSwitching && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          );
          })}

          <DropdownMenuSeparator className="my-1" />
          <div className="px-2 py-1.5">
            <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground/70", isRTL && "flex-row-reverse")}>
              <Building2 className="h-3 w-3 shrink-0" />
              <span>
                {accessibleClinics.length} {accessibleClinics.length !== 1 ? t("Branches") : t("Branch")}
                {userClinics && userClinics.length > accessibleClinics.length && (
                  <span className="text-muted-foreground/50"> {isRTL ? `${userClinics.length} من` : `of ${userClinics.length}`}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClinicSwitcher; 