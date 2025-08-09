import React from "react";

const UserSidebar = ({ activeTab, onTabChange }) => {
  return (
    <div className="sidebar">
      <h3>User Menu</h3>
      <ul>
        <li
          className={activeTab === "login" ? "active" : ""}
          onClick={() => onTabChange("login")} // ✅ fixed casing
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
      </ul>
    </div>
  );
};

export default UserSidebar;
