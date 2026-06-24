const categories = [];
const restaurants = [];
const foods = [];
const users = [];
const orders = [];
const wishlists = {}; // Maps userId -> Array of food items

// Initialize all data in memory
const initializeMockData = () => {
  if (categories.length > 0) return;

  console.log("Generating In-Memory Mock Database (50 Users, 50 Restaurants, 200 Orders, 500 Wishlist items)...");

  // 1. Categories
  const categoriesData = [
    { id: "c1", name: "Pizza", icon: "pizza" },
    { id: "c2", name: "Burger", icon: "hamburger" },
    { id: "c3", name: "Biryani", icon: "rice" },
    { id: "c4", name: "Chinese", icon: "noodles" },
    { id: "c5", name: "South Indian", icon: "food-variant" },
    { id: "c6", name: "Desserts", icon: "cupcake" },
    { id: "c7", name: "Beverages", icon: "coffee" },
    { id: "c8", name: "Fast Food", icon: "food" },
    { id: "c9", name: "Snacks", icon: "cookie" },
  ];
  categories.push(...categoriesData);

  // 2. Restaurants
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
      { name: "Garden Veggie Pizza", desc: "Olives, sweet corn, mushrooms, and jalapeños.", price: 229, tags: ["Healthy"] }
    ],
    "Burger": [
      { name: "Veg Cheese Burger", desc: "Crispy veg patty, cheddar cheese slice, and mayo.", price: 89, tags: ["Classic"] },
      { name: "Spicy Paneer Burger", desc: "Spicy grilled paneer patty with lettuce and spicy sauce.", price: 139, tags: ["Spicy"] },
      { name: "Chicken Zinger Burger", desc: "Crispy chicken breast, lettuce, and creamy dressing.", price: 159, tags: ["Best Seller"] },
      { name: "Crispy Aloo Tikki Burger", desc: "Classic potato patty burger with onion slices.", price: 59, tags: ["Budget Friendly"] }
    ],
    "Biryani": [
      { name: "Chicken Dum Biryani", desc: "Basmati rice cooked with tender chicken and spices.", price: 220, tags: ["Best Seller", "Must Try"] },
      { name: "Mutton Dum Biryani", desc: "Fragrant rice layered with slow-cooked mutton.", price: 320, tags: ["Chef Special"] },
      { name: "Veg Hyderabadi Biryani", desc: "Rich combination of fresh vegetables and basmati rice.", price: 160, tags: ["Healthy"] },
      { name: "Egg Biryani", desc: "Aromatic biryani rice served with boiled eggs.", price: 140, tags: ["Spicy"] }
    ],
    "Chinese": [
      { name: "Veg Fried Rice", desc: "Wok-tossed rice with chopped carrots, beans, and soy.", price: 110, tags: ["Classic"] },
      { name: "Veg Hakka Noodles", desc: "Classic Chinese street style noodles with bell peppers.", price: 120, tags: ["Best Seller"] },
      { name: "Chicken Manchurian", desc: "Crispy chicken balls in spicy soy garlic gravy.", price: 180, tags: ["Spicy"] },
      { name: "Veg Manchurian", desc: "Deep fried veg balls cooked in spicy Manchurian sauce.", price: 140, tags: ["Most Popular"] }
    ],
    "South Indian": [
      { name: "Masala Dosa", desc: "Crispy crepe filled with potato masala served with sambhar.", price: 80, tags: ["Classic", "Best Seller"] },
      { name: "Mysore Masala Dosa", desc: "Dosa with spicy red garlic chutney and potato filling.", price: 95, tags: ["Spicy"] },
      { name: "Idli Sambhar", desc: "Soft steamed rice cakes served with sambhar and chutney.", price: 50, tags: ["Healthy", "Breakfast"] },
      { name: "Medu Vada", desc: "Crispy fried lentil donuts served hot with sambhar.", price: 60, tags: ["Breakfast"] }
    ],
    "Desserts": [
      { name: "Gulab Jamun", desc: "Warm milk dumplings in flavored sugar syrup (2 Pcs).", price: 45, tags: ["Sweet Tooth"] },
      { name: "Sizzling Chocolate Brownie", desc: "Warm brownie with chocolate sauce.", price: 120, tags: ["Best Seller"] },
      { name: "Rasmalai", desc: "Sweet cottage cheese discs soaked in saffron milk (2 Pcs).", price: 70, tags: ["Most Popular"] }
    ],
    "Beverages": [
      { name: "Cold Coffee", desc: "Chilled milk, espresso, and vanilla ice cream blend.", price: 80, tags: ["Must Try"] },
      { name: "Mango Lassi", desc: "Creamy sweet yogurt drink with fresh mango pulp.", price: 60, tags: ["Cooling"] },
      { name: "Mint Mojito", desc: "Refreshing carbonated soda with crushed mint and lemon.", price: 90, tags: ["Kids Special"] }
    ],
    "Fast Food": [
      { name: "Pav Bhaji", desc: "Spiced mashed vegetable gravy served with buttered buns.", price: 110, tags: ["Must Try", "Street Food"] },
      { name: "Misal Pav", desc: "Spicy curry topped with farsan, served with pav.", price: 90, tags: ["Spicy", "Maharashtrian"] },
      { name: "French Fries", desc: "Crispy salted golden potato fries.", price: 70, tags: ["Kids Favorite"] }
    ],
    "Snacks": [
      { name: "Paneer Pakoda", desc: "Paneer cubes dipped in spiced gram flour batter and fried.", price: 80, tags: ["Rainy Day Special"] },
      { name: "Veg Cutlet", desc: "Crispy patties made of mixed vegetables and breadcrumbs.", price: 60, tags: ["Healthy Option"] },
      { name: "Dahi Puri", desc: "Puri filled with potatoes, yogurt, sweet and green chutneys.", price: 70, tags: ["Street Food", "Best Seller"] }
    ]
  };

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
    const vType = rType === "Pure Veg" ? "veg" : Math.random() > 0.4 ? "both" : "non-veg";
    
    const restObj = {
      _id: `rest-${i}`,
      id: `rest-${i}`,
      name: restName,
      address: `${10 + i}, ${locations[Math.floor(Math.random() * locations.length)]} Road`,
      rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
      deliveryTime: deliveryTimes[Math.floor(Math.random() * deliveryTimes.length)],
      image: restaurantImages[Math.floor(Math.random() * restaurantImages.length)],
      reviewCount: Math.floor(40 + Math.random() * 760),
      distance: parseFloat((0.5 + Math.random() * 6.0).toFixed(1)),
      cuisine: [cuisinesList[Math.floor(Math.random() * cuisinesList.length)], cuisinesList[Math.floor(Math.random() * cuisinesList.length)]],
      offerPercentage: Math.random() > 0.3 ? [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)] : 0,
      vegType: vType,
      isOpen: Math.random() > 0.1,
      isFeatured: Math.random() > 0.8,
      restaurantType: rType
    };
    restaurants.push(restObj);
  }

  // Generate 15-20 products per restaurant
  let fId = 1;
  const availableCategories = Object.keys(foodTemplates);

  restaurants.forEach((rest) => {
    const numProducts = 15 + Math.floor(Math.random() * 6);
    const selectedFoodNames = new Set();

    for (let pIndex = 0; pIndex < numProducts; pIndex++) {
      const catName = availableCategories[Math.floor(Math.random() * availableCategories.length)];
      const categoryObj = categories.find(c => c.name === catName);
      
      const templates = foodTemplates[catName];
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
        if (["Biryani", "Burger", "Pizza", "Chinese", "Fast Food"].includes(catName)) {
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
        category: categoryObj,
        restaurant: rest,
        image: rest.image,
        rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
        isFeatured: Math.random() > 0.8,
        isPopular: Math.random() > 0.8,
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

  // 3. Generate 50 Users
  const firstNames = ["Amit", "Priya", "Rahul", "Neha", "Vijay", "Anjali", "Sanjay", "Kiran", "Vikram", "Rooja", "Arjun", "Deepika"];
  const lastNames = ["Sharma", "Patel", "Verma", "Gupta", "Joshi", "Mehta", "Singh", "Reddy", "Rao", "Nair", "Saxena", "Deshmukh"];
  
  for (let uId = 1; uId <= 50; uId++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const uName = `${fName} ${lName}`;
    const email = `user${uId}@example.com`;
    const phone = `98765432${uId < 10 ? '0' + uId : uId}`;
    
    const userObj = {
      _id: `user-${uId}`,
      id: `user-${uId}`,
      name: uName,
      email: email,
      phone: phone,
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
        },
        {
          _id: `addr-u${uId}-2`,
          label: "Work",
          line1: "IT Park, Phase 3",
          line2: "MIDC Area",
          city: "Baramati",
          state: "Maharashtra",
          postalCode: "413133",
          country: "India",
          isDefault: false
        }
      ]
    };
    users.push(userObj);
    wishlists[userObj.id] = [];
  }

  // 4. Generate 500 Wishlist records (linking random users and foods)
  for (let wIndex = 0; wIndex < 500; wIndex++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomFood = foods[Math.floor(Math.random() * foods.length)];
    
    // Prevent duplicates in mock wishlist
    const userWishlist = wishlists[randomUser.id];
    if (!userWishlist.find(f => f.id === randomFood.id)) {
      userWishlist.push(randomFood);
    }
  }

  // 5. Generate 200 Orders
  const orderStatuses = ["Pending", "Confirmed", "Preparing", "Out For Delivery", "Delivered", "Cancelled"];
  const paymentMethods = ["Google Pay", "Cash on Delivery", "Credit Card"];
  
  for (let oId = 1; oId <= 200; oId++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomRest = restaurants[Math.floor(Math.random() * restaurants.length)];
    
    // Select 1-3 foods from this restaurant
    const restFoods = foods.filter(f => f.restaurant.id === randomRest.id);
    const orderItems = [];
    const numItems = 1 + Math.floor(Math.random() * 3);
    
    for (let k = 0; k < numItems; k++) {
      if (restFoods.length > 0) {
        const item = restFoods[Math.floor(Math.random() * restFoods.length)];
        // avoid duplicate food items in order
        if (!orderItems.find(x => x.food.id === item.id)) {
          orderItems.push({
            food: item,
            quantity: 1 + Math.floor(Math.random() * 2),
            price: item.price
          });
        }
      }
    }

    if (orderItems.length === 0) continue;

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Math.random() > 0.5 ? Math.round(subtotal * 0.1) : 0;
    const tax = Math.round(subtotal * 0.05);
    const deliveryCharge = 40;
    const totalAmount = subtotal - discount + tax + deliveryCharge;

    const orderObj = {
      _id: `ord-${oId}`,
      id: `ord-${oId}`,
      user: randomUser,
      restaurant: randomRest,
      items: orderItems,
      address: randomUser.addresses[0],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: Math.random() > 0.3 ? "Paid" : "Pending",
      discount,
      deliveryCharge,
      tax,
      totalAmount,
      status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
      orderNumber: `FE${10000 + oId}`,
      createdAt: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000)) // last 90 days
    };
    
    if (orderObj.status === "Cancelled") {
      orderObj.cancellationReason = ["Ordered by mistake", "Delivery taking too long", "Found better option"][Math.floor(Math.random() * 3)];
    }

    orders.push(orderObj);
  }

  // Sort orders by date descending
  orders.sort((a, b) => b.createdAt - a.createdAt);

  console.log(`Mock DB successfully generated ${users.length} Users, ${foods.length} Products, ${orders.length} Orders, and Wishlists!`);
};

// In-Memory search/filtering is already defined above...

module.exports = {
  categories,
  restaurants,
  foods,
  users,
  orders,
  wishlists,
  initializeMockData,
  queryMockFoods
};
