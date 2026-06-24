import React, { useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from "react-native";
import { Text, IconButton, Snackbar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, removeFoodFromWishlist } from "../../redux/slices/wishlistSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const WishlistScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.wishlist);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState("");

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (foodId) => {
    dispatch(removeFoodFromWishlist(foodId))
      .unwrap()
      .then(() => {
        setSnackbarMsg("Item removed from wishlist");
        setSnackbarVisible(true);
      });
  };

  const handleAddToCart = (item) => {
    const restName = item.restaurant?.name || item.restaurant || "FoodExpress Restaurant";
    dispatch(addToCart({
      id: item.id || item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      restaurant: restName,
      image: item.image
    }));
    setSnackbarMsg(`${item.name} added to cart!`);
    setSnackbarVisible(true);
  };

  const renderWishlistItem = ({ item }) => {
    const originalPrice = item.originalPrice || Math.round(item.price * 1.25);
    const discount = item.discountPercentage || Math.round(((originalPrice - item.price) / originalPrice) * 100);
    const rating = item.rating || 4.2;

    return (
      <View style={styles.itemCard}>
        {/* Left Section: Food Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.vegRow}>
            <MaterialCommunityIcons
              name={item.isVeg ? "circle-slice-8" : "circle-slice-8"}
              size={16}
              color={item.isVeg ? "#0f8a5f" : "#b22222"}
            />
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tags[0]}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.restaurantName}>
            {item.restaurant?.name || item.restaurant || "Restaurant"}
          </Text>

          <View style={styles.ratingRow}>
            <View style={styles.starsContainer}>
              <MaterialCommunityIcons name="star" size={14} color="#ffb300" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
            <Text style={styles.prepTimeText}>
              • {item.preparationTime || 25} mins
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.price}</Text>
            {originalPrice > item.price && (
              <>
                <Text style={styles.originalPriceText}>₹{originalPrice}</Text>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </>
            )}
          </View>
        </View>

        {/* Right Section: Image & Add to Cart */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80",
            }}
            style={styles.foodImage}
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addBtnText}>ADD</Text>
            <MaterialCommunityIcons name="plus" size={12} color="#ff6b00" style={styles.addPlus} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeIconBtn}
            onPress={() => handleRemove(item.id || item._id)}
          >
            <MaterialCommunityIcons name="heart" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>{items.length} items saved</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => (item.id || item._id).toString()}
        renderItem={renderWishlistItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="heart-broken" size={54} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Save your favorite dishes to order them easily next time.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.exploreBtnText}>Explore Foods</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
        action={{
          label: "View Cart",
          onPress: () => {
            navigation.navigate("Cart");
          },
        }}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailsContainer: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "center",
  },
  vegRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tagBadge: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  tagText: {
    fontSize: 10,
    color: "#e65100",
    fontWeight: "bold",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ff8f00",
    marginLeft: 2,
  },
  prepTimeText: {
    fontSize: 11,
    color: "#888",
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  originalPriceText: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  discountText: {
    fontSize: 11,
    color: "#0f8a5f",
    fontWeight: "bold",
    marginLeft: 6,
  },
  imageContainer: {
    alignItems: "center",
    position: "relative",
  },
  foodImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  addBtn: {
    position: "absolute",
    bottom: -10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 80,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ff6b00",
  },
  addPlus: {
    marginLeft: 2,
  },
  removeIconBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: "#ff6b00",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default WishlistScreen;
