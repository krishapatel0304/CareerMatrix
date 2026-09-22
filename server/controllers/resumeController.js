const pool = require("../config/db");
const { generateResumeContent, parseResumeText } = require("../services/geminiService");
const pdfParse = require("pdf-parse");

// Get saved resume for authenticated user
const getResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      "SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ resume: null });
    }

    const row = result.rows[0];
    res.json({
      resume: {
        id: row.id,
        template: row.template || "Professional",
        personal: row.personal_info || {},
        professional: row.professional_info || {},
        generatedContent: row.generated_content || null,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({ message: "Failed to load resume" });
  }
};

// Save/Upsert resume for authenticated user
const saveResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { template, personal, professional, generatedContent } = req.body;

    const templ = template || "Professional";
    const personalInfo = personal || {};
    const professionalInfo = professional || {};
    const genContent = generatedContent || null;

    const result = await pool.query(
      `INSERT INTO resumes (user_id, template, personal_info, professional_info, generated_content, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE
       SET template = EXCLUDED.template,
           personal_info = EXCLUDED.personal_info,
           professional_info = EXCLUDED.professional_info,
           generated_content = EXCLUDED.generated_content,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, templ, JSON.stringify(personalInfo), JSON.stringify(professionalInfo), JSON.stringify(genContent)]
    );

    const saved = result.rows[0];
    res.json({
      message: "Resume saved successfully",
      resume: {
        id: saved.id,
        template: saved.template,
        personal: saved.personal_info,
        professional: saved.professional_info,
        generatedContent: saved.generated_content,
        updatedAt: saved.updated_at,
      },
    });
  } catch (error) {
    console.error("Save resume error:", error);
    res.status(500).json({ message: "Failed to save resume" });
  }
};

// Generate AI enhanced resume content
const generateResume = async (req, res) => {
  try {
    const { personal, professional, template, careerField, isRegenerate } = req.body;
    const effField = careerField || professional?.careerField || "";

    const content = await generateResumeContent({
      careerField: effField,
      personal: personal || {},
      professional: professional || {},
      template: template || "Professional",
      isRegenerate: Boolean(isRegenerate),
    });

    res.json({
      message: "Resume content generated successfully",
      generatedContent: content,
    });
  } catch (error) {
    console.error("Generate resume error:", error);
    res.status(500).json({ message: "Failed to generate AI resume content" });
  }
};

// Upload resume file and parse text
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    let extractedText = "";
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname.toLowerCase();

    if (mimeType === "application/pdf" || originalName.endsWith(".pdf")) {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr) {
        console.warn("PDF parsing error:", pdfErr.message);
        extractedText = req.file.buffer.toString("utf-8");
      }
    } else {
      extractedText = req.file.buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      extractedText = `Extracted candidate data from file ${req.file.originalname}`;
    }

    const parsedData = await parseResumeText(extractedText);

    // Auto-save parsed data to user's resume if user is logged in
    try {
      await pool.query(
        `INSERT INTO resumes (user_id, template, personal_info, professional_info, updated_at)
         VALUES ($1, 'Professional', $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE
         SET personal_info = EXCLUDED.personal_info,
             professional_info = EXCLUDED.professional_info,
             updated_at = CURRENT_TIMESTAMP`,
        [req.user.userId, JSON.stringify(parsedData.personal), JSON.stringify(parsedData.professional)]
      );
    } catch (saveErr) {
      console.warn("Could not auto-persist uploaded resume:", saveErr.message);
    }

    res.json({
      message: "Resume parsed successfully",
      data: parsedData,
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    res.status(500).json({ message: "Failed to parse resume file" });
  }
};

module.exports = {
  getResume,
  saveResume,
  generateResume,
  uploadResume,
};
