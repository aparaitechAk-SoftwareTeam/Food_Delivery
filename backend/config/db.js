const mongoose = require("mongoose");

const connectDB = async (uri) => {
  if (process.env.MOCK_DB === "true") {
    console.log("Mock In-Memory Database Mode forced by environment variable.");
    return;
  }

  if (!uri || typeof uri !== "string") {
    console.warn("Invalid MongoDB URI. Starting in Mock In-Memory Database Mode...");
    process.env.MOCK_DB = "true";
    return;
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
    process.env.MOCK_DB = "false";
  } catch (error) {
    console.error("MongoDB connection failed. Starting in Mock In-Memory Database Mode...", error.message);
    process.env.MOCK_DB = "true";
  }
};

module.exports = connectDB;
