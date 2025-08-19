import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import UploadPage from "./UploadPage";
import RoleChangePage from "./RoleChangePage";
import ComputerScienceInfo from "./ComputerScienceInfo";
import useUser from "../../content/useUser"; 
import { checkUserStatus } from "../../api/userApi"; 

const UserDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("csinfo"); 
  const { email, logout } = useUser();
  const navigate = useNavigate();

  // 🚨 Auto-check if user is blocked
  useEffect(() => {
    if (!email) return;

    const interval = setInterval(async () => {
      try {
        const res = await checkUserStatus(email);
        if (res.data.blocked) {
          alert(`🚫 You have been blocked by Admin. Reason: ${res.data.reason}`);
          logout();
          navigate("/user/login");
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    }, 5000); // check every 5s

    return () => clearInterval(interval);
  }, [email, logout, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case "csinfo":
        return <ComputerScienceInfo />;
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
