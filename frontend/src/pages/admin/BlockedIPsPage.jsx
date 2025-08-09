import React, { useEffect, useState } from "react";
import {
  getBlockedIPs,
  blockIP,
  getTrustedIPs,
  fetchIncidents,
} from "../../api/adminApi";
import "./BlockedIPs.css";


const BlockedIPsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [trusted, setTrusted] = useState([]);

  const loadData = async () => {
    try {
      const [incidentRes, blockedRes, trustedRes] = await Promise.all([
        fetchIncidents(),
        getBlockedIPs(),
        getTrustedIPs(),
      ]);

      setIncidents(incidentRes.data);
      setBlocked(blockedRes.data.map((entry) => entry.ip));
      setTrusted(trustedRes.data.map((entry) => `${entry.user}@${entry.ip}`));
    } catch (err) {
      console.error("❌ Failed to load data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBlock = async (ip) => {
    try {
      await blockIP(ip);
      await loadData();
    } catch (err) {
      console.error("❌ Failed to block IP", err);
    }
  };

  const suspiciousUntrusted = incidents.filter((incident) => {
    if (!incident.threat) return false;
    const key = `${incident.user}@${incident.ip}`;
    return !trusted.includes(key);
  });

return (
  <div className="blocked-ips-container">
    <h2>🚨 Suspicious Activity</h2>

    {suspiciousUntrusted.length === 0 ? (
      <p>No suspicious activity from untrusted IPs.</p>
    ) : (
      <div className="table-wrapper">
        <table className="blocked-ip-table">
          <thead>
            <tr>
              <th>User</th>
              <th>IP Address</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {suspiciousUntrusted.map((entry) => {
              const isBlocked = blocked.includes(entry.ip);
              return (
                <tr key={entry._id}>
                  <td>{entry.user}</td>
                  <td>{entry.ip}</td>
                  <td>{entry.reason}</td>
                  <td>{isBlocked ? "Blocked" : "Unblocked"}</td>
                  <td>
                    {isBlocked ? (
                      <button disabled>Blocked</button>
                    ) : (
                      <button onClick={() => handleBlock(entry.ip)}>Block</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

};

export default BlockedIPsPage;
