import Modal from "../components/common/Modal";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import {
  login as authServiceLogin,
  signup as authServiceSignup,
} from "../services/auth";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onClose: null,
  });

  const decodeToken = useCallback((jwtToken) => {
    if (!jwtToken) return null;
    try {
      const base64Url = jwtToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(atob(base64));
      return decodedPayload;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }, []);

  // Function to fetch complete user profile
  const fetchCompleteUserProfile = useCallback(async (token) => {
    try {
      const response = await fetch(
        "https://techora-1.onrender.com/api/user/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("AuthContext - Setting complete user data:", data.user);
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error("Failed to fetch complete user profile:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const decodedUser = decodeToken(storedToken);
        if (decodedUser && decodedUser.id && decodedUser.role) {
          setToken(storedToken);

          // First set basic user data from token
          const basicUser = {
            userId: decodedUser.id,
            role: decodedUser.role,
            firstName: decodedUser.firstName || "User",
            lastName: decodedUser.lastName || "",
            email: decodedUser.email || "",
            profilePicture: decodedUser.profilePicture || null,
            bio: decodedUser.bio || "",
          };
          console.log(
            "AuthContext - Setting basic user data from token:",
            basicUser
          );
          setUser(basicUser);

          // Then fetch complete profile data
          await fetchCompleteUserProfile(storedToken);
        } else {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [decodeToken, fetchCompleteUserProfile]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const data = await authServiceLogin(
        credentials.email,
        credentials.password
      );
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser({
        userId: data.userId,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: credentials.email,
        profilePicture: data.profilePicture || null,
        bio: data.bio || "",
      });
      setModal({
        isOpen: true,
        title: "Login Successful!",
        message: `Welcome back, ${data.firstName || data.email}!`,
        type: "success",
        onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.details
        ? error.response.data.details.map((err) => err.message).join("; ")
        : error.message;
      setModal({
        isOpen: true,
        title: "Login Failed",
        message: errorMessage || "Login failed. Please try again.",
        type: "error",
        onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    try {
      const data = await authServiceSignup(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role
      );
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser({
        userId: data.userId,
        role: data.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        profilePicture: data.profilePicture || null,
        bio: data.bio || "",
      });
      setModal({
        isOpen: true,
        title: "Signup Successful!",
        message: "Your account has been created. Welcome!",
        type: "success",
        onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      return data;
    } catch (error) {
      setModal({
        isOpen: true,
        title: "Signup Failed",
        message: error.message,
        type: "error",
        onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setModal({
      isOpen: true,
      title: "Logged Out",
      message: "You have been successfully logged out.",
      type: "info",
      onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
    });
  }, []);

  const showModal = useCallback((newModalProps) => {
    setModal({
      isOpen: false,
      title: "",
      message: "",
      type: "info",
      ...newModalProps,
      onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
    });
  }, []);

  // Function to update user data in context
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUserData,
    }));
  }, []);

  // OAuth login function (for use by AuthSuccess component)
  const oauthLogin = useCallback((userData, authToken) => {
    localStorage.setItem("token", authToken);
    setToken(authToken);
    setUser(userData);
    setModal({
      isOpen: true,
      title: "Welcome!",
      message: `Successfully signed in with Google!`,
      type: "success",
      onClose: () => setModal((prev) => ({ ...prev, isOpen: false })),
    });
  }, []);

  const contextValue = React.useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      oauthLogin,
      signup,
      logout,
      showModal,
      updateUser,
    }),
    [
      token,
      user,
      loading,
      login,
      oauthLogin,
      signup,
      logout,
      showModal,
      updateUser,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
