require("dotenv").config(); // Load env variables at the very top

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

let isReady = false;

client.once("ready", () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
  isReady = true;
});

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = { client, isReady };
