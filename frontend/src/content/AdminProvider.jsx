// content/AdminProvider.jsx
import React, { useState } from "react";
import AdminContext from "./AdminContext";

const AdminProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = (adminToken) => {
    setToken(adminToken);
    setIsAdmin(true);
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ token, isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
