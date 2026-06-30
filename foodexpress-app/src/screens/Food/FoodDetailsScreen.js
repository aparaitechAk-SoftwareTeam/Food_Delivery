import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, Button, Chip } from "react-native-paper";
import foodService from "../../services/foodService";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import { addFoodToWishlist, removeFoodFromWishlist } from "../../redux/slices/wishlistSlice";

const FoodDetailsScreen = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const { token } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const isFav = wishlistItems.some((w) => (w.id || w._id)?.toString() === foodId?.toString());

  useEffect(() => {
    foodService.getFoodDetails(foodId).then((response) => {
      setFood(response);
      setLoading(false);
    });
  }, [foodId]);

  const handleWishlistToggle = () => {
    if (!token) {
      Alert.alert(
        "Login Required",
        "Please log in to add items to your wishlist.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login", { redirectTo: "FoodDetails", redirectParams: { foodId } }) }
        ]
      );
      return;
    }
    if (isFav) {
      dispatch(removeFoodFromWishlist(foodId));
    } else {
      dispatch(addFoodToWishlist(food));
    }
  };

  if (loading || !food) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Cover source={{ uri: food.image }} />
        <Card.Content>
          <Text variant="headlineSmall">{food.name}</Text>
          <Text>{food.description}</Text>
          <Text variant="titleMedium" style={styles.price}>
            ₹{food.price}
          </Text>
          <View style={styles.row}>
            <Chip style={styles.chip}>{food.category?.name || "Category"}</Chip>
            <Chip style={styles.chip}>
              {food.restaurant?.name || "Restaurant"}
            </Chip>
          </View>
        </Card.Content>
      </Card>
      <View style={styles.actions}>
        <Button
          mode="contained"
          buttonColor="#22C55E"
          onPress={() =>
            dispatch(
              addToCart({
                id: food.id || food._id,
                name: food.name,
                price: food.price,
                quantity: 1,
                restaurant: food.restaurant?.name || "Restaurant"
              }),
            )
          }
        >
          Add to Cart
        </Button>
        <Button
          mode={isFav ? "contained" : "outlined"}
          buttonColor={isFav ? "#16A34A" : undefined}
          textColor={isFav ? "#fff" : "#22C55E"}
          style={{ borderColor: "#22C55E" }}
          onPress={handleWishlistToggle}
        >
          {isFav ? "Remove from Wishlist" : "Add to Wishlist"}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loading: {
    marginTop: 32,
    textAlign: "center",
  },
  price: {
    marginTop: 12,
    color: "#16A34A",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  chip: {
    marginTop: 8,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
});

export default FoodDetailsScreen;
