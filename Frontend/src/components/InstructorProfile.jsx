import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "./common/Button";

function InstructorProfile({ instructor, showFullProfileLink = false }) {
  if (!instructor) {
    return null;
  }

  return (
    <motion.div
      className="bg-background-card p-md rounded-lg shadow-md border border-secondary-light font-sans hover:shadow-lg transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-md">
        <motion.img
          src={
            instructor.profilePicture?.startsWith("http")
              ? instructor.profilePicture
              : instructor.profilePicture
              ? `https://techora-1.onrender.com${instructor.profilePicture}`
              : "https://via.placeholder.com/80x80/F9F3EF/1B3C53?text=Instructor"
          }
          alt={`${instructor.firstName} ${instructor.lastName}`}
          className="w-16 h-16 rounded-full mr-md object-cover border-2 border-primary-main shadow-sm"
          whileHover={{ scale: 1.05 }}
        />
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            {instructor.firstName} {instructor.lastName}
          </h3>
          <p className="text-text-secondary text-sm font-medium">Instructor</p>
        </div>
      </div>
      {instructor.bio && (
        <motion.p
          className="text-text-primary text-md mb-md line-clamp-3 hover:line-clamp-none transition-all duration-300"
          whileHover={{ cursor: "pointer" }}
          title="Click to expand"
        >
          {instructor.bio}
        </motion.p>
      )}
      {instructor.stats && (
        <div className="text-sm text-text-secondary mb-md grid grid-cols-2 gap-sm">
          <p>
            <span className="font-semibold text-text-primary">Courses:</span>{" "}
            {instructor.stats.courses || 0}
          </p>
          <p>
            <span className="font-semibold text-text-primary">Students:</span>{" "}
            {instructor.stats.students || 0}
          </p>
        </div>
      )}
      {showFullProfileLink && (
        <div className="mt-md text-center">
          <Link to={`/instructors/${instructor._id}`}>
            <Button
              text="View Full Profile"
              variant="outline"
              className="px-md py-sm text-primary-main hover:bg-primary-light hover:text-background-card"
            />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

InstructorProfile.propTypes = {
  instructor: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    profilePicture: PropTypes.string,
    bio: PropTypes.string,
    stats: PropTypes.shape({
      courses: PropTypes.number,
      students: PropTypes.number,
    }),
  }).isRequired,
  showFullProfileLink: PropTypes.bool,
};

export default InstructorProfile;
