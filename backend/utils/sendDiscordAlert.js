require("dotenv").config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");

const { client, isReady } = require("../discordBot");

// Wait for bot to be ready before sending alerts
const waitForReady = () =>
  new Promise((resolve) => {
    if (isReady) return resolve();
    client.once("ready", () => resolve());
  });

const sendDiscordAlert = async (incident) => {
  await waitForReady();

  const channelId = process.env.DISCORD_ALERT_CHANNEL_ID;

  if (!channelId) {
    console.error("❌ DISCORD_ALERT_CHANNEL_ID not defined.");
    return;
  }

  try {
    const channel =
      client.channels.cache.get(channelId) || (await client.channels.fetch(channelId));

    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error("❌ Invalid channel or bot lacks permissions.");
      return;
    }

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

    await channel.send({
      content: "⚠️ **New Threat Detected**",
      embeds: [embed],
      components: [row],
    });

    console.log("✅ Discord alert sent.");
  } catch (err) {
    console.error("❌ Failed to send alert:", err);
  }
};

module.exports = sendDiscordAlert;
