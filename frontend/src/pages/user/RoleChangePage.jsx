import React, { useState } from "react";
import useUser from "../../content/useUser";
import { changeRole } from "../../api/userApi";
import './dashboards.css';

const RoleChangePage = () => {
  const { email: userEmail } = useUser();
  const [oldRole, setOldRole] = useState("");
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userEmail || !oldRole || !newRole) {
      alert("Please fill in all fields including your email.");
      return;
    }

    if (oldRole.trim() === newRole.trim()) {
      alert("Old role and new role cannot be the same.");
      return;
    }

    setLoading(true);

    try {
      const res = await changeRole(userEmail, oldRole, newRole);

      if (res.data.restricted) {
        alert(res.data.message);
        return; // Stop here if restricted, don't clear form
      }

      alert("✅ Role change simulated.");
      // Clear inputs after successful submission
      setOldRole("");
      setNewRole("");
    } catch (err) {
      alert("❌ Failed to simulate role change.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-change-container">
      <h2>🛠 Simulate Role Change</h2>
      <form onSubmit={handleSubmit} className="role-change-form">
        <input
          placeholder="Old Role"
          value={oldRole}
          onChange={(e) => setOldRole(e.target.value)}
          className="role-input"
          disabled={loading}
        />
        <input
          placeholder="New Role"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          className="role-input"
          disabled={loading}
        />
        <button type="submit" className="role-button" disabled={loading}>
          {loading ? "Changing Role..." : "Change Role"}
        </button>
      </form>
    </div>
  );
};

export default RoleChangePage;
