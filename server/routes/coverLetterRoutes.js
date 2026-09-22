const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const coverLetterController = require("../controllers/coverLetterController");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate", coverLetterController.generateCoverLetter);

module.exports = router;
