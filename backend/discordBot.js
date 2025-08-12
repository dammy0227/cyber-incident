// discordBot.js
require('dotenv').config(); // Load environment variables early

const { Client, GatewayIntentBits } = require('discord.js');
const BlockedIP = require('./models/BlockedIP');
const Incident = require('./models/Incident');

// Create a new Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Access guild (server) info
    GatewayIntentBits.GuildMessages,    // Listen for guild messages
    GatewayIntentBits.MessageContent    // Access message content
  ]
});

// Read token and alert channel ID from environment variables
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ALERT_CHANNEL_ID = process.env.DISCORD_ALERT_CHANNEL_ID;

// Check for presence of token before login
if (!DISCORD_BOT_TOKEN) {
  console.error('Error: DISCORD_BOT_TOKEN is not set in environment variables.');
  process.exit(1);
}

// Login the Discord client
client.login(DISCORD_BOT_TOKEN)
  .then(() => console.log(`🤖 Discord bot logged in as ${client.user.tag}`))
  .catch(err => {
    console.error('Discord bot login failed:', err);
    process.exit(1);
  });

// Send alert messages to the configured Discord channel
async function sendAlertMessage(message) {
  try {
    console.log("Sending Discord alert:", message);

    console.log("Fetching Discord channel...");
    const channel = await client.channels.fetch(ALERT_CHANNEL_ID);

    if (!channel) {
      console.warn("Alert channel not found.");
      return;
    }

    console.log("Channel found, sending message...");
    await channel.send(message);

    console.log("Message sent to Discord successfully.");
  } catch (err) {
    console.error("Failed to send alert message:", err);
  }
}

// Listen for Discord messages to support admin commands (!block, !unblock)
client.on('messageCreate', async (message) => {
  // Ignore messages from bots (including itself)
  if (message.author.bot) return;

  // Command to block an IP: !block <ip> [reason]
  if (message.content.startsWith('!block ')) {
    const args = message.content.split(' ');
    const ip = args[1];
    const reason = args.slice(2).join(' ') || 'Blocked via Discord command';

    if (!ip) {
      message.reply('Usage: !block <ip> [reason]');
      return;
    }

    try {
      const exists = await BlockedIP.findOne({ ip });
      if (exists) {
        message.reply(`IP ${ip} is already blocked.`);
      } else {
        await BlockedIP.create({ ip, reason });
        await Incident.create({
          user: message.author.tag,
          ip,
          type: 'admin_block',
          reason,
          severity: 'high',
          threat: true
        });
        message.reply(`IP ${ip} blocked successfully.`);
      }
    } catch (err) {
      console.error(err);
      message.reply('Failed to block IP.');
    }
  }

  // Command to unblock an IP: !unblock <ip>
  if (message.content.startsWith('!unblock ')) {
    const args = message.content.split(' ');
    const ip = args[1];

    if (!ip) {
      message.reply('Usage: !unblock <ip>');
      return;
    }

    try {
      const removed = await BlockedIP.findOneAndDelete({ ip });
      if (!removed) {
        message.reply(`IP ${ip} is not blocked.`);
      } else {
        await Incident.create({
          user: message.author.tag,
          ip,
          type: 'admin_unblock',
          reason: 'Unblocked via Discord command',
          severity: 'low',
          threat: false
        });
        message.reply(`IP ${ip} unblocked successfully.`);
      }
    } catch (err) {
      console.error(err);
      message.reply('Failed to unblock IP.');
    }
  }
});

// Export client and alert function for use in other files
module.exports = { sendAlertMessage, client };
