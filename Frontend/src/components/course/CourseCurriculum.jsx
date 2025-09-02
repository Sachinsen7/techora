import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

function CourseCurriculum({
  sections,
  isEnrolledView = false,
  lectureProgressMap = {},
  onLectureClick,
  className,
}) {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="text-[#6B7280] text-base font-medium flex items-center justify-center py-4">
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
        No curriculum available yet.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((section) => (
        <motion.div
          key={section._id}
          className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E7EB] shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            className="flex justify-between items-center w-full text-lg font-semibold text-[#1B3C53] focus:outline-none focus:ring-2 focus:ring-[#4A8292] rounded"
            onClick={() => toggleSection(section._id)}
            aria-expanded={openSections[section._id] || false}
            aria-controls={`section-${section._id}`}
          >
            <span>{section.title}</span>
            <motion.span
              animate={{ rotate: openSections[section._id] ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-[#4A8292]"
            >
              <svg
                className="w-5 h-5"
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
            </motion.span>
          </button>
          <AnimatePresence>
            {openSections[section._id] && (
              <motion.ul
                id={`section-${section._id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 mt-3"
                role="region"
              >
                {section.lectures && section.lectures.length > 0 ? (
                  section.lectures.map((lecture) => (
                    <motion.li
                      key={lecture._id}
                      className={`flex items-center justify-between p-3 rounded-md transition-all duration-200 ${
                        isEnrolledView
                          ? "cursor-pointer hover:bg-[#F9FAFB] hover:shadow-sm"
                          : ""
                      } ${
                        lectureProgressMap[lecture._id]?.isCompleted
                          ? "text-[#4A8292]"
                          : "text-[#6B7280]"
                      }`}
                      onClick={
                        isEnrolledView && onLectureClick
                          ? () => onLectureClick(lecture)
                          : undefined
                      }
                      whileHover={{ scale: isEnrolledView ? 1.02 : 1 }}
                      role={isEnrolledView ? "button" : "listitem"}
                      tabIndex={isEnrolledView ? 0 : undefined}
                      onKeyDown={
                        isEnrolledView && onLectureClick
                          ? (e) => e.key === "Enter" && onLectureClick(lecture)
                          : undefined
                      }
                      aria-label={`Lecture: ${lecture.title}, ${
                        lectureProgressMap[lecture._id]?.isCompleted
                          ? "completed"
                          : "not started"
                      }`}
                    >
                      <span className="text-sm flex items-center">
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
                        {lecture.order + 1}. {lecture.title} ({lecture.type})
                      </span>
                      {isEnrolledView &&
                        lectureProgressMap[lecture._id]?.isCompleted && (
                          <svg
                            className="w-5 h-5 text-[#4A8292]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      {isEnrolledView &&
                        !lectureProgressMap[lecture._id]?.isCompleted && (
                          <span className="text-[#1B3C53] text-sm font-medium">
                            Start
                          </span>
                        )}
                    </motion.li>
                  ))
                ) : (
                  <p className="text-[#6B7280] text-sm flex items-center">
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
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                    No lectures in this section yet.
                  </p>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

CourseCurriculum.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      order: PropTypes.number,
      lectures: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired,
          type: PropTypes.string.isRequired,
          order: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  isEnrolledView: PropTypes.bool,
  lectureProgressMap: PropTypes.object,
  onLectureClick: PropTypes.func,
  className: PropTypes.string,
};

CourseCurriculum.defaultProps = {
  className: "",
};

export default CourseCurriculum;
