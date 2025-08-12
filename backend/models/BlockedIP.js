// models/BlockedIP.js
const mongoose = require("mongoose");

const blockedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  reason: { type: String },
  blockedUntil: { type: Date },
  blockedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlockedIP", blockedIPSchema);
