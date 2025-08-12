const mongoose = require("mongoose");

const blockedIPSchema = new mongoose.Schema({
  ip: { type: String, unique: true, sparse: true },    // IP is optional now
  user: { type: String, unique: true, sparse: true },  // User email is optional and unique
  reason: { type: String },
  blockedUntil: { type: Date },
  blockedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlockedIP", blockedIPSchema);
