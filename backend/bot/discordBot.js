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

// Interaction State Tracking
const activeInteractions = new Set();

// Helper function to create IP status message
function createIPMessage(ip, isBlocked, source = "command", reason = "") {
  const status = isBlocked ? "🚫 BLOCKED" : "✅ UNBLOCKED";
  const action = isBlocked ? "blocked" : "unblocked";
  const buttonAction = isBlocked ? "unblock" : "block";
  const buttonLabel = isBlocked ? "Unblock" : "Block";
  const buttonStyle = isBlocked ? ButtonStyle.Success : ButtonStyle.Danger;

  let content = `${status} - IP: **${ip}**\n`;
  content += `Action: ${action} via ${source}`;
  if (reason) content += `\nReason: ${reason}`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${buttonAction}_${ip}`)
      .setLabel(buttonLabel)
      .setStyle(buttonStyle)
  );

  return { content, components: [row] };
}

// Safe interaction reply wrapper
async function safeReply(interaction, options) {
  if (activeInteractions.has(interaction.id)) {
    console.warn(`Duplicate interaction detected: ${interaction.id}`);
    return;
  }

  activeInteractions.add(interaction.id);
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(options);
    }
    return await interaction.reply(options);
  } catch (error) {
    console.error("Interaction reply error:", error);
  } finally {
    activeInteractions.delete(interaction.id);
  }
}

// Interaction Handlers
async function handleBlockCommand(interaction) {
  const ip = interaction.options.getString("ip");
  const reason = interaction.options.getString("reason") || "No reason provided";

  // Validate IP format
  if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
    return safeReply(interaction, {
      content: "⚠️ Invalid IP address format. Please use format like 1.1.1.1",
      ephemeral: true
    });
  }

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

  return safeReply(interaction, {
    ...createIPMessage(ip, true, "command", reason),
    flags: 64 // Ephemeral response
  });
}

async function handleUnblockCommand(interaction) {
  const ip = interaction.options.getString("ip");

  const exists = await BlockedIP.findOne({ ip });
  if (!exists) {
    return safeReply(interaction, {
      content: `⚠️ IP **${ip}** was not blocked.`,
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

  return safeReply(interaction, {
    ...createIPMessage(ip, false, "command"),
    flags: 64
  });
}

async function handleButtonInteraction(interaction) {
  if (!interaction.isButton()) return;

  // Check if already processing this interaction
  if (activeInteractions.has(interaction.id)) {
    console.warn(`Duplicate button interaction: ${interaction.id}`);
    return;
  }
  activeInteractions.add(interaction.id);

  try {
    // Defer the reply if not already done
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }

    const [action, ip] = interaction.customId.split("_");
    console.log(`Processing ${action} for IP: ${ip}`);

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

      return interaction.editReply(createIPMessage(ip, true, "button"));
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

      return interaction.editReply(createIPMessage(ip, false, "button"));
    }
  } catch (error) {
    console.error("Button interaction error:", error);
    try {
      // Use our safe reply wrapper for error messages
      await safeReply(interaction, {
        content: "⚠️ Failed to process button click",
        ephemeral: true
      });
    } catch (err) {
      console.error("Failed to send error follow-up:", err);
    }
  } finally {
    activeInteractions.delete(interaction.id);
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
      await safeReply(interaction, { 
        content: "⚠️ Something went wrong.", 
        flags: 64 
      });
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

    const sentMsg = await channel.send({
      ...createIPMessage(ip, false, "system", "Suspicious activity detected"),
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

    await msg.edit(createIPMessage(ip, action === "block", "dashboard"));
  } catch (err) {
    console.error("❌ Failed to update Discord message:", err);
  }
}

// Initialize
client.once("ready", () => {
  console.log("🤖 Discord bot logged in");
  registerCommands();
});

// Error Handling
client.on("error", error => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

module.exports = { 
  client, 
  sendAlertMessage, 
  updateDiscordMessage 
};