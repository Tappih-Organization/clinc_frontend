import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import NewAppointmentModal from "@/components/modals/NewAppointmentModal";

const AddAppointment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Open the modal when component mounts
    setIsModalOpen(true);
  }, []);

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    // Navigate back to appointments table when modal closes
    if (!open) {
      navigate("/dashboard/appointments-table");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("Add Appointment")}
        </h1>
        <p className="text-muted-foreground">
          {t("Create a new appointment for a patient")}
        </p>
      </div>

      <NewAppointmentModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </div>
  );
};

export default AddAppointment;
