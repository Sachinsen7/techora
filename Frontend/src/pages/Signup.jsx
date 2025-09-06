import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signupUser, selectAuthLoading } from "../Redux/slices/authSlice";
import Button from "../components/common/Button";
import GoogleOAuthButton from "../components/auth/GoogleOAuthButton";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "../routes";

function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "learner",
  });
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await dispatch(signupUser(formData));

      if (signupUser.fulfilled.match(result)) {
        const data = result.payload;
        if (data.user.role === "instructor") {
          navigate(PROTECTED_ROUTES.instructor, { replace: true });
        } else if (data.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate(PROTECTED_ROUTES.dashboard, { replace: true });
        }
      } else {
        setError(
          result.payload || "An unexpected error occurred. Please try again."
        );
      }
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-main p-4 font-inter">
      <div className="bg-background-card p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-primary-dark mb-6">
          Create Your Account
        </h2>
        {error && (
          <p className="text-accent-error text-center mb-4 text-sm">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-text-primary text-sm font-semibold mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="Enter your first name"
              className="w-full px-4 py-2 border border-gray-300 text-primary-main rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-text-primary text-sm font-semibold mb-2"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Enter your last name"
              className="w-full px-4 py-2 border border-gray-300 text-primary-main rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-text-primary text-sm font-semibold mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="m@example.com"
              className="w-full px-4 py-2 border text-primary-main border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-text-primary text-sm font-semibold mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border text-primary-main border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-text-primary text-sm font-semibold mb-2"
            >
              Sign up as:
            </label>
            <select
              id="role"
              name="role"
              className="w-full px-4 py-2 border text-primary-main border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <Button
            text={loading ? "Signing Up..." : "Sign Up"}
            type="submit"
            className="w-full"
            disabled={loading}
          />
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-4 text-text-secondary text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <GoogleOAuthButton
          text={`Sign up with Google as ${formData.role}`}
          role={formData.role}
          disabled={loading}
        />

        <p className="text-center text-text-secondary text-sm mt-6">
          Already have an account?{" "}
          <Link
            to={AUTH_ROUTES.login}
            className="text-primary-main hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
