require("dotenv").config();
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require("discord.js");

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
    .addStringOption(opt => opt
      .setName("ip")
      .setDescription("IP to block")
      .setRequired(true))
    .addStringOption(opt => opt
      .setName("reason")
      .setDescription("Reason for blocking")
      .setRequired(false)),
  new SlashCommandBuilder()
    .setName("unblock")
    .setDescription("Unblock an attacker IP")
    .addStringOption(opt => opt
      .setName("ip")
      .setDescription("IP to unblock")
      .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
const activeInteractions = new Set();
const MessageMap = new Map();

// Message Creation Helper
function createIPMessage(ip, isBlocked, source = "command", reason = "") {
  const status = isBlocked ? "🚫 BLOCKED" : "✅ UNBLOCKED";
  const action = isBlocked ? "blocked" : "unblocked";
  const buttonAction = isBlocked ? "unblock" : "block";
  const buttonLabel = isBlocked ? "Unblock" : "Block";
  const buttonStyle = isBlocked ? ButtonStyle.Success : ButtonStyle.Danger;

  let content = `${status}\n🌐 IP: **${ip}**\nAction: ${action} via ${source}`;
  if (reason) content += `\nReason: ${reason}`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${buttonAction}_${ip}`)
      .setLabel(buttonLabel)
      .setStyle(buttonStyle)
  );

  return { content, components: [row] };
}

// Interaction Handlers
async function handleBlockCommand(interaction) {
  const ip = interaction.options.getString("ip");
  const reason = interaction.options.getString("reason") || "No reason provided";

  if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
    return interaction.reply({
      content: "⚠️ Invalid IP format (use like 1.1.1.1)",
      ephemeral: true
    });
  }

  await BlockedIP.findOneAndUpdate(
    { ip },
    { ip, reason, blockedAt: new Date() },
    { upsert: true }
  );

  await Incident.create({
    user: interaction.user.tag,
    ip,
    type: "admin_block",
    reason,
    severity: "high",
    threat: true,
  });

  return interaction.reply(createIPMessage(ip, true, "command", reason));
}

async function handleUnblockCommand(interaction) {
  const ip = interaction.options.getString("ip");
  const exists = await BlockedIP.findOne({ ip });

  if (!exists) {
    return interaction.reply({
      content: `⚠️ IP **${ip}** not blocked`,
      ephemeral: true
    });
  }

  await BlockedIP.findOneAndDelete({ ip });
  await Incident.create({
    user: interaction.user.tag,
    ip,
    type: "admin_unblock",
    reason: "Unblocked via Discord",
    severity: "low",
    threat: false,
  });

  return interaction.reply(createIPMessage(ip, false, "command"));
}

async function handleButtonInteraction(interaction) {
  if (!interaction.isButton()) return;
  await interaction.deferUpdate();

  const [action, ip] = interaction.customId.split("_");
  if (!ip) return;

  if (action === "block") {
    await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason: "Blocked via button", blockedAt: new Date() },
      { upsert: true }
    );
    await Incident.create({
      user: interaction.user.tag,
      ip,
      type: "admin_block",
      reason: "Blocked via button",
      severity: "high",
      threat: true,
    });
    return interaction.editReply(createIPMessage(ip, true, "button"));
  }

  if (action === "unblock") {
    await BlockedIP.findOneAndDelete({ ip });
    await Incident.create({
      user: interaction.user.tag,
      ip,
      type: "admin_unblock",
      reason: "Unblocked via button",
      severity: "low",
      threat: false,
    });
    return interaction.editReply(createIPMessage(ip, false, "button"));
  }
}

// Main Interaction Handler
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "block") return handleBlockCommand(interaction);
      if (interaction.commandName === "unblock") return handleUnblockCommand(interaction);
    }
    if (interaction.isButton()) return handleButtonInteraction(interaction);
  } catch (error) {
    console.error("Interaction error:", error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp("⚠️ Something went wrong");
      } else {
        await interaction.reply("⚠️ Something went wrong");
      }
    } catch (err) {
      console.error("Failed to send error:", err);
    }
  }
});

// Alert System
async function sendAlertMessage(content, ip) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    if (!channel) return console.error("Alert channel not found");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`block_${ip}`)
        .setLabel("Block IP")
        .setStyle(ButtonStyle.Danger)
    );

    const sentMsg = await channel.send({ content, components: [row] });
    MessageMap.set(ip, sentMsg.id);
  } catch (err) {
    console.error("Failed to send alert:", err);
  }
}

async function updateDiscordMessage(ip, action, reason = "") {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    const messageId = MessageMap.get(ip);
    if (!channel || !messageId) return;

    const msg = await channel.messages.fetch(messageId);
    if (msg) await msg.edit(createIPMessage(ip, action === "block", "dashboard", reason));
  } catch (err) {
    console.error("Failed to update message:", err);
  }
}

// Initialization
async function initialize() {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Command registration failed:", err);
  }
}

client.once("ready", () => {
  console.log("🤖 Bot logged in");
  initialize();
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

module.exports = { 
  client, 
  sendAlertMessage, 
  updateDiscordMessage 
};