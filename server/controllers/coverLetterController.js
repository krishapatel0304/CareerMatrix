const pool = require("../config/db");
const { generateCoverLetterText } = require("../services/geminiService");

const generateCoverLetter = async (req, res) => {
  try {
    const {
      careerField,
      field,
      industry,
      jobRole,
      role,
      targetRole,
      companyName,
      company,
      jobDescription,
      userSkills,
      skills,
      experience,
      education,
      projects,
      certifications,
      candidateName,
      name,
      isRegenerate,
    } = req.body;

    const chosenRole = jobRole || role || targetRole || "";
    const chosenCompany = companyName || company || "";
    const chosenField = careerField || field || industry || "";
    let chosenSkills = userSkills || skills || "";
    let chosenExp = experience || "";
    let chosenEdu = education || "";
    let chosenProj = projects || "";
    let chosenCert = certifications || "";
    const chosenDesc = jobDescription || "";

    if (!chosenRole?.trim() || !chosenCompany?.trim()) {
      return res.status(400).json({
        message: "Job Role and Company Name are required",
      });
    }

    // Get candidate profile and resume information
    let userName = candidateName || name || "";
    let userCity = "";
    try {
      const userRes = await pool.query(
        "SELECT name, city FROM users WHERE id = $1",
        [req.user.userId]
      );
      if (userRes.rows.length > 0) {
        if (!userName) userName = userRes.rows[0].name;
        userCity = userRes.rows[0].city;
      }
    } catch (dbErr) {
      console.warn("Could not fetch user name for cover letter:", dbErr.message);
    }

    // If skills, education, or experience are empty, fetch from saved resume
    try {
      const resumeRes = await pool.query(
        "SELECT personal_info, professional_info FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
        [req.user.userId]
      );
      if (resumeRes.rows.length > 0) {
        const pers = resumeRes.rows[0].personal_info || {};
        const prof = resumeRes.rows[0].professional_info || {};
        if (!userName && pers.name) userName = pers.name;
        if (!userCity && pers.city) userCity = pers.city;
        if (!chosenSkills && prof.skills) chosenSkills = prof.skills;
        if (!chosenExp && prof.experience) chosenExp = prof.experience;
        if (!chosenEdu && prof.education) chosenEdu = prof.education;
        if (!chosenProj && prof.projects) chosenProj = prof.projects;
        if (!chosenCert && prof.certifications) chosenCert = prof.certifications;
      }
    } catch (rErr) {
      console.warn("Could not fetch saved resume for cover letter context:", rErr.message);
    }

    const coverLetter = await generateCoverLetterText({
      careerField: chosenField.trim(),
      jobRole: chosenRole.trim(),
      companyName: chosenCompany.trim(),
      jobDescription: chosenDesc.trim(),
      userSkills: chosenSkills.trim(),
      experience: chosenExp.trim(),
      education: chosenEdu.trim(),
      projects: chosenProj.trim(),
      certifications: chosenCert.trim(),
      userName,
      userCity,
      isRegenerate: Boolean(isRegenerate),
    });

    res.json({
      message: "Cover letter generated successfully",
      coverLetter,
    });
  } catch (error) {
    console.error("Cover letter controller error:", error);
    res.status(500).json({ message: "Failed to generate cover letter" });
  }
};

module.exports = {
  generateCoverLetter,
};
