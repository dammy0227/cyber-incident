// discordBot.js

require("dotenv").config(); // MUST BE FIRST

const {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  InteractionType
} = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once("ready", () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

// Handle text commands like: /block 1.2.3.4 reason
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("/block") || message.author.bot) return;

  const [command, ip, ...reasonParts] = message.content.split(" ");
  const reason = reasonParts.join(" ") || "Blocked from Discord by admin";

  if (!ip) {
    return message.reply("⚠️ Please provide an IP. Example: `/block 1.2.3.4 suspicious file`");
  }

  try {
    await axios.post(`${process.env.BACKEND_URL}/api/admin/block-ip`, { ip, reason });
    message.reply(`✅ IP **${ip}** blocked. Reason: ${reason}`);
  } catch (err) {
    console.error("Block IP error:", err.message);
    message.reply("❌ Failed to block IP.");
  }
});

// Handle button interactions from alerts
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.type !== InteractionType.MessageComponent) return;

  const customId = interaction.customId;

  if (customId.startsWith("block_")) {
    const ip = customId.split("_")[1];
    try {
      await axios.post(`${process.env.BACKEND_URL}/api/admin/block-ip`, { ip });
      await interaction.reply({ content: `🚫 IP ${ip} has been blocked.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: "❌ Failed to block IP.", ephemeral: true });
    }
  }

  if (customId.startsWith("unblock_")) {
    const ip = customId.split("_")[1];
    try {
      await axios.post(`${process.env.BACKEND_URL}/api/admin/unblock-ip`, { ip });
      await interaction.reply({ content: `✅ IP ${ip} has been unblocked.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: "❌ Failed to unblock IP.", ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
module.exports = { client };
