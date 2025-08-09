// controllers/adminController.js
const Incident = require("../models/Incident");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");
const { emitAlert, emitForceLogout } = require("../sockets/alertSocket");

// 🚨 INCIDENTS
exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json(incidents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
};

// 🚫 BLOCKED IPs
exports.blockIP = async (req, res) => {
  const { ip, reason, blockedUntil } = req.body;

  if (!ip) return res.status(400).json({ message: "IP is required" });

  try {
    const exists = await BlockedIP.findOne({ ip });
    if (exists) {
      return res.status(400).json({ message: "IP is already blocked" });
    }

    const payload = { ip };
    if (blockedUntil) payload.blockedUntil = new Date(blockedUntil);
    if (reason) payload.reason = reason;

    await BlockedIP.create(payload);

    // Create an incident for the block action
    const incident = await Incident.create({
      user: req.admin?.email || "admin",
      ip,
      type: "admin_block",
      reason: reason || "Manually blocked by admin",
      severity: "high",
      threat: true,
    });

    // send alert to dashboard/socket clients
    emitAlert(incident);

    // force logout any client with that IP
    emitForceLogout(ip);

    res.status(200).json({ message: `IP ${ip} has been blocked` });
  } catch (err) {
    console.error("Failed to block IP:", err);
    res.status(500).json({ error: "Failed to block IP" });
  }
};

exports.unblockIP = async (req, res) => {
  const { ip } = req.body;
  try {
    const result = await BlockedIP.findOneAndDelete({ ip });
    if (!result) {
      return res.status(404).json({ message: "IP not found in block list" });
    }

    const incident = await Incident.create({
      user: req.admin?.email || "admin",
      ip,
      type: "admin_unblock",
      reason: "Manually unblocked by admin",
      severity: "low",
      threat: false,
    });

    emitAlert(incident);

    res.status(200).json({ message: `IP ${ip} has been unblocked` });
  } catch (err) {
    console.error("Failed to unblock IP:", err);
    res.status(500).json({ error: "Failed to unblock IP" });
  }
};

exports.getBlockedIPs = async (req, res) => {
  try {
    const ips = await BlockedIP.find().sort({ blockedAt: -1 });
    res.status(200).json(ips);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blocked IPs" });
  }
};

// TRUSTED IPS
exports.addTrustedIP = async (req, res) => {
  const { user, ip, allowedFrom, allowedTo, maxLoginsPerWindow, maxUploadsPerWindow, maxRoleChangesPerWindow, quotaWindowSeconds } = req.body;

  try {
    const exists = await TrustedIP.findOne({ user, ip });
    if (exists) {
      return res.status(400).json({ message: "Trusted IP already exists for this user" });
    }

    await TrustedIP.create({
      user,
      ip,
      allowedFrom,
      allowedTo,
      maxLoginsPerWindow,
      maxUploadsPerWindow,
      maxRoleChangesPerWindow,
      quotaWindowSeconds,
    });

    res.status(200).json({ message: `Trusted IP ${ip} added for user ${user}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to add trusted IP" });
  }
};

exports.removeTrustedIP = async (req, res) => {
  const { user, ip } = req.body;

  try {
    const result = await TrustedIP.findOneAndDelete({ user, ip });
    if (!result) {
      return res.status(404).json({ message: "Trusted IP not found for this user" });
    }

    res.status(200).json({ message: `Trusted IP ${ip} removed for user ${user}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove trusted IP" });
  }
};

exports.getTrustedIPs = async (req, res) => {
  const { user } = req.query;

  try {
    const query = user ? { user } : {};
    const trusted = await TrustedIP.find(query).sort({ addedAt: -1 });
    res.status(200).json(trusted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trusted IPs" });
  }
};
