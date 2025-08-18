const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { client } = require("./discordBot");

// Load environment variables
dotenv.config();

const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

const app = express();

// ✅ Tell Express to trust proxies (important for Render, Vercel, Nginx)
app.set("trust proxy", true);

// ✅ CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://cyber-incident-beta.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Connect to MongoDB
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// ✅ API routes
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🌐 Cyber Incident Management API is running.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Discord bot login
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log("🤖 Discord bot logged in"))
  .catch(err => console.error("❌ Discord bot login failed:", err));
