import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderService from "../../services/orderService";
import mockData from "../../mockData/data";

const initialState = {
  currentOrders: [],
  history: [],
  loading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, thunkAPI) => {
    try {
      return await orderService.getOrders();
    } catch (error) {
      return { current: mockData.orders, history: [] };
    }
  },
);

export const placeOrder = createAsyncThunk(
  "orders/placeOrder",
  async (payload, thunkAPI) => {
    try {
      return await orderService.placeOrder(payload);
    } catch (error) {
      const newOrder = {
        id: Date.now(),
        orderNumber: `FE${Math.floor(1000 + Math.random() * 9000)}`,
        status: "Confirmed",
        totalAmount: payload.totalAmount,
        items: payload.items,
      };
      return newOrder;
    }
  },
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrders = action.payload.current || [];
        state.history = action.payload.history || [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ordersSlice.reducer;
