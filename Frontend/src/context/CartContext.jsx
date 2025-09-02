import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user, showModal } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const savedCart = localStorage.getItem(`cart_${user.userId}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
          setCartItems([]);
        }
      }
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(`cart_${user.userId}`, JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated, user]);

  const addToCart = useCallback(
    (course) => {
      if (!isAuthenticated) {
        showModal({
          isOpen: true,
          title: "Login Required",
          message: "Please log in to add courses to your cart.",
          type: "info",
        });
        return false;
      }

      const existingItem = cartItems.find((item) => item._id === course._id);
      if (existingItem) {
        showModal({
          isOpen: true,
          title: "Already in Cart",
          message: `"${course.title}" is already in your cart.`,
          type: "info",
        });
        return false;
      }

      const cartItem = {
        _id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        imageUrl: course.imageUrl,
        category: course.category,
        level: course.level,
        duration: course.duration,
        creatorId: course.creatorId,
        addedAt: new Date().toISOString(),
      };

      setCartItems((prev) => [...prev, cartItem]);

      showModal({
        isOpen: true,
        title: "Added to Cart",
        message: `"${course.title}" has been added to your cart.`,
        type: "success",
      });

      return true;
    },
    [isAuthenticated, cartItems, showModal]
  );

  const removeFromCart = useCallback(
    (courseId) => {
      const item = cartItems.find((item) => item._id === courseId);
      if (item) {
        setCartItems((prev) => prev.filter((item) => item._id !== courseId));
        showModal({
          isOpen: true,
          title: "Removed from Cart",
          message: `"${item.title}" has been removed from your cart.`,
          type: "success",
        });
        return true;
      }
      return false;
    },
    [cartItems, showModal]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    showModal({
      isOpen: true,
      title: "Cart Cleared",
      message: "All items have been removed from your cart.",
      type: "success",
    });
  }, [showModal]);

  const isInCart = useCallback(
    (courseId) => {
      return cartItems.some((item) => item._id === courseId);
    },
    [cartItems]
  );

  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.price || 0),
    0
  );
  const cartCount = cartItems.length;

  const getCartSummary = useCallback(() => {
    const subtotal = cartTotal;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      itemCount: cartCount,
      items: cartItems,
    };
  }, [cartTotal, cartCount, cartItems]);

  const proceedToCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      showModal({
        isOpen: true,
        title: "Empty Cart",
        message:
          "Your cart is empty. Add some courses before proceeding to checkout.",
        type: "info",
      });
      return false;
    }
    return true;
  }, [cartItems.length, showModal]);

  const contextValue = {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    getCartSummary,
    proceedToCheckout,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CartContext;
