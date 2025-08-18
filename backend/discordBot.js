// backend/bot/discordBot.js
require("dotenv").config();
const { 
  Client, GatewayIntentBits, REST, Routes, 
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require("discord.js");
const BlockedIP = require("./models/BlockedIP");   // 👈 fixed path
const Incident = require("./models/Incident");     // 👈 fixed path

// ---- 1. Setup Bot ----
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// ---- 2. Register Slash Commands ----
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

// ---- 3. Handle All Interactions ----
client.on("interactionCreate", async (interaction) => {
  try {
    // ✅ Slash Commands
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "block") {
        const ip = interaction.options.getString("ip");
        const reason = interaction.options.getString("reason") || "Blocked via Discord";

        await BlockedIP.create({ ip, reason });
        await Incident.create({
          user: interaction.user.tag,
          ip,
          type: "admin_block",
          reason,
          severity: "high",
          threat: true,
        });

        // Add Unblock button
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`unblock_${ip}`)
            .setLabel("Unblock")
            .setStyle(ButtonStyle.Danger)
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

        await interaction.reply(`✅ IP **${ip}** unblocked.`);
      }
    }

    // ✅ Button Interactions
    if (interaction.isButton() && interaction.customId.startsWith("unblock_")) {
      const ip = interaction.customId.split("_")[1];

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
        components: [],
      });
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "⚠️ Something went wrong.", ephemeral: true });
    } else {
      await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
    }
  }
});

// ---- 4. Utility: Send Alerts to Discord ----
async function sendAlertMessage(message) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ALERT_CHANNEL_ID);
    if (channel) {
      await channel.send(message);
    } else {
      console.error("❌ Alert channel not found (check DISCORD_ALERT_CHANNEL_ID)");
    }
  } catch (err) {
    console.error("❌ Failed to send alert:", err);
  }
}

// ---- Export client + sendAlertMessage ----
module.exports = { client, sendAlertMessage };
