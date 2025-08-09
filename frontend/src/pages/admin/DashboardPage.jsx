import React, { useState } from "react";
import "./DashboardPage.css"; // Import CSS
import Sidebar from "../../components/Sidebar";
import IncidentsPage from "./IncidentsPage";
import BlockedIPsPage from "./BlockedIPsPage";
import TrustedIPsPage from "./TrustedIPsPage";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("incidents");

  const renderContent = () => {
    switch (activeTab) {
      case "incidents":
        return <IncidentsPage />;
      case "blocked":
        return <BlockedIPsPage />;
      case "trusted":
        return <TrustedIPsPage />;
      default:
        return <p>Welcome to the Admin Dashboard.</p>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
          <Sidebar onTabChange={setActiveTab} activeTab={activeTab} />
      </div>

      <div className="dashboard-main">
        <div className="main-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default DashboardPage;
