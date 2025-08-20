# **Techora: A Comprehensive Online Learning Platform**

## **Project Overview**

Techora is a full-stack Learning Management System (LMS) designed to deliver an interactive and engaging online learning experience, drawing inspiration from platforms such as Udemy and Coursera. It facilitates connections between instructors and learners through robust course management, dynamic content delivery, and user-friendly dashboards.

The project emphasizes modularity, scalability, and a clean, intuitive user interface to ensure maintainability and ease of extension.

## **Features**

Techora provides a broad range of features tailored to different user roles:

### **A. Core Platform Features**

* **User Authentication & Authorization:** Secure mechanisms for signup, login, and role-based access control (learner, instructor, admin).  
* **Custom Notification System:** Modal pop-ups for delivering user feedback, such as login status or enrollment confirmations.  
* **Global Styling:** A tailored Tailwind CSS theme with a custom color palette and Poppins font for a cohesive, modern aesthetic.

### **B. Learner Features**

* **Course Discovery:**  
  * Browse all available courses.  
  * Search by keywords in titles or descriptions, categories, instructor names, or price ranges.  
  * Apply filters via a dedicated sidebar for refined results.  
* **Course Details:** Access detailed information, including descriptions, curricula, instructor profiles, and student reviews.  
* **Enrollment & Purchase:** Enroll in free courses or simulate checkout for paid ones.  
* **Course Learning:**  
  * Navigate enrolled course content, including sections and lectures.  
  * Support for lecture types: video (with progress tracking) and text.  
  * **Quiz Assessment:** Participate in quizzes, submit responses, receive immediate scores, and review previous attempts.  
  * **Assignment Submission:** Upload text or URL-based assignments and track submission status.  
  * **Progress Tracking:** Mark lectures as completed and monitor overall course progress.  
* **User Dashboard:** A personalized view of enrolled courses and their completion status.  
* **User Profile:** Edit personal details (first name, last name, bio, profile picture) and update passwords.  
* **Reviews:** Submit and view course reviews, with options for sorting and rating breakdowns.

### **C. Instructor Features**

* **Instructor Dashboard:** Overview and management of created courses.  
* **Course Creation & Management:**  
  * Develop new courses with specifics like titles, descriptions, prices, images, categories, and status.  
  * Modify existing course details.  
  * Remove courses, including cascading deletion of related content.  
* **Course Content Management:**  
  * Add, edit, or delete sections.  
  * Manage lectures (video, text, quiz, assignment) within sections.  
* **Quiz & Question Management:**  
  * Build, update, or remove quizzes for quiz-type lectures.  
  * Handle questions (multiple-choice, true/false, short-answer) within quizzes.  
* **Assignment Grading:** Review learner submissions, assign grades, and provide feedback.

### **D. Admin Features**

* **User Management:**  
  * List all platform users.  
  * Adjust user roles (learner, instructor, admin).  
  * Control user status (activate/deactivate).  
  * Permanently delete users, with comprehensive cascading removal of associated data.  
* **Course Moderation:**  
  * Inspect all courses, including drafts and archived ones.  
  * Alter course status (e.g., publish drafts).  
  * Delete courses forcefully, with cascading content removal.  
* **Category Management:**  
  * Add, edit, or delete categories.  
  * Cascade deletions to affect related courses if configured.

## **Technologies Used**

### **Frontend**

* **React.js:** For constructing dynamic user interfaces.  
* **React Router DOM:** Enables client-side routing.  
* **Tailwind CSS:** Utility-first framework for efficient styling.  
* **Framer Motion:** Handles animations in modals, toasts, and transitions.  
* **Axios:** Manages API requests with promise-based handling.  
* **tailwind-merge & class-variance-authority:** Tools for advanced Tailwind class manipulation.

### **Backend**

* **Node.js:** Server-side JavaScript runtime.  
* **Express.js:** Minimalist web framework for API development.  
* **MongoDB:** NoSQL database for flexible data storage.  
* **Mongoose:** ODM for MongoDB schema management.  
* **Zod:** Schema validation library for input sanitization.  
* **bcryptjs:** Secure password hashing.  
* **jsonwebtoken (JWT):** Token-based authentication.  
* **dotenv:** Environment variable management.  
* **cors:** Enables cross-origin requests.

## **Project Structure**


### **Frontend (/frontend/src)**


frontend/

├── src/

│ ├── assets/

│ ├── components/

│ │ ├── common/ (Button, Loader, Modal)

│ │ ├── course/ (CourseCard, CourseCurriculum, Review, Category)

│ │ ├── layout/ (Navbar, Footer)

│ │ ├── learning/ (VideoPlayer, QuizComponent, AssignmentComponent, ProgressTracker)

│ │ └── user/ (SearchBar, InstructorProfile, FilterSidebar, UserProfileCard)

│ ├── context/ (AuthContext)

│ ├── hooks/ (Custom hooks for state and side effects)

│ ├── pages/ (About, Contact, CourseDetailsPage, CourseLearning, CourseListingPage,

│ │ Dashboard, ForgotPassword, HomePage, InstructorDashboard,

│ │ InstructorCourseFormPage, Login, NotFound, Signup, UserProfile)

│ ├── routes/ (index.js for route definitions, PrivateRoutes.jsx)

│ ├── services/ (api.js, auth.js)

│ └── utils/ (constant.js, theme.js)

│ ├── App.jsx

│ ├── index.css

│ └── main.jsx

├── package.json

├── tailwind.config.js

└── postcss.config.js


### **Backend (/backend)**

backend/
├── db/ (db.js - Mongoose connection and model exports)

├── middleware/ (auth.js - JWT verification, admin.js - admin role check)

├── models/ (user.js, course.js, category.js, section.js, lecture.js,

│ purchase.js, review.js, quiz.js, question.js,

│ userQuizAttempt.js, assignmentSubmission.js, userLectureProgress.js)

├── routes/ (auth.js, enrollment.js, instructor.js, search.js,

│ payment.js, review.js, admin.js, user.js)

├── .env (Environment variables)

├── .env.example

├── index.js (Main Express app entry point)

└── package.json


## **Code Highlights**

To illustrate key implementations, here are selected JavaScript code snippets with explanations.

### **Frontend: Authentication Context (AuthContext.jsx)**

This context manages global authentication state, including user data and token handling.

```javascript
// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(response => setUser(response.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

- Explanation: This provider fetches user data on mount if a token exists, handles login by storing the token and updating state, and provides logout functionality. It uses React Context for state sharing across components.

# Backend: User Signup Route (auth.js)
- This Express route handles user registration with validation and password hashing.

```javascript 

const express = require('express');
const router = express.Router();
const z = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['learner', 'instructor']).default('learner'),
});

router.post('/signup', async (req, res) => {
  try {
    const data = userSignupSchema.parse(req.body);
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new User({ ...data, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

```
_Explanation:_ The route validates input using Zod, checks for existing users, hashes the password with bcrypt, saves the user to MongoDB, and generates a JWT for authentication. Errors are handled centrally for consistent responses.

**Setup Instructions**
----------------------

### **Prerequisites**

*   Node.js (v18 or higher)
    
*   npm or Yarn
    
*   MongoDB (local or MongoDB Atlas)
    
*   Postman for API testing
    

### **1\. Backend Setup**

1.  **Clone the repository:**git clone cd backend
    
2.  **Install dependencies:**npm install_or_ yarn install
    
3.  iniCopyEditMONGO\_URI="your\_mongodb\_connection\_string"JWT\_SECRET="a\_very\_strong\_secret\_key\_for\_jwt\_signing"PORT=3000
    
4.  **Backend Adjustments (for Initial Setup):**
    
    *   Temporarily enable 'admin' role in backend/routes/auth.js by updating z.enum(\['learner', 'instructor'\]) to include 'admin'.
        
    *   Make /api/admin/categories public by placing its route before middleware in admin.js.
        
5.  **Start the backend:**npm run dev_or_ yarn dev
    

### **2\. Initial Data Seeding (via Postman)**

1.  **Register Admin:** POST to /api/auth/signup with admin details.
    
2.  **Create Categories:** POST to /api/admin/category with admin token.
    
3.  **Revert Changes:** Restore original schema and restart backend.
    

### **3\. Frontend Setup**

1.  **Navigate:** cd ../frontend
    
2.  **Install:** npm install
    
3.  **Configure Tailwind:** Update tailwind.config.js and index.css for theme and font.
    
4.  **Start:** npm run dev
    

**API Endpoints**
-----------------

Refer to the separate API documentation or Postman collection for full details on endpoints, methods, and schemas.

**Key Design Decisions**
------------------------

*   **Monorepo Structure:** Separate directories for frontend and backend to maintain clear boundaries.
    
*   **Role-Based Access Control (RBAC):** Roles determine permissions via middleware.
    
*   **Modular Backend:** Routes grouped by resource with authentication middleware.
    
*   **Data Validation:** Zod ensures reliable input handling.
    
*   **Centralized Error Handling:** Uniform error responses across APIs.
    
*   **Cascade Deletion:** Deletions propagate to related data for integrity.
    
*   **Component-Based Frontend:** Organized for reusability.
    
*   **Global State Management:** Context API for authentication.
    
*   **Custom UI/UX:** Branded theme with modal notifications.
    
*   **API Service Layer:** Axios with interceptors for token management.
    

**Future Enhancements**
-----------------------

*   Integrate real payment gateways (e.g., Stripe).
    
*   Use cloud storage for media (e.g., AWS S3).
    
*   Advanced search with Elasticsearch.
    
*   Real-time notifications via WebSockets.
    
*   Instructor payout management.
    
*   Analytics dashboards.
    
*   Shopping cart and wishlist.
    
*   Certificate issuance.
    
*   Discussion forums.
    
*   Full admin UI.
    
*   Complete password reset.
    
*   Extensive testing.
    
*   CI/CD pipelines.
    

**License**
-----------

This project is licensed under the MIT License.

MIT License

Copyright (c) \[2025\] \[Sachin Sen\]

Permission is hereby granted, free of charge, to any person obtaining a copyof this software and associated documentation files (the "Software"), to dealin the Software without restriction, including without limitation the rightsto use, copy, modify, merge, publish, distribute, sublicense, and/or sellcopies of the Software, and to permit persons to whom the Software isfurnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in allcopies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS ORIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THEAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHERLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THESOFTWARE.


