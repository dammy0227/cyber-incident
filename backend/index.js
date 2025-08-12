const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables as early as possible
dotenv.config();

const { client } = require("../backend/discordBot"); // Import Discord client

const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

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

// Login Discord bot
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log("🤖 Discord bot logged in"))
  .catch(err => console.error("Discord bot login failed:", err));
