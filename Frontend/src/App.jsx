import { Children, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUser,
  selectAuthLoading,
} from "./Redux/slices/authSlice";
import ReduxInitializer from "./Redux/ReduxInitializer";
import HomePage from "./pages/HomePage";
import { PUBLIC_ROUTES, AUTH_ROUTES, PROTECTED_ROUTES } from "./routes";
import CourseListingPage from "./pages/CourseListingPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import CourseLearning from "./pages/CourseLearning";
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import CheckoutPage from "./pages/CheckoutPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import InstructorDashboard from "./pages/InstructorDashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import SearchBar from "./components/user/SearchBar";
import InstructorCourseFormPage from "./pages/InstructorCourseFormPage";
import InstructorCourseContentPage from "./pages/InstructorCourseContentPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthSuccess from "./pages/AuthSuccess";
import ReduxModal from "./components/common/ReduxModal";

const PrivateRoutes = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-sans text-text-secondary">
        Loading authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.login} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ReduxInitializer>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow pt-16">
          <Routes>
            {/* Public Routes */}
            <Route path={PUBLIC_ROUTES.home} element={<HomePage />} />
            <Route
              path={PUBLIC_ROUTES.courseListing}
              element={<CourseListingPage />}
            />
            <Route path="/course/:id" element={<CourseDetailsPage />} />
            <Route path={PUBLIC_ROUTES.searchBar} element={<SearchBar />} />
            <Route path={PUBLIC_ROUTES.about} element={<About />} />
            <Route path={PUBLIC_ROUTES.contact} element={<Contact />} />

            {/* Auth Routes */}
            <Route path={AUTH_ROUTES.login} element={<Login />} />
            <Route path={AUTH_ROUTES.signup} element={<Signup />} />
            <Route
              path={AUTH_ROUTES.ForgotPassword}
              element={<ForgotPassword />}
            />
            <Route path="/auth/success" element={<AuthSuccess />} />

            {/* Protected Routes */}
            <Route
              path={PROTECTED_ROUTES.dashboard}
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <UserDashboard />
                </PrivateRoutes>
              }
            />
            <Route
              path="/course/:id/learning"
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <CourseLearning />
                </PrivateRoutes>
              }
            />
            <Route
              path={PROTECTED_ROUTES.profile}
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <UserProfile />
                </PrivateRoutes>
              }
            />
            <Route
              path={PROTECTED_ROUTES.checkout}
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <CheckoutPage />
                </PrivateRoutes>
              }
            />
            <Route
              path={PROTECTED_ROUTES.wishlist}
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <WishlistPage />
                </PrivateRoutes>
              }
            />
            <Route
              path={PROTECTED_ROUTES.cart}
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <CartPage />
                </PrivateRoutes>
              }
            />
            <Route
              path={PROTECTED_ROUTES.helpSupport}
              element={
                <PrivateRoutes
                  allowedRoles={["learner", "instructor", "admin"]}
                >
                  <HelpSupportPage />
                </PrivateRoutes>
              }
            />
            {/* Protected Routes - Instructor specific */}
            <Route
              path={PROTECTED_ROUTES.instructor}
              element={
                <PrivateRoutes allowedRoles={["instructor", "admin"]}>
                  <InstructorDashboard />
                </PrivateRoutes>
              }
            />
            <Route
              path="/instructor/course/new"
              element={
                <PrivateRoutes allowedRoles={["instructor"]}>
                  <InstructorCourseFormPage />
                </PrivateRoutes>
              }
            />
            <Route
              path="/instructor/course/edit/:id"
              element={
                <PrivateRoutes allowedRoles={["instructor"]}>
                  <InstructorCourseFormPage />
                </PrivateRoutes>
              }
            />
            <Route
              path="/instructor/course/:id/content"
              element={
                <PrivateRoutes allowedRoles={["instructor"]}>
                  <InstructorCourseContentPage />
                </PrivateRoutes>
              }
            />

            {/* Admin Specific Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoutes allowedRoles={["admin"]}>
                  <AdminDashboardPage />
                </PrivateRoutes>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ReduxModal />
      </div>
    </ReduxInitializer>
  );
}

export default App;
