require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const BlockedIP = require('./models/BlockedIP');
const Incident = require('./models/Incident');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ALERT_CHANNEL_ID = process.env.DISCORD_ALERT_CHANNEL_ID;

if (!DISCORD_BOT_TOKEN) {
  console.error('Error: DISCORD_BOT_TOKEN is not set.');
  process.exit(1);
}

client.login(DISCORD_BOT_TOKEN);

client.once('ready', () => {
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

client.on('error', (err) => {
  console.error('Discord client error:', err);
});

async function sendAlertMessage(message) {
  try {
    if (!client.isReady()) {
      console.warn("Discord client not ready, cannot send alert.");
      return;
    }

    const channel = await client.channels.fetch(ALERT_CHANNEL_ID);
    if (!channel) {
      console.warn("Alert channel not found.");
      return;
    }

    await channel.send(message);
    console.log("Message sent to Discord successfully.");
  } catch (err) {
    console.error("Failed to send alert message:", err);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

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
          threat: true,
        });
        message.reply(`IP ${ip} blocked successfully.`);
      }
    } catch (err) {
      console.error(err);
      message.reply('Failed to block IP.');
    }
  }

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
          threat: false,
        });
        message.reply(`IP ${ip} unblocked successfully.`);
      }
    } catch (err) {
      console.error(err);
      message.reply('Failed to unblock IP.');
    }
  }
});

module.exports = { sendAlertMessage, client };
