import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../Redux/slices/authSlice";
import { useWishlist } from "../hooks/useWishlist";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "../routes";

function WishlistPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const { wishlist, loading, error, removeCourseFromWishlist } = useWishlist();
  const [removingCourseId, setRemovingCourseId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleRemoveFromWishlist = async (courseId, courseTitle) => {
    try {
      setRemovingCourseId(courseId);
      await removeCourseFromWishlist(courseId, courseTitle);
    } finally {
      setRemovingCourseId(null);
    }
  };

  const handleEnrollNow = (course) => {
    navigate(PROTECTED_ROUTES.checkout, { state: { course } });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-background-main font-sans">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-text-primary">
              My Wishlist
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-text-secondary">
                {wishlist.length} {wishlist.length === 1 ? "course" : "courses"}
              </span>
              <Link
                to={PUBLIC_ROUTES.courseListing}
                className="text-primary-main hover:text-primary-light transition-colors duration-200"
              >
                Browse More Courses
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {wishlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary mb-4">
                Your wishlist is empty
              </h2>
              <p className="text-text-secondary mb-8 max-w-md mx-auto">
                Start adding courses you're interested in to keep track of them
                and enroll later.
              </p>
              <Button
                text="Explore Courses"
                onClick={() => navigate(PUBLIC_ROUTES.courseListing)}
                className="px-8 py-3"
              />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {wishlist.map((course) => (
                  <motion.div
                    key={course._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="relative">
                      <img
                        src={
                          course.imageUrl ||
                          "https://placehold.co/400x200/F9FAFB/1B3C53?text=Course"
                        }
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() =>
                          handleRemoveFromWishlist(course._id, course.title)
                        }
                        disabled={removingCourseId === course._id}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors duration-200 group"
                        title="Remove from wishlist"
                      >
                        {removingCourseId === course._id ? (
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-5 h-5 text-red-500 group-hover:text-red-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="p-6">
                      <h3
                        className="text-lg font-semibold text-text-primary mb-2 overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {course.title}
                      </h3>
                      <p
                        className="text-text-secondary text-sm mb-4 overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-primary-main">
                            ${course.price}
                          </span>
                          {course.level && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {course.level}
                            </span>
                          )}
                        </div>
                        {course.averageRating > 0 && (
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4 text-yellow-400 fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span className="text-sm text-text-secondary">
                              {course.averageRating.toFixed(1)} (
                              {course.numberOfReviews})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        <Link to={`/course/${course._id}`} className="flex-1">
                          <Button
                            text="View Details"
                            variant="outline"
                            className="w-full"
                          />
                        </Link>
                        <Button
                          text="Enroll Now"
                          onClick={() => handleEnrollNow(course)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default WishlistPage;
