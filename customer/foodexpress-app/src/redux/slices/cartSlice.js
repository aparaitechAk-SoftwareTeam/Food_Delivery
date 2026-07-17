import { createSlice, createSelector } from "@reduxjs/toolkit";

// ─── Constants ────────────────────────────────────────────────────────────────
const DELIVERY_FEE = 39;
const PLATFORM_FEE = 3;
const GST_RATE = 0.05; // 5% GST on food subtotal

// ─── Helpers ─────────────────────────────────────────────────────────────────
const computeTotals = (items) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  return { totalQuantity, totalAmount: Math.round(totalAmount * 100) / 100 };
};

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  appliedCoupon: null, // { code, discountType: "percentage"|"fixed", value, maxDiscount? }
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Add item or increment quantity if same id exists
    addToCart: (state, action) => {
      const payload = action.payload;
      const existing = state.items.find((item) => item.id === payload.id);
      if (existing) {
        existing.quantity += payload.quantity || 1;
      } else {
        state.items.push({ ...payload, quantity: payload.quantity || 1 });
      }
      const totals = computeTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },

    // Remove a specific item by id
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      const totals = computeTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },

    // Set absolute quantity for an item
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      const totals = computeTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },

    // Increment quantity for any cart items whose id starts with baseId
    increaseQuantity: (state, action) => {
      const baseId = action.payload?.toString();
      const matches = state.items.filter(
        (i) => i.id?.toString() === baseId || i.id?.toString().startsWith(baseId)
      );
      if (matches.length > 0) {
        // Increase the first matching item
        matches[0].quantity += 1;
      }
      const totals = computeTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },

    // Decrement quantity; remove item if quantity reaches 0
    decreaseQuantity: (state, action) => {
      const baseId = action.payload?.toString();
      // Find all matches, operate on the last one added (last in list)
      const matchIndices = state.items
        .map((item, idx) => ({ item, idx }))
        .filter(
          ({ item }) =>
            item.id?.toString() === baseId ||
            item.id?.toString().startsWith(baseId)
        );

      if (matchIndices.length > 0) {
        const { item, idx } = matchIndices[matchIndices.length - 1];
        if (item.quantity > 1) {
          state.items[idx].quantity -= 1;
        } else {
          state.items.splice(idx, 1);
        }
      }
      const totals = computeTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },

    // Apply a coupon object { code, discountType, value, maxDiscount }
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },

    // Remove currently applied coupon
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },

    // Clear everything
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      state.appliedCoupon = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  increaseQuantity,
  decreaseQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────

/**
 * Returns aggregate quantity of items with given baseId prefix.
 * Useful when same food has multiple customizations in cart.
 */
export const getItemQuantity = (state, baseId) => {
  if (!baseId) return 0;
  const idStr = baseId.toString();
  return (state.cart.items || [])
    .filter((item) => item.id?.toString() === idStr || item.id?.toString().startsWith(idStr))
    .reduce((sum, item) => sum + item.quantity, 0);
};

const selectCartItems = (state) => state.cart.items || [];
const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
const selectActiveRestaurant = (state) => {
  const rests = state.foods?.restaurants || [];
  return rests[0] || null;
};

/**
 * Single source of truth for bill calculations.
 * Returns: subtotal, discount, deliveryFee, platformFee, gst, grandTotal, appliedCoupon
 * Memoized using createSelector to prevent returning a new reference on every state change.
 */
export const selectCartBillDetails = createSelector(
  [selectCartItems, selectAppliedCoupon, selectActiveRestaurant],
  (items, appliedCoupon, restaurant) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;

    // Coupon discount
    let discount = 0;
    if (appliedCoupon && roundedSubtotal > 0) {
      if (appliedCoupon.discountType === "percentage") {
        const raw = (roundedSubtotal * appliedCoupon.value) / 100;
        discount = appliedCoupon.maxDiscount
          ? Math.min(raw, appliedCoupon.maxDiscount)
          : raw;
      } else if (appliedCoupon.discountType === "fixed") {
        discount = Math.min(appliedCoupon.value, roundedSubtotal);
      }
      discount = Math.round(discount * 100) / 100;
    }

    const discountedSubtotal = Math.max(0, roundedSubtotal - discount);
    const gstRate = restaurant && restaurant.gst !== undefined ? (restaurant.gst / 100) : GST_RATE;
    const gst = Math.round(discountedSubtotal * gstRate * 100) / 100;
    const baseDeliveryFee = restaurant && restaurant.deliveryCharges !== undefined ? restaurant.deliveryCharges : DELIVERY_FEE;
    const deliveryFee = items.length > 0 ? baseDeliveryFee : 0;
    const platformFee = items.length > 0 ? PLATFORM_FEE : 0;
    const grandTotal = Math.round((discountedSubtotal + gst + deliveryFee + platformFee) * 100) / 100;

    return {
      subtotal: roundedSubtotal,
      discount,
      discountedSubtotal,
      gst,
      deliveryFee,
      platformFee,
      grandTotal,
      appliedCoupon,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }
);

export default cartSlice.reducer;
