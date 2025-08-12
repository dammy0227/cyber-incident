// server.js (or app.js)
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://cyber-incident-beta.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🌐 Cyber Incident Management API is running.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
