const Food = require("../models/Food");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");

exports.getFoods = async (req, res) => {
  const {
    q,
    category,
    restaurant,
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
  } = req.query;


  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    let foodQueryObj = {};
    if (restaurant) {
      foodQueryObj.restaurant = restaurant;
    }
    let restaurantQueryObj = {};

    // 1. Restaurant Filters
    if (restaurantType) {
      restaurantQueryObj.restaurantType = restaurantType;
    }
    if (isOpen === "true") {
      restaurantQueryObj.isOpen = true;
    }

    // Resolve matching restaurants first if restaurant filters are applied
    let matchingRestaurantIds = [];
    let hasRestaurantFilters = Object.keys(restaurantQueryObj).length > 0;

    // 2. Search Logic (Product Name, Restaurant Name, Category, Cuisine, Description)
    if (q) {
      const searchRegex = new RegExp(q, "i");
      
      // Find restaurants matching name or cuisine
      const searchRest = await Restaurant.find({
        $or: [
          { name: searchRegex },
          { cuisine: { $in: [searchRegex] } }
        ]
      }).select("_id");
      const searchRestIds = searchRest.map(r => r._id);

      // Find categories matching name
      const searchCats = await Category.find({
        name: searchRegex,
        isVisible: { $ne: false }
      }).select("_id");
      const searchCatIds = searchCats.map(c => c._id);

      // Filter foods
      foodQueryObj.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { category: { $in: searchCatIds } },
        { restaurant: { $in: searchRestIds } }
      ];
    }

    // Apply restaurant filters (if any)
    if (hasRestaurantFilters) {
      const filteredRestaurants = await Restaurant.find(restaurantQueryObj).select("_id");
      matchingRestaurantIds = filteredRestaurants.map(r => r._id);
      
      // Combine with existing foodQueryObj restaurant filters
      if (foodQueryObj.restaurant) {
        // Intersect
        const existing = Array.isArray(foodQueryObj.restaurant.$in) ? foodQueryObj.restaurant.$in : [foodQueryObj.restaurant];
        foodQueryObj.restaurant = { 
          $in: existing.filter(id => matchingRestaurantIds.map(m => m.toString()).includes(id.toString())) 
        };
      } else {
        foodQueryObj.restaurant = { $in: matchingRestaurantIds };
      }
    }

    // 3. Category Filter
    if (category) {
      // check if category is a name
      const cat = await Category.findOne({ name: { $regex: category, $options: "i" }, isVisible: { $ne: false } });
      if (cat) {
        foodQueryObj.category = cat._id;
      } else {
        // fallback to ID
        try {
          foodQueryObj.category = category;
        } catch (e) {
          // invalid ID
        }
      }
    }

    // 4. Price Filter
    if (price) {
      foodQueryObj.price = {};
      if (price === "under_100") {
        foodQueryObj.price.$lt = 100;
      } else if (price === "100_250") {
        foodQueryObj.price.$gte = 100;
        foodQueryObj.price.$lte = 250;
      } else if (price === "250_500") {
        foodQueryObj.price.$gte = 250;
        foodQueryObj.price.$lte = 500;
      } else if (price === "500_1000") {
        foodQueryObj.price.$gte = 500;
        foodQueryObj.price.$lte = 1000;
      } else if (price === "above_1000") {
        foodQueryObj.price.$gt = 1000;
      }
    }

    // 5. Rating Filter
    if (rating) {
      foodQueryObj.rating = { $gte: parseFloat(rating) };
    }

    // 6. Delivery Time / Prep Time Filter
    if (deliveryTime) {
      foodQueryObj.preparationTime = {};
      if (deliveryTime === "under_10") {
        foodQueryObj.preparationTime.$lte = 10;
      } else if (deliveryTime === "under_20") {
        foodQueryObj.preparationTime.$lte = 20;
      } else if (deliveryTime === "under_30") {
        foodQueryObj.preparationTime.$lte = 30;
      } else if (deliveryTime === "under_45") {
        foodQueryObj.preparationTime.$lte = 45;
      }
    }

    // 7. Discount Filter
    if (discount) {
      foodQueryObj.discountPercentage = {};
      if (discount === "10_plus") {
        foodQueryObj.discountPercentage.$gte = 10;
      } else if (discount === "20_plus") {
        foodQueryObj.discountPercentage.$gte = 20;
      } else if (discount === "30_plus") {
        foodQueryObj.discountPercentage.$gte = 30;
      } else if (discount === "50_plus") {
        foodQueryObj.discountPercentage.$gte = 50;
      }
    }

    // 8. Veg/Non-Veg Filter
    if (vegType) {
      if (vegType === "veg") {
        foodQueryObj.isVeg = true;
      } else if (vegType === "non-veg") {
        foodQueryObj.isVeg = false;
      }
    }

    // Build the DB Query
    let dbQuery = Food.find(foodQueryObj).populate("category restaurant");

    // 9. Sorting Logic
    if (sort) {
      if (sort === "popularity" || sort === "recommended") {
        dbQuery = dbQuery.sort({ popularityScore: -1 });
      } else if (sort === "rating_desc") {
        dbQuery = dbQuery.sort({ rating: -1 });
      } else if (sort === "price_asc") {
        dbQuery = dbQuery.sort({ price: 1 });
      } else if (sort === "price_desc") {
        dbQuery = dbQuery.sort({ price: -1 });
      } else if (sort === "discount_desc") {
        dbQuery = dbQuery.sort({ discountPercentage: -1 });
      } else if (sort === "newest") {
        dbQuery = dbQuery.sort({ createdAt: -1 });
      } else if (sort === "delivery_time") {
        dbQuery = dbQuery.sort({ preparationTime: 1 });
      }
    } else {
      // Default sort by popularityScore
      dbQuery = dbQuery.sort({ popularityScore: -1 });
    }

    // Execute query with pagination
    const totalCount = await Food.countDocuments(foodQueryObj);
    const foods = await dbQuery.skip(skipNum).limit(limitNum);
    const categories = await Category.find({ isVisible: { $ne: false } }).sort({ priority: 1, name: 1 });
    const restaurants = await Restaurant.find().limit(30);
    const Coupon = require("../models/Coupon");
    const offers = await Coupon.find().limit(50);

    // Fetch featured/popular lists from all foods for the homepage
    const featured = await Food.find({ isFeatured: true }).populate("category restaurant").limit(10);
    const popular = await Food.find({ isPopular: true }).populate("category restaurant").limit(10);

    res.json({
      foods,
      categories,
      featured,
      popular,
      restaurants,
      offers,
      total: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to retrieve products: " + error.message);
  }
};

exports.getFoodById = async (req, res) => {
  let food = await Food.findById(req.params.id).populate(
    "category restaurant reviews",
  );

  if (!food) {
    const Combo = require("../models/Combo");
    const combo = await Combo.findById(req.params.id).populate({
      path: "items",
      populate: { path: "restaurant" }
    });

    if (!combo) {
      res.status(404);
      throw new Error("Food/Combo not found");
    }

    const firstRest = combo.items && combo.items.length > 0 ? combo.items[0].restaurant : null;
    const isVeg = combo.items && combo.items.length > 0 
      ? combo.items.every(item => item.isVeg !== false) 
      : true;

    const formattedResponse = {
      _id: combo._id,
      name: combo.name,
      description: combo.description || "Curated meal combo with discount savings.",
      price: combo.price,
      originalPrice: combo.originalPrice || combo.price,
      image: combo.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
      category: { name: "Bento Combo" },
      restaurant: firstRest,
      rating: 4.8,
      serves: "1-2",
      isVeg: isVeg,
      isBestseller: true,
      ingredients: ["Combined standard ingredients"],
      nutrition: {
        calories: "450 kcal",
        protein: "12 g",
        carbs: "62 g",
        fat: "14 g"
      },
      temperature: "Served Piping Hot",
      allergens: "Check component items",
      recommendedFoods: [],
      isCombo: true,
      items: combo.items
    };

    return res.json(formattedResponse);
  }

  // Fetch recommended foods from same category
  let recommendedFoods = [];
  try {
    recommendedFoods = await Food.find({
      category: food.category?._id || food.category,
      _id: { $ne: food._id }
    }).limit(6).populate("category restaurant");
  } catch (err) {
    console.error("Error fetching recommended foods:", err);
  }

  const isVeg = food.isVeg !== undefined ? food.isVeg : true;
  const isBestseller = food.isBestSeller || food.isBestseller || false;

  const formattedResponse = {
    _id: food._id || food.id,
    name: food.name,
    description: food.description || "",
    price: food.price,
    originalPrice: food.originalPrice || food.price,
    image: food.image,
    category: food.category,
    restaurant: food.restaurant,
    rating: food.rating || 4.5,
    serves: food.servingSize || "1",
    isVeg: isVeg,
    isBestseller: isBestseller,
    ingredients: food.ingredients && food.ingredients.length > 0 ? food.ingredients : ["Water", "Salt", "Spices", "Wheat Flour", "Vegetable Oil"],
    nutrition: {
      calories: food.calories ? `${food.calories} kcal` : "210 kcal",
      protein: food.protein ? `${food.protein} g` : "4.8 g",
      carbs: food.carbs ? `${food.carbs} g` : "28 g",
      fat: food.fat ? `${food.fat} g` : "6.5 g"
    },
    temperature: food.spiceLevel === "High" ? "Served Piping Hot" : "Served Hot",
    allergens: food.allergens && food.allergens.length > 0 ? food.allergens.join(", ") : "None",
    recommendedFoods: recommendedFoods
  };

  res.json(formattedResponse);
};

exports.getProductsByCategory = async (req, res) => {
  req.query.category = req.params.category;
  return exports.getFoods(req, res);
};

exports.getProductsByCuisine = async (req, res) => {
  const { cuisine } = req.params;
  
  

  try {
    const searchRegex = new RegExp(cuisine, "i");
    const matchingRests = await Restaurant.find({ cuisine: { $in: [searchRegex] } }).select("_id");
    const restIds = matchingRests.map(r => r._id);
    req.query.restaurant = restIds;
    return exports.getFoods(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBestsellers = async (req, res) => {
  
  try {
    const filtered = await Food.find({ isBestSeller: true }).populate("category restaurant").limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewArrivals = async (req, res) => {
  
  try {
    const filtered = await Food.find().populate("category restaurant").sort({ createdAt: -1 }).limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHealthy = async (req, res) => {
  
  try {
    const filtered = await Food.find({ isHealthy: true }).populate("category restaurant").limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCombos = async (req, res) => {
  try {
    const Combo = require("../models/Combo");
    
    // 1. Fetch created combos from Combo collection
    const dbCombos = await Combo.find({ isActive: true }).populate({
      path: "items",
      populate: { path: "restaurant" }
    });

    const formattedCombos = dbCombos.map(combo => {
      // Determine if vegetarian (if all items are vegetarian, it's veg)
      const isVeg = combo.items && combo.items.length > 0 
        ? combo.items.every(item => item.isVeg !== false) 
        : true;
        
      const firstRest = combo.items && combo.items.length > 0 
        ? combo.items[0].restaurant 
        : null;

      return {
        _id: combo._id,
        id: combo._id,
        name: combo.name,
        description: combo.description || "Curated meal combo with discount savings.",
        price: combo.price,
        originalPrice: combo.originalPrice || combo.price,
        discountPercentage: combo.originalPrice && combo.originalPrice > combo.price
          ? Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)
          : 0,
        image: combo.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
        rating: 4.8,
        preparationTime: 25,
        isVeg,
        isAvailable: true,
        category: { name: "Bento Combo" },
        restaurant: firstRest,
        isCombo: true,
        items: combo.items
      };
    });

    // 2. Fetch standard food items with isCombo: true
    const standardCombos = await Food.find({ isCombo: true }).populate("category restaurant").limit(30);

    // 3. Combine both lists
    const allCombos = [...formattedCombos, ...standardCombos];
    
    res.json({ foods: allCombos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrending = async (req, res) => {
  req.query.sort = "popularity";
  return exports.getFoods(req, res);
};

exports.getPopular = async (req, res) => {
  
  try {
    const filtered = await Food.find({ isPopular: true }).populate("category restaurant").limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommended = async (req, res) => {
  req.query.sort = "rating_desc";
  return exports.getFoods(req, res);
};

exports.getCategorizedMenu = async (req, res) => {
  

  try {
    const agg = await Food.aggregate([
      {
        $group: {
          _id: "$category",
          totalCount: { $sum: 1 },
          foods: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          category: "$_id",
          totalCount: 1,
          foods: { $slice: ["$foods", 4] }
        }
      }
    ]);
    const populated = await Food.populate(agg, [
      { path: "category", model: "Category" },
      { path: "foods.category", model: "Category" },
      { path: "foods.restaurant", model: "Restaurant" }
    ]);
    res.json(populated.filter(group => group.category));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
