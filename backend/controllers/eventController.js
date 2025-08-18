const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Events 
} = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

// ✅ Import models
const BlockedIP = require("./models/BlockedIP");
const Incident = require("./models/Incident");

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

client.once(Events.ClientReady, () => {
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

// Function to create action row dynamically
function createButtons(isBlocked) {
  const row = new ActionRowBuilder();

  if (isBlocked) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("unblock_ip")
        .setLabel("✅ Unblock IP")
        .setStyle(ButtonStyle.Success)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("block_ip")
        .setLabel("🚫 Block IP")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return row;
}

// Example: send incident with buttons
async function sendIncidentMessage(channelId, ip) {
  const channel = await client.channels.fetch(channelId);

  const row = createButtons(false); // start with Block button

  await channel.send({
    content: `⚠️ Suspicious activity detected from **${ip}**`,
    components: [row],
  });
}

// Handle button clicks
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const ip = "192.168.1.10"; // ⚠️ Example IP, replace with dynamic

  try {
    if (interaction.customId === "block_ip") {
      await BlockedIP.updateOne(
        { ip },
        { ip, reason: "Suspicious activity", blockedAt: new Date() },
        { upsert: true }
      );

      await interaction.update({
        content: `🚫 IP **${ip}** has been blocked.`,
        components: [createButtons(true)], // show Unblock button
      });
    }

    if (interaction.customId === "unblock_ip") {
      await BlockedIP.deleteOne({ ip });

      await interaction.update({
        content: `✅ IP **${ip}** has been unblocked.`,
        components: [createButtons(false)], // show Block button
      });
    }
  } catch (err) {
    console.error("❌ Interaction error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "⚠️ Something went wrong.",
        ephemeral: true,
      });
    }
  }
});

// Start bot
client.login(process.env.DISCORD_TOKEN);

module.exports = { sendIncidentMessage };
