import React from "react";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ViewDetails, ViewDetailsField } from "@/components/ViewDetails";

interface ViewDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, any> | null;
  fields: ViewDetailsField[];
}

/**
 * ViewDetailsModal - Wrapper component for backward compatibility
 * Uses the reusable ViewDetails component internally
 */
const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
  open,
  onOpenChange,
  title,
  data,
  fields,
}) => {
  const { t } = useTranslation();
  return (
    <ViewDetails
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t("View complete information and details")}
      icon={Eye}
      data={data}
      fields={fields}
      maxWidth="4xl"
    />
  );
};

export default ViewDetailsModal;
