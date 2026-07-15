const mongoose = require("mongoose");

const clearDatabase = async () => {
  try {
    console.log("[ClearDB] Starting database wipe...");

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      console.log(`[ClearDB] Dropping or clearing collection: ${key}`);
      try {
        await collections[key].deleteMany({});
        console.log(`[ClearDB] Collection ${key} cleared successfully.`);
      } catch (err) {
        console.error(`[ClearDB] Failed to clear collection ${key}:`, err.message);
      }
    }

    console.log("[ClearDB] Database wipe completed successfully.");
  } catch (error) {
    console.error("[ClearDB] Error executing database wipe:", error.message);
  }
};

module.exports = clearDatabase;
