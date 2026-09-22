const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const interviewController = require("../controllers/interviewController");

const router = express.Router();

router.use(authMiddleware);

// Practice question bank endpoint
router.post("/generate", interviewController.generateQuestions);

// Realistic Mock Interview endpoints
router.post("/start", interviewController.startMockInterview);
router.post("/next-question", interviewController.handleNextQuestion);
router.post("/regenerate-question", interviewController.handleRegenerateQuestion);
router.post("/evaluate", interviewController.handleEvaluateInterview);

module.exports = router;
