import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

function Button({
  text,
  onClick,
  className,
  disabled,
  variant,
  children,
  type,
  ...rest
}) {
  const baseClasses =
    "px-4 py-2 rounded-md font-sans font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:ring-offset-2 flex items-center justify-center";

  const variantClasses =
    variant === "outline"
      ? "bg-transparent border border-[#1B3C53] text-[#1B3C53] hover:bg-[#F9FAFB] hover:border-[#456882]"
      : "bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882]";

  return (
    <motion.button
      type={type}
      className={twMerge(
        baseClasses,
        variantClasses,
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
      onClick={(e) => {
        const isInsideLink = e.currentTarget.closest("a") !== null;

        if (!isInsideLink) {
          e.stopPropagation();
        }

        if (typeof onClick === "function") {
          onClick(e);
        } else if (type !== "submit" && !isInsideLink) {
          console.warn("Button onClick is not a function or is undefined.");
        }
      }}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.2 }}
      aria-label={text || (typeof children === "string" ? children : "Button")}
      {...rest}
    >
      {children || text}
    </motion.button>
  );
}

Button.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(["solid", "outline"]),
  children: PropTypes.node,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};

Button.defaultProps = {
  text: "",
  className: "",
  onClick: undefined,
  disabled: false,
  variant: "solid",
  children: null,
  type: "button",
};

export default Button;
