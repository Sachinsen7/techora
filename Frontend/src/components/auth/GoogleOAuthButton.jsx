import React from "react";
import { FaGoogle } from "react-icons/fa";

const GoogleOAuthButton = ({
  text = "Continue with Google",
  className = "",
  disabled = false,
}) => {
  const handleGoogleAuth = () => {
    if (disabled) return;

    //google auth
    const backendUrl =
      import.meta.env.VITE_API_BASE_URL || "https://techora-1.onrender.com";
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 
        border border-gray-300 rounded-lg text-gray-700 font-medium
        hover:bg-gray-50 hover:border-gray-400 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    >
      <FaGoogle className="text-xl" />
      <span>{text}</span>
    </button>
  );
};

export default GoogleOAuthButton;
