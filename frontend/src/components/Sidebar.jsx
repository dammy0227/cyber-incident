// src/components/admin/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import useAdmin from "../content/useAdmin"; // ✅ useAdmin hook
import "./Sidebar.css";

const Sidebar = ({ onTabChange, activeTab }) => {
  const navigate = useNavigate();
  const { logout } = useAdmin(); // ✅ get logout from context

  const handleLogout = () => {
    logout(); // clear token + isAdmin
    navigate("/admin/login"); // redirect to login page
  };

  return (
    <div className="sidebar">
      <h3>Admin Menu</h3>
      <ul>
        <li
          className={activeTab === "incidents" ? "active" : ""}
          onClick={() => onTabChange("incidents")}
        >
          View Incidents
        </li>
        <li
          className={activeTab === "blocked" ? "active" : ""}
          onClick={() => onTabChange("blocked")}
        >
          View Blocked IPs
        </li>
        <li
          className={activeTab === "trusted" ? "active" : ""}
          onClick={() => onTabChange("trusted")}
        >
          View Trusted IPs
        </li>

        {/* ✅ Logout instead of switch */}
        <li onClick={handleLogout} className="logout-link">
          <FaSignOutAlt style={{ marginRight: "8px" }} />
          Logout
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
