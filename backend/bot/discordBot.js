require("dotenv").config();
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require("discord.js");

// Models
const BlockedIP = require("../models/BlockedIP");
const Incident = require("../models/Incident");

// Bot Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command Definitions
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

// Command Registration
async function registerCommands() {
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
}

// Message Tracking
const MessageMap = new Map();

// Interaction Handlers
async function handleBlockCommand(interaction) {
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
    new ButtonBuilder()
      .setCustomId(`unblock_${ip}`)
      .setLabel("Unblock")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.reply({
    content: `🚫 IP **${ip}** blocked.\nReason: ${reason}`,
    components: [row],
    flags: 64 // Ephemeral response
  });
}

async function handleUnblockCommand(interaction) {
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
    new ButtonBuilder()
      .setCustomId(`block_${ip}`)
      .setLabel("Block")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.reply({
    content: `✅ IP **${ip}** unblocked.`,
    components: [row],
    flags: 64
  });
}

async function handleButtonInteraction(interaction) {
  const [action, ip] = interaction.customId.split("_");

  // Defer the reply immediately
  await interaction.deferUpdate();

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

    return interaction.editReply({
      content: `🚫 IP **${ip}** blocked via button.`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`unblock_${ip}`)
            .setLabel("Unblock")
            .setStyle(ButtonStyle.Success)
        )
      ]
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

    return interaction.editReply({
      content: `✅ IP **${ip}** unblocked via button.`,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`block_${ip}`)
            .setLabel("Block")
            .setStyle(ButtonStyle.Danger)
        )
      ]
    });
  }
}

// Main Interaction Handler
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "block") return handleBlockCommand(interaction);
      if (interaction.commandName === "unblock") return handleUnblockCommand(interaction);
    }

    if (interaction.isButton()) {
      return handleButtonInteraction(interaction);
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ 
          content: "⚠️ Something went wrong.", 
          flags: 64 
        });
      } else {
        await interaction.reply({ 
          content: "⚠️ Something went wrong.", 
          flags: 64 
        });
      }
    } catch (error) {
      console.error("❌ Failed to send error response:", error);
    }
  }
});

// Alert Message Utility
async function sendAlertMessage(user, ip) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    if (!channel) {
      console.error("❌ Alert channel not found");
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`block_${ip}`)
        .setLabel("Block IP")
        .setStyle(ButtonStyle.Danger)
    );

    const sentMsg = await channel.send({
      content: `⚠️ Suspicious login detected!\n👤 User: **${user}**\n🌐 IP: **${ip}**`,
      components: [row],
    });

    MessageMap.set(ip, sentMsg.id);
  } catch (err) {
    console.error("❌ Failed to send alert:", err);
  }
}

// Message Update Utility
async function updateDiscordMessage(ip, action) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    const messageId = MessageMap.get(ip);
    if (!channel || !messageId) return;

    const msg = await channel.messages.fetch(messageId);
    if (!msg) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${action === "block" ? "unblock" : "block"}_${ip}`)
        .setLabel(action === "block" ? "Unblock" : "Block")
        .setStyle(action === "block" ? ButtonStyle.Success : ButtonStyle.Danger)
    );

    await msg.edit({
      content: `${action === "block" ? "🚫" : "✅"} IP **${ip}** ${action}ed (via dashboard).`,
      components: [row]
    });
  } catch (err) {
    console.error("❌ Failed to update Discord message:", err);
  }
}

// Initialize
client.once("ready", () => {
  console.log("🤖 Discord bot logged in");
  registerCommands();
});

module.exports = { 
  client, 
  sendAlertMessage, 
  updateDiscordMessage 
};