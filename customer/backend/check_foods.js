const mongoose = require("mongoose");
const Food = require("./models/Food");

const uri = "mongodb+srv://foodexpress_db:Aparaitech2129@cluster0.bxevqzc.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
  const foods = await Food.find().limit(5).lean();
  console.log("Foods sample:", JSON.stringify(foods, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
