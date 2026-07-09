const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn("⚠️  Razorpay credentials are not fully configured in environment variables.");
}

const razorpay = new Razorpay({
  key_id: keyId || "dummy_key_id",
  key_secret: keySecret || "dummy_key_secret",
});

module.exports = razorpay;
