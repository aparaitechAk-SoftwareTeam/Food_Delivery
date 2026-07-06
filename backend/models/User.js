const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  addresses: [
    {
      label: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      isDefault: { type: Boolean, default: false },
    },
  ],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
  role: { type: String, enum: ["customer", "admin", "delivery"], default: "customer" },
  isBlocked: { type: Boolean, default: false },
  vehicleType: { type: String },
  vehicleNumber: { type: String },
  licenseNumber: { type: String },
  isOnline: { type: Boolean, default: false },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    updatedAt: { type: Date }
  },
  profilePhoto: { type: String },
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
