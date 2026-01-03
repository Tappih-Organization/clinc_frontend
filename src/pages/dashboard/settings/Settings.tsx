import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Loader2, Save, Settings as SettingsIcon, Building, Clock, DollarSign, Bell, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Import tabs
import ClinicInfoTab from "./ClinicInfoTab";
import WorkingHoursTab from "./WorkingHoursTab";
import FinancialTab from "./FinancialTab";
import NotificationsTab from "./NotificationsTab";
import SecurityTab from "./SecurityTab";

const Settings = () => {
  const { t } = useTranslation();
  const { data: settings, isLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();
  const [activeTab, setActiveTab] = useState("clinic");
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings && !formData) {
      setFormData(settings);
    }
  }, [settings, formData]);

  const handleSave = () => {
    if (!formData) return;

    updateSettings.mutate(formData, {
      onSuccess: () => {
        setHasChanges(false);
        toast({
          title: t("Success"),
          description: t("Settings updated successfully"),
        });
      },
      onError: (error: any) => {
        toast({
          title: t("Error"),
          description: error.response?.data?.message || t("Failed to update settings"),
          variant: "destructive",
        });
      },
    });
  };

  const handleTabChange = (data: any, section: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: data,
    }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">{t("Error")}</CardTitle>
            <CardDescription>
              {t("Failed to load settings. Please try again later.")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            {t("Settings")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("Manage your clinic settings and preferences")}
          </p>
        </div>
        
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            size="lg"
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Saving...")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("Save Changes")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="clinic" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Clinic Info")}</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Working Hours")}</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Financial")}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Notifications")}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Security")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clinic" className="space-y-4">
              <ClinicInfoTab
                data={formData?.clinic}
                onChange={(data) => handleTabChange(data, "clinic")}
              />
            </TabsContent>

            <TabsContent value="hours" className="space-y-4">
              <WorkingHoursTab
                data={formData?.workingHours}
                onChange={(data) => handleTabChange(data, "workingHours")}
              />
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <FinancialTab
                data={formData?.financial}
                onChange={(data) => handleTabChange(data, "financial")}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationsTab
                data={formData?.notifications}
                onChange={(data) => handleTabChange(data, "notifications")}
              />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecurityTab
                data={formData?.security}
                onChange={(data) => handleTabChange(data, "security")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button at Bottom (for mobile) */}
      {hasChanges && (
        <div className="flex justify-end lg:hidden">
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            size="lg"
            className="w-full sm:w-auto"
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Saving...")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("Save Changes")}
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default Settings;

