// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminProvider from "./content/AdminProvider";
import UserProvider from "./content/UserProvider";

import AdminLoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserDashboardPage from "./pages/user/UserDashboardPage";

import './App.css'

const AppRoutes = () => {
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
