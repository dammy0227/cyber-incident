// controllers/adminController.js
const Incident = require("../models/Incident");
const BlockedIP = require("../models/BlockedIP");
const TrustedIP = require("../models/TrustedIP");

// INCIDENTS
exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
};

// BLOCK IP
exports.blockIP = async (req, res) => {
  const { ip, user, reason, blockedUntil } = req.body;

  if (!ip && !user) {
    return res.status(400).json({ message: "IP or user email is required" });
  }

  try {
    const exists = await BlockedIP.findOne({ $or: [{ ip }, { user }] });
    if (exists) return res.status(400).json({ message: "Already blocked" });

    const payload = {};
    if (ip) payload.ip = ip;
    if (user) payload.user = user;
    if (reason) payload.reason = reason;
    if (blockedUntil) payload.blockedUntil = new Date(blockedUntil);

    await BlockedIP.create(payload);

    await Incident.create({
      user: req.admin?.email || "admin",
      ip: ip || "N/A",
      type: "admin_block",
      reason: reason || "Blocked manually by admin",
      severity: "high",
      threat: true,
    });

    res.json({ message: `${ip ? "IP" : "User"} blocked successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to block" });
  }
};

exports.unblockIP = async (req, res) => {
  const { ip, user } = req.body;

  if (!ip && !user) {
    return res.status(400).json({ message: "IP or user email is required" });
  }

  try {
    const removed = await BlockedIP.findOneAndDelete({ $or: [{ ip }, { user }] });
    if (!removed) return res.status(404).json({ message: "Not found" });

    await Incident.create({
      user: req.admin?.email || "admin",
      ip: ip || "N/A",
      type: "admin_unblock",
      reason: "Unblocked manually by admin",
      severity: "low",
      threat: false,
    });

    res.json({ message: `${ip ? "IP" : "User"} unblocked successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unblock" });
  }
};

// UNBLOCK IP
exports.unblockIP = async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ message: "IP is required" });

  try {
    const removed = await BlockedIP.findOneAndDelete({ ip });
    if (!removed) return res.status(404).json({ message: "IP not found" });

    await Incident.create({
      user: req.admin?.email || "admin",
      ip,
      type: "admin_unblock",
      reason: "Unblocked manually by admin",
      severity: "low",
      threat: false,
    });

    res.json({ message: `IP ${ip} unblocked` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unblock IP" });
  }
};

// GET BLOCKED IPs
exports.getBlockedIPs = async (req, res) => {
  try {
    const blocked = await BlockedIP.find().sort({ blockedAt: -1 });
    res.json(blocked);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blocked IPs" });
  }
};

// TRUSTED IPs
exports.addTrustedIP = async (req, res) => {
  const { user, ip, allowedFrom, allowedTo, maxLoginsPerWindow, maxUploadsPerWindow, maxRoleChangesPerWindow, quotaWindowSeconds } = req.body;

  if (!user || !ip) return res.status(400).json({ message: "User and IP are required" });

  try {
    const exists = await TrustedIP.findOne({ user, ip });
    if (exists) return res.status(400).json({ message: "Trusted IP already exists" });

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

    res.json({ message: "Trusted IP added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add trusted IP" });
  }
};

exports.removeTrustedIP = async (req, res) => {
  const { user, ip } = req.body;

  if (!user || !ip) return res.status(400).json({ message: "User and IP are required" });

  try {
    const removed = await TrustedIP.findOneAndDelete({ user, ip });
    if (!removed) return res.status(404).json({ message: "Trusted IP not found" });

    res.json({ message: "Trusted IP removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove trusted IP" });
  }
};

exports.getTrustedIPs = async (req, res) => {
  try {
    const trusted = await TrustedIP.find().sort({ addedAt: -1 });
    res.json(trusted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trusted IPs" });
  }
};
