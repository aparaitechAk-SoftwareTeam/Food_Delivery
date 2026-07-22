import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

const initialState = {
  reward: null,
  progress: 0,
  remainingTime: 0,
  status: "Pending",
  loading: false,
  error: null,
};

export const fetchRewardStatus = createAsyncThunk(
  "rewards/fetchRewardStatus",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/rewards");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch reward status");
    }
  }
);

export const claimReward = createAsyncThunk(
  "rewards/claimReward",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.post("/rewards/claim");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to claim reward");
    }
  }
);

const rewardSlice = createSlice({
  name: "rewards",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Reward
      .addCase(fetchRewardStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRewardStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.reward = action.payload.reward;
        state.progress = action.payload.progress;
        state.remainingTime = action.payload.remainingTime;
        state.status = action.payload.status;
      })
      .addCase(fetchRewardStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Claim Reward
      .addCase(claimReward.pending, (state) => {
        state.loading = true;
      })
      .addCase(claimReward.fulfilled, (state, action) => {
        state.loading = false;
        if (state.reward) {
          state.reward.status = "Claimed";
        }
        state.status = "Claimed";
      })
      .addCase(claimReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default rewardSlice.reducer;
