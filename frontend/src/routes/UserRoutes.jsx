// ✅ Correct UserRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/user/LoginPage";
import UploadPage from "../pages/user/UploadPage";
import RoleChangePage from "../pages/user/RoleChangePage";

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="role-change" element={<RoleChangePage />} />
    </Routes>
  );
};

export default UserRoutes;
