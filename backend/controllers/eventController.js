// backend/controllers/eventController.js
const Incident = require("../models/Incident");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const analyzeEvent = require("../ai/aiEngine");

// ✅ Import Discord functions
const { sendAlertMessage, updateDiscordMessage } = require("../discordBot");

// ------------------- Helpers -------------------

// ✅ Centralized IP helper
const getIP = (req) => {
  try {
    const xForwardedFor = req.headers["x-forwarded-for"];
    let ip = xForwardedFor ? xForwardedFor.split(",")[0].trim() : req.ip;

    if (!ip || ip === "::1" || ip.startsWith("127.") || ip === "unknown") {
      return "localhost";
    }
    return ip;
  } catch (err) {
    console.error("Error extracting IP:", err);
    return "localhost";
  }
};

// ✅ Shared incident processor
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

  // Auto-block if needed
  if (result.threat && result.severity === "high") {
    const blocked = await BlockedIP.findOne({ ip });
    if (!blocked) {
      await BlockedIP.create({ ip, reason: result.reason });
    }
  }

  return { result, incident };
}

// ------------------- Handlers -------------------

// ---- LOGIN ----
exports.handleLogin = async (req, res) => {
  const { user } = req.body;
  const ip = getIP(req);

  if (!user) return res.status(400).json({ error: "User email required" });

  try {
    // Check if IP or user blocked
    const blocked = await BlockedIP.findOne({ $or: [{ ip }, { user }] });
    if (blocked) {
      await sendAlertMessage(
        `⛔ **Blocked login attempt**\nUser: ${user}\nIP: ${ip}\nReason: ${blocked.reason || "Blocked by admin"}`
      );
      return res.status(403).json({ message: "Login denied", ip, reason: blocked.reason });
    }

    // Analyze login
    const { result } = await processIncident(user, ip, "login", {});
    await sendAlertMessage(
      `🔐 **Login attempt**\nUser: ${user}\nIP: ${ip}\nThreat: ${result.threat}\nReason: ${result.reason}`
    );

    if (result.threat && result.severity === "high") {
      return res.status(403).json({ message: "Suspicious login", ip, reason: result.reason });
    }

    res.json({
      message: result.threat ? "Suspicious login" : "Login successful",
      threat: result.threat,
      severity: result.severity,
      reason: result.reason,
      ip,
    });
  } catch (err) {
    console.error("Login handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---- UPLOAD ----
exports.handleUpload = async (req, res) => {
  const { user } = req.body;
  const ip = getIP(req);
  const file = req.file;

  if (!user || !file) return res.status(400).json({ error: "User and file required" });

  try {
    // Check trusted IP
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
        `📁 **Trusted upload**\nUser: ${user}\nIP: ${ip}\nFile: ${file.originalname} (${file.size} bytes)`
      );

      return res.json({ message: "File uploaded (trusted)" });
    }

    // Analyze file upload
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
    console.error("Upload handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---- ROLE CHANGE ----
exports.handleRoleChange = async (req, res) => {
  const { user, oldRole, newRole } = req.body;
  const ip = getIP(req);

  if (!user || !oldRole || !newRole) {
    return res.status(400).json({ error: "Missing role change info" });
  }

  try {
    const { result } = await processIncident(user, ip, "role_change", {
      roleChange: { oldRole, newRole },
    });

    await sendAlertMessage(
      `⚙️ **Role change**\nUser: ${user}\nIP: ${ip}\nFrom: ${oldRole} → ${newRole}\nThreat: ${result.threat}\nReason: ${result.reason}`
    );

    if (result.threat) {
      return res.status(403).json({ message: result.reason, severity: result.severity });
    }

    res.json({ message: "Role changed successfully" });
  } catch (err) {
    console.error("Role change handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---- BLOCK IP ----
exports.blockIP = async (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ message: "IP is required" });

    await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason: reason || "Blocked via dashboard", blockedAt: new Date() },
      { upsert: true, new: true }
    );

    await Incident.create({
      user: req.user?.username || "Dashboard Admin",
      ip,
      type: "admin_block",
      reason: reason || "Blocked via dashboard",
      severity: "high",
      threat: true,
    });

    await updateDiscordMessage(ip, "block");

    res.json({ success: true, message: `🚫 IP ${ip} blocked.` });
  } catch (err) {
    console.error("❌ blockIP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---- UNBLOCK IP ----
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

    res.json({ success: true, message: `✅ IP ${ip} unblocked.` });
  } catch (err) {
    console.error("❌ unblockIP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
