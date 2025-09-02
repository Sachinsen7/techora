import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  selectAuthLoading,
  selectToken,
  updateUser,
} from "../Redux/slices/authSlice";
import { showModal } from "../Redux/slices/uiSlice";
import Button from "../components/common/Button";
import { updateUserProfile, changePassword } from "../services/api";

function UserProfile() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const authLoading = useSelector(selectAuthLoading);
  const token = useSelector(selectToken);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: "",
    bio: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !profileFetched) {
      setProfileFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        profilePicture: user.profilePicture || "",
        bio: user.bio || "",
      });
      setProfileFetched(true);
      setLoading(false);
    } else if (!authLoading && !user) {
      setError("Please log in to view your profile.");
      setLoading(false);
    }
  }, [authLoading, user, profileFetched]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        dispatch(
          showModal({
            isOpen: true,
            title: "Invalid File Type",
            message:
              "Please select a valid image file (JPEG, PNG, GIF, or WebP).",
            type: "error",
          })
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        dispatch(
          showModal({
            isOpen: true,
            title: "File Too Large",
            message: "Please select an image smaller than 5MB.",
            type: "error",
          })
        );
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstName", profileFormData.firstName);
      formData.append("lastName", profileFormData.lastName);
      formData.append("bio", profileFormData.bio);

      if (selectedFile) {
        formData.append("profilePicture", selectedFile);
      }

      const response = await fetch(
        `https://techora-1.onrender.com/api/user/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();

      dispatch(updateUser(data.user));

      dispatch(
        showModal({
          isOpen: true,
          title: "Profile Updated!",
          message: "Your profile has been updated successfully.",
          type: "success",
        })
      );

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      setProfileFormData({
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        email: data.user.email || "",
        profilePicture: data.user.profilePicture || "",
        bio: data.user.bio || "",
      });
    } catch (err) {
      setError(err.message || "Failed to update profile.");
      dispatch(
        showModal({
          isOpen: true,
          title: "Update Failed",
          message: err.message || "Could not update profile.",
          type: "error",
        })
      );
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPassword(true);
    setError(null);

    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      setError("New password and confirmation do not match.");
      setSubmittingPassword(false);
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      setSubmittingPassword(false);
      return;
    }

    try {
      await changePassword(
        passwordFormData.currentPassword,
        passwordFormData.newPassword
      );
      dispatch(
        showModal({
          isOpen: true,
          title: "Password Changed!",
          message: "Your password has been updated successfully.",
          type: "success",
        })
      );
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to change password.");
      dispatch(
        showModal({
          isOpen: true,
          title: "Password Change Failed",
          message: err.message || "Could not change password.",
          type: "error",
        })
      );
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (authLoading || loading)
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1B3C53]"></div>
      </div>
    );

  if (error && !user)
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-[#6B7280] text-center p-6 text-xl bg-[#F9FAFB] rounded-lg shadow-md border border-[#E5E7EB]">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans">
      <div className="bg-[#F9FAFB] shadow-sm border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#1B3C53]">
                Welcome back, {user?.firstName}
              </h1>
              <p className="text-[#6B7280] mt-1">
                Manage your profile and account settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#6B7280]">
                Member since {new Date(user?.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: "profile", label: "Profile" },
              { id: "security", label: "Security" },
              { id: "preferences", label: "Preferences" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#1B3C53] text-[#FFFFFF] shadow-md"
                    : "text-[#6B7280] hover:text-[#4A8292] hover:bg-[#F9FAFB]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-1">
                <div className="bg-[#F9FAFB] rounded-md shadow-md p-6 border border-[#E5E7EB]">
                  <h3 className="text-xl font-serif font-bold text-[#1B3C53] mb-6">
                    Profile Picture
                  </h3>

                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-[#E5E7EB] p-1">
                        <img
                          src={
                            previewUrl ||
                            (user?.profilePicture?.startsWith("http")
                              ? user.profilePicture
                              : `https://techora-1.onrender.com${user?.profilePicture}`) ||
                            "https://via.placeholder.com/150"
                          }
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover bg-[#FFFFFF]"
                        />
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-[#1B3C53]/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <span className="text-[#FFFFFF] text-sm font-medium">
                            Change
                          </span>
                        </button>
                      )}
                    </div>

                    {isEditing && (
                      <div className="mt-4 w-full">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-[#1B3C53] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-[#456882] transition-colors duration-200 font-medium"
                        >
                          Upload New Photo
                        </button>
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            className="w-full mt-2 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] py-2 px-4 rounded-md hover:bg-[#E5E7EB] transition-colors duration-200 font-medium"
                          >
                            Remove Selected
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 text-center">
                    <h4 className="text-lg font-serif font-semibold text-[#1B3C53]">
                      {user?.firstName} {user?.lastName}
                    </h4>
                    <p className="text-[#6B7280] capitalize">{user?.role}</p>
                    <p className="text-sm text-[#6B7280] mt-2">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-[#F9FAFB] rounded-md shadow-md p-6 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-serif font-bold text-[#1B3C53]">
                      Personal Information
                    </h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                        isEditing
                          ? "bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] hover:bg-[#E5E7EB]"
                          : "bg-[#1B3C53] text-[#FFFFFF] hover:bg-[#456882]"
                      }`}
                    >
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-[#6B7280] mb-2"
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={profileFormData.firstName}
                          onChange={handleProfileChange}
                          disabled={!isEditing || submittingProfile}
                          className={`w-full px-4 py-3 border rounded-md transition-all duration-200 ${
                            isEditing
                              ? "border-[#E5E7EB] focus:border-[#4A8292] focus:ring-2 focus:ring-[#4A8292]/50"
                              : "border-[#E5E7EB] bg-[#F9FAFB]"
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-[#6B7280] mb-2"
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={profileFormData.lastName}
                          onChange={handleProfileChange}
                          disabled={!isEditing || submittingProfile}
                          className={`w-full px-4 py-3 border rounded-md transition-all duration-200 ${
                            isEditing
                              ? "border-[#E5E7EB] focus:border-[#4A8292] focus:ring-2 focus:ring-[#4A8292]/50"
                              : "border-[#E5E7EB] bg-[#F9FAFB]"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-[#6B7280] mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileFormData.email}
                        disabled
                        className="w-full px-4 py-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-md text-[#6B7280]"
                      />
                      <p className="text-sm text-[#6B7280] mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="bio"
                        className="block text-sm font-medium text-[#6B7280] mb-2"
                      >
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows="4"
                        value={profileFormData.bio}
                        onChange={handleProfileChange}
                        disabled={!isEditing || submittingProfile}
                        placeholder="Tell us about yourself..."
                        className={`w-full px-4 py-3 border rounded-md transition-all duration-200 resize-none ${
                          isEditing
                            ? "border-[#E5E7EB] focus:border-[#4A8292] focus:ring-2 focus:ring-[#4A8292]/50"
                            : "border-[#E5E7EB] bg-[#F9FAFB]"
                        }`}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex space-x-4 pt-4">
                        <Button
                          text={
                            submittingProfile ? "Saving..." : "Save Changes"
                          }
                          type="submit"
                          disabled={submittingProfile}
                          className="flex-1 bg-[#1B3C53] text-[#FFFFFF] py-3 px-6 rounded-md hover:bg-[#456882] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          disabled={submittingProfile}
                          className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1B3C53] py-3 px-6 rounded-md hover:bg-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#F9FAFB] rounded-md shadow-md p-6 border border-[#E5E7EB]"
            >
              <h3 className="text-xl font-serif font-bold text-[#1B3C53] mb-6">
                Change Password
              </h3>

              <form
                onSubmit={handleChangePasswordSubmit}
                className="space-y-6 max-w-md"
              >
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-[#6B7280] mb-2"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md focus:border-[#4A8292] focus:ring-2 focus:ring-[#4A8292]/50 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-[#6B7280] mb-2"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md focus:border-[#4A8292] focus:ring-2 focus:ring-[#4A8292]/50 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmNewPassword"
                    className="block text-sm font-medium text-[#6B7280] mb-2"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={passwordFormData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-md focus:border-[#4A8292] focus:ring-2 focus:ring-[#4A8292]/50 transition-all duration-200"
                    required
                  />
                </div>

                <Button
                  text={submittingPassword ? "Updating..." : "Update Password"}
                  type="submit"
                  disabled={submittingPassword}
                  className="w-full bg-[#1B3C53] text-[#FFFFFF] py-3 px-6 rounded-md hover:bg-[#456882] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                />
              </form>
            </motion.div>
          )}

          {activeTab === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#F9FAFB] rounded-md shadow-md p-6 border border-[#E5E7EB]"
            >
              <h3 className="text-xl font-serif font-bold text-[#1B3C53] mb-6">
                Account Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#FFFFFF] rounded-md border border-[#E5E7EB]">
                  <div>
                    <h4 className="font-serif font-medium text-[#1B3C53]">
                      Email Notifications
                    </h4>
                    <p className="text-sm text-[#6B7280]">
                      Receive updates about your courses
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-[#E5E7EB] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#4A8292] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#FFFFFF] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border-[#E5E7EB] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3C53]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FFFFFF] rounded-md border border-[#E5E7EB]">
                  <div>
                    <h4 className="font-serif font-medium text-[#1B3C53]">
                      Marketing Emails
                    </h4>
                    <p className="text-sm text-[#6B7280]">
                      Receive promotional content and offers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#E5E7EB] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#4A8292] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#FFFFFF] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFFF] after:border-[#E5E7EB] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3C53]"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UserProfile;
