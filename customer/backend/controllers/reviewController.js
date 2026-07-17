const Review = require("../models/Review");
const Food = require("../models/Food");
const Order = require("../models/Order");

// Helper function to update food ratings and reviews list
const updateFoodRating = async (foodId) => {
  if (!foodId) return;
  const reviews = await Review.find({ food: foodId, status: "Approved" });
  const reviewIds = reviews.map((r) => r._id);
  const avgRating =
    reviews.length > 0
      ? parseFloat(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        )
      : 0;

  await Food.findByIdAndUpdate(foodId, {
    rating: avgRating,
    reviews: reviewIds,
  });
};

// 1. Create Review
exports.createReview = async (req, res) => {
  const { foodId, orderId, rating, title, comment, images } = req.body;

  if (!foodId || !orderId || !rating || !comment) {
    return res.status(400).json({ message: "Food ID, Order ID, Rating, and Review comment are required." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  if (comment.trim().length < 10) {
    return res.status(400).json({ message: "Review description must be at least 10 characters." });
  }

  try {
    // Check if the order is Completed or Delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only review your own orders." });
    }

    if (order.status !== "Delivered" && order.status !== "Completed") {
      return res.status(400).json({ message: "You can only review delivered or completed orders." });
    }

    // Verify if food is part of the order
    const hasFood = order.items.some((item) => item.food.toString() === foodId);
    if (!hasFood) {
      return res.status(400).json({ message: "This food item is not part of the specified order." });
    }

    // Check for duplicate review
    const existing = await Review.findOne({
      user: req.user._id,
      order: orderId,
      food: foodId,
    });

    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this food item in this order." });
    }

    const review = await Review.create({
      user: req.user._id,
      food: foodId,
      order: orderId,
      restaurant: order.restaurant,
      rating,
      title,
      comment,
      images: images || [],
      status: "Approved",
    });

    // Update food rating immediately
    await updateFoodRating(foodId);

    // Create system notification for Admin
    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        title: "New Review Submitted",
        message: `A new customer review has been submitted for food item: ${foodId}`,
        type: "System",
        recipient: "Admin",
      });
    } catch (notifErr) {
      console.warn("Failed to create admin notification:", notifErr.message);
    }

    res.status(201).json({ message: "Thank you for sharing your feedback!", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Update Review
exports.updateReview = async (req, res) => {
  const { rating, title, comment, images } = req.body;
  const { id } = req.params;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  if (comment && comment.trim().length < 10) {
    return res.status(400).json({ message: "Review description must be at least 10 characters." });
  }

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this review." });
    }

    review.rating = rating || review.rating;
    review.title = title !== undefined ? title : review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;
    review.updatedAt = Date.now();

    await review.save();

    // Update averages
    await updateFoodRating(review.food);

    res.json({ message: "Review updated successfully", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Delete Review
exports.deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review." });
    }

    await Review.findByIdAndDelete(id);

    // Update averages
    await updateFoodRating(review.food);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Get Reviews by Food (Paginated, with stats & breakdown)
exports.getReviewsByFood = async (req, res) => {
  const { foodId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const allReviews = await Review.find({ food: foodId, status: "Approved" });

    // Calculate rating stats
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? parseFloat(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
          )
        : 0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    const reviews = await Review.find({ food: foodId, status: "Approved" })
      .populate("user", "name profilePhoto")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      reviews,
      stats: {
        averageRating,
        totalReviews,
        breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Get Reviews by User
exports.getReviewsByUser = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("food", "name image")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReviewsByOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const filter = { order: orderId };
    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }
    const reviews = await Review.find(filter).populate("food", "name image");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Get All Reviews (Admin Panel)
exports.getAllReviewsAdmin = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, rating, foodId, status } = req.query;

  const query = {};

  if (rating) {
    query.rating = parseInt(rating);
  }
  if (foodId) {
    query.food = foodId;
  }
  if (status) {
    query.status = status;
  }

  try {
    let reviews = await Review.find(query)
      .populate("user", "name profilePhoto email")
      .populate("food", "name image")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 });

    // Handle in-memory filtering for populated search term
    if (search) {
      const regex = new RegExp(search, "i");
      reviews = reviews.filter(
        (r) =>
          (r.user && regex.test(r.user.name)) ||
          (r.food && regex.test(r.food.name)) ||
          (r.comment && regex.test(r.comment))
      );
    }

    const total = reviews.length;
    const paginatedReviews = reviews.slice(skip, skip + limit);

    // Dashboard stats
    const all = await Review.find().populate("food", "name");
    const totalReviews = all.length;
    const averageRating =
      totalReviews > 0
        ? parseFloat((all.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    // Food ratings map to find lowest/highest
    const foodScores = {};
    all.forEach((r) => {
      if (r.food) {
        if (!foodScores[r.food._id]) {
          foodScores[r.food._id] = { name: r.food.name, sum: 0, count: 0 };
        }
        foodScores[r.food._id].sum += r.rating;
        foodScores[r.food._id].count++;
      }
    });

    let highestRatedFood = "N/A";
    let lowestRatedFood = "N/A";
    let highestAvg = 0;
    let lowestAvg = 5;

    Object.keys(foodScores).forEach((fid) => {
      const avg = foodScores[fid].sum / foodScores[fid].count;
      if (avg > highestAvg) {
        highestAvg = avg;
        highestRatedFood = foodScores[fid].name;
      }
      if (avg < lowestAvg) {
        lowestAvg = avg;
        lowestRatedFood = foodScores[fid].name;
      }
    });

    res.json({
      reviews: paginatedReviews,
      total,
      stats: {
        totalReviews,
        averageRating,
        highestRatedFood,
        lowestRatedFood,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Update Review Status (Hide / Unhide)
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Approved or Hidden

  if (!["Approved", "Hidden"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    review.status = status;
    await review.save();

    // Update averages
    await updateFoodRating(review.food);

    res.json({ message: `Review status updated to ${status}`, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
