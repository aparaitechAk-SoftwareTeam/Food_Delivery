import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService from "../../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await authService.login(credentials);
      await AsyncStorage.setItem("foodexpress_token", response.token);
      await AsyncStorage.setItem(
        "foodexpress_user",
        JSON.stringify(response.user),
      );
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Login failed");
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, thunkAPI) => {
    try {
      const response = await authService.register(payload);
      await AsyncStorage.setItem("foodexpress_token", response.token);
      await AsyncStorage.setItem(
        "foodexpress_user",
        JSON.stringify(response.user),
      );
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Register failed");
    }
  },
);

export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUserFromStorage",
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("foodexpress_token");
      const user = await AsyncStorage.getItem("foodexpress_user");
      return { token, user: user ? JSON.parse(user) : null };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Could not load user");
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.removeItem("foodexpress_token");
  await AsyncStorage.removeItem("foodexpress_user");
  return null;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export default authSlice.reducer;
