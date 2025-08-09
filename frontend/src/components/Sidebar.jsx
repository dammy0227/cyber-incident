import React from "react";
import "./Sidebar.css";

const Sidebar = ({ onTabChange, activeTab }) => {
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
      </ul>
    </div>
  );
};

export default Sidebar;
