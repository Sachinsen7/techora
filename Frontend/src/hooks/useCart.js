import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  selectCartSummary,
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
} from "../Redux/slices/cartSlice";
import { selectUser, selectIsAuthenticated } from "../Redux/slices/authSlice";
import { showModal } from "../Redux/slices/uiSlice";

export const useCart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const cartCount = useSelector(selectCartCount);
  const cartTotal = useSelector(selectCartTotal);
  const cartSummary = useSelector(selectCartSummary);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const addToCart = useCallback(
    (course) => {
      if (!isAuthenticated) {
        dispatch(
          showModal({
            title: "Login Required",
            message: "Please log in to add courses to your cart.",
            type: "info",
          })
        );
        return false;
      }

      const existingItem = cartItems.find((item) => item._id === course._id);
      if (existingItem) {
        dispatch(
          showModal({
            title: "Already in Cart",
            message: `"${course.title}" is already in your cart.`,
            type: "info",
          })
        );
        return false;
      }

      dispatch(addToCartAction({ course, userId: user?.userId }));

      dispatch(
        showModal({
          title: "Added to Cart",
          message: `"${course.title}" has been added to your cart.`,
          type: "success",
        })
      );

      return true;
    },
    [isAuthenticated, cartItems, dispatch, user?.userId]
  );

  const removeFromCart = useCallback(
    (courseId) => {
      const item = cartItems.find((item) => item._id === courseId);
      if (item) {
        dispatch(removeFromCartAction({ courseId, userId: user?.userId }));
        dispatch(
          showModal({
            title: "Removed from Cart",
            message: `"${item.title}" has been removed from your cart.`,
            type: "success",
          })
        );
        return true;
      }
      return false;
    },
    [cartItems, dispatch, user?.userId]
  );

  const clearCart = useCallback(() => {
    dispatch(clearCartAction({ userId: user?.userId }));
    dispatch(
      showModal({
        title: "Cart Cleared",
        message: "All items have been removed from your cart.",
        type: "success",
      })
    );
  }, [dispatch, user?.userId]);

  const isInCart = useCallback(
    (courseId) => {
      return cartItems.some((item) => item._id === courseId);
    },
    [cartItems]
  );

  const getCartSummary = useCallback(() => {
    return cartSummary;
  }, [cartSummary]);

  const proceedToCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      dispatch(
        showModal({
          title: "Empty Cart",
          message:
            "Your cart is empty. Add some courses before proceeding to checkout.",
          type: "info",
        })
      );
      return false;
    }
    return true;
  }, [cartItems.length, dispatch]);

  return {
    cartItems,
    cartCount,
    cartTotal,
    loading: false,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartSummary,
    proceedToCheckout,
  };
};

export default useCart;
