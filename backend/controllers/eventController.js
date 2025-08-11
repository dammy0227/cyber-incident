// controllers/eventController.js
const Incident = require("../models/Incident");
const analyzeEvent = require("../ai/aiEngine");
const { emitAlert } = require("../sockets/alertSocket");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const sendDiscordAlert = require("../utils/sendDiscordAlert");

const getIP = (req) =>
  req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

// Helper to process and send incident
async function processIncident(user, ip, type, details) {
  console.log(`\n[DEBUG] Processing incident: ${type} for ${user} (${ip})`);
  const result = await analyzeEvent({ user, ip, type, ...details });

  const incident = await Incident.create({
    user,
    ip,
    type,
    reason: result.reason || `${type} event`,
    severity: result.severity || "low",
    threat: Boolean(result.threat),
  });

  console.log(`[DEBUG] Incident saved to DB: ${incident._id}`);
  emitAlert(incident);

  // Always send to Discord for debugging
  try {
    console.log(`[DEBUG] Sending ${type} alert to Discord...`);
    await sendDiscordAlert(incident);
    console.log(`[DEBUG] Discord alert sent successfully`);
  } catch (err) {
    console.error(`[ERROR] Failed to send Discord alert:`, err.message);
  }

  // Auto-block if severe threat
  const isBlocked = await BlockedIP.findOne({ ip });
  if (result.threat && result.severity === "high" && !isBlocked) {
    await BlockedIP.updateOne({ ip }, { ip }, { upsert: true });
    console.log(`[DEBUG] IP ${ip} auto-blocked`);
  }

  return { result, incident };
}

// LOGIN
exports.handleLogin = async (req, res) => {
  const { user } = req.body;
  const ip = getIP(req);
  if (!user) return res.status(400).json({ error: "User email is required" });

  try {
    const { result } = await processIncident(user, ip, "login", {});
    res.status(200).json({
      message: result.threat ? "Suspicious login" : "Login successful",
      ip,
      threat: Boolean(result.threat),
      reason: result.reason || null,
      severity: result.severity || "low",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// UPLOAD
exports.handleUpload = async (req, res) => {
  const { user } = req.body;
  const file = req.file;
  const ip = getIP(req);
  if (!user || !file) return res.status(400).json({ error: "Missing user or file" });

  try {
    const isTrusted = await TrustedIP.findOne({ user, ip });
    if (isTrusted) {
      console.log(`[DEBUG] Trusted IP upload by ${user} (${ip}), skipping AI analysis`);
      const incident = await Incident.create({
        user,
        ip,
        type: "upload",
        reason: "Trusted IP upload bypassed analysis",
        severity: "low",
        threat: false,
      });
      emitAlert(incident);
      await sendDiscordAlert(incident);
      return res.status(200).json({ message: "File uploaded successfully (trusted IP)" });
    }

    const { result } = await processIncident(user, ip, "upload", {
      file: { name: file.originalname, size: file.size },
    });

    if (result.threat) {
      return res.status(403).json({
        message: result.reason,
        severity: result.severity,
      });
    }

    res.status(200).json({ message: "File uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ROLE CHANGE
exports.handleRoleChange = async (req, res) => {
  const { user, oldRole, newRole } = req.body;
  const ip = getIP(req);
  if (!user || !oldRole || !newRole)
    return res.status(400).json({ error: "Missing role change information" });

  try {
    const { result } = await processIncident(user, ip, "role_change", {
      roleChange: { oldRole, newRole },
    });

    if (result.threat) {
      return res.status(403).json({
        message: result.reason,
        severity: result.severity,
      });
    }

    res.status(200).json({ message: "Role updated successfully" });
  } catch (err) {
    console.error("Role change error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
