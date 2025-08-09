// models/BlockedIP.js
const mongoose = require("mongoose");

const BlockedIPSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
  },
  blockedUntil: {
    type: Date, // optional: automatic expiry if you want temporary blocks
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BlockedIP", BlockedIPSchema);
