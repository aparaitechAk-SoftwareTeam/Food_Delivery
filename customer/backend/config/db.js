const mongoose = require("mongoose");

const connectDB = async (uri) => {
  if (!uri || typeof uri !== "string") {
    throw new Error("Invalid or missing MongoDB URI.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log("MongoDB connected successfully");
};


module.exports = connectDB;