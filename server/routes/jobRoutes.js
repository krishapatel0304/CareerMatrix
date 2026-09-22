const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const jobController = require("../controllers/jobController");

const router = express.Router();

router.use(authMiddleware);

router.get("/stats", jobController.getJobStats);
router.get("/", jobController.getJobs);
router.get("/:id", jobController.getJobById);
router.post("/", jobController.createJob);
router.put("/:id", jobController.updateJob);
router.delete("/:id", jobController.deleteJob);

module.exports = router;
