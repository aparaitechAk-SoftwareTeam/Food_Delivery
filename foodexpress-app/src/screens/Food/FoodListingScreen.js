import React, { useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text, Card } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchFoods } from "../../redux/slices/foodsSlice";

const FoodListingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { foods, loading } = useSelector((state) => state.foods);

  useEffect(() => {
    dispatch(fetchFoods());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        All Foods
      </Text>
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={() => dispatch(fetchFoods())}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("FoodDetails", { foodId: item.id })
            }
          >
            <Card style={styles.card}>
              <Card.Cover source={{ uri: item.image }} />
              <Card.Content>
                <Text variant="titleSmall">{item.name}</Text>
                <Text>{item.restaurant?.name || item.restaurant}</Text>
                <Text>₹{item.price}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default FoodListingScreen;
