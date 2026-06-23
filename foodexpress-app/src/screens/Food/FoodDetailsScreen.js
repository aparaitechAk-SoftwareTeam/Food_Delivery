import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, Button, Chip } from "react-native-paper";
import foodService from "../../services/foodService";
import { useDispatch } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import { addToWishlist } from "../../redux/slices/wishlistSlice";

const FoodDetailsScreen = ({ route }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    foodService.getFoodDetails(foodId).then((response) => {
      setFood(response);
      setLoading(false);
    });
  }, [foodId]);

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
          onPress={() =>
            dispatch(
              addToCart({
                id: food._id,
                name: food.name,
                price: food.price,
                quantity: 1,
              }),
            )
          }
        >
          Add to Cart
        </Button>
        <Button
          mode="outlined"
          onPress={() =>
            dispatch(
              addToWishlist({
                id: food._id,
                name: food.name,
                restaurant: food.restaurant?.name || "Restaurant",
              }),
            )
          }
        >
          Wishlist
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    marginTop: 32,
    textAlign: "center",
  },
  price: {
    marginTop: 12,
    color: "#ff6b00",
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
