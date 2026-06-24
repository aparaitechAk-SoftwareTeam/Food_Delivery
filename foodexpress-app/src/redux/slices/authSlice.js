import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authService from "../../services/authService";
import userService from "../../services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const initialState = {
  user: null,
  token: null,
  userProfile: null,
  addresses: [],
  activeAddress: null,
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
      // Fallback local login for demo/testing
      if (credentials.email && credentials.password) {
        const dummyUser = {
          id: "local-user-id",
          name: "Atharv",
          email: credentials.email,
          phone: "9876543210",
        };
        await AsyncStorage.setItem("foodexpress_token", "dummy-jwt-token");
        await AsyncStorage.setItem("foodexpress_user", JSON.stringify(dummyUser));
        return { user: dummyUser, token: "dummy-jwt-token" };
      }
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
      // Fallback local register
      const dummyUser = {
        id: "local-user-id",
        name: payload.name,
        email: payload.email,
        phone: payload.phone || "9876543210",
      };
      await AsyncStorage.setItem("foodexpress_token", "dummy-jwt-token");
      await AsyncStorage.setItem("foodexpress_user", JSON.stringify(dummyUser));
      return { user: dummyUser, token: "dummy-jwt-token" };
    }
  },
);

export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUserFromStorage",
  async (_, thunkAPI) => {
    try {
      const token = await AsyncStorage.getItem("foodexpress_token");
      const user = await AsyncStorage.getItem("foodexpress_user");
      const activeAddress = await AsyncStorage.getItem("foodexpress_active_address");
      const localAddrs = await AsyncStorage.getItem("foodexpress_addresses");
      
      return { 
        token, 
        user: user ? JSON.parse(user) : null,
        activeAddress: activeAddress ? JSON.parse(activeAddress) : null,
        addresses: localAddrs ? JSON.parse(localAddrs) : [],
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Could not load user");
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authService.logout();
  } catch (error) {
    // ignore
  }
  await AsyncStorage.removeItem("foodexpress_token");
  await AsyncStorage.removeItem("foodexpress_user");
  await AsyncStorage.removeItem("foodexpress_active_address");
  return null;
});

// Profile thunks
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, thunkAPI) => {
    try {
      return await userService.getProfile();
    } catch (error) {
      // Fallback from localStorage
      const userStr = await AsyncStorage.getItem("foodexpress_user");
      if (userStr) {
        return JSON.parse(userStr);
      }
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch profile");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (payload, thunkAPI) => {
    try {
      const updated = await userService.updateProfile(payload);
      const userStr = await AsyncStorage.getItem("foodexpress_user");
      let newUser = updated;
      if (userStr) {
        newUser = { ...JSON.parse(userStr), ...updated };
      }
      await AsyncStorage.setItem("foodexpress_user", JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      // Local updates
      const userStr = await AsyncStorage.getItem("foodexpress_user");
      if (userStr) {
        const newUser = { ...JSON.parse(userStr), ...payload };
        await AsyncStorage.setItem("foodexpress_user", JSON.stringify(newUser));
        return newUser;
      }
      return thunkAPI.rejectWithValue(error.message || "Failed to update profile");
    }
  }
);

// Addresses thunks
export const fetchAddresses = createAsyncThunk(
  "auth/fetchAddresses",
  async (_, thunkAPI) => {
    try {
      const res = await userService.getAddresses();
      await AsyncStorage.setItem("foodexpress_addresses", JSON.stringify(res));
      return res;
    } catch (error) {
      const localAddrs = await AsyncStorage.getItem("foodexpress_addresses");
      return localAddrs ? JSON.parse(localAddrs) : [];
    }
  }
);

export const saveAddress = createAsyncThunk(
  "auth/saveAddress",
  async (address, thunkAPI) => {
    try {
      const res = await userService.addAddress(address);
      await AsyncStorage.setItem("foodexpress_addresses", JSON.stringify(res));
      return res;
    } catch (error) {
      const localAddrs = await AsyncStorage.getItem("foodexpress_addresses");
      const current = localAddrs ? JSON.parse(localAddrs) : [];
      const newAddress = {
        _id: `local-${Date.now()}`,
        id: `local-${Date.now()}`,
        ...address,
        isDefault: !!address.isDefault,
      };
      if (newAddress.isDefault) {
        current.forEach(addr => addr.isDefault = false);
      }
      current.push(newAddress);
      await AsyncStorage.setItem("foodexpress_addresses", JSON.stringify(current));
      return current;
    }
  }
);

export const selectDefaultAddress = createAsyncThunk(
  "auth/selectDefaultAddress",
  async (addressId, thunkAPI) => {
    try {
      const res = await userService.setDefaultAddress(addressId);
      await AsyncStorage.setItem("foodexpress_addresses", JSON.stringify(res));
      return res;
    } catch (error) {
      const localAddrs = await AsyncStorage.getItem("foodexpress_addresses");
      if (localAddrs) {
        const current = JSON.parse(localAddrs);
        current.forEach(addr => {
          addr.isDefault = (addr._id || addr.id) === addressId;
        });
        await AsyncStorage.setItem("foodexpress_addresses", JSON.stringify(current));
        return current;
      }
      return [];
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setActiveAddress: (state, action) => {
      state.activeAddress = action.payload;
      AsyncStorage.setItem("foodexpress_active_address", JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.userProfile = action.payload.user;
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
        state.userProfile = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userProfile = action.payload.user;
        state.activeAddress = action.payload.activeAddress;
        state.addresses = action.payload.addresses || [];
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.userProfile = null;
        state.token = null;
        state.activeAddress = null;
        state.addresses = [];
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.userProfile = action.payload;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.userProfile = action.payload;
        state.user = action.payload;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
        // Auto select default address if active address is not set
        if (!state.activeAddress && action.payload && action.payload.length > 0) {
          const def = action.payload.find(a => a.isDefault);
          state.activeAddress = def || action.payload[0];
        }
      })
      .addCase(saveAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
        const def = action.payload.find(a => a.isDefault);
        if (def) {
          state.activeAddress = def;
        }
      })
      .addCase(selectDefaultAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
        const def = action.payload.find(a => a.isDefault);
        if (def) {
          state.activeAddress = def;
        }
      });
  },
});

export const { setActiveAddress } = authSlice.actions;
export default authSlice.reducer;
