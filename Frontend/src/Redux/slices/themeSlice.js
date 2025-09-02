import { createSlice } from "@reduxjs/toolkit";

const lightTheme = {
  colors: {
    primary: {
      main: "#1B3C53", // Deep Navy
      light: "#456882",
      dark: "#132D40",
    },
    secondary: {
      main: "#FFFFFF", // Crisp White
      light: "#F5F7FA",
      dark: "#E5E7EB",
    },
    background: {
      main: "#FFFFFF",
      card: "#F9FAFB",
      body: "#FFFFFF",
    },
    text: {
      primary: "#1B3C53",
      secondary: "#6B7280",
    },
    accent: {
      success: "#4A8292", // Coastal Teal
      error: "#DC2626",
      warning: "#D97706",
    },
  },
  fonts: {
    primary: ["Montserrat", "sans-serif"],
  },
  spacing: {
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
};

const darkTheme = {
  colors: {
    primary: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#1E40AF",
    },
    secondary: {
      main: "#1F2937", // Dark Gray
      light: "#374151",
      dark: "#111827",
    },
    background: {
      main: "#111827", // Very Dark Gray
      card: "#1F2937", // Dark Gray
      body: "#0F172A", // Darker background
    },
    text: {
      primary: "#F9FAFB", // Light text
      secondary: "#D1D5DB", // Lighter gray text
    },
    accent: {
      success: "#10B981", // Green
      error: "#EF4444", // Red
      warning: "#F59E0B", // Amber
    },
  },
  fonts: {
    primary: ["Montserrat", "sans-serif"],
  },
  spacing: {
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
};

const initialState = {
  mode: "light",
  currentTheme: lightTheme,
  isLoading: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      state.currentTheme = state.mode === "light" ? lightTheme : darkTheme;

      const root = document.documentElement;
      const theme = state.currentTheme;

      root.style.setProperty("--color-primary", theme.colors.primary.main);
      root.style.setProperty(
        "--color-primary-light",
        theme.colors.primary.light
      );
      root.style.setProperty("--color-primary-dark", theme.colors.primary.dark);
      root.style.setProperty("--color-secondary", theme.colors.secondary.main);
      root.style.setProperty(
        "--color-background",
        theme.colors.background.main
      );
      root.style.setProperty(
        "--color-background-card",
        theme.colors.background.card
      );
      root.style.setProperty(
        "--color-background-body",
        theme.colors.background.body
      );
      root.style.setProperty("--color-text-primary", theme.colors.text.primary);
      root.style.setProperty(
        "--color-text-secondary",
        theme.colors.text.secondary
      );
      root.style.setProperty("--color-success", theme.colors.accent.success);
      root.style.setProperty("--color-error", theme.colors.accent.error);
      root.style.setProperty("--color-warning", theme.colors.accent.warning);

      if (state.mode === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    },
    setTheme: (state, action) => {
      const { mode } = action.payload;
      state.mode = mode;
      state.currentTheme = mode === "light" ? lightTheme : darkTheme;

      const root = document.documentElement;
      const theme = state.currentTheme;

      root.style.setProperty("--color-primary", theme.colors.primary.main);
      root.style.setProperty(
        "--color-primary-light",
        theme.colors.primary.light
      );
      root.style.setProperty("--color-primary-dark", theme.colors.primary.dark);
      root.style.setProperty("--color-secondary", theme.colors.secondary.main);
      root.style.setProperty(
        "--color-background",
        theme.colors.background.main
      );
      root.style.setProperty(
        "--color-background-card",
        theme.colors.background.card
      );
      root.style.setProperty(
        "--color-background-body",
        theme.colors.background.body
      );
      root.style.setProperty("--color-text-primary", theme.colors.text.primary);
      root.style.setProperty(
        "--color-text-secondary",
        theme.colors.text.secondary
      );
      root.style.setProperty("--color-success", theme.colors.accent.success);
      root.style.setProperty("--color-error", theme.colors.accent.error);
      root.style.setProperty("--color-warning", theme.colors.accent.warning);

      if (mode === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    },
    setThemeLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, setThemeLoading } = themeSlice.actions;

export const selectTheme = (state) => state.theme;
export const selectThemeMode = (state) => state.theme.mode;
export const selectCurrentTheme = (state) => state.theme.currentTheme;
export const selectThemeLoading = (state) => state.theme.isLoading;

export default themeSlice.reducer;
