/**
 * timeOfDay.js
 * Pure utility — detects the current time period and returns
 * display metadata (greeting, emoji, subtitle, accent color).
 * No React, no side-effects.
 */

/** @typedef {'morning'|'afternoon'|'evening'|'night'} TimePeriod */

/**
 * @param {Date} [date] — defaults to now
 * @returns {{ period: TimePeriod, hour: number, greeting: string, emoji: string, subtitle: string, accentColor: string, gradientColors: string[] }}
 */
export function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      period: "morning",
      hour,
      greeting: "Good Morning",
      emoji: "🌅",
      subtitle: "Start your day with a delicious breakfast",
      accentColor: "#FF8C42",
      gradientColors: ["#FFF3E0", "#FFE0B2"],
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      period: "afternoon",
      hour,
      greeting: "Good Afternoon",
      emoji: "☀️",
      subtitle: "Treat yourself to a hearty lunch",
      accentColor: "#F4A11B",
      gradientColors: ["#FFFDE7", "#FFF9C4"],
    };
  }

  if (hour >= 17 && hour < 23) {
    return {
      period: "evening",
      hour,
      greeting: "Good Evening",
      emoji: "🌇",
      subtitle: "Perfect for your evening cravings",
      accentColor: "#FF6F61",
      gradientColors: ["#FBE9E7", "#FFCCBC"],
    };
  }

  // Night: 23:00 – 04:59
  return {
    period: "night",
    hour,
    greeting: "Good Night",
    emoji: "🌙",
    subtitle: "Late night hunger? We've got you",
    accentColor: "#5C6BC0",
    gradientColors: ["#E8EAF6", "#C5CAE9"],
  };
}

/**
 * Returns a human-readable time string like "6:30 PM"
 * @param {Date} [date]
 * @returns {string}
 */
export function formatTime(date = new Date()) {
  const h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mins = m.toString().padStart(2, "0");
  return `${hour12}:${mins} ${suffix}`;
}

/**
 * Keyword-based meal-time classifier.
 * Used when the backend food item doesn't have a `mealTime` field.
 * Returns an array of periods the food belongs to.
 *
 * @param {{ name?: string, category?: string|{ name?: string } }} food
 * @returns {TimePeriod[]}
 */
export function classifyFoodMealTime(food) {
  const text = [
    food?.name || "",
    typeof food?.category === "string" ? food.category : food?.category?.name || "",
  ]
    .join(" ")
    .toLowerCase();

  /** @type {Record<TimePeriod, string[]>} */
  const keywords = {
    morning: [
      "breakfast", "idli", "dosa", "poha", "upma", "tea", "coffee",
      "omelette", "sandwich", "paratha", "vada", "uttapam", "puri",
      "toast", "egg", "pancake", "waffle", "cornflakes", "smoothie",
      "masala chai", "samosa", "kachori",
    ],
    afternoon: [
      "thali", "biryani", "rice", "dal", "curry", "roti", "noodle",
      "fried rice", "paneer", "chicken meal", "rajma", "chole",
      "pulao", "korma", "sabzi", "chapati", "paratha", "khichdi",
      "soup", "salad", "south indian", "lassi",
    ],
    evening: [
      "pizza", "burger", "momos", "fries", "pasta", "wrap", "snack",
      "pav", "vada pav", "roll", "shake", "cold coffee", "nachos",
      "spring roll", "chaat", "bhel", "sev puri", "pani puri",
      "masala fries", "wings", "nugget",
    ],
    night: [
      "biryani", "maggi", "roll", "pizza", "burger", "shawarma",
      "ice cream", "cold drink", "manchow", "ramen", "pasta",
      "grilled", "kebab", "tikka", "seekh", "noodle",
    ],
  };

  const matched = [];
  for (const [period, words] of Object.entries(keywords)) {
    if (words.some((w) => text.includes(w))) {
      matched.push(period);
    }
  }

  // Default: show in all periods if we can't classify
  return matched.length > 0 ? matched : ["morning", "afternoon", "evening", "night"];
}

/**
 * Filters a list of foods for the given time period.
 * Uses `food.mealTime` if present, otherwise falls back to keyword classifier.
 *
 * @param {any[]} foods
 * @param {TimePeriod} period
 * @returns {any[]}
 */
export function filterFoodsByPeriod(foods, period) {
  return foods.filter((food) => {
    if (Array.isArray(food.mealTime) && food.mealTime.length > 0) {
      return food.mealTime.includes(period);
    }
    return classifyFoodMealTime(food).includes(period);
  });
}
