// models/Incident.js
const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  user: { type: String, required: true },
  ip: { type: String, required: true },
  type: { type: String, required: true }, // login, upload, role_change, admin_block, etc.
  reason: { type: String, required: true },
  severity: { type: String, required: true }, // low, medium, high
  threat: { type: Boolean, default: false },
  file: { name: String, size: Number },
  roleChange: { oldRole: String, newRole: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Incident", incidentSchema);
