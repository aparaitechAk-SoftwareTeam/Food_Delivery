import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Text,
  Avatar,
  Card,
  Searchbar,
  useTheme,
  Chip,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import ScreenContainer from "../../components/ScreenContainer";
import { fetchFoods } from "../../redux/slices/foodsSlice";

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { featured, popular, categories, restaurants, offers, loading } =
    useSelector((state) => state.foods);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchFoods());
  }, [dispatch]);

  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <Chip style={styles.categoryChip}>{item.name}</Chip>
    </TouchableOpacity>
  );

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity
      style={[styles.restaurantCard, { backgroundColor: theme.colors.surface }]}
    >
      <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text variant="titleSmall">{item.name}</Text>
        <Text style={styles.mutedText}>
          {item.cuisine} • {item.deliveryTime}
        </Text>
        <Text style={styles.rating}>⭐ {item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFoodCard = (item, variant = "horizontal") => (
    <TouchableOpacity
      key={item.id}
      style={variant === "horizontal" ? styles.foodCard : styles.featuredCard}
      onPress={() => navigation.navigate("FoodDetails", { foodId: item.id })}
    >
      <Card style={styles.foodCardWrapper}>
        <Card.Cover source={{ uri: item.image }} style={styles.foodImage} />
        <Card.Content>
          <Text variant="titleSmall" numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.mutedText} numberOfLines={1}>
            {item.restaurant}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
            <Chip style={styles.smallChip}>{item.rating}</Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer
      refreshing={loading}
      onRefresh={() => dispatch(fetchFoods())}
    >
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium">Hello Foodie</Text>
          <Text variant="bodyMedium" style={styles.subtext}>
            Find the best meals from top restaurants around you.
          </Text>
        </View>
        <Avatar.Text size={48} label="FE" />
      </View>

      <Searchbar
        placeholder="Search dishes, restaurants, or cuisines"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.search}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroText}>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Craving something delicious?
          </Text>
          <Text style={styles.heroSubtitle}>
            Get your favorite meals delivered hot and fast.
          </Text>
        </View>
        <Avatar.Icon size={72} icon="food" style={styles.heroIcon} />
      </View>

      <Section title="Categories" />
      <FlatList
        data={categories}
        horizontal
        contentContainerStyle={styles.sectionList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategory}
        showsHorizontalScrollIndicator={false}
      />

      <Section title="Popular foods" />
      <FlatList
        data={popular}
        horizontal
        contentContainerStyle={styles.sectionList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderFoodCard(item, "horizontal")}
        showsHorizontalScrollIndicator={false}
      />

      <Section title="Top restaurants" />
      <FlatList
        data={restaurants}
        horizontal
        contentContainerStyle={styles.sectionList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRestaurant}
        showsHorizontalScrollIndicator={false}
      />

      <Section title="Special offers" />
      <FlatList
        data={offers}
        horizontal
        contentContainerStyle={styles.sectionList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderFoodCard(item, "horizontal")}
        showsHorizontalScrollIndicator={false}
      />

      <Section title="Recommended for you" />
      <View style={styles.featuredRow}>
        {featured.map((item) => renderFoodCard(item, "featured"))}
      </View>
    </ScreenContainer>
  );
};

const Section = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text variant="titleMedium">{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  subtext: {
    color: "#6b6b6b",
    marginTop: 6,
  },
  search: {
    marginBottom: 18,
  },
  heroCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffefd6",
    padding: 18,
    borderRadius: 24,
    marginBottom: 20,
  },
  heroText: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#6b6b6b",
  },
  heroIcon: {
    backgroundColor: "#fff",
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionList: {
    paddingBottom: 18,
  },
  categoryCard: {
    marginRight: 12,
    borderRadius: 18,
    backgroundColor: "#fff",
    elevation: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  categoryChip: {
    backgroundColor: "#f8f4f0",
    borderColor: "transparent",
  },
  foodCard: {
    width: 220,
    marginRight: 16,
  },
  foodCardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  foodImage: {
    height: 140,
  },
  featuredRow: {
    gap: 16,
  },
  featuredCard: {
    marginBottom: 16,
  },
  restaurantCard: {
    width: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 16,
  },
  restaurantImage: {
    width: "100%",
    height: 140,
  },
  restaurantInfo: {
    padding: 12,
  },
  mutedText: {
    color: "#6b6b6b",
    marginTop: 6,
  },
  rating: {
    marginTop: 8,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  price: {
    color: "#ff6b00",
    fontWeight: "700",
  },
  smallChip: {
    height: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ffd1a9",
  },
});

export default HomeScreen;
