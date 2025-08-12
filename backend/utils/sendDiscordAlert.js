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
    // ✅ Wait until bot is ready
    await readyPromise;

    console.log("[DEBUG] Bot is ready. Fetching channel...");
    const channel = await client.channels.fetch(channelId);
    console.log(`[DEBUG] Fetched channel: ${channel?.name || "Not Found"}`);

    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error("❌ Invalid channel or bot missing permissions (Send/View Messages).");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🚨 ${incident.type?.toUpperCase()} Threat Detected`)
      .setColor(incident.severity === "high" ? 0xff0000 : 0xffa500)
      .addFields(
        { name: "👤 User", value: incident.user || "N/A", inline: true },
        { name: "🌐 IP", value: incident.ip || "N/A", inline: true },
        { name: "⚠️ Reason", value: incident.reason || "N/A" },
        { name: "🔐 Severity", value: incident.severity || "unknown" },
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
      console.log("[DEBUG] About to send alert message to Discord...");
      await channel.send({
        content: "⚠️ **New Threat Detected**",
        embeds: [embed],
        components: [row]
      });
      console.log("[DEBUG] Discord alert message sent!");
    } catch (sendError) {
      console.error("❌ Error sending Discord message:", sendError);
    }
  } catch (err) {
    console.error("❌ Failed to send alert to Discord:", err.message);
  }
};

module.exports = sendDiscordAlert;
