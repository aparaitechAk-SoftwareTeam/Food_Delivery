import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  selectCartBillDetails,
} from "../../redux/slices/cartSlice";
import api from "../../utils/api";
import { useThemeContext } from "../../constants/ThemeContext";

// ─── Cart Item Row ────────────────────────────────────────────────────────────
const CartItemRow = ({ item, onIncrease, onDecrease, onRemove }) => (
  <View style={styles.itemRow}>
    {item.image ? (
      <Image source={{ uri: item.image || undefined }} style={styles.itemImage} />
    ) : (
      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
        <MaterialCommunityIcons name="food" size={24} color="#D0D5DD" />
      </View>
    )}

    <View style={styles.itemInfo}>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      {item.customisationText && (
        <Text style={styles.itemCustomization} numberOfLines={1}>
          {item.customisationText}
        </Text>
      )}
      {item.restaurantName ? (
        <Text style={styles.itemRestaurant} numberOfLines={1}>{item.restaurantName}</Text>
      ) : null}
      <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
    </View>

    <View style={styles.itemActions}>
      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.id)}>
        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#98A2B3" />
      </TouchableOpacity>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onDecrease(item.id)}>
          <MaterialCommunityIcons name="minus" size={14} color="#039855" />
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => onIncrease(item.id)}>
          <MaterialCommunityIcons name="plus" size={14} color="#039855" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Recommendation Mini Card ─────────────────────────────────────────────────
const RecoCard = ({ item, dispatch, cartItems, navigation }) => {
  const baseId = (item._id || item.id)?.toString();
  const itemQty = cartItems
    .filter((ci) => ci.id?.toString() === baseId || ci.id?.toString().startsWith(baseId))
    .reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <TouchableOpacity
      style={styles.recoCard}
      activeOpacity={0.88}
      onPress={() => navigation.navigate("FoodDetails", { foodId: item._id || item.id })}
    >
      {item.image ? (
        <Image source={{ uri: item.image || undefined }} style={styles.recoImage} />
      ) : (
        <View style={[styles.recoImage, styles.recoImagePlaceholder]}>
          <MaterialCommunityIcons name="food" size={22} color="#D0D5DD" />
        </View>
      )}
      <View style={styles.recoInfo}>
        <Text style={styles.recoName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.recoPrice}>₹{item.price}</Text>
      </View>
      {itemQty > 0 ? (
        <View style={styles.recoQtyRow}>
          <TouchableOpacity onPress={() => dispatch(decreaseQuantity(item._id || item.id))}>
            <MaterialCommunityIcons name="minus-circle" size={22} color="#039855" />
          </TouchableOpacity>
          <Text style={styles.recoQtyValue}>{itemQty}</Text>
          <TouchableOpacity onPress={() => dispatch(increaseQuantity(item._id || item.id))}>
            <MaterialCommunityIcons name="plus-circle" size={22} color="#039855" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.recoAddBtn}
          onPress={() =>
            dispatch(
              addToCart({
                id: item._id || item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                image: item.image,
                restaurantName: item.restaurant?.name || "",
              })
            )
          }
        >
          <Text style={styles.recoAddBtnText}>ADD</Text>
          <MaterialCommunityIcons name="plus" size={11} color="#039855" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── CartScreen ───────────────────────────────────────────────────────────────
const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isDark, theme } = useThemeContext();
  const items = useSelector((state) => state.cart.items) || [];
  const bill = useSelector(selectCartBillDetails);
  const { token } = useSelector((state) => state.auth);

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [recoFoods, setRecoFoods] = useState([]);

  // ─── Load recommendations ────────────────────────────────────────────────
  const loadRecommendations = useCallback(async () => {
    try {
      const { data } = await api.get("/foods", { params: { limit: 8, page: 1 } });
      // Exclude items already in cart
      const cartIds = new Set(items.map((i) => i.id?.toString()));
      const filtered = (data.foods || []).filter(
        (f) => !cartIds.has((f._id || f.id)?.toString())
      );
      setRecoFoods(filtered.slice(0, 6));
    } catch (_) {
      // Silently ignore
    }
  }, [items.length]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // ─── Coupon apply ────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data } = await api.post("/coupons/validate", {
        code,
        orderAmount: bill.subtotal,
      });
      if (data.valid) {
        dispatch(applyCoupon(data.coupon));
        setCouponInput("");
      } else {
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponError("");
  };

  // ─── Cart actions ────────────────────────────────────────────────────────
  const handleIncrease = (id) => dispatch(increaseQuantity(id));
  const handleDecrease = (id) => dispatch(decreaseQuantity(id));
  const handleRemove = (id) => {
    Alert.alert("Remove item", "Remove this item from cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => dispatch(removeFromCart(id)) },
    ]);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Please add some dishes to your cart first.");
      return;
    }
    if (!token) {
      navigation.navigate("Login", { redirectTo: "Checkout" });
    } else {
      navigation.navigate("Checkout");
    }
  };

  // ─── Empty State ─────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <MaterialCommunityIcons name="cart-off" size={80} color={theme.colors.placeholder} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your cart is empty</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.subtext }]}>
          Add delicious food items to start your order
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate("Main", { screen: "Home" })}
          activeOpacity={0.85}
        >
          <Text style={styles.exploreBtnText}>Explore Food</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Bill row helper ─────────────────────────────────────────────────────
  const BillRow = ({ label, value, isTotal, isDiscount }) => (
    <View style={[styles.billRow, isTotal && styles.billRowTotal]}>
      <Text style={[styles.billLabel, { color: theme.colors.subtext }, isTotal && [styles.billLabelTotal, { color: theme.colors.text }], isDiscount && styles.billLabelDiscount]}>
        {label}
      </Text>
      <Text style={[styles.billValue, { color: theme.colors.text }, isTotal && styles.billValueTotal, isDiscount && styles.billValueDiscount]}>
        {isDiscount ? `- ₹${value.toFixed(0)}` : `₹${value.toFixed(0)}`}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      <CustomScreenHeader
        title="Your Cart"
        navigation={navigation}
        showBack={true}
        redirectToHome={true}
        rightAction={
          <TouchableOpacity onPress={() => {
            Alert.alert("Clear Cart", "Remove all items?", [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Clear", 
                style: "destructive", 
                onPress: () => {
                  dispatch(clearCart());
                  navigation.navigate("Main", { screen: "Home" });
                } 
              },
            ]);
          }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Cart Items ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={16} color="#FF6F61" />
            <Text style={styles.sectionTitle}>Order Items ({bill.itemCount})</Text>
          </View>
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onRemove={handleRemove}
            />
          ))}
        </View>

        {/* ── Coupon ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={16} color="#FF6F61" />
            <Text style={styles.sectionTitle}>Promo Code</Text>
          </View>
          {bill.appliedCoupon ? (
            <View style={styles.couponApplied}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#039855" />
              <View style={styles.couponAppliedText}>
                <Text style={styles.couponCode}>{bill.appliedCoupon.code}</Text>
                <Text style={styles.couponSaved}>You save ₹{bill.discount.toFixed(0)}!</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#D92D20" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter promo code"
                  placeholderTextColor="#98A2B3"
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t); setCouponError(""); }}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleApplyCoupon}
                />
                <TouchableOpacity
                  style={[styles.couponApplyBtn, couponLoading && { opacity: 0.7 }]}
                  onPress={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.couponApplyText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponError ? <Text style={styles.couponError}>{couponError}</Text> : null}
              <Text style={styles.couponHint}>Try FIRST10, FLAT30 or SAVE50</Text>
            </>
          )}
        </View>

        {/* ── Delivery Info ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="motorbike" size={16} color="#FF6F61" />
            <Text style={styles.sectionTitle}>Delivery</Text>
          </View>
          <View style={styles.deliveryRow}>
            <MaterialCommunityIcons name="clock-fast" size={15} color="#667085" />
            <Text style={styles.deliveryText}>30-45 mins estimated delivery</Text>
          </View>
          <View style={styles.deliveryRow}>
            <MaterialCommunityIcons name="map-marker" size={15} color="#667085" />
            <Text style={styles.deliveryText}>Delivering to your saved address</Text>
          </View>
        </View>

        {/* ── Bill Summary ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="receipt" size={16} color="#FF6F61" />
            <Text style={styles.sectionTitle}>Bill Details</Text>
          </View>
          <BillRow label="Item Total" value={bill.subtotal} />
          {bill.discount > 0 && (
            <BillRow label={`Coupon (${bill.appliedCoupon?.code})`} value={bill.discount} isDiscount />
          )}
          <BillRow label="Delivery Fee" value={bill.deliveryFee} />
          <BillRow label="Platform Fee" value={bill.platformFee} />
          <BillRow label={`GST (${bill.gstPercentage || 5}%)`} value={bill.gst} />
          <View style={styles.divider} />
          <BillRow label="Grand Total" value={bill.grandTotal} isTotal />
          {bill.discount > 0 && (
            <View style={styles.savingsChip}>
              <MaterialCommunityIcons name="tag" size={13} color="#027A48" />
              <Text style={styles.savingsChipText}>
                You're saving ₹{bill.discount.toFixed(0)} on this order!
              </Text>
            </View>
          )}
        </View>

        {/* ── Recommendations ── */}
        {recoFoods.length > 0 && (
          <View style={styles.recoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="star-circle-outline" size={16} color="#FF6F61" />
              <Text style={styles.sectionTitle}>You might also like</Text>
            </View>
            <FlatList
              data={recoFoods}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => (item._id || item.id)?.toString()}
              contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}
              renderItem={({ item }) => (
                <RecoCard
                  item={item}
                  dispatch={dispatch}
                  cartItems={items}
                  navigation={navigation}
                />
              )}
            />
          </View>
        )}

        {/* ── Cancellation Policy ── */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>
            Orders can be cancelled for free before the restaurant accepts. After acceptance, a
            cancellation fee may apply. Review our full policy in the Help section.
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Checkout Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotal}>₹{bill.grandTotal.toFixed(0)}</Text>
          <Text style={styles.footerTotalLabel}>total incl. taxes</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.88}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { paddingTop: 8 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F2F4F7",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1D2939" },
  clearText: { fontSize: 13, color: "#D92D20", fontWeight: "700" },

  // Section
  section: {
    backgroundColor: "#FFFFFF", marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#F2F4F7",
    elevation: 1, shadowColor: "#101828", shadowOpacity: 0.03, shadowRadius: 4,
  },
  recoSection: {
    backgroundColor: "#FFFFFF", marginHorizontal: 12, marginBottom: 10,
    borderRadius: 16, paddingVertical: 16, paddingLeft: 16,
    borderWidth: 1, borderColor: "#F2F4F7",
    elevation: 1, shadowColor: "#101828", shadowOpacity: 0.03, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#1D2939" },

  // Cart item row
  itemRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F9FAFB",
  },
  itemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  itemImagePlaceholder: { backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: "700", color: "#1D2939" },
  itemCustomization: { fontSize: 11, color: "#667085", marginTop: 2 },
  itemRestaurant: { fontSize: 11, color: "#98A2B3", marginTop: 1 },
  itemPrice: { fontSize: 14, fontWeight: "800", color: "#039855", marginTop: 5 },
  itemActions: { alignItems: "flex-end", gap: 8 },
  removeBtn: { padding: 4 },
  qtyRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F0FDF4", borderRadius: 8, borderWidth: 1, borderColor: "#BBF7D0",
    paddingHorizontal: 8, paddingVertical: 4, gap: 10,
  },
  qtyBtn: { padding: 2 },
  qtyValue: { fontSize: 13, fontWeight: "800", color: "#1D2939", minWidth: 18, textAlign: "center" },

  // Coupon
  couponRow: { flexDirection: "row", gap: 10 },
  couponInput: {
    flex: 1, height: 44, backgroundColor: "#F9FAFB",
    borderRadius: 12, borderWidth: 1, borderColor: "#EAECF0",
    paddingHorizontal: 14, fontSize: 14, color: "#1D2939", fontWeight: "600",
  },
  couponApplyBtn: {
    height: 44, width: 80, backgroundColor: "#1D2939",
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  couponApplyText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  couponError: { color: "#D92D20", fontSize: 12, marginTop: 6 },
  couponHint: { color: "#98A2B3", fontSize: 11, marginTop: 6 },
  couponApplied: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#ECFDF3", padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "#A7F3D0",
  },
  couponAppliedText: { flex: 1 },
  couponCode: { fontSize: 13, fontWeight: "800", color: "#039855" },
  couponSaved: { fontSize: 12, color: "#027A48", marginTop: 2 },

  // Delivery
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  deliveryText: { fontSize: 13, color: "#475467" },

  // Bill
  billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  billRowTotal: { paddingTop: 14 },
  billLabel: { fontSize: 13, color: "#475467" },
  billLabelTotal: { fontSize: 15, fontWeight: "800", color: "#1D2939" },
  billLabelDiscount: { color: "#027A48" },
  billValue: { fontSize: 13, fontWeight: "600", color: "#1D2939" },
  billValueTotal: { fontSize: 16, fontWeight: "800" },
  billValueDiscount: { color: "#027A48" },
  divider: { height: 1, backgroundColor: "#F2F4F7", marginVertical: 6 },
  savingsChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ECFDF3", padding: 10, borderRadius: 10, marginTop: 10,
  },
  savingsChipText: { fontSize: 12, color: "#027A48", fontWeight: "700" },

  // Recommendations
  recoCard: {
    width: 130, backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1, borderColor: "#EAECF0", overflow: "hidden",
  },
  recoImage: { width: "100%", height: 90 },
  recoImagePlaceholder: { backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  recoInfo: { padding: 8 },
  recoName: { fontSize: 12, fontWeight: "700", color: "#1D2939", lineHeight: 16 },
  recoPrice: { fontSize: 12, fontWeight: "800", color: "#039855", marginTop: 3 },
  recoAddBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginHorizontal: 8, marginBottom: 8, gap: 3,
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#039855",
    borderRadius: 8, paddingVertical: 5,
  },
  recoAddBtnText: { fontSize: 11, fontWeight: "800", color: "#039855" },
  recoQtyRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginHorizontal: 8, marginBottom: 8,
  },
  recoQtyValue: { fontSize: 13, fontWeight: "800", color: "#039855" },

  // Policy
  policyTitle: { fontSize: 13, fontWeight: "700", color: "#344054", marginBottom: 8 },
  policyText: { fontSize: 12, color: "#667085", lineHeight: 18 },

  // Empty
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#FFFFFF" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1D2939", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#667085", textAlign: "center", marginTop: 8 },
  exploreBtn: {
    marginTop: 28, backgroundColor: "#FF6F61", paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, elevation: 4, shadowColor: "#FF6F61", shadowOpacity: 0.35, shadowRadius: 10,
  },
  exploreBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },

  // Footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#EAECF0",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    elevation: 10, shadowColor: "#101828", shadowOpacity: 0.1, shadowRadius: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
  },
  footerLeft: {},
  footerTotal: { fontSize: 20, fontWeight: "900", color: "#1D2939" },
  footerTotalLabel: { fontSize: 11, color: "#98A2B3", marginTop: 2 },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#039855", paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 14, elevation: 4, shadowColor: "#039855", shadowOpacity: 0.35, shadowRadius: 8,
  },
  checkoutBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});

export default CartScreen;
