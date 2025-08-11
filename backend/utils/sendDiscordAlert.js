// utils/sendDiscordAlert.js

require("dotenv").config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require("discord.js");
const { client } = require("../discordBot");

const sendDiscordAlert = async (incident) => {
  console.log("DEBUG: sendDiscordAlert called with incident:", incident);

  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID;
  console.log("DEBUG: DISCORD_ALERT_CHANNEL_ID:", channelId);

  if (!channelId) {
    console.error("❌ DISCORD_ALERT_CHANNEL_ID not defined.");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    console.log("DEBUG: Fetched channel:", channel?.id, channel?.type);

    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error("❌ Invalid channel or permissions.");
      return;
    }

    console.log("DEBUG: Preparing Discord embed...");
    const embed = new EmbedBuilder()
      .setTitle(`🚨 ${incident.type.toUpperCase()} Threat Detected`)
      .setColor(incident.severity === "high" ? 0xff0000 : 0xffa500)
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

    console.log("DEBUG: Sending alert message to Discord channel...");
    await channel.send({
      content: "⚠️ **New Threat Detected**",
      embeds: [embed],
      components: [row],
    });
    console.log("DEBUG: Discord alert sent successfully.");
  } catch (err) {
    console.error("❌ Failed to send alert:", err);
  }
};


module.exports = sendDiscordAlert;
 