// controllers/eventController.js

const Incident = require("../models/Incident");
const analyzeEvent = require("../ai/aiEngine");
const { emitAlert } = require("../sockets/alertSocket");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const sendDiscordAlert = require("../utils/sendDiscordAlert");

// Helper: get IP from request or header
const getIP = (req) =>
  req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

// Login handler


exports.handleLogin = async (req, res) => {
  const { user } = req.body;
  const ip = getIP(req);

  if (!user) {
    return res.status(400).json({ error: "User email is required" });
  }

  try {
    const result = await analyzeEvent({ user, ip, type: "login" });

    const incident = await Incident.create({
      user,
      ip,
      type: "login",
      reason: result.reason || "Login successful",
      severity: result.severity || "low",
      threat: Boolean(result.threat),
    });

    emitAlert(incident);

    const isBlocked = await BlockedIP.findOne({ ip });

    console.log(`[DEBUG] Login Incident - threat: ${result.threat}, IP blocked: ${!!isBlocked}`);

    // 🆕 Always send Discord alert for login, even if not a threat
    if (!isBlocked) {
      console.log("[DEBUG] Sending Discord alert for login incident...");
      try {
        await sendDiscordAlert(incident); // will color-code based on severity
        console.log("[DEBUG] Discord alert sent successfully.");
      } catch (err) {
        console.error("[ERROR] Failed to send Discord alert:", err);
      }
    } else {
      console.log("[DEBUG] Discord alert skipped because IP is blocked.");
    }

    // 🆕 Still auto-block high-severity threats
    if (result.threat && result.severity === "high") {
      await BlockedIP.updateOne({ ip }, { ip }, { upsert: true });
    }

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

// File upload handler
exports.handleUpload = async (req, res) => {
  const { user } = req.body;
  const file = req.file;
  const ip = getIP(req);

  if (!user || !file) {
    return res.status(400).json({ error: "Missing user or file" });
  }

  try {
    const isTrusted = await TrustedIP.findOne({ user, ip });

    if (isTrusted) {
      const incident = await Incident.create({
        user,
        ip,
        type: "upload",
        reason: "Trusted IP upload bypassed analysis",
        severity: "low",
        threat: false,
      });

      emitAlert(incident);

      console.log("[DEBUG] Trusted IP upload, skipping threat detection and Discord alert.");
      return res.status(200).json({ message: "File uploaded successfully (trusted IP)" });
    }

    const result = await analyzeEvent({
      user,
      ip,
      type: "upload",
      file: {
        name: file.originalname,
        size: file.size,
      },
    });

    const incident = await Incident.create({
      user,
      ip,
      type: "upload",
      reason: result.reason || "File uploaded",
      severity: result.severity || "low",
      threat: Boolean(result.threat),
    });

    emitAlert(incident);

    const isBlocked = await BlockedIP.findOne({ ip });

    console.log(`[DEBUG] Upload Incident - threat: ${result.threat}, IP blocked: ${!!isBlocked}`);

    if (result.threat && !isBlocked) {
      console.log("[DEBUG] Sending Discord alert for upload incident...");
      try {
        await sendDiscordAlert(incident);
        console.log("[DEBUG] Discord alert sent successfully.");
      } catch (err) {
        console.error("[ERROR] Failed to send Discord alert:", err);
      }
    } else {
      console.log("[DEBUG] Discord alert skipped for upload.");
    }

    if (result.threat && result.severity === "high") {
      await BlockedIP.updateOne({ ip }, { ip }, { upsert: true });
    }

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

// Role change handler
exports.handleRoleChange = async (req, res) => {
  const { user, oldRole, newRole } = req.body;
  const ip = getIP(req);

  if (!user || !oldRole || !newRole) {
    return res.status(400).json({ error: "Missing role change information" });
  }

  try {
    const result = await analyzeEvent({
      user,
      ip,
      type: "role_change",
      roleChange: { oldRole, newRole },
    });

    const incident = await Incident.create({
      user,
      ip,
      type: "role_change",
      reason: result.reason || "Role changed successfully",
      severity: result.severity || "low",
      threat: Boolean(result.threat),
    });

    emitAlert(incident);

    const isBlocked = await BlockedIP.findOne({ ip });

    console.log(`[DEBUG] Role Change Incident - threat: ${result.threat}, IP blocked: ${!!isBlocked}`);

    if (result.threat && !isBlocked) {
      console.log("[DEBUG] Sending Discord alert for role change incident...");
      try {
        await sendDiscordAlert(incident);
        console.log("[DEBUG] Discord alert sent successfully.");
      } catch (err) {
        console.error("[ERROR] Failed to send Discord alert:", err);
      }
    } else {
      console.log("[DEBUG] Discord alert skipped for role change.");
    }

    if (result.threat && result.severity === "high") {
      await BlockedIP.updateOne({ ip }, { ip }, { upsert: true });
    }

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
