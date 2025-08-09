import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLoginPage from "../pages/admin/LoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import IncidentsPage from "../pages/admin/IncidentsPage";
import BlockedIPsPage from "../pages/admin/BlockedIPsPage";
import TrustedIPsPage from "../pages/admin/TrustedIPsPage";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="incidents" element={<IncidentsPage />} />
      <Route path="blocked-ips" element={<BlockedIPsPage />} />
      <Route path="trusted-ips" element={<TrustedIPsPage />} />
    </Routes>
  );
};

export default AdminRoutes;
