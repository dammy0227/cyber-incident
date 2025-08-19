// src/components/user/UserSidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBook } from "react-icons/fa"; // logout + book icon
import useUser from "../../content/useUser";


const UserSidebar = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { logout } = useUser(); // ✅ logout from context

  const handleLogout = () => {
    logout();
    navigate("/"); // redirect back to login (or home page)
  };

  return (
    <div className="sidebar">
      <h3>User Menu</h3>
      <ul>
          <li
          className={activeTab === "csinfo" ? "active" : ""}
          onClick={() => onTabChange("csinfo")}
        >
          <FaBook style={{ marginRight: "8px" }} />
          Computer Science Info
        </li>
        <li
          className={activeTab === "upload" ? "active" : ""}
          onClick={() => onTabChange("upload")}
        >
          📤 Upload File
        </li>
        <li
          className={activeTab === "role" ? "active" : ""}
          onClick={() => onTabChange("role")}
        >
          🛠 Role Change Attack
        </li>

        {/* ✅ New Computer Science Info Page */}

        {/* ✅ Logout */}
        <li onClick={handleLogout} className="logout-link">
          <FaSignOutAlt style={{ marginRight: "8px" }} />
          Logout
        </li>
      </ul>
    </div>
  );
};

export default UserSidebar;
