// routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");

// Protect all admin routes with auth middleware
router.use(auth);

router.get("/incidents", adminController.getAllIncidents);

router.post("/block-ip", adminController.blockIP);
router.post("/unblock-ip", adminController.unblockIP);
router.get("/blocked-ips", adminController.getBlockedIPs);

router.post("/add-trusted-ip", adminController.addTrustedIP);
router.post("/remove-trusted-ip", adminController.removeTrustedIP);
router.get("/trusted-ips", adminController.getTrustedIPs);

module.exports = router;
