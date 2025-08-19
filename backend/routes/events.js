// routes/events.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const eventController = require("../controllers/eventController");
const ipExtractor = require("../middleware/ipExtractor");

// Use IP extractor on all event routes
router.use(ipExtractor);

router.post("/login", eventController.handleLogin);
router.post("/upload", upload.single("file"), eventController.handleUpload);
router.post("/role-change", eventController.handleRoleChange);
router.get("/status", eventController.checkStatus);


module.exports = router;
