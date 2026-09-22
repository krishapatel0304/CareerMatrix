const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const externalJobController = require("../controllers/externalJobController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", externalJobController.getExternalJobs);

module.exports = router;
