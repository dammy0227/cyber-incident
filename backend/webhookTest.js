require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ALERT_CHANNEL_ID = process.env.DISCORD_ALERT_CHANNEL_ID;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(ALERT_CHANNEL_ID);
    if (!channel) {
      console.log("Channel not found or inaccessible");
      process.exit(1);
    }
    await channel.send("Test message from Render!");
    console.log("Message sent!");
  } catch (error) {
    console.error("Failed to send message:", error);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(DISCORD_BOT_TOKEN);
