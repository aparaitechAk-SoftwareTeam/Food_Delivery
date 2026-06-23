const mongoose = require("mongoose");

const connectDB = async (uri) => {
  if (!uri || typeof uri !== "string") {
    console.error(
      "Invalid MongoDB URI. Ensure MONGO_URI is set to a valid connection string.",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;
