const categories = [];
const restaurants = [];
const foods = [];
const users = [];
const orders = [];
const wishlists = {}; // Maps userId -> Array of food items
const carts = {}; // Maps userId -> Array of cart items
const offers = [];
const banners = [];
const reviews = [];
const combos = [];
const sections = [];

// Initialize all data in memory
const initializeMockData = () => {
  if (categories.length > 0) return;

  console.log("Generating In-Memory Mock Database (150 Users, 50 Riders, 120 Restaurants, 2500+ Foods, 300 Coupons, 100 Reviews, 500 Orders)...");

  // 1. 100 Categories
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

  const categoriesData = categoryNames.map((name, index) => {
    const img = categoryImages[name] || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80";
    return {
      _id: `c-${index + 1}`,
      id: `c-${index + 1}`,
      name: name,
      image: img,
      icon: emojis[name] || "🍔"
    };
  });
  categories.push(...categoriesData);

  // 2. 120 Restaurants
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
      _id: `rest-${i}`,
      id: `rest-${i}`,
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
    restaurants.push(restObj);
  }

  // 3. Generate 2500+ Food Items (approx 22 items per restaurant = 2640 total)
  let fId = 1;
  restaurants.forEach((rest) => {
    const numProducts = 21 + Math.floor(Math.random() * 4); // 21-24 items
    const selectedFoodNames = new Set();

    for (let pIndex = 0; pIndex < numProducts; pIndex++) {
      const catObj = categories[Math.floor(Math.random() * categories.length)];
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
        _id: `food-${fId}`,
        id: `food-${fId}`,
        name: finalFoodName,
        description: template.desc,
        price: price,
        originalPrice: originalPrice,
        discountPercentage: discountPercentage,
        category: catObj,
        restaurant: rest,
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

      foods.push(foodObj);
      fId++;
    }
  });

  // 4. Seed 3 Demo Accounts + 147 Users + 50 Delivery Partners
  const demoUsers = [
    {
      _id: "user-admin",
      id: "user-admin",
      name: "System Admin",
      email: "admin@foodexpress.com",
      phone: "9876543201",
      password: "Admin@123",
      role: "admin",
      addresses: [],
      favorites: []
    },
    {
      _id: "user-demo",
      id: "user-demo",
      name: "Demo User",
      email: "user@foodexpress.com",
      phone: "9876543202",
      password: "User@123",
      role: "customer",
      addresses: [
        {
          _id: "addr-demo-1",
          label: "Home",
          line1: "Flat 101, Green Meadows",
          line2: "Near City Park",
          city: "Baramati",
          state: "Maharashtra",
          postalCode: "413102",
          country: "India",
          isDefault: true
        }
      ],
      favorites: []
    },
    {
      _id: "user-delivery",
      id: "user-delivery",
      name: "Delivery Rider",
      email: "delivery@foodexpress.com",
      phone: "9876543203",
      password: "Delivery@123",
      role: "delivery",
      addresses: [],
      favorites: []
    }
  ];

  users.push(...demoUsers);
  demoUsers.forEach(u => {
    wishlists[u.id] = [];
    carts[u.id] = [];
  });

  const firstNames = ["Amit", "Priya", "Rahul", "Neha", "Vijay", "Anjali", "Sanjay", "Kiran", "Vikram", "Rooja", "Arjun", "Deepika"];
  const lastNames = ["Sharma", "Patel", "Verma", "Gupta", "Joshi", "Mehta", "Singh", "Reddy", "Rao", "Nair", "Saxena", "Deshmukh"];
  
  for (let uId = 1; uId <= 147; uId++) {
    const fName = firstNames[uId % firstNames.length];
    const lName = lastNames[uId % lastNames.length];
    const uName = `${fName} ${lName}`;
    const email = `user${uId}@example.com`;
    const phone = `98765432${uId < 10 ? '0' + uId : uId}`;
    
    const userObj = {
      _id: `user-${uId}`,
      id: `user-${uId}`,
      name: uName,
      email: email,
      phone: phone,
      password: "password123",
      role: "customer",
      addresses: [
        {
          _id: `addr-u${uId}-1`,
          label: "Home",
          line1: `${100 + uId}, Sector 15`,
          line2: "Near Market Yard",
          city: "Baramati",
          state: "Maharashtra",
          postalCode: "413102",
          country: "India",
          isDefault: true
        }
      ],
      favorites: []
    };
    users.push(userObj);
    wishlists[userObj.id] = [];
    carts[userObj.id] = [];
  }

  for (let dId = 1; dId <= 49; dId++) {
    const fName = firstNames[dId % firstNames.length];
    const lName = lastNames[dId % lastNames.length];
    const dName = `${fName} ${lName} (Rider)`;
    const email = `delivery${dId}@example.com`;
    const phone = `91234567${dId < 10 ? '0' + dId : dId}`;
    
    const riderObj = {
      _id: `delivery-${dId}`,
      id: `delivery-${dId}`,
      name: dName,
      email: email,
      phone: phone,
      password: "password123",
      role: "delivery",
      addresses: [],
      favorites: []
    };
    users.push(riderObj);
    wishlists[riderObj.id] = [];
    carts[riderObj.id] = [];
  }

  // 5. Seed 300 Coupons
  const couponCodes = ["WELCOME50", "FREEDEL", "SAVE200", "BOGO", "CHEF50", "FESTIVE100", "MEAL120", "EATGREEN", "NIGHT40", "WEEKEND150"];
  for (let oId = 1; oId <= 300; oId++) {
    const code = couponCodes[oId % couponCodes.length] + String(100 + oId);
    const offerObj = {
      _id: `offer-${oId}`,
      id: `offer-${oId}`,
      code: code,
      title: oId % 4 === 0 ? "Buy 1 Get 1 Free" : oId % 3 === 0 ? "Flat ₹100 Off" : oId % 2 === 0 ? "50% OFF up to ₹120" : "Free Delivery",
      description: `Get special offers on orders above ₹199`,
      discountPercentage: oId % 2 === 0 ? 50 : 0,
      flatDiscount: oId % 3 === 0 ? 100 : 0,
      minOrderValue: 199,
      maxDiscount: 120,
      active: true,
      expiryDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
    };
    offers.push(offerObj);
  }

  // 6. Seed 100 Reviews
  const customerUsers = users.filter(u => u.role === "customer");
  for (let rId = 1; rId <= 100; rId++) {
    const randomUser = customerUsers[rId % customerUsers.length];
    const randomFood = foods[rId % foods.length];
    reviews.push({
      _id: `rev-${rId}`,
      id: `rev-${rId}`,
      user: randomUser,
      food: randomFood,
      restaurant: randomFood.restaurant,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      comment: ["Great taste!", "Loved it!", "Delicious food", "Value for money", "Prompt delivery", "Highly recommended!"][rId % 6],
      createdAt: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000))
    });
  }

  // 7. Seed 500 Orders
  const orderStatuses = ["Pending", "Confirmed", "Preparing", "Out For Delivery", "Delivered", "Cancelled"];
  const paymentMethods = ["Google Pay", "Cash on Delivery", "Credit Card"];
  
  for (let oId = 1; oId <= 500; oId++) {
    const randomUser = customerUsers[oId % customerUsers.length];
    const randomRest = restaurants[oId % restaurants.length];
    const restFoods = foods.filter(f => f.restaurant.id === randomRest.id);
    const orderItems = [];
    const numItems = 1 + (oId % 3);
    
    for (let k = 0; k < numItems; k++) {
      if (restFoods.length > 0) {
        const item = restFoods[(oId + k) % restFoods.length];
        if (!orderItems.find(x => x.food.id === item.id)) {
          orderItems.push({
            food: item,
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
      _id: `ord-${oId}`,
      id: `ord-${oId}`,
      user: randomUser,
      restaurant: randomRest,
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
    orders.push(orderObj);
  }
  orders.sort((a, b) => b.createdAt - a.createdAt);

  // 8. Generate 5 Promotional Banners
  const mockBanners = [
    { _id: "b1", id: "b1", title: "Flat 50% OFF", description: "On your first order", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", cta: "Burger", isActive: true },
    { _id: "b2", id: "b2", title: "Buy 1 Get 1 Free", description: "On selected pizzas", image: "https://images.unsplash.com/photo-1603133872871-7a2acf087d74?auto=format&fit=crop&w=600&q=80", cta: "Pizza", isActive: true },
    { _id: "b3", id: "b3", title: "Free Delivery", description: "On orders above ₹199", image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=600&q=80", cta: "Biryani", isActive: true },
    { _id: "b4", id: "b4", title: "Healthy Delights", description: "Up to 30% OFF on organic meals", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80", cta: "Healthy", isActive: true },
    { _id: "b5", id: "b5", title: "Midnight Sweet Craving?", description: "Get desserts in 15 mins", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80", cta: "Desserts", isActive: true }
  ];
  banners.push(...mockBanners);

  console.log(`Mock DB successfully generated ${users.length} Users/Riders, ${restaurants.length} Restaurants, ${foods.length} Products, ${orders.length} Orders, ${offers.length} Offers, ${reviews.length} Reviews, and ${banners.length} Banners!`);
};

const queryMockFoods = (query = {}) => {
  const {
    q,
    category,
    price,
    rating,
    deliveryTime,
    discount,
    restaurantType,
    isOpen,
    vegType,
    sort,
    page = 1,
    limit = 20,
  } = query;

  let filtered = [...foods];

  if (q) {
    const searchRegex = new RegExp(q, "i");
    filtered = filtered.filter(f => {
      const nameMatch = f.name && searchRegex.test(f.name);
      const descMatch = f.description && searchRegex.test(f.description);
      const tagMatch = f.tags && f.tags.some(tag => searchRegex.test(tag));
      const catMatch = f.category && f.category.name && searchRegex.test(f.category.name);
      const restMatch = f.restaurant && f.restaurant.name && searchRegex.test(f.restaurant.name);
      return nameMatch || descMatch || tagMatch || catMatch || restMatch;
    });
  }

  if (category) {
    filtered = filtered.filter(f => {
      if (!f.category) return false;
      const catId = f.category.id || f.category._id;
      return (
        (f.category.name && f.category.name.toLowerCase() === category.toLowerCase()) ||
        (catId && catId.toString() === category.toString())
      );
    });
  }

  if (price) {
    filtered = filtered.filter(f => {
      if (price === "under_100") return f.price < 100;
      if (price === "100_250") return f.price >= 100 && f.price <= 250;
      if (price === "250_500") return f.price >= 250 && f.price <= 500;
      if (price === "500_1000") return f.price >= 500 && f.price <= 1000;
      if (price === "above_1000") return f.price > 1000;
      return true;
    });
  }

  if (rating) {
    const minRating = parseFloat(rating);
    filtered = filtered.filter(f => f.rating >= minRating);
  }

  if (deliveryTime) {
    filtered = filtered.filter(f => {
      const prepTime = f.preparationTime || 0;
      if (deliveryTime === "under_10") return prepTime <= 10;
      if (deliveryTime === "under_20") return prepTime <= 20;
      if (deliveryTime === "under_30") return prepTime <= 30;
      if (deliveryTime === "under_45") return prepTime <= 45;
      return true;
    });
  }

  if (discount) {
    filtered = filtered.filter(f => {
      const disc = f.discountPercentage || 0;
      if (discount === "10_plus") return disc >= 10;
      if (discount === "20_plus") return disc >= 20;
      if (discount === "30_plus") return disc >= 30;
      if (discount === "50_plus") return disc >= 50;
      return true;
    });
  }

  if (restaurantType) {
    filtered = filtered.filter(f => f.restaurant && f.restaurant.restaurantType === restaurantType);
  }

  if (isOpen === "true") {
    filtered = filtered.filter(f => f.restaurant && f.restaurant.isOpen === true);
  }

  if (vegType) {
    if (vegType === "veg") {
      filtered = filtered.filter(f => f.isVeg === true);
    } else if (vegType === "non-veg") {
      filtered = filtered.filter(f => f.isVeg === false);
    }
  }

  if (sort) {
    if (sort === "popularity" || sort === "recommended") {
      filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
    } else if (sort === "rating_desc") {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "discount_desc") {
      filtered.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    } else if (sort === "newest") {
      const parseId = idStr => parseInt(idStr.replace("food-", "")) || 0;
      filtered.sort((a, b) => parseId(b.id) - parseId(a.id));
    } else if (sort === "delivery_time") {
      filtered.sort((a, b) => (a.preparationTime || 0) - (b.preparationTime || 0));
    }
  } else {
    filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const totalCount = filtered.length;
  const skipNum = (pageNum - 1) * limitNum;
  const paginatedFoods = filtered.slice(skipNum, skipNum + limitNum);

  return {
    foods: paginatedFoods,
    total: totalCount,
    page: pageNum,
    pages: Math.ceil(totalCount / limitNum),
  };
};

module.exports = {
  categories,
  restaurants,
  foods,
  users,
  orders,
  wishlists,
  carts,
  offers,
  banners,
  reviews,
  combos,
  sections,
  initializeMockData,
  queryMockFoods
};
