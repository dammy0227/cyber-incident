// controllers/eventController.js
const Incident = require("../models/Incident");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const analyzeEvent = require("../ai/aiEngine");
const { sendAlertMessage } = require('../discordBot');


const getIP = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return req.connection.remoteAddress || req.ip;
};

async function processIncident(user, ip, type, details) {
  const result = await analyzeEvent({ user, ip, type, ...details });

  const incident = await Incident.create({
    user,
    ip,
    type,
    reason: result.reason || `${type} event`,
    severity: result.severity || "low",
    threat: Boolean(result.threat),
    file: details.file,
    roleChange: details.roleChange,
  });

  // Auto-block if high threat and IP not blocked yet
  if (result.threat && result.severity === "high") {
    const blocked = await BlockedIP.findOne({ ip });
    if (!blocked) {
      await BlockedIP.create({ ip, reason: result.reason });
    }
  }

  return { result, incident };
}

exports.handleLogin = async (req, res) => {
  const { user } = req.body;
  const ip = getIP(req);

  console.log(`[LOGIN] User: ${user} IP: ${ip}`);

  if (!user) return res.status(400).json({ error: "User email required" });

  try {
    // Check if IP or user is blocked
    const blockedEntry = await BlockedIP.findOne({ $or: [{ ip }, { user }] });
    if (blockedEntry) {
      await sendAlertMessage(
        `⛔ **Blocked login attempt**\nUser: ${user}\nIP: ${ip}\nReason: ${blockedEntry.reason || "Blocked by admin"}`
      );
      return res.status(403).json({
        message: "Login denied: user or IP is blocked.",
        ip,
        user,
        reason: blockedEntry.reason || "Blocked by admin",
      });
    }

    // Process incident analysis
    const { result } = await processIncident(user, ip, "login", {});

    // Send Discord alert
    await sendAlertMessage(
      `🔐 **Login attempt**\nUser: ${user}\nIP: ${ip}\nThreat: ${result.threat}\nReason: ${result.reason}`
    );

    if (result.threat && result.severity === "high") {
      const alreadyBlocked = await BlockedIP.findOne({ ip });
      if (!alreadyBlocked) {
        await BlockedIP.create({ ip, reason: result.reason });
      }
      return res.status(403).json({
        message: "Login denied: suspicious activity detected.",
        ip,
        reason: result.reason,
      });
    }

    res.json({
      message: result.threat ? "Suspicious login" : "Login successful",
      threat: result.threat,
      reason: result.reason,
      severity: result.severity,
      ip,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleUpload = async (req, res) => {
  const { user } = req.body;
  const ip = getIP(req);
  const file = req.file;

  if (!user) return res.status(400).json({ error: "User email required" });
  if (!file) return res.status(400).json({ error: "File required" });

  try {
    // Skip AI analysis for trusted IPs
    const trusted = await TrustedIP.findOne({ user, ip });
    if (trusted) {
      await Incident.create({
        user,
        ip,
        type: "upload",
        reason: "Trusted IP upload - bypass AI",
        severity: "low",
        threat: false,
        file: { name: file.originalname, size: file.size },
      });

      await sendAlertMessage(
        `📁 **Trusted file upload**\nUser: ${user}\nIP: ${ip}\nFile: ${file.originalname} (${file.size} bytes)\nStatus: Trusted`
      );

      return res.json({ message: "File uploaded (trusted IP)" });
    }

    const { result } = await processIncident(user, ip, "upload", {
      file: { name: file.originalname, size: file.size },
    });

    await sendAlertMessage(
      `📁 **File upload**\nUser: ${user}\nIP: ${ip}\nFile: ${file.originalname} (${file.size} bytes)\nThreat: ${result.threat}\nReason: ${result.reason}`
    );

    if (result.threat) {
      return res.status(403).json({ message: result.reason, severity: result.severity });
    }

    res.json({ message: "File uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleRoleChange = async (req, res) => {
  const { user, oldRole, newRole } = req.body;
  const ip = getIP(req);

  if (!user || !oldRole || !newRole)
    return res.status(400).json({ error: "Missing role change info" });

  try {
    const { result } = await processIncident(user, ip, "role_change", {
      roleChange: { oldRole, newRole },
    });

    await sendAlertMessage(
      `⚙️ **Role change**\nUser: ${user}\nIP: ${ip}\nFrom: ${oldRole}\nTo: ${newRole}\nThreat: ${result.threat}\nReason: ${result.reason}`
    );

    if (result.threat) {
      return res.status(403).json({ message: result.reason, severity: result.severity });
    }

    res.json({ message: "Role changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
