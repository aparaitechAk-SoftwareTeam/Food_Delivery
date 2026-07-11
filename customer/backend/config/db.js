const mongoose = require("mongoose");

const connectDB = async (uri) => {
  if (process.env.MOCK_DB === "true") {
    console.log("Mock In-Memory Database Mode forced by environment variable.");
    return;
  }

  if (!uri || typeof uri !== "string") {
    console.warn("Invalid or missing MongoDB URI. Falling back to Mock In-Memory Database.");
    process.env.MOCK_DB = "true";
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected successfully");
    process.env.MOCK_DB = "false";
  } catch (error) {
    console.warn("MongoDB connection failed:", error.message);
    console.warn("Falling back to Mock In-Memory Database Mode.");
    process.env.MOCK_DB = "true";
  }
};


module.exports = connectDB;