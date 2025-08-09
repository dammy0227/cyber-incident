// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminProvider from "./content/AdminProvider";
import UserProvider from "./content/UserProvider";
import io from "socket.io-client";

import AdminLoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserDashboardPage from "./pages/user/UserDashboardPage";
import useUser from "./content/useUser";
import './App.css'
// Create socket outside component so it’s stable
const socket = io(import.meta.env.VITE_API_BASE_URL);

const AppRoutes = () => {
  const { logout } = useUser();

  useEffect(() => {
    socket.on("forceLogout", () => {
      alert("⚠️ You have been logged out due to a security restriction.");
      logout();
    });

    return () => {
      socket.off("forceLogout");
    };
  }, [logout]);

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/" element={<UserDashboardPage />} /> 
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AdminProvider>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </AdminProvider>
    </BrowserRouter>
  );
};

export default App;
