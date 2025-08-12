// utils/sendDiscordAlert.js
require("dotenv").config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");
const { client, readyPromise } = require("../discordBot");

const sendDiscordAlert = async (incident) => {
  console.log("[DEBUG] Preparing to send Discord alert...");

  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID;
  if (!channelId) {
    console.error("❌ DISCORD_ALERT_CHANNEL_ID not defined in .env");
    return;
  }

  try {
    // ✅ Wait until bot is fully ready before sending
    await readyPromise;
    console.log("[DEBUG] Bot is ready. Fetching channel...");

    const channel = await client.channels.fetch(channelId).catch(err => {
      console.error(`❌ Failed to fetch channel: ${err.message}`);
      return null;
    });

    if (!channel) {
      console.error("❌ Could not find the Discord channel.");
      return;
    }

    console.log(`[DEBUG] Fetched channel: ${channel.name} (Type: ${channel.type})`);

    if (channel.type !== ChannelType.GuildText) {
      console.error("❌ Provided channel is not a text channel.");
      return;
    }

    // ✅ Build alert embed
    const embed = new EmbedBuilder()
      .setTitle(`🚨 ${incident.type?.toUpperCase() || "UNKNOWN"} Threat Detected`)
      .setColor(incident.severity === "high" ? 0xff0000 : 0xffa500)
      .addFields(
        { name: "👤 User", value: incident.user || "N/A", inline: true },
        { name: "🌐 IP", value: incident.ip || "N/A", inline: true },
        { name: "⚠️ Reason", value: incident.reason || "N/A" },
        { name: "🔐 Severity", value: incident.severity || "unknown" },
        { name: "🕒 Time", value: new Date().toLocaleString() }
      )
      .setFooter({ text: "CyberGuard Security Bot", iconURL: client.user.displayAvatarURL() });

    // ✅ Action buttons
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

    // ✅ Send message
    await channel.send({
      content: "⚠️ **New Threat Detected**",
      embeds: [embed],
      components: [row]
    });

    console.log("[DEBUG] ✅ Discord alert sent successfully.");
  } catch (err) {
    console.error("❌ Failed to send alert to Discord:", err);
  }
};

module.exports = sendDiscordAlert;
