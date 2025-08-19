// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminProvider from "./content/AdminProvider";
import UserProvider from "./content/UserProvider";

import AdminLoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserDashboardPage from "./pages/user/UserDashboardPage";

import useAdmin from "./content/useAdmin"; 
import './App.css';

// ✅ ProtectedRoute wrapper
const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
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
