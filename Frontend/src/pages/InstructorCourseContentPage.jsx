import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectAuthLoading } from "../Redux/slices/authSlice";
import { showModal } from "../Redux/slices/uiSlice";
import {
  getInstructorCourses,
  createSection,
  updateSection,
  deleteSection,
  createLecture,
  updateLecture,
  deleteLecture,
} from "../services/api";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import CourseCurriculum from "../components/course/CourseCurriculum";
import VideoPlayer from "../components/learning/VideoPlayer";
import QuizComponent from "../components/learning/QuizAssessment";
import QuizCreator from "../components/learning/QuizCreator";
import AssignmentComponent from "../components/learning/AssignmentComponent";
import { motion } from "framer-motion";

const withTimeout = (promise, ms = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);

function InstructorCourseContentPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const authLoading = useSelector(selectAuthLoading);
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({
    courseId: "",
    title: "",
    order: 0,
  });

  const [showLectureForm, setShowLectureForm] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [lectureFormData, setLectureFormData] = useState({
    sectionId: "",
    title: "",
    type: "video",
    contentUrl: "",
    textContent: "",
    duration: 0,
    order: 0,
    isPublished: true,
  });

  // Video upload states
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

  // Quiz creation states
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [currentQuizLecture, setCurrentQuizLecture] = useState(null);

  // Debug: Track state changes
  useEffect(() => {
    console.log(" showQuizCreator changed to:", showQuizCreator);
  }, [showQuizCreator]);

  useEffect(() => {
    console.log(" currentQuizLecture changed to:", currentQuizLecture);
  }, [currentQuizLecture]);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    itemType: "",
    itemId: null,
    itemTitle: "",
    onConfirm: () => {},
  });

  const fetchCourseContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const instructorCoursesData = await withTimeout(getInstructorCourses());
      const courseDetails = instructorCoursesData.courses.find(
        (c) => c._id === courseId
      );

      if (!courseDetails) {
        setError("Course not found or you don't own it.");
        setLoading(false);
        return;
      }

      const sections = Array.isArray(courseDetails.sections)
        ? courseDetails.sections
        : [];

      // Debug: Log quiz lectures and their quizId
      sections.forEach((section) => {
        section.lectures.forEach((lecture) => {
          if (lecture.type === "quiz") {
            console.log(
              `Frontend - Quiz lecture "${lecture.title}" has quizId:`,
              lecture.quizId
            );
          }
        });
      });

      setCourse({ ...courseDetails, sections });
      setSectionFormData((prev) => ({
        ...prev,
        courseId,
        order: sections.length || 0,
      }));
    } catch (err) {
      console.error("Error fetching course content:", err, {
        response: err.response?.data,
      });
      setError(
        err.response?.status === 404
          ? "Course not found."
          : err.message || "Failed to load course content."
      );
      dispatch(
        showModal({
          title: "Error",
          message:
            err.response?.status === 404
              ? "Course not found."
              : err.message || "Failed to load course content.",
          type: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, dispatch]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "instructor")) {
      dispatch(
        showModal({
          title: "Access Denied",
          message: "You must be an instructor to manage course content.",
          type: "error",
        })
      );
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!authLoading && user && user.role === "instructor") {
      fetchCourseContent();
    }
  }, [courseId, user, authLoading, navigate, showModal, fetchCourseContent]);

  const handleAddSectionClick = useCallback(() => {
    setCurrentSection(null);
    const sections = Array.isArray(course?.sections) ? course.sections : [];
    const nextOrder = sections.length || 0;
    setSectionFormData({
      courseId: courseId || "",
      title: "",
      order: nextOrder,
    });
    setShowSectionForm(true);
  }, [course?.sections, courseId]);

  const handleEditSectionClick = useCallback(
    (section) => {
      setCurrentSection(section);
      setSectionFormData({
        courseId: courseId || "",
        title: section.title,
        order: Number.isInteger(section.order) ? section.order : 0,
      });
      setShowSectionForm(true);
    },
    [courseId]
  );

  const handleSectionFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setSectionFormData((prev) => ({
      ...prev,
      [name]:
        name === "order" ? (value === "" ? "" : Number(value) || 0) : value,
    }));
  }, []);

  const handleSectionFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSubmitting(true);
      setError(null);

      if (!sectionFormData.title.trim() || sectionFormData.title.length < 3) {
        setError("Section title must be at least 3 characters long.");
        setSubmitting(false);
        return;
      }
      const order =
        sectionFormData.order === "" ? 0 : Number(sectionFormData.order);
      if (!Number.isInteger(order) || order < 0 || isNaN(order)) {
        setError("Section order must be a non-negative integer.");
        setSubmitting(false);
        return;
      }
      if (!sectionFormData.courseId.match(/^[0-9a-fA-F]{24}$/)) {
        setError("Invalid course ID format.");
        setSubmitting(false);
        return;
      }

      const payload = {
        courseId: sectionFormData.courseId,
        title: sectionFormData.title,
        order,
      };

      try {
        if (currentSection) {
          await withTimeout(updateSection(currentSection._id, payload));
          showModal({
            isOpen: true,
            title: "Section Updated",
            message: "Section updated successfully.",
            type: "success",
          });
        } else {
          await withTimeout(createSection(payload));
          showModal({
            isOpen: true,
            title: "Section Created",
            message: "Section created successfully.",
            type: "success",
          });
        }
        setShowSectionForm(false);
        setSectionFormData({
          courseId,
          title: "",
          order:
            course && Array.isArray(course.sections)
              ? course.sections.length + 1
              : 0,
        });
        fetchCourseContent();
      } catch (err) {
        console.error("Error saving section:", err, {
          response: err.response?.data,
        });
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to save section."
        );
        showModal({
          isOpen: true,
          title: "Error",
          message:
            err.response?.data?.message ||
            err.message ||
            "Failed to save section.",
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [currentSection, sectionFormData, showModal, fetchCourseContent]
  );
  const handleDeleteSectionConfirm = useCallback((sectionId, sectionTitle) => {
    setConfirmModal({
      isOpen: true,
      itemType: "section",
      itemId: sectionId,
      itemTitle: sectionTitle,
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await withTimeout(deleteSection(sectionId));
          showModal({
            isOpen: true,
            title: "Section Deleted",
            message: `"${sectionTitle}" and its lectures deleted.`,
            type: "success",
          });
          fetchCourseContent();
        } catch (err) {
          console.error("Error deleting section:", err, {
            response: err.response?.data,
          });
          showModal({
            isOpen: true,
            title: "Error",
            message:
              err.response?.data?.message ||
              err.message ||
              "Failed to delete section.",
            type: "error",
          });
        } finally {
          setSubmitting(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  }, []);

  const handleAddLectureClick = useCallback(
    (sectionId) => {
      setCurrentLecture(null);
      const section = course?.sections?.find((s) => s._id === sectionId);
      const lectures = Array.isArray(section?.lectures) ? section.lectures : [];
      const nextOrder = lectures.length || 0;
      setLectureFormData({
        sectionId,
        title: "",
        type: "video",
        contentUrl: "",
        textContent: "",
        duration: 0,
        order: nextOrder,
        isPublished: true,
      });
      // Reset video upload states
      setSelectedVideoFile(null);
      setVideoUploadProgress(0);
      setIsUploadingVideo(false);
      setUploadedVideoUrl("");
      setShowLectureForm(true);
    },
    [course?.sections]
  );

  const handleEditLectureClick = useCallback((lecture) => {
    setCurrentLecture(lecture);
    setLectureFormData({
      sectionId:
        lecture.sectionId ||
        course.sections.find((s) =>
          s.lectures.some((l) => l._id === lecture._id)
        )?._id ||
        "",
      title: lecture.title,
      type: lecture.type,
      contentUrl: lecture.contentUrl || "",
      textContent: lecture.textContent || "",
      duration: Number.isInteger(lecture.duration) ? lecture.duration : 0,
      order: Number.isInteger(lecture.order) ? lecture.order : 0,
      isPublished: lecture.isPublished,
    });
    setShowLectureForm(true);
  }, []);

  const handleLectureFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setLectureFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "duration" || name === "order"
          ? value === ""
            ? ""
            : Number(value) || 0
          : value,
    }));
  }, []);

  // Handle video file selection
  const handleVideoFileSelect = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const allowedTypes = [
          "video/mp4",
          "video/avi",
          "video/mov",
          "video/wmv",
          "video/flv",
          "video/webm",
          "video/mkv",
        ];
        if (!allowedTypes.includes(file.type)) {
          showModal({
            isOpen: true,
            title: "Invalid File Type",
            message:
              "Please select a valid video file (MP4, AVI, MOV, WMV, FLV, WebM, MKV).",
            type: "error",
          });
          return;
        }

        // Validate file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
          showModal({
            isOpen: true,
            title: "File Too Large",
            message: "Please select a video smaller than 500MB.",
            type: "error",
          });
          return;
        }

        setSelectedVideoFile(file);
      }
    },
    [showModal]
  );

  // Upload video to server
  const uploadVideoFile = useCallback(async () => {
    if (!selectedVideoFile) return null;

    setIsUploadingVideo(true);
    setVideoUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("videoFile", selectedVideoFile);

      const response = await fetch(
        "https://techora-1.onrender.com/api/instructor/upload-video",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload video");
      }

      const result = await response.json();
      setUploadedVideoUrl(result.videoUrl);
      setVideoUploadProgress(100);

      showModal({
        isOpen: true,
        title: "Video Uploaded",
        message: "Video uploaded successfully!",
        type: "success",
      });

      return result.videoUrl;
    } catch (error) {
      console.error("Video upload error:", error);
      showModal({
        isOpen: true,
        title: "Upload Failed",
        message: error.message || "Failed to upload video.",
        type: "error",
      });
      return null;
    } finally {
      setIsUploadingVideo(false);
    }
  }, [selectedVideoFile, token, showModal]);

  // Handle quiz creation
  const handleCreateQuizForLecture = useCallback((lectureId) => {
    console.log(" Create Quiz button clicked for lecture:", lectureId);
    console.log(" Setting currentQuizLecture to:", lectureId);
    setCurrentQuizLecture(lectureId);
    console.log(" Setting showQuizCreator to true");
    setShowQuizCreator(true);
    console.log(" Quiz creator modal should now be open");

    // Debug: Check state after a brief delay
    setTimeout(() => {
      console.log(
        " State check - showQuizCreator should be true, currentQuizLecture should be:",
        lectureId
      );
    }, 100);
  }, []);

  const handleQuizCreated = useCallback(
    (quizId) => {
      setShowQuizCreator(false);
      setCurrentQuizLecture(null);
      console.log(
        "Quiz created with ID:",
        quizId,
        "refreshing course content..."
      );
      // Add a small delay to ensure backend has processed the update
      setTimeout(() => {
        fetchCourseContent(); // Refresh to show the quiz
      }, 500);
    },
    [fetchCourseContent]
  );

  // Memoized modal close handlers
  const handleSectionModalClose = useCallback(() => {
    setShowSectionForm(false);
    setError(null);
    setSubmitting(false);
  }, []);

  const handleLectureModalClose = useCallback(() => {
    setShowLectureForm(false);
    setError(null);
    setSubmitting(false);
  }, []);

  const handleLectureFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setSubmitting(true);
      setError(null);

      if (
        !lectureFormData.title.trim() ||
        lectureFormData.title.length < 3 ||
        lectureFormData.title.length > 150
      ) {
        setError("Lecture title must be between 3 and 150 characters.");
        setSubmitting(false);
        return;
      }
      const order =
        lectureFormData.order === "" ? 0 : Number(lectureFormData.order);
      if (!Number.isInteger(order) || order < 0 || isNaN(order)) {
        setError("Lecture order must be a non-negative integer.");
        setSubmitting(false);
        return;
      }
      if (!lectureFormData.sectionId.match(/^[0-9a-fA-F]{24}$/)) {
        setError("Invalid section ID format.");
        setSubmitting(false);
        return;
      }
      if (lectureFormData.type === "video") {
        // Check if we have either a URL or an uploaded video
        const hasUrl = lectureFormData.contentUrl.trim();
        const hasUploadedVideo = uploadedVideoUrl || selectedVideoFile;

        if (!hasUrl && !hasUploadedVideo) {
          setError(
            "Video lectures require either a URL or an uploaded video file."
          );
          setSubmitting(false);
          return;
        }

        if (hasUrl && !hasUploadedVideo) {
          const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
          if (!urlRegex.test(lectureFormData.contentUrl)) {
            setError("Please provide a valid URL (e.g., https://...).");
            setSubmitting(false);
            return;
          }
        }

        const duration =
          lectureFormData.duration === ""
            ? 0
            : Number(lectureFormData.duration);
        if (!Number.isInteger(duration) || duration <= 0 || isNaN(duration)) {
          setError(
            "Video lectures require a positive integer duration in seconds."
          );
          setSubmitting(false);
          return;
        }
      }
      if (
        lectureFormData.type === "text" &&
        (!lectureFormData.textContent.trim() ||
          lectureFormData.textContent.length < 10)
      ) {
        setError("Text lectures require content with at least 10 characters.");
        setSubmitting(false);
        return;
      }
      if (lectureFormData.type === "assignment") {
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        if (
          !lectureFormData.contentUrl.trim() ||
          !urlRegex.test(lectureFormData.contentUrl)
        ) {
          setError("Assignment lectures require a valid URL.");
          setSubmitting(false);
          return;
        }
      }
      if (
        !["video", "text", "quiz", "assignment"].includes(lectureFormData.type)
      ) {
        setError("Invalid lecture type.");
        setSubmitting(false);
        return;
      }

      // Upload video if needed
      let finalContentUrl = lectureFormData.contentUrl;
      if (
        lectureFormData.type === "video" &&
        selectedVideoFile &&
        !uploadedVideoUrl
      ) {
        const videoUrl = await uploadVideoFile();
        if (!videoUrl) {
          setSubmitting(false);
          return;
        }
        finalContentUrl = `https://techora-1.onrender.com${videoUrl}`;
      } else if (uploadedVideoUrl) {
        finalContentUrl = `https://techora-1.onrender.com${uploadedVideoUrl}`;
      }

      const payload = {
        sectionId: lectureFormData.sectionId,
        title: lectureFormData.title,
        type: lectureFormData.type,
        order,
        isPublished: lectureFormData.isPublished,
        ...(lectureFormData.type === "video" ||
        lectureFormData.type === "assignment"
          ? { contentUrl: finalContentUrl }
          : {}),
        ...(lectureFormData.type === "text"
          ? { textContent: lectureFormData.textContent }
          : {}),
        ...(lectureFormData.type === "video"
          ? { duration: Number(lectureFormData.duration) }
          : {}),
      };

      try {
        console.log("Lecture payload:", payload);
        if (currentLecture) {
          await withTimeout(updateLecture(currentLecture._id, payload));
          showModal({
            isOpen: true,
            title: "Lecture Updated",
            message: "Lecture updated successfully.",
            type: "success",
          });
        } else {
          await withTimeout(
            createLecture(courseId, lectureFormData.sectionId, payload)
          );
          showModal({
            isOpen: true,
            title: "Lecture Created",
            message: "Lecture created successfully.",
            type: "success",
          });
        }
        setShowLectureForm(false);
        fetchCourseContent();
      } catch (err) {
        console.error("Error saving lecture:", err, {
          response: err.response?.data,
        });
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to save lecture."
        );
        showModal({
          isOpen: true,
          title: "Error",
          message:
            err.response?.data?.message ||
            err.message ||
            "Failed to save lecture.",
          type: "error",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      currentLecture,
      lectureFormData,
      selectedVideoFile,
      uploadedVideoUrl,
      uploadVideoFile,
      showModal,
      fetchCourseContent,
    ]
  );

  const handleDeleteLectureConfirm = useCallback((lectureId, lectureTitle) => {
    setConfirmModal({
      isOpen: true,
      itemType: "lecture",
      itemId: lectureId,
      itemTitle: lectureTitle,
      onConfirm: async () => {
        setSubmitting(true);
        try {
          await withTimeout(deleteLecture(lectureId));
          showModal({
            isOpen: true,
            title: "Lecture Deleted",
            message: `"${lectureTitle}" deleted.`,
            type: "success",
          });
          fetchCourseContent();
        } catch (err) {
          console.error("Error deleting lecture:", err, {
            response: err.response?.data,
          });
          showModal({
            isOpen: true,
            title: "Error",
            message:
              err.response?.data?.message ||
              err.message ||
              "Failed to delete lecture.",
            type: "error",
          });
        } finally {
          setSubmitting(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  }, []);

  if (authLoading || loading) return <Loader />;
  if (error && !course)
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

  if (!user || user.role !== "instructor" || !course) return null;

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-6 font-sans">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#1B3C53] text-center mb-4 tracking-tight">
            Manage Content for "{course.title}"
          </h1>
          <p className="text-base text-[#6B7280] text-center mb-8">
            Organize sections and lectures to build your course.
          </p>
        </motion.div>

        <motion.section
          className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
            Course Structure Preview
          </h2>
          <CourseCurriculum
            sections={course.sections}
            isEnrolledView={false}
            className="space-y-4"
            aria-label="Preview of course curriculum"
          />
        </motion.section>

        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold text-[#1B3C53] border-l-4 border-[#4A8292] pl-3 mb-4">
            Course Sections
          </h2>
          <div className="flex justify-end mb-4">
            <Button
              text="Add New Section"
              onClick={handleAddSectionClick}
              className="px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
              aria-label="Add a new section"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Add New Section
            </Button>
          </div>
          {course.sections.length === 0 ? (
            <div className="text-[#6B7280] text-base font-medium flex items-center justify-center py-6">
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
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 006 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              No sections added yet. Start by adding one!
            </div>
          ) : (
            <div className="space-y-4">
              {course.sections
                .sort(
                  (a, b) =>
                    (Number.isInteger(a.order) ? a.order : 0) -
                    (Number.isInteger(b.order) ? b.order : 0)
                )
                .map((section) => (
                  <div
                    key={section._id}
                    className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
                    role="region"
                    aria-label={`Section: ${section.title}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-[#1B3C53]">
                        {Number.isInteger(section.order)
                          ? section.order + 1
                          : 1}
                        . {section.title}
                      </h3>
                      <div className="flex space-x-2">
                        <Button
                          text="Add Lecture"
                          onClick={() => handleAddLectureClick(section._id)}
                          className="px-4 py-1 bg-[#4A8292] text-[#FFFFFF] hover:bg-[#5B9EB3] rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105"
                          aria-label={`Add lecture to ${section.title}`}
                        />
                        <Button
                          text="Edit"
                          onClick={() => handleEditSectionClick(section)}
                          className="px-4 py-1 border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#F9FAFB] rounded-md text-sm font-medium transition-all duration-200"
                          aria-label={`Edit ${section.title}`}
                        />
                        <Button
                          text="Delete"
                          onClick={() =>
                            handleDeleteSectionConfirm(
                              section._id,
                              section.title
                            )
                          }
                          className="px-4 py-1 bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C] rounded-md text-sm font-medium transition-all duration-200"
                          aria-label={`Delete ${section.title}`}
                        />
                      </div>
                    </div>
                    {section.lectures.length > 0 ? (
                      // List of lectures within the section
                      <ul className="space-y-2 ml-4">
                        {section.lectures
                          .sort(
                            (a, b) =>
                              (Number.isInteger(a.order) ? a.order : 0) -
                              (Number.isInteger(b.order) ? b.order : 0)
                          )
                          .map((lecture) => (
                            <li
                              key={lecture._id}
                              className="flex items-center justify-between text-[#6B7280] text-sm p-2 hover:bg-[#F9FAFB] rounded-md transition-all duration-200"
                            >
                              <span className="flex-1 mr-4 flex items-center">
                                <svg
                                  className="w-4 h-4 mr-2 text-[#4A8292]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {Number.isInteger(lecture.order)
                                  ? lecture.order + 1
                                  : 1}
                                . {lecture.title} ({lecture.type})
                                {!lecture.isPublished && (
                                  <span className="ml-2 text-xs text-[#D97706] font-medium">
                                    [Draft]
                                  </span>
                                )}
                                {lecture.type === "quiz" && lecture.quizId && (
                                  <span className="ml-2 text-xs text-[#059669] font-medium bg-[#D1FAE5] px-2 py-1 rounded">
                                    [Quiz Created]
                                  </span>
                                )}
                                {lecture.type === "quiz" && !lecture.quizId && (
                                  <span className="ml-2 text-xs text-[#DC2626] font-medium bg-[#FEE2E2] px-2 py-1 rounded">
                                    [No Quiz]
                                  </span>
                                )}
                              </span>
                              <div className="flex space-x-2">
                                {lecture.type === "quiz" && !lecture.quizId && (
                                  <Button
                                    text="Create Quiz"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleCreateQuizForLecture(lecture._id);
                                    }}
                                    className="px-3 py-1 bg-[#059669] text-[#FFFFFF] hover:bg-[#047857] rounded-md text-xs font-medium transition-all duration-200"
                                    aria-label={`Create quiz for ${lecture.title}`}
                                  />
                                )}
                                <Button
                                  text="Edit"
                                  onClick={() =>
                                    handleEditLectureClick(lecture)
                                  }
                                  className="px-3 py-1 border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#F9FAFB] rounded-md text-xs font-medium transition-all duration-200"
                                  aria-label={`Edit ${lecture.title}`}
                                />
                                <Button
                                  text="Delete"
                                  onClick={() =>
                                    handleDeleteLectureConfirm(
                                      lecture._id,
                                      lecture.title
                                    )
                                  }
                                  className="px-3 py-1 bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C] rounded-md text-xs font-medium transition-all duration-200"
                                  aria-label={`Delete ${lecture.title}`}
                                />
                              </div>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      // Message when no lectures in a section
                      <p className="text-[#6B7280] text-sm ml-4 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-[#4A8292]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 006 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                          />
                        </svg>
                        No lectures in this section yet.
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </motion.section>
        <Modal
          key="section-form-modal"
          isOpen={showSectionForm}
          onClose={handleSectionModalClose}
          title={currentSection ? "Edit Section" : "Add New Section"}
          type="info"
          loading={submitting}
        >
          <form
            key="section-form"
            onSubmit={handleSectionFormSubmit}
            className="space-y-4"
          >
            {error && (
              <p className="text-[#DC2626] text-sm text-center flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-2"
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
              </p>
            )}
            <div>
              <label
                htmlFor="sectionTitle"
                className="block text-[#1B3C53] text-sm font-semibold mb-2"
              >
                Section Title
              </label>
              <div className="relative">
                <input
                  key="section-title-input"
                  type="text"
                  id="sectionTitle"
                  name="title"
                  value={sectionFormData.title || ""}
                  onChange={handleSectionFormChange}
                  placeholder="Enter section title..."
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                  required
                  disabled={submitting}
                  aria-describedby="sectionTitle-error"
                  autoComplete="off"
                  spellCheck="false"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <label
                htmlFor="sectionOrder"
                className="block text-[#1B3C53] text-sm font-semibold mb-2"
              >
                Order (Position)
              </label>
              <div className="relative">
                <input
                  key="section-order-input"
                  type="number"
                  id="sectionOrder"
                  name="order"
                  value={sectionFormData.order || ""}
                  onChange={handleSectionFormChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                  required
                  disabled={submitting}
                  aria-describedby="sectionOrder-error"
                  autoComplete="off"
                  spellCheck="false"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              </div>
            </div>
            <Button
              text={submitting ? "Saving..." : "Save Section"}
              type="submit"
              className="w-full px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
              disabled={submitting}
              aria-label="Save section"
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
              {submitting ? "Saving..." : "Save Section"}
            </Button>
          </form>
        </Modal>

        <Modal
          key="lecture-form-modal"
          isOpen={showLectureForm}
          onClose={handleLectureModalClose}
          title={currentLecture ? "Edit Lecture" : "Add New Lecture"}
          type="info"
          loading={submitting}
        >
          <form
            key="lecture-form"
            onSubmit={handleLectureFormSubmit}
            className="space-y-4"
          >
            {error && (
              <p className="text-[#DC2626] text-sm text-center flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-2"
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
              </p>
            )}
            <div>
              <label
                htmlFor="lectureTitle"
                className="block text-[#1B3C53] text-sm font-semibold mb-2"
              >
                Lecture Title
              </label>
              <div className="relative">
                <input
                  key="lecture-title-input"
                  type="text"
                  id="lectureTitle"
                  name="title"
                  value={lectureFormData.title || ""}
                  onChange={handleLectureFormChange}
                  placeholder="Enter lecture title..."
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                  required
                  disabled={submitting}
                  aria-describedby="lectureTitle-error"
                  autoComplete="off"
                  spellCheck="false"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <label
                htmlFor="lectureType"
                className="block text-[#1B3C53] text-sm font-semibold mb-2"
              >
                Lecture Type
              </label>
              <div className="relative">
                <select
                  id="lectureType"
                  name="type"
                  value={lectureFormData.type}
                  onChange={handleLectureFormChange}
                  className="w-full pl-10 pr-8 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed appearance-none transition-all duration-200"
                  required
                  disabled={submitting || currentLecture}
                  aria-describedby="lectureType-error"
                >
                  <option value="video">Video</option>
                  <option value="text">Text</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none"
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
            {lectureFormData.type === "video" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[#1B3C53] text-sm font-semibold mb-2">
                    Video Content
                  </label>
                  <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-[#374151] text-sm font-medium mb-2">
                          Option 1: Upload Video File
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileSelect}
                          disabled={submitting || isUploadingVideo}
                          className="block w-full text-sm text-[#6B7280] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#4A8292] file:text-white hover:file:bg-[#1B3C53] file:cursor-pointer disabled:opacity-50"
                        />
                        {selectedVideoFile && (
                          <p className="text-sm text-[#6B7280] mt-2">
                            Selected: {selectedVideoFile.name} (
                            {(selectedVideoFile.size / 1024 / 1024).toFixed(2)}{" "}
                            MB)
                          </p>
                        )}
                        {isUploadingVideo && (
                          <div className="mt-2">
                            <div className="bg-[#E5E7EB] rounded-full h-2">
                              <div
                                className="bg-[#4A8292] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${videoUploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-[#6B7280] mt-1">
                              Uploading... {videoUploadProgress}%
                            </p>
                          </div>
                        )}
                        {uploadedVideoUrl && (
                          <p className="text-sm text-[#059669] mt-2 flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
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
                            Video uploaded successfully!
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#E5E7EB] pt-4">
                      <label
                        htmlFor="contentUrl"
                        className="block text-[#374151] text-sm font-medium mb-2"
                      >
                        Option 2: Video URL (YouTube, Vimeo, etc.)
                      </label>
                      <div className="relative">
                        <input
                          key="video-url-input"
                          type="url"
                          id="contentUrl"
                          name="contentUrl"
                          value={lectureFormData.contentUrl || ""}
                          onChange={handleLectureFormChange}
                          placeholder="e.g., https://youtube.com/embed/..."
                          className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                          disabled={submitting || isUploadingVideo}
                          autoComplete="off"
                          spellCheck="false"
                        />
                        <svg
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {(lectureFormData.contentUrl || uploadedVideoUrl) && (
                    <div className="mt-4">
                      <VideoPlayer
                        src={
                          uploadedVideoUrl
                            ? `https://techora-1.onrender.com${uploadedVideoUrl}`
                            : lectureFormData.contentUrl
                        }
                      />
                      <p className="text-[#6B7280] text-sm mt-2">
                        Video preview above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {lectureFormData.type === "assignment" && (
              <div>
                <label
                  htmlFor="contentUrl"
                  className="block text-[#1B3C53] text-sm font-semibold mb-2"
                >
                  Assignment File URL
                </label>
                <div className="relative">
                  <input
                    key="assignment-url-input"
                    type="url"
                    id="contentUrl"
                    name="contentUrl"
                    value={lectureFormData.contentUrl || ""}
                    onChange={handleLectureFormChange}
                    placeholder="e.g., https://drive.google.com/..."
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                    required
                    disabled={submitting}
                    aria-describedby="contentUrl-error"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
                    />
                  </svg>
                </div>
              </div>
            )}
            {lectureFormData.type === "text" && (
              <div>
                <label
                  htmlFor="textContent"
                  className="block text-[#1B3C53] text-sm font-semibold mb-2"
                >
                  Text Content
                </label>
                <div className="relative">
                  <textarea
                    key="text-content-input"
                    id="textContent"
                    name="textContent"
                    rows="6"
                    value={lectureFormData.textContent || ""}
                    onChange={handleLectureFormChange}
                    placeholder="Enter your lecture content here..."
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200 resize-vertical"
                    required={lectureFormData.type === "text"}
                    disabled={submitting}
                    aria-describedby="textContent-error"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <svg
                    className="absolute left-3 top-4 w-4 h-4 text-[#4A8292] pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 4h13M3 8h13M3 12h6m-6 4h6"
                    />
                  </svg>
                </div>
              </div>
            )}
            {lectureFormData.type === "video" && (
              <div>
                <label
                  htmlFor="duration"
                  className="block text-[#1B3C53] text-sm font-semibold mb-2"
                >
                  Duration (seconds)
                </label>
                <div className="relative">
                  <input
                    key="duration-input"
                    type="number"
                    id="duration"
                    name="duration"
                    value={lectureFormData.duration || ""}
                    onChange={handleLectureFormChange}
                    min="0"
                    step="1"
                    placeholder="Duration in seconds"
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                    required={lectureFormData.type === "video"}
                    disabled={submitting}
                    aria-describedby="duration-error"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            )}
            {lectureFormData.type === "quiz" && !currentLecture && (
              <div className="bg-[#F0F9FF] p-4 rounded-lg border border-[#0EA5E9]">
                <p className="text-[#0369A1] text-sm flex items-center mb-3">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  After creating this quiz lecture, you can immediately create
                  quiz questions.
                </p>
                <p className="text-[#0369A1] text-xs">
                  You'll be able to create quiz questions after saving this
                  lecture.
                </p>
              </div>
            )}
            {lectureFormData.type === "assignment" && !currentLecture && (
              <p className="text-[#D97706] text-sm flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
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
                Note: After creating this assignment lecture, go to the Course
                Learning page to define assignment details.
              </p>
            )}
            {currentLecture && lectureFormData.type === "quiz" && (
              <div className="mt-4">
                {currentLecture.quizId ? (
                  <div>
                    <h4 className="text-base font-semibold text-[#1B3C53] mb-2">
                      Quiz Preview
                    </h4>
                    <QuizComponent
                      quizId={currentLecture.quizId}
                      onQuizComplete={() => {}}
                      showModal={showModal}
                    />
                  </div>
                ) : (
                  <div className="bg-[#FEF3C7] p-4 rounded-lg border border-[#F59E0B]">
                    <h4 className="text-base font-semibold text-[#92400E] mb-2">
                      No Quiz Created Yet
                    </h4>
                    <p className="text-[#92400E] text-sm mb-3">
                      This quiz lecture doesn't have any questions yet. Create a
                      quiz to add questions.
                    </p>
                    <Button
                      text="Create Quiz Questions"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleCreateQuizForLecture(currentLecture._id);
                      }}
                      className="px-4 py-2 bg-[#F59E0B] text-white hover:bg-[#D97706] rounded-md font-medium transition-all duration-200"
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>
            )}
            {currentLecture &&
              lectureFormData.type === "assignment" &&
              currentLecture.assignmentSubmissionId && (
                <div className="mt-4">
                  <h4 className="text-base font-semibold text-[#1B3C53] mb-2">
                    Assignment Preview/Link
                  </h4>
                  <AssignmentComponent
                    lectureId={currentLecture._id}
                    onAssignmentComplete={() => {}}
                    showModal={showModal}
                  />
                </div>
              )}
            <div>
              <label
                htmlFor="lectureOrder"
                className="block text-[#1B3C53] text-sm font-semibold mb-2"
              >
                Order (Position)
              </label>
              <div className="relative">
                <input
                  key="lecture-order-input"
                  type="number"
                  id="lectureOrder"
                  name="order"
                  value={lectureFormData.order || ""}
                  onChange={handleLectureFormChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#9CA3AF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-colors duration-200"
                  required
                  disabled={submitting}
                  aria-describedby="lectureOrder-error"
                  autoComplete="off"
                  spellCheck="false"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4A8292] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              </div>
            </div>
            <div>
              <label className="flex items-center text-[#1B3C53] text-sm font-semibold">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={lectureFormData.isPublished}
                  onChange={handleLectureFormChange}
                  className="mr-2 accent-[#4A8292] focus:ring-[#4A8292]"
                  disabled={submitting}
                  aria-label="Publish lecture"
                />
                Published (Visible to students)
              </label>
            </div>
            <Button
              text={submitting ? "Saving..." : "Save Lecture"}
              type="submit"
              className="w-full px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
              disabled={submitting}
              aria-label="Save lecture"
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
              {submitting ? "Saving..." : "Save Lecture"}
            </Button>
          </form>
        </Modal>

        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            setSubmitting(false);
          }}
          title={`Confirm Delete ${confirmModal.itemType}`}
          message={`Are you sure you want to delete "${confirmModal.itemTitle}"? This will also delete all associated content (e.g., lectures in a section, quizzes/submissions in a lecture). This action cannot be undone.`}
          type="warning"
          loading={submitting}
        >
          <div className="flex justify-center space-x-4 mt-4">
            <Button
              text="Cancel"
              onClick={() => {
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                setSubmitting(false);
              }}
              className="px-6 py-2 bg-[#E5E7EB] text-[#1B3C53] hover:bg-[#D1D5DB] rounded-md font-medium transition-all duration-200"
              aria-label="Cancel deletion"
            />
            <Button
              text="Delete"
              onClick={() => {
                confirmModal.onConfirm();
              }}
              className="px-6 py-2 bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C] rounded-md font-medium transition-all duration-200 transform hover:scale-105"
              aria-label={`Confirm delete ${confirmModal.itemType}`}
              disabled={submitting}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </Button>
          </div>
        </Modal>

        {/* Quiz Creator Modal */}
        <Modal
          isOpen={showQuizCreator}
          onClose={() => {
            console.log(" Quiz creator modal closing");
            setShowQuizCreator(false);
            setCurrentQuizLecture(null);
          }}
          title="Create Quiz"
          type="info"
          size="large"
        >
          {currentQuizLecture ? (
            <>
              {console.log(
                "Rendering QuizCreator for lecture:",
                currentQuizLecture
              )}
              <QuizCreator
                lectureId={currentQuizLecture}
                courseId={courseId}
                onQuizCreated={handleQuizCreated}
              />
            </>
          ) : (
            <>
              {console.log(" No currentQuizLecture, not rendering QuizCreator")}
              <div>No lecture selected</div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default InstructorCourseContentPage;
