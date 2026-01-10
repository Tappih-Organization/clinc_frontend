import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface CRMSettingsTabProps {
  data?: any;
  onChange?: (data: any) => void;
}

const CRMSettingsTab: React.FC<CRMSettingsTabProps> = ({ data, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t("CRM Settings")}
          </CardTitle>
          <CardDescription>
            {t("Configure CRM settings and preferences")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t("Coming Soon")}</p>
            <p className="text-sm">{t("CRM settings will be available here soon")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMSettingsTab;

