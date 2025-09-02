import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  login as authServiceLogin,
  signup as authServiceSignup,
} from "../../services/auth";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authServiceLogin(
        credentials.email,
        credentials.password
      );
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      return {
        token: data.token,
        user: {
          userId: data.userId,
          role: data.role,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: credentials.email,
          profilePicture: data.profilePicture || null,
          bio: data.bio || "",
        },
      };
    } catch (error) {
      const errorMessage = error.response?.data?.details
        ? error.response.data.details.map((err) => err.message).join("; ")
        : error.message;
      return rejectWithValue(errorMessage);
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authServiceSignup(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role
      );
      return {
        token: data.token,
        user: {
          userId: data.userId,
          role: data.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          profilePicture: data.profilePicture || null,
          bio: data.bio || "",
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(
        "https://techora-1.onrender.com/api/user/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.user;
      } else {
        throw new Error("Failed to fetch user profile");
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(base64));
    return decodedPayload;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

const initialState = {
  token: localStorage.getItem("token") || null,
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  modal: {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initializeAuth: (state) => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const decodedUser = decodeToken(storedToken);
        if (decodedUser && decodedUser.id && decodedUser.role) {
          state.token = storedToken;
          state.user = {
            userId: decodedUser.id,
            role: decodedUser.role,
            firstName: decodedUser.firstName || "User",
            lastName: decodedUser.lastName || "",
            email: decodedUser.email || "",
            profilePicture: decodedUser.profilePicture || null,
            bio: decodedUser.bio || "",
          };
          state.isAuthenticated = true;
        } else {
          localStorage.removeItem("token");
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
        }
      }
      state.loading = false;
    },
    logout: (state) => {
      localStorage.removeItem("token");
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.modal = {
        isOpen: true,
        title: "Logged Out",
        message: "You have been successfully logged out.",
        type: "info",
      };
    },
    oauthLogin: (state, action) => {
      const { userData, authToken } = action.payload;
      localStorage.setItem("token", authToken);
      state.token = authToken;
      state.user = userData;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.modal = {
        isOpen: true,
        title: "Welcome!",
        message: "Successfully signed in with Google!",
        type: "success",
      };
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    showModal: (state, action) => {
      state.modal = {
        isOpen: true,
        title: "",
        message: "",
        type: "info",
        ...action.payload,
      };
    },
    hideModal: (state) => {
      state.modal.isOpen = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        state.modal = {
          isOpen: true,
          title: "Login Successful!",
          message: `Welcome back${
            action.payload.user.firstName
              ? `, ${action.payload.user.firstName}`
              : ""
          }!`,
          type: "success",
        };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.modal = {
          isOpen: true,
          title: "Login Failed",
          message: action.payload || "Login failed. Please try again.",
          type: "error",
        };
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        state.modal = {
          isOpen: true,
          title: "Signup Successful!",
          message: "Your account has been created. Welcome!",
          type: "success",
        };
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.modal = {
          isOpen: true,
          title: "Signup Failed",
          message: action.payload,
          type: "error",
        };
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const {
  initializeAuth,
  logout,
  oauthLogin,
  updateUser,
  showModal,
  hideModal,
  clearError,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthModal = (state) => state.auth.modal;

export default authSlice.reducer;
