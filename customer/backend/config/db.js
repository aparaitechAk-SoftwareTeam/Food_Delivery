const mongoose = require("mongoose");

const connectDB = async (uri) => {
  if (!uri || typeof uri !== "string") {
    throw new Error("Invalid or missing MongoDB URI. Cannot connect to database.");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected successfully");
    process.env.MOCK_DB = "false";
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};


module.exports = connectDB;