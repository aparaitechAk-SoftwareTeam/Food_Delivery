import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Text } from "react-native-paper";
import { useThemeContext } from "../constants/ThemeContext";

const categoryImageMap = {
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80",
  "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4d8?auto=format&fit=crop&w=200&q=80",
  "chinese": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80",
  "south indian": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=200&q=80",
  "desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=200&q=80",
  "beverages": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80",
  "breakfast": "https://images.unsplash.com/photo-1496042399014-dc73c4f2bde1?auto=format&fit=crop&w=200&q=80",
  "snacks": "https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=200&q=80",
  "combos": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80",
};

const getCategoryImage = (item) => {
  if (!item) return { uri: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80" };
  if (item.image) return { uri: item.image };
  const lowerName = (item.name || "").toLowerCase();
  if (categoryImageMap[lowerName]) {
    return { uri: categoryImageMap[lowerName] };
  }
  return { uri: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80" };
};

const CategorySlider = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
}) => {
  const { isDark, theme } = useThemeContext();

  const renderItem = ({ item }) => {
    const isSelected = selectedCategory === item.name || selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.itemContainer, isSelected && styles.selectedItemContainer]}
        onPress={() => onSelectCategory && onSelectCategory(item)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.iconWrapper, 
          { backgroundColor: isDark ? "#252525" : "#F8F9FA", borderColor: theme.colors.border },
          isSelected && [styles.selectedIconWrapper, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]
        ]}>
          <Image 
            source={getCategoryImage(item)} 
            style={styles.categoryImage} 
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.label, { color: theme.colors.subtext }, isSelected && { color: theme.colors.primary, fontWeight: "700" }]} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>What are you craving today?</Text>
      <FlatList
        data={categories}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  itemContainer: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 68,
  },
  selectedItemContainer: {
    transform: [{ scale: 1.05 }],
  },
  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    overflow: "hidden",
  },
  selectedIconWrapper: {
    elevation: 3,
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default CategorySlider;
