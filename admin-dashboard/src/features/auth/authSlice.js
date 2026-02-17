import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authAPI } from "./authAPI";
import { tokenService } from "../../services/tokenService";

/* =========================
   Async Thunk - Admin Login
========================= */

export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.adminLogin(
        credentials
      );

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      // Save token
      tokenService.setToken(response.data.token);
      tokenService.setUser(response.data.user);

      return response.data; // { user, token }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Login failed"
      );
    }
  }
);

/* =========================
   Initial State
========================= */

const initialState = {
  user: tokenService.getUser(),
  token: tokenService.getToken(),
  loading: false,
  error: null,
};

/* =========================
   Slice
========================= */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      tokenService.clearAll();
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    hydrateFromStorage: (state) => {
      state.token = tokenService.getToken();
      state.user = tokenService.getUser();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });
  },
});

export const { logout, setUser, clearAuthError, hydrateFromStorage } =
  authSlice.actions;

export default authSlice.reducer;
