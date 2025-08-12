// src/pages/admin/TrustedIPsPage.jsx
import React, { useEffect, useState } from "react";
import useAdminApi from "../../api/adminApi";
import "./TrustedIPsPage.css";

const TrustedIPsPage = () => {
  const {
    getTrustedIPs,
    addTrustedIP,
    removeTrustedIP,
  } = useAdminApi();

  const [trusted, setTrusted] = useState([]);
  const [user, setUser] = useState("");
  const [ip, setIP] = useState("");

  // Time restrictions renamed to backend keys
  const [allowedFrom, setAllowedFrom] = useState(""); // login window start
  const [allowedTo, setAllowedTo] = useState("");     // login window end

  // Upload time window (optional, adapt backend if needed)
  const [uploadAllowedFrom, setUploadAllowedFrom] = useState("");
  const [uploadAllowedTo, setUploadAllowedTo] = useState("");

  // Role change time window (optional, adapt backend if needed)
  const [roleAllowedFrom, setRoleAllowedFrom] = useState("");
  const [roleAllowedTo, setRoleAllowedTo] = useState("");

  // Limits
  const [maxLoginsPerWindow, setMaxLoginsPerWindow] = useState(3);
  const [maxUploadsPerWindow, setMaxUploadsPerWindow] = useState(5);
  const [maxRoleChangesPerWindow, setMaxRoleChangesPerWindow] = useState(2);

  // Load trusted IPs
  const load = async () => {
    try {
      const res = await getTrustedIPs();
      setTrusted(res.data);
    } catch (err) {
      console.error("❌ Failed to load trusted IPs", err);
    }
  };

useEffect(() => {
  const load = async () => {
    try {
      const res = await getTrustedIPs();
      setTrusted(res.data);
    } catch (err) {
      console.error("❌ Failed to load trusted IPs", err);
    }
  };

  load();
}, [getTrustedIPs]);

  // Add trusted IP handler
  const handleAdd = async () => {
    if (!user || !ip) {
      alert("Please enter both User and IP Address");
      return;
    }

    try {
      await addTrustedIP(user, ip, {
        allowedFrom,
        allowedTo,
        uploadAllowedFrom,
        uploadAllowedTo,
        roleAllowedFrom,
        roleAllowedTo,
        maxLoginsPerWindow: Number(maxLoginsPerWindow),
        maxUploadsPerWindow: Number(maxUploadsPerWindow),
        maxRoleChangesPerWindow: Number(maxRoleChangesPerWindow),
      });

      // Reset form
      setUser("");
      setIP("");
      setAllowedFrom("");
      setAllowedTo("");
      setUploadAllowedFrom("");
      setUploadAllowedTo("");
      setRoleAllowedFrom("");
      setRoleAllowedTo("");
      setMaxLoginsPerWindow(3);
      setMaxUploadsPerWindow(5);
      setMaxRoleChangesPerWindow(2);

      load();
    } catch (err) {
      console.error("❌ Failed to add trusted IP", err);
      alert("Failed to add trusted IP");
    }
  };

  // Remove trusted IP handler
  const handleRemove = async (ipItem) => {
    try {
      await removeTrustedIP(ipItem.user, ipItem.ip);
      load();
    } catch (err) {
      console.error("❌ Failed to remove trusted IP", err);
      alert("Failed to remove trusted IP");
    }
  };

  return (
    <div className="trusted-container">
      <h2>Trusted IPs & Restrictions</h2>

      <div className="trusted-form">
        {/* User + IP */}
        <div className="form-row">
          <input
            placeholder="User"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            placeholder="IP Address"
            value={ip}
            onChange={(e) => setIP(e.target.value)}
          />
        </div>

        {/* Login restriction */}
        <div className="form-row">
          <label>Login Time</label>
          <input
            type="time"
            value={allowedFrom}
            onChange={(e) => setAllowedFrom(e.target.value)}
          />
          <span>to</span>
          <input
            type="time"
            value={allowedTo}
            onChange={(e) => setAllowedTo(e.target.value)}
          />
        </div>

        {/* Upload restriction */}
        <div className="form-row">
          <label>Upload Time</label>
          <input
            type="time"
            value={uploadAllowedFrom}
            onChange={(e) => setUploadAllowedFrom(e.target.value)}
          />
          <span>to</span>
          <input
            type="time"
            value={uploadAllowedTo}
            onChange={(e) => setUploadAllowedTo(e.target.value)}
          />
        </div>

        {/* Role change restriction */}
        <div className="form-row">
          <label>Role Change Time</label>
          <input
            type="time"
            value={roleAllowedFrom}
            onChange={(e) => setRoleAllowedFrom(e.target.value)}
          />
          <span>to</span>
          <input
            type="time"
            value={roleAllowedTo}
            onChange={(e) => setRoleAllowedTo(e.target.value)}
          />
        </div>

        {/* Limits */}
        <div className="form-row">
          <input
            type="number"
            placeholder="Max Logins per Window"
            value={maxLoginsPerWindow}
            onChange={(e) => setMaxLoginsPerWindow(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Uploads per Window"
            value={maxUploadsPerWindow}
            onChange={(e) => setMaxUploadsPerWindow(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Role Changes per Window"
            value={maxRoleChangesPerWindow}
            onChange={(e) => setMaxRoleChangesPerWindow(e.target.value)}
          />
        </div>

        <button onClick={handleAdd} className="add-btn">
          Add Trusted IP
        </button>
      </div>

      <table className="trusted-table">
        <thead>
          <tr>
            <th>User</th>
            <th>IP Address</th>
            <th>Restrictions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {trusted.map((t, idx) => (
            <tr key={idx}>
              <td>{t.user}</td>
              <td>{t.ip}</td>
              <td>
                Login: {t.allowedFrom || "N/A"} - {t.allowedTo || "N/A"} <br />
                Upload: {t.uploadAllowedFrom || "N/A"} - {t.uploadAllowedTo || "N/A"} <br />
                Role Change: {t.roleAllowedFrom || "N/A"} - {t.roleAllowedTo || "N/A"} <br />
                Limits: L: {t.maxLoginsPerWindow ?? "N/A"} / U: {t.maxUploadsPerWindow ?? "N/A"} / R: {t.maxRoleChangesPerWindow ?? "N/A"}
              </td>
              <td>
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(t)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrustedIPsPage;
