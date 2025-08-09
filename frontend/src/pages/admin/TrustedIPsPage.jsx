// src/pages/admin/TrustedIPsPage.jsx
import React, { useEffect, useState } from "react";
import {
  getTrustedIPs,
  addTrustedIP,
  removeTrustedIP,
} from "../../api/adminApi";
import "./TrustedIPsPage.css";

const TrustedIPsPage = () => {
  const [trusted, setTrusted] = useState([]);
  const [user, setUser] = useState("");
  const [ip, setIP] = useState("");

  // Time restrictions
  const [loginStart, setLoginStart] = useState("");
  const [loginEnd, setLoginEnd] = useState("");
  const [uploadStart, setUploadStart] = useState("");
  const [uploadEnd, setUploadEnd] = useState("");
  const [roleStart, setRoleStart] = useState("");
  const [roleEnd, setRoleEnd] = useState("");

  // Limits
  const [maxLogins, setMaxLogins] = useState(3);
  const [maxUploads, setMaxUploads] = useState(5);
  const [maxRoles, setMaxRoles] = useState(2);

  const load = async () => {
    const res = await getTrustedIPs();
    setTrusted(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!user || !ip) {
      alert("Please enter both User and IP Address");
      return;
    }
    await addTrustedIP(user, ip, {
      loginStart, loginEnd,
      uploadStart, uploadEnd,
      roleStart, roleEnd,
      maxLogins, maxUploads, maxRoles
    });
    setUser("");
    setIP("");
    setLoginStart("");
    setLoginEnd("");
    setUploadStart("");
    setUploadEnd("");
    setRoleStart("");
    setRoleEnd("");
    setMaxLogins(3);
    setMaxUploads(5);
    setMaxRoles(2);
    load();
  };

  const handleRemove = async (ipItem) => {
    await removeTrustedIP(ipItem.user, ipItem.ip);
    load();
  };

  return (
    <div className="trusted-container">
      <h2>Trusted IPs & Restrictions</h2>

      <div className="trusted-form">
        {/* User + IP */}
        <div className="form-row">
          <input placeholder="User" value={user} onChange={(e) => setUser(e.target.value)} />
          <input placeholder="IP Address" value={ip} onChange={(e) => setIP(e.target.value)} />
        </div>

        {/* Login restriction */}
        <div className="form-row">
          <label>Login Time</label>
          <input type="time" value={loginStart} onChange={(e) => setLoginStart(e.target.value)} />
          <span>to</span>
          <input type="time" value={loginEnd} onChange={(e) => setLoginEnd(e.target.value)} />
        </div>

        {/* Upload restriction */}
        <div className="form-row">
          <label>Upload Time</label>
          <input type="time" value={uploadStart} onChange={(e) => setUploadStart(e.target.value)} />
          <span>to</span>
          <input type="time" value={uploadEnd} onChange={(e) => setUploadEnd(e.target.value)} />
        </div>

        {/* Role change restriction */}
        <div className="form-row">
          <label>Role Change Time</label>
          <input type="time" value={roleStart} onChange={(e) => setRoleStart(e.target.value)} />
          <span>to</span>
          <input type="time" value={roleEnd} onChange={(e) => setRoleEnd(e.target.value)} />
        </div>

        {/* Limits */}
        <div className="form-row">
          <input type="number" placeholder="Max Logins/day" value={maxLogins} onChange={(e) => setMaxLogins(e.target.value)} />
          <input type="number" placeholder="Max Uploads/day" value={maxUploads} onChange={(e) => setMaxUploads(e.target.value)} />
          <input type="number" placeholder="Max Role Changes/day" value={maxRoles} onChange={(e) => setMaxRoles(e.target.value)} />
        </div>

        <button onClick={handleAdd} className="add-btn">Add Trusted IP</button>
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
                Login: {t.loginStart} - {t.loginEnd} <br />
                Upload: {t.uploadStart} - {t.uploadEnd} <br />
                Role Change: {t.roleStart} - {t.roleEnd} <br />
                Limits: L:{t.maxLogins} / U:{t.maxUploads} / R:{t.maxRoles}
              </td>
              <td>
                <button className="remove-btn" onClick={() => handleRemove(t)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrustedIPsPage;
