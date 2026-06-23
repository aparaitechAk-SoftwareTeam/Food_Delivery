import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import foodService from "../../services/foodService";
import mockData from "../../mockData/data";

const initialState = {
  foods: [],
  categories: [],
  featured: [],
  popular: [],
  restaurants: [],
  offers: [],
  loading: false,
  error: null,
};

export const fetchFoods = createAsyncThunk(
  "foods/fetchFoods",
  async (_, thunkAPI) => {
    try {
      return await foodService.getFoods();
    } catch (error) {
      return mockData;
    }
  },
);

const foodsSlice = createSlice({
  name: "foods",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFoods.fulfilled, (state, action) => {
        state.loading = false;
        state.foods = action.payload.foods || [];
        state.categories = action.payload.categories || [];
        state.featured = action.payload.featured || [];
        state.popular = action.payload.popular || [];
        state.restaurants = action.payload.restaurants || [];
        state.offers = action.payload.offers || [];
      })
      .addCase(fetchFoods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default foodsSlice.reducer;
