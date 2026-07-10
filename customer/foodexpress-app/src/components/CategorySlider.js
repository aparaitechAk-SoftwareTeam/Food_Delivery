import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Text } from "react-native-paper";

const CategorySlider = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
}) => {
  const renderItem = ({ item }) => {
    const isSelected = selectedCategory === item.name || selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.itemContainer, isSelected && styles.selectedItemContainer]}
        onPress={() => onSelectCategory && onSelectCategory(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrapper, isSelected && styles.selectedIconWrapper]}>
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={styles.categoryImage} 
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.emojiText}>{item.icon || "🍽️"}</Text>
          )}
        </View>
        <Text style={[styles.label, isSelected && styles.selectedLabel]} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>What are you craving today?</Text>
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
    color: "#1D2939",
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
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#F2F4F7",
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
    backgroundColor: "#FF6F61",
    borderColor: "#FF6F61",
    elevation: 3,
    shadowColor: "#FF6F61",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
  },
  emojiText: {
    fontSize: 26,
  },
  label: {
    fontSize: 11,
    color: "#475467",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  selectedLabel: {
    color: "#FF6F61",
    fontWeight: "700",
  },
});

export default CategorySlider;
