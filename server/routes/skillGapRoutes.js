const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const skillGapController = require("../controllers/skillGapController");

const router = express.Router();

router.use(authMiddleware);

router.post("/analyze", skillGapController.analyzeSkills);

module.exports = router;
