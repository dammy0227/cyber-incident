import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa"; // shield icon

const UserSidebar = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <h3>User Menu</h3>
      <ul>
        <li
          className={activeTab === "login" ? "active" : ""}
          onClick={() => onTabChange("login")}
        >
          👤 Login
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

        {/* Switch to Admin Dashboard */}
        <li onClick={() => navigate("/admin/login")} className="switch-link">
          <FaShieldAlt style={{ marginRight: "8px" }} />
          Switch to Admin View
        </li>
      </ul>
    </div>
  );
};

export default UserSidebar;
