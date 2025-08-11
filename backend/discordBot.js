// backend/utils/discordBot.js
require("dotenv").config(); // MUST be first

const {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  InteractionType,
} = require("discord.js");
const axios = require("axios");

console.log("[INIT] Starting Discord bot...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

let isReady = false;

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  isReady = true;
});

client.on("error", (err) => {
  console.error("❌ Discord client error:", err);
});

client.on("shardError", (err) => {
  console.error("❌ WebSocket connection error:", err);
});

// Handle /block commands
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("/block") || message.author.bot) return;

  const [command, ip, ...reasonParts] = message.content.split(" ");
  const reason = reasonParts.join(" ") || "Blocked from Discord by admin";

  if (!ip) {
    return message.reply("⚠️ Please provide an IP. Example: `/block 1.2.3.4 suspicious file`");
  }

  console.log(`[COMMAND] /block ${ip} - Reason: ${reason}`);

  try {
    await axios.post(`${process.env.BACKEND_URL}/api/admin/block-ip`, { ip, reason });
    message.reply(`✅ IP **${ip}** blocked. Reason: ${reason}`);
  } catch (err) {
    console.error("❌ Block IP error:", err.message);
    message.reply("❌ Failed to block IP.");
  }
});

// Handle alert buttons
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.type !== InteractionType.MessageComponent) return;

  const customId = interaction.customId;
  const ip = customId.split("_")[1];

  try {
    if (customId.startsWith("block_")) {
      console.log(`[BUTTON] Blocking IP: ${ip}`);
      await axios.post(`${process.env.BACKEND_URL}/api/admin/block-ip`, { ip });
      await interaction.reply({ content: `🚫 IP ${ip} has been blocked.`, flags: 64 });
    } else if (customId.startsWith("unblock_")) {
      console.log(`[BUTTON] Unblocking IP: ${ip}`);
      await axios.post(`${process.env.BACKEND_URL}/api/admin/unblock-ip`, { ip });
      await interaction.reply({ content: `✅ IP ${ip} has been unblocked.`, flags: 64 });
    }
  } catch (err) {
    console.error(`❌ Failed to process ${customId}:`, err.message);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ Failed to process request.", flags: 64 });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error("❌ Failed to login to Discord:", err);
});

module.exports = {
  client,
  getIsReady: () => isReady,
};
