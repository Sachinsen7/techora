const { Router } = require("express");
const { CourseModel, UserModel, SectionModel, LectureModel, QuizModel, QuestionModel, AssignmentSubmissionModel, UserLectureProgressModel, UserQuizAttemptModel} = require("../db/db");
const authMiddleware = require("../middleware/auth");
const { uploadCourseImage, uploadVideo, handleUploadError, deleteOldCourseImage, deleteOldVideo } = require("../middleware/upload");
const z = require("zod");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const instructorRouter = Router();

const instructorRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all instructor routes, including quiz deletion
instructorRouter.use(instructorRateLimiter);

const createCourseSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters long").max(100, "Title cannot exceed 100 characters").trim(),
    description: z.string().min(20, "Description must be at least 20 characters long").trim(),
    price: z.number().min(0, "Price cannot be negative").default(0),
    category: z.string().min(2, "Category must be at least 2 characters long").trim().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft')
});


const updateCourseSchema = z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format"),
    title: z.string().min(5, "Title must be at least 5 characters long").max(100, "Title cannot exceed 100 characters").trim().optional(),
    description: z.string().min(20, "Description must be at least 20 characters long").trim().optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),
    category: z.string().min(2, "Category must be at least 2 characters long").trim().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional()
}).refine(data => Object.keys(data).length > 1, {
    message: "At least one field (title, description, price, category, status) must be provided for update."
});



const createSectionSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'),
  title: z.string().min(3, 'Section title must be at least 3 characters long').max(100, 'Section title cannot exceed 100 characters').trim(),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
});

const updateSectionSchema = z.object({
  sectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid section ID format'),
  title: z.string().min(3, 'Section title must be at least 3 characters long').max(100, 'Section title cannot exceed 100 characters').trim().optional(),
  order: z.number().int().min(0, 'Order must be a non-negative integer').optional(),
}).refine((data) => data.title !== undefined || data.order !== undefined, {
  message: 'At least one field (title, order) must be provided for update.',
});



const createLectureSchema = z.object({
    sectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid section ID format"),
    title: z.string().min(3, "Lecture title must be at least 3 characters long").max(150, "Lecture title cannot exceed 150 characters").trim(),
    type: z.enum(['video', 'text', 'quiz', 'assignment']),
    contentUrl: z.string().url("Invalid content URL format").optional(),
    textContent: z.string().min(10, "Text content must be at least 10 characters long").optional(),
    duration: z.number().int().min(0, "Duration must be a non-negative integer").optional(),
    order: z.number().int().min(0, "Order must be a non-negative integer"),
    isPublished: z.boolean().default(true).optional()
}).refine(data => {
    if (data.type === 'video') {
        return data.contentUrl !== undefined && data.duration !== undefined;
    }
    if (data.type === 'text') {
        return data.textContent !== undefined;
    }
    if (data.type === 'assignment') {
        return data.contentUrl !== undefined;
    }
    return true;
}, {
    message: "Missing required fields based on lecture type."
});

const updateLectureSchema = z.object({
    lectureId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid lecture ID format"),
    title: z.string().min(3, "Lecture title must be at least 3 characters long").max(150, "Lecture title cannot exceed 150 characters").trim().optional(),
    type: z.enum(['video', 'text', 'quiz', 'assignment']).optional(),
    contentUrl: z.string().url("Invalid content URL format").optional(),
    textContent: z.string().min(10, "Text content must be at least 10 characters long").optional(),
    duration: z.number().int().min(0, "Duration must be a non-negative integer").optional(),
    order: z.number().int().min(0, "Order must be a non-negative integer").optional(),
    isPublished: z.boolean().optional(),
    quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid quiz ID format").optional()
}).refine(data => Object.keys(data).length > 1, {
    message: "At least one field must be provided for update."
});


const createQuizSchema = z.object({
    lectureId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid lecture ID format"),
    title: z.string().min(3, "Quiz title must be at least 3 characters long").max(100, "Quiz title cannot exceed 100 characters").trim(),
    description: z.string().trim().optional(),
    passPercentage: z.number().int().min(0).max(100).default(70).optional(),
    isPublished: z.boolean().default(false).optional()
});


const updateQuizSchema = z.object({
    quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid quiz ID format"),
    title: z.string().min(3, "Quiz title must be at least 3 characters long").max(100, "Quiz title cannot exceed 100 characters").trim().optional(),
    description: z.string().trim().optional(),
    passPercentage: z.number().int().min(0).max(100).optional(),
    isPublished: z.boolean().optional()
}).refine(data => Object.keys(data).length > 1, {
    message: "At least one field must be provided for update."
});


const createQuestionSchema = z.object({
    quizId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid quiz ID format"),
    text: z.string().min(5, "Question text must be at least 5 characters long").trim(),
    type: z.enum(['multiple-choice', 'true-false', 'short-answer']),
    options: z.array(z.object({
        text: z.string().min(1).trim(),
        isCorrect: z.boolean().default(false)
    })).optional(),
    correctAnswer: z.string().trim().optional(),
    order: z.number().int().min(0, "Order must be a non-negative integer")
}).refine(data => {
    if (data.type === 'multiple-choice') {
        return data.options !== undefined && data.options.length > 1;
    }
    if (data.type === 'true-false' || data.type === 'short-answer') {
        return data.correctAnswer !== undefined && data.correctAnswer.length > 0;
    }
    return true;
}, {
    message: "Missing required fields based on question type."
});


const updateQuestionSchema = z.object({
    questionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid question ID format"),
    text: z.string().min(5, "Question text must be at least 5 characters long").trim().optional(),
    type: z.enum(['multiple-choice', 'true-false', 'short-answer']).optional(),
    options: z.array(z.object({
        text: z.string().min(1).trim(),
        isCorrect: z.boolean().default(false)
    })).optional(),
    correctAnswer: z.string().trim().optional(),
    order: z.number().int().min(0, "Order must be a non-negative integer").optional()
}).refine(data => Object.keys(data).length > 1, {
    message: "At least one field must be provided for update."
});


const gradeAssignmentSchema = z.object({
    submissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid submission ID format"),
    grade: z.number().int().min(0).max(100, "Grade must be between 0 and 100"),
    feedback: z.string().trim().optional()
});


const checkCourseOwnership = async (courseId, instructorId) => {
  const course = await CourseModel.findById(courseId);
  if (!course || course.creatorId.toString() !== instructorId) {
    return null;
  }
  return course;
};


const checkLectureOwnership = async (lectureId, instructorId) => {
    const lecture = await LectureModel.findById(lectureId);
    if (!lecture) return null;
    return checkCourseOwnership(lecture.courseId, instructorId);
};


const checkQuizOwnership = async (quizId, instructorId) => {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) return null;
    return checkLectureOwnership(quiz.lectureId, instructorId);
};


const checkQuestionOwnership = async (questionId, instructorId) => {
    const question = await QuestionModel.findById(questionId);
    if (!question) return null;
    return checkQuizOwnership(question.quizId, instructorId);
};





instructorRouter.post("/course", authMiddleware, uploadCourseImage, async (req, res) => {
    try {
        console.log('POST /course called with:', {
            body: req.body,
            file: req.file,
            userId: req.userId,
            userRole: req.userRole
        });

        if (req.userRole !== 'instructor') {
            return res.status(403).json({ message: "Access denied. Only instructors can create courses." });
        }


        const processedBody = {
            ...req.body,
            price: req.body.price ? Number(req.body.price) : 0
        };

        console.log('Processed body:', processedBody);

        const validationResult = createCourseSchema.safeParse(processedBody);
        if (!validationResult.success) {
            console.log('Validation failed:', validationResult.error.errors);
            return res.status(400).json({
                message: "Invalid input data for course creation",
                errors: validationResult.error.errors
            });
        }

        const courseData = validationResult.data;
        const creatorId = req.userId;

        console.log('Course data after validation:', courseData);

        if (req.file) {
            console.log('File uploaded successfully:', {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                path: req.file.path
            });
            courseData.imageUrl = `/uploads/course-images/${req.file.filename}`;
        } else {
            console.log('No file uploaded, using placeholder');
            courseData.imageUrl = 'https://via.placeholder.com/400x300/4A8292/FFFFFF?text=Course+Image';
        }

        console.log('Final course data with image URL:', courseData);

        const newCourse = await CourseModel.create({ ...courseData, creatorId: creatorId });
        console.log('Course created successfully:', {
          courseId: newCourse._id,
          title: newCourse.title,
          imageUrl: newCourse.imageUrl
        });

        await UserModel.findByIdAndUpdate(creatorId, { $addToSet: { createdCourses: newCourse._id } });

        res.status(201).json({
            message: "Course created successfully",
            courseId: newCourse._id,
            course: newCourse
        });
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({
            message: "An error occurred while creating the course",
            error: error.message
        });
    }
}, handleUploadError);


instructorRouter.put("/course", authMiddleware, uploadCourseImage, async (req, res) => {
    try {
        console.log('PUT /course called with:', {
            body: req.body,
            file: req.file,
            userId: req.userId,
            userRole: req.userRole
        });

        if (req.userRole !== 'instructor') {
            return res.status(403).json({ message: "Access denied. Only instructors can update courses." });
        }


        const processedBody = {
            ...req.body,
            price: req.body.price ? Number(req.body.price) : undefined
        };

        console.log('Processed body for update:', processedBody);

        const validationResult = updateCourseSchema.safeParse(processedBody);
        if (!validationResult.success) {
            console.log('Update validation failed:', validationResult.error.errors);
            return res.status(400).json({
                message: "Invalid input data for course update",
                errors: validationResult.error.errors
            });
        }

        const creatorId = req.userId;
        const { courseId, ...updateData } = validationResult.data;


        if (req.file) {
            const currentCourse = await CourseModel.findOne({ _id: courseId, creatorId: creatorId });
            if (currentCourse && currentCourse.imageUrl) {
                deleteOldCourseImage(currentCourse.imageUrl);
            }


            updateData.imageUrl = `/uploads/course-images/${req.file.filename}`;
        }

   
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "At least one field must be provided for course update."
            });
        }

        const updatedCourse = await CourseModel.findOneAndUpdate(
            { _id: courseId, creatorId: creatorId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found or you don't have permission to update it." });
        }

        res.status(200).json({
            message: "Course updated successfully",
            course: updatedCourse
        });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({
            message: "An error occurred while updating the course",
            error: error.message
        });
    }
}, handleUploadError);

instructorRouter.get("/my-courses", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can view their courses." });
    }

    const creatorId = req.userId;
    try {
        const courses = await CourseModel.find({ creatorId: creatorId })
            .populate('category', 'name')
            .populate({
                path: 'sections',
                populate: {
                    path: 'lectures'
                }
            })
            .sort({ createdAt: -1 });

        courses.forEach(course => {
            course.sections.forEach(section => {
                section.lectures.forEach(lecture => {
                    if (lecture.type === 'quiz') {
                        console.log(`Quiz lecture "${lecture.title}" has quizId:`, lecture.quizId);
                    }
                });
            });
        });

        res.status(200).json({ message: "Courses fetched successfully", courses: courses });
    } catch (error) {
        console.error("Error fetching instructor's courses:", error);
        res.status(500).json({ message: "An error occurred while fetching courses", error: error.message });
    }
});


instructorRouter.delete("/course/:courseId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can delete courses." });
    }

    const creatorId = req.userId;
    const courseId = req.params.courseId;

    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid course ID format." });
    }

    try {
        const deletedCourse = await CourseModel.findOneAndDelete({ _id: courseId, creatorId: creatorId });

        if (!deletedCourse) {
            return res.status(404).json({ message: "Course not found or you don't have permission to delete it." });
        }

        await UserModel.findByIdAndUpdate(creatorId, { $pull: { createdCourses: courseId } });

        const sections = await SectionModel.find({ courseId: courseId });
        const sectionIds = sections.map(s => s._id);

        if (sectionIds.length > 0) {
            
            const lectures = await LectureModel.find({ sectionId: { $in: sectionIds } });
            const lectureIds = lectures.map(l => l._id);

            if (lectureIds.length > 0) {
                await QuizModel.deleteMany({ lectureId: { $in: lectureIds } });
                await QuestionModel.deleteMany({ quizId: { $in: lectures.filter(l => l.type === 'quiz').map(l => l.quizId) } }); // Delete questions related to deleted quizzes
                await AssignmentSubmissionModel.deleteMany({ lectureId: { $in: lectureIds } }); // Delete submissions for these assignments
                await UserLectureProgressModel.deleteMany({ lectureId: { $in: lectureIds } }); // Delete user progress for these lectures
            }
            await LectureModel.deleteMany({ sectionId: { $in: sectionIds } });
            await SectionModel.deleteMany({ courseId: courseId });
        }

       

        res.status(200).json({ message: "Course deleted successfully", courseId: deletedCourse._id });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: "An error occurred while deleting the course", error: error.message });
    }
});



instructorRouter.post('/section', authMiddleware, async (req, res) => {
  if (req.userRole !== 'instructor') {
    return res.status(403).json({ message: 'Access denied. Only instructors can create sections.', error: 'Forbidden' });
  }

  const validationResult = createSectionSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      message: 'Invalid input data for section creation',
      error: 'ValidationError',
      details: validationResult.error.errors,
    });
  }

  const { courseId, title, order } = validationResult.data;
  const instructorId = req.userId;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const course = await checkCourseOwnership(courseId, instructorId);
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Course not found or you don't have permission to add sections to it.", error: 'NotFound' });
    }

    const newSection = await SectionModel.create([{ courseId, title, order, lectures: [] }], { session });
    await CourseModel.findByIdAndUpdate(courseId, { $push: { sections: newSection[0]._id } }, { session });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ message: 'Section created successfully', section: newSection[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating section:', error);
    res.status(500).json({ message: 'An error occurred while creating the section', error: error.message });
  }
});

instructorRouter.get('/sections/:courseId', authMiddleware, async (req, res) => {
  if (req.userRole !== 'instructor') {
    return res.status(403).json({ message: 'Access denied. Only instructors can view sections.', error: 'Forbidden' });
  }

  const courseId = req.params.courseId;
  const instructorId = req.userId;

  if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid course ID format.', error: 'ValidationError' });
  }

  try {
    const course = await checkCourseOwnership(courseId, instructorId);
    if (!course) {
      return res.status(404).json({ message: "Course not found or you don't have permission to view its sections.", error: 'NotFound' });
    }

    const sections = await SectionModel.find({ courseId })
      .populate({
        path: 'lectures',
        populate: [
          { path: 'quizId', select: 'title description passPercentage' },
          { path: 'assignmentSubmissionId', select: 'submissionUrl grade feedback' },
        ],
      })
      .sort({ order: 1 });

    res.status(200).json({ message: 'Sections fetched successfully', sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'An error occurred while fetching sections', error: error.message });
  }
});

instructorRouter.put('/section/:sectionId', authMiddleware, async (req, res) => {
  if (req.userRole !== 'instructor') {
    return res.status(403).json({ message: 'Access denied. Only instructors can update sections.' });
  }

  const sectionId = req.params.sectionId;
  const instructorId = req.userId;

  const validationResult = updateSectionSchema.safeParse({ ...req.body, sectionId });
  if (!validationResult.success) {
    return res.status(400).json({ message: 'Invalid input data for section update', errors: validationResult.error.errors });
  }

  const { title, order } = validationResult.data;

  try {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    const course = await checkCourseOwnership(section.courseId, instructorId);
    if (!course) {
      return res.status(403).json({ message: "You don't have permission to update this section." });
    }

    const updatedSection = await SectionModel.findByIdAndUpdate(
      sectionId,
      { $set: { title, order } },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Section updated successfully', section: updatedSection });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ message: 'An error occurred while updating the section', error: error.message });
  }
});

instructorRouter.delete('/section/:sectionId', authMiddleware, async (req, res) => {
  if (req.userRole !== 'instructor') {
    return res.status(403).json({ message: 'Access denied. Only instructors can delete sections.' });
  }

  const sectionId = req.params.sectionId;
  const instructorId = req.userId;

  if (!sectionId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid section ID format.' });
  }

  try {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found.' });
    }

    const course = await checkCourseOwnership(section.courseId, instructorId);
    if (!course) {
      return res.status(403).json({ message: "You don't have permission to delete this section." });
    }

    await CourseModel.findByIdAndUpdate(section.courseId, { $pull: { sections: sectionId } });

    const lectures = await LectureModel.find({ sectionId });
    const lectureIds = lectures.map((l) => l._id);

    if (lectureIds.length > 0) {
      await QuizModel.deleteMany({ lectureId: { $in: lectureIds } });
      await QuestionModel.deleteMany({ quizId: { $in: lectures.filter((l) => l.type === 'quiz').map((l) => l.quizId) } });
      await AssignmentSubmissionModel.deleteMany({ lectureId: { $in: lectureIds } });
      await UserLectureProgressModel.deleteMany({ lectureId: { $in: lectureIds } });
    }
    await LectureModel.deleteMany({ sectionId });
    await SectionModel.findByIdAndDelete(sectionId);

    res.status(200).json({ message: 'Section deleted successfully', sectionId });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ message: 'An error occurred while deleting the section', error: error.message });
  }
});


// Lecture Routes 


instructorRouter.post("/upload-video", authMiddleware, uploadVideo, async (req, res) => {
    try {
        if (req.userRole !== 'instructor') {
            return res.status(403).json({ message: "Access denied. Only instructors can upload videos." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No video file uploaded." });
        }

        // Return the video URL
        const videoUrl = `/uploads/videos/${req.file.filename}`;

        res.status(200).json({
            message: "Video uploaded successfully",
            videoUrl: videoUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "An error occurred while uploading the video", error: error.message });
    }
});


instructorRouter.post("/lecture", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can create lectures." });
    }

    const validationResult = createLectureSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input data for lecture creation", errors: validationResult.error.errors });
    }

    const { sectionId, title, type, contentUrl, textContent, duration, order, isPublished } = validationResult.data;
    const instructorId = req.userId;

    try {
        const section = await SectionModel.findById(sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found." });
        }

        const course = await checkCourseOwnership(section.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to add lectures to this section." });
        }

        const newLecture = await LectureModel.create({
            sectionId,
            courseId: section.courseId,
            title,
            type,
            contentUrl,
            textContent,
            duration,
            order,
            isPublished
        });

        await SectionModel.findByIdAndUpdate(sectionId, { $addToSet: { lectures: newLecture._id } });

        res.status(201).json({ message: "Lecture created successfully", lecture: newLecture });
    } catch (error) {
        console.error("Error creating lecture:", error);
        res.status(500).json({ message: "An error occurred while creating the lecture", error: error.message });
    }
});


instructorRouter.get("/lecture/:lectureId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can view individual lectures." });
    }

    const lectureId = req.params.lectureId;
    const instructorId = req.userId;

    if (!lectureId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid lecture ID format." });
    }

    try {
        const lecture = await LectureModel.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }

        const course = await checkCourseOwnership(lecture.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to view this lecture." });
        }

        res.status(200).json({ message: "Lecture fetched successfully", lecture });
    } catch (error) {
        console.error("Error fetching lecture:", error);
        res.status(500).json({ message: "An error occurred while fetching the lecture", error: error.message });
    }
});



instructorRouter.put("/lecture/:lectureId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can update lectures." });
    }

    const lectureId = req.params.lectureId;
    const instructorId = req.userId;

    console.log('Lecture update request:', { lectureId, body: req.body });

    const validationResult = updateLectureSchema.safeParse({ ...req.body, lectureId });
    if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.errors);
        return res.status(400).json({ message: "Invalid input data for lecture update", errors: validationResult.error.errors });
    }

    const updateData = validationResult.data;
    console.log('Update data after validation:', updateData);

    try {
        const lecture = await LectureModel.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }

        const course = await checkCourseOwnership(lecture.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to update this lecture." });
        }

        const updatedLecture = await LectureModel.findByIdAndUpdate(
            lectureId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        console.log('Lecture updated successfully:', updatedLecture);
        res.status(200).json({ message: "Lecture updated successfully", lecture: updatedLecture });
    } catch (error) {
        console.error("Error updating lecture:", error);
        res.status(500).json({ message: "An error occurred while updating the lecture", error: error.message });
    }
});

// Route to delete a lecture
instructorRouter.delete("/lecture/:lectureId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can delete lectures." });
    }

    const lectureId = req.params.lectureId;
    const instructorId = req.userId;

    if (!lectureId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid lecture ID format." });
    }

    try {
        const lecture = await LectureModel.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }

        const course = await checkCourseOwnership(lecture.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to delete this lecture." });
        }

        await SectionModel.findByIdAndUpdate(lecture.sectionId, { $pull: { lectures: lectureId } });

        // Delete associated quiz/questions or assignment submission if lecture type matches
        if (lecture.type === 'quiz' && lecture.quizId) {
            await QuizModel.findByIdAndDelete(lecture.quizId);
            await QuestionModel.deleteMany({ quizId: lecture.quizId });
            await UserQuizAttemptModel.deleteMany({ quizId: lecture.quizId }); // 
        }
        if (lecture.type === 'assignment' && lecture.assignmentSubmissionId) {
           
            await AssignmentSubmissionModel.deleteMany({ lectureId: lectureId });
        }
        await UserLectureProgressModel.deleteMany({ lectureId: lectureId }); // 

        await LectureModel.findByIdAndDelete(lectureId);

        res.status(200).json({ message: "Lecture deleted successfully", lectureId });
    } catch (error) {
        console.error("Error deleting lecture:", error);
        res.status(500).json({ message: "An error occurred while deleting the lecture", error: error.message });
    }
});


// Quiz Routes

// Test route to verify quiz endpoint is reachable
instructorRouter.get("/quiz/test", (req, res) => {
    console.log('🧪 Quiz test endpoint hit!');
    res.json({ message: "Quiz endpoint is working!", timestamp: new Date() });
});

// Route to create a quiz for a specific lecture
instructorRouter.post("/quiz", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can create quizzes." });
    }

    console.log('Quiz creation request:', req.body);

    const validationResult = createQuizSchema.safeParse(req.body);
    if (!validationResult.success) {
        console.log('Quiz validation failed:', validationResult.error.errors);
        return res.status(400).json({ message: "Invalid input data for quiz creation", errors: validationResult.error.errors });
    }

    const { lectureId, title, description, passPercentage, isPublished } = validationResult.data;
    const instructorId = req.userId;
    console.log('Quiz creation data:', { lectureId, title, description, passPercentage, isPublished, instructorId });

    try {
        const lecture = await LectureModel.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }
        if (lecture.type !== 'quiz') {
            return res.status(400).json({ message: "Quiz can only be created for a lecture of type 'quiz'." });
        }
        if (lecture.quizId) {
            return res.status(409).json({ message: "This lecture already has a quiz associated with it." });
        }

        const course = await checkCourseOwnership(lecture.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to create a quiz for this lecture." });
        }

        const newQuiz = await QuizModel.create({
            lectureId,
            courseId: lecture.courseId,
            title,
            description,
            passPercentage,
            isPublished
        });
        console.log('Quiz created:', newQuiz._id);

        const updatedLecture = await LectureModel.findByIdAndUpdate(
            lectureId,
            { quizId: newQuiz._id },
            { new: true }
        );
        console.log('Lecture updated with quizId:', updatedLecture.quizId);

        res.status(201).json({ message: "Quiz created successfully", quiz: newQuiz });
    } catch (error) {
        console.error("Error creating quiz:", error);
        res.status(500).json({ message: "An error occurred while creating the quiz", error: error.message });
    }
});

// Route to get a specific quiz by ID
instructorRouter.get("/quiz/:quizId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can view quizzes." });
    }

    const quizId = req.params.quizId;
    const instructorId = req.userId;

    if (!quizId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid quiz ID format." });
    }

    try {
        const quiz = await QuizModel.findById(quizId).populate('questions').populate('lectureId', 'title courseId');
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const course = await checkCourseOwnership(quiz.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to view this quiz." });
        }

        res.status(200).json({ message: "Quiz fetched successfully", quiz });
    } catch (error) {
        console.error("Error fetching quiz:", error);
        res.status(500).json({ message: "An error occurred while fetching the quiz", error: error.message });
    }
});

// Route to update a quiz
instructorRouter.put("/quiz/:quizId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can update quizzes." });
    }

    const quizId = req.params.quizId;
    const instructorId = req.userId;

    const validationResult = updateQuizSchema.safeParse({ ...req.body, quizId });
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input data for quiz update", errors: validationResult.error.errors });
    }

    const updateData = validationResult.data;

    try {
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const course = await checkCourseOwnership(quiz.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to update this quiz." });
        }

        const updatedQuiz = await QuizModel.findByIdAndUpdate(
            quizId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Quiz updated successfully", quiz: updatedQuiz });
    } catch (error) {
        console.error("Error updating quiz:", error);
        res.status(500).json({ message: "An error occurred while updating the quiz", error: error.message });
    }
});

// Route to delete a quiz
instructorRouter.delete("/quiz/:quizId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can delete quizzes." });
    }

    const quizId = req.params.quizId;
    const instructorId = req.userId;

    if (!quizId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid quiz ID format." });
    }

    try {
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const course = await checkCourseOwnership(quiz.courseId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to delete this quiz." });
        }

        
        await LectureModel.findByIdAndUpdate(quiz.lectureId, { $unset: { quizId: 1 } });

       
        await QuestionModel.deleteMany({ quizId: quizId });
        await UserQuizAttemptModel.deleteMany({ quizId: quizId });

        await QuizModel.findByIdAndDelete(quizId);

        res.status(200).json({ message: "Quiz deleted successfully", quizId });
    } catch (error) {
        console.error("Error deleting quiz:", error);
        res.status(500).json({ message: "An error occurred while deleting the quiz", error: error.message });
    }
});


// Question Routes 

// Route to add a new question to a quiz
instructorRouter.post("/question", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can add questions." });
    }

    const validationResult = createQuestionSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input data for question creation", errors: validationResult.error.errors });
    }

    const { quizId, text, type, options, correctAnswer, order } = validationResult.data;
    const instructorId = req.userId;

    try {
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found." });
        }

        const course = await checkQuizOwnership(quizId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to add questions to this quiz." });
        }

        const newQuestion = await QuestionModel.create({
            quizId,
            courseId: quiz.courseId, 
            text,
            type,
            options,
            correctAnswer,
            order
        });

       
        await QuizModel.findByIdAndUpdate(quizId, { $addToSet: { questions: newQuestion._id } });

        res.status(201).json({ message: "Question added successfully", question: newQuestion });
    } catch (error) {
        console.error("Error adding question:", error);
        res.status(500).json({ message: "An error occurred while adding the question", error: error.message });
    }
});

// Route to update a question
instructorRouter.put("/question/:questionId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can update questions." });
    }

    const questionId = req.params.questionId;
    const instructorId = req.userId;

    const validationResult = updateQuestionSchema.safeParse({ ...req.body, questionId });
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input data for question update", errors: validationResult.error.errors });
    }

    const updateData = validationResult.data;

    try {
        const question = await QuestionModel.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        const course = await checkQuestionOwnership(questionId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to update this question." });
        }

        const updatedQuestion = await QuestionModel.findByIdAndUpdate(
            questionId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Question updated successfully", question: updatedQuestion });
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({ message: "An error occurred while updating the question", error: error.message });
    }
});

// Route to delete a question
instructorRouter.delete("/question/:questionId", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can delete questions." });
    }

    const questionId = req.params.questionId;
    const instructorId = req.userId;

    if (!questionId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid question ID format." });
    }

    try {
        const question = await QuestionModel.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        const course = await checkQuestionOwnership(questionId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to delete this question." });
        }

      
        await QuizModel.findByIdAndUpdate(question.quizId, { $pull: { questions: questionId } });

        await QuestionModel.findByIdAndDelete(questionId);

        res.status(200).json({ message: "Question deleted successfully", questionId });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({ message: "An error occurred while deleting the question", error: error.message });
    }
});

// Assignment Submission Routes 


instructorRouter.get("/assignment/:lectureId/submissions", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can view submissions." });
    }

    const lectureId = req.params.lectureId;
    const instructorId = req.userId;

    if (!lectureId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid lecture ID format." });
    }

    try {
        const lecture = await LectureModel.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found." });
        }
        if (lecture.type !== 'assignment') {
            return res.status(400).json({ message: "This lecture is not an assignment." });
        }

        const course = await checkLectureOwnership(lectureId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to view submissions for this assignment." });
        }

        const submissions = await AssignmentSubmissionModel.find({ lectureId: lectureId })
            .populate('userId', 'firstName lastName email profilePicture') 
            .sort({ createdAt: -1 }); 

        res.status(200).json({ message: "Assignment submissions fetched successfully", submissions });
    } catch (error) {
        console.error("Error fetching assignment submissions:", error);
        res.status(500).json({ message: "An error occurred while fetching assignment submissions", error: error.message });
    }
});

// Route to grade an assignment submission
instructorRouter.put("/submission/:submissionId/grade", authMiddleware, async (req, res) => {
    if (req.userRole !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Only instructors can grade submissions." });
    }

    const submissionId = req.params.submissionId;
    const instructorId = req.userId;

    const validationResult = gradeAssignmentSchema.safeParse({ ...req.body, submissionId });
    if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid input data for grading", errors: validationResult.error.errors });
    }

    const { grade, feedback } = validationResult.data;

    try {
        const submission = await AssignmentSubmissionModel.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: "Submission not found." });
        }

        // Verify instructor 
        const course = await checkLectureOwnership(submission.lectureId, instructorId);
        if (!course) {
            return res.status(403).json({ message: "You don't have permission to grade this submission." });
        }

        const updatedSubmission = await AssignmentSubmissionModel.findByIdAndUpdate(
            submissionId,
            {
                $set: {
                    grade,
                    feedback,
                    gradedBy: instructorId,
                    gradedAt: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Submission graded successfully", submission: updatedSubmission });
    } catch (error) {
        console.error("Error grading submission:", error);
        res.status(500).json({ message: "An error occurred while grading the submission", error: error.message });
    }
});


module.exports = instructorRouter;
