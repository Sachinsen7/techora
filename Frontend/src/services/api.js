import axios from "axios";
import { API_BASE_URL } from "../utils/constant";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const parseApiResponse = (response) => {
  if (!response.data || !response.data.message) {
    throw new Error("Invalid API response format.");
  }
  return response.data;
};

const handleApiError = (
  error,
  defaultMessage = "An unexpected error occurred."
) => {
  if (error.response) {
    return new Error(error.response.data.message || defaultMessage);
  } else if (error.request) {
    return new Error(
      "No response from server. Please check your network connection."
    );
  } else {
    return new Error(error.message || defaultMessage);
  }
};

// --- AUTHENTICATION API CALLS ---

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/signup", userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to register user.");
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await api.post("/auth/signin", userData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Login failed.");
  }
};

// --- USER API CALLS ---

export const getUserProfile = async () => {
  try {
    const response = await api.get("/user/profile");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch user profile.");
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    const response = await api.put("/user/profile", updateData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update user profile.");
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put("/user/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to change password.");
  }
};

// --- WISHLIST API CALLS ---

export const getWishlist = async () => {
  try {
    const response = await api.get("/user/wishlist");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch wishlist.");
  }
};

export const addToWishlist = async (courseId) => {
  try {
    const response = await api.post("/user/wishlist", { courseId });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to add course to wishlist.");
  }
};

export const removeFromWishlist = async (courseId) => {
  try {
    const response = await api.delete(`/user/wishlist/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to remove course from wishlist.");
  }
};

export const checkWishlistStatus = async (courseId) => {
  try {
    const response = await api.get(`/user/wishlist/check/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to check wishlist status.");
  }
};

// --- COURSE  API CALLS ---

export const getCourses = async (filters = {}) => {
  try {
    const response = await api.get("/search/courses", { params: filters });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch courses.");
  }
};

export const getCourseById = async (id) => {
  try {
    const response = await api.get(`/search/courses/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch course details.");
  }
};

export const enrollInCourse = async (courseId) => {
  try {
    const response = await api.post("/enrollment/enroll", { courseId });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Enrollment failed.");
  }
};

export const getPurchasedCourses = async () => {
  try {
    const response = await api.get("/enrollment/purchased-courses");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch purchased courses.");
  }
};

export const getEnrolledCourseDetails = async (courseId) => {
  try {
    const response = await api.get(`/enrollment/purchased-courses/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch enrolled course details.");
  }
};

export const updateLectureProgress = async (
  lectureId,
  isCompleted,
  lastWatchedPosition
) => {
  try {
    const response = await api.post("/enrollment/lecture-progress", {
      lectureId,
      isCompleted,
      lastWatchedPosition,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update lecture progress.");
  }
};

export const getCourseProgress = async (courseId) => {
  try {
    const response = await api.get(`/enrollment/course-progress/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch course progress.");
  }
};

export const getQuizForLearner = async (quizId) => {
  try {
    const response = await api.get(`/enrollment/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch quiz.");
  }
};

export const submitQuizAnswers = async (quizId, answers) => {
  try {
    const response = await api.post(`/enrollment/quiz/${quizId}/submit`, {
      answers,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to submit quiz.");
  }
};

export const getQuizAttempts = async (quizId) => {
  try {
    const response = await api.get(`/enrollment/quiz/${quizId}/attempts`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch quiz attempts.");
  }
};

// Instructor Quiz Management
export const createQuiz = async (quizData) => {
  try {
    console.log(
      " API: Making createQuiz request to /instructor/quiz with data:",
      quizData
    );
    const response = await api.post("/instructor/quiz", quizData);
    console.log("API: createQuiz response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API: createQuiz error:", error);
    console.error("API: createQuiz error response:", error.response?.data);
    throw handleApiError(error, "Failed to create quiz.");
  }
};

export const createQuestion = async (questionData) => {
  try {
    const response = await api.post("/instructor/question", questionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to create question.");
  }
};

export const getQuizForInstructor = async (quizId) => {
  try {
    const response = await api.get(`/instructor/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch quiz for instructor.");
  }
};

export const updateQuiz = async (quizId, quizData) => {
  try {
    const response = await api.put(`/instructor/quiz/${quizId}`, quizData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update quiz.");
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const response = await api.delete(`/instructor/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to delete quiz.");
  }
};

export const submitAssignment = async (lectureId, submissionData) => {
  try {
    const response = await api.post(
      `/enrollment/assignment/${lectureId}/submit`,
      submissionData
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to submit assignment.");
  }
};

export const getAssignmentSubmission = async (lectureId) => {
  try {
    const response = await api.get(
      `/enrollment/assignment/${lectureId}/my-submission`
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch assignment submission.");
  }
};

// --- REVIEWS API CALLS ---

export const addReview = async (courseId, reviewData) => {
  try {
    const response = await api.post("/review/add", { courseId, ...reviewData });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to add review.");
  }
};

export const getReviews = async (courseId) => {
  try {
    const response = await api.get(`/review/course/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch reviews.");
  }
};

// --- PAYMENT API CALLS ---

export const processPayment = async (courseId, paymentDetails) => {
  try {
    const response = await api.post("/payment/process", {
      courseId,
      paymentDetails,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Payment failed.");
  }
};

// --- INSTRUCTOR API CALLS ---

// Function to create a new course
export const createCourse = async (courseData) => {
  try {
    const response = await api.post("/instructor/course", courseData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to create course.");
  }
};

// Function to get all courses created by the instructor
export const getInstructorCourses = async () => {
  try {
    const response = await api.get("/instructor/my-courses");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch instructor's courses.");
  }
};

// Function to update a course by instructor
export const updateInstructorCourse = async (courseId, updateData) => {
  try {
    const response = await api.put("/instructor/course", {
      courseId,
      ...updateData,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update course.");
  }
};

// Function to delete a course by instructor
export const deleteInstructorCourse = async (courseId) => {
  try {
    const response = await api.delete(`/instructor/course/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to delete course.");
  }
};

// Section Management
export const createSection = async (sectionData) => {
  try {
    const payload = {
      courseId: String(sectionData.courseId),
      title: sectionData.title,
      order: Number(sectionData.order) || 0,
    };
    console.log(
      "Creating section with payload:",
      JSON.stringify(payload, null, 2)
    );
    const response = await api.post("/instructor/section", payload);
    console.log(
      "Create section response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating section:",
      error.response?.data || error.message
    );
    throw handleApiError(error, "Failed to create section.");
  }
};

export const getSectionsForCourse = async (courseId) => {
  try {
    const response = await api.get(`/instructor/sections/${courseId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch sections for course.");
  }
};

export const updateSection = async (sectionId, updateData) => {
  try {
    const response = await api.put(
      `/instructor/section/${sectionId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update section.");
  }
};

export const deleteSection = async (sectionId) => {
  try {
    const response = await api.delete(`/instructor/section/${sectionId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to delete section.");
  }
};

// LECTURE MANAGEMENT
export const createLecture = async (courseId, sectionId, lectureData) => {
  try {
    const payload = {
      ...lectureData,
      courseId: String(courseId),
      sectionId: String(sectionId),
      order: Number(lectureData.order) || 0,
      duration:
        lectureData.type === "video"
          ? Number(lectureData.duration) || 0
          : undefined,
    };
    console.log(
      "Creating lecture with payload:",
      JSON.stringify(payload, null, 2)
    );
    const response = await api.post("/instructor/lecture", payload);
    console.log(
      "Create lecture response:",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error) {
    console.error("Error creating lecture:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw handleApiError(error, "Failed to create lecture.");
  }
};
export const getLectureDetails = async (lectureId) => {
  try {
    const response = await api.get(`/instructor/lecture/${lectureId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch lecture details.");
  }
};

export const updateLecture = async (lectureId, updateData) => {
  try {
    const response = await api.put(
      `/instructor/lecture/${lectureId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update lecture.");
  }
};

export const deleteLecture = async (lectureId) => {
  try {
    const response = await api.delete(`/instructor/lecture/${lectureId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to delete lecture.");
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get("/admin/users");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch all users.");
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.put("/admin/user/role", { userId, role });
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to update user role.");
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await api.post("/admin/category", categoryData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to create category.");
  }
};

export const getAllCategories = async () => {
  try {
    const response = await api.get("/admin/categories");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Failed to fetch categories.");
  }
};
