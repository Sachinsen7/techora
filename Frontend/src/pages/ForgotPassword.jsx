import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import { useDispatch } from "react-redux";
import { showModal } from "../Redux/slices/uiSlice";
import { AUTH_ROUTES } from "../routes";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    console.log("Forgot Password request for email:", email);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (email.includes("@")) {
        dispatch(
          showModal({
            title: "Password Reset Link Sent!",
            message: `If an account exists for ${email}, a password reset link has been sent to your inbox.`,
            type: "success",
          })
        );
        setEmail("");
      } else {
        throw new Error("Please enter a valid email address.");
      }
    } catch (err) {
      setError(
        err.message || "Failed to send password reset link. Please try again."
      );
      dispatch(
        showModal({
          title: "Request Failed",
          message: err.message || "Could not send password reset link.",
          type: "error",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-main p-lg font-sans">
      <div className="bg-background-card p-xl rounded-lg shadow-md w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold text-text-primary text-center mb-xl">
          Forgot Password?
        </h1>
        <p className="text-text-secondary text-center mb-lg">
          Enter your email address below and we'll send you a link to reset your
          password.
        </p>

        {error && (
          <p className="text-accent-error text-center mb-md">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label
              htmlFor="email"
              className="block text-text-primary text-sm font-semibold mb-sm"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-md py-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
              required
              disabled={submitting}
            />
          </div>
          <Button
            text={submitting ? "Sending Link..." : "Send Reset Link"}
            type="submit"
            className="w-full px-lg py-md text-lg"
            disabled={submitting}
          />
        </form>
        <p className="text-center text-text-secondary text-sm mt-lg">
          Remember your password?{" "}
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

export default ForgotPassword;
