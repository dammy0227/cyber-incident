// backend/bot/discordBot.js
require("dotenv").config();
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require("discord.js");

// ✅ Models
const BlockedIP = require("../models/BlockedIP");
const Incident = require("../models/Incident");

// ---- 1. Setup Bot ----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---- 2. Slash Commands ----
const commands = [
  new SlashCommandBuilder()
    .setName("block")
    .setDescription("Block an attacker IP")
    .addStringOption(opt =>
      opt.setName("ip").setDescription("IP to block").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("reason").setDescription("Reason for blocking").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("unblock")
    .setDescription("Unblock an attacker IP")
    .addStringOption(opt =>
      opt.setName("ip").setDescription("IP to unblock").setRequired(true)
    ),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

// ---- 3. Register Commands ----
(async () => {
  try {
    console.log("⏳ Registering Discord slash commands...");
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered.");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
})();

// ---- 4. Message Tracking ----
const MessageMap = new Map(); // IP -> messageId

// ---- 5. Handle Interactions ----
client.on("interactionCreate", async (interaction) => {
  try {
    // ✅ Slash Commands
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "block") {
        const ip = interaction.options.getString("ip");
        const reason = interaction.options.getString("reason") || "Blocked via Discord";

        await BlockedIP.findOneAndUpdate(
          { ip },
          { ip, reason, blockedAt: new Date() },
          { upsert: true, new: true }
        );

        await Incident.create({
          user: interaction.user.tag,
          ip,
          type: "admin_block",
          reason,
          severity: "high",
          threat: true,
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`unblock_${ip}`).setLabel("Unblock").setStyle(ButtonStyle.Success)
        );

        await interaction.reply({
          content: `🚫 IP **${ip}** blocked.\nReason: ${reason}`,
          components: [row],
        });
      }

      if (interaction.commandName === "unblock") {
        const ip = interaction.options.getString("ip");

        await BlockedIP.findOneAndDelete({ ip });
        await Incident.create({
          user: interaction.user.tag,
          ip,
          type: "admin_unblock",
          reason: "Unblocked via Discord",
          severity: "low",
          threat: false,
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`block_${ip}`).setLabel("Block").setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
          content: `✅ IP **${ip}** unblocked.`,
          components: [row],
        });
      }
    }

    // ✅ Button Interactions
    if (interaction.isButton()) {
      const [action, ip] = interaction.customId.split("_");

      if (action === "block") {
        await BlockedIP.findOneAndUpdate(
          { ip },
          { ip, reason: "Blocked via Discord button", blockedAt: new Date() },
          { upsert: true, new: true }
        );

        await Incident.create({
          user: interaction.user.tag,
          ip,
          type: "admin_block",
          reason: "Blocked via Discord button",
          severity: "high",
          threat: true,
        });

        await interaction.update({
          content: `🚫 IP **${ip}** blocked via button.`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`unblock_${ip}`).setLabel("Unblock").setStyle(ButtonStyle.Success)
            )
          ],
        });
      }

      if (action === "unblock") {
        await BlockedIP.findOneAndDelete({ ip });
        await Incident.create({
          user: interaction.user.tag,
          ip,
          type: "admin_unblock",
          reason: "Unblocked via Discord button",
          severity: "low",
          threat: false,
        });

        await interaction.update({
          content: `✅ IP **${ip}** unblocked via button.`,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`block_${ip}`).setLabel("Block").setStyle(ButtonStyle.Danger)
            )
          ],
        });
      }
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);

    // ✅ Make sure only one reply happens
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
    } else {
      await interaction.followUp({ content: "⚠️ Something went wrong.", ephemeral: true });
    }
  }
});

// ---- 6. Utility: Send Alerts ----
async function sendAlertMessage(user, ip) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    if (!channel) {
      console.error("❌ Alert channel not found (check DISCORD_ALERT_CHANNEL_ID)");
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`block_${ip}`).setLabel("Block IP").setStyle(ButtonStyle.Danger)
    );

    const sentMsg = await channel.send({
      content: `⚠️ Suspicious login detected!\n👤 User: **${user}**\n🌐 IP: **${ip}**`,
      components: [row],
    });

    // ✅ Track messageId for updates later
    MessageMap.set(ip, sentMsg.id);
  } catch (err) {
    console.error("❌ Failed to send alert:", err);
  }
}

// ---- 7. Utility: Update Message from Dashboard ----
async function updateDiscordMessage(ip, action) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    const messageId = MessageMap.get(ip);
    if (!channel || !messageId) return;

    const msg = await channel.messages.fetch(messageId);
    if (!msg) return;

    let row;
    if (action === "block") {
      row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`unblock_${ip}`).setLabel("Unblock").setStyle(ButtonStyle.Success)
      );
      await msg.edit({ content: `🚫 IP **${ip}** blocked (via dashboard).`, components: [row] });
    } else {
      row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`block_${ip}`).setLabel("Block").setStyle(ButtonStyle.Danger)
      );
      await msg.edit({ content: `✅ IP **${ip}** unblocked (via dashboard).`, components: [row] });
    }
  } catch (err) {
    console.error("❌ Failed to update Discord message:", err);
  }
}

// ---- 8. Export ----
module.exports = { client, sendAlertMessage, updateDiscordMessage };
