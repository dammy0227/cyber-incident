// routes/events.js

const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const ipExtractor = require("../middleware/ipExtractor");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // or configure storage engine
const checkBlockedIP = require("../middleware/checkBlockedIP");

// Apply IP middleware to all event routes
router.use(ipExtractor);

// Event detection routes
router.post("/login", checkBlockedIP, eventController.handleLogin);
router.post("/upload", checkBlockedIP, upload.single("file"), eventController.handleUpload);
router.post("/role-change", checkBlockedIP, eventController.handleRoleChange);


module.exports = router;
 