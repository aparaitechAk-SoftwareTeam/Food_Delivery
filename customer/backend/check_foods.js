require("dotenv").config();
const mongoose = require("mongoose");
const Food = require("./models/Food");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("Missing MONGO_URI in environment variables. Make sure backend/.env has MONGO_URI set.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
  const foods = await Food.find().limit(5).lean();
  console.log("Foods sample:", JSON.stringify(foods, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
