import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Searchbar, Text, Card, ActivityIndicator, Chip } from "react-native-paper";
import searchService from "../../services/searchService";
import { useSelector } from "react-redux";

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    restaurants: [],
    foods: [],
    categories: [],
  });
  
  const categories = useSelector((state) => state.foods.categories) || [];

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setResults({ restaurants: [], foods: [], categories: [] });
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchService.searchAll(query);
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setResults({ restaurants: [], foods: [], categories: [] });
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleCategoryPress = (categoryName) => {
    navigation.navigate("FoodListing", { category: categoryName });
  };

  const handleRestaurantPress = (restaurantName) => {
    navigation.navigate("FoodListing", { restaurant: restaurantName });
  };

  const handleFoodPress = (foodId) => {
    navigation.navigate("FoodDetails", { foodId });
  };

  const renderCategoryItem = ({ item }) => (
    <Chip
      style={styles.chip}
      onPress={() => handleCategoryPress(item.name)}
      icon={item.icon || "food"}
    >
      {item.name}
    </Chip>
  );

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => handleRestaurantPress(item.name)}
    >
      <Image source={{ uri: item.image }} style={styles.restaurantImage} resizeMode="cover" />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantMeta}>
          ⭐ {item.rating} • {item.deliveryTime} • {Array.isArray(item.cuisine) ? item.cuisine.join(", ") : item.cuisine || "Cuisine"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() => handleFoodPress(item.id || item._id)}
    >
      <Image source={{ uri: item.image }} style={styles.foodImage} resizeMode="cover" />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodRestaurant}>{item.restaurant}</Text>
        <Text style={styles.foodPrice}>₹{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const hasResults =
    results.categories.length > 0 ||
    results.restaurants.length > 0 ||
    results.foods.length > 0;

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search for food, cuisines, categories..."
        onChangeText={setQuery}
        value={query}
        style={styles.searchBar}
        loading={loading}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ff6b00" />
          <Text style={styles.loadingText}>Searching delicious bites...</Text>
        </View>
      ) : !query ? (
        <ScrollView style={styles.suggestionContainer}>
          <Text style={styles.sectionTitle}>Popular Cuisines</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => {
              const catId = cat._id || cat.id;
              return (
                <TouchableOpacity
                  key={catId}
                  style={styles.cuisineItem}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <Text style={styles.cuisineIcon}>
                    {cat.icon || "🍽️"}
                  </Text>
                  <Text style={styles.cuisineName}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : !hasResults ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noResultsTitle}>No results found</Text>
          <Text style={styles.noResultsSubtitle}>
            Try searching for something else, like 'Pizza' or 'Burger'
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {results.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                data={results.categories}
                keyExtractor={(item) => (item.id || item._id).toString()}
                renderItem={renderCategoryItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              />
            </View>
          )}

          {results.restaurants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Restaurants</Text>
              <FlatList
                data={results.restaurants}
                keyExtractor={(item) => (item.id || item._id).toString()}
                renderItem={renderRestaurantItem}
                scrollEnabled={false}
              />
            </View>
          )}

          {results.foods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dishes</Text>
              <FlatList
                data={results.foods}
                keyExtractor={(item) => (item.id || item._id).toString()}
                renderItem={renderFoodItem}
                scrollEnabled={false}
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    paddingTop: 16,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 28,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  suggestionContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cuisineItem: {
    width: "30%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  cuisineIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cuisineName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  chipsContainer: {
    paddingVertical: 4,
  },
  chip: {
    marginRight: 8,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  restaurantImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: "center",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  restaurantMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  foodCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  foodImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  foodName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  foodRestaurant: {
    fontSize: 12,
    color: "#777",
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff6b00",
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default SearchScreen;
