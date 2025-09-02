import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PUBLIC_ROUTES } from "../../routes";

import { FiTwitter, FiLinkedin, FiGithub, FiYoutube } from "react-icons/fi";

function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setEmail("");
      setIsSubmitting(false);
      alert("Thank you for subscribing to Techora’s newsletter!");
    }, 1000);
  };

  const courseCategories = [
    {
      name: "Technology",
      path: `${PUBLIC_ROUTES.courseListing}?category=technology`,
    },
    {
      name: "Business",
      path: `${PUBLIC_ROUTES.courseListing}?category=business`,
    },
    { name: "Design", path: `${PUBLIC_ROUTES.courseListing}?category=design` },
    {
      name: "Data Science",
      path: `${PUBLIC_ROUTES.courseListing}?category=data-science`,
    },
    {
      name: "Personal Development",
      path: `${PUBLIC_ROUTES.courseListing}?category=personal-development`,
    },
  ];

  const companyLinks = [
    { name: "About Us", path: PUBLIC_ROUTES.about },
    { name: "Careers", path: "/careers" },
    { name: "Blog", path: "/blog" },
    { name: "Help Center", path: "/help" },
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms of Service", path: "/terms" },
  ];

  const socialLinks = [
    { name: "Twitter/X", icon: FiTwitter, url: "https://x.com/techora" },
    {
      name: "LinkedIn",
      icon: FiLinkedin,
      url: "https://linkedin.com/company/Techora",
    },
    { name: "GitHub", icon: FiGithub, url: "https://github.com/Techora" },
    { name: "YouTube", icon: FiYoutube, url: "https://youtube.com/Techora" },
  ];

  // Custom SVG Icons
  const TwitterIcon = () => (
    <svg
      className="w-6 h-6 text-[#FFFFFF]/80"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const LinkedInIcon = () => (
    <svg
      className="w-6 h-6 text-[#FFFFFF]/80"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
    </svg>
  );

  const GitHubIcon = () => (
    <svg
      className="w-6 h-6 text-[#FFFFFF]/80"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );

  const YouTubeIcon = () => (
    <svg
      className="w-6 h-6 text-[#FFFFFF]/80"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );

  return (
    <footer className="bg-[#1B3C53] text-[#FFFFFF] pt-12 pb-8 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Course Categories */}
          <div>
            <h3 className="text-xl font-serif font-bold text-[#FFFFFF] mb-4">
              Explore Courses
            </h3>
            <ul className="space-y-2">
              {courseCategories.map((category, index) => (
                <motion.li
                  key={category.name}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    to={category.path}
                    className="text-[#FFFFFF]/80 hover:text-[#4A8292] text-sm font-medium transition-colors duration-200"
                    aria-label={`Explore ${category.name} courses`}
                  >
                    {category.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xl font-serif font-bold text-[#FFFFFF] mb-4">
              About Techora
            </h3>
            <ul className="space-y-2">
              {companyLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className="text-[#FFFFFF]/80 hover:text-[#4A8292] text-sm font-medium transition-colors duration-200"
                    aria-label={link.name}
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 className="text-xl font-serif font-bold text-[#FFFFFF] mb-4">
              Stay Updated
            </h3>
            <p className="text-[#FFFFFF]/80 text-sm mb-4">
              Subscribe to our newsletter for the latest courses and updates.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-2 bg-[#F9FAFB] text-[#1B3C53] rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#4A8292]"
                required
                disabled={isSubmitting}
                aria-label="Email for newsletter"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              <motion.button
                type="submit"
                className={`w-full px-4 py-2 bg-[#FFFFFF] text-[#1B3C53] rounded-md hover:bg-[#456882] hover:text-[#FFFFFF] transition-colors duration-200 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Subscribe to newsletter"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </motion.button>
            </form>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-serif font-bold text-[#FFFFFF] mb-4">
              Connect With Us
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFFFFF]/80 hover:text-[#4A8292] transition-colors duration-200"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-12 pt-4 border-t border-[#E5E7EB] text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-[#FFFFFF]/80 font-medium">
            © {new Date().getFullYear()} Techora. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

export default Footer;
