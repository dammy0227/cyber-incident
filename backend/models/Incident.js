const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  type: {
    type: String, // e.g., "login", "upload", "role_change"
    required: true,
  },
  reason: {
    type: String, // Why AI flagged this as a threat
    required: true,
  },
  severity: {
    type: String, // e.g., "low", "medium", "high"
    required: true,
  },
  threat: {
    type: Boolean,
    default: false, // 🚨 Needed for filtering suspicious activity
  },
  file: {
    name: String,
    size: Number,
  },
  roleChange: {
    oldRole: String,
    newRole: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Incident", IncidentSchema);
