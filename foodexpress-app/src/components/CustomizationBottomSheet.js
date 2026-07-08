import React, { useState, useEffect } from "react";
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { Text, Checkbox, RadioButton, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CustomizationBottomSheet = ({ visible, onClose, food, onAddComplete }) => {
  if (!food) return null;

  // Options states
  const [selectedSize, setSelectedSize] = useState("Medium");
  const [addons, setAddons] = useState({
    extraCheese: false,
    extraButter: false,
    extraSauce: false,
  });
  const [instructions, setInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [finalPrice, setFinalPrice] = useState(food.price);

  // Prices definitions
  const sizePrices = {
    Small: -20,
    Medium: 0,
    Large: 40,
  };

  const addonPrices = {
    extraCheese: 25,
    extraButter: 15,
    extraSauce: 10,
  };

  // Recalculate price when options change
  useEffect(() => {
    let price = food.price;
    price += sizePrices[selectedSize];
    
    if (addons.extraCheese) price += addonPrices.extraCheese;
    if (addons.extraButter) price += addonPrices.extraButter;
    if (addons.extraSauce) price += addonPrices.extraSauce;
    
    setFinalPrice(price);
  }, [selectedSize, addons, food.price]);

  const handleAddonToggle = (key) => {
    setAddons((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddToCart = () => {
    // Generate active addons list
    const activeAddons = [];
    if (addons.extraCheese) activeAddons.push("Extra Cheese");
    if (addons.extraButter) activeAddons.push("Extra Butter");
    if (addons.extraSauce) activeAddons.push("Extra Sauce");

    onAddComplete({
      size: selectedSize,
      addons: activeAddons,
      instructions,
      quantity,
      price: finalPrice,
    });
    
    // Reset state
    setSelectedSize("Medium");
    setAddons({ extraCheese: false, extraButter: false, extraSauce: false });
    setInstructions("");
    setQuantity(1);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* Backdrop click to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        {/* Modal Container */}
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Customise "{food.name}"</Text>
              <Text style={styles.basePrice}>Base Price: ₹{food.price}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#475467" />
            </TouchableOpacity>
          </View>

          {/* Form Scroll View */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Section 1: Size Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Choose Size</Text>
              <RadioButton.Group onValueChange={value => setSelectedSize(value)} value={selectedSize}>
                <TouchableOpacity style={styles.row} onPress={() => setSelectedSize("Small")}>
                  <View style={styles.radioLabelRow}>
                    <RadioButton value="Small" color="#039855" />
                    <Text style={styles.optionLabel}>Small</Text>
                  </View>
                  <Text style={styles.optionPrice}>- ₹20</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} onPress={() => setSelectedSize("Medium")}>
                  <View style={styles.radioLabelRow}>
                    <RadioButton value="Medium" color="#039855" />
                    <Text style={styles.optionLabel}>Medium</Text>
                  </View>
                  <Text style={styles.optionPrice}>Free</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} onPress={() => setSelectedSize("Large")}>
                  <View style={styles.radioLabelRow}>
                    <RadioButton value="Large" color="#039855" />
                    <Text style={styles.optionLabel}>Large</Text>
                  </View>
                  <Text style={styles.optionPrice}>+ ₹40</Text>
                </TouchableOpacity>
              </RadioButton.Group>
            </View>

            {/* Section 2: Addons Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Add Extra Ingredients</Text>
              
              <TouchableOpacity style={styles.row} onPress={() => handleAddonToggle("extraCheese")}>
                <View style={styles.checkboxLabelRow}>
                  <Checkbox 
                    status={addons.extraCheese ? "checked" : "unchecked"} 
                    color="#039855" 
                    onPress={() => handleAddonToggle("extraCheese")}
                  />
                  <Text style={styles.optionLabel}>Extra Cheese</Text>
                </View>
                <Text style={styles.optionPrice}>+ ₹25</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={() => handleAddonToggle("extraButter")}>
                <View style={styles.checkboxLabelRow}>
                  <Checkbox 
                    status={addons.extraButter ? "checked" : "unchecked"} 
                    color="#039855" 
                    onPress={() => handleAddonToggle("extraButter")}
                  />
                  <Text style={styles.optionLabel}>Extra Butter</Text>
                </View>
                <Text style={styles.optionPrice}>+ ₹15</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={() => handleAddonToggle("extraSauce")}>
                <View style={styles.checkboxLabelRow}>
                  <Checkbox 
                    status={addons.extraSauce ? "checked" : "unchecked"} 
                    color="#039855" 
                    onPress={() => handleAddonToggle("extraSauce")}
                  />
                  <Text style={styles.optionLabel}>Extra Sauce</Text>
                </View>
                <Text style={styles.optionPrice}>+ ₹10</Text>
              </TouchableOpacity>
            </View>

            {/* Section 3: Special Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Special Instructions</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Make it extra spicy, no onions, etc."
                placeholderTextColor="#98A2B3"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Sticky Add to Cart */}
          <View style={styles.footer}>
            {/* Quantity Selector */}
            <View style={styles.qtyContainer}>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              >
                <MaterialCommunityIcons name="minus" size={20} color="#344054" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(quantity + 1)}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#344054" />
              </TouchableOpacity>
            </View>

            {/* Final Add button */}
            <Button
              mode="contained"
              buttonColor="#039855"
              style={styles.addCartBtn}
              labelStyle={styles.addCartBtnText}
              onPress={handleAddToCart}
            >
              Add To Cart • ₹{finalPrice * quantity}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
  },
  basePrice: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  radioLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },
  checkboxLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -8,
  },
  optionLabel: {
    fontSize: 14,
    color: "#1D2939",
    fontWeight: "600",
  },
  optionPrice: {
    fontSize: 13,
    color: "#475467",
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1D2939",
    textAlignVertical: "top",
    backgroundColor: "#F9FAFB",
    height: 72,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    height: 48,
    justifyContent: "space-between",
    paddingHorizontal: 8,
    width: 110,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1D2939",
  },
  addCartBtn: {
    flex: 1,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
  },
  addCartBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

export default CustomizationBottomSheet;
