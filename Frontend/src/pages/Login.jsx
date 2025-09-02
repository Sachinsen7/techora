import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginUser, selectAuthLoading } from "../Redux/slices/authSlice";
import Button from "../components/common/Button";
import GoogleOAuthButton from "../components/auth/GoogleOAuthButton";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "../routes";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await dispatch(loginUser({ email, password }));

      if (loginUser.fulfilled.match(result)) {
        const data = result.payload;
        if (data.user.role === "instructor") {
          navigate(PROTECTED_ROUTES.instructor, { replace: true });
        } else if (data.user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate(PROTECTED_ROUTES.dashboard, { replace: true });
        }
      } else {
        setError(result.payload || "Please check your input.");
      }
    } catch (err) {
      setError(err.message || "Please check your input.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-main p-4 font-inter">
      <div className="bg-background-card p-8 rounded-md shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-primary-dark mb-6">
          Login to Your Account
        </h2>
        {error && (
          <p className="text-accent-error text-center mb-4 text-sm">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="m@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button
            text={loading ? "Logging In..." : "Login"}
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

        <GoogleOAuthButton text="Continue with Google" disabled={loading} />

        <p className="text-center text-text-secondary text-sm mt-6">
          Don't have an account?{" "}
          <Link
            to={AUTH_ROUTES.signup}
            className="text-primary-main hover:underline"
          >
            Sign Up
          </Link>
        </p>
        <p className="text-center text-text-secondary text-sm mt-2">
          <Link
            to={AUTH_ROUTES.ForgotPassword}
            className="text-primary-main hover:underline"
          >
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
