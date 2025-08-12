// models/TrustedIP.js
const mongoose = require("mongoose");

const trustedIPSchema = new mongoose.Schema({
  user: { type: String, required: true },
  ip: { type: String, required: true },
  allowedFrom: { type: String },  // "HH:MM"
  allowedTo: { type: String },
  maxLoginsPerWindow: { type: Number },
  maxUploadsPerWindow: { type: Number },
  maxRoleChangesPerWindow: { type: Number },
  quotaWindowSeconds: { type: Number, default: 3600 },
  addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TrustedIP", trustedIPSchema);
