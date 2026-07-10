import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import orderService from "../../services/orderService";
import { logout } from "./authSlice";

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
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch orders");
    }
  },
);

export const placeOrder = createAsyncThunk(
  "orders/placeOrder",
  async (payload, thunkAPI) => {
    try {
      return await orderService.placeOrder(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to place order");
    }
  },
);

export const cancelOrderThunk = createAsyncThunk(
  "orders/cancelOrder",
  async ({ id, reason }, thunkAPI) => {
    try {
      return await orderService.cancelOrder(id, reason);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to cancel order");
    }
  }
);

export const reorderThunk = createAsyncThunk(
  "orders/reorder",
  async (id, thunkAPI) => {
    try {
      return await orderService.reorder(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to reorder");
    }
  }
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
      })
      .addCase(cancelOrderThunk.fulfilled, (state, action) => {
        const cancelledOrder = action.payload;
        // Remove from currentOrders
        state.currentOrders = state.currentOrders.filter(
          o => (o.id || o._id) !== (cancelledOrder.id || cancelledOrder._id)
        );
        // Add/update in history
        const existingIdx = state.history.findIndex(
          o => (o.id || o._id) === (cancelledOrder.id || cancelledOrder._id)
        );
        if (existingIdx !== -1) {
          state.history[existingIdx] = cancelledOrder;
        } else {
          state.history.unshift(cancelledOrder);
        }
      })
      .addCase(reorderThunk.fulfilled, (state, action) => {
        state.currentOrders.unshift(action.payload);
      })
      .addCase(logout.fulfilled, (state) => {
        state.currentOrders = [];
        state.history = [];
      });
  },
});

export default ordersSlice.reducer;
