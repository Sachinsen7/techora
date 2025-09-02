import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectAuthLoading } from "../Redux/slices/authSlice";
import { showModal } from "../Redux/slices/uiSlice";
import { getInstructorCourses, deleteInstructorCourse } from "../services/api";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import { PUBLIC_ROUTES } from "../routes";

function InstructorDashboard() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const authLoading = useSelector(selectAuthLoading);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    courseIdToDelete: null,
    courseTitleToDelete: "",
  });

  useEffect(() => {
    if (!authLoading && user && user.role === "instructor") {
      fetchInstructorCourses();
    } else if (!authLoading && user && user.role !== "instructor") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const fetchInstructorCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInstructorCourses();
      setCourses(data.courses);
    } catch (err) {
      setError(err.message || "Failed to load your courses.");
      dispatch(
        showModal({
          title: "Error",
          message: err.message || "Failed to load your courses.",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDeleteModal = (courseId, courseTitle) => {
    setConfirmModal({
      isOpen: true,
      courseIdToDelete: courseId,
      courseTitleToDelete: courseTitle,
    });
  };

  const confirmAndDeleteCourse = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setLoading(true);
    try {
      await deleteInstructorCourse(confirmModal.courseIdToDelete);
      dispatch(
        showModal({
          title: "Course Deleted",
          message: `"${confirmModal.courseTitleToDelete}" has been successfully deleted.`,
          type: "success",
        })
      );
      fetchInstructorCourses();
    } catch (err) {
      dispatch(
        showModal({
          title: "Deletion Failed",
          message: err.message || "Failed to delete the course.",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <Loader />;
  if (error)
    return (
      <div className="text-[#DC2626] text-center p-8 text-xl font-medium">
        {error}
      </div>
    );
  if (!user || user.role !== "instructor") return null;

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-8 px-4 font-sans">
      <div className="container mx-auto max-w-6xl">
        <header className="relative mb-12">
          <h1 className="text-4xl font-bold text-[#1B3C53] text-center tracking-tight">
            Instructor Dashboard
          </h1>
          <p className="text-lg text-[#6B7280] text-center mt-2 max-w-2xl mx-auto">
            Manage your courses with ease and create engaging learning
            experiences.
          </p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#4A8292] rounded-full"></div>
        </header>

        <div className="mb-12 text-center">
          <Link to="/instructor/course/new">
            <Button
              text="Create New Course"
              className="inline-flex items-center px-6 py-3 bg-[#1B3C53] text-white hover:bg-[#456882] transition-all duration-200 ease-in-out transform hover:scale-105 rounded-md font-semibold text-base shadow-md"
              aria-label="Create a new course"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Course
            </Button>
          </Link>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#1B3C53] mb-6 border-l-4 border-[#4A8292] pl-4">
            Your Courses
          </h2>
          {courses.length === 0 ? (
            <div className="text-center text-[#6B7280] text-lg py-12 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-[#4A8292]"
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
              <p>You haven’t created any courses yet. Start by creating one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div
                  key={course._id}
                  className="relative bg-[#FFFFFF] p-6 rounded-xl border border-[#E5E7EB] shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                  style={{
                    animation: `fadeIn 0.5s ease-in-out ${index * 0.1}s both`,
                  }}
                >
                  <div
                    className={`absolute top-0 left-0 w-2 h-full rounded-l-xl ${
                      course.status === "published"
                        ? "bg-[#4A8292]"
                        : "bg-[#D97706]"
                    }`}
                    aria-hidden="true"
                  ></div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-[#1B3C53] mb-2 truncate">
                      {course.title}
                    </h3>
                    <p className="text-[#6B7280] text-sm mb-1">
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          course.status === "published"
                            ? "text-[#4A8292]"
                            : "text-[#D97706]"
                        }`}
                      >
                        {course.status.charAt(0).toUpperCase() +
                          course.status.slice(1)}
                      </span>
                    </p>
                    <p className="text-[#6B7280] text-sm">
                      Price:{" "}
                      {course.price === 0
                        ? "Free"
                        : `$${course.price.toFixed(2)}`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={PUBLIC_ROUTES.courseDetail(course._id)}>
                        <Button
                          text="View"
                          variant="outline"
                          className="px-4 py-2 border-[#4A8292] text-[#4A8292] hover:bg-[#4A8292] hover:text-white transition-colors duration-200 rounded-md text-sm font-medium"
                          aria-label={`View course ${course.title}`}
                        />
                      </Link>
                      <Link to={`/instructor/course/edit/${course._id}`}>
                        <Button
                          text="Edit"
                          variant="secondary"
                          className="px-4 py-2 bg-[#F9FAFB] text-[#1B3C53] hover:bg-[#456882] hover:text-white transition-colors duration-200 rounded-md text-sm font-medium"
                          aria-label={`Edit course ${course.title}`}
                        />
                      </Link>
                      <Link to={`/instructor/course/${course._id}/content`}>
                        <Button
                          text="Manage Content"
                          className="px-4 py-2 bg-[#1B3C53] text-white hover:bg-[#456882] transition-colors duration-200 rounded-md text-sm font-medium"
                          aria-label={`Manage content for course ${course.title}`}
                        />
                      </Link>
                      <Button
                        text="Delete"
                        onClick={() =>
                          openConfirmDeleteModal(course._id, course.title)
                        }
                        className="px-4 py-2 bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors duration-200 rounded-md text-sm font-medium"
                        aria-label={`Delete course ${course.title}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the course "${confirmModal.courseTitleToDelete}"? This action cannot be undone.`}
        type="warning"
      >
        <div className="flex justify-center gap-4 mt-6">
          <Button
            text="Cancel"
            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            className="px-6 py-2 bg-[#F9FAFB] text-[#1B3C53] hover:bg-[#E5E7EB] transition-colors duration-200 rounded-md font-medium"
            aria-label="Cancel course deletion"
          />
          <Button
            text="Delete"
            onClick={confirmAndDeleteCourse}
            className="px-6 py-2 bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors duration-200 rounded-md font-medium"
            aria-label="Confirm course deletion"
          />
        </div>
      </Modal>

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

export default InstructorDashboard;
