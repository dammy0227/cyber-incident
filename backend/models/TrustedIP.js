// models/TrustedIP.js
const mongoose = require("mongoose");

const trustedIPSchema = new mongoose.Schema({
  user: {
    type: String, // e.g., "admin@example.com"
    required: true,
  },
  ip: {
    type: String, // e.g., "192.168.1.10"
    required: true,
  },
  // Time window (optional) in "HH:MM" 24-hour format. If not present => allowed all day.
  allowedFrom: {
    type: String, // "09:00"
  },
  allowedTo: {
    type: String, // "17:30"
  },
  // Per-action quotas (optional):
  maxLoginsPerWindow: { type: Number }, // e.g., 10
  maxUploadsPerWindow: { type: Number },
  maxRoleChangesPerWindow: { type: Number },

  // Window length in seconds for the above quotas (default 3600 = 1 hour)
  quotaWindowSeconds: { type: Number, default: 3600 },

  addedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TrustedIP", trustedIPSchema);
