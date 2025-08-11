const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");

const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets/alertSocket"); // ✅ Socket import
const startCleanupJob = require("./jobs/cleanupJob");

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app); // ✅ Create HTTP server for Socket.IO

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://cyber-incident-beta.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


// Middleware

app.use(express.json()); // For parsing application/json

// Connect to MongoDB
connectDB();

startCleanupJob();

// API Routes
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes); // e.g. /api/admin/incidents
app.use("/api/auth", authRoutes); 

// Default Route
app.get("/", (req, res) => {
  res.send("🌐 Cyber Incident Management API is running.");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initSocket(server); // ✅ Initialize WebSocket server
});
