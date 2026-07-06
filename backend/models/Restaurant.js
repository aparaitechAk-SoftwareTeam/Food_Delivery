const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String, default: "25-35 mins" },
  image: String,
  reviewCount: { type: Number, default: 0 },
  distance: { type: Number, default: 1.0 },
  cuisine: [{ type: String }],
  offerPercentage: { type: Number, default: 0 },
  vegType: { type: String, enum: ["veg", "non-veg", "both"], default: "both" },
  isOpen: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  restaurantType: {
    type: String,
    enum: ["Pure Veg", "Multi Cuisine", "Cafe", "Bakery", "Cloud Kitchen"],
    default: "Multi Cuisine",
  },
  openingTime: { type: String, default: "09:00 AM" },
  closingTime: { type: String, default: "11:00 PM" },
  deliveryCharges: { type: Number, default: 40 },
  minimumOrder: { type: Number, default: 100 },
  gst: { type: Number, default: 5 },
  packagingCharges: { type: Number, default: 20 },
  contactNumber: { type: String, default: "+91 99999 88888" },
  email: { type: String, default: "contact@foodexpress.com" },
  socialLinks: {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" }
  },
  googleMapsLocation: { type: String, default: "" },
  deliveryRadius: { type: Number, default: 5.0 },
  paymentMethods: [
    {
      name: { type: String },
      enabled: { type: Boolean, default: true },
      sortOrder: { type: Number, default: 0 }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
