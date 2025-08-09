import React from "react";
import "./components.css";

const IncidentCard = ({ incident }) => {
  return (
    <div className={`incident-card ${incident.severity}`}>
      <h3>{incident.type.toUpperCase()}</h3>
      <p><strong>User:</strong> {incident.user}</p>
      <p><strong>IP:</strong> {incident.ip}</p>
      <p><strong>Reason:</strong> {incident.reason}</p>
      <p><strong>Severity:</strong> {incident.severity}</p>
      <p><strong>Date:</strong> {new Date(incident.createdAt).toLocaleString()}</p>
    </div>
  );
};

export default IncidentCard;
