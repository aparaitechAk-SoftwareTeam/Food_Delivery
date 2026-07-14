const HomeSection = require("../models/HomeSection");

const defaultHomeSections = [
  { key: "banners", title: "Banners Carousel", isVisible: true, displayOrder: 1 },
  { key: "categories", title: "Categories Slider", isVisible: true, displayOrder: 2 },
  { key: "featured_restaurants", title: "Featured Restaurants", isVisible: true, displayOrder: 3 },
  { key: "popular_foods", title: "Popular Choices", isVisible: true, displayOrder: 4 },
  { key: "recommended_items", title: "Recommended for You", isVisible: true, displayOrder: 5 },
  { key: "offers", title: "Special Offers", isVisible: true, displayOrder: 6 },
  { key: "coupons", title: "Coupons & Discounts", isVisible: true, displayOrder: 7 },
  { key: "trending_restaurants", title: "Trending Restaurants", isVisible: true, displayOrder: 8 },
  { key: "new_arrivals", title: "New Arrivals", isVisible: true, displayOrder: 9 },
  { key: "top_rated", title: "Top Rated Foods", isVisible: true, displayOrder: 10 },
  { key: "best_sellers", title: "Best Sellers", isVisible: true, displayOrder: 11 },
  { key: "recently_added", title: "Recently Added", isVisible: true, displayOrder: 12 },
  { key: "membership", title: "Gold Membership", isVisible: true, displayOrder: 13 },
  { key: "referral", title: "Referral Program", isVisible: true, displayOrder: 14 }
];

const initHomeSections = async () => {
  try {
    const count = await HomeSection.countDocuments();
    if (count === 0) {
      console.log("Seeding default home screen sections...");
      await HomeSection.insertMany(defaultHomeSections);
      console.log("Default home screen sections seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding home sections:", error.message);
  }
};

module.exports = initHomeSections;
