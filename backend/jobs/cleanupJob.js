const cron = require("node-cron");
const Incident = require("../models/Incident");

function startCleanupJob() {
  // Every day at midnight
  cron.schedule("0 0 * * *", async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await Incident.deleteMany({ createdAt: { $lt: weekAgo } });
    console.log(`🧹 Deleted ${result.deletedCount} old incidents`);
  });
}

module.exports = startCleanupJob;
