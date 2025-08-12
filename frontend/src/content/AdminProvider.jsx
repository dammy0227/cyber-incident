import React, { useState, useEffect } from "react";
import AdminContext from "./AdminContext";

const AdminProvider = ({ children }) => {
  // Initialize from localStorage, or fallback to null/false
  const [token, setToken] = useState(() => localStorage.getItem("adminToken"));
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem("adminToken"));

  const login = (adminToken) => {
    setToken(adminToken);
    setIsAdmin(true);
    localStorage.setItem("adminToken", adminToken);
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem("adminToken");
  };

  // Optional: Sync with localStorage if token changes outside of login/logout
  useEffect(() => {
    if (token) {
      localStorage.setItem("adminToken", token);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [token]);

  return (
    <AdminContext.Provider value={{ token, isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
