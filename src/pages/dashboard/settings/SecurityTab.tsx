import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Clock, Database, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecurityTabProps {
  data: any;
  onChange: (data: any) => void;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    backupFrequency: "daily",
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    const newData = {
      ...formData,
      [field]: value,
    };
    setFormData(newData);
    onChange(newData);
  };

  const getSessionTimeoutLabel = () => {
    if (formData.sessionTimeout < 60) {
      return `${formData.sessionTimeout} ${t("minutes")}`;
    } else {
      const hours = Math.floor(formData.sessionTimeout / 60);
      const mins = formData.sessionTimeout % 60;
      return mins > 0 
        ? `${hours}h ${mins}m` 
        : `${hours} ${t("hours")}`;
    }
  };

  const getPasswordExpiryLabel = () => {
    return `${formData.passwordExpiry} ${t("days")}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("Security Settings")}
          </CardTitle>
          <CardDescription>
            {t("Configure security and authentication settings for your clinic")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Two-Factor Authentication */}
          <Card className={formData.twoFactorAuth ? "border-primary/50 bg-primary/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-background">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="twoFactorAuth" className="text-base font-medium cursor-pointer">
                        {t("Two-Factor Authentication (2FA)")}
                      </Label>
                      <Badge variant={formData.twoFactorAuth ? "default" : "secondary"}>
                        {formData.twoFactorAuth ? t("Enabled") : t("Disabled")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("Add an extra layer of security by requiring a verification code")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={formData.twoFactorAuth}
                  onCheckedChange={(checked) => handleChange("twoFactorAuth", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Session Timeout */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                {t("Session Timeout")}
              </Label>
              <span className="text-sm font-medium">{getSessionTimeoutLabel()}</span>
            </div>
            <Slider
              value={[formData.sessionTimeout]}
              onValueChange={([value]) => handleChange("sessionTimeout", value)}
              min={15}
              max={480}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15 {t("min")}</span>
              <span>4 {t("hours")}</span>
              <span>8 {t("hours")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Users will be automatically logged out after this period of inactivity")}
            </p>
          </div>

          {/* Password Expiry */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                {t("Password Expiry")}
              </Label>
              <span className="text-sm font-medium">{getPasswordExpiryLabel()}</span>
            </div>
            <Slider
              value={[formData.passwordExpiry]}
              onValueChange={([value]) => handleChange("passwordExpiry", value)}
              min={30}
              max={365}
              step={30}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30 {t("days")}</span>
              <span>180 {t("days")}</span>
              <span>365 {t("days")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Users will be required to change their password after this period")}
            </p>
          </div>

          {/* Backup Frequency */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              {t("Automatic Backup Frequency")}
            </Label>
            <RadioGroup
              value={formData.backupFrequency}
              onValueChange={(value) => handleChange("backupFrequency", value)}
              className="space-y-3"
            >
              <Card className={formData.backupFrequency === "daily" ? "border-primary" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t("Daily")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("Backup every day at midnight")}
                          </p>
                        </div>
                        <Badge variant="default">{t("Recommended")}</Badge>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className={formData.backupFrequency === "weekly" ? "border-primary" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{t("Weekly")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("Backup every Sunday at midnight")}
                        </p>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className={formData.backupFrequency === "monthly" ? "border-primary" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{t("Monthly")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("Backup on the first day of each month")}
                        </p>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="font-medium text-sm">{t("Security Best Practices")}</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("Enable Two-Factor Authentication for all admin users")}</li>
                <li>{t("Use a session timeout of 60 minutes or less for sensitive data")}</li>
                <li>{t("Require password changes every 90 days")}</li>
                <li>{t("Keep daily backups for at least 30 days")}</li>
                <li>{t("Regularly review user access and permissions")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("Security Summary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>{t("Two-Factor Authentication")}</span>
              </div>
              <Badge variant={formData.twoFactorAuth ? "default" : "outline"}>
                {formData.twoFactorAuth ? t("Enabled") : t("Disabled")}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{t("Session Timeout")}</span>
              </div>
              <span className="font-medium">{getSessionTimeoutLabel()}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>{t("Password Expiry")}</span>
              </div>
              <span className="font-medium">{getPasswordExpiryLabel()}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span>{t("Backup Frequency")}</span>
              </div>
              <span className="font-medium capitalize">{t(formData.backupFrequency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;

