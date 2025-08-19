// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminProvider from "./content/AdminProvider";
import UserProvider from "./content/UserProvider";

import AdminLoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UserDashboardPage from "./pages/user/UserDashboardPage";
import UserLoginPage from "./pages/user/LoginPage";

import useAdmin from "./content/useAdmin";
import useUser from "./content/useUser";
import './App.css';

// ✅ ProtectedRoute for admin
const AdminProtected = ({ children }) => {
  const { isAdmin } = useAdmin();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

// ✅ ProtectedRoute for attacker
const UserProtected = ({ children }) => {
  const { email } = useUser();
  return email ? children : <Navigate to="/user/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtected>
            <DashboardPage />
          </AdminProtected>
        }
      />

      {/* Attacker routes */}
      <Route path="/user/login" element={<UserLoginPage />} />
      <Route
        path="/user/dashboard"
        element={
          <UserProtected>
            <UserDashboardPage />
          </UserProtected>
        }
      />

      {/* Default route: send attackers to login */}
      <Route path="/" element={<Navigate to="/user/login" replace />} />
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
