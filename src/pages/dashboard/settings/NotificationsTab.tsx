import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Mail, MessageSquare, Calendar, DollarSign, Package, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NotificationsTabProps {
  data: any;
  onChange: (data: any) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    paymentReminders: true,
    lowStockAlerts: true,
    systemAlerts: true,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data]);

  const handleToggle = (key: string) => {
    const newData = {
      ...notifications,
      [key]: !notifications[key as keyof typeof notifications],
    };
    setNotifications(newData);
    onChange(newData);
  };

  const notificationItems = [
    {
      key: "emailNotifications",
      icon: Mail,
      title: "Email Notifications",
      titleAr: "إشعارات البريد الإلكتروني",
      description: "Send notifications via email to users and patients",
      descriptionAr: "إرسال الإشعارات عبر البريد الإلكتروني للمستخدمين والمرضى",
      color: "text-blue-500",
      badge: "Core",
    },
    {
      key: "smsNotifications",
      icon: MessageSquare,
      title: "SMS Notifications",
      titleAr: "إشعارات الرسائل النصية",
      description: "Send notifications via SMS for urgent messages",
      descriptionAr: "إرسال الإشعارات عبر الرسائل النصية للرسائل العاجلة",
      color: "text-green-500",
      badge: "Premium",
    },
    {
      key: "appointmentReminders",
      icon: Calendar,
      title: "Appointment Reminders",
      titleAr: "تذكيرات المواعيد",
      description: "Automatically remind patients about upcoming appointments",
      descriptionAr: "تذكير المرضى تلقائياً بالمواعيد القادمة",
      color: "text-purple-500",
      badge: "Essential",
    },
    {
      key: "paymentReminders",
      icon: DollarSign,
      title: "Payment Reminders",
      titleAr: "تذكيرات الدفع",
      description: "Send reminders for pending and overdue payments",
      descriptionAr: "إرسال تذكيرات للمدفوعات المعلقة والمتأخرة",
      color: "text-amber-500",
      badge: "Essential",
    },
    {
      key: "lowStockAlerts",
      icon: Package,
      title: "Low Stock Alerts",
      titleAr: "تنبيهات المخزون المنخفض",
      description: "Alert staff when inventory items are running low",
      descriptionAr: "تنبيه الموظفين عند انخفاض مستوى المخزون",
      color: "text-orange-500",
      badge: "Important",
    },
    {
      key: "systemAlerts",
      icon: AlertCircle,
      title: "System Alerts",
      titleAr: "تنبيهات النظام",
      description: "Critical system notifications and security alerts",
      descriptionAr: "إشعارات النظام الحرجة والتنبيهات الأمنية",
      color: "text-red-500",
      badge: "Critical",
    },
  ];

  const getActiveCount = () => {
    return Object.values(notifications).filter((v) => v === true).length;
  };

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case "Critical":
        return "destructive";
      case "Essential":
        return "default";
      case "Premium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t("Notification Settings")}
              </CardTitle>
              <CardDescription>
                {t("Configure how and when you receive notifications")}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {getActiveCount()}/6 {t("Active")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationItems.map((item) => {
            const Icon = item.icon;
            const isActive = notifications[item.key as keyof typeof notifications];

            return (
              <Card
                key={item.key}
                className={`transition-all ${
                  isActive
                    ? "border-primary/50 bg-primary/5"
                    : "border-muted"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-background ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={item.key}
                          className="text-base font-medium cursor-pointer"
                        >
                          {t(item.title)}
                        </Label>
                        <Badge variant={getBadgeVariant(item.badge)} className="text-xs">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t(item.description)}
                      </p>
                    </div>
                    <Switch
                      id={item.key}
                      checked={isActive}
                      onCheckedChange={() => handleToggle(item.key)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{t("Email Configuration")}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("Emails are sent automatically when enabled. Make sure your SMTP settings are configured correctly.")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{t("SMS Integration")}</h4>
                <p className="text-xs text-muted-foreground">
                  {t("SMS notifications require a third-party service integration (Twilio, Nexmo, etc.).")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("Active Notifications Summary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificationItems.map((item) => {
              const isActive = notifications[item.key as keyof typeof notifications];
              const Icon = item.icon;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span className={isActive ? "font-medium" : "text-muted-foreground"}>
                      {t(item.title)}
                    </span>
                  </div>
                  <Badge variant={isActive ? "default" : "outline"} className="text-xs">
                    {isActive ? t("Active") : t("Disabled")}
                  </Badge>
                </div>
              );
            })}

            {getActiveCount() === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t("No notifications are currently active")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;

