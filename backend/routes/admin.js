const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// 📊 Incident Routes
router.get("/incidents", adminController.getAllIncidents);

// 🚫 Blocked IP Routes
router.post("/block-ip", adminController.blockIP);
router.post("/unblock-ip", adminController.unblockIP);
router.get("/blocked-ips", adminController.getBlockedIPs); // FIX: route consistency

// ✅ Trusted IP Routes
router.post("/add-trusted-ip", adminController.addTrustedIP);     // FIX: cleaner naming
router.post("/remove-trusted-ip", adminController.removeTrustedIP);
router.get("/trusted-ips", adminController.getTrustedIPs);

module.exports = router;
