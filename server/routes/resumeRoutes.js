const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const resumeController = require("../controllers/resumeController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.use(authMiddleware);

router.get("/", resumeController.getResume);
router.post("/", resumeController.saveResume);
router.post("/generate", resumeController.generateResume);
router.post("/upload", upload.single("resume"), resumeController.uploadResume);

module.exports = router;
