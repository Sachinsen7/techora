const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

dotenv.config();

require("./config/passport");
const { connectDB } = require("./db/db");

const authRouter = require("./routes/auth");
const enrollmentRouter = require("./routes/enrollments");
const instructorRouter = require("./routes/instructor");
const searchRouter = require("./routes/search");
const paymentRouter = require("./routes/payments");
const reviewRouter = require("./routes/review");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://techora-smoky.vercel.app",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("LMS Backend API is running!");
});

app.use("/api/auth", authRouter);
app.use("/api/enrollment", enrollmentRouter);
app.use("/api/instructor", instructorRouter);
app.use("/api/search", searchRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
