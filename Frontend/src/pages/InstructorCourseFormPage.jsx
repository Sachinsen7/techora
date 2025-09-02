import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, selectAuthLoading } from "../Redux/slices/authSlice";
import { showModal } from "../Redux/slices/uiSlice";
import {
  createCourse,
  updateInstructorCourse,
  getInstructorCourses,
  getAllCategories,
} from "../services/api";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import { PROTECTED_ROUTES } from "../routes";

function InstructorCourseFormPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const authLoading = useSelector(selectAuthLoading);
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    price: "",
    category: "",
    status: "draft",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "instructor")) {
      navigate(PROTECTED_ROUTES.dashboard, { replace: true });
      dispatch(
        showModal({
          title: "Access Denied",
          message: "You must be an instructor to manage courses.",
          type: "error",
        })
      );
    }
  }, [authLoading, user, navigate, dispatch]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "instructor") {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoryData = await getAllCategories();
        setCategories(categoryData.categories || []);

        if (courseId) {
          setIsEditMode(true);
          const instructorCoursesData = await getInstructorCourses();
          const courseToEdit = instructorCoursesData.courses.find(
            (c) => c._id === courseId
          );

          if (courseToEdit) {
            setFormData({
              title: courseToEdit.title,
              description: courseToEdit.description,
              imageUrl: courseToEdit.imageUrl,
              price: courseToEdit.price.toString(),
              category:
                courseToEdit.category?._id ||
                categoryData.categories[0]?._id ||
                "",
              status: courseToEdit.status,
            });
          } else {
            setError("Course not found or you don't own it.");
          }
        } else {
          if (categoryData.categories.length > 0) {
            setFormData((prev) => ({
              ...prev,
              category: prev.category || categoryData.categories[0]._id,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
        setError(err.message || "Failed to load form data.");
        dispatch(
          showModal({
            title: "Error",
            message: err.message || "Failed to load form data.",
            type: "error",
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user, authLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Input changed:", name, value);

    if (name === "price") {
      if (/^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);

    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        console.error("Invalid file type:", file.type);
        dispatch(
          showModal({
            title: "Invalid File Type",
            message:
              "Please select a valid image file (JPEG, PNG, GIF, or WebP).",
            type: "error",
          })
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        console.error("File too large:", file.size);
        dispatch(
          showModal({
            title: "File Too Large",
            message: "Please select an image smaller than 10MB.",
            type: "error",
          })
        );
        return;
      }

      console.log(
        "File validation passed. Setting selected file:",
        file.name,
        "Size:",
        file.size,
        "Type:",
        file.type
      );
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("Preview URL created successfully");
        setPreviewUrl(e.target.result);
      };
      reader.onerror = (e) => {
        console.error("FileReader error:", e);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No file selected");
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation
    if (!formData.title || formData.title.length < 5) {
      setError("Title must be at least 5 characters long.");
      setSubmitting(false);
      return;
    }
    if (!formData.description || formData.description.length < 20) {
      setError("Description must be at least 20 characters long.");
      setSubmitting(false);
      return;
    }
    if (!formData.category) {
      setError("Please select a category.");
      setSubmitting(false);
      return;
    }
    const price = Number(formData.price) || 0;
    if (price < 0) {
      setError("Price must be a non-negative number.");
      setSubmitting(false);
      return;
    }

    try {
      let response;

      if (isEditMode) {
        if (selectedFile) {
          const formDataToSubmit = new FormData();
          formDataToSubmit.append("courseId", courseId);
          formDataToSubmit.append("title", formData.title);
          formDataToSubmit.append("description", formData.description);
          formDataToSubmit.append("price", price);
          formDataToSubmit.append("category", formData.category);
          formDataToSubmit.append("status", formData.status);
          formDataToSubmit.append("courseImage", selectedFile);

          response = await fetch(
            `https://techora-1.onrender.com/api/instructor/course`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formDataToSubmit,
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update course");
          }

          response = await response.json();
        } else {
          const dataToSubmit = {
            courseId,
            title: formData.title,
            description: formData.description,
            price,
            category: formData.category,
            status: formData.status,
          };
          response = await updateInstructorCourse(courseId, dataToSubmit);
        }

        dispatch(
          showModal({
            title: "Course Updated!",
            message: `${formData.title} has been updated successfully.`,
            type: "success",
          })
        );
      } else {
        // For creation, always use FormData
        const formDataToSubmit = new FormData();
        formDataToSubmit.append("title", formData.title);
        formDataToSubmit.append("description", formData.description);
        formDataToSubmit.append("price", price);
        formDataToSubmit.append("category", formData.category);
        formDataToSubmit.append("status", formData.status);

        if (selectedFile) {
          console.log("Appending course image to FormData:", selectedFile.name);
          formDataToSubmit.append("courseImage", selectedFile);
        } else {
          console.log("No course image selected");
        }

        // Debug FormData contents
        console.log("FormData contents:");
        for (let [key, value] of formDataToSubmit.entries()) {
          console.log(key, value);
        }

        console.log("Sending POST request to create course...");
        response = await fetch(
          `https://techora-1.onrender.com/api/instructor/course`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataToSubmit,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create course");
        }

        response = await response.json();

        dispatch(
          showModal({
            title: "Course Created!",
            message: `${formData.title} has been created successfully.`,
            type: "success",
          })
        );
      }
      navigate(PROTECTED_ROUTES.instructor, { replace: true });
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to save course.");
      dispatch(
        showModal({
          title: "Submission Failed",
          message: err.message || "Could not save course.",
          type: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <Loader />;
  if (error && !courseId)
    return (
      <div className="text-[#DC2626] text-center p-8 text-xl font-medium">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-8 px-4 font-sans">
      <div className="container mx-auto max-w-3xl">
        <header className="relative mb-10">
          <h1 className="text-3xl font-bold text-[#1B3C53] text-center tracking-tight">
            {isEditMode ? "Edit Course" : "Create New Course"}
          </h1>
          <p className="text-[#6B7280] text-center mt-2 max-w-lg mx-auto">
            {isEditMode
              ? "Update your course details to keep it engaging."
              : "Craft a new course to share your expertise."}
          </p>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-[#4A8292] rounded-full"></div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-[#FFF1F2] border-l-4 border-[#DC2626] text-[#DC2626] rounded-md flex items-center">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="bg-[#F9FAFB] p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
            <legend className="text-[#1B3C53] text-lg font-semibold px-2 -mt-8 bg-[#FFFFFF] w-fit mx-auto">
              Course Details
            </legend>
            <div className="space-y-6">
              <div className="relative">
                <label
                  htmlFor="title"
                  className="block text-[#1B3C53] text-sm font-medium mb-2"
                >
                  Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Master React: From Basics to Advanced"
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] text-[#1B3C53] placeholder-[#6B7280] bg-[#FFFFFF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all duration-200"
                    required
                    disabled={submitting}
                    aria-describedby="title-error"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4A8292]"
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
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="description"
                  className="block text-[#1B3C53] text-sm font-medium mb-2"
                >
                  Description
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your course in detail (min 20 characters)..."
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] text-[#1B3C53] placeholder-[#6B7280] bg-[#FFFFFF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all duration-200"
                    required
                    disabled={submitting}
                    aria-describedby="description-error"
                  />
                  <svg
                    className="absolute left-3 top-4 w-5 h-5 text-[#4A8292]"
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
              </div>

              <div className="relative">
                <label className="block text-[#1B3C53] text-sm font-medium mb-2">
                  Course Image
                </label>

                <div className="mb-4">
                  <div className="w-full h-48 border-2 border-dashed border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB] flex items-center justify-center">
                    {previewUrl || (formData.imageUrl && !selectedFile) ? (
                      <img
                        src={
                          previewUrl ||
                          (formData.imageUrl?.startsWith("http")
                            ? formData.imageUrl
                            : `https://techora-1.onrender.com${formData.imageUrl}`)
                        }
                        alt="Course preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-[#6B7280]"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-[#6B7280]">
                          No image selected
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                    className="flex-1 bg-[#4A8292] text-white py-2 px-4 rounded-md hover:bg-[#1B3C53] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                  >
                    {selectedFile ? "Change Image" : "Upload Image"}
                  </button>

                  {(selectedFile || previewUrl) && (
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      disabled={submitting}
                      className="bg-[#DC2626] text-white py-2 px-4 rounded-md hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {selectedFile && (
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}

                <p className="mt-2 text-xs text-[#6B7280]">
                  Supported formats: JPEG, PNG, GIF, WebP. Max size: 10MB.
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset className="bg-[#F9FAFB] p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
            <legend className="text-[#1B3C53] text-lg font-semibold px-2 -mt-8 bg-[#FFFFFF] w-fit mx-auto">
              Pricing & Category
            </legend>
            <div className="space-y-6">
              <div className="relative">
                <label
                  htmlFor="price"
                  className="block text-[#1B3C53] text-sm font-medium mb-2"
                >
                  Price (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 999.99"
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] text-[#1B3C53] placeholder-[#6B7280] bg-[#FFFFFF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all duration-200"
                    required
                    disabled={submitting}
                    aria-describedby="price-error"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4A8292]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <label
                  htmlFor="category"
                  className="block text-[#1B3C53] text-sm font-medium mb-2"
                >
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] text-[#1B3C53] bg-[#FFFFFF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all duration-200 appearance-none"
                    required
                    disabled={submitting || categories.length === 0}
                    aria-describedby="category-error"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4A8292]"
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]"
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
                {categories.length === 0 && (
                  <p className="text-[#D97706] text-xs mt-2 flex items-center">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    No categories available. Please ask an admin to create some.
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="bg-[#F9FAFB] p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
            <legend className="text-[#1B3C53] text-lg font-semibold px-2 -mt-8 bg-[#FFFFFF] w-fit mx-auto">
              Course Status
            </legend>
            <div className="relative">
              <label
                htmlFor="status"
                className="block text-[#1B3C53] text-sm font-medium mb-2"
              >
                Status
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] text-[#1B3C53] bg-[#FFFFFF] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed transition-all duration-200 appearance-none"
                  required
                  disabled={submitting}
                  aria-describedby="status-error"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4A8292]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 12l2 2 4-4M7.835 4.697a3.5 3.5 0 005.33 0l.335-.334a3.5 3.5 0 015 5l-5.835 5.836a.5.5 0 01-.707 0L5.835 9.363a3.5 3.5 0 010-4.95l.335-.334a3.5 3.5 0 015 0"
                  />
                </svg>
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]"
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
          </fieldset>

          <Button
            text={
              submitting
                ? "Saving..."
                : isEditMode
                ? "Update Course"
                : "Create Course"
            }
            onClick={handleSubmit}
            className="w-full px-6 py-3 bg-[#1B3C53] text-white hover:bg-[#456882] transition-all duration-200 ease-in-out transform hover:scale-105 rounded-md font-semibold text-base shadow-md"
            disabled={submitting || categories.length === 0}
            aria-label={
              isEditMode ? "Update course details" : "Create new course"
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
            {submitting
              ? "Saving..."
              : isEditMode
              ? "Update Course"
              : "Create Course"}
          </Button>
        </form>
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
        fieldset {
          animation: fadeIn 0.5s ease-in-out both;
        }
      `}</style>
    </div>
  );
}

export default InstructorCourseFormPage;
