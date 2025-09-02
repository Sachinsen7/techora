import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { useCart } from "../../hooks/useCart";

function AddToCartButton({
  course,
  className,
  size = "md",
  variant = "default",
  showText = true,
  disabled = false,
}) {
  const { addToCart, isInCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || disabled) return;

    setIsAdding(true);
    await addToCart(course);
    setIsAdding(false);
  };

  const isAlreadyInCart = isInCart(course._id);

  const sizeConfig = {
    sm: {
      button: "px-3 py-1.5 text-sm",
      icon: "w-4 h-4",
    },
    md: {
      button: "px-4 py-2 text-sm",
      icon: "w-5 h-5",
    },
    lg: {
      button: "px-6 py-3 text-base",
      icon: "w-6 h-6",
    },
  };

  const variantConfig = {
    default: {
      base: "bg-primary-main text-white hover:bg-primary-light border border-primary-main",
      disabled: "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed",
      inCart: "bg-green-500 text-white border-green-500",
    },
    outline: {
      base: "bg-transparent text-primary-main border border-primary-main hover:bg-primary-main hover:text-white",
      disabled:
        "bg-transparent text-gray-400 border-gray-300 cursor-not-allowed",
      inCart: "bg-transparent text-green-500 border-green-500",
    },
    minimal: {
      base: "bg-transparent text-primary-main hover:bg-primary-main/10 border-none",
      disabled: "bg-transparent text-gray-400 cursor-not-allowed",
      inCart: "bg-transparent text-green-500",
    },
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  const getButtonStyle = () => {
    if (disabled || isAdding) return variantStyles.disabled;
    if (isAlreadyInCart) return variantStyles.inCart;
    return variantStyles.base;
  };

  const baseClasses = twMerge(
    "rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2 flex items-center justify-center gap-2",
    config.button,
    getButtonStyle(),
    className
  );

  const CartIcon = () => (
    <svg
      className={config.icon}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"
      />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      className={config.icon}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

  const LoadingIcon = () => (
    <div
      className={twMerge(
        config.icon,
        "border-2 border-current border-t-transparent rounded-full animate-spin"
      )}
    />
  );

  const getButtonContent = () => {
    if (isAdding) {
      return (
        <>
          <LoadingIcon />
          {showText && <span>Adding...</span>}
        </>
      );
    }

    if (isAlreadyInCart) {
      return (
        <>
          <CheckIcon />
          {showText && <span>In Cart</span>}
        </>
      );
    }

    return (
      <>
        <CartIcon />
        {showText && <span>Add to Cart</span>}
      </>
    );
  };

  return (
    <motion.button
      className={baseClasses}
      onClick={handleAddToCart}
      disabled={disabled || isAdding || isAlreadyInCart}
      whileHover={{ scale: disabled || isAdding || isAlreadyInCart ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isAdding || isAlreadyInCart ? 1 : 0.95 }}
      transition={{ duration: 0.2 }}
      title={
        isAlreadyInCart
          ? "Already in cart"
          : disabled
          ? "Cannot add to cart"
          : `Add ${course.title} to cart`
      }
      aria-label={
        isAlreadyInCart
          ? "Already in cart"
          : disabled
          ? "Cannot add to cart"
          : `Add ${course.title} to cart`
      }
    >
      {getButtonContent()}
    </motion.button>
  );
}

AddToCartButton.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number,
    description: PropTypes.string,
    imageUrl: PropTypes.string,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    level: PropTypes.string,
    duration: PropTypes.number,
    creatorId: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  variant: PropTypes.oneOf(["default", "outline", "minimal"]),
  showText: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default AddToCartButton;
