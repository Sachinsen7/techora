import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { useWishlist } from "../../hooks/useWishlist";

function WishlistButton({
  courseId,
  courseTitle,
  className,
  size = "md",
  variant = "default",
  showText = false,
}) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;

    setIsToggling(true);
    await toggleWishlist(courseId, courseTitle);
    setIsToggling(false);
  };

  const isWishlisted = isInWishlist(courseId);

  const sizeConfig = {
    sm: {
      button: "p-1.5",
      icon: "w-4 h-4",
      text: "text-xs",
    },
    md: {
      button: "p-2",
      icon: "w-5 h-5",
      text: "text-sm",
    },
    lg: {
      button: "p-3",
      icon: "w-6 h-6",
      text: "text-base",
    },
  };

  const variantConfig = {
    default: {
      base: "bg-white border border-gray-200 hover:border-gray-300 shadow-sm",
      active: "text-red-500 border-red-200 bg-red-50",
      inactive: "text-gray-400 hover:text-red-400",
    },
    minimal: {
      base: "bg-transparent border-none",
      active: "text-red-500",
      inactive: "text-gray-400 hover:text-red-400",
    },
    solid: {
      base: "border-none shadow-sm",
      active: "bg-red-500 text-white hover:bg-red-600",
      inactive: "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400",
    },
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  const baseClasses = twMerge(
    "rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center",
    config.button,
    variantStyles.base,
    isWishlisted ? variantStyles.active : variantStyles.inactive,
    isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className
  );

  const HeartIcon = ({ filled }) => (
    <svg
      className={twMerge(config.icon, "transition-transform duration-200")}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
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

  return (
    <motion.button
      className={baseClasses}
      onClick={handleToggle}
      disabled={isToggling}
      whileHover={{ scale: isToggling ? 1 : 1.05 }}
      whileTap={{ scale: isToggling ? 1 : 0.95 }}
      transition={{ duration: 0.2 }}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <div className="flex items-center space-x-2">
        {isToggling ? (
          <LoadingIcon />
        ) : (
          <motion.div
            key={isWishlisted ? "filled" : "empty"}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <HeartIcon filled={isWishlisted} />
          </motion.div>
        )}

        {showText && (
          <span className={config.text}>
            {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
          </span>
        )}
      </div>
    </motion.button>
  );
}

WishlistButton.propTypes = {
  courseId: PropTypes.string.isRequired,
  courseTitle: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  variant: PropTypes.oneOf(["default", "minimal", "solid"]),
  showText: PropTypes.bool,
};

export default WishlistButton;
