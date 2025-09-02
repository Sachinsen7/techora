import theme from "./src/utils/theme";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        background: theme.colors.background,
        text: theme.colors.text,
        accent: theme.colors.accent,
      },
      fontFamily: {
        sans: ["Montserrat", ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        sm: theme.spacing.sm,
        md: theme.spacing.md,
        lg: theme.spacing.lg,
        xl: theme.spacing.xl,
      },
    },
  },
  plugins: [],
};
