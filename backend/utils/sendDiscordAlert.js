require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", () => {
  console.log(`✅ Discord bot ready as ${client.user.tag}`);
});

// Function to send alert
async function sendDiscordAlert(incident) {
  try {
    // Make sure bot is ready
    if (!client.isReady()) {
      console.log("⏳ Waiting for bot to be ready before sending...");
      await new Promise((resolve) => client.once("ready", resolve));
    }

    // Get the channel by ID (from your .env)
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);

    if (!channel) {
      console.error("❌ Discord channel not found");
      return;
    }

    const message = `🚨 **Incident Alert** 🚨\n` +
      `**Type:** ${incident.type}\n` +
      `**User:** ${incident.user}\n` +
      `**IP:** ${incident.ip}\n` +
      `**Reason:** ${incident.reason}\n` +
      `**Severity:** ${incident.severity}\n` +
      `**Threat:** ${incident.threat ? "Yes" : "No"}`;

    await channel.send(message);
    console.log("✅ Alert sent to Discord");

  } catch (error) {
    console.error("❌ Failed to send Discord alert:", error);
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = sendDiscordAlert;
