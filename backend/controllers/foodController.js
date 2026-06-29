const Food = require("../models/Food");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");

exports.getFoods = async (req, res) => {
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
  } = req.query;

  if (process.env.MOCK_DB === "true") {
    const { queryMockFoods, categories, foods, restaurants, offers } = require("../config/mockDataStore");
    const result = queryMockFoods(req.query);
    const featured = foods.filter(f => f.isFeatured).slice(0, 10);
    const popular = foods.filter(f => f.isPopular).slice(0, 10);
    return res.json({
      foods: result.foods,
      categories: categories,
      featured,
      popular,
      restaurants: restaurants.slice(0, 30), // Slice to keep it light but representative
      offers: offers.slice(0, 50),
      total: result.total,
      page: result.page,
      pages: result.pages,
    });
  }

  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    let foodQueryObj = {};
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
        name: searchRegex
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
      const cat = await Category.findOne({ name: { $regex: category, $options: "i" } });
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
    const categories = await Category.find();

    // Fetch featured/popular lists from all foods for the homepage
    const featured = await Food.find({ isFeatured: true }).populate("category restaurant").limit(10);
    const popular = await Food.find({ isPopular: true }).populate("category restaurant").limit(10);

    res.json({
      foods,
      categories,
      featured,
      popular,
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
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const food = foods.find(f => (f.id || f._id) === req.params.id);
    if (!food) {
      res.status(404);
      throw new Error("Food not found");
    }
    return res.json(food);
  }

  const food = await Food.findById(req.params.id).populate(
    "category restaurant reviews",
  );
  if (!food) {
    res.status(404);
    throw new Error("Food not found");
  }
  res.json(food);
};

exports.getProductsByCategory = async (req, res) => {
  req.query.category = req.params.category;
  return exports.getFoods(req, res);
};

exports.getProductsByCuisine = async (req, res) => {
  const { cuisine } = req.params;
  
  if (process.env.MOCK_DB === "true") {
    const { queryMockFoods } = require("../config/mockDataStore");
    const result = queryMockFoods(req.query);
    const searchRegex = new RegExp(cuisine, "i");
    const filtered = result.foods.filter(f => f.restaurant && f.restaurant.cuisine && f.restaurant.cuisine.some(c => searchRegex.test(c)));
    return res.json({
      foods: filtered,
      total: filtered.length,
      page: result.page,
      pages: result.pages
    });
  }

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
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const filtered = foods.filter(f => f.isBestSeller).slice(0, 30);
    return res.json({ foods: filtered });
  }
  try {
    const filtered = await Food.find({ isBestSeller: true }).populate("category restaurant").limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewArrivals = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const sorted = [...foods].sort((a, b) => {
      const idA = parseInt(a.id.split("-")[1]) || 0;
      const idB = parseInt(b.id.split("-")[1]) || 0;
      return idB - idA;
    }).slice(0, 30);
    return res.json({ foods: sorted });
  }
  try {
    const filtered = await Food.find().populate("category restaurant").sort({ createdAt: -1 }).limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHealthy = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const filtered = foods.filter(f => f.isHealthy).slice(0, 30);
    return res.json({ foods: filtered });
  }
  try {
    const filtered = await Food.find({ isHealthy: true }).populate("category restaurant").limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCombos = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const filtered = foods.filter(f => f.isCombo).slice(0, 30);
    return res.json({ foods: filtered });
  }
  try {
    const filtered = await Food.find({ isCombo: true }).populate("category restaurant").limit(30);
    res.json({ foods: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrending = async (req, res) => {
  req.query.sort = "popularity";
  return exports.getFoods(req, res);
};

exports.getPopular = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const filtered = foods.filter(f => f.isPopular).slice(0, 30);
    return res.json({ foods: filtered });
  }
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
  if (process.env.MOCK_DB === "true") {
    const { foods, categories } = require("../config/mockDataStore");
    const result = categories.map(cat => {
      const catFoods = foods.filter(f => f.category && (f.category.id === cat.id || f.category._id === cat._id));
      return {
        category: cat,
        totalCount: catFoods.length,
        foods: catFoods.slice(0, 4) // First 4 for grid preview
      };
    }).filter(group => group.totalCount > 0);
    return res.json(result);
  }

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
