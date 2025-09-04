import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { showModal } from "../../Redux/slices/uiSlice";
import {
  createQuiz,
  createQuestion,
  getQuizForInstructor,
  updateLecture,
  deleteQuiz,
} from "../../services/api";
import Button from "../common/Button";
import Modal from "../common/Modal";

function QuizCreator({ lectureId, courseId, onQuizCreated }) {
  const dispatch = useDispatch();
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    passPercentage: 70,
    isPublished: false,
  });

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "multiple-choice",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    correctAnswer: "",
    points: 1,
    order: 0,
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState(null);
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [checkingExistingQuiz, setCheckingExistingQuiz] = useState(false);

  const checkExistingQuiz = useCallback(async () => {
    if (!lectureId) return;

    setCheckingExistingQuiz(true);
    try {
      const response = await getQuizForInstructor(lectureId);
      if (response && response.quiz) {
        setExistingQuiz(response.quiz);
        dispatch(
          showModal({
            title: "Quiz Already Exists",
            message: `This lecture already has a quiz titled "${response.quiz.title}". You can edit the existing quiz instead of creating a new one.`,
            type: "info",
            zIndex: 1200,
          })
        );
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error checking existing quiz:", error);
      }
    } finally {
      setCheckingExistingQuiz(false);
    }
  }, [lectureId, dispatch]);

  const handleDeleteExistingQuiz = useCallback(async () => {
    if (!existingQuiz) return;

    try {
      await deleteQuiz(existingQuiz._id);
      setExistingQuiz(null);
      dispatch(
        showModal({
          title: "Quiz Deleted",
          message:
            "The existing quiz has been deleted. You can now create a new quiz.",
          type: "success",
          zIndex: 1200,
        })
      );
    } catch (error) {
      console.error("Error deleting quiz:", error);
      dispatch(
        showModal({
          title: "Deletion Failed",
          message: error.message || "Failed to delete the existing quiz.",
          type: "error",
          zIndex: 1200,
        })
      );
    }
  }, [existingQuiz, dispatch]);

  const questionTypes = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "short-answer", label: "Short Answer" },
  ];

  const handleQuizDataChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setQuizData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "passPercentage"
          ? Number(value) || 0
          : value,
    }));
  }, []);

  const handleQuestionChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "type") {
      if (value === "multiple-choice") {
        setCurrentQuestion((prev) => ({
          ...prev,
          type: value,
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
          correctAnswer: "",
        }));
      } else if (value === "short-answer") {
        setCurrentQuestion((prev) => ({
          ...prev,
          type: value,
          options: [],
          correctAnswer: "",
        }));
      } else if (value === "true-false") {
        setCurrentQuestion((prev) => ({
          ...prev,
          type: value,
          options: [],
          correctAnswer: "",
        }));
      }
    } else if (name === "trueFalseAnswer") {
      setCurrentQuestion((prev) => ({
        ...prev,
        correctAnswer: value,
      }));
    } else {
      setCurrentQuestion((prev) => ({
        ...prev,
        [name]: name === "points" ? Number(value) || 1 : value,
      }));
    }
  }, []);

  const handleOptionChange = useCallback((index, field, value) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  }, []);

  const addOption = useCallback(() => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...prev.options, { text: "", isCorrect: false }],
    }));
  }, []);

  const removeOption = useCallback(
    (index) => {
      if (currentQuestion.options.length > 2) {
        setCurrentQuestion((prev) => ({
          ...prev,
          options: prev.options.filter((_, i) => i !== index),
        }));
      }
    },
    [currentQuestion.options.length]
  );

  const handleAddQuestion = useCallback(() => {
    setCurrentQuestion({
      text: "",
      type: "multiple-choice",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      points: 1,
      order: questions.length,
    });
    setEditingQuestionIndex(-1);
    setShowQuestionForm(true);
  }, [questions.length]);

  const handleEditQuestion = useCallback(
    (index) => {
      setCurrentQuestion(questions[index]);
      setEditingQuestionIndex(index);
      setShowQuestionForm(true);
    },
    [questions]
  );

  const handleSaveQuestion = useCallback(() => {
    if (!currentQuestion.text.trim()) {
      dispatch(
        showModal({
          title: "Validation Error",
          message: "Question text is required.",
          type: "error",
          zIndex: 1200,
        })
      );
      return;
    }

    if (currentQuestion.text.trim().length < 5) {
      dispatch(
        showModal({
          title: "Validation Error",
          message: "Question text must be at least 5 characters long.",
          type: "error",
          zIndex: 1200,
        })
      );
      return;
    }

    if (currentQuestion.type === "multiple-choice") {
      const validOptions = currentQuestion.options.filter((opt) =>
        opt.text.trim()
      );

      if (validOptions.length < 2) {
        dispatch(
          showModal({
            title: "Validation Error",
            message: "Multiple choice questions need at least 2 options.",
            type: "error",
            zIndex: 1200,
          })
        );
        return;
      }

      const shortOptions = validOptions.filter(
        (opt) => opt.text.trim().length < 2
      );
      if (shortOptions.length > 0) {
        dispatch(
          showModal({
            title: "Validation Error",
            message: "Each option must be at least 2 characters long.",
            type: "error",
            zIndex: 1200,
          })
        );
        return;
      }

      const correctOptions = validOptions.filter((opt) => opt.isCorrect);

      if (correctOptions.length === 0) {
        dispatch(
          showModal({
            title: "Validation Error",
            message: "Please mark at least one correct answer.",
            type: "error",
            zIndex: 1200,
          })
        );
        return;
      }
    }

    if (currentQuestion.type === "true-false") {
      if (
        !currentQuestion.correctAnswer ||
        (currentQuestion.correctAnswer !== "true" &&
          currentQuestion.correctAnswer !== "false")
      ) {
        dispatch(
          showModal({
            title: "Validation Error",
            message: "Please select the correct answer (True or False).",
            type: "error",
            zIndex: 1200,
          })
        );
        return;
      }
    }

    if (currentQuestion.type === "short-answer") {
      if (!currentQuestion.correctAnswer.trim()) {
        dispatch(
          showModal({
            title: "Validation Error",
            message:
              "Please provide the correct answer for short answer questions.",
            type: "error",
            zIndex: 1200,
          })
        );
        return;
      }

      if (currentQuestion.correctAnswer.trim().length < 1) {
        dispatch(
          showModal({
            title: "Validation Error",
            message: "The correct answer must be at least 1 character long.",
            type: "error",
            zIndex: 1200,
          })
        );
        return;
      }
    }

    const questionToSave = {
      ...currentQuestion,
      options:
        currentQuestion.type === "multiple-choice"
          ? currentQuestion.options.filter((opt) => opt.text.trim())
          : [],
    };

    if (editingQuestionIndex >= 0) {
      setQuestions((prev) =>
        prev.map((q, i) => (i === editingQuestionIndex ? questionToSave : q))
      );
      dispatch(
        showModal({
          title: "Question Updated",
          message: "Question has been successfully updated!",
          type: "success",
          zIndex: 1200,
        })
      );
    } else {
      setQuestions((prev) => [...prev, questionToSave]);
      dispatch(
        showModal({
          title: "Question Added",
          message: "Question has been successfully added to the quiz!",
          type: "success",
          zIndex: 1200,
        })
      );
    }

    setCurrentQuestion({
      text: "",
      type: "multiple-choice",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      points: 1,
      order: 0,
    });
    setEditingQuestionIndex(-1);
    setShowQuestionForm(false);
  }, [currentQuestion, editingQuestionIndex, dispatch]);

  const handleDeleteQuestion = useCallback((index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreateQuiz = useCallback(async () => {
    if (!quizData.title.trim()) {
      dispatch(
        showModal({
          title: "Validation Error",
          message: "Quiz title is required.",
          type: "error",
          zIndex: 1200,
        })
      );
      return;
    }

    if (quizData.title.trim().length < 3) {
      dispatch(
        showModal({
          title: "Validation Error",
          message: "Quiz title must be at least 3 characters long.",
          type: "error",
          zIndex: 1200,
        })
      );
      return;
    }

    if (questions.length === 0) {
      dispatch(
        showModal({
          title: "Validation Error",
          message: "Please add at least one question to the quiz.",
          type: "error",
          zIndex: 1200,
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const quizPayload = {
        lectureId,
        title: quizData.title,
        description: quizData.description,
        passPercentage: quizData.passPercentage,
        isPublished: quizData.isPublished,
      };

      const quizResponse = await createQuiz(quizPayload);
      const quizId = quizResponse.quiz._id;
      setCreatedQuizId(quizId);

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionPayload = {
          quizId,
          text: question.text,
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          points: question.points,
          order: i,
        };

        await createQuestion(questionPayload);
      }

      try {
        await updateLecture(lectureId, { quizId });
      } catch (updateError) {
        console.error("Failed to update lecture with quiz ID:", updateError);
      }

      dispatch(
        showModal({
          title: "Quiz Created",
          message: "Quiz and questions created successfully!",
          type: "success",
          zIndex: 1200,
        })
      );

      onQuizCreated(quizId);
    } catch (error) {
      let errorMessage = "Failed to create quiz.";
      let errorTitle = "Creation Failed";

      if (error.response?.status === 409) {
        errorTitle = "Quiz Already Exists";
        errorMessage =
          'This lecture already has a quiz associated with it. Please use the "Check Existing Quiz" button to see the existing quiz and choose to delete it if you want to create a new one.';
        checkExistingQuiz();
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch(
        showModal({
          title: errorTitle,
          message: errorMessage,
          type: "error",
          zIndex: 1200,
        })
      );
    } finally {
      setSubmitting(false);
    }
  }, [quizData, questions, lectureId, dispatch, onQuizCreated]);

  const hasUnsavedChanges = useCallback(() => {
    if (editingQuestionIndex >= 0) {
      const originalQuestion = questions[editingQuestionIndex];
      return (
        currentQuestion.text !== originalQuestion.text ||
        currentQuestion.type !== originalQuestion.type ||
        currentQuestion.points !== originalQuestion.points ||
        currentQuestion.correctAnswer !== originalQuestion.correctAnswer ||
        JSON.stringify(currentQuestion.options) !==
          JSON.stringify(originalQuestion.options)
      );
    } else {
      return (
        currentQuestion.text.trim() !== "" ||
        currentQuestion.correctAnswer.trim() !== "" ||
        currentQuestion.options.some((opt) => opt.text.trim() !== "")
      );
    }
  }, [currentQuestion, questions, editingQuestionIndex]);

  const handleQuestionFormClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close without saving?"
      );
      if (!confirmClose) {
        return;
      }
    }

    setCurrentQuestion({
      text: "",
      type: "multiple-choice",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "",
      points: 1,
      order: 0,
    });
    setEditingQuestionIndex(-1);
    setShowQuestionForm(false);
  }, [hasUnsavedChanges]);

  return (
    <div className="bg-[#F9FAFB] p-6 rounded-md border border-[#E5E7EB] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-serif font-bold text-[#1B3C53]">
          Create Quiz
        </h3>
        <Button
          text={checkingExistingQuiz ? "Checking..." : "Check Existing Quiz"}
          onClick={checkExistingQuiz}
          className="px-4 py-2 bg-[#4A8292] text-[#FFFFFF] hover:bg-[#456882] rounded-md text-sm"
          disabled={checkingExistingQuiz || !lectureId}
        />
      </div>

      {existingQuiz && (
        <div className="mb-6 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-[#6B7280]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-[#1B3C53]">
                Quiz Already Exists
              </h3>
              <div className="mt-2 text-sm text-[#6B7280]">
                <p>
                  This lecture already has a quiz titled "{existingQuiz.title}".
                </p>
                <p className="mt-1">Choose an option below:</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  text="Delete & Create New"
                  onClick={handleDeleteExistingQuiz}
                  className="px-3 py-1 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md text-sm"
                  disabled={submitting}
                />
                <Button
                  text="Cancel"
                  onClick={() => setExistingQuiz(null)}
                  className="px-3 py-1 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#E5E7EB] rounded-md text-sm"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="quizTitle"
            className="block text-[#1B3C53] text-sm font-semibold mb-2"
          >
            Quiz Title
          </label>
          <input
            type="text"
            id="quizTitle"
            name="title"
            value={quizData.title}
            onChange={handleQuizDataChange}
            placeholder="Enter quiz title..."
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#6B7280]"
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="quizDescription"
            className="block text-[#1B3C53] text-sm font-semibold mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="quizDescription"
            name="description"
            value={quizData.description}
            onChange={handleQuizDataChange}
            placeholder="Enter quiz description..."
            rows="3"
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#6B7280] resize-vertical"
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-[#1B3C53]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-[#1B3C53]">
                Quiz Requirements
              </h3>
              <div className="mt-2 text-sm text-[#6B7280]">
                <ul className="list-disc list-inside space-y-1">
                  <li>Quiz title must be at least 3 characters long</li>
                  <li>Question text must be at least 5 characters long</li>
                  <li>
                    Multiple choice options must be at least 2 characters long
                  </li>
                  <li>At least one question is required</li>
                  <li>
                    Multiple choice questions need at least 2 options with one
                    correct answer
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="passPercentage"
              className="block text-[#1B3C53] text-sm font-semibold mb-2"
            >
              Pass Percentage
            </label>
            <input
              type="number"
              id="passPercentage"
              name="passPercentage"
              value={quizData.passPercentage}
              onChange={handleQuizDataChange}
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53]"
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center text-[#1B3C53] text-sm font-semibold">
              <input
                type="checkbox"
                name="isPublished"
                checked={quizData.isPublished}
                onChange={handleQuizDataChange}
                className="mr-2 accent-[#4A8292] focus:ring-[#4A8292]"
                disabled={submitting}
              />
              Published (Visible to students)
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] pt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-serif font-bold text-[#1B3C53]">
            Questions ({questions.length})
          </h4>
          <Button
            text="Add Question"
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-[#4A8292] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-medium transition-all duration-200"
            disabled={submitting}
          />
        </div>

        {questions.length === 0 ? (
          <p className="text-[#6B7280] text-center py-8">
            No questions added yet. Click "Add Question" to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="bg-[#FFFFFF] p-4 rounded-md border border-[#E5E7EB]"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-[#1B3C53]">
                    {index + 1}. {question.text} ({question.type})
                  </h5>
                  <div className="flex space-x-2">
                    <Button
                      text="Edit"
                      onClick={() => handleEditQuestion(index)}
                      className="px-3 py-1 text-xs bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#E5E7EB] rounded-md"
                      disabled={submitting}
                    />
                    <Button
                      text="Delete"
                      onClick={() => handleDeleteQuestion(index)}
                      className="px-3 py-1 text-xs bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {question.type === "multiple-choice" && (
                  <ul className="text-sm text-[#6B7280] ml-4">
                    {question.options.map((option, optIndex) => (
                      <li
                        key={optIndex}
                        className={
                          option.isCorrect ? "text-[#4A8292] font-medium" : ""
                        }
                      >
                        • {option.text} {option.isCorrect && "(Correct)"}
                      </li>
                    ))}
                  </ul>
                )}

                {question.type === "short-answer" && (
                  <p className="text-sm text-[#4A8292] ml-4 font-medium">
                    Correct Answer: {question.correctAnswer}
                  </p>
                )}

                <p className="text-xs text-[#6B7280] mt-2">
                  Points: {question.points}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E7EB] pt-6 mt-6">
        {existingQuiz ? (
          <div className="text-center">
            <p className="text-sm text-[#6B7280] mb-4">
              A quiz already exists for this lecture. Please use the options
              above to manage the existing quiz.
            </p>
            <Button
              text="Check Existing Quiz Again"
              onClick={checkExistingQuiz}
              className="px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#E5E7EB] rounded-md"
              disabled={checkingExistingQuiz}
            />
          </div>
        ) : (
          <Button
            text={submitting ? "Creating Quiz..." : "Create Quiz"}
            onClick={handleCreateQuiz}
            className="w-full px-6 py-3 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
            disabled={submitting || questions.length === 0}
          />
        )}
      </div>

      <Modal
        isOpen={showQuestionForm}
        onClose={handleQuestionFormClose}
        title={editingQuestionIndex >= 0 ? "Edit Question" : "Add New Question"}
        type="info"
        zIndex={1100}
        modalId="question-form-modal"
      >
        <div
          className="max-h-[70vh] overflow-y-auto px-2"
          onClick={(e) => e.stopPropagation()} // Extra safety to prevent clicks from closing modal
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1B3C53]">
                  {editingQuestionIndex >= 0
                    ? "Edit Question"
                    : "Add New Question"}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Fill in all required fields and click "Add Question" to save
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuestionFormClose();
                }}
                className="text-[#6B7280] hover:text-[#1B3C53] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A8292] p-1 rounded-md"
                aria-label="Close question form"
                type="button"
                disabled={submitting}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div>
              <label
                htmlFor="questionText"
                className="block text-[#1B3C53] text-sm font-semibold mb-2"
              >
                Question Text
              </label>
              <textarea
                id="questionText"
                name="text"
                value={currentQuestion.text}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    text: e.target.value,
                  })
                }
                placeholder="Enter your question..."
                className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#6B7280]"
                disabled={submitting}
                autoFocus
                rows="4"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="questionType"
                  className="block text-[#1B3C53] text-sm font-semibold mb-2"
                >
                  Question Type
                </label>
                <select
                  id="questionType"
                  name="type"
                  value={currentQuestion.type}
                  onChange={handleQuestionChange}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] appearance-none"
                  disabled={submitting}
                >
                  {questionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="questionPoints"
                  className="block text-[#1B3C53] text-sm font-semibold mb-2"
                >
                  Points
                </label>
                <input
                  type="number"
                  id="questionPoints"
                  name="points"
                  value={currentQuestion.points}
                  onChange={handleQuestionChange}
                  min="1"
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53]"
                  disabled={submitting}
                  autoComplete="off"
                />
              </div>
            </div>

            {currentQuestion.type === "multiple-choice" && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[#1B3C53] text-sm font-semibold">
                    Answer Options
                  </label>
                  <Button
                    text="Add Option"
                    onClick={addOption}
                    className="px-3 py-1 text-xs bg-[#4A8292] text-[#FFFFFF] hover:bg-[#456882] rounded-md"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "isCorrect",
                            e.target.checked
                          )
                        }
                        className="accent-[#4A8292] focus:ring-[#4A8292]"
                        disabled={submitting}
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          handleOptionChange(index, "text", e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#6B7280]"
                        disabled={submitting}
                        autoComplete="off"
                      />
                      {currentQuestion.options.length > 2 && (
                        <Button
                          text="×"
                          onClick={() => removeOption(index)}
                          className="px-2 py-1 text-sm bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md"
                          disabled={submitting}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#6B7280] mt-2">
                  Check the box next to correct answers
                </p>
              </div>
            )}

            {currentQuestion.type === "true-false" && (
              <div>
                <label className="block text-[#1B3C53] text-sm font-semibold mb-2">
                  Correct Answer
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="trueFalseAnswer"
                      value="true"
                      checked={currentQuestion.correctAnswer === "true"}
                      onChange={handleQuestionChange}
                      className="mr-2 accent-[#4A8292]"
                      disabled={submitting}
                    />
                    <span className="text-[#1B3C53]">True</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="trueFalseAnswer"
                      value="false"
                      checked={currentQuestion.correctAnswer === "false"}
                      onChange={handleQuestionChange}
                      className="mr-2 accent-[#4A8292]"
                      disabled={submitting}
                    />
                    <span className="text-[#1B3C53]">False</span>
                  </label>
                </div>
              </div>
            )}

            {currentQuestion.type === "short-answer" && (
              <div>
                <label
                  htmlFor="correctAnswer"
                  className="block text-[#1B3C53] text-sm font-semibold mb-2"
                >
                  Correct Answer
                </label>
                <input
                  type="text"
                  id="correctAnswer"
                  name="correctAnswer"
                  value={currentQuestion.correctAnswer}
                  onChange={handleQuestionChange}
                  placeholder="Enter the correct answer..."
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A8292] focus:border-[#4A8292] text-[#1B3C53] placeholder-[#6B7280]"
                  disabled={submitting}
                  required
                  autoComplete="off"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  This will be used for automatic grading (case-insensitive)
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-[#E5E7EB] mt-6">
              <Button
                text="Cancel"
                onClick={handleQuestionFormClose}
                className="px-6 py-2 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#E5E7EB] rounded-md font-medium transition-colors"
                aria-label="Cancel question creation"
                disabled={submitting}
              />
              <Button
                text={
                  editingQuestionIndex >= 0 ? "Update Question" : "Add Question"
                }
                onClick={handleSaveQuestion}
                className="px-6 py-2 bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882] rounded-md font-medium transition-colors shadow-sm"
                aria-label={
                  editingQuestionIndex >= 0
                    ? "Update this question"
                    : "Add this question to the quiz"
                }
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

QuizCreator.propTypes = {
  lectureId: PropTypes.string.isRequired,
  courseId: PropTypes.string.isRequired,
  onQuizCreated: PropTypes.func.isRequired,
};

export default React.memo(QuizCreator);
