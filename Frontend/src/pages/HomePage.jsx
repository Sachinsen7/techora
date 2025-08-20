import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CourseCard from "../components/course/CourseCard";
import Loader from "../components/common/Loader";
import Button from "../components/common/Button";
import { getCourses, getAllCategories } from "../services/api";

function Home() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      title: "Learn Without Limits",
      subtitle: "Start, switch, or advance your career with over 5,000 courses",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      cta: "Get Started",
      link: "/courses",
    },
    {
      id: 2,
      title: "Skills for Your Future",
      subtitle: "Learn from industry experts to achieve your goals",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      cta: "Explore Courses",
      link: "/courses",
    },
    {
      id: 3,
      title: "Learn from the Best",
      subtitle: "Join millions of learners worldwide",
      image:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      cta: "Start Learning",
      link: "/courses",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [coursesData, categoriesData] = await Promise.all([
          getCourses({ featured: true, limit: 8 }),
          getAllCategories(),
        ]);
        setCourses(coursesData.courses);
        setCategories(categoriesData.categories || []);
      } catch (err) {
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Custom SVG Icon for Categories
  const CategoryIcon = () => (
    <svg
      className="w-8 h-8 text-[#FFFFFF]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-[#6B7280] text-center p-8 text-lg bg-[#F9FAFB] rounded-lg shadow-md border border-[#E5E7EB]">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans">
      {/* Hero Section with Slider */}
      <section className="relative h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${heroSlides[currentSlide].image})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#1B3C53] to-[#456882] bg-opacity-60"></div>
              <div className="relative z-10 flex items-center justify-center h-full text-center text-[#FFFFFF] px-4">
                <div className="max-w-4xl">
                  <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight"
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-xl md:text-2xl mb-8 text-[#FFFFFF]/80"
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <Link to={heroSlides[currentSlide].link}>
                      <Button
                        text={heroSlides[currentSlide].cta}
                        className="bg-[#1B3C53] hover:bg-[#456882] text-[#FFFFFF] px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        aria-label={heroSlides[currentSlide].cta}
                      />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-[#FFFFFF]" : "bg-[#FFFFFF]/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Slider Navigation Arrows */}
        <button
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
            )
          }
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#FFFFFF]/20 hover:bg-[#FFFFFF]/30 text-[#FFFFFF] p-2 rounded-full transition-all duration-300"
          aria-label="Previous slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
          }
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#FFFFFF]/20 hover:bg-[#FFFFFF]/30 text-[#FFFFFF] p-2 rounded-full transition-all duration-300"
          aria-label="Next slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-[#F9FAFB]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1B3C53] mb-4">
              Explore Top Categories
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Choose from hundreds of courses in the most popular categories
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {categories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link
                  to={`/courses?category=${category._id}`}
                  className="block bg-[#FFFFFF] border-l-4 border-[#4A8292] p-6 text-center hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-[#1B3C53] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <CategoryIcon />
                  </div>
                  <h3 className="font-semibold text-[#1B3C53] group-hover:text-[#456882] transition-colors duration-300">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/courses">
              <Button
                text="View All Categories"
                className="bg-[#FFFFFF] border-2 border-[#1B3C53] text-[#1B3C53] hover:bg-[#1B3C53] hover:text-[#FFFFFF] px-8 py-3 rounded-full font-semibold transition-all duration-300"
                aria-label="View all categories"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 bg-[#FFFFFF]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1B3C53] mb-4">
              Featured Courses
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Discover our most popular courses chosen by thousands of students
            </p>
          </motion.div>

          {courses.length === 0 ? (
            <p className="text-center text-[#6B7280] text-lg">
              No featured courses available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/course">
              <Button
                text="View All Courses"
                className="bg-[#1B3C53] hover:bg-[#456882] text-[#FFFFFF] px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                aria-label="View all courses"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-[#1B3C53] to-[#456882] my-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-[#FFFFFF]">
            {[
              { value: "5000+", label: "Courses" },
              { value: "100K+", label: "Students" },
              { value: "500+", label: "Instructors" },
              { value: "50+", label: "Countries" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-serif font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-[#FFFFFF]/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1B3C53]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#FFFFFF] mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-[#FFFFFF]/80 mb-8">
              Join thousands of students and start your learning journey today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button
                  text="Get Started Free"
                  className="bg-[#FFFFFF] hover:bg-[#F9FAFB] text-[#1B3C53] px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  aria-label="Get started free"
                />
              </Link>
              <Link to="/courses">
                <Button
                  text="Browse Courses"
                  className="bg-transparent border-2 border-[#FFFFFF] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#1B3C53] px-8 py-4 rounded-full font-semibold transition-all duration-300"
                  aria-label="Browse courses"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Home;
