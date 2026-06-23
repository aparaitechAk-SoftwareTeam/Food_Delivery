const mockData = {
  categories: [
    { id: 1, name: "Pizza", icon: "pizza" },
    { id: 2, name: "Burger", icon: "hamburger" },
    { id: 3, name: "Biryani", icon: "rice" },
    { id: 4, name: "Chinese", icon: "noodles" },
    { id: 5, name: "South Indian", icon: "food-variant" },
    { id: 6, name: "Desserts", icon: "cupcake" },
    { id: 7, name: "Beverages", icon: "coffee" },
  ],
  restaurants: [
    {
      id: 1,
      name: "Pizza Hut",
      image:
        "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80",
      rating: 4.4,
      deliveryTime: "30-40 mins",
      cuisine: "Pizza",
    },
    {
      id: 2,
      name: "McDonald's",
      image:
        "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80",
      rating: 4.2,
      deliveryTime: "25-35 mins",
      cuisine: "Burgers",
    },
    {
      id: 3,
      name: "KFC",
      image:
        "https://images.unsplash.com/photo-1603133872871-7a2acf087d74?auto=format&fit=crop&w=800&q=80",
      rating: 4.3,
      deliveryTime: "20-30 mins",
      cuisine: "Fast Food",
    },
    {
      id: 4,
      name: "Burger King",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      rating: 4.1,
      deliveryTime: "25-35 mins",
      cuisine: "Burgers",
    },
    {
      id: 5,
      name: "Local Dine",
      image:
        "https://images.unsplash.com/photo-1523362628745-0c100150b7a5?auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      deliveryTime: "20-25 mins",
      cuisine: "South Indian",
    },
  ],
  foods: [
    {
      id: 101,
      name: "Margherita Pizza",
      description: "Thin crust pizza topped with fresh mozzarella and basil.",
      price: 8.99,
      rating: 4.7,
      deliveryTime: "30 mins",
      image:
        "https://images.unsplash.com/photo-1594007653308-d4d8d2ab5d73?auto=format&fit=crop&w=800&q=80",
      restaurant: "Pizza Hut",
      category: "Pizza",
      restaurantId: 1,
    },
    {
      id: 102,
      name: "Chicken Burger",
      description:
        "Juicy grilled chicken with fresh lettuce and signature sauce.",
      price: 7.49,
      rating: 4.5,
      deliveryTime: "25 mins",
      image:
        "https://images.unsplash.com/photo-1606756791432-26d4f7f4f87b?auto=format&fit=crop&w=800&q=80",
      restaurant: "McDonald's",
      category: "Burger",
      restaurantId: 2,
    },
    {
      id: 103,
      name: "Butter Chicken Biryani",
      description: "Rich and creamy biryani with tender chicken pieces.",
      price: 11.99,
      rating: 4.8,
      deliveryTime: "35 mins",
      image:
        "https://images.unsplash.com/photo-1605476879656-3b27c8d9db90?auto=format&fit=crop&w=800&q=80",
      restaurant: "Local Dine",
      category: "Biryani",
      restaurantId: 5,
    },
    {
      id: 104,
      name: "Veg Manchurian",
      description: "Crispy veg balls tossed in a tangy Indo-Chinese sauce.",
      price: 6.99,
      rating: 4.4,
      deliveryTime: "28 mins",
      image:
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80",
      restaurant: "Local Dine",
      category: "Chinese",
      restaurantId: 5,
    },
    {
      id: 105,
      name: "Dosa Platter",
      description: "Crispy dosa served with coconut chutney and sambar.",
      price: 5.49,
      rating: 4.6,
      deliveryTime: "20 mins",
      image:
        "https://images.unsplash.com/photo-1571518578187-7f1e69effb52?auto=format&fit=crop&w=800&q=80",
      restaurant: "Local Dine",
      category: "South Indian",
      restaurantId: 5,
    },
    {
      id: 106,
      name: "Chocolate Brownie",
      description: "Warm chocolate brownie with a scoop of vanilla ice cream.",
      price: 4.99,
      rating: 4.9,
      deliveryTime: "15 mins",
      image:
        "https://images.unsplash.com/photo-1599785209707-7f3f1a6a2fae?auto=format&fit=crop&w=800&q=80",
      restaurant: "Local Dine",
      category: "Desserts",
      restaurantId: 5,
    },
    {
      id: 107,
      name: "Iced Coffee",
      description: "Chilled coffee with milk and a hint of caramel.",
      price: 3.99,
      rating: 4.3,
      deliveryTime: "12 mins",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
      restaurant: "Local Dine",
      category: "Beverages",
      restaurantId: 5,
    },
  ],
  featured: [
    {
      id: 201,
      name: "Weekend Feast Combo",
      description: "Special combo with pizza, burger, and fries.",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
      restaurant: "Pizza Hut",
      price: 19.99,
      rating: 4.7,
    },
  ],
  popular: [
    {
      id: 102,
      name: "Chicken Burger",
      description:
        "Juicy grilled chicken with fresh lettuce and signature sauce.",
      price: 7.49,
      rating: 4.5,
      deliveryTime: "25 mins",
      image:
        "https://images.unsplash.com/photo-1606756791432-26d4f7f4f87b?auto=format&fit=crop&w=800&q=80",
      restaurant: "McDonald's",
    },
    {
      id: 101,
      name: "Margherita Pizza",
      description: "Thin crust pizza topped with fresh mozzarella and basil.",
      price: 8.99,
      rating: 4.7,
      deliveryTime: "30 mins",
      image:
        "https://images.unsplash.com/photo-1594007653308-d4d8d2ab5d73?auto=format&fit=crop&w=800&q=80",
      restaurant: "Pizza Hut",
    },
  ],
  orders: [
    {
      id: 301,
      orderNumber: "FE1001",
      status: "Preparing",
      totalAmount: 25.97,
      items: [
        { food: { name: "Margherita Pizza" }, quantity: 1 },
        { food: { name: "Iced Coffee" }, quantity: 2 },
      ],
    },
    {
      id: 302,
      orderNumber: "FE1002",
      status: "Delivered",
      totalAmount: 18.49,
      items: [{ food: { name: "Chicken Burger" }, quantity: 1 }],
    },
  ],
  wishlist: [
    {
      id: 102,
      name: "Chicken Burger",
      restaurant: "McDonald's",
      image:
        "https://images.unsplash.com/photo-1606756791432-26d4f7f4f87b?auto=format&fit=crop&w=800&q=80",
      price: 7.49,
    },
  ],
  notifications: [
    {
      id: 401,
      title: "50% off on your next order",
      description: "Use code FOODIE50 at checkout.",
      type: "Offer",
    },
    {
      id: 402,
      title: "Order FE1001 is on the way",
      description: "Your Margherita Pizza is out for delivery.",
      type: "Order",
    },
  ],
};

export default mockData;
