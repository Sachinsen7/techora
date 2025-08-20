import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeAuth, fetchUserProfile } from "./slices/authSlice";
import { setTheme } from "./slices/themeSlice";
import { initializeCart } from "./slices/cartSlice";
import { selectToken, selectUser } from "./slices/authSlice";
import { selectThemeMode } from "./slices/themeSlice";

const ReduxInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const themeMode = useSelector(selectThemeMode);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (token && (!user || !user.firstName)) {
      dispatch(fetchUserProfile(token));
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    if (user?.userId) {
      dispatch(initializeCart({ userId: user.userId }));
    }
  }, [dispatch, user?.userId]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      try {
        const themeData = JSON.parse(savedTheme);
        dispatch(setTheme({ mode: themeData.mode || "light" }));
      } catch (error) {
        console.error("Error parsing saved theme:", error);
        dispatch(setTheme({ mode: "light" }));
      }
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      dispatch(setTheme({ mode: prefersDark ? "dark" : "light" }));
    }
  }, [dispatch]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        dispatch(setTheme({ mode: e.matches ? "dark" : "light" }));
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [dispatch]);

  return children;
};

export default ReduxInitializer;
