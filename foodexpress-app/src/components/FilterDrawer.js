import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Text, Button, IconButton, Divider, Chip } from "react-native-paper";

const FilterDrawer = ({ visible, onClose, filters, onApply, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(filters.category || "");
  const [price, setPrice] = useState(filters.price || "");
  const [rating, setRating] = useState(filters.rating || "");
  const [deliveryTime, setDeliveryTime] = useState(filters.deliveryTime || "");
  const [discount, setDiscount] = useState(filters.discount || "");
  const [restaurantType, setRestaurantType] = useState(filters.restaurantType || "");
  
  // Toggles
  const [isOpen, setIsOpen] = useState(filters.isOpen === "true");
  const [vegType, setVegType] = useState(filters.vegType || "");

  useEffect(() => {
    if (visible) {
      setSelectedCategory(filters.category || "");
      setPrice(filters.price || "");
      setRating(filters.rating || "");
      setDeliveryTime(filters.deliveryTime || "");
      setDiscount(filters.discount || "");
      setRestaurantType(filters.restaurantType || "");
      setIsOpen(filters.isOpen === "true");
      setVegType(filters.vegType || "");
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      price,
      rating,
      deliveryTime,
      discount,
      restaurantType,
      isOpen: isOpen ? "true" : "",
      vegType,
    });
  };

  const handleReset = () => {
    setSelectedCategory("");
    setPrice("");
    setRating("");
    setDeliveryTime("");
    setDiscount("");
    setRestaurantType("");
    setIsOpen(false);
    setVegType("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={styles.sheetContainer}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Refine Products & Services</Text>
            <IconButton icon="close" onPress={onClose} size={24} />
          </View>
          <Divider />

          {/* Form Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Veg/Non-Veg preference */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dietary Preference</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: "Veg Only", value: "veg" },
                  { label: "Non-Veg Only", value: "non-veg" },
                ].map((item) => {
                  const isSelected = vegType === item.value;
                  return (
                    <Chip
                      key={item.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setVegType(isSelected ? "" : item.value)}
                      icon={item.value === "veg" ? "leaf" : "food-drumstick"}
                    >
                      {item.label}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Category selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.chipsContainer}>
                {categories.map((cat) => {
                  const isSelected = selectedCategory?.toLowerCase() === cat.name?.toLowerCase();
                  return (
                    <Chip
                      key={cat._id || cat.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setSelectedCategory(isSelected ? "" : cat.name)}
                    >
                      {cat.name}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Price Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Filter</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: "Under ₹100", value: "under_100" },
                  { label: "₹100 - ₹250", value: "100_250" },
                  { label: "₹250 - ₹500", value: "250_500" },
                  { label: "₹500 - ₹1000", value: "500_1000" },
                  { label: "Above ₹1000", value: "above_1000" },
                ].map((item) => {
                  const isSelected = price === item.value;
                  return (
                    <Chip
                      key={item.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setPrice(isSelected ? "" : item.value)}
                    >
                      {item.label}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating Filter</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: "4.5+ Rating", value: "4.5" },
                  { label: "4.0+ Rating", value: "4.0" },
                  { label: "3.5+ Rating", value: "3.5" },
                ].map((item) => {
                  const isSelected = rating === item.value;
                  return (
                    <Chip
                      key={item.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setRating(isSelected ? "" : item.value)}
                      icon="star"
                    >
                      {item.label}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Delivery Time Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Time</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: "Under 10 mins", value: "under_10" },
                  { label: "Under 20 mins", value: "under_20" },
                  { label: "Under 30 mins", value: "under_30" },
                  { label: "Under 45 mins", value: "under_45" },
                ].map((item) => {
                  const isSelected = deliveryTime === item.value;
                  return (
                    <Chip
                      key={item.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setDeliveryTime(isSelected ? "" : item.value)}
                    >
                      {item.label}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Discount Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offers & Discounts</Text>
              <View style={styles.chipsContainer}>
                {[
                  { label: "10%+ OFF", value: "10_plus" },
                  { label: "20%+ OFF", value: "20_plus" },
                  { label: "30%+ OFF", value: "30_plus" },
                  { label: "50%+ OFF", value: "50_plus" },
                ].map((item) => {
                  const isSelected = discount === item.value;
                  return (
                    <Chip
                      key={item.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setDiscount(isSelected ? "" : item.value)}
                      icon="tag"
                    >
                      {item.label}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Restaurant Type Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Restaurant Type</Text>
              <View style={styles.chipsContainer}>
                {["Pure Veg", "Multi Cuisine", "Cafe", "Bakery", "Cloud Kitchen"].map((t) => {
                  const isSelected = restaurantType === t;
                  return (
                    <Chip
                      key={t}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      textStyle={[styles.chipText, isSelected && styles.chipTextActive]}
                      onPress={() => setRestaurantType(isSelected ? "" : t)}
                    >
                      {t}
                    </Chip>
                  );
                })}
              </View>
            </View>

            {/* Availability Switch */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleTitle}>Open Now</Text>
                <Text style={styles.toggleSub}>Only show restaurants accepting orders</Text>
              </View>
              <Switch
                value={isOpen}
                onValueChange={setIsOpen}
                trackColor={{ false: "#ccc", true: "#ff6b00" }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <Divider />
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.actionBtn}
              textColor="#666"
              borderColor="#ccc"
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              style={[styles.actionBtn, styles.applyBtn]}
              buttonColor="#ff6b00"
            >
              Apply Filters
            </Button>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipActive: {
    backgroundColor: "#ffefd6",
    borderColor: "#ff6b00",
  },
  chipText: {
    color: "#666",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#ff6b00",
    fontWeight: "bold",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 16,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  toggleSub: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  actionBtn: {
    width: "47%",
    borderRadius: 12,
  },
  applyBtn: {
    elevation: 2,
  },
});

export default FilterDrawer;
