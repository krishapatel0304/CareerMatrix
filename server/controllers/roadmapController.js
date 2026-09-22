const { generateCareerRoadmap } = require("../services/geminiService");

const generateRoadmap = async (req, res) => {
  try {
    const {
      currentRole,
      targetRole,
      role,
      currentSkills,
      skills,
      experienceLevel,
      experience,
      interests,
      isRegenerate,
    } = req.body;

    const chosenTargetRole = targetRole || role || "";
    const chosenCurrentSkills = currentSkills || skills || "";
    const chosenCurrentRole = currentRole || "";
    const chosenExp = experienceLevel || experience || "";
    const chosenInterests = interests || "";

    if (!chosenTargetRole?.trim()) {
      return res.status(400).json({ message: "Target Role is required to generate a career roadmap" });
    }

    const roadmap = await generateCareerRoadmap({
      currentRole: chosenCurrentRole.trim(),
      targetRole: chosenTargetRole.trim(),
      currentSkills: chosenCurrentSkills.trim(),
      experienceLevel: chosenExp.trim(),
      interests: chosenInterests.trim(),
      isRegenerate: Boolean(isRegenerate),
    });

    res.json({
      message: "Career roadmap generated successfully",
      roadmap,
    });
  } catch (error) {
    console.error("Roadmap controller error:", error);
    res.status(500).json({ message: "Failed to generate career roadmap" });
  }
};

module.exports = {
  generateRoadmap,
};
