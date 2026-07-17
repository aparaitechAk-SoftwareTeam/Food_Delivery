const Combo = require("../models/Combo");
const Food = require("../models/Food");

const syncExistingCombos = async () => {
  try {
    console.log("Synchronizing existing combos into Food collection...");
    const combos = await Combo.find().populate({
      path: "items",
      populate: { path: "restaurant" }
    });

    for (const combo of combos) {
      const firstRest = combo.items && combo.items.length > 0
        ? combo.items[0].restaurant?._id || combo.items[0].restaurant
        : null;

      const foodPayload = {
        name: combo.name,
        description: combo.description || "Curated meal combo with discount savings.",
        price: combo.price,
        originalPrice: combo.originalPrice || combo.price,
        image: combo.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
        isCombo: true,
        isAvailable: combo.isActive !== false,
        rating: 4.8,
        preparationTime: 25,
        restaurant: firstRest
      };

      await Food.findByIdAndUpdate(
        combo._id,
        { $set: foodPayload },
        { upsert: true, new: true }
      );
    }
    console.log(`Successfully synchronized ${combos.length} combos to the Food collection.`);
  } catch (error) {
    console.error("Error in syncExistingCombos:", error.message);
  }
};

module.exports = syncExistingCombos;
