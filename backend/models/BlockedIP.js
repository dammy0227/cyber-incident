const mongoose = require("mongoose");

const blockedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },  // IP must be unique and required
  user: { type: String },  // just optional info, not unique
  reason: { type: String },
  blockedUntil: { type: Date },
  blockedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlockedIP", blockedIPSchema);
