// backend/controllers/eventController.js
const Incident = require("../models/Incident");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const analyzeEvent = require("../ai/aiEngine");
const { sendAlertMessage, updateDiscordMessage } = require("../bot/discordBot");

// Centralized IP helper
const getIP = (req) => {
  try {
    const xForwardedFor = req.headers["x-forwarded-for"];
    return xForwardedFor ? xForwardedFor.split(",")[0].trim() : req.ip || "localhost";
  } catch (err) {
    console.error("Error extracting IP:", err);
    return "localhost";
  }
};

// Shared incident processor
async function processIncident(user, ip, type, details) {
  const result = await analyzeEvent({ user, ip, type, ...details });
  
  const incident = await Incident.create({
    user,
    ip,
    type,
    reason: result.reason || `${type} event`,
    severity: result.severity || "low",
    threat: Boolean(result.threat),
    ...details
  });

  if (result.threat && result.severity === "high") {
    await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason: result.reason },
      { upsert: true }
    );
  }

  return { result, incident };
}

// Enhanced alert message sender
async function sendEnhancedAlert(type, user, ip, additionalInfo = "") {
  const messages = {
    login: `🔐 **Login attempt**\n👤 User: ${user}\n🌐 IP: ${ip}`,
    upload: `📁 **File upload**\n👤 User: ${user}\n🌐 IP: ${ip}\n📄 File: ${additionalInfo}`,
    role_change: `⚙️ **Role change**\n👤 User: ${user}\n🌐 IP: ${ip}\n🔄 ${additionalInfo}`,
    blocked: `⛔ **Blocked activity**\n👤 User: ${user}\n🌐 IP: ${ip}`
  };

  await sendAlertMessage(messages[type] + (additionalInfo ? `\n${additionalInfo}` : ''), ip);
}

// Handlers
exports.handleLogin = async (req, res) => {
  try {
    const { user } = req.body;
    const ip = getIP(req);
    if (!user) return res.status(400).json({ error: "User email required" });

    const blocked = await BlockedIP.findOne({ $or: [{ ip }, { user }] });
    if (blocked) {
      await sendEnhancedAlert('blocked', user, ip, `Reason: ${blocked.reason}`);
      return res.status(403).json({ message: "Login denied", ip, reason: blocked.reason });
    }

    const { result } = await processIncident(user, ip, "login", {});
    await sendEnhancedAlert('login', user, ip, `Threat: ${result.threat}\nReason: ${result.reason}`);

    if (result.threat && result.severity === "high") {
      return res.status(403).json({ message: "Suspicious login", ip, reason: result.reason });
    }

    res.json({ 
      message: result.threat ? "Suspicious login" : "Login successful",
      threat: result.threat,
      severity: result.severity,
      reason: result.reason,
      ip
    });
  } catch (err) {
    console.error("Login handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleUpload = async (req, res) => {
  try {
    const { user } = req.body;
    const ip = getIP(req);
    const file = req.file;
    if (!user || !file) return res.status(400).json({ error: "User and file required" });

    const trusted = await TrustedIP.findOne({ user, ip });
    if (trusted) {
      await Incident.create({
        user, ip,
        type: "upload",
        reason: "Trusted IP upload",
        severity: "low",
        threat: false,
        file: { name: file.originalname, size: file.size }
      });
      await sendEnhancedAlert('upload', user, ip, `${file.originalname} (${file.size} bytes)`);
      return res.json({ message: "File uploaded (trusted)" });
    }

    const { result } = await processIncident(user, ip, "upload", {
      file: { name: file.originalname, size: file.size }
    });
    await sendEnhancedAlert('upload', user, ip, 
      `${file.originalname}\nThreat: ${result.threat}\nReason: ${result.reason}`);

    if (result.threat) {
      return res.status(403).json({ message: result.reason, severity: result.severity });
    }
    res.json({ message: "File uploaded successfully" });
  } catch (err) {
    console.error("Upload handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.handleRoleChange = async (req, res) => {
  try {
    const { user, oldRole, newRole } = req.body;
    const ip = getIP(req);
    if (!user || !oldRole || !newRole) {
      return res.status(400).json({ error: "Missing role change info" });
    }

    const { result } = await processIncident(user, ip, "role_change", {
      roleChange: { oldRole, newRole }
    });
    await sendEnhancedAlert('role_change', user, ip, 
      `From: ${oldRole} → ${newRole}\nThreat: ${result.threat}\nReason: ${result.reason}`);

    if (result.threat) {
      return res.status(403).json({ message: result.reason, severity: result.severity });
    }
    res.json({ message: "Role changed successfully" });
  } catch (err) {
    console.error("Role change handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.blockIP = async (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ message: "IP is required" });

    await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason: reason || "Blocked via dashboard", blockedAt: new Date() },
      { upsert: true }
    );

    await Incident.create({
      user: req.user?.username || "Dashboard Admin",
      ip,
      type: "admin_block",
      reason: reason || "Blocked via dashboard",
      severity: "high",
      threat: true,
    });

    await updateDiscordMessage(ip, "block", reason);
    res.json({ success: true, message: `🚫 IP ${ip} blocked` });
  } catch (err) {
    console.error("blockIP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unblockIP = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ message: "IP is required" });

    await BlockedIP.findOneAndDelete({ ip });
    await Incident.create({
      user: req.user?.username || "Dashboard Admin",
      ip,
      type: "admin_unblock",
      reason: "Unblocked via dashboard",
      severity: "low",
      threat: false,
    });

    await updateDiscordMessage(ip, "unblock");
    res.json({ success: true, message: `✅ IP ${ip} unblocked` });
  } catch (err) {
    console.error("unblockIP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};