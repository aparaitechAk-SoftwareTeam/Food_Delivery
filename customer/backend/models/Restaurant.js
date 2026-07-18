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
  isTrending: { type: Boolean, default: false },
  isNewRestaurant: {
    type: Boolean,
    default: false,
    get: function(v) {
      if ((v === undefined || v === false) && this._doc && this._doc.isNew !== undefined) {
        return this._doc.isNew;
      }
      return v;
    }
  },
  isRecommended: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
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
  currency: { type: String, default: '₹' },
  prepTime: { type: Number, default: 25 },
  unit: { type: String, default: 'Servings' },
  contactNumber: { type: String, default: "+91 99999 88888" },
  email: { type: String, default: "contact@foodexpress.com" },
  socialLinks: {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" }
  },
  googleMapsLocation: { type: String, default: "" },
  deliveryRadius: { type: Number, default: 5.0 },
  latitude: { type: Number, default: 18.1560 }, // Default Baramati coordinates
  longitude: { type: Number, default: 74.5775 },
  paymentMethods: [
    {
      name: { type: String },
      enabled: { type: Boolean, default: true },
      sortOrder: { type: Number, default: 0 }
    }
  ],
  upiId: { type: String, default: "CloudKitchen@okaxis" },
  cashbackEnabled: { type: Boolean, default: true },
  cashbackAmount: { type: Number, default: 150 },
  cashbackRequiredOrders: { type: Number, default: 4 },
  cashbackExpiryHours: { type: Number, default: 48 },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

restaurantSchema.index({ name: 1 });

module.exports = mongoose.model("Restaurant", restaurantSchema);
