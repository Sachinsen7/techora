import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import WishlistButton from "../common/WishlistButton";
import AddToCartButton from "../common/AddToCartButton";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../Redux/slices/authSlice";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "../../routes";

function CourseCard({ course, className }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  if (!course) {
    return null;
  }

  const handleEnroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(PUBLIC_ROUTES.login);
      return;
    }
    navigate(PROTECTED_ROUTES.checkout, { state: { course } });
  };

  return (
    <Link
      to={PUBLIC_ROUTES.courseDetail(course._id)}
      className={`block ${className}`}
      aria-label={`View details for ${course.title}`}
    >
      <motion.div
        className="bg-[#FFFFFF] rounded-xl shadow-md overflow-hidden border border-[#E5E7EB] relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -4, shadow: "lg" }}
      >
        <div className="relative">
          <img
            src={
              course.imageUrl?.startsWith("http")
                ? course.imageUrl
                : course.imageUrl
                ? `http://localhost:3000${course.imageUrl}`
                : "https://via.placeholder.com/400x250/F9FAFB/1B3C53?text=Course+Image"
            }
            alt={course.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/400x250/F9FAFB/1B3C53?text=Course+Image";
            }}
          />
          {course.category && (
            <span className="absolute top-3 left-3 bg-[#4A8292] text-[#FFFFFF] text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              {course.category.name || course.category}
            </span>
          )}
          {/* Wishlist Button */}
          <div className="absolute top-3 right-3">
            <WishlistButton
              courseId={course._id}
              courseTitle={course.title}
              size="md"
              variant="default"
            />
          </div>
          <motion.div
            className="absolute inset-0 bg-[#1B3C53]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <Button
              text="Enroll Now"
              onClick={handleEnroll}
              className="px-4 py-2 bg-[#FFFFFF] text-[#1B3C53] hover:bg-[#F9FAFB] hover:shadow-md rounded-md font-medium transition-all duration-200 transform hover:scale-105"
              aria-label={`Enroll in ${course.title}`}
            >
              <svg
                className="w-4 h-4 mr-2 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Enroll Now
            </Button>
          </motion.div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-[#1B3C53] mb-2 truncate">
            {course.title}
          </h3>
          <p className="text-[#6B7280] text-sm mb-3 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold text-[#1B3C53]">
              {course.price === 0 ? "Free" : `₹${course.price.toFixed(2)}`}
            </span>
            <span className="text-sm text-[#6B7280] flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-[#D97706]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 .587l3.668 7.431 8.332 1.21-6.001 5.853 1.416 8.249L12 18.897l-7.415 3.933 1.416-8.249-6.001-5.853 8.332-1.21L12 .587z" />
              </svg>
              {course.averageRating ? course.averageRating.toFixed(1) : "N/A"} (
              {course.numberOfReviews || 0})
            </span>
          </div>
          {course.creatorId && (
            <p className="text-[#6B7280] text-xs flex items-center mb-3">
              <svg
                className="w-3 h-3 mr-1 text-[#4A8292]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              By: {course.creatorId.firstName} {course.creatorId.lastName}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
            <AddToCartButton
              course={course}
              size="sm"
              variant="outline"
              showText={false}
            />
            <Button
              text="View Details"
              onClick={PUBLIC_ROUTES.courseDetail(course._id)}
              className="flex-1 px-3 py-2 bg-[#1B3C53] text-white hover:bg-[#456882] rounded-md font-medium transition-all duration-200 text-sm"
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

CourseCard.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    price: PropTypes.number.isRequired,
    averageRating: PropTypes.number,
    numberOfReviews: PropTypes.number,
    category: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        name: PropTypes.string,
      }),
    ]),
    creatorId: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
    }),
  }).isRequired,
  className: PropTypes.string,
};

CourseCard.defaultProps = {
  className: "",
};

export default CourseCard;
