import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";
import cartReducer from "./slices/cartSlice";
import uiReducer from "./slices/uiSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  cart: cartReducer,
  ui: uiReducer,
});

const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  const state = store.getState();

  if (state.theme) {
    localStorage.setItem("theme", JSON.stringify(state.theme));
  }

  if (state.auth?.token) {
    localStorage.setItem("token", state.auth.token);
  } else if (action.type === "auth/logout") {
    localStorage.removeItem("token");
  }

  return result;
};

const loadPersistedState = () => {
  try {
    const persistedTheme = localStorage.getItem("theme");
    const persistedToken = localStorage.getItem("token");

    const preloadedState = {};

    if (persistedTheme) {
      try {
        preloadedState.theme = JSON.parse(persistedTheme);
      } catch (error) {
        if (persistedTheme === "dark" || persistedTheme === "light") {
          preloadedState.theme = { mode: persistedTheme };
        }
      }
    }

    if (persistedToken) {
      preloadedState.auth = {
        token: persistedToken,
        isAuthenticated: false,
        loading: true,
        user: null,
        error: null,
        modal: { isOpen: false, title: "", message: "", type: "info" },
      };
    }

    return preloadedState;
  } catch (error) {
    console.error("Error loading persisted state:", error);
    return {};
  }
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPersistedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(localStorageMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

export const RootState = store.getState;
export const AppDispatch = store.dispatch;
