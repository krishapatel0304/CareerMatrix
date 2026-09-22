const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roadmapController = require("../controllers/roadmapController");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate", roadmapController.generateRoadmap);

module.exports = router;
