const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");

// For simulating login attempt counts
const loginAttempts = {}; // { "user@ip": [timestamps] }

const analyzeEvent = async ({ user, ip, type, file, roleChange }) => {
  const key = `${user}@${ip}`;

  // 1. Blocked IP check
  const isBlocked = await BlockedIP.findOne({ ip });
  if (isBlocked) {
    return {
      threat: true,
      reason: "Blocked IP address attempted action",
      severity: "high",
    };
  }

  // 2. Unusual login hour (only applies to login)
  if (type === "login") {
    const hour = new Date().getHours();
    if (hour < 5 || hour > 23) {
      return {
        threat: true,
        reason: "Login attempt at unusual hour",
        severity: "medium",
      };
    }
  }

  // 3. Login from unknown IP (check from DB instead of hardcoded list)
  const trustedEntries = await TrustedIP.find({ user });
  const userKnownIPs = trustedEntries.map(entry => entry.ip);

  if (!userKnownIPs.includes(ip)) {
    return {
      threat: true,
      reason: "Login from unknown IP address",
      severity: "medium",
    };
  }

  // 4. File upload: check type and size
  if (type === "upload" && file) {
    const { size, name } = file;
    const allowedExtensions = [".pdf", ".docx", ".jpg"];
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return {
        threat: true,
        reason: `Suspicious file type uploaded: ${ext}`,
        severity: "medium",
      };
    }

    if (size > 5 * 1024 * 1024) {
      return {
        threat: true,
        reason: "File upload too large (> 5MB)",
        severity: "medium",
      };
    }
  }

  // 5. Role escalation
  if (type === "role_change" && roleChange) {
    const { oldRole, newRole } = roleChange;
    if (oldRole !== "admin" && newRole === "admin") {
      return {
        threat: true,
        reason: "Unauthorized role escalation attempt to admin",
        severity: "high",
      };
    }
  }

  // 6. Rate limiting: too many login attempts
  if (type === "login") {
    const now = Date.now();
    const window = 60 * 1000; // 1 minute window
    loginAttempts[key] = loginAttempts[key] || [];

    // Keep only attempts in last 1 minute
    loginAttempts[key] = loginAttempts[key].filter(t => now - t < window);
    loginAttempts[key].push(now);

    if (loginAttempts[key].length > 5) {
      return {
        threat: true,
        reason: "Too many login attempts in short time (rate limit)",
        severity: "high",
      };
    }
  }

  // ✅ No threat detected
  return {
    threat: false,
  };
};

module.exports = analyzeEvent;
