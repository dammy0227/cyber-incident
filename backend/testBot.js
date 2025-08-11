require("dotenv").config(); // Load .env variables

const { Client, GatewayIntentBits } = require("discord.js");

// Create a bot client with basic intents
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.on("error", (err) => {
  console.error("❌ Discord client error:", err);
});

client.login(process.env.DISCORD_BOT_TOKEN);
