import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import DoctorDashboard from "./DoctorDashboard";
import ReceptionistDashboard from "./ReceptionistDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  // Render role-specific dashboard
  switch (user?.role) {
    case "doctor":
      return <DoctorDashboard />;
    case "receptionist":
      return <ReceptionistDashboard />;
    case "nurse":
      return <ReceptionistDashboard />; // Nurses use similar interface to reception
    case "accountant":
      return <AdminDashboard />; // Accountants use admin-like dashboard with financial focus
    case "staff":
      return <AdminDashboard />; // Staff use admin-like dashboard with financial focus
    case "admin":
    default:
      return <AdminDashboard />;
  }
};

export default Dashboard;
