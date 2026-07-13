import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import ordersReducer from "./slices/ordersSlice";
import foodsReducer from "./slices/foodsSlice";
import notificationsReducer from "./slices/notificationsSlice";
import rewardReducer from "./slices/rewardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: ordersReducer,
    foods: foodsReducer,
    notifications: notificationsReducer,
    rewards: rewardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore large, deep mock data paths to avoid performance overhead in Dev mode
        ignoredPaths: [
          "foods.foods",
          "foods.categories",
          "foods.featured",
          "foods.popular",
          "foods.restaurants",
        ],
      },
    }),
});
