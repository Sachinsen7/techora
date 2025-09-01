import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  logout,
} from "../../Redux/slices/authSlice";
import { selectCartCount } from "../../Redux/slices/cartSlice";
import { useWishlist } from "../../hooks/useWishlist";
import Button from "../common/Button";
import ThemeToggle from "../common/ThemeToggle";
import SearchBar from "../common/SearchBar";
import { AUTH_ROUTES, PROTECTED_ROUTES, PUBLIC_ROUTES } from "../../routes";

function Navbar() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartCount = useSelector(selectCartCount);
  const { wishlistCount } = useWishlist();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    console.log("Navbar - User data changed:", user);
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const getProfilePicture = () => {
    if (user?.profilePicture) {
      if (user.profilePicture.startsWith("http")) {
        return user.profilePicture;
      }
      return `http://localhost:3000${user.profilePicture}`;
    }
    return `https://placehold.co/40x40/F9FAFB/1B3C53?text=${
      user?.firstName ? user.firstName[0].toUpperCase() : "U"
    }`;
  };

  const getPrimaryDashboardLink = () => {
    if (!user) return PROTECTED_ROUTES.dashboard;
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "instructor") return PROTECTED_ROUTES.instructor;
    return PROTECTED_ROUTES.dashboard;
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { name: "Courses", path: PUBLIC_ROUTES.courseListing },
    { name: "About", path: PUBLIC_ROUTES.about },
    { name: "Contact", path: PUBLIC_ROUTES.contact },
  ];

  const LogoIcon = () => (
    <svg
      className="w-8 h-8 text-[#1B3C53]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );

  const WishlistIcon = () => (
    <svg
      className="w-6 h-6 text-[#6B7280]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );

  const CartIcon = () => (
    <svg
      className="w-6 h-6 text-[#6B7280]"
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

  const NotificationIcon = () => (
    <svg
      className="w-6 h-6 text-[#6B7280]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FFFFFF]/95 backdrop-blur-md shadow-lg border-b border-[#E5E7EB]"
          : "bg-[#FFFFFF] shadow-md"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={PUBLIC_ROUTES.home}
              className="flex items-center space-x-2 text-2xl font-serif font-bold text-[#1B3C53] hover:text-[#456882] transition-colors duration-200"
              aria-label="LearnSphere Home"
            >
              <LogoIcon />
              <span>Techora</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActiveLink(item.path)
                    ? "text-[#1B3C53]"
                    : "text-[#6B7280] hover:text-[#4A8292]"
                }`}
                aria-current={isActiveLink(item.path) ? "page" : undefined}
              >
                {item.name}
                {isActiveLink(item.path) && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A8292]"
                    layoutId="activeTab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          {/* <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <SearchBar
              className="w-full bg-[#F9FAFB] border-[#E5E7EB] focus:ring-[#4A8292] text-[#6B7280]"
              placeholder="Search courses..."
              aria-label="Search courses"
            />
          </div> */}

          {/* Desktop Icons and User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    to={PROTECTED_ROUTES.wishlist}
                    className="relative flex items-center justify-center p-2 text-[#6B7280] hover:text-[#4A8292] transition-colors duration-200 rounded-full hover:bg-[#F9FAFB] w-10 h-10"
                    title="My Wishlist"
                    aria-label="View wishlist"
                  >
                    <WishlistIcon />
                    {wishlistCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 bg-[#4A8292] text-[#FFFFFF] text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link
                    to={PROTECTED_ROUTES.cart}
                    className="relative flex items-center justify-center p-2 text-[#6B7280] hover:text-[#4A8292] transition-colors duration-200 rounded-full hover:bg-[#F9FAFB] w-10 h-10"
                    title="Shopping Cart"
                    aria-label="View cart"
                  >
                    <CartIcon />
                    {cartCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 bg-[#4A8292] text-[#FFFFFF] text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <button
                    className="relative flex items-center justify-center p-2 text-[#6B7280] hover:text-[#4A8292] transition-colors duration-200 rounded-full hover:bg-[#F9FAFB] w-10 h-10"
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <NotificationIcon />
                    <span className="absolute -top-1 -right-1 bg-[#4A8292] text-[#FFFFFF] text-xs rounded-full h-2 w-2"></span>
                  </button>
                </motion.div>
              </>
            )}
            {/* 
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ThemeToggle
                size="md"
                className="ml-2"
                aria-label="Toggle theme"
              />
            </motion.div> */}

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-[#F9FAFB] transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Open user menu"
                >
                  <img
                    src={getProfilePicture()}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] object-cover"
                  />
                  <svg
                    className="w-4 h-4 text-[#6B7280]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] rounded-xl shadow-lg border border-[#E5E7EB] py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-[#E5E7EB]">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={PROTECTED_ROUTES.profile}
                            className="cursor-pointer"
                          >
                            <img
                              src={getProfilePicture()}
                              alt="Profile"
                              className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] object-cover"
                            />
                          </Link>
                          <div>
                            <p className="font-semibold text-[#1B3C53]">
                              {user?.firstName || "User"} {user?.lastName || ""}
                            </p>
                            <p className="text-sm text-[#6B7280]">
                              {user?.email || ""}
                            </p>
                            <span className="inline-block px-2 py-1 text-xs bg-[#4A8292]/10 text-[#4A8292] rounded-full capitalize">
                              {user?.role || "user"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="py-2 space-y-1">
                        <Link
                          to={getPrimaryDashboardLink()}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4A8292] transition-colors duration-150"
                          aria-label="Go to dashboard"
                        >
                          <svg
                            className="w-5 h-5 mr-3 text-[#6B7280] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                          </svg>
                          <span className="flex-1">Dashboard</span>
                        </Link>

                        <Link
                          to={PROTECTED_ROUTES.profile}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4A8292] transition-colors duration-150"
                          aria-label="Go to profile settings"
                        >
                          <svg
                            className="w-5 h-5 mr-3 text-[#6B7280] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="flex-1">Profile Settings</span>
                        </Link>

                        <Link
                          to={PROTECTED_ROUTES.wishlist}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4A8292] transition-colors duration-150"
                          aria-label="Go to wishlist"
                        >
                          <span className="mr-3 flex-shrink-0">
                            <WishlistIcon />
                          </span>
                          <span className="flex-1">Wishlist</span>
                          {wishlistCount > 0 && (
                            <span className="ml-auto bg-[#4A8292] text-[#FFFFFF] text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          to={PROTECTED_ROUTES.cart}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4A8292] transition-colors duration-150"
                          aria-label="Go to cart"
                        >
                          <span className="mr-3 flex-shrink-0">
                            <CartIcon />
                          </span>
                          <span className="flex-1">Shopping Cart</span>
                        </Link>

                        <Link
                          to={PROTECTED_ROUTES.helpSupport}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4A8292] transition-colors duration-150"
                          aria-label="Go to help and support"
                        >
                          <svg
                            className="w-5 h-5 mr-3 text-[#6B7280] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="flex-1">Help & Support</span>
                        </Link>
                      </div>

                      <div className="border-t border-[#E5E7EB] pt-2">
                        <button
                          onClick={() => {
                            dispatch(logout());
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#4A8292] transition-colors duration-150"
                          aria-label="Sign out"
                        >
                          <svg
                            className="w-5 h-5 mr-3 text-[#6B7280] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span className="flex-1">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link to={AUTH_ROUTES.login}>
                  <Button
                    variant="outline"
                    text="Sign In"
                    className="px-4 py-2 bg-[#FFFFFF] border-[#1B3C53] text-[#1B3C53] hover:bg-[#1B3C53] hover:text-[#FFFFFF] rounded-full transition-all duration-300"
                    aria-label="Sign in"
                  />
                </Link>
                <Link to={AUTH_ROUTES.signup}>
                  <Button
                    text="Sign Up"
                    className="px-4 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-full transition-all duration-300"
                    aria-label="Sign up"
                  />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-[#6B7280] hover:text-[#4A8292] hover:bg-[#F9FAFB] transition-colors duration-200"
              whileTap={{ scale: 0.95 }}
              aria-label={
                isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
              }
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />

              <Dialog.Content asChild>
                <motion.div
                  ref={mobileMenuRef}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="fixed top-0 left-0 right-0 z-50 md:hidden border-t border-[#E5E7EB] bg-[#FFFFFF] overflow-y-auto"
                >
                  <div className="px-4 py-4 space-y-3">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                          isActiveLink(item.path)
                            ? "text-[#1B3C53] bg-[#F9FAFB]"
                            : "text-[#6B7280] hover:text-[#4A8292] hover:bg-[#F9FAFB]"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-current={
                          isActiveLink(item.path) ? "page" : undefined
                        }
                      >
                        {item.name}
                      </Link>
                    ))}

                    {/* ... keep your SearchBar, ThemeToggle, Auth/Profile sections same ... */}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

export default Navbar;
