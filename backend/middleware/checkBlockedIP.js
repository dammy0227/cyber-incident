// middleware/checkBlockedIP.js
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const Incident = require("../models/Incident");
const sendDiscordAlert = require("../utils/sendDiscordAlert");

// In-memory sliding-window counters
const actionCounters = {};

const getRequestIP = (req) =>
  req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

function isWithinWindow(nowDate, fromStr, toStr) {
  if (!fromStr || !toStr) return true;
  const [fromH, fromM] = fromStr.split(":").map(Number);
  const [toH, toM] = toStr.split(":").map(Number);
  const nowH = nowDate.getHours();
  const nowMin = nowDate.getMinutes();

  const nowMinutes = nowH * 60 + nowMin;
  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;

  if (fromMinutes <= toMinutes) {
    return nowMinutes >= fromMinutes && nowMinutes <= toMinutes;
  } else {
    return nowMinutes >= fromMinutes || nowMinutes <= toMinutes;
  }
}

function recordAndCheckQuota(key, windowSeconds, maxAllowed) {
  const now = Date.now();
  const arr = actionCounters[key] || [];
  const cutoff = now - windowSeconds * 1000;
  const filtered = arr.filter((t) => t >= cutoff);
  filtered.push(now);
  actionCounters[key] = filtered;
  return filtered.length <= maxAllowed;
}

module.exports = async (req, res, next) => {
  try {
    // 🚨 Skip IP enforcement entirely for admin login endpoint
    if (req.originalUrl.startsWith("/api/auth/login")) {
      return next();
    }

    const ip = getRequestIP(req);
    const user = req.body.user || req.query.user || "Unknown";

    const actionType = (() => {
      if (req.path.includes("/login")) return "login";
      if (req.path.includes("/upload")) return "upload";
      if (req.path.includes("/role-change")) return "role_change";
      return "action";
    })();

    // 1) Blocked IP check
    const blocked = await BlockedIP.findOne({ ip });
    if (blocked) {
      const incident = await Incident.create({
        user,
        ip,
        type: "blocked_attempt",
        reason: "Blocked IP attempted an action",
        severity: "high",
        threat: true,
      });
      try {
        await sendDiscordAlert(incident);
      } catch (err) {
        console.error("Failed to send discord alert:", err.message);
      }
      return res.status(403).json({ message: "Your IP is blocked. Access denied." });
    }

    // 2) Trusted IP checks
    const trustedEntry = await TrustedIP.findOne({ user, ip });
    if (trustedEntry) {
      const now = new Date();
      if (
        trustedEntry.allowedFrom &&
        trustedEntry.allowedTo &&
        !isWithinWindow(now, trustedEntry.allowedFrom, trustedEntry.allowedTo)
      ) {
        return res.status(403).json({
          message: "Access is not allowed at this time. Please try within the allowed window.",
        });
      }

      const windowSeconds = trustedEntry.quotaWindowSeconds || 3600;

      if (trustedEntry.maxLoginsPerWindow && actionType === "login") {
        const key = `${user}@${ip}@login`;
        if (!recordAndCheckQuota(key, windowSeconds, trustedEntry.maxLoginsPerWindow)) {
          return res.status(429).json({
            message: "Too many login attempts for this trusted IP in the configured time window.",
          });
        }
      }

      if (trustedEntry.maxUploadsPerWindow && actionType === "upload") {
        const key = `${user}@${ip}@upload`;
        if (!recordAndCheckQuota(key, windowSeconds, trustedEntry.maxUploadsPerWindow)) {
          return res.status(429).json({
            message: "Too many uploads for this trusted IP in the configured time window.",
          });
        }
      }

      if (trustedEntry.maxRoleChangesPerWindow && actionType === "role_change") {
        const key = `${user}@${ip}@role_change`;
        if (!recordAndCheckQuota(key, windowSeconds, trustedEntry.maxRoleChangesPerWindow)) {
          return res.status(429).json({
            message: "Too many role change attempts for this trusted IP in the configured time window.",
          });
        }
      }
    }

    // 3) Continue to next middleware
    next();
  } catch (err) {
    console.error("Blocked IP check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
