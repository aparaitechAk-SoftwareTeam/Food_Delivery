const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const Food = require("../models/Food");
const Banner = require("../models/Banner");

const seedDatabase = async () => {
  try {
    console.log("Checking database state...");
    const restaurantCount = await Restaurant.countDocuments();
    
    // We only seed if there are fewer than 10 restaurants, to allow upgrading to 50
    if (restaurantCount > 10) {
      console.log("Database already has seeded restaurants. Skipping seed...");
      return;
    }

    console.log("Wiping existing collections...");
    await Category.deleteMany({});
    await Restaurant.deleteMany({});
    await Food.deleteMany({});
    await Banner.deleteMany({});

    console.log("Seeding Category list...");
    const categoriesData = [
      { name: "Pizza", icon: "pizza" },
      { name: "Burger", icon: "hamburger" },
      { name: "Biryani", icon: "rice" },
      { name: "Chinese", icon: "noodles" },
      { name: "South Indian", icon: "food-variant" },
      { name: "Desserts", icon: "cupcake" },
      { name: "Beverages", icon: "coffee" },
      { name: "Fast Food", icon: "food" },
      { name: "Snacks", icon: "cookie" },
    ];
    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${seededCategories.length} categories.`);

    const catMap = {};
    seededCategories.forEach((cat) => {
      catMap[cat.name] = cat._id;
    });

    // Lists of restaurant prefixes/suffixes for generating 50 restaurants
    const prefixes = [
      "Taste of", "Special", "Royal", "Saffron", "Tandoori", "Delhi", "Mumbai", 
      "Biryani", "The Spice", "Flavors of", "Grand", "Urban", "Desi", "Ghar Ka", 
      "Express", "Punjabi", "Classic", "Hot & Spicy", "Laziz", "Zaika", "Green", 
      "National", "Sweet & Sour", "Ancient", "Modern", "Quick", "Star"
    ];
    const suffixes = [
      "Kitchen", "Dhaba", "Bistro", "Treat", "Dine", "Palace", "House", "Corner", 
      "Bazaar", "Hub", "Point", "Cafe", "Grill", "Villas", "Chaat", "Sweets",
      "Studio", "Junction", "Express", "Garden", "Lounge", "Zone"
    ];
    const cuisinesList = [
      "South Indian", "North Indian", "Chinese", "Mughlai", "Desserts", 
      "Beverages", "Italian", "Fast Food", "Continental", "Street Food", "Bakery"
    ];
    const restaurantTypes = ["Pure Veg", "Multi Cuisine", "Cafe", "Bakery", "Cloud Kitchen"];
    const locations = ["Baramati", "Phaltan", "Indapur", "Jejuri", "Bhigwan", "Daund", "Nira", "Patas", "Morgaon"];
    const deliveryTimes = ["10-15 mins", "15-20 mins", "20-25 mins", "25-35 mins", "30-40 mins", "35-45 mins"];
    
    // Image lists
    const restaurantImages = [
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1603133872871-7a2acf087d74?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1523362628745-0c100150b7a5?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80"
    ];

    const foodTemplates = {
      "Pizza": [
        { name: "Cheese Burst Pizza", desc: "Loaded with extra cheese and signature sauce.", price: 299, tags: ["Best Seller", "Cheese Lover"] },
        { name: "Paneer Tikka Pizza", desc: "Tandoori paneer cubes, capsicum, and onions.", price: 249, tags: ["Spicy", "Chef Special"] },
        { name: "Margherita Pizza", desc: "Classic mozzarella cheese and fresh basil.", price: 179, tags: ["Classic"] },
        { name: "Pepperoni Pizza", desc: "Spicy chicken pepperoni slice on cheese burst crust.", price: 349, tags: ["Best Seller"] },
        { name: "Garden Veggie Pizza", desc: "Olives, sweet corn, mushrooms, and jalapeños.", price: 229, tags: ["Healthy"] },
        { name: "Capsicum Onion Pizza", desc: "Fresh capsicum and red onion on cheese base.", price: 149, tags: ["Budget Friendly"] }
      ],
      "Burger": [
        { name: "Veg Cheese Burger", desc: "Crispy veg patty, cheddar cheese slice, and mayo.", price: 89, tags: ["Classic"] },
        { name: "Spicy Paneer Burger", desc: "Spicy grilled paneer patty with lettuce and spicy sauce.", price: 139, tags: ["Spicy"] },
        { name: "Chicken Zinger Burger", desc: "Crispy chicken breast, lettuce, and creamy dressing.", price: 159, tags: ["Best Seller"] },
        { name: "Crispy Aloo Tikki Burger", desc: "Classic potato patty burger with onion slices.", price: 59, tags: ["Budget Friendly"] },
        { name: "Double Cheese Burger", desc: "Two patties, double cheese slices, and pickles.", price: 189, tags: ["Heavy Meal"] }
      ],
      "Biryani": [
        { name: "Chicken Dum Biryani", desc: "Basmati rice cooked with tender chicken and spices.", price: 220, tags: ["Best Seller", "Must Try"] },
        { name: "Mutton Dum Biryani", desc: "Fragrant rice layered with slow-cooked mutton.", price: 320, tags: ["Chef Special"] },
        { name: "Veg Hyderabadi Biryani", desc: "Rich combination of fresh vegetables and basmati rice.", price: 160, tags: ["Healthy"] },
        { name: "Egg Biryani", desc: "Aromatic biryani rice served with boiled eggs.", price: 140, tags: ["Spicy"] },
        { name: "Paneer Tikka Biryani", desc: "Grilled paneer tikka marinated in biryani spices.", price: 190, tags: ["Veg Delight"] }
      ],
      "Chinese": [
        { name: "Veg Fried Rice", desc: "Wok-tossed rice with chopped carrots, beans, and soy.", price: 110, tags: ["Classic"] },
        { name: "Veg Hakka Noodles", desc: "Classic Chinese street style noodles with bell peppers.", price: 120, tags: ["Best Seller"] },
        { name: "Chicken Manchurian", desc: "Crispy chicken balls in spicy soy garlic gravy.", price: 180, tags: ["Spicy"] },
        { name: "Veg Manchurian", desc: "Deep fried veg balls cooked in spicy Manchurian sauce.", price: 140, tags: ["Most Popular"] },
        { name: "Chilli Paneer", desc: "Paneer cubes tossed with capsicum, onion, and hot chillies.", price: 160, tags: ["Spicy"] }
      ],
      "South Indian": [
        { name: "Masala Dosa", desc: "Crispy crepe filled with potato masala served with sambhar.", price: 80, tags: ["Classic", "Best Seller"] },
        { name: "Mysore Masala Dosa", desc: "Dosa with spicy red garlic chutney and potato filling.", price: 95, tags: ["Spicy"] },
        { name: "Idli Sambhar", desc: "Soft steamed rice cakes served with sambhar and chutney.", price: 50, tags: ["Healthy", "Breakfast"] },
        { name: "Medu Vada", desc: "Crispy fried lentil donuts served hot with sambhar.", price: 60, tags: ["Breakfast"] },
        { name: "Onion Rava Masala Dosa", desc: "Crispy semolina dosa topped with chopped onions.", price: 110, tags: ["Chef Special"] }
      ],
      "Desserts": [
        { name: "Gulab Jamun", desc: "Warm milk dumplings in flavored sugar syrup (2 Pcs).", price: 45, tags: ["Sweet Tooth"] },
        { name: "Kaju Katli", desc: "Traditional cashew fudge slices (4 Pcs).", price: 90, tags: ["Gift Box"] },
        { name: "Sizzling Chocolate Brownie", desc: "Warm brownie with chocolate sauce.", price: 120, tags: ["Best Seller"] },
        { name: "Rasmalai", desc: "Sweet cottage cheese discs soaked in saffron milk (2 Pcs).", price: 70, tags: ["Most Popular"] },
        { name: "Butterscotch Ice Cream", desc: "Creamy butterscotch scoop with crunchies.", price: 60, tags: ["Kids Special"] }
      ],
      "Beverages": [
        { name: "Cold Coffee", desc: "Chilled milk, espresso, and vanilla ice cream blend.", price: 80, tags: ["Must Try"] },
        { name: "Mango Lassi", desc: "Creamy sweet yogurt drink with fresh mango pulp.", price: 60, tags: ["Cooling"] },
        { name: "Masala Chai", desc: "Hot brewed tea with ginger, cardamom, and milk.", price: 30, tags: ["Morning Fuel"] },
        { name: "Fresh Lime Soda", desc: "Fizzy lime water with sweet or salted syrup.", price: 40, tags: ["Cooling"] },
        { name: "Mint Mojito", desc: "Refreshing carbonated soda with crushed mint and lemon.", price: 90, tags: ["Kids Special"] }
      ],
      "Fast Food": [
        { name: "Pav Bhaji", desc: "Spiced mashed vegetable gravy served with buttered buns.", price: 110, tags: ["Must Try", "Street Food"] },
        { name: "Misal Pav", desc: "Spicy curry topped with farsan, served with pav.", price: 90, tags: ["Spicy", "Maharashtrian"] },
        { name: "French Fries", desc: "Crispy salted golden potato fries.", price: 70, tags: ["Kids Favorite"] },
        { name: "Cheese Garlic Bread", desc: "Buttered garlic bread toasted with mozzarella.", price: 120, tags: ["Cheese Lover"] },
        { name: "Paneer Kathi Roll", desc: "Paratha wrap stuffed with spiced paneer, onions, and sauces.", price: 100, tags: ["Grab & Go"] }
      ],
      "Snacks": [
        { name: "Paneer Pakoda", desc: "Paneer cubes dipped in spiced gram flour batter and fried.", price: 80, tags: ["Rainy Day Special"] },
        { name: "Veg Cutlet", desc: "Crispy patties made of mixed vegetables and breadcrumbs.", price: 60, tags: ["Healthy Option"] },
        { name: "Onion Bhaji", desc: "Crispy onion fritters flavored with spices.", price: 50, tags: ["Tea Companion"] },
        { name: "Dahi Puri", desc: "Puri filled with potatoes, yogurt, sweet and green chutneys.", price: 70, tags: ["Street Food", "Best Seller"] },
        { name: "Sev Puri", desc: "Puri topped with potatoes, onions, chutneys, and fine sev.", price: 60, tags: ["Street Food"] }
      ]
    };

    console.log("Generating 50 restaurants & 15-20 products per restaurant...");
    const restaurantsBatch = [];
    const foodsBatch = [];

    // Let's create names without duplicates
    const usedNames = new Set();

    for (let i = 1; i <= 50; i++) {
      let restName = "";
      do {
        const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
        restName = `${pref} ${suff}`;
      } while (usedNames.has(restName));
      
      usedNames.add(restName);

      const rType = restaurantTypes[Math.floor(Math.random() * restaurantTypes.length)];
      // Enforce Veg Type if Pure Veg
      const vType = rType === "Pure Veg" ? "veg" : Math.random() > 0.4 ? "both" : "non-veg";
      const rating = parseFloat((3.8 + Math.random() * 1.1).toFixed(1));
      const dist = parseFloat((0.5 + Math.random() * 6.0).toFixed(1));
      
      // select 2-4 cuisines
      const sampleCuisines = [];
      const numCuisines = 2 + Math.floor(Math.random() * 3);
      while (sampleCuisines.length < numCuisines) {
        const c = cuisinesList[Math.floor(Math.random() * cuisinesList.length)];
        if (!sampleCuisines.includes(c)) sampleCuisines.push(c);
      }

      const restObj = {
        name: restName,
        address: `${10 + i}, ${locations[Math.floor(Math.random() * locations.length)]} Road`,
        rating: rating,
        deliveryTime: deliveryTimes[Math.floor(Math.random() * deliveryTimes.length)],
        image: restaurantImages[Math.floor(Math.random() * restaurantImages.length)],
        reviewCount: Math.floor(40 + Math.random() * 760),
        distance: dist,
        cuisine: sampleCuisines,
        offerPercentage: Math.random() > 0.3 ? [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)] : 0,
        vegType: vType,
        isOpen: Math.random() > 0.1, // 90% open
        isFeatured: Math.random() > 0.8, // 20% featured
        restaurantType: rType
      };

      restaurantsBatch.push(restObj);
    }

    // Insert Restaurants
    const seededRestaurants = await Restaurant.insertMany(restaurantsBatch);
    console.log(`Seeded ${seededRestaurants.length} Restaurants.`);

    // Generate products (foods) for each Restaurant
    for (let rIndex = 0; rIndex < seededRestaurants.length; rIndex++) {
      const rest = seededRestaurants[rIndex];
      const numProducts = 15 + Math.floor(Math.random() * 6); // 15 to 20 products
      
      // Determine what categories of food this restaurant sells based on its cuisines/type
      const availableCategories = Object.keys(foodTemplates);
      
      // For each product we want to generate:
      const generatedFoodsForRest = [];
      const selectedFoodNames = new Set();

      for (let pIndex = 0; pIndex < numProducts; pIndex++) {
        // Select category
        const catName = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const catId = catMap[catName];
        
        // Select template dish
        const templates = foodTemplates[catName];
        let template = templates[Math.floor(Math.random() * templates.length)];
        
        // Avoid duplicate food names in same restaurant
        let loopCount = 0;
        while (selectedFoodNames.has(template.name) && loopCount < 10) {
          template = templates[Math.floor(Math.random() * templates.length)];
          loopCount++;
        }
        selectedFoodNames.add(template.name);

        const discountPercentage = Math.random() > 0.4 ? [10, 15, 20, 25, 30, 50][Math.floor(Math.random() * 6)] : 0;
        const price = template.price;
        const originalPrice = discountPercentage > 0 ? Math.round(price / (1 - (discountPercentage / 100))) : price;

        // Enforce veg flag if restaurant is Pure Veg
        let isVeg = true;
        if (rest.vegType === "non-veg") {
          isVeg = false;
        } else if (rest.vegType === "both") {
          // Biryani and Pizza can be non-veg, South Indian/Dessert/Snack are usually veg
          if (["Biryani", "Burger", "Pizza", "Chinese", "Fast Food"].includes(catName)) {
            isVeg = Math.random() > 0.5;
          } else {
            isVeg = true;
          }
        }
        
        // Adjust name if non-veg
        let finalFoodName = template.name;
        if (!isVeg && !finalFoodName.toLowerCase().includes("chicken") && !finalFoodName.toLowerCase().includes("mutton") && !finalFoodName.toLowerCase().includes("egg")) {
          finalFoodName = "Chicken " + finalFoodName;
        }

        const foodObj = {
          name: finalFoodName,
          description: template.desc,
          price: price,
          originalPrice: originalPrice,
          discountPercentage: discountPercentage,
          category: catId,
          restaurant: rest._id,
          image: rest.image, // Reuse restaurant images or placeholder for simplicity
          rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
          isFeatured: Math.random() > 0.8,
          isPopular: Math.random() > 0.8,
          preparationTime: 10 + Math.floor(Math.random() * 30),
          isVeg: isVeg,
          isAvailable: Math.random() > 0.05, // 95% available
          popularityScore: Math.floor(10 + Math.random() * 90),
          tags: template.tags,
        };

        foodsBatch.push(foodObj);
      }
    }

    // Insert Foods
    const seededFoods = await Food.insertMany(foodsBatch);
    console.log(`Seeded ${seededFoods.length} Foods total (Avg. ${Math.round(seededFoods.length / 50)} per restaurant).`);

    // 4. Seed Banners
    const bannersData = [
      {
        title: "99 store",
        description: "Meals At ₹99",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        cta: "99store",
      },
      {
        title: "Flat ₹150 OFF & More",
        description: "Use code FLAT150",
        image: "https://images.unsplash.com/photo-1594007653308-d4d8d2ab5d73?auto=format&fit=crop&w=800&q=80",
        cta: "flat150",
      },
      {
        title: "Get 60% OFF + Cashback",
        description: "Up to ₹120 off",
        image: "https://images.unsplash.com/photo-1605476879656-3b27c8d9db90?auto=format&fit=crop&w=800&q=80",
        cta: "cashback60",
      },
    ];
    const seededBanners = await Banner.insertMany(bannersData);
    console.log(`Seeded ${seededBanners.length} banners.`);

    console.log("Database successfully seeded with 50 Restaurants & 800+ Products!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

module.exports = seedDatabase;
