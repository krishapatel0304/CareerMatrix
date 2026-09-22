const pool = require("../config/db");
const {
  generateInterviewQuestions,
  generateMockInterview,
  generateNextMockQuestion,
  regenerateMockQuestion,
  evaluateMockInterview,
} = require("../services/geminiService");

// Helper to fetch user resume background from DB
const getUserResumeContext = async (userId) => {
  if (!userId) return {};
  try {
    const res = await pool.query(
      "SELECT personal_info, professional_info, generated_content FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );
    if (res.rows.length > 0) {
      const pers = res.rows[0].personal_info || {};
      const prof = res.rows[0].professional_info || {};
      const gen = res.rows[0].generated_content || {};
      return {
        candidateName: pers.name || "",
        education: prof.education || "",
        experience: prof.experience || "",
        projects: prof.projects || "",
        certifications: prof.certifications || "",
        skills: prof.skills || "",
        objective: prof.objective || "",
        resumeData: {
          personal: pers,
          professional: prof,
          generatedContent: gen,
        },
      };
    }
  } catch (err) {
    console.warn("Could not load resume context for interview:", err.message);
  }
  return {};
};

/**
 * Generate practice interview question bank
 */
const generateQuestions = async (req, res) => {
  try {
    const {
      careerField,
      field,
      industry,
      role,
      targetRole,
      jobRole,
      difficulty,
      experienceLevel,
      level,
      skills,
      currentSkills,
      education,
      experience,
      projects,
      certifications,
      candidateName,
      objective,
      jobDescription,
      resumeData,
      isRegenerate,
      askedQuestions,
      previousQuestions,
    } = req.body;

    const resumeCtx = await getUserResumeContext(req.user?.userId);

    const chosenField = careerField || field || industry || "";
    const chosenRole = role || targetRole || jobRole || "Software Developer";
    const chosenSkills = skills || currentSkills || resumeData?.professional?.skills || resumeCtx.skills || "";
    const chosenDiff = difficulty || experienceLevel || level || "Intermediate";
    const chosenEdu = education || resumeData?.professional?.education || resumeCtx.education || "";
    const chosenExp = experience || resumeData?.professional?.experience || resumeCtx.experience || "";
    const chosenProj = projects || resumeData?.professional?.projects || resumeCtx.projects || "";
    const chosenCert = certifications || resumeData?.professional?.certifications || resumeCtx.certifications || "";
    const chosenName = candidateName || resumeData?.personal?.name || resumeCtx.candidateName || "";
    const chosenObj = objective || resumeData?.professional?.objective || resumeCtx.objective || "";
    const chosenDesc = jobDescription || "";
    const excludedList = Array.isArray(askedQuestions)
      ? askedQuestions
      : Array.isArray(previousQuestions)
      ? previousQuestions
      : [];

    if (!chosenRole?.trim()) {
      return res.status(400).json({ message: "Job Role is required" });
    }

    const interviewData = await generateInterviewQuestions({
      careerField: chosenField.trim(),
      role: chosenRole.trim(),
      difficulty: chosenDiff,
      skills: chosenSkills.trim(),
      education: chosenEdu.trim(),
      experience: chosenExp.trim(),
      projects: chosenProj.trim(),
      certifications: chosenCert.trim(),
      candidateName: chosenName,
      objective: chosenObj,
      resumeData: resumeData || resumeCtx.resumeData,
      jobDescription: chosenDesc.trim(),
      isRegenerate: Boolean(isRegenerate),
      askedQuestions: excludedList,
    });

    res.json({
      message: "Interview questions generated successfully",
      data: interviewData,
    });
  } catch (error) {
    console.error("Interview controller generateQuestions error:", error);
    res.status(500).json({ message: "Failed to generate interview questions" });
  }
};

/**
 * Start 9-Question Mock Interview
 */
const startMockInterview = async (req, res) => {
  try {
    const {
      careerField,
      field,
      industry,
      role,
      targetRole,
      jobRole,
      experienceLevel,
      difficulty,
      level,
      skills,
      currentSkills,
      education,
      experience,
      projects,
      certifications,
      candidateName,
      objective,
      jobDescription,
      resumeData,
      askedQuestions,
      previousQuestions,
      recentQuestions,
      sessionId,
      sessionCount,
      sessionNumber,
    } = req.body;

    const resumeCtx = await getUserResumeContext(req.user?.userId);

    const chosenField = careerField || field || industry || "";
    const chosenRole = role || targetRole || jobRole || "";
    const chosenSkills = skills || currentSkills || resumeData?.professional?.skills || resumeCtx.skills || "";
    const chosenExpLevel = experienceLevel || difficulty || level || "Intermediate";
    const chosenEdu = education || resumeData?.professional?.education || resumeCtx.education || "";
    const chosenExp = experience || resumeData?.professional?.experience || resumeCtx.experience || "";
    const chosenProj = projects || resumeData?.professional?.projects || resumeCtx.projects || "";
    const chosenCert = certifications || resumeData?.professional?.certifications || resumeCtx.certifications || "";
    const chosenName = candidateName || resumeData?.personal?.name || resumeCtx.candidateName || "";
    const chosenObj = objective || resumeData?.professional?.objective || resumeCtx.objective || "";
    const chosenDesc = jobDescription || "";
    const chosenAsked = Array.isArray(askedQuestions)
      ? askedQuestions
      : Array.isArray(previousQuestions)
      ? previousQuestions
      : [];
    const chosenRecent = Array.isArray(recentQuestions) ? recentQuestions : [];

    if (!chosenRole?.trim()) {
      return res.status(400).json({ message: "Target Job Role is required" });
    }

    const questions = await generateMockInterview({
      careerField: chosenField.trim(),
      role: chosenRole.trim(),
      experienceLevel: chosenExpLevel,
      skills: chosenSkills.trim(),
      education: chosenEdu.trim(),
      experience: chosenExp.trim(),
      projects: chosenProj.trim(),
      certifications: chosenCert.trim(),
      candidateName: chosenName,
      objective: chosenObj,
      resumeData: resumeData || resumeCtx.resumeData,
      jobDescription: chosenDesc.trim(),
      askedQuestions: chosenAsked,
      recentQuestions: chosenRecent,
      sessionId,
      sessionCount: typeof sessionCount === "number" ? sessionCount : sessionNumber,
    });

    res.json({
      message: "Mock interview initialized successfully",
      careerField: chosenField,
      role: chosenRole,
      experienceLevel: chosenExpLevel,
      totalQuestions: questions.length,
      sessionId,
      questions,
    });
  } catch (error) {
    console.error("Interview controller startMockInterview error:", error);
    res.status(500).json({ message: "Failed to initialize mock interview" });
  }
};

/**
 * Generate a single next question on-demand avoiding all previously asked questions
 */
const handleNextQuestion = async (req, res) => {
  try {
    const {
      careerField,
      field,
      industry,
      role,
      targetRole,
      jobRole,
      level,
      difficulty,
      experienceLevel,
      skills,
      currentSkills,
      education,
      experience,
      projects,
      certifications,
      candidateName,
      objective,
      jobDescription,
      resumeData,
      askedQuestions,
      previousQuestions,
      recentQuestions,
      sessionId,
      sessionCount,
      sessionNumber,
    } = req.body;

    const resumeCtx = await getUserResumeContext(req.user?.userId);

    const chosenField = careerField || field || industry || "";
    const chosenRole = role || targetRole || jobRole || "Engineering Professional";
    const chosenLevel = level || difficulty || experienceLevel || "Intermediate";
    const chosenSkills = skills || currentSkills || resumeData?.professional?.skills || resumeCtx.skills || "";
    const chosenEdu = education || resumeData?.professional?.education || resumeCtx.education || "";
    const chosenExp = experience || resumeData?.professional?.experience || resumeCtx.experience || "";
    const chosenProj = projects || resumeData?.professional?.projects || resumeCtx.projects || "";
    const chosenCert = certifications || resumeData?.professional?.certifications || resumeCtx.certifications || "";
    const chosenName = candidateName || resumeData?.personal?.name || resumeCtx.candidateName || "";
    const chosenObj = objective || resumeData?.professional?.objective || resumeCtx.objective || "";
    const chosenDesc = jobDescription || "";
    const chosenAsked = Array.isArray(askedQuestions)
      ? askedQuestions
      : Array.isArray(previousQuestions)
      ? previousQuestions
      : [];
    const chosenRecent = Array.isArray(recentQuestions) ? recentQuestions : [];

    if (!chosenRole?.trim()) {
      return res.status(400).json({ message: "Target Job Role is required" });
    }

    const questionData = await generateNextMockQuestion({
      careerField: chosenField.trim(),
      role: chosenRole.trim(),
      level: chosenLevel,
      skills: chosenSkills.trim(),
      education: chosenEdu.trim(),
      experience: chosenExp.trim(),
      projects: chosenProj.trim(),
      certifications: chosenCert.trim(),
      candidateName: chosenName,
      objective: chosenObj,
      resumeData: resumeData || resumeCtx.resumeData,
      jobDescription: chosenDesc.trim(),
      askedQuestions: chosenAsked,
      recentQuestions: chosenRecent,
      sessionId,
      sessionCount: typeof sessionCount === "number" ? sessionCount : sessionNumber,
    });

    res.json({
      message: "Next question generated successfully",
      question: questionData,
    });
  } catch (error) {
    console.error("Interview controller handleNextQuestion error:", error);
    res.status(500).json({ message: "Failed to generate next interview question" });
  }
};

/**
 * Regenerate a single mock question
 */
const handleRegenerateQuestion = async (req, res) => {
  console.log("REGENERATE API HIT");
  console.log("BODY:", req.body);
  try {
    const {
      careerField,
      field,
      industry,
      role,
      targetRole,
      jobRole,
      level,
      difficulty,
      experienceLevel,
      skills,
      currentSkills,
      education,
      experience,
      projects,
      certifications,
      candidateName,
      objective,
      jobDescription,
      resumeData,
      currentQuestion,
      askedQuestions,
      previousQuestions,
      recentQuestions,
      sessionId,
      sessionCount,
      sessionNumber,
    } = req.body;

    const resumeCtx = await getUserResumeContext(req.user?.userId);

    const chosenField = careerField || field || industry || "";
    const chosenRole = role || targetRole || jobRole || "Engineering Professional";
    const chosenLevel = level || difficulty || experienceLevel || "Intermediate";
    const chosenSkills = skills || currentSkills || resumeData?.professional?.skills || resumeCtx.skills || "";
    const chosenEdu = education || resumeData?.professional?.education || resumeCtx.education || "";
    const chosenExp = experience || resumeData?.professional?.experience || resumeCtx.experience || "";
    const chosenProj = projects || resumeData?.professional?.projects || resumeCtx.projects || "";
    const chosenCert = certifications || resumeData?.professional?.certifications || resumeCtx.certifications || "";
    const chosenName = candidateName || resumeData?.personal?.name || resumeCtx.candidateName || "";
    const chosenObj = objective || resumeData?.professional?.objective || resumeCtx.objective || "";
    const chosenDesc = jobDescription || "";
    const chosenAsked = Array.isArray(askedQuestions)
      ? askedQuestions
      : Array.isArray(previousQuestions)
      ? previousQuestions
      : [];
    const chosenRecent = Array.isArray(recentQuestions) ? recentQuestions : [];

    const questionData = await regenerateMockQuestion({
      careerField: chosenField.trim(),
      role: chosenRole.trim(),
      level: chosenLevel,
      skills: chosenSkills.trim(),
      education: chosenEdu.trim(),
      experience: chosenExp.trim(),
      projects: chosenProj.trim(),
      certifications: chosenCert.trim(),
      candidateName: chosenName,
      objective: chosenObj,
      resumeData: resumeData || resumeCtx.resumeData,
      jobDescription: chosenDesc.trim(),
      currentQuestion: currentQuestion || "",
      askedQuestions: chosenAsked,
      recentQuestions: chosenRecent,
      sessionId,
      sessionCount: typeof sessionCount === "number" ? sessionCount : sessionNumber,
    });

    res.json({
      message: "Question regenerated successfully",
      question: questionData,
    });
  } catch (error) {
    console.error("Interview controller regenerateQuestion error:", error);
    res.status(500).json({ message: "Failed to regenerate interview question" });
  }
};

/**
 * Evaluate Complete Mock Interview
 */
const handleEvaluateInterview = async (req, res) => {
  try {
    const {
      careerField,
      field,
      industry,
      role,
      targetRole,
      jobRole,
      experienceLevel,
      difficulty,
      skills,
      education,
      experience,
      projects,
      certifications,
      candidateName,
      resumeData,
      qaList,
      questionsAndAnswers,
    } = req.body;

    const resumeCtx = await getUserResumeContext(req.user?.userId);

    const chosenField = careerField || field || industry || "";
    const chosenRole = role || targetRole || jobRole || "";
    const chosenExp = experienceLevel || difficulty || "Intermediate";
    const actualQAList = qaList || questionsAndAnswers || [];

    const evaluation = await evaluateMockInterview({
      careerField: chosenField.trim(),
      role: chosenRole.trim(),
      experienceLevel: chosenExp,
      candidateName: candidateName || resumeData?.personal?.name || resumeCtx.candidateName || "",
      skills: skills || resumeData?.professional?.skills || resumeCtx.skills || "",
      education: education || resumeData?.professional?.education || resumeCtx.education || "",
      experience: experience || resumeData?.professional?.experience || resumeCtx.experience || "",
      projects: projects || resumeData?.professional?.projects || resumeCtx.projects || "",
      certifications: certifications || resumeData?.professional?.certifications || resumeCtx.certifications || "",
      resumeData: resumeData || resumeCtx.resumeData,
      qaList: actualQAList,
    });

    res.json({
      message: "Mock interview evaluated successfully",
      evaluation,
    });
  } catch (error) {
    console.error("Interview controller evaluateInterview error:", error);
    res.status(500).json({ message: "Failed to evaluate mock interview" });
  }
};

module.exports = {
  generateQuestions,
  startMockInterview,
  handleNextQuestion,
  handleRegenerateQuestion,
  handleEvaluateInterview,
};
