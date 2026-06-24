import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import favoriteService from "../../services/favoriteService";
import wishlistService from "../../services/wishlistService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Wishlist refers to saved foods, Favorites refers to saved restaurants

const initialState = {
  items: [], // Wishlist foods
  favorites: [], // Favorite restaurants
  loading: false,
  error: null,
};

// Async thunks
export const fetchFavorites = createAsyncThunk(
  "wishlist/fetchFavorites",
  async (_, thunkAPI) => {
    try {
      const res = await favoriteService.getFavorites();
      await AsyncStorage.setItem("foodexpress_favorites", JSON.stringify(res));
      return res;
    } catch (error) {
      const local = await AsyncStorage.getItem("foodexpress_favorites");
      return local ? JSON.parse(local) : [];
    }
  }
);

export const toggleFavoriteRestaurant = createAsyncThunk(
  "wishlist/toggleFavoriteRestaurant",
  async (restaurant, thunkAPI) => {
    try {
      const res = await favoriteService.toggleFavorite(restaurant.id || restaurant._id);
      await AsyncStorage.setItem("foodexpress_favorites", JSON.stringify(res.favorites));
      return res.favorites;
    } catch (error) {
      // Local fallback
      const local = await AsyncStorage.getItem("foodexpress_favorites");
      let current = local ? JSON.parse(local) : [];
      const rid = restaurant.id || restaurant._id;
      const exists = current.find((r) => (r.id || r._id) === rid);
      
      if (exists) {
        current = current.filter((r) => (r.id || r._id) !== rid);
      } else {
        current.push(restaurant);
      }
      await AsyncStorage.setItem("foodexpress_favorites", JSON.stringify(current));
      return current;
    }
  }
);

// Wishlist Foods Thunks
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, thunkAPI) => {
    try {
      const res = await wishlistService.getWishlist();
      const items = res.foodItems || [];
      await AsyncStorage.setItem("foodexpress_wishlist_foods", JSON.stringify(items));
      return items;
    } catch (error) {
      const local = await AsyncStorage.getItem("foodexpress_wishlist_foods");
      return local ? JSON.parse(local) : [];
    }
  }
);

export const addFoodToWishlist = createAsyncThunk(
  "wishlist/addFoodToWishlist",
  async (food, thunkAPI) => {
    try {
      const res = await wishlistService.addToWishlist(food.id || food._id);
      const items = res.foodItems || [];
      await AsyncStorage.setItem("foodexpress_wishlist_foods", JSON.stringify(items));
      return items;
    } catch (error) {
      const local = await AsyncStorage.getItem("foodexpress_wishlist_foods");
      let current = local ? JSON.parse(local) : [];
      const fid = food.id || food._id;
      if (!current.find((f) => (f.id || f._id) === fid)) {
        current.push(food);
      }
      await AsyncStorage.setItem("foodexpress_wishlist_foods", JSON.stringify(current));
      return current;
    }
  }
);

export const removeFoodFromWishlist = createAsyncThunk(
  "wishlist/removeFoodFromWishlist",
  async (foodId, thunkAPI) => {
    try {
      const res = await wishlistService.removeFromWishlist(foodId);
      const items = res.foodItems || [];
      await AsyncStorage.setItem("foodexpress_wishlist_foods", JSON.stringify(items));
      return items;
    } catch (error) {
      const local = await AsyncStorage.getItem("foodexpress_wishlist_foods");
      let current = local ? JSON.parse(local) : [];
      current = current.filter((f) => (f.id || f._id) !== foodId);
      await AsyncStorage.setItem("foodexpress_wishlist_foods", JSON.stringify(current));
      return current;
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    loadWishlistFromStorage: (state, action) => {
      if (action.payload) {
        state.items = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload || [];
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to fetch favorites";
      })
      .addCase(toggleFavoriteRestaurant.fulfilled, (state, action) => {
        state.favorites = action.payload || [];
      })
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to fetch wishlist";
      })
      .addCase(addFoodToWishlist.fulfilled, (state, action) => {
        state.items = action.payload || [];
      })
      .addCase(removeFoodFromWishlist.fulfilled, (state, action) => {
        state.items = action.payload || [];
      });
  },
});

export const { loadWishlistFromStorage } = wishlistSlice.actions;
export default wishlistSlice.reducer;
