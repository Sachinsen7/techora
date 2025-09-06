import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCourseById,
  getEnrolledCourseDetails,
  enrollInCourse,
  addReview,
  getReviews,
  getCourses,
} from "../services/api";
import { useSelector, useDispatch } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../Redux/slices/authSlice";
import { showModal } from "../Redux/slices/uiSlice";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import WishlistButton from "../components/common/WishlistButton";
import CourseCurriculum from "../components/course/CourseCurriculum";
import Review from "../components/course/Review";
import InstructorProfile from "../components/InstructorProfile";
import { PROTECTED_ROUTES } from "../routes";

function CourseDetailsPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  console.log("CourseDetailsPage - courseId from URL:", courseId);

  const [course, setCourse] = useState(null);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState(null);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        let courseData = null;
        let enrolledStatus = false;

        if (isAuthenticated) {
          try {
            const enrolledResponse = await getEnrolledCourseDetails(courseId);
            courseData = enrolledResponse.course;
            enrolledStatus = true;
          } catch (enrollmentError) {
            console.warn(
              "Not enrolled or error fetching enrolled details, falling back to public:",
              enrollmentError.message
            );
            const publicResponse = await getCourseById(courseId);
            courseData = publicResponse.course;
            enrolledStatus = false;
          }
        } else {
          const publicResponse = await getCourseById(courseId);
          courseData = publicResponse.course;
          enrolledStatus = false;
        }

        if (!courseData) {
          setError("Course not found or not available.");
          setLoading(false);
          return;
        }

        const totalLectures = courseData.sections.reduce(
          (sum, s) => sum + s.lectures.length,
          0
        );
        const duration =
          courseData.sections.reduce(
            (sum, s) =>
              sum + s.lectures.reduce((lSum, l) => lSum + (l.duration || 0), 0),
            0
          ) / 3600;

        const reviewData = await getReviews(courseId);
        const averageRating = reviewData.reviews.length
          ? reviewData.reviews.reduce((sum, r) => sum + r.rating, 0) /
            reviewData.reviews.length
          : 0;

        setCourse({
          ...courseData,
          totalLectures,
          duration: duration.toFixed(1),
          averageRating: averageRating.toFixed(1),
          numberOfReviews: reviewData.reviews.length,
          level: courseData.level || "All Levels",
          lastUpdated: courseData.lastUpdated || "N/A",
          imageUrl: courseData.imageUrl?.startsWith("http")
            ? courseData.imageUrl
            : courseData.imageUrl
            ? `https://techora-1.onrender.com${courseData.imageUrl}`
            : "https://via.placeholder.com/300x200/F8FAFC/1E293B?text=Course+Image",
          videoPreviewUrl: courseData.videoPreviewUrl || "",
          learningObjectives: courseData.learningObjectives || [
            "Learn key concepts and skills",
            "Apply knowledge practically",
            "Gain industry insights",
          ],
          requirements: courseData.requirements || [
            "Basic computer skills",
            "Internet access",
          ],
          targetAudience: courseData.targetAudience || [
            "Beginners",
            "Professionals",
          ],
        });
        setIsEnrolled(enrolledStatus);
        setReviews(reviewData.reviews || []);
        setRatingDistribution(
          reviewData.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        );

        const relatedResponse = await getCourses({
          category: courseData.category,
          limit: 3,
        });
        setRelatedCourses(
          relatedResponse.courses.filter((c) => c._id !== courseId)
        );
      } catch (generalError) {
        console.error("Error fetching course details:", generalError);
        setError(generalError.message || "Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      showModal({
        isOpen: true,
        title: "Login Required",
        message: "You need to log in to enroll in a course.",
        type: "info",
      });
      navigate("/login");
      return;
    }

    try {
      await enrollInCourse(courseId);
      showModal({
        isOpen: true,
        title: "Enrollment Successful!",
        message: "You have successfully enrolled in the course.",
        type: "success",
      });
      setIsEnrolled(true);
      navigate(`${PROTECTED_ROUTES.courseLearning(courseId)}`, {
        replace: true,
      });
    } catch (err) {
      showModal({
        isOpen: true,
        title: "Enrollment Failed",
        message: err.message || "Could not enroll in course.",
        type: "error",
      });
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !isEnrolled || user?.role !== "learner") {
      showModal({
        isOpen: true,
        title: "Permission Denied",
        message: "You must be an enrolled learner to add a review.",
        type: "error",
      });
      return;
    }
    if (!newReviewText.trim()) {
      showModal({
        isOpen: true,
        title: "Invalid Input",
        message: "Review comment cannot be empty.",
        type: "warning",
      });
      return;
    }

    setReviewLoading(true);
    try {
      await addReview(courseId, {
        rating: newReviewRating,
        comment: newReviewText,
      });
      const reviewData = await getReviews(courseId);
      setReviews(reviewData.reviews);
      setRatingDistribution(reviewData.ratingDistribution);
      setCourse({
        ...course,
        averageRating: reviewData.reviews.length
          ? reviewData.reviews.reduce((sum, r) => sum + r.rating, 0) /
            reviewData.reviews.length
          : 0,
        numberOfReviews: reviewData.reviews.length,
      });
      setNewReviewText("");
      setNewReviewRating(5);
      showModal({
        isOpen: true,
        title: "Review Added!",
        message: "Your review has been successfully added.",
        type: "success",
      });
    } catch (err) {
      showModal({
        isOpen: true,
        title: "Failed to Add Review",
        message: err.message || "Could not add your review.",
        type: "error",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const sortedReviews = () => {
    if (reviewSort === "highest") {
      return [...reviews].sort((a, b) => b.rating - a.rating);
    }
    return [...reviews].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-[#DC2626] text-center p-8 text-xl font-medium flex items-center justify-center">
        <svg
          className="w-6 h-6 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {error}
      </div>
    );
  if (!course) return null;

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans">
      {/* Hero Section */}
      <motion.section
        className="relative bg-[#F9FAFB] py-12 px-4 border-b border-[#E5E7EB] overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div
          className="absolute top-0 left-0 w-2 h-full bg-[#4A8292]"
          aria-hidden="true"
        ></div>
        <div className="container mx-auto max-w-7xl">
          <div className="lg:flex lg:items-start lg:gap-8">
            <div className="flex-1 max-w-4xl">
              {course.numberOfReviews > 100 && (
                <span className="inline-flex items-center bg-[#D97706] text-[#FFFFFF] text-sm font-medium px-3 py-1 rounded-full mb-4">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 .587l3.668 7.431 8.332 1.21-6.001 5.853 1.416 8.249L12 18.897l-7.415 3.933 1.416-8.249-6.001-5.853 8.332-1.21L12 .587z" />
                  </svg>
                  Bestseller
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-[#1B3C53] mb-4 tracking-tight">
                {course.title}
              </h1>
              <p className="text-[#6B7280] text-base mb-6">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="flex items-center text-xl font-semibold text-[#D97706]">
                  {course.averageRating || "N/A"} ★
                  <span className="text-sm text-[#6B7280] ml-2">
                    ({course.numberOfReviews || 0} reviews)
                  </span>
                </span>
                <span className="text-sm text-[#6B7280]">
                  {course.totalLectures || 0} lectures • {course.duration || 0}h
                  • {course.level}
                </span>
                <span className="text-sm text-[#6B7280]">
                  Updated {course.lastUpdated}
                </span>
              </div>
              <p className="text-sm text-[#6B7280] mb-6">
                Created by{" "}
                <span className="text-[#1B3C53] font-semibold">
                  {course.creatorId?.firstName} {course.creatorId?.lastName}
                </span>
              </p>
              {course.category && (
                <span className="inline-flex items-center bg-[#4A8292] text-[#FFFFFF] text-sm font-medium px-3 py-1 rounded-full mb-6">
                  <svg
                    className="w-4 h-4 mr-1"
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
                  {course.category.name || "N/A"}
                </span>
              )}
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[#1B3C53]">
                  {course.price === 0 ? "Free" : `₹${course.price.toFixed(2)}`}
                </span>
                <div className="flex items-center gap-3">
                  {!isEnrolled ? (
                    <Button
                      text={course.price === 0 ? "Enroll Now" : "Buy Now"}
                      onClick={handleEnroll}
                      className="px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                      aria-label={
                        course.price === 0
                          ? "Enroll in course for free"
                          : "Purchase course"
                      }
                    >
                      <svg
                        className="w-5 h-5 mr-2 inline-block"
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
                      {course.price === 0 ? "Enroll Now" : "Buy Now"}
                    </Button>
                  ) : (
                    <Link to={`${PROTECTED_ROUTES.courseLearning(courseId)}`}>
                      <Button
                        text="Go to Course"
                        className="px-6 py-2 bg-[#4A8292] text-[#FFFFFF] hover:bg-[#5B9EB3] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                        aria-label="Go to enrolled course"
                      >
                        <svg
                          className="w-5 h-5 mr-2 inline-block"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        Go to Course
                      </Button>
                    </Link>
                  )}
                  {/* Wishlist Button - Show only if not enrolled */}
                  {!isEnrolled && (
                    <WishlistButton
                      courseId={courseId}
                      courseTitle={course.title}
                      size="lg"
                      variant="default"
                      showText={true}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="hidden lg:block lg:w-80 mt-8 lg:mt-0">
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-48 object-cover rounded-xl shadow-md"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x200/F8FAFC/1E293B?text=Course+Image";
                }}
              />
            </div>
          </div>
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-[#4A8292] rounded-full"
            aria-hidden="true"
          ></div>
        </div>
      </motion.section>

      {/* Mobile CTA Bar */}
      <motion.div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#F9FAFB] shadow-lg p-4 z-20 border-t border-[#E5E7EB]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-lg font-bold text-[#1B3C53]">
            {course.price === 0 ? "Free" : `₹${course.price.toFixed(2)}`}
          </span>
          {!isEnrolled ? (
            <Button
              text={course.price === 0 ? "Enroll Now" : "Buy Now"}
              onClick={handleEnroll}
              className="px-4 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-medium transition-all duration-200 transform hover:scale-105"
              aria-label={
                course.price === 0
                  ? "Enroll in course for free"
                  : "Purchase course"
              }
            />
          ) : (
            <Link to={`${PROTECTED_ROUTES.courseLearning(courseId)}`}>
              <Button
                text="Go to Course"
                className="px-4 py-2 bg-[#4A8292] text-[#FFFFFF] hover:bg-[#5B9EB3] rounded-md font-medium transition-all duration-200 transform hover:scale-105"
                aria-label="Go to enrolled course"
              />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl flex flex-col lg:flex-row lg:gap-8">
        <div className="flex-1 max-w-4xl space-y-10">
          {/* Video Preview */}
          {course.videoPreviewUrl ? (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Course Preview
              </h2>
              <div className="relative aspect-w-16 aspect-h-9 px-4 pb-4">
                <iframe
                  src={course.videoPreviewUrl}
                  title={`Preview of ${course.title}`}
                  className="w-full h-64 rounded-md shadow-md"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.section>
          ) : (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Course Preview
              </h2>
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-64 object-cover rounded-md px-4 pb-4"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x200/F8FAFC/1E293B?text=Course+Image";
                }}
              />
            </motion.section>
          )}

          {/* What You'll Learn */}
          {course.learningObjectives?.length > 0 && (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                What You'll Learn
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.learningObjectives.map((objective, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-[#6B7280]"
                  >
                    <svg
                      className="w-5 h-5 mr-2 text-[#4A8292] mt-1"
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
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Requirements
              </h2>
              <ul className="space-y-2">
                {course.requirements.map((req, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-[#6B7280]"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-[#4A8292] mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {course.description && (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Course Description
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {course.description}
              </p>
            </motion.section>
          )}

          {course.targetAudience?.length > 0 && (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Who This Course Is For
              </h2>
              <ul className="space-y-2">
                {course.targetAudience.map((audience, index) => (
                  <li
                    key={index}
                    className="flex items-start text-sm text-[#6B7280]"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-[#4A8292] mt-1"
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
                    <span>{audience}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* Instructor Profile */}
          {course.creatorId && (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Instructor
              </h2>
              <InstructorProfile
                instructor={course.creatorId}
                className="bg-[#FFFFFF] rounded-md p-4 border border-[#E5E7EB]"
              />
            </motion.section>
          )}

          {/* Course Curriculum */}
          <motion.section
            className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
              Course Curriculum
            </h2>
            <p className="text-sm text-[#6B7280] mb-4">
              {course.totalLectures} lectures • {course.duration}h total length
            </p>
            <CourseCurriculum
              sections={course.sections}
              previewMode={!isEnrolled}
              className="space-y-4"
            />
          </motion.section>

          {/* Student Reviews */}
          <motion.section
            className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
              Student Reviews
            </h2>
            {ratingDistribution && (
              <div className="mb-6 bg-[#FFFFFF] p-4 rounded-md border border-[#E5E7EB] shadow-sm">
                <h3 className="text-lg font-semibold text-[#1B3C53] mb-3">
                  Rating Breakdown
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center">
                      <span className="text-sm text-[#6B7280] w-12">
                        {star} stars
                      </span>
                      <div className="flex-1 bg-[#E5E7EB] h-2 rounded-full">
                        <div
                          className="bg-[#4A8292] h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              ratingDistribution[star]
                                ? (ratingDistribution[star] /
                                    (course.numberOfReviews || 1)) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#6B7280] ml-3">
                        {ratingDistribution[star] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end mb-4">
              <div className="relative">
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-[#E5E7EB] rounded-md text-sm text-[#1B3C53] bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A8292] appearance-none"
                  aria-label="Sort reviews"
                >
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rated</option>
                </select>
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292]"
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
                <svg
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {reviews.length === 0 ? (
              <div className="text-[#6B7280] text-sm py-4 flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2 text-[#4A8292]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
                No reviews yet. Be the first to review this course!
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {sortedReviews().map((review, index) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Review
                      review={review}
                      className="bg-[#FFFFFF] rounded-md p-4 border border-[#E5E7EB]"
                    />
                  </motion.div>
                ))}
              </div>
            )}
            {isAuthenticated && isEnrolled && user?.role === "learner" && (
              <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
                <h3 className="text-lg font-semibold text-[#1B3C53] mb-4">
                  Add Your Review
                </h3>
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div>
                    <label
                      className="block text-[#1B3C53] text-sm font-medium mb-2"
                      htmlFor="rating"
                    >
                      Rating (1-5):
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className={`text-2xl ${
                            newReviewRating >= star
                              ? "text-[#D97706]"
                              : "text-[#6B7280]"
                          } hover:text-[#D97706] transition-colors duration-200`}
                          disabled={reviewLoading}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={`Rate ${star} stars`}
                        >
                          ★
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="comment"
                      className="block text-[#1B3C53] text-sm font-medium mb-2"
                    >
                      Your Comment:
                    </label>
                    <textarea
                      id="comment"
                      rows="4"
                      placeholder="Share your thoughts about this course..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] text-[#1B3C53] placeholder-[#6B7280] bg-[#FFFFFF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all duration-200"
                      required
                      disabled={reviewLoading}
                      aria-describedby="comment-error"
                    />
                    <svg
                      className="absolute left-3 top-10 w-5 h-5 text-[#4A8292]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M3 4h13M3 8h13M3 12h6m-6 4h6"
                      />
                    </svg>
                  </div>
                  <Button
                    text={reviewLoading ? "Submitting..." : "Submit Review"}
                    type="submit"
                    className="px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                    disabled={reviewLoading}
                    aria-label="Submit course review"
                  >
                    <svg
                      className="w-5 h-5 mr-2 inline-block"
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
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </div>
            )}
          </motion.section>

          {/* Related Courses */}
          {relatedCourses.length > 0 && (
            <motion.section
              className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
                Related Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedCourses.map((relatedCourse, index) => (
                  <motion.div
                    key={relatedCourse._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link
                      to={`/course/${relatedCourse._id}`}
                      className="block bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <img
                        src={
                          relatedCourse.imageUrl?.startsWith("http")
                            ? relatedCourse.imageUrl
                            : relatedCourse.imageUrl
                            ? `https://techora-1.onrender.com${relatedCourse.imageUrl}`
                            : "https://via.placeholder.com/300x200/F8FAFC/1E293B?text=Course+Image"
                        }
                        alt={relatedCourse.title}
                        className="w-full h-32 object-cover rounded-t-xl"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x200/F8FAFC/1E293B?text=Course+Image";
                        }}
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-[#1B3C53] mb-2 truncate">
                          {relatedCourse.title}
                        </h3>
                        <p className="text-sm text-[#6B7280] mb-2 line-clamp-2">
                          {relatedCourse.description}
                        </p>
                        <p className="text-sm text-[#1B3C53] font-medium">
                          {relatedCourse.price === 0
                            ? "Free"
                            : `₹${relatedCourse.price.toFixed(2)}`}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* Sticky Sidebar */}
        <motion.aside
          className="lg:sticky lg:top-24 lg:w-80 lg:ml-8 hidden lg:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-md p-6">
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
            <div className="text-center">
              <span className="text-xl font-bold text-[#1B3C53] mb-4 block">
                {course.price === 0 ? "Free" : `₹${course.price.toFixed(2)}`}
              </span>
              {!isEnrolled ? (
                <Button
                  text={course.price === 0 ? "Enroll Now" : "Buy Now"}
                  onClick={handleEnroll}
                  className="w-full px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                  aria-label={
                    course.price === 0
                      ? "Enroll in course for free"
                      : "Purchase course"
                  }
                />
              ) : (
                <Link to={`${PROTECTED_ROUTES.courseLearning(courseId)}`}>
                  <Button
                    text="Go to Course"
                    className="w-full px-6 py-2 bg-[#4A8292] text-[#FFFFFF] hover:bg-[#5B9EB3] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                    aria-label="Go to enrolled course"
                  />
                </Link>
              )}
              {isEnrolled && (
                <div className="mt-4">
                  <p className="text-[#6B7280] text-sm mb-2">Course Progress</p>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-2.5">
                    <div
                      className="bg-[#4A8292] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <ul className="mt-4 text-sm text-[#6B7280] space-y-2">
                <li className="flex justify-between">
                  <span>Duration</span>
                  <span>{course.duration || 0} hours</span>
                </li>
                <li className="flex justify-between">
                  <span>Lectures</span>
                  <span>{course.totalLectures || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Level</span>
                  <span>{course.level}</span>
                </li>
                <li className="flex justify-between">
                  <span>Updated</span>
                  <span>{course.lastUpdated}</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.aside>
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default CourseDetailsPage;
