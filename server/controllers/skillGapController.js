const { analyzeSkillGap } = require("../services/geminiService");

const analyzeSkills = async (req, res) => {
  try {
    const {
      currentSkills,
      skills,
      targetRole,
      role,
      jobDescription,
      isRegenerate,
    } = req.body;

    const chosenSkills = currentSkills || skills || "";
    const chosenRole = targetRole || role || "";
    const chosenDesc = jobDescription || "";

    if (!chosenSkills?.trim() || !chosenRole?.trim()) {
      return res.status(400).json({ message: "Current Skills and Target Role are required" });
    }

    const analysis = await analyzeSkillGap({
      currentSkills: chosenSkills.trim(),
      targetRole: chosenRole.trim(),
      jobDescription: chosenDesc.trim(),
      isRegenerate: Boolean(isRegenerate),
    });

    res.json({
      message: "Skill gap analysis completed successfully",
      analysis,
    });
  } catch (error) {
    console.error("Skill gap controller error:", error);
    res.status(500).json({ message: "Failed to analyze skill gap" });
  }
};

module.exports = {
  analyzeSkills,
};
