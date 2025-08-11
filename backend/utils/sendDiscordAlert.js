// backend/utils/sendDiscordAlert.js
require("dotenv").config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");

const { client, getIsReady } = require("../discordBot");

const waitForReady = () =>
  new Promise((resolve) => {
    if (getIsReady()) return resolve();
    console.log("⏳ Waiting for Discord bot to be ready...");
    client.once("ready", () => {
      console.log("✅ Discord bot is ready, continuing...");
      resolve();
    });
  });

const sendDiscordAlert = async (incident) => {
  console.log("[DEBUG] sendDiscordAlert called with incident:", incident);

  // Convert Mongoose doc to plain object if needed
  if (incident.toObject) {
    incident = incident.toObject();
  }

  await waitForReady();

  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID;
  if (!channelId) {
    console.error("❌ DISCORD_ALERT_CHANNEL_ID not defined in .env");
    return;
  }

  let channel;
  try {
    channel =
      client.channels.cache.get(channelId) ||
      (await client.channels.fetch(channelId));

    if (!channel) {
      console.error("❌ Could not fetch channel. Check permissions & ID.");
      return;
    }

    if (channel.type !== ChannelType.GuildText) {
      console.error("❌ Channel is not a text channel.");
      return;
    }
    console.log(`[DEBUG] Sending alert to channel: ${channel.name}`);
  } catch (err) {
    console.error("❌ Error fetching channel:", err);
    return;
  }

  // Severity colors
  const severityColors = {
    high: 0xff0000,
    medium: 0xffa500,
    low: 0x00ff00,
  };

  const embed = new EmbedBuilder()
    .setTitle(`🚨 ${incident.type ? incident.type.toUpperCase() : "EVENT"} Alert`)
    .setColor(severityColors[incident.severity] || 0x808080)
    .addFields(
      { name: "👤 User", value: incident.user || "N/A", inline: true },
      { name: "🌐 IP", value: incident.ip || "N/A", inline: true },
      { name: "⚠️ Reason", value: incident.reason || "N/A" },
      { name: "🔐 Severity", value: incident.severity || "low" },
      { name: "🕒 Time", value: new Date().toLocaleString() }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`block_${incident.ip}`)
      .setLabel("🚫 Block IP")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`unblock_${incident.ip}`)
      .setLabel("✅ Unblock IP")
      .setStyle(ButtonStyle.Success)
  );

  try {
    await channel.send({
      content: incident.threat
        ? "⚠️ **New Threat Detected**"
        : "ℹ️ **Login Event Logged**",
      embeds: [embed],
      components: [row],
    });
    console.log("✅ Discord alert sent successfully.");
  } catch (err) {
    console.error("❌ Failed to send Discord alert:", err);
  }
};

module.exports = sendDiscordAlert;
