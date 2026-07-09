const mockFoods = {
  foods: [
    {
      id: 1,
      name: "Margherita Pizza",
      image: "https://via.placeholder.com/400x300.png?text=Margherita+Pizza",
      restaurant: "Pizza House",
      price: 9.99,
      category: "Pizza",
      description: "Classic margherita with fresh tomatoes and basil.",
    },
    {
      id: 2,
      name: "Sushi Platter",
      image: "https://via.placeholder.com/400x300.png?text=Sushi+Platter",
      restaurant: "Sakura Sushi",
      price: 14.99,
      category: "Sushi",
      description: "Assorted nigiri and rolls.",
    },
    {
      id: 3,
      name: "Burger Deluxe",
      image: "https://via.placeholder.com/400x300.png?text=Burger+Deluxe",
      restaurant: "Burger Hub",
      price: 8.5,
      category: "Burgers",
      description: "Beef patty with cheese, lettuce and tomato.",
    },
  ],
  categories: [
    { id: 1, name: "Pizza" },
    { id: 2, name: "Sushi" },
    { id: 3, name: "Burgers" },
    { id: 4, name: "Desserts" },
  ],
  featured: [
    {
      id: 1,
      name: "Special Combo",
      image: "https://via.placeholder.com/600x300.png?text=Special+Combo",
      restaurant: "FoodExpress Specials",
      price: 19.99,
    },
  ],
  popular: [
    {
      id: 2,
      name: "Sushi Platter",
      image: "https://via.placeholder.com/400x300.png?text=Sushi+Platter",
      restaurant: "Sakura Sushi",
      price: 14.99,
    },
  ],
};

export default mockFoods;
