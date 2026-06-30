const bcrypt = require("bcryptjs");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const Food = require("../models/Food");
const Banner = require("../models/Banner");
const User = require("../models/User");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Coupon = require("../models/Coupon");

const seedDatabase = async () => {
  try {
    console.log("Checking database state...");
    const categoryCount = await Category.countDocuments();
    
    // Force seed if categories list is not fully populated to 100 categories
    if (categoryCount >= 100) {
      console.log("Database already has seeded categories. Skipping seed...");
      return;
    }

    console.log("Wiping existing collections...");
    await Category.deleteMany({});
    await Restaurant.deleteMany({});
    await Food.deleteMany({});
    await Banner.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Coupon.deleteMany({});

    // 1. Seed 100 Categories
    console.log("Seeding 100 Categories...");
    const categoryNames = [
      "Pizza", "Burger", "Biryani", "Chinese", "South Indian", "Desserts", "Beverages", "Fast Food", "Snacks",
      "Breakfast", "Lunch", "Dinner", "North Indian", "Coffee", "Tea", "Ice Cream", "Juices", "Healthy", 
      "Protein Meals", "Rolls", "Street Food", "Meal Bowls", "Pasta", "Sandwiches", "Wraps", "Mocktails",
      "Mughlai", "Italian", "Mexican", "Thai", "Japanese", "Korean", "American", "Continental", "Sea Food",
      "Salads", "Soups", "Kebabs", "Tandoori", "Waffles", "Cakes", "Shakes", "Smoothies", "Chaat", "Samosas",
      "Momos", "Noodles", "Fried Rice", "Manchurian", "Dosa", "Idli", "Vada", "Paratha", "Naan", "Paneer Tikka",
      "Chicken Tikka", "Kadhai Paneer", "Butter Chicken", "Dal Makhani", "Chole Bhature", "Pav Bhaji", "Misal Pav",
      "French Fries", "Spring Rolls", "Tacos", "Nachos", "Quesadillas", "Garlic Bread", "Pasta Alfredo", "Lasagna",
      "Brownies", "Donuts", "Cupcakes", "Muffins", "Pastries", "Breads", "Waffles Premium", "Beverages Cold", 
      "Mocktails Special", "Juices Fresh", "Kulfi", "Lassi", "Buttermilk", "Soda", "Pani Puri", "Bhel Puri", 
      "Samosa Chaat", "Kachori", "Dhokla", "Khandvi", "Poha", "Upma", "Sheera", "Medu Vada", "Dal Bati", 
      "Puran Poli", "Modak", "Gulab Jamun Premium", "Jalebi", "Rabdi"
    ];

    const emojis = {
      "Pizza": "🍕", "Burger": "🍔", "Biryani": "🍛", "Chinese": "🍜", "South Indian": "🥞", 
      "Desserts": "🍰", "Beverages": "🥤", "Fast Food": "🍟", "Snacks": "🍪", "Breakfast": "🍳",
      "Lunch": "🍱", "Dinner": "🍽️", "North Indian": "🫓", "Coffee": "☕", "Tea": "🍵",
      "Ice Cream": "🍦", "Juices": "🍹", "Healthy": "🥗", "Protein Meals": "💪", "Rolls": "🌯",
      "Street Food": "🍢", "Meal Bowls": "🥣", "Pasta": "🍝", "Sandwiches": "🥪", "Wraps": "🌯",
      "Mocktails": "🍹", "Mughlai": "🍖", "Italian": "🍕", "Mexican": "🌮", "Thai": "🍜",
      "Japanese": "🍣", "Korean": "🥘", "American": "🍔", "Continental": "🍗", "Sea Food": "🍤",
      "Salads": "🥗", "Soups": "🍲", "Kebabs": "🍢", "Tandoori": "🍗", "Waffles": "🧇",
      "Cakes": "🎂", "Shakes": "🥤", "Smoothies": "🥤", "Chaat": "🧆", "Samosas": "🥟",
      "Momos": "🥟", "Noodles": "🍝", "Fried Rice": "🍛", "Manchurian": "🧆", "Dosa": "🥞",
      "Idli": "🥞", "Vada": "🥯", "Paratha": "🫓", "Naan": "🫓", "Paneer Tikka": "🍢",
      "Chicken Tikka": "🍢", "Kadhai Paneer": "🍲", "Butter Chicken": "🍛", "Dal Makhani": "🥣",
      "Chole Bhature": "🥯", "Pav Bhaji": "🍛", "Misal Pav": "🥣", "French Fries": "🍟",
      "Spring Rolls": "🌯", "Tacos": "🌮", "Nachos": "🍿", "Quesadillas": "🫓", "Garlic Bread": "🥖",
      "Pasta Alfredo": "🍝", "Lasagna": "🥘", "Brownies": "🍫", "Donuts": "🍩", "Cupcakes": "🧁",
      "Muffins": "🧁", "Pastries": "🍰", "Breads": "🍞", "Waffles Premium": "🧇", "Beverages Cold": "🥤",
      "Mocktails Special": "🍹", "Juices Fresh": "🍹", "Kulfi": "🍦", "Lassi": "🥤", "Buttermilk": "🥛",
      "Soda": "🥤", "Pani Puri": "🧆", "Bhel Puri": "🧆", "Samosa Chaat": "🍛", "Kachori": "🥯",
      "Dhokla": "🧆", "Khandvi": "🌯", "Poha": "🍚", "Upma": "🍛", "Sheera": "🍰", "Medu Vada": "🥯",
      "Dal Bati": "🍛", "Puran Poli": "🥞", "Modak": "🥟", "Gulab Jamun Premium": "🍰", "Jalebi": "🥨",
      "Rabdi": "🥣"
    };

    const categoryImages = {
      "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80",
      "Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80",
      "Biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4d8?auto=format&fit=crop&w=200&q=80",
      "Chinese": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80",
      "South Indian": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=200&q=80",
      "Desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=200&q=80",
      "Beverages": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80",
      "Fast Food": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=200&q=80",
      "Snacks": "https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=200&q=80"
    };

    const categoriesData = categoryNames.map((name) => {
      const img = categoryImages[name] || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80";
      return {
        name,
        image: img
      };
    });
    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${seededCategories.length} categories.`);

    const catMap = {};
    seededCategories.forEach((cat) => {
      catMap[cat.name] = cat._id;
    });

    // 2. Seed 150 Users & 50 Delivery Partners & Demo Accounts
    console.log("Seeding Users and Riders...");
    const customerHash = bcrypt.hashSync("password123", 10);
    const demoAdminHash = bcrypt.hashSync("Admin@123", 10);
    const demoUserHash = bcrypt.hashSync("User@123", 10);
    const demoRiderHash = bcrypt.hashSync("Delivery@123", 10);

    const usersBatch = [
      {
        name: "System Admin",
        email: "admin@foodexpress.com",
        phone: "9876543201",
        password: demoAdminHash,
        role: "admin",
        addresses: []
      },
      {
        name: "Demo User",
        email: "user@foodexpress.com",
        phone: "9876543202",
        password: demoUserHash,
        role: "customer",
        addresses: [
          {
            label: "Home",
            line1: "Flat 101, Green Meadows",
            line2: "Near City Park",
            city: "Baramati",
            state: "Maharashtra",
            postalCode: "413102",
            country: "India",
            isDefault: true
          }
        ]
      },
      {
        name: "Delivery Rider",
        email: "delivery@foodexpress.com",
        phone: "9876543203",
        password: demoRiderHash,
        role: "delivery",
        addresses: []
      }
    ];

    const firstNames = ["Amit", "Priya", "Rahul", "Neha", "Vijay", "Anjali", "Sanjay", "Kiran", "Vikram", "Rooja", "Arjun", "Deepika"];
    const lastNames = ["Sharma", "Patel", "Verma", "Gupta", "Joshi", "Mehta", "Singh", "Reddy", "Rao", "Nair", "Saxena", "Deshmukh"];

    for (let uId = 1; uId <= 147; uId++) {
      const fName = firstNames[uId % firstNames.length];
      const lName = lastNames[uId % lastNames.length];
      usersBatch.push({
        name: `${fName} ${lName}`,
        email: `user${uId}@example.com`,
        phone: `98765432${uId < 10 ? '0' + uId : uId}`,
        password: customerHash,
        role: "customer",
        addresses: [
          {
            label: "Home",
            line1: `${100 + uId}, Sector 15`,
            line2: "Near Market Yard",
            city: "Baramati",
            state: "Maharashtra",
            postalCode: "413102",
            country: "India",
            isDefault: true
          }
        ]
      });
    }

    for (let dId = 1; dId <= 49; dId++) {
      const fName = firstNames[dId % firstNames.length];
      const lName = lastNames[dId % lastNames.length];
      usersBatch.push({
        name: `${fName} ${lName} (Rider)`,
        email: `delivery${dId}@example.com`,
        phone: `91234567${dId < 10 ? '0' + dId : dId}`,
        password: customerHash,
        role: "delivery",
        addresses: []
      });
    }

    const seededUsers = await User.insertMany(usersBatch);
    console.log(`Seeded ${seededUsers.length} Users.`);
    const customerUsers = seededUsers.filter(u => u.role === "customer");

    // 3. Seed 120 Restaurants
    console.log("Seeding 120 Restaurants...");
    const prefixes = [
      "Taste of", "Special", "Royal", "Saffron", "Tandoori", "Delhi", "Mumbai", 
      "Biryani", "The Spice", "Flavors of", "Grand", "Urban", "Desi", "Ghar Ka", 
      "Express", "Punjabi", "Classic", "Hot & Spicy", "Laziz", "Zaika", "Green", 
      "National", "Sweet & Sour", "Ancient", "Modern", "Quick", "Star", "Golden",
      "Flavourful", "Aromatic", "Organic", "Pure", "Tasty", "Yummy"
    ];
    const suffixes = [
      "Kitchen", "Dhaba", "Bistro", "Treat", "Dine", "Palace", "House", "Corner", 
      "Bazaar", "Hub", "Point", "Cafe", "Grill", "Villas", "Chaat", "Sweets",
      "Studio", "Junction", "Express", "Garden", "Lounge", "Zone", "Table", "Spot"
    ];
    const cuisinesList = [
      "South Indian", "North Indian", "Chinese", "Mughlai", "Desserts", 
      "Beverages", "Italian", "Fast Food", "Continental", "Street Food", "Bakery",
      "Mexican", "Japanese", "Healthy", "Thai"
    ];
    const restaurantTypes = ["Pure Veg", "Multi Cuisine", "Cafe", "Bakery", "Cloud Kitchen"];
    const locations = ["Baramati", "Phaltan", "Indapur", "Jejuri", "Bhigwan", "Daund", "Nira", "Patas", "Morgaon"];
    const deliveryTimes = ["10-15 mins", "15-20 mins", "20-25 mins", "25-35 mins", "30-40 mins", "35-45 mins"];
    
    const restaurantImages = [
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1603133872871-7a2acf087d74?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1523362628745-0c100150b7a5?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
    ];

    const foodTemplates = {
      "Pizza": [
        { name: "Cheese Burst Pizza", desc: "Loaded with extra cheese and signature sauce.", price: 299, tags: ["Best Seller", "Cheese Lover"] },
        { name: "Paneer Tikka Pizza", desc: "Tandoori paneer cubes, capsicum, and onions.", price: 249, tags: ["Spicy", "Chef Special"] },
        { name: "Margherita Pizza", desc: "Classic mozzarella cheese and fresh basil.", price: 179, tags: ["Classic"] },
        { name: "Pepperoni Pizza", desc: "Spicy chicken pepperoni slice on cheese burst crust.", price: 349, tags: ["Best Seller"] }
      ],
      "Burger": [
        { name: "Veg Cheese Burger", desc: "Crispy veg patty, cheddar cheese slice, and mayo.", price: 89, tags: ["Classic"] },
        { name: "Spicy Paneer Burger", desc: "Spicy grilled paneer patty with lettuce and spicy sauce.", price: 139, tags: ["Spicy"] },
        { name: "Chicken Zinger Burger", desc: "Crispy chicken breast, lettuce, and creamy dressing.", price: 159, tags: ["Best Seller"] }
      ],
      "Biryani": [
        { name: "Chicken Dum Biryani", desc: "Basmati rice cooked with tender chicken and spices.", price: 220, tags: ["Best Seller", "Must Try"] },
        { name: "Mutton Dum Biryani", desc: "Fragrant rice layered with slow-cooked mutton.", price: 320, tags: ["Chef Special"] },
        { name: "Veg Hyderabadi Biryani", desc: "Rich combination of fresh vegetables and basmati rice.", price: 160, tags: ["Healthy"] }
      ],
      "Chinese": [
        { name: "Veg Fried Rice", desc: "Wok-tossed rice with chopped carrots, beans, and soy.", price: 110, tags: ["Classic"] },
        { name: "Veg Hakka Noodles", desc: "Classic Chinese street style noodles with bell peppers.", price: 120, tags: ["Best Seller"] },
        { name: "Chicken Manchurian", desc: "Crispy chicken balls in spicy soy garlic gravy.", price: 180, tags: ["Spicy"] }
      ],
      "South Indian": [
        { name: "Masala Dosa", desc: "Crispy crepe filled with potato masala served with sambhar.", price: 80, tags: ["Classic", "Best Seller"] },
        { name: "Idli Sambhar", desc: "Soft steamed rice cakes served with sambhar and chutney.", price: 50, tags: ["Healthy", "Breakfast"] }
      ],
      "Desserts": [
        { name: "Gulab Jamun", desc: "Warm milk dumplings in flavored sugar syrup (2 Pcs).", price: 45, tags: ["Sweet Tooth"] },
        { name: "Sizzling Chocolate Brownie", desc: "Warm brownie with chocolate sauce.", price: 120, tags: ["Best Seller"] },
        { name: "Rasmalai", desc: "Sweet cottage cheese discs soaked in saffron milk (2 Pcs).", price: 70, tags: ["Most Popular"] }
      ],
      "Beverages": [
        { name: "Cold Coffee", desc: "Chilled milk, espresso, and vanilla ice cream blend.", price: 80, tags: ["Must Try"] },
        { name: "Mango Lassi", desc: "Creamy sweet yogurt drink with fresh mango pulp.", price: 60, tags: ["Cooling"] }
      ],
      "Fast Food": [
        { name: "Pav Bhaji", desc: "Spiced mashed vegetable gravy served with buttered buns.", price: 110, tags: ["Must Try", "Street Food"] },
        { name: "French Fries", desc: "Crispy salted golden potato fries.", price: 70, tags: ["Kids Favorite"] }
      ],
      "Snacks": [
        { name: "Paneer Pakoda", desc: "Paneer cubes dipped in spiced gram flour batter and fried.", price: 80, tags: ["Rainy Day Special"] },
        { name: "Dahi Puri", desc: "Puri filled with potatoes, yogurt, sweet and green chutneys.", price: 70, tags: ["Street Food", "Best Seller"] }
      ]
    };

    const getTemplatesForCategory = (catName) => {
      if (foodTemplates[catName]) {
        return foodTemplates[catName];
      }
      return [
        { name: `Special ${catName}`, desc: `Freshly prepared, delicious ${catName.toLowerCase()} with signature style.`, price: 120 + Math.floor(Math.random() * 200), tags: ["Chef Special", "Popular"] },
        { name: `Classic ${catName}`, desc: `Traditional style ${catName.toLowerCase()} cooked to perfection.`, price: 80 + Math.floor(Math.random() * 100), tags: ["Classic", "Value"] },
        { name: `Premium ${catName}`, desc: `Exquisite, high-quality ingredients made by expert chefs.`, price: 200 + Math.floor(Math.random() * 250), tags: ["Premium", "Must Try"] },
        { name: `Spicy ${catName}`, desc: `Hot and spicy version of your favorite ${catName.toLowerCase()}.`, price: 110 + Math.floor(Math.random() * 150), tags: ["Spicy", "Hot"] },
        { name: `Healthy ${catName}`, desc: `Low-calorie, nutritious ${catName.toLowerCase()} for fitness lovers.`, price: 150 + Math.floor(Math.random() * 120), tags: ["Healthy", "Fitness"] }
      ];
    };

    const restaurantsBatch = [];
    const usedNames = new Set();

    for (let i = 1; i <= 120; i++) {
      let restName = "";
      do {
        const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
        restName = `${pref} ${suff}`;
      } while (usedNames.has(restName));
      
      usedNames.add(restName);

      const rType = restaurantTypes[Math.floor(Math.random() * restaurantTypes.length)];
      const vType = rType === "Pure Veg" ? "veg" : Math.random() > 0.4 ? "both" : "non-veg";
      
      const restObj = {
        name: restName,
        address: `${10 + i}, ${locations[Math.floor(Math.random() * locations.length)]} Road`,
        rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
        deliveryTime: deliveryTimes[Math.floor(Math.random() * deliveryTimes.length)],
        image: restaurantImages[i % restaurantImages.length],
        reviewCount: Math.floor(40 + Math.random() * 760),
        distance: parseFloat((0.5 + Math.random() * 6.0).toFixed(1)),
        cuisine: [cuisinesList[i % cuisinesList.length], cuisinesList[(i + 1) % cuisinesList.length]],
        offerPercentage: Math.random() > 0.3 ? [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)] : 0,
        vegType: vType,
        isOpen: Math.random() > 0.05,
        isFeatured: Math.random() > 0.8,
        restaurantType: rType
      };
      restaurantsBatch.push(restObj);
    }

    const seededRestaurants = await Restaurant.insertMany(restaurantsBatch);
    console.log(`Seeded ${seededRestaurants.length} Restaurants.`);

    // 4. Seed 2500+ Food Items (approx 22 items per restaurant = 2640 total)
    console.log("Seeding Food items...");
    const foodsBatch = [];
    seededRestaurants.forEach((rest) => {
      const numProducts = 21 + Math.floor(Math.random() * 4); // 21-24 items
      const selectedFoodNames = new Set();

      for (let pIndex = 0; pIndex < numProducts; pIndex++) {
        const catObj = seededCategories[Math.floor(Math.random() * seededCategories.length)];
        const templates = getTemplatesForCategory(catObj.name);
        let template = templates[Math.floor(Math.random() * templates.length)];
        
        let loopCount = 0;
        while (selectedFoodNames.has(template.name) && loopCount < 10) {
          template = templates[Math.floor(Math.random() * templates.length)];
          loopCount++;
        }
        selectedFoodNames.add(template.name);

        const discountPercentage = Math.random() > 0.4 ? [10, 15, 20, 25, 30, 50][Math.floor(Math.random() * 6)] : 0;
        const price = template.price;
        const originalPrice = discountPercentage > 0 ? Math.round(price / (1 - (discountPercentage / 100))) : price;

        let isVeg = true;
        if (rest.vegType === "non-veg") {
          isVeg = false;
        } else if (rest.vegType === "both") {
          if (["Biryani", "Burger", "Pizza", "Chinese", "Fast Food", "Protein Meals", "Rolls", "Wraps", "Kebabs", "Tandoori"].includes(catObj.name)) {
            isVeg = Math.random() > 0.5;
          }
        }

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
          category: catObj._id,
          restaurant: rest._id,
          image: rest.image,
          rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
          isFeatured: Math.random() > 0.8,
          isPopular: Math.random() > 0.8,
          isBestSeller: Math.random() > 0.8,
          isHealthy: catObj.name.toLowerCase().includes("healthy") || catObj.name.toLowerCase().includes("salad") || catObj.name.toLowerCase().includes("soup") || Math.random() > 0.9,
          isCombo: catObj.name.toLowerCase().includes("combo") || catObj.name.toLowerCase().includes("pack") || Math.random() > 0.9,
          preparationTime: 10 + Math.floor(Math.random() * 30),
          isVeg: isVeg,
          isAvailable: Math.random() > 0.05,
          popularityScore: Math.floor(10 + Math.random() * 90),
          tags: template.tags,
        };
        foodsBatch.push(foodObj);
      }
    });

    const seededFoods = await Food.insertMany(foodsBatch);
    console.log(`Seeded ${seededFoods.length} Food items.`);

    // 5. Seed 300 Coupons
    console.log("Seeding 300 Coupons...");
    const couponsBatch = [];
    const couponCodes = ["WELCOME50", "FREEDEL", "SAVE200", "BOGO", "CHEF50", "FESTIVE100", "MEAL120", "EATGREEN", "NIGHT40", "WEEKEND150"];
    for (let oId = 1; oId <= 300; oId++) {
      const code = couponCodes[oId % couponCodes.length] + String(100 + oId);
      couponsBatch.push({
        code,
        discountType: oId % 3 === 0 ? "fixed" : "percentage",
        value: oId % 3 === 0 ? 100 : 50,
        active: true,
        minOrderAmount: 199,
        expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
      });
    }
    const seededCoupons = await Coupon.insertMany(couponsBatch);
    console.log(`Seeded ${seededCoupons.length} Coupons.`);

    // 6. Seed 100 Reviews
    console.log("Seeding 100 Reviews...");
    const reviewsBatch = [];
    for (let rId = 1; rId <= 100; rId++) {
      const randomUser = customerUsers[rId % customerUsers.length];
      const randomFood = seededFoods[rId % seededFoods.length];
      reviewsBatch.push({
        user: randomUser._id,
        food: randomFood._id,
        restaurant: randomFood.restaurant,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        comment: ["Great taste!", "Loved it!", "Delicious food", "Value for money", "Prompt delivery", "Highly recommended!"][rId % 6],
        createdAt: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000))
      });
    }
    const seededReviews = await Review.insertMany(reviewsBatch);
    console.log(`Seeded ${seededReviews.length} Reviews.`);

    // 7. Seed 500 Orders
    console.log("Seeding 500 Orders...");
    const ordersBatch = [];
    const orderStatuses = ["Pending", "Confirmed", "Preparing", "Out For Delivery", "Delivered", "Cancelled"];
    const paymentMethods = ["Google Pay", "Cash on Delivery", "Credit Card"];

    for (let oId = 1; oId <= 500; oId++) {
      const randomUser = customerUsers[oId % customerUsers.length];
      const randomRest = seededRestaurants[oId % seededRestaurants.length];
      const restFoods = seededFoods.filter(f => f.restaurant.toString() === randomRest._id.toString());
      const orderItems = [];
      const numItems = 1 + (oId % 3);
      
      for (let k = 0; k < numItems; k++) {
        if (restFoods.length > 0) {
          const item = restFoods[(oId + k) % restFoods.length];
          if (!orderItems.find(x => x.food.toString() === item._id.toString())) {
            orderItems.push({
              food: item._id,
              quantity: 1 + (k % 2),
              price: item.price
            });
          }
        }
      }

      if (orderItems.length === 0) continue;

      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = oId % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
      const tax = Math.round(subtotal * 0.05);
      const deliveryCharge = 40;
      const totalAmount = subtotal - discount + tax + deliveryCharge;

      const orderObj = {
        user: randomUser._id,
        restaurant: randomRest._id,
        items: orderItems,
        address: randomUser.addresses[0] || { line1: "123 Street", city: "Baramati" },
        paymentMethod: paymentMethods[oId % paymentMethods.length],
        paymentStatus: oId % 4 === 0 ? "Pending" : "Paid",
        discount,
        deliveryCharge,
        tax,
        totalAmount,
        status: orderStatuses[oId % orderStatuses.length],
        orderNumber: `FE${20000 + oId}`,
        createdAt: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000))
      };
      
      if (orderObj.status === "Cancelled") {
        orderObj.cancellationReason = ["Ordered by mistake", "Delivery taking too long", "Found better option"][oId % 3];
      }
      ordersBatch.push(orderObj);
    }
    const seededOrders = await Order.insertMany(ordersBatch);
    console.log(`Seeded ${seededOrders.length} Orders.`);

    // 8. Seed 5 Banners
    console.log("Seeding Banners...");
    const bannersData = [
      { title: "Flat 50% OFF", description: "On your first order", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", cta: "Burger", isActive: true },
      { title: "Buy 1 Get 1 Free", description: "On selected pizzas", image: "https://images.unsplash.com/photo-1603133872871-7a2acf087d74?auto=format&fit=crop&w=600&q=80", cta: "Pizza", isActive: true },
      { title: "Free Delivery", description: "On orders above ₹199", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=600&q=80", cta: "Biryani", isActive: true },
      { title: "Healthy Delights", description: "Up to 30% OFF on organic meals", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80", cta: "Healthy", isActive: true },
      { title: "Midnight Sweet Craving?", description: "Get desserts in 15 mins", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80", cta: "Desserts", isActive: true }
    ];
    const seededBanners = await Banner.insertMany(bannersData);
    console.log(`Seeded ${seededBanners.length} banners.`);

    console.log("Database successfully seeded in MongoDB mode!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

module.exports = seedDatabase;
