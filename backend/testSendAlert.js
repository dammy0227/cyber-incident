require("dotenv").config();
const sendDiscordAlert = require("./utils/sendDiscordAlert");

async function testAlert() {
  const dummyIncident = {
    user: "testuser@example.com",
    ip: "123.45.67.89",
    type: "login",
    reason: "Test alert from script",
    severity: "medium",
    threat: true,
    createdAt: new Date(),
  };

  try {
    await sendDiscordAlert(dummyIncident);
    console.log("✅ Test alert sent!");
  } catch (err) {
    console.error("❌ Failed to send test alert:", err);
  }
}

testAlert();
