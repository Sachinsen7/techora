import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import { PUBLIC_ROUTES } from "../routes";

function About() {
  const teamMembers = [
    {
      name: "Sachin Sen",
      role: "Founder & CEO",
      bio: "Passionate about making quality education accessible to everyone.",
    },
  ];

  const features = [
    {
      title: "Expert-Led Courses",
      desc: "Learn from industry professionals with real-world experience.",
      icon: "",
    },
    {
      title: "Flexible Learning",
      desc: "Study at your own pace with lifetime access to course materials.",
      icon: "",
    },
    {
      title: "Career Growth",
      desc: "Gain practical skills and certificates to advance your career.",
      icon: "",
    },
  ];

  return (
    <div className="min-h-screen bg-background-main font-sans">
      <motion.section
        className="bg-gradient-to-r from-primary-main to-primary-light text-background-card py-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-background-card mb-sm">
            About Techora
          </h1>
          <p className="text-md text-background-card/80 max-w-2xl mx-auto mb-md">
            We're on a mission to make quality education accessible to everyone.
            Learn from experts, grow your skills, and achieve your goals with
            our comprehensive online courses.
          </p>
          <Link to={PUBLIC_ROUTES.courseListing}>
            <Button
              text="Browse Courses"
              className="mt-md px-lg py-sm bg-background-card text-primary-main hover:bg-primary-light hover:text-background-card transition-all duration-200"
            />
          </Link>
        </div>
      </motion.section>

      <motion.section
        className="container mx-auto px-md py-lg max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-text-primary mb-md text-center">
          Our Mission
        </h2>
        <p className="text-md text-text-secondary text-center leading-relaxed">
          Techora makes high-quality education accessible to all, connecting
          learners with expert instructors to build skills and achieve success.
          We believe that everyone deserves the opportunity to learn, grow, and
          transform their lives through education.
        </p>
      </motion.section>

      <motion.section
        className="container mx-auto px-md py-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-text-primary mb-md text-center">
          Why Choose Techora?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-background-card p-md rounded-md shadow-sm border border-secondary-light hover:shadow-md transition-shadow duration-200 text-center"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="text-3xl mb-sm">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-text-primary mb-sm">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="container mx-auto px-md py-lg max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-text-primary mb-md text-center">
          Meet Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              className="bg-background-card p-md rounded-md shadow-sm border border-secondary-light hover:shadow-md transition-shadow duration-200 text-center"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <h3 className="text-lg font-semibold text-text-primary mb-xs">
                {member.name}
              </h3>
              <p className="text-sm text-primary-main font-medium mb-sm">
                {member.role}
              </p>
              <p className="text-sm text-text-secondary">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="bg-primary-main text-background-card py-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="container mx-auto px-md text-center">
          <h2 className="text-2xl font-bold mb-sm">Ready to Start Learning?</h2>
          <p className="text-md mb-md max-w-xl mx-auto">
            Join thousands of learners and start your journey today. Transform
            your skills and advance your career.
          </p>
          <div className="flex justify-center space-x-md">
            <Link to={PUBLIC_ROUTES.courseListing}>
              <Button
                text="Browse Courses"
                className="px-lg py-sm bg-background-card text-primary-main hover:bg-primary-light hover:text-background-card transition-all duration-200"
              />
            </Link>
            <Link to={PUBLIC_ROUTES.contact}>
              <Button
                text="Contact Us"
                variant="outline"
                className="px-lg py-sm border-background-card text-background-card hover:bg-background-card hover:text-primary-main transition-all duration-200"
              />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default About;
