const Restaurant = require("../models/Restaurant");
const Food = require("../models/Food");

const initSingleRestaurant = async () => {
  try {
    // 1. Ensure at least one restaurant exists
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log("Seeding default single restaurant...");
      restaurant = await Restaurant.create({
        name: "FoodExpress Premium Kitchen",
        address: "10, Vidyanagar Road, Baramati",
        deliveryTime: "20-25 mins",
        image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80",
        cuisine: ["South Indian", "North Indian", "Chinese", "Desserts", "Beverages"],
        offerPercentage: 20,
        restaurantType: "Multi Cuisine",
        isOpen: true,
        isFeatured: true,
        isActive: true,
      });
      console.log("Default single restaurant seeded successfully.");
    }

    // 2. Clean up multiple restaurants if any exist (enforce single restaurant)
    const allRests = await Restaurant.find();
    if (allRests.length > 1) {
      console.log(`Enforcing single restaurant: keeping '${restaurant.name}' and removing ${allRests.length - 1} duplicate(s)...`);
      await Restaurant.deleteMany({ _id: { $ne: restaurant._id } });
    }

    // 3. Link all foods to this single restaurant
    const foodsToUpdate = await Food.countDocuments({ restaurant: { $ne: restaurant._id } });
    if (foodsToUpdate > 0) {
      console.log(`Linking ${foodsToUpdate} food items to the single restaurant...`);
      await Food.updateMany(
        { restaurant: { $ne: restaurant._id } },
        { $set: { restaurant: restaurant._id } }
      );
      console.log("All foods linked successfully.");
    }
  } catch (error) {
    console.error("Error in initSingleRestaurant:", error.message);
  }
};

module.exports = initSingleRestaurant;
