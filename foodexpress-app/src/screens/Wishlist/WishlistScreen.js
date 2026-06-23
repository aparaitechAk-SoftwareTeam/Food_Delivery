import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text, Card, IconButton } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { removeFromWishlist } from "../../redux/slices/wishlistSlice";

const WishlistScreen = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.wishlist);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Wishlist
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Card style={styles.card}>
              <Card.Title
                title={item.name}
                subtitle={item.restaurant}
                right={() => (
                  <IconButton
                    icon="delete"
                    onPress={() => dispatch(removeFromWishlist(item.id))}
                  />
                )}
              />
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Your wishlist is empty</Text>
        }
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
    marginBottom: 12,
  },
  empty: {
    marginTop: 32,
    textAlign: "center",
  },
});

export default WishlistScreen;
