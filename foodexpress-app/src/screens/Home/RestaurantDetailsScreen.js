import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";

const RestaurantDetailsScreen = ({ route }) => {
  const { restaurant } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Cover source={{ uri: restaurant.image }} />
        <Card.Content>
          <Text variant="headlineSmall">{restaurant.name}</Text>
          <Text>{restaurant.address}</Text>
          <Text>Rating: {restaurant.rating}</Text>
          <Text>Delivery: {restaurant.deliveryTime}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default RestaurantDetailsScreen;
