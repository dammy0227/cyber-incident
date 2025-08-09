import React, { useState } from "react";
import UserSidebar from "./UserSidebar";
import UploadPage from "./UploadPage";
import RoleChangePage from "./RoleChangePage";
import UserLoginPage from "./LoginPage";

const UserDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("login"); // default tab

  const renderContent = () => {
    switch (activeTab) {
      case "login":
        return <UserLoginPage />;
      case "upload":
        return <UploadPage />;
      case "role":
        return <RoleChangePage />;
      default:
        return <p>Welcome to the User Attack Simulation Dashboard.</p>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <UserSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="dashboard-main">
        <div className="main-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
