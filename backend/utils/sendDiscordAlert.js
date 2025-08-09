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
  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID;

  if (!channelId) {
    console.error("❌ DISCORD_ALERT_CHANNEL_ID not defined.");
    return;
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.error("❌ Invalid channel or permissions.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🚨 ${incident.type.toUpperCase()} Threat Detected`)
    .setColor(incident.severity === "high" ? 0xff0000 : 0xffa500)
    .addFields(
      { name: "👤 User", value: incident.user, inline: true },
      { name: "🌐 IP", value: incident.ip, inline: true },
      { name: "⚠️ Reason", value: incident.reason },
      { name: "🔐 Severity", value: incident.severity },
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
      content: "⚠️ **New Threat Detected**", // Optional: add <@&ROLE_ID> to ping role
      embeds: [embed],
      components: [row]
    });
  } catch (err) {
    console.error("❌ Failed to send alert:", err.message);
  }
};

module.exports = sendDiscordAlert;
