import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = ({ onTabChange, activeTab }) => {
  const navigate = useNavigate();

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

        {/* Switch to User Dashboard */}
        <li onClick={() => navigate("/")} className="switch-link">
          <FaUser style={{ marginRight: "8px" }} />
          Switch to User View
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
