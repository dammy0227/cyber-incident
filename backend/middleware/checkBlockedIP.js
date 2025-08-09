// middleware/checkBlockedIP.js
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const Incident = require("../models/Incident");
const sendDiscordAlert = require("../utils/sendDiscordAlert");

// In-memory sliding-window counters
// Structure: { "<user>@<ip>@<action>": [timestamp, timestamp, ...] }
const actionCounters = {};

// helper to get client IP
const getRequestIP = (req) =>
  req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

// helper: check if time "HH:MM" is within window (inclusive)
function isWithinWindow(nowDate, fromStr, toStr) {
  if (!fromStr || !toStr) return true;
  // parse HH:MM
  const [fromH, fromM] = fromStr.split(":").map(Number);
  const [toH, toM] = toStr.split(":").map(Number);

  const nowH = nowDate.getHours();
  const nowMin = nowDate.getMinutes();

  const nowMinutes = nowH * 60 + nowMin;
  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;

  if (fromMinutes <= toMinutes) {
    // same day window
    return nowMinutes >= fromMinutes && nowMinutes <= toMinutes;
  } else {
    // overnight window (e.g., 22:00 - 06:00)
    return nowMinutes >= fromMinutes || nowMinutes <= toMinutes;
  }
}

// helper: sliding window add & check
function recordAndCheckQuota(key, windowSeconds, maxAllowed) {
  const now = Date.now();
  const arr = actionCounters[key] || [];
  // keep only timestamps within windowSeconds
  const cutoff = now - windowSeconds * 1000;
  const filtered = arr.filter((t) => t >= cutoff);
  filtered.push(now);
  actionCounters[key] = filtered;
  return filtered.length <= maxAllowed;
}

module.exports = async (req, res, next) => {
  try {
    const ip = getRequestIP(req);
    const user = req.body.user || req.query.user || "Unknown";
    const actionType = (() => {
      if (req.path.includes("/login")) return "login";
      if (req.path.includes("/upload")) return "upload";
      if (req.path.includes("/role-change")) return "role_change";
      return "action";
    })();

    // 1) If IP is blocked => deny immediately and log incident once
    const blocked = await BlockedIP.findOne({ ip });
    if (blocked) {
      // create an incident (avoid duplicates by checking last incident)
      const incident = await Incident.create({
        user,
        ip,
        type: "blocked_attempt",
        reason: "Blocked IP attempted an action",
        severity: "high",
        threat: true,
      });

      // send discord alert for blocked attempt (admin already blocked; this is new attempt)
      try {
        await sendDiscordAlert(incident);
      } catch (err) {
        console.error("Failed to send discord alert for blocked attempt:", err.message);
      }

      return res.status(403).json({
        message: "Your IP is blocked. Access denied.",
      });
    }

    // 2) If this user+ip is in TrustedIP, check windows and quotas
    const trustedEntry = await TrustedIP.findOne({ user, ip });

    if (trustedEntry) {
      // 2a) time window enforcement
      const now = new Date();
      if (
        trustedEntry.allowedFrom &&
        trustedEntry.allowedTo &&
        !isWithinWindow(now, trustedEntry.allowedFrom, trustedEntry.allowedTo)
      ) {
        return res.status(403).json({
          message:
            "Access is not allowed at this time. Please try within the allowed window.",
        });
      }

      // 2b) quota enforcement
      const windowSeconds = trustedEntry.quotaWindowSeconds || 3600;

      if (trustedEntry.maxLoginsPerWindow && actionType === "login") {
        const key = `${user}@${ip}@login`;
        const ok = recordAndCheckQuota(
          key,
          windowSeconds,
          trustedEntry.maxLoginsPerWindow
        );
        if (!ok) {
          return res.status(429).json({
            message:
              "Too many login attempts for this trusted IP in the configured time window.",
          });
        }
      }

      if (trustedEntry.maxUploadsPerWindow && actionType === "upload") {
        const key = `${user}@${ip}@upload`;
        const ok = recordAndCheckQuota(
          key,
          windowSeconds,
          trustedEntry.maxUploadsPerWindow
        );
        if (!ok) {
          return res.status(429).json({
            message:
              "Too many uploads for this trusted IP in the configured time window.",
          });
        }
      }

      if (trustedEntry.maxRoleChangesPerWindow && actionType === "role_change") {
        const key = `${user}@${ip}@role_change`;
        const ok = recordAndCheckQuota(
          key,
          windowSeconds,
          trustedEntry.maxRoleChangesPerWindow
        );
        if (!ok) {
          return res.status(429).json({
            message:
              "Too many role change attempts for this trusted IP in the configured time window.",
          });
        }
      }
    }

    // 3) For non-trusted IPs we don't enforce trusted quotas - next middleware/controller will do AI checks
    next();
  } catch (err) {
    console.error("Blocked IP check error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
