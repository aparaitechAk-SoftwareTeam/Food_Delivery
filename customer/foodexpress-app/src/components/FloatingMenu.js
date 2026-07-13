import React, { useState, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, ScrollView, Modal, Image } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  if (item.image) return { uri: item.image };
  const lowerName = (item.name || "").toLowerCase();
  if (categoryImageMap[lowerName]) {
    return { uri: categoryImageMap[lowerName] };
  }
  return { uri: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80" };
};

const FloatingMenu = ({ categories = [], onSelectCategory }) => {
  const [expanded, setExpanded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    if (expanded) {
      // Close animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setExpanded(false));
    } else {
      // Open animation
      setExpanded(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleCategorySelect = (cat) => {
    toggleMenu();
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  return (
    <View style={styles.container}>
      {/* Expanded Menu Modal */}
      {expanded && (
        <Modal
          visible={expanded}
          transparent
          animationType="none"
          onRequestClose={toggleMenu}
        >
          {/* Overlay backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={toggleMenu}
          >
            <Animated.View
              style={[
                styles.menuWindow,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.menuTitle}>Jump to Category</Text>
              <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={styles.menuGrid}
                showsVerticalScrollIndicator={false}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id || cat._id}
                    style={styles.gridItem}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <View style={styles.itemEmojiWrapper}>
                      <Image 
                        source={getCategoryImage(cat)} 
                        style={styles.categoryImage} 
                        resizeMode="cover"
                      />
                    </View>
                    <Text numberOfLines={1} style={styles.itemLabel}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.buttonText}>MENU</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    zIndex: 100,
  },
  floatingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1D2939",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 6,
    letterSpacing: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 90,
  },
  menuWindow: {
    width: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#98A2B3",
    textTransform: "uppercase",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  menuScroll: {
    maxHeight: 300,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
  },
  itemEmojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAECF0",
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  itemLabel: {
    fontSize: 11,
    color: "#344054",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default FloatingMenu;
