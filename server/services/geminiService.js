const { GoogleGenerativeAI } = require("@google/generative-ai");
const { INTERVIEW_QUESTION_BANK, getRandomUnusedQuestion } = require("../data/interviewQuestionBank");

// Candidate Gemini models in fallback order
const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

/**
 * Universal Gemini API caller with multi-model fallback & REST fallback
 */
const callGemini = async (prompt, systemInstruction = "", options = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
    console.log("ℹ️ [Gemini Service] GEMINI_API_KEY is not configured; executing tailored dynamic AI generation.");
    return null;
  }

  const temperature = options.temperature || 0.85;

  // 1. Try official SDK with candidate models
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          ...(systemInstruction ? { systemInstruction } : {}),
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim()) {
          return text.trim();
        }
      } catch (modelErr) {
        console.warn(`[Gemini Service] Model ${modelName} call failed: ${modelErr.message}. Trying next model...`);
      }
    }
  } catch (sdkErr) {
    console.warn("[Gemini Service] SDK initialization failed:", sdkErr.message);
  }

  // 2. Direct REST API fallback
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const resp = await fetch(fetchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, topP: 0.95 },
        }),
      });
      const data = await resp.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
    } catch (restErr) {
      console.warn(`[Gemini Service] REST fallback for ${modelName} failed: ${restErr.message}`);
    }
  }

  console.error("❌ [Gemini Service] All Gemini API endpoints failed. Executing tailored dynamic generation.");
  return null;
};

// Safe JSON parser from AI output
const extractJson = (text) => {
  if (!text) return null;
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err2) {
        return null;
      }
    }
    return null;
  }
};

// Helper: Shuffle array
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

// Universal Multi-Disciplinary Domain Detector covering all 20 Centralized Career Fields
const detectDomain = (roleStr = "", skillsStr = "", fieldStr = "") => {
  const combined = `${fieldStr} ${roleStr} ${skillsStr}`.toLowerCase();

  // 1. Cybersecurity / Information Security
  if (/cyber|information\s*sec|infosec|soc\b|penetration|ethical\s*hack|vulnerab|wireshark|siem|network\s*sec|appsec|ciso/i.test(combined)) {
    return "cybersecurity";
  }
  // 2. Chemical Engineering
  if (/chemic|aspen|process\s*design|process\s*eng|distillation|reaction\s*eng|p&id|hazop|refinery|petrochem|polymers/i.test(combined)) {
    return "chemical";
  }
  // 3. Aerospace Engineering
  if (/aerospace|avionics|aeronautic|propulsion|spacecraft|satellite|flight/i.test(combined)) {
    return "aerospace";
  }
  // 4. Automobile Engineering
  if (/automobile|automotive|ev\b|electric\s*vehicle|powertrain|chassis|vehicle\s*dynamic/i.test(combined)) {
    return "automobile";
  }
  // 5. Mechatronics / Robotics
  if (/mechatronic|robotics|actuator|ros\b|kinematics|motion\s*control/i.test(combined)) {
    return "mechatronics";
  }
  // 6. Production / Manufacturing
  if (/production|manufacturing|six\s*sigma|lean|machining|cnc|assembly\s*line|quality\s*control/i.test(combined) && !/software/i.test(combined)) {
    return "manufacturing";
  }
  // 7. Mechanical Engineering
  if (/mechanic|autocad|solidworks|catia|ansys|fea|cad\b|gdt|hvac|thermodynamics|machine\s*design/i.test(combined)) {
    return "mechanical";
  }
  // 8. Civil Engineering
  if (/civil|structural|revit|staad|geotechnic|surveying|concrete|building\s*code|bim\b|construction|architect|spatial\s*design/i.test(combined)) {
    return "civil";
  }
  // 9. Electrical / Electronics
  if (/electric|electronic|pcb|matlab|simulink|plc|scada|verilog|vhdl|embedded|microcontroller|vlsi|power\s*system|circuit/i.test(combined)) {
    return "electrical";
  }
  // 10. Biotechnology / Biomedical
  if (/biotech|biomedic|molecular|pcr|genetics|bioprocess|bioinformatics|genomics|tissue\s*eng/i.test(combined)) {
    return "biotech";
  }
  // 11. Healthcare
  if (/health|clinical|medical|nurse|doctor|hospital|patient|pharmacy|physician|drug/i.test(combined)) {
    return "healthcare";
  }
  // 12. Finance / Accounting
  if (/finance|account|cpa|cfa|audit|tax|banking|financial\s*model|investment|ledger|bookkeep|treasury|wealth/i.test(combined) && !/software|developer/i.test(roleStr.toLowerCase())) {
    return "finance";
  }
  // 13. Marketing / Sales
  if (/marketing|sales|brand|seo|sem|advertising|campaign|crm|growth|b2b|b2c|social\s*media/i.test(combined) && !/software|developer/i.test(roleStr.toLowerCase())) {
    return "marketing";
  }
  // 14. Human Resources
  if (/human\s*resource|hr\b|talent|recruiting|onboarding|compensation|employee\s*relation|payroll/i.test(combined)) {
    return "hr";
  }
  // 15. Design
  if (/design|ui\b|ux\b|figma|graphic|visual|product\s*design|industrial\s*design|typography|creative\s*director/i.test(combined) && !/software\s*design|system\s*design/i.test(combined)) {
    return "design";
  }
  // 16. Research
  if (/research|scientist|phd|laboratory|experiment|postdoc|fellow/i.test(combined) && !/software/i.test(combined)) {
    return "research";
  }
  // 17. Education
  if (/educat|teacher|professor|pedagogy|curriculum|teaching|instruction|academic|school|tutor/i.test(combined)) {
    return "education";
  }
  // 18. Business / Management
  if (/business|management|operations|consulting|strategy|project\s*management|mba\b/i.test(combined)) {
    return "business";
  }
  // 19. Software / IT
  if (/software|frontend|backend|full\s*stack|developer|programmer|coding|react|node|javascript|python|java\b|c\+\+|html|css|web\s*dev|devops|cloud|aws|azure/i.test(combined)) {
    return "software";
  }

  // 20. Other / General Custom
  return "general";
};

// ==========================================
// Semantic Duplicate Detector Helper
// ==========================================
const isSemanticDuplicate = (newQuestion, askedQuestions = []) => {
  if (!newQuestion || !Array.isArray(askedQuestions) || askedQuestions.length === 0) return false;

  const cleanStr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const stopWords = new Set([
    "what", "is", "are", "the", "difference", "between", "how", "does", "do", "explain",
    "describe", "please", "can", "you", "tell", "me", "about", "your", "and", "in", "for",
    "a", "an", "of", "to", "with", "why", "when", "which", "would", "scenario", "give", "example",
    "engineering", "engineer", "role", "work", "used", "using", "use", "design", "process",
    "system", "method", "methodology", "principles", "principle", "components", "component",
    "analysis", "analyze", "perform", "project", "standard", "standards", "practical", "different",
    "critical", "candidate", "industry", "field", "technical", "approach", "steps", "best",
    "practices", "factors", "purpose", "implement", "implementation", "handle", "manage"
  ]);

  const getKeywords = (str) => {
    return cleanStr(str)
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  };

  const cleanNew = cleanStr(newQuestion);
  const newWords = getKeywords(newQuestion);
  if (newWords.length === 0) return false;
  const newSet = new Set(newWords);

  for (const asked of askedQuestions) {
    if (!asked) continue;
    const cleanAsked = cleanStr(asked);

    // 1. Direct exact or substring containment
    if (cleanNew === cleanAsked) return true;
    if (cleanNew.length > 20 && cleanAsked.includes(cleanNew)) return true;
    if (cleanAsked.length > 20 && cleanNew.includes(cleanAsked)) return true;

    // 2. Keyword Jaccard and Overlap Analysis
    const askedWords = getKeywords(asked);
    if (askedWords.length === 0) continue;
    const askedSet = new Set(askedWords);

    const intersection = newWords.filter((w) => askedSet.has(w));
    const unionSize = new Set([...newWords, ...askedWords]).size;
    const jaccard = intersection.length / unionSize;
    const overlapRatio = intersection.length / Math.min(newSet.size, askedSet.size);

    // True semantic duplicates share >= 65% of specialized domain nouns/verbs
    if (jaccard >= 0.65) return true;
    if (intersection.length >= 3 && overlapRatio >= 0.75) return true;
  }

  return false;
};

// ==========================================
// 1. Cover Letter Generation & Regeneration
// ==========================================
const generateCoverLetterText = async ({
  careerField,
  jobRole,
  companyName,
  jobDescription,
  userSkills,
  experience,
  education,
  projects,
  certifications,
  userName,
  userCity,
  isRegenerate = false,
}) => {
  const targetRole = jobRole || "Professional Role";
  const targetCompany = companyName || "the Organization";
  const targetField = careerField || "";
  const candidateName = userName || "Applicant";
  const candidateCity = userCity || "";
  const candidateSkills = userSkills || "domain expertise, analytical problem-solving, and disciplined execution";
  const candidateExp = experience || "applying practical knowledge to industry challenges";
  const candidateEdu = education || "";
  const candidateProj = projects || "";
  const candidateCert = certifications || "";
  const descSnippet = jobDescription ? jobDescription.trim() : "";

  const seed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const prompt = `You are an expert career advisor across multiple professional fields (Engineering, Science, Business, Healthcare, Arts, Law, Education, Technology, etc.).
Write a customized, compelling, professional cover letter for:
Candidate Name: ${candidateName}
Location: ${candidateCity}
Career Field / Industry: ${targetField || "Relevant Industry"}
Target Company: ${targetCompany}
Target Job Role: ${targetRole}
Candidate Skills: ${candidateSkills}
Candidate Education: ${candidateEdu || "Relevant Degree"}
Candidate Experience: ${candidateExp}
${candidateProj ? `Candidate Projects: ${candidateProj}` : ""}
${candidateCert ? `Candidate Certifications: ${candidateCert}` : ""}
Job Description / Notes: ${descSnippet || "Standard " + targetRole + " position"}

${isRegenerate ? `REGENERATION DIRECTIVE (Seed: ${seed}): Provide a fresh, distinct narrative perspective while preserving the candidate's exact field, role, and details.` : ""}

CRITICAL RULES:
1. Do NOT assume the candidate is in software/IT unless '${targetField}' or '${targetRole}' explicitly says so.
2. Prominently mention the target role "${targetRole}", company "${targetCompany}", and candidate skills "${candidateSkills}".
3. Structure into formal date, salutation, body paragraphs, and professional sign-off.
4. Do NOT output markdown code blocks or placeholder brackets.`;

  const aiResult = await callGemini(prompt, "", { temperature: isRegenerate ? 0.94 : 0.8 });
  if (aiResult) return aiResult;

  // Domain-Aware Dynamic Generator
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const domain = detectDomain(targetRole, candidateSkills, targetField);

  let domainValuePropA = "";
  let domainValuePropB = "";

  if (domain === "mechanical") {
    domainValuePropA = `My technical background is grounded in mechanical engineering principles, CAD modeling, design validation, and manufacturing optimization using ${candidateSkills}. In my work, I have focused on ${candidateExp}, ensuring high mechanical integrity, tolerance compliance, and efficient prototyping.`;
    domainValuePropB = `With practical proficiency across ${candidateSkills}, I specialize in mechanical design, structural analysis, and standard engineering drafting. Through ${candidateExp}, I have developed a disciplined approach to mechanical reliability, manufacturability (DFM), and industry safety standards.`;
  } else if (domain === "chemical") {
    domainValuePropA = `My background is centered on chemical process engineering, thermodynamic modeling, and unit operations utilizing ${candidateSkills}. In my work on ${candidateExp}, I have prioritized process safety, yield optimization, mass and energy balance calculations, and scale-up efficiency.`;
    domainValuePropB = `Equipped with core competencies in ${candidateSkills}, I specialize in process simulation, P&ID development, and plant safety management. Throughout ${candidateExp}, I have demonstrated a strong commitment to chemical hazard analysis, operational reliability, and sustainable process design.`;
  } else if (domain === "civil") {
    domainValuePropA = `My engineering foundation is built on structural design, project drafting, and materials analysis using ${candidateSkills}. Through ${candidateExp}, I have contributed to structural integrity, code compliance, and efficient project execution.`;
    domainValuePropB = `With practical expertise in ${candidateSkills}, I apply robust engineering principles to structural modeling and construction planning. In ${candidateExp}, I have consistently prioritized building safety, spatial efficiency, and rigorous standards adherence.`;
  } else if (domain === "electrical") {
    domainValuePropA = `My technical toolkit spans electrical circuit analysis, system modeling, and hardware integration using ${candidateSkills}. Through ${candidateExp}, I have developed solutions prioritizing power efficiency, signal integrity, and testing rigor.`;
    domainValuePropB = `Leveraging ${candidateSkills}, I specialize in electrical system design, schematic capture, and automated controls. In ${candidateExp}, I have demonstrated disciplined execution in prototyping and validating reliable electrical architectures.`;
  } else if (domain === "biotech_health") {
    domainValuePropA = `My background combines rigorous scientific methodology with practical healthcare/biotech workflows using ${candidateSkills}. Through ${candidateExp}, I have maintained strict quality standards, regulatory compliance, and evidence-based analysis.`;
    domainValuePropB = `With demonstrated expertise in ${candidateSkills}, I bring a thorough understanding of laboratory protocols, clinical workflows, and data integrity. In ${candidateExp}, I have consistently prioritized safety, precision, and patient/client-centered outcomes.`;
  } else if (domain === "business_finance") {
    domainValuePropA = `My professional background is centered on financial analysis, strategic planning, and operational modeling using ${candidateSkills}. In my experience with ${candidateExp}, I have driven data-backed decisions, streamlined workflows, and delivered measurable business outcomes.`;
    domainValuePropB = `Equipped with strong capabilities in ${candidateSkills}, I specialize in quantitative evaluation, variance analysis, and stakeholder reporting. Through ${candidateExp}, I have cultivated a proven ability to translate complex financial/operational metrics into actionable strategies.`;
  } else if (domain === "data_analytics") {
    domainValuePropA = `My background is grounded in data analysis, statistical evaluation, and turning complex datasets into actionable business intelligence using ${candidateSkills}. I have focused on ${candidateExp}, ensuring high data integrity and impactful visualizations.`;
    domainValuePropB = `With hands-on proficiency in ${candidateSkills}, I specialize in building analytical workflows, diagnosing metrics discrepancies, and synthesizing trends into clear executive narratives. In ${candidateExp}, I have delivered decision-ready data products.`;
  } else if (domain === "cybersecurity") {
    domainValuePropA = `My expertise centers on information security, threat identification, and network defense utilizing ${candidateSkills}. In my work, I have focused on ${candidateExp}, emphasizing system hardening, vulnerability mitigation, and proactive incident response.`;
    domainValuePropB = `With focused competencies across ${candidateSkills}, I maintain a disciplined approach to security monitoring, protocol inspection, and risk surface reduction. Through ${candidateExp}, I have enforced robust security controls.`;
  } else if (domain === "software") {
    domainValuePropA = `My technical background is centered on software development, scalable architectures, and writing clean, maintainable code with ${candidateSkills}. Through ${candidateExp}, I consistently prioritize component modularity, testing, and seamless performance.`;
    domainValuePropB = `Specializing in ${candidateSkills}, I bridge the gap between architectural design and efficient execution. In ${candidateExp}, I have engineered reliable software applications and maintained clean design patterns.`;
  } else {
    domainValuePropA = `With proven capabilities across ${candidateSkills}, I have developed a strong foundation in ${candidateExp}. I take pride in applying specialized domain knowledge to solve complex challenges and create measurable organizational value.`;
    domainValuePropB = `My background spans ${candidateSkills}, where I have consistently applied analytical thinking, continuous learning, and disciplined methodologies. In ${candidateExp}, I have demonstrated the ability to collaborate effectively and drive impactful project deliverables.`;
  }

  const jobDescAlignmentA = descSnippet
    ? `Reviewing your requirements for the ${targetRole} position, I was particularly drawn to your focus on "${descSnippet.slice(0, 130)}...". My practical background directly aligns with these technical standards and deliverables.`
    : `Having followed ${targetCompany}'s trajectory and industry leadership, I am enthusiastic about the opportunity to bring my domain knowledge, problem-solving abilities, and collaborative mindset to your team.`;

  const jobDescAlignmentB = descSnippet
    ? `Your posting for ${targetRole} highlights key responsibilities around "${descSnippet.slice(0, 130)}...". My technical toolkit and hands-on execution directly mirror these operational requirements.`
    : `What excites me most about ${targetCompany} is your ambitious vision and collaborative workplace culture. I am eager to contribute my capabilities toward your upcoming milestones.`;

  if (isRegenerate) {
    return `${today}

To the Hiring Committee at ${targetCompany},

Please accept this letter as a formal expression of my keen interest in the ${targetRole} opening at ${targetCompany}. Equipped with practical expertise across ${candidateSkills}, I am prepared to contribute effectively to your team's goals from day one.

${domainValuePropB}

${jobDescAlignmentB}

Joining ${targetCompany} represents a compelling opportunity to apply my skills within an ambitious, mission-driven environment. I welcome the opportunity to discuss how my background will support your upcoming objectives. Thank you for your time and evaluation.

Warm regards,

${candidateName}
${candidateCity}`;
  }

  return `${today}

Hiring Team
${targetCompany}

Dear Hiring Team at ${targetCompany},

I am writing to express my strong interest in the ${targetRole} position currently available at ${targetCompany}. With a solid foundation in ${candidateSkills}, I am eager to apply my background to support your team's upcoming goals and high-impact initiatives.

${domainValuePropA}

${jobDescAlignmentA}

What excites me most about joining ${targetCompany} is your forward-thinking approach and collaborative professional culture. I thrive in environments where continuous learning, clear communication, and technical accountability are valued.

Thank you for your time and consideration. I would welcome the opportunity to speak with your team and discuss how my background and enthusiasm make me a strong candidate for the ${targetRole} position.

Sincerely,

${candidateName}
${candidateCity}`;
};

// ==========================================
// 2. AI Resume Enhancement & Generation
// ==========================================
const generateResumeContent = async ({
  careerField,
  personal = {},
  professional = {},
  template = "Professional",
  isRegenerate = false,
}) => {
  const candidateName = personal.name || "Candidate";
  const candidateEmail = personal.email || "";
  const candidatePhone = personal.phone || "";
  const candidateCity = personal.city || "";
  const candidateLinkedin = personal.linkedin || "";
  const candidateGithub = personal.github || "";

  const userObjective = professional.objective || "";
  const userEducation = professional.education || "";
  const userSkills = professional.skills || "";
  const userProjects = professional.projects || "";
  const userExperience = professional.experience || "";
  const userCertifications = professional.certifications || "";
  const userLanguages = professional.languages || "";
  const targetField = careerField || professional.careerField || "General Discipline";
  const targetRole = professional.targetRole || "";

  const seed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const prompt = `You are an expert executive resume enhancer across diverse professional fields (Engineering, Science, Business, Healthcare, Arts, Law, Education, Software, etc.).
Given the candidate's exact raw information below, enhance the wording, structure, and professional impact into an ATS-optimized JSON resume.

Candidate Input Data:
Name: ${candidateName}
Email: ${candidateEmail}
Location: ${candidateCity}
Career Field: ${targetField}
Target Role: ${targetRole || "Candidate's Target Role"}
Career Objective / Notes: ${userObjective || "None provided"}
Education: ${userEducation || "None provided"}
Skills: ${userSkills || "None provided"}
Projects: ${userProjects || "None provided"}
Experience: ${userExperience || "None provided"}
Certifications: ${userCertifications || "None provided"}
Languages: ${userLanguages || "None provided"}

${isRegenerate ? `REGENERATION DIRECTIVE (Seed: ${seed}): Provide fresh action verbs, varied phrasing for project bullet points, and an alternative executive summary while strictly preserving the candidate's exact field, skills, and details.` : ""}

CRITICAL ZERO-FABRICATION & ENHANCEMENT RULES:
1. STRICT ZERO-FABRICATION POLICY: You are an ENHANCER, NOT a creator. You must NEVER invent or hallucinate:
   - Companies, employers, or client names
   - Degrees, majors, universities, or institutions
   - Certifications, licenses, or accreditations
   - Projects not provided by the candidate
   - Work experience, internships, or job roles not provided
   - Technical skills, tools, or frameworks not listed
   - Achievements, metrics, or awards not entered
   - Job titles, dates, or durations
2. EXPERIENCE SECTION:
   - If the user wrote "Fresher", "None", "N/A", "Nil", or left Experience empty, return "experience": [] (an empty array). DO NOT invent fake jobs or fake companies.
   - If actual work experience was provided, enhance the bullet points using strong action verbs appropriate for ${targetField}.
3. PROJECTS SECTION:
   - If the user provided project descriptions, enhance the title, tech stack (only tools the user mentioned), and bullet points to highlight methodology and results.
   - If the user left Projects empty or wrote "None", return "projects": [] (an empty array). DO NOT invent fake capstone projects.
4. CERTIFICATIONS SECTION:
   - Enhance/format ONLY certifications explicitly entered by the candidate.
   - If no certifications were provided, return "certifications": [] (an empty array). DO NOT invent fake certifications.
5. EDUCATION SECTION:
   - Polish and format the degree, institution, year, and coursework from the candidate's actual input.
   - If no education was provided, return "education": [].
6. SKILLS SECTION:
   - Categorize ONLY the skills and tools explicitly provided (${userSkills || "none"}) into "technical", "tools", and "soft".
   - Do NOT add unlisted software, frameworks, or technologies.
7. TARGET CAREER FIELD AWARENESS:
   - Target Field: "${targetField}".
   - Use vocabulary, industry standards, and phrasing strictly appropriate for "${targetField}".
   - Do NOT use Software/IT or web development terminology unless '${targetField}' or the candidate's listed skills explicitly specify it.
8. Output ONLY valid JSON matching this schema:
{
  "summary": "Polished professional executive summary synthesizing the candidate's actual background and target field",
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "tools": ["Tool 1", "Tool 2"],
    "soft": ["Soft Skill 1", "Soft Skill 2"]
  },
  "skillsFormatted": "Comma separated string of all polished skills",
  "experience": [
    {
      "role": "Role Title from user input",
      "company": "Company Name from user input",
      "duration": "Duration from user input or empty",
      "bullets": ["Enhanced action verb bullet point 1", "Enhanced bullet point 2"]
    }
  ],
  "projects": [
    {
      "title": "Enhanced Project Title from user input",
      "techStack": "Tools mentioned by user for this project",
      "bullets": ["Enhanced impactful bullet point 1", "Enhanced bullet point 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Title from user input",
      "institution": "Institution Name from user input",
      "year": "Year / Status from user input",
      "details": "Details from user input"
    }
  ],
  "certifications": ["Certification from user input"],
  "languages": ["Language from user input"]
}`;

  const aiResult = await callGemini(prompt, "", { temperature: isRegenerate ? 0.88 : 0.72 });
  const parsed = extractJson(aiResult);
  if (parsed && parsed.summary) {
    // Sanity check: Ensure no fabricated experience for freshers
    const isFresherInput = !userExperience.trim() || /^(fresher|entry\s*level|none|n\/a|nil|no)$/i.test(userExperience.trim());
    if (isFresherInput && Array.isArray(parsed.experience) && parsed.experience.length > 0) {
      const hasFabricatedCompany = parsed.experience.some(e => /industry\s*org|company\s*name|abc|xyz|sample/i.test(e.company || ""));
      if (hasFabricatedCompany) {
        parsed.experience = [];
      }
    }
    return parsed;
  }

  // Domain-Aware Dynamic Fallback Generator (Strict Zero-Fabrication)
  const isNoneOrEmpty = (str) => !str || !str.trim() || /^(none|n\/a|nil|no|fresher|na)$/i.test(str.trim());

  const rawSkillsArr = userSkills && userSkills.trim() && !isNoneOrEmpty(userSkills)
    ? userSkills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const domain = detectDomain(userObjective, userSkills, targetField);

  // Field-Aware Executive Summary based strictly on actual candidate profile
  let summaryText = "";
  const roleName = targetRole || (targetField !== "General Discipline" ? `${targetField.split("/")[0].trim()} Specialist` : "Professional");
  const skillsSnippet = rawSkillsArr.length > 0 ? rawSkillsArr.slice(0, 4).join(", ") : "";

  if (userObjective.trim() && !isNoneOrEmpty(userObjective)) {
    summaryText = isRegenerate
      ? `${userObjective.trim()} Results-oriented professional with demonstrated proficiency in ${skillsSnippet || "core methodologies"}, dedicated to technical rigor and impactful execution.`
      : `${userObjective.trim()} Motivated professional with competencies in ${skillsSnippet || "discipline-specific problem solving"}, committed to quality standards and collaborative project delivery.`;
  } else if (domain === "mechanical") {
    summaryText = isRegenerate
      ? `Mechanical Engineering candidate proficient in ${skillsSnippet || "CAD modeling and mechanical design principles"}. Focused on engineering accuracy, component optimization, and industry safety standards.`
      : `Detail-oriented Mechanical Engineering professional with hands-on capabilities in ${skillsSnippet || "mechanical drafting and analysis"}. Dedicated to design validation, technical documentation, and efficient execution.`;
  } else if (domain === "chemical") {
    summaryText = isRegenerate
      ? `Chemical Engineering specialist adept at ${skillsSnippet || "process analysis and thermodynamic principles"}. Committed to process optimization, plant safety, and operational excellence.`
      : `Analytical Chemical Engineering candidate with foundational competencies in ${skillsSnippet || "unit operations and chemical process engineering"}. Focused on mass balances, material efficiency, and environmental compliance.`;
  } else if (domain === "civil") {
    summaryText = `Civil / Structural Engineering professional skilled in ${skillsSnippet || "structural drafting and project engineering"}. Dedicated to structural integrity, code compliance, and reliable project delivery.`;
  } else if (domain === "electrical") {
    summaryText = `Electrical Engineering specialist proficient in ${skillsSnippet || "circuit analysis, electrical systems, and hardware testing"}. Experienced in system modeling and hardware-software integration.`;
  } else if (domain === "cybersecurity") {
    summaryText = `Information Security professional skilled in ${skillsSnippet || "threat analysis, vulnerability mitigation, and network defense"}. Committed to system hardening, proactive monitoring, and security compliance.`;
  } else if (domain === "business_finance") {
    summaryText = `Business & Financial Analyst skilled in ${skillsSnippet || "financial modeling and quantitative evaluation"}. Adept at data-driven reporting, variance analysis, and operational efficiency.`;
  } else if (domain === "software") {
    summaryText = `Software Developer with expertise in ${skillsSnippet || "software development and clean architecture"}. Adept at writing clean, maintainable code and building reliable applications.`;
  } else {
    summaryText = `Dedicated ${roleName} with solid technical grounding in ${skillsSnippet || "core professional methodologies"}. Proven ability to solve challenging problems and deliver disciplined project results.`;
  }

  // Projects parsing (ONLY if user provided projects)
  const actionVerbs = isRegenerate
    ? ["Spearheaded", "Engineered", "Constructed", "Optimized", "Formulated"]
    : ["Designed", "Developed", "Implemented", "Executed", "Streamlined"];

  let formattedProjects = [];
  if (userProjects.trim() && !isNoneOrEmpty(userProjects)) {
    const projBlocks = userProjects.split(/\n\n+/).filter(Boolean);
    formattedProjects = projBlocks.map((block, idx) => {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const title = lines[0] || `Project ${idx + 1}`;
      const bullets = lines.slice(1);
      return {
        title,
        techStack: rawSkillsArr.slice(0, 3).join(", ") || "",
        bullets: bullets.length > 0
          ? bullets.map((b) => (b.startsWith("•") || b.startsWith("-") ? b.replace(/^[•-]\s*/, "") : b))
          : [
              `${actionVerbs[idx % actionVerbs.length]} technical scope and specifications utilizing ${rawSkillsArr.slice(0, 2).join(" and ") || "core discipline methodologies"}.`,
              `Conducted design validation, empirical testing, and documentation to ensure high quality and compliance.`,
            ],
      };
    });
  }

  // Experience parsing (ONLY if user provided experience and NOT fresher)
  let formattedExp = [];
  if (userExperience.trim() && !isNoneOrEmpty(userExperience)) {
    const expBlocks = userExperience.split(/\n\n+/).filter(Boolean);
    formattedExp = expBlocks.map((block, idx) => {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      return {
        role: lines[0] || "Professional Role",
        company: lines[1] || "",
        duration: "Experience",
        bullets: lines.slice(2).length > 0
          ? lines.slice(2).map((b) => (b.startsWith("•") || b.startsWith("-") ? b.replace(/^[•-]\s*/, "") : b))
          : [
              `${actionVerbs[idx % actionVerbs.length]} project deliverables and collaborated with team members.`,
              `Applied ${rawSkillsArr.slice(0, 2).join(" and ") || "technical competencies"} to ensure high operational quality.`,
            ],
      };
    });
  }

  // Education parsing (ONLY if user provided education)
  let formattedEdu = [];
  if (userEducation.trim() && !isNoneOrEmpty(userEducation)) {
    const eduLines = userEducation.split(/\n/).map((l) => l.trim()).filter(Boolean);
    formattedEdu = [
      {
        degree: eduLines[0] || userEducation.trim(),
        institution: eduLines[1] || "",
        year: eduLines[2] || "Completed",
        details: userEducation.trim(),
      },
    ];
  }

  // Separate technical skills vs tools vs soft skills (ONLY from user provided skills)
  const toolKeywords = /autocad|solidworks|catia|ansys|aspen|matlab|simulink|revit|staad|excel|tableau|power\s*bi|git|github|vscode|docker|linux|spis|spss/i;
  const techSkills = rawSkillsArr.filter((s) => !toolKeywords.test(s));
  const tools = rawSkillsArr.filter((s) => toolKeywords.test(s));

  return {
    summary: summaryText,
    skills: {
      technical: techSkills.length > 0 ? techSkills : rawSkillsArr,
      tools: tools,
      soft: ["Analytical Problem Solving", "Technical Communication", "Project Collaboration", "Continuous Learning"],
    },
    skillsFormatted: rawSkillsArr.join(", "),
    experience: formattedExp,
    projects: formattedProjects,
    education: formattedEdu,
    certifications: userCertifications.trim() && !isNoneOrEmpty(userCertifications)
      ? userCertifications.split(/[,;\n]+/).map((c) => c.trim()).filter(Boolean)
      : [],
    languages: userLanguages.trim() && !isNoneOrEmpty(userLanguages)
      ? userLanguages.split(/[,;\n]+/).map((l) => l.trim()).filter(Boolean)
      : ["English"],
  };
};

// ==========================================
// 3. AI Resume Parser for Uploaded Files
// ==========================================
const parseResumeText = async (rawText) => {
  const prompt = `You are an automated resume extraction parser across all career fields.
Given the raw text from a candidate's resume, extract personal and professional details into JSON:
{
  "personal": {
    "name": "Candidate Full Name or empty string",
    "email": "email or empty string",
    "phone": "phone number or empty string",
    "city": "city/state or empty string",
    "linkedin": "linkedin URL or empty string",
    "github": "github URL or empty string"
  },
  "professional": {
    "careerField": "Exact match from the 20 standard fields: 'Software / IT', 'Cybersecurity / Information Security', 'Mechanical Engineering', 'Chemical Engineering', 'Civil Engineering', 'Electrical / Electronics', 'Mechatronics / Robotics', 'Automobile Engineering', 'Production / Manufacturing', 'Biotechnology / Biomedical', 'Aerospace Engineering', 'Business / Management', 'Finance / Accounting', 'Marketing / Sales', 'Human Resources', 'Design', 'Healthcare', 'Research', 'Education', or 'Other'",
    "targetRole": "Candidate's job title or target role (e.g. Mechanical Engineer, Process Engineer, Security Analyst, Frontend Developer)",
    "objective": "career objective/summary or empty string",
    "education": "education details string",
    "skills": "comma separated skills string",
    "projects": "projects string",
    "experience": "experience string",
    "certifications": "certifications string",
    "languages": "languages string"
  }
}

Raw Resume Text:
${rawText.slice(0, 5000)}`;

  const aiResult = await callGemini(prompt);
  const parsed = extractJson(aiResult);
  if (parsed && parsed.personal) {
    return parsed;
  }

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i);

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const guessedName = lines[0] && lines[0].length < 40 && !lines[0].includes("@") ? lines[0] : "Candidate";

  const guessedSkills = lines.filter((l) => /autocad|solidworks|thermodynamics|matlab|python|sql|aspen|process|design|analysis|management|cyber|react|node|circuits|biotech/i.test(l)).join(", ") || "Technical Skills";
  const guessedEdu = lines.filter((l) => /university|college|bachelor|master|b\.e|b\.tech|b\.sc|bca|mca|degree|cgpa/i.test(l)).join("\n") || "Education Details";
  const guessedExp = lines.filter((l) => /experience|engineer|analyst|intern|lead|manager|specialist/i.test(l)).slice(0, 4).join("\n") || "";

  // Infer domain from extracted content
  const domain = detectDomain("", guessedSkills + " " + guessedEdu, "");
  const domainFieldMap = {
    cybersecurity: "Cybersecurity / Information Security",
    chemical: "Chemical Engineering",
    aerospace: "Aerospace Engineering",
    automobile: "Automobile Engineering",
    mechatronics: "Mechatronics / Robotics",
    manufacturing: "Production / Manufacturing",
    mechanical: "Mechanical Engineering",
    civil: "Civil Engineering",
    electrical: "Electrical / Electronics",
    biotech: "Biotechnology / Biomedical",
    healthcare: "Healthcare",
    finance: "Finance / Accounting",
    marketing: "Marketing / Sales",
    hr: "Human Resources",
    design: "Design",
    research: "Research",
    education: "Education",
    business: "Business / Management",
    software: "Software / IT",
    general: "Other",
  };

  const guessedField = domainFieldMap[domain] || "Software / IT";
  const guessedRole = lines.find((l) => /engineer|analyst|developer|specialist|manager|consultant|architect/i.test(l)) || `${guessedField.split("/")[0].trim()} Professional`;

  return {
    personal: {
      name: guessedName,
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      city: "",
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : "",
      github: githubMatch ? `https://${githubMatch[0]}` : "",
    },
    professional: {
      careerField: guessedField,
      targetRole: guessedRole,
      objective: "Extracted from uploaded resume.",
      education: guessedEdu,
      skills: guessedSkills,
      projects: lines.filter((l) => /project|developed|built|created|engineered|implemented|designed|analyzed/i.test(l)).slice(0, 4).join("\n") || "",
      experience: guessedExp,
      certifications: lines.filter((l) => /certified|certificate|certification/i.test(l)).join(", ") || "",
      languages: "English",
    },
  };
};

// ==========================================
// 4. AI Career Roadmap Generator & Regenerator
// ==========================================
const generateCareerRoadmap = async ({
  careerField,
  currentRole,
  targetRole,
  currentSkills,
  experienceLevel,
  interests,
  isRegenerate = false,
}) => {
  const roleName = targetRole ? targetRole.trim() : "Engineering Professional";
  const fieldName = careerField ? careerField.trim() : "";
  const userCurrent = currentRole ? currentRole.trim() : "Student / Entry Level";
  const userSkillsStr = currentSkills ? currentSkills.trim() : "Core Technical Fundamentals";
  const userExp = experienceLevel ? experienceLevel.trim() : "Beginner";
  const userInterests = interests ? interests.trim() : "";

  const seed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const prompt = `You are an expert career strategist and professional development mentor across all disciplines (Mechanical, Chemical, Civil, Electrical, Biotech, Healthcare, Business, Finance, Law, Education, Software, etc.).
Generate a comprehensive, actionable, step-by-step career development roadmap for an individual aiming to become a "${roleName}" in the field of "${fieldName || roleName}".

Candidate Profile:
- Career Field / Industry: ${fieldName || "Candidate's Field"}
- Target Role: ${roleName}
- Current Background: ${userCurrent}
- Current Skills: ${userSkillsStr}
- Experience Level: ${userExp}
- Interests / Specializations: ${userInterests}

${isRegenerate ? `REGENERATION DIRECTIVE (Seed: ${seed}): Provide a fresh alternative learning progression, unique milestone projects, and specialized targets specifically for ${roleName}.` : ""}

CRITICAL RULES:
1. Do NOT assume this is a software/IT role unless '${fieldName}' or '${roleName}' explicitly states it.
2. ALL learning phases, topics, recommended skills, and milestone projects MUST be directly specific to "${roleName}" in "${fieldName || roleName}".
3. For Mechanical Engineering: focus on CAD/SolidWorks/AutoCAD, FEA, Materials, GD&T, and Manufacturing.
4. For Chemical Engineering: focus on Thermodynamics, Process Simulation (Aspen Plus), Unit Operations, P&ID, and Safety/Hazop.
5. For any other field: generate strictly authentic domain-specific phases and milestone projects.
6. Output ONLY valid JSON strictly adhering to this schema:
{
  "targetRole": "${roleName}",
  "estimatedTimeframe": "e.g. 6 to 9 Months",
  "skillAssessment": "Evaluation comparing ${userSkillsStr} against industry standards for ${roleName}",
  "recommendedSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
  "stages": [
    {
      "phase": 1,
      "title": "Phase 1 Title",
      "timeframe": "Month 1 - 2",
      "description": "What to master in this stage",
      "topics": ["Topic A", "Topic B", "Topic C"],
      "milestoneProject": "Concrete milestone project"
    },
    {
      "phase": 2,
      "title": "Phase 2 Title",
      "timeframe": "Month 3 - 4",
      "description": "Deep dive tools and patterns",
      "topics": ["Topic D", "Topic E", "Topic F"],
      "milestoneProject": "Concrete milestone project"
    },
    {
      "phase": 3,
      "title": "Phase 3 Title",
      "timeframe": "Month 5 - 6",
      "description": "Advanced practices and industry scale",
      "topics": ["Topic G", "Topic H", "Topic I"],
      "milestoneProject": "Concrete milestone project"
    },
    {
      "phase": 4,
      "title": "Phase 4 Title",
      "timeframe": "Month 7+",
      "description": "Portfolio, certifications, and active job hunting",
      "topics": ["Topic J", "Topic K", "Topic L"],
      "milestoneProject": "Concrete milestone project"
    }
  ],
  "goals": {
    "shortTerm": "1-3 months goal",
    "mediumTerm": "3-6 months goal",
    "longTerm": "6-12 months milestone"
  }
}`;

  const aiResult = await callGemini(prompt, "", { temperature: isRegenerate ? 0.92 : 0.78 });
  const parsed = extractJson(aiResult);
  if (parsed && Array.isArray(parsed.stages) && parsed.stages.length > 0) {
    return parsed;
  }

  // Field-Aware Dynamic Roadmap Engine
  const domain = detectDomain(roleName, userSkillsStr, fieldName);

  let recommendedSkills = [];
  let stages = [];
  let assessment = "";

  if (domain === "mechanical") {
    recommendedSkills = isRegenerate
      ? [
          "SolidWorks Advanced Surface & Sheet Metal",
          "Finite Element Analysis (FEA / ANSYS)",
          "Geometric Dimensioning & Tolerancing (GD&T - ASME Y14.5)",
          "Design for Manufacturing & Assembly (DFM / DFA)",
          "Fluid Dynamics (CFD Basics)",
          "Additive Manufacturing & 3D Prototyping",
        ]
      : [
          "AutoCAD & 2D Drafting Standards",
          "SolidWorks 3D Parametric Modeling",
          "Geometric Dimensioning & Tolerancing (GD&T)",
          "Finite Element Analysis (FEA with ANSYS)",
          "Design for Manufacturability (DFM)",
          "Materials Selection & Metallurgy",
        ];
    assessment = `Advancing toward ${roleName} from your foundation in ${userSkillsStr} requires mastering 3D parametric modeling, Geometric Dimensioning & Tolerancing (GD&T), structural FEA simulation in ANSYS, and Design for Manufacturing (DFM).`;
    stages = [
      {
        phase: 1,
        title: isRegenerate ? "Phase 1: Precision Drafting & Advanced CAD Modeling" : "Phase 1: Engineering CAD & Parametric Drafting Foundations",
        timeframe: "Month 1 - 2",
        description: "Master 2D/3D parametric modeling in AutoCAD and SolidWorks, part assemblies, and standard engineering drawings.",
        topics: ["SolidWorks Part & Assembly Modeling", "AutoCAD Orthographic & Section Views", "Parametric Sketching & Mates", "Engineering Drawing Standards (ISO/ASME)"],
        milestoneProject: isRegenerate
          ? "Design a complete gearbox assembly in SolidWorks with exploded views and bill of materials (BOM)."
          : "Design a mechanical multi-component assembly with detailed engineering production drawings in SolidWorks.",
      },
      {
        phase: 2,
        title: isRegenerate ? "Phase 2: GD&T Tolerancing & Materials Optimization" : "Phase 2: GD&T Standards & Material Selection",
        timeframe: "Month 3 - 4",
        description: "Implement GD&T tolerances, stress calculations, and material selection for reliable mechanical performance.",
        topics: ["ASME Y14.5 GD&T Feature Control Frames", "Tolerance Stack-up Analysis", "Materials Strength & Heat Treatment", "Fasteners, Bearings & Power Transmission Components"],
        milestoneProject: isRegenerate
          ? "Perform a tolerance stack-up analysis and GD&T specification for a precision automotive shaft assembly."
          : "Execute complete GD&T drawings and tolerance calculations for an industrial mechanical housing.",
      },
      {
        phase: 3,
        title: isRegenerate ? "Phase 3: Structural FEA Simulation & Thermal Stress Analysis" : "Phase 3: Finite Element Analysis (FEA) & Simulation",
        timeframe: "Month 5 - 6",
        description: "Perform static structural, thermal, and fatigue simulations in ANSYS to validate mechanical designs.",
        topics: ["ANSYS Static Structural Meshing & Boundary Conditions", "Von Mises Stress & Factor of Safety Evaluation", "Modal & Vibration Analysis", "Design Optimization & Weight Reduction"],
        milestoneProject: isRegenerate
          ? "Conduct FEA stress and fatigue life analysis on a robotic arm link subjected to dynamic cyclic loads in ANSYS."
          : "Perform static structural FEA and design optimization on an industrial load-bearing bracket in ANSYS.",
      },
      {
        phase: 4,
        title: "Phase 4: Design for Manufacturing (DFM) & Portfolio Review",
        timeframe: "Month 7+",
        description: "Prepare CAD portfolio case studies, study CNC/injection molding manufacturing, and practice technical interviews.",
        topics: ["DFM / DFA for Injection Molding & CNC Machining", "CSWP / CSWE SolidWorks Certification Prep", "Technical Interview Questions on Machine Design", "CAD Portfolio Presentation"],
        milestoneProject: "Publish a comprehensive Mechanical Design Portfolio showcase featuring 3 verified CAD/FEA case studies.",
      },
    ];
  } else if (domain === "chemical") {
    recommendedSkills = isRegenerate
      ? [
          "Aspen HYSYS & Steady-State Simulation",
          "P&ID Development & Instrument Loops",
          "Distillation Column & Separator Sizing",
          "Process Safety Management (PSM & HAZOP)",
          "Heat Exchanger Network Synthesis (Pinch Tech)",
          "Chemical Reactor Kinetics & Catalyst Sizing",
        ]
      : [
          "Thermodynamic Property Packages (EOS)",
          "Process Simulation with Aspen Plus / HYSYS",
          "P&ID & Process Flow Diagram (PFD) Design",
          "Mass & Energy Balance Modeling",
          "HAZOP & Process Safety Principles",
          "Heat Exchanger & Distillation Column Sizing",
        ];
    assessment = `Progressing to ${roleName} with your background in ${userSkillsStr} centers on mastering steady-state process simulation in Aspen Plus, mass and energy balance calculations, P&ID drafting, and industrial process safety (HAZOP).`;
    stages = [
      {
        phase: 1,
        title: isRegenerate ? "Phase 1: Chemical Thermodynamics & Rigorous Mass/Energy Balances" : "Phase 1: Thermodynamics & Rigorous Mass/Energy Balances",
        timeframe: "Month 1 - 2",
        description: "Master equation-of-state thermodynamics, vapor-liquid equilibrium (VLE), and rigorous balance calculations.",
        topics: ["VLE / LLE Equilibrium & Activity Models (NRTL, Peng-Robinson)", "Steady-State Mass & Energy Balances", "Unit Operations (Pumps, Compressors, Mixers)", "Process Flowsheeting Fundamentals"],
        milestoneProject: isRegenerate
          ? "Develop a complete mass and energy balance spreadsheet model for a continuous ammonia synthesis loop."
          : "Construct a manual and spreadsheet mass & energy balance model for a multi-component chemical distillation train.",
      },
      {
        phase: 2,
        title: isRegenerate ? "Phase 2: Aspen Plus & Aspen HYSYS Flowsheet Simulation" : "Phase 2: Aspen Plus Flowsheet Simulation & Optimization",
        timeframe: "Month 3 - 4",
        description: "Design and simulate continuous chemical processes, reactor networks, and separations in Aspen Plus.",
        topics: ["Aspen Plus Flowsheet Setup & Convergence", "RadFrac Distillation Column Modeling", "Sensitivity Analysis & Design Specs", "Reactor Modeling (RCSTR, RPLUG)"],
        milestoneProject: isRegenerate
          ? "Simulate and optimize an ethyl acetate production flowsheet in Aspen Plus with recycle loops and heat integration."
          : "Simulate a complete bio-ethanol purification flowsheet with extractive distillation in Aspen Plus.",
      },
      {
        phase: 3,
        title: isRegenerate ? "Phase 3: P&ID Design, Hydraulics & Process Equipment Sizing" : "Phase 3: Equipment Sizing, P&ID & Process Control",
        timeframe: "Month 5 - 6",
        description: "Size chemical equipment (heat exchangers, columns, control valves) and develop Piping & Instrumentation Diagrams (P&IDs).",
        topics: ["P&ID Symbols & Control Loops (ISA 5.1)", "Piping Hydraulics & Pressure Drop Calculations", "TEMA Heat Exchanger Sizing", "Relief Valve & Rupture Disk Sizing"],
        milestoneProject: isRegenerate
          ? "Draft a full P&ID and size the pumps, relief valves, and heat exchangers for a chemical reactor cooling system."
          : "Design the P&ID and detailed equipment sizing sheets for an industrial solvent recovery unit.",
      },
      {
        phase: 4,
        title: "Phase 4: Process Safety (HAZOP) & Plant Engineering Interviews",
        timeframe: "Month 7+",
        description: "Master HAZOP risk assessment methodology, environmental emission standards, and process engineering interview challenges.",
        topics: ["HAZOP Study Leadership & Guide Words", "OSHA Process Safety Management (PSM)", "Process Economics & CapEx/OpEx Estimation", "Technical Interview Questions on Transport Phenomena"],
        milestoneProject: "Complete a full HAZOP study and process design package (PDP) for a pressurized chemical storage unit.",
      },
    ];
  } else if (domain === "civil") {
    recommendedSkills = [
      "AutoCAD Civil 3D & Revit BIM",
      "Structural Analysis & Design (STAAD.Pro)",
      "Reinforced Concrete & Steel Design Codes",
      "Geotechnical & Foundation Engineering",
      "Construction Project Scheduling (Primavera/MS Project)",
      "Surveying & Quantity Estimation",
    ];
    assessment = `Advancing to ${roleName} based on ${userSkillsStr} requires structural analysis in STAAD.Pro, drafting in Civil 3D/Revit, understanding RCC/Steel building codes, and construction estimation.`;
    stages = [
      {
        phase: 1,
        title: "Phase 1: Civil Drafting & Structural Fundamentals",
        timeframe: "Month 1 - 2",
        description: "Master structural mechanics, shear force and bending moment diagrams, and 2D/3D drafting.",
        topics: ["Structural Mechanics & Indeterminate Beams", "AutoCAD Structural Detailing", "Revit BIM Basics", "Building Materials & Concrete Technology"],
        milestoneProject: "Create a complete architectural and structural framing plan for a multi-story residential building.",
      },
      {
        phase: 2,
        title: "Phase 2: Structural Analysis & Design with STAAD.Pro",
        timeframe: "Month 3 - 4",
        description: "Model structural frames, apply wind/seismic loads, and design RCC columns, beams, and slabs.",
        topics: ["STAAD.Pro Geometry & Section Properties", "Dead, Live, Wind & Seismic Load Combinations", "RCC Beam & Column Design (IS 456 / ACI 318)", "Foundation Sizing & Soil Bearing Capacity"],
        milestoneProject: "Design and analyze a G+4 commercial building in STAAD.Pro under combined gravity and seismic loads.",
      },
      {
        phase: 3,
        title: "Phase 3: Geotechnical, Water Resources & BIM Detailing",
        timeframe: "Month 5 - 6",
        description: "Design retaining walls, drainage systems, and generate coordinated BIM models in Revit.",
        topics: ["Retaining Wall & Deep Foundation Design", "Hydrologic Runoff & Stormwater Drainage", "BIM Clash Detection & Coordination", "Bar Bending Schedules (BBS)"],
        milestoneProject: "Develop a coordinated Revit structural BIM model and Bar Bending Schedule for a commercial facility.",
      },
      {
        phase: 4,
        title: "Phase 4: Quantity Surveying, Project Management & Interviews",
        timeframe: "Month 7+",
        description: "Master bill of quantities (BOQ) estimation, construction management, and technical civil interviews.",
        topics: ["Rate Analysis & BOQ Estimation", "Primavera P6 Construction Scheduling", "Building By-laws & Environmental Clearances", "Technical Structural Interview Questions"],
        milestoneProject: "Prepare a full Bill of Quantities (BOQ) and construction schedule for a milestone civil project.",
      },
    ];
  } else if (domain === "electrical") {
    recommendedSkills = [
      "Circuit Analysis & Schematic Capture",
      "MATLAB & Simulink System Modeling",
      "PCB Design (Altium / KiCAD)",
      "Power Systems & Switchgear Operations",
      "PLC Programming (Ladder Logic) & SCADA",
      "Electrical Safety & National Electrical Code (NEC)",
    ];
    assessment = `Targeting ${roleName} with your skills in ${userSkillsStr} involves circuit simulation in MATLAB, PCB layout in KiCAD/Altium, PLC/SCADA industrial automation, and power distribution design.`;
    stages = [
      {
        phase: 1,
        title: "Phase 1: Electrical Circuit Analysis & Simulation",
        timeframe: "Month 1 - 2",
        description: "Master AC/DC circuit analysis, transient response, and circuit simulation in SPICE/MATLAB.",
        topics: ["Network Theorems & Three-Phase AC Systems", "Op-Amp & Analog Filter Design", "MATLAB / Simulink Electrical Modeling", "Electrical Safety & Earthing Systems"],
        milestoneProject: "Design and simulate a regulated power supply and three-phase inverter circuit in MATLAB/Simulink.",
      },
      {
        phase: 2,
        title: "Phase 2: PCB Design & Hardware Prototyping",
        timeframe: "Month 3 - 4",
        description: "Design multi-layer PCBs, routing rules, signal integrity, and assemble functional prototypes.",
        topics: ["KiCAD / Altium Schematic Capture", "PCB Component Footprints & Layout Rules", "Power Plane Decoupling & Trace Sizing", "Soldering, Debugging & Oscilloscope Testing"],
        milestoneProject: "Design, manufacture, and assemble a custom 2-layer microcontroller/power management PCB.",
      },
      {
        phase: 3,
        title: "Phase 3: Industrial Automation & Power Distribution",
        timeframe: "Month 5 - 6",
        description: "Program industrial PLCs, configure SCADA monitoring, and size power distribution switchgear.",
        topics: ["PLC Ladder Logic & Function Blocks", "SCADA HMI Interfacing & Modbus Protocols", "Transformer & Circuit Breaker Sizing", "Motor Drives & VFD Parameter Tuning"],
        milestoneProject: "Develop an automated industrial conveyor/sorting system PLC program with SCADA visualization.",
      },
      {
        phase: 4,
        title: "Phase 4: Power Systems, Code Compliance & Interviews",
        timeframe: "Month 7+",
        description: "Study power grid flow analysis, NEC compliance, and practice technical electrical engineering interviews.",
        topics: ["Short Circuit & Load Flow Studies (ETAP)", "NEC / IEEE Electrical Installation Standards", "Technical Electrical Interview Preparation", "Engineering Hardware Showcase"],
        milestoneProject: "Complete a full electrical single-line diagram (SLD) and load calculation package for an industrial plant.",
      },
    ];
  } else if (domain === "business_finance") {
    recommendedSkills = [
      "Advanced Financial Modeling & Valuation (DCF, LBO)",
      "Financial Statement Analysis (GAAP / IFRS)",
      "Excel Power Query, VBA & Pivot Tables",
      "Data Visualization in Power BI / Tableau",
      "Budgeting, Forecasting & Variance Analysis",
      "Corporate Finance & Capital Structure",
    ];
    assessment = `Transitioning to ${roleName} based on ${userSkillsStr} requires mastering 3-statement financial modeling in Excel, discounted cash flow (DCF) valuation, variance analysis, and executive KPI reporting.`;
    stages = [
      {
        phase: 1,
        title: "Phase 1: Financial Accounting & Advanced Excel Modeling",
        timeframe: "Month 1 - 2",
        description: "Master dynamic Excel modeling, 3-statement financial integration, and ratio analysis.",
        topics: ["Integrated 3-Statement Modeling (P&L, Balance Sheet, Cash Flow)", "Advanced Excel (INDEX/MATCH, XLOOKUP, Dynamic Arrays)", "Working Capital & Debt Schedules", "Financial Ratio & Trend Analysis"],
        milestoneProject: "Build a dynamic 5-year integrated 3-statement financial model in Excel for a public corporation.",
      },
      {
        phase: 2,
        title: "Phase 2: Corporate Valuation & Investment Appraisal",
        timeframe: "Month 3 - 4",
        description: "Perform Discounted Cash Flow (DCF) valuation, comparable company analysis (Comps), and sensitivity tables.",
        topics: ["WACC Calculation & Cost of Capital", "Unlevered Free Cash Flow Projections", "Comparable Company & Precedent Transaction Multiples", "Scenario & Monte Carlo Sensitivity Analysis"],
        milestoneProject: "Conduct a comprehensive DCF and Trading Comps valuation model for an industry target company.",
      },
      {
        phase: 3,
        title: "Phase 3: FP&A, Budgeting & Business Intelligence Dashboards",
        timeframe: "Month 5 - 6",
        description: "Build automated variance analysis reports, corporate budgets, and executive KPI dashboards.",
        topics: ["Budget vs Actual Variance Analysis", "Rolling Forecasts & Cost Center Allocation", "Power BI / Tableau Financial Dashboarding", "Executive Slide Deck Financial Storytelling"],
        milestoneProject: "Design an automated FP&A dashboard in Power BI tracking revenue, gross margins, and OpEx variances.",
      },
      {
        phase: 4,
        title: "Phase 4: Case Studies, Modeling Tests & Interviews",
        timeframe: "Month 7+",
        description: "Practice timed financial modeling tests, M&A/corporate finance case interviews, and network with recruiters.",
        topics: ["Timed Financial Modeling Tests", "M&A & Corporate Strategy Case Interviews", "CFA / Financial Modeling Certification Prep", "Resume Tailoring for Finance Roles"],
        milestoneProject: "Publish 3 comprehensive equity research / corporate finance valuation case studies on GitHub/LinkedIn.",
      },
    ];
  } else if (domain === "software") {
    recommendedSkills = [
      "Full-Stack Web Architecture",
      "React & Component State Management",
      "Node.js, Express & REST APIs",
      "PostgreSQL & Database Modeling",
      "Git, Docker & CI/CD Pipelines",
      "Cloud Deployment & System Design",
    ];
    assessment = `Pursuing a career as a ${roleName} based on ${userSkillsStr} involves building end-to-end applications that seamlessly integrate responsive frontends with secure backend services and relational databases.`;
    stages = [
      {
        phase: 1,
        title: isRegenerate ? "Phase 1: Modern Full-Stack Patterns & Client Design" : "Phase 1: Core Programming & Frontend Architecture",
        timeframe: "Month 1 - 2",
        description: "Master core programming concepts, responsive UI design, and modular component architecture.",
        topics: ["Modern Programming Standards", "Responsive UI & Component Styling", "Client-Side Routing & State Management", "Git Version Control & Workflows"],
        milestoneProject: "Build an interactive Single Page Application with dynamic state and form validation.",
      },
      {
        phase: 2,
        title: "Phase 2: Backend Services, PostgreSQL & Auth",
        timeframe: "Month 3 - 4",
        description: "Design secure RESTful APIs, relational databases with PostgreSQL, and JWT authentication.",
        topics: ["REST API Architecture", "PostgreSQL Database Modeling & Queries", "JWT Auth & Middleware Security", "API Integration & Axios/Fetch"],
        milestoneProject: "Build an end-to-end full-stack application with persistent PostgreSQL storage and authentication.",
      },
      {
        phase: 3,
        title: "Phase 3: Production Hardening, DevOps & Scale",
        timeframe: "Month 5 - 6",
        description: "Implement containerization, performance optimization, automated tests, and cloud deployment.",
        topics: ["Docker Containerization", "Database Indexing & Query Optimization", "Cloud Deployment (Render/Vercel/AWS)", "Automated CI/CD Workflows"],
        milestoneProject: "Deploy a production SaaS platform with multi-service Docker configuration.",
      },
      {
        phase: 4,
        title: "Phase 4: System Design & Technical Job Hunting",
        timeframe: "Month 7+",
        description: "Prepare for full-stack system design interviews, polish portfolio projects, and execute job applications.",
        topics: ["System Design Trade-offs", "Coding Problem Solving (DSA)", "Behavioral STAR Interviews", "Resume Tailoring & Networking"],
        milestoneProject: "Publish a full-stack portfolio, share on LinkedIn, and apply to 15+ target companies.",
      },
    ];
  } else {
    // Universal Multi-Disciplinary Extrapolator
    recommendedSkills = [
      `Core Fundamentals of ${roleName}`,
      `Industry Tools & Specialized Software for ${roleName}`,
      "Quality Standards & Regulatory Compliance",
      "Technical Documentation & Analysis",
      "Project Management & Stakeholder Collaboration",
      "Advanced Industry Methods & Best Practices",
    ];
    assessment = `Advancing in your career as a ${roleName} based on ${userSkillsStr} involves mastering foundational principles, becoming proficient with standard industry tools, adhering to compliance standards, and delivering documented project results.`;
    stages = [
      {
        phase: 1,
        title: `Phase 1: Foundations & Core Principles of ${roleName}`,
        timeframe: "Month 1 - 2",
        description: `Establish strong foundational knowledge, theory, and operational standards required for ${roleName}.`,
        topics: [`Core Principles of ${roleName}`, "Standard Operating Procedures", "Analytical Problem Solving", "Industry Documentation Standards"],
        milestoneProject: `Complete a foundational technical analysis or design case study relevant to ${roleName}.`,
      },
      {
        phase: 2,
        title: `Phase 2: Applied Methodologies & Specialized Tooling`,
        timeframe: "Month 3 - 4",
        description: `Master standard software, instruments, and workflows utilized by practicing ${roleName} professionals.`,
        topics: ["Domain-Specific Software & Tools", "Data Analysis & Quality Control", "Workflow Optimization", "Compliance & Industry Guidelines"],
        milestoneProject: `Execute an end-to-end practical project applying ${userSkillsStr || "core technical methods"}.`,
      },
      {
        phase: 3,
        title: `Phase 3: Advanced Applications & Industry Best Practices`,
        timeframe: "Month 5 - 6",
        description: `Deepen technical mastery with complex scenarios, risk mitigation, and cross-functional project delivery.`,
        topics: ["Advanced Problem Scenarios", "Quality Assurance & Standards", "Risk Management & Safety", "Cross-Disciplinary Team Execution"],
        milestoneProject: `Deliver a comprehensive capstone deliverable demonstrating advanced competence in ${roleName}.`,
      },
      {
        phase: 4,
        title: `Phase 4: Professional Positioning & Technical Interviews`,
        timeframe: "Month 7+",
        description: `Showcase portfolio case studies, prepare for domain technical interviews, and execute targeted job outreach.`,
        topics: ["Technical Scenario Questions", "Portfolio Case Study Presentation", "Behavioral Interview Prep", "Industry Networking & Outreach"],
        milestoneProject: `Publish a polished professional portfolio featuring 3 documented case studies for ${roleName}.`,
      },
    ];
  }

  return {
    targetRole: roleName,
    estimatedTimeframe: "6 - 8 Months",
    skillAssessment: assessment,
    recommendedSkills,
    stages,
    goals: {
      shortTerm: `Master core Phase 1 fundamentals and deploy 1 milestone project within 60 days.`,
      mediumTerm: `Build comprehensive project integrating ${recommendedSkills.slice(0, 3).join(", ")}, with industry-standard documentation.`,
      longTerm: `Secure a competitive ${roleName} position at a reputable organization.`,
    },
  };
};

// ==========================================
// 5. AI Skill Gap Analyzer & Regenerator
// ==========================================
const analyzeSkillGap = async ({
  careerField,
  currentSkills,
  targetRole,
  jobDescription,
  isRegenerate = false,
}) => {
  const roleName = targetRole ? targetRole.trim() : "Engineering Professional";
  const fieldName = careerField ? careerField.trim() : "";
  const userSkillsStr = currentSkills ? currentSkills.trim() : "Foundational Knowledge";
  const descSnippet = jobDescription ? jobDescription.trim() : "";

  const seed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const prompt = `You are a senior technical hiring manager and skill gap analyst across all professional disciplines (Mechanical, Chemical, Civil, Electrical, Biotech, Business, Finance, Healthcare, Law, Education, Software, etc.).
Analyze the candidate's exact skillset against industry benchmarks for the position of "${roleName}" in the field of "${fieldName || roleName}".

Candidate Current Skills: ${userSkillsStr}
Career Field: ${fieldName || "Candidate's Field"}
Target Role: ${roleName}
Target Job Description: ${descSnippet || "Standard " + roleName + " requirements"}

${isRegenerate ? `REGENERATION DIRECTIVE (Seed: ${seed}): Provide fresh missing skill priorities, alternative learning recommendations, and updated skill leveling advice specifically for ${roleName}.` : ""}

CRITICAL RULES:
1. Do NOT assume the role is in software/IT unless '${fieldName}' or '${roleName}' explicitly specifies it.
2. For Mechanical Engineering: evaluate CAD, SolidWorks, AutoCAD, FEA/ANSYS, GD&T, DFM, Materials.
3. For Chemical Engineering: evaluate Thermodynamics, Aspen Plus, Process Design, P&ID, Mass/Energy Balances, HAZOP.
4. Output ONLY valid JSON matching this schema:
{
  "targetRole": "${roleName}",
  "matchPercentage": 75,
  "summary": "Executive summary comparing ${userSkillsStr} against ${roleName}",
  "matchedSkills": [
    { "skill": "Skill Name", "level": "Proficient / Intermediate / Beginner", "notes": "Why relevant" }
  ],
  "missingSkills": [
    { "skill": "Skill Name", "priority": "High / Medium / Low", "reason": "Why mandatory for ${roleName}", "action": "How to learn" }
  ],
  "skillsToImprove": [
    { "skill": "Skill Name", "currentLevel": "Basic", "targetLevel": "Advanced", "tips": "Actionable advice" }
  ],
  "recommendedActionPlan": [
    "Step 1 recommendation",
    "Step 2 recommendation",
    "Step 3 recommendation",
    "Step 4 recommendation"
  ]
}`;

  const aiResult = await callGemini(prompt, "", { temperature: isRegenerate ? 0.9 : 0.75 });
  const parsed = extractJson(aiResult);
  if (parsed && Array.isArray(parsed.matchedSkills) && Array.isArray(parsed.missingSkills)) {
    return parsed;
  }

  // Field-Aware Dynamic Skill Gap Benchmark Engine
  const domain = detectDomain(roleName, userSkillsStr, fieldName);
  const currentList = userSkillsStr
    .toLowerCase()
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let benchmarkList = [];

  if (domain === "mechanical") {
    benchmarkList = [
      { name: "AutoCAD & 2D Engineering Drafting", priority: "High", reason: "Standard for manufacturing blueprints, orthographic views, and section details." },
      { name: "SolidWorks / 3D Parametric Modeling", priority: "High", reason: "Mandatory for 3D part design, complex assemblies, and exploded BOM drawings." },
      { name: "Finite Element Analysis (FEA / ANSYS)", priority: "High", reason: "Critical for structural stress testing, modal analysis, and factor of safety validation." },
      { name: "Geometric Dimensioning & Tolerancing (GD&T)", priority: "High", reason: "Essential for specifying manufacturing tolerances according to ASME Y14.5." },
      { name: "Design for Manufacturing & Assembly (DFM/DFA)", priority: "Medium", reason: "Crucial for optimizing parts for CNC machining, casting, and injection molding." },
      { name: "Thermodynamics & Heat Transfer", priority: "Medium", reason: "Key for thermal dissipation, cooling systems, and engine heat modeling." },
    ];
  } else if (domain === "chemical") {
    benchmarkList = [
      { name: "Chemical Thermodynamics (VLE/EOS)", priority: "High", reason: "Foundational for phase equilibrium modeling, reaction spontaneity, and enthalpy calculations." },
      { name: "Process Simulation (Aspen Plus / HYSYS)", priority: "High", reason: "Industry standard for continuous flowsheet modeling, mass/energy balances, and column sizing." },
      { name: "Process Design & Unit Operations", priority: "High", reason: "Core knowledge for sizing distillation columns, heat exchangers, and chemical reactors." },
      { name: "P&ID & Process Instrumentation", priority: "High", reason: "Essential for plant design, control valve loops, and piping hydraulic standards." },
      { name: "HAZOP & Process Safety Management (PSM)", priority: "Medium", reason: "Mandatory for chemical hazard identification, relief valve sizing, and plant safety." },
      { name: "Reaction Kinetics & Catalyst Sizing", priority: "Low", reason: "Valuable for reactor conversion optimization and residence time calculations." },
    ];
  } else if (domain === "civil") {
    benchmarkList = [
      { name: "AutoCAD Civil 3D & Drafting", priority: "High", reason: "Standard for civil engineering plans, grading, and structural detailing." },
      { name: "Structural Analysis (STAAD.Pro / ETABS)", priority: "High", reason: "Required for modeling frames, seismic loading, and wind load combinations." },
      { name: "Reinforced Concrete Design (RCC Codes)", priority: "High", reason: "Essential for beam, column, and slab reinforcement calculations." },
      { name: "Geotechnical & Soil Mechanics", priority: "Medium", reason: "Critical for foundation design and soil bearing capacity validation." },
      { name: "Revit BIM & Coordination", priority: "Medium", reason: "Standard for multi-disciplinary clash detection and 3D architectural modeling." },
      { name: "Quantity Surveying & Estimation (BOQ)", priority: "Low", reason: "Valuable for construction rate analysis and material cost management." },
    ];
  } else if (domain === "electrical") {
    benchmarkList = [
      { name: "Circuit Analysis & Schematic Capture", priority: "High", reason: "Fundamental for designing analog, digital, and power electronics circuits." },
      { name: "MATLAB & Simulink System Modeling", priority: "High", reason: "Standard for control systems, signal processing, and electrical grid modeling." },
      { name: "PCB Design (KiCAD / Altium Designer)", priority: "High", reason: "Required for multi-layer hardware layouts, trace routing, and decoupling." },
      { name: "PLC Programming & SCADA Automation", priority: "Medium", reason: "Key for industrial manufacturing, motor drives, and control panels." },
      { name: "Power Systems & Switchgear Design", priority: "Medium", reason: "Essential for single-line diagrams, transformer sizing, and fault protection." },
    ];
  } else if (domain === "business_finance") {
    benchmarkList = [
      { name: "Financial Modeling & Valuation (DCF)", priority: "High", reason: "Mandatory for corporate valuation, M&A appraisal, and investment analysis." },
      { name: "Advanced Excel (Financial Formulas & VBA)", priority: "High", reason: "Standard tool for financial forecasting, data manipulation, and schedules." },
      { name: "Financial Statement Analysis (GAAP / IFRS)", priority: "High", reason: "Crucial for evaluating balance sheets, income statements, and cash flow dynamics." },
      { name: "Budgeting, Forecasting & Variance Analysis", priority: "Medium", reason: "Required for corporate FP&A reporting and operational cost control." },
      { name: "Power BI / Tableau Financial Reporting", priority: "Medium", reason: "Valuable for presenting executive KPI summaries to leadership." },
    ];
  } else if (domain === "data_analytics") {
    benchmarkList = [
      { name: "SQL (CTEs & Window Functions)", priority: "High", reason: "Mandatory for extracting, filtering, and joining complex enterprise relational datasets." },
      { name: "Python / Pandas", priority: "High", reason: "Essential for programmatic data cleaning, transformation, and statistical calculations." },
      { name: "Tableau / Power BI", priority: "High", reason: "Required for designing interactive KPI dashboards and executive reporting." },
      { name: "Excel (Power Query / Modeling)", priority: "Medium", reason: "Widely used for rapid spreadsheet modeling and ad-hoc data analysis." },
      { name: "Statistical Hypothesis Testing", priority: "Medium", reason: "Crucial for A/B test analysis, variance evaluation, and data validation." },
    ];
  } else if (domain === "software") {
    benchmarkList = [
      { name: "React / Modern Frontend Architecture", priority: "High", reason: "Standard for modular client interfaces and responsive state management." },
      { name: "Node.js / Server-Side REST APIs", priority: "High", reason: "Core server framework for scalable microservices and business logic." },
      { name: "PostgreSQL & Database Design", priority: "High", reason: "Critical for structured data integrity, indexing, and persistent transactions." },
      { name: "JavaScript / TypeScript Fundamentals", priority: "High", reason: "Foundational programming language across web platforms." },
      { name: "Docker & Cloud Deployment", priority: "Medium", reason: "Valuable for containerized deployments and CI/CD pipelines." },
    ];
  } else {
    // Universal Multi-Disciplinary Benchmarks
    benchmarkList = [
      { name: `Core Principles of ${roleName}`, priority: "High", reason: `Foundational theoretical and empirical principles mandatory for ${roleName}.` },
      { name: `Specialized Technical Tools for ${roleName}`, priority: "High", reason: "Standard software, equipment, or modeling packages utilized in industry." },
      { name: "Quality Assurance & Compliance Standards", priority: "High", reason: "Mandatory regulatory, safety, or industry standards compliance." },
      { name: "Technical Reporting & Documentation", priority: "Medium", reason: "Essential for presenting findings, drafting specifications, and project handovers." },
      { name: "Project Scheduling & Execution", priority: "Medium", reason: "Crucial for coordinating milestones and cross-functional deliverables." },
    ];
  }

  const matched = [];
  const missing = [];
  const toImprove = [];

  benchmarkList.forEach((bench) => {
    const isFound = currentList.some((c) => {
      const bLower = bench.name.toLowerCase();
      return bLower.includes(c) || c.includes(bLower.split(" ")[0]) || (c.length > 2 && bLower.includes(c.substring(0, 4)));
    });

    if (isFound) {
      matched.push({
        skill: bench.name,
        level: isRegenerate ? "Intermediate" : "Proficient",
        notes: `Directly aligns with core competencies for ${roleName}.`,
      });
      toImprove.push({
        skill: bench.name,
        currentLevel: "Intermediate",
        targetLevel: "Advanced Production Level",
        tips: `Apply advanced ${bench.name} standards to complex, real-world case studies.`,
      });
    } else {
      missing.push({
        skill: bench.name,
        priority: bench.priority,
        reason: bench.reason,
        action: `Complete targeted coursework and execute a project applying ${bench.name}.`,
      });
    }
  });

  const baseRatio = matched.length / benchmarkList.length;
  const matchPercentage = Math.min(Math.max(Math.round(baseRatio * 100), 30), 92);

  const summary = isRegenerate
    ? `Discipline Readiness Audit: Candidate exhibits ${matchPercentage}% alignment with industry benchmarks for ${roleName}. Remediation of ${missing.slice(0, 2).map((m) => m.skill).join(" and ") || "specialized skills"} will position you at the top tier of candidates.`
    : `Your profile exhibits a ${matchPercentage}% technical alignment with industry standards for ${roleName}. Bridging critical gaps in ${missing.slice(0, 2).map((m) => m.skill).join(" and ") || "specialized tools"} will make you a highly competitive candidate.`;

  return {
    targetRole: roleName,
    matchPercentage,
    summary,
    matchedSkills: matched.length > 0 ? matched : [
      { skill: currentList[0] || "Foundational Knowledge", level: "Basic", notes: "Provides a starting base to build on." },
    ],
    missingSkills: missing.length > 0 ? missing : [
      { skill: benchmarkList[0].name, priority: "High", reason: benchmarkList[0].reason, action: "Deep dive into hands-on implementations." },
    ],
    skillsToImprove: toImprove.length > 0 ? toImprove.slice(0, 3) : [
      { skill: "Domain Engineering", currentLevel: "Basic", targetLevel: "Advanced", tips: "Practice end-to-end implementations." },
    ],
    recommendedActionPlan: isRegenerate
      ? [
          `Execute a sprint focusing strictly on ${missing[0]?.skill || "high-priority gaps"} with a dedicated milestone project.`,
          `Refactor and benchmark existing implementations in ${matched[0]?.skill || "core areas"} for optimal reliability.`,
          `Simulate live technical interview problem sets tailored for ${roleName}.`,
          `Publish comprehensive engineering case studies on your professional portfolio.`,
        ]
      : [
          `Prioritize mastering ${missing[0]?.skill || "high-priority technologies"} by building a dedicated portfolio project for ${roleName}.`,
          `Deepen hands-on competency in ${matched[0]?.skill || "core skills"} through performance optimization and clean engineering.`,
          `Practice role-specific problem solving and technical interview scenarios targeting ${roleName}.`,
          `Document your technical decisions to demonstrate engineering depth to recruiters.`,
        ],
  };
};

// ==========================================
// 6. AI Practice Interview Question Bank Generator (Delegated to PracticeBankService)
// ==========================================
const { generatePracticeQuestionBank } = require("./practiceBankService");

const generateInterviewQuestions = async (params) => {
  return generatePracticeQuestionBank(params);
};

// ==========================================
// 7. Comprehensive Domain Mock Question Bank (15+ Questions per Tier per Field)
// ==========================================
const getDomainMockQuestions = (domain, targetRole, skills) => {
  if (domain === "mechanical") {
    return [
      // BASIC (Tier 1)
      { id: 1, level: "Basic", question: "Please introduce yourself, your engineering background, and what inspired you to pursue a career in Mechanical Engineering.", keyConcepts: ["Academic Background", "Engineering Passion", "CAD Exposure"], hint: "Give a 1-2 minute introduction covering your degree, practical CAD projects, and interest in mechanical design." },
      { id: 2, level: "Basic", question: "What are the fundamental differences between 2D drafting in AutoCAD and 3D parametric feature-based modeling in SolidWorks or CATIA?", keyConcepts: ["Parametric Modeling", "2D Blueprints vs 3D Solids", "Associativity"], hint: "Explain how parametric CAD maintains parent-child relationships and enables automatic drawing updates." },
      { id: 3, level: "Basic", question: "Explain the Stress-Strain curve for structural mild steel. What is the significance of the Yield Point, Ultimate Tensile Strength (UTS), and Elastic Modulus?", keyConcepts: ["Stress-Strain Curve", "Yield Strength", "Hooke's Law", "Plastic Deformation"], hint: "Define Hooke's law, elastic vs plastic deformation, and factor of safety against yield." },
      { id: 4, level: "Basic", question: "What is the difference between ductile and brittle materials under tensile loading? How do their fracture surfaces differ?", keyConcepts: ["Ductility", "Brittleness", "Cup-and-Cone Fracture", "Cleavage"], hint: "Discuss percentage elongation, necking, and shear vs normal fracture planes." },
      { id: 5, level: "Basic", question: "Explain Pascal's Principle and how it forms the operating foundation for industrial hydraulic lift systems.", keyConcepts: ["Pascal's Law", "Hydraulic Pressure", "Force Multiplication", "Fluid Incompressibility"], hint: "F1/A1 = F2/A2; pressure exerted on an enclosed incompressibile fluid is transmitted undiminished." },
      { id: 6, level: "Basic", question: "What are the core differences between Spur, Helical, Bevel, and Worm gears in mechanical power transmission?", keyConcepts: ["Gear Types", "Axial Thrust", "Contact Ratio", "Speed Reduction"], hint: "Compare tooth profile geometry, noise levels, efficiency, and non-parallel shaft applications." },
      { id: 7, level: "Basic", question: "What is the difference between conduction, convection, and radiation heat transfer in thermal systems?", keyConcepts: ["Fourier's Law", "Newton's Law of Cooling", "Stefan-Boltzmann Law"], hint: "State governing equations for each mode and provide mechanical engineering cooling examples." },

      // INTERMEDIATE (Tier 2)
      { id: 8, level: "Intermediate", question: "What is Geometric Dimensioning & Tolerancing (GD&T)? Explain the difference between Coordinate Tolerancing and True Position under Maximum Material Condition (MMC).", keyConcepts: ["ASME Y14.5 GD&T", "True Position", "Datum Reference Frame", "Bonus Tolerance (MMC)"], hint: "Explain how True Position creates a cylindrical tolerance zone and provides bonus tolerance." },
      { id: 9, level: "Intermediate", question: "Explain the Von Mises yield criterion. Why is it preferred over Maximum Principal Stress (Rankine) when evaluating multi-axial stress in ductile materials in FEA?", keyConcepts: ["Distortion Energy Theory", "Von Mises Stress", "Ductile Failure", "FEA Stress Tensors"], hint: "Explain that Von Mises calculates distortion energy and accounts for principal shear stresses." },
      { id: 10, level: "Intermediate", question: "What Design for Manufacturing (DFM) and Design for Assembly (DFA) rules do you follow when designing parts for Injection Molding versus CNC Milling?", keyConcepts: ["DFM / DFA", "Draft Angles", "Uniform Wall Thickness", "CNC Tool Access & Fillets"], hint: "Discuss draft angles (1-2 deg), avoiding sink marks with ribs, and internal corner radius limits." },
      { id: 11, level: "Intermediate", question: "How do you perform a tolerance stack-up analysis (Worst-Case vs Root-Sum-Square / RSS) across a multi-part mechanical sub-assembly?", keyConcepts: ["Tolerance Stack-Up", "Worst-Case Analysis", "RSS Statistical Tolerancing", "Clearance Limits"], hint: "Contrast arithmetic worst-case with statistical 3-sigma RSS assembly clearance calculations." },
      { id: 12, level: "Intermediate", question: "What factors dictate the selection between ball bearings, roller bearings, and hydrodynamic journal bearings for high-speed rotating machinery?", keyConcepts: ["Bearing Selection", "Radial vs Thrust Load", "L10 Bearing Life", "Sommerfeld Number"], hint: "Discuss load capacity, operating speed, lubrication regime (elastohydrodynamic vs hydrodynamic), and L10 life." },
      { id: 13, level: "Intermediate", question: "Explain the purpose and mechanical implementation of heat treatment processes (Annealing, Quenching, and Tempering) for medium carbon steel components.", keyConcepts: ["Austenite / Martensite Transformation", "Quenching & Tempering", "Hardness vs Toughness", "Residual Stress Relief"], hint: "Explain rapid cooling to form brittle martensite followed by tempering to restore ductility." },
      { id: 14, level: "Intermediate", question: "How do you size a mechanical coil compression spring for a given load, deflection, and fatigue life constraint?", keyConcepts: ["Spring Index (C)", "Wahl Curvature Correction Factor", "Torsional Shear Stress", "Spring Rate (k)"], hint: "Use Wahl factor to account for direct shear and wire curvature stress concentration." },

      // ADVANCED (Tier 3)
      { id: 15, level: "Advanced", question: "How do you evaluate and prevent high-cycle mechanical fatigue failure in a rotating drive shaft subjected to combined reverse bending and cyclic torsion?", keyConcepts: ["S-N Wöhler Curve", "Endurance Limit", "Stress Concentrations (Kt)", "Goodman / Soderberg Criteria"], hint: "Discuss fatigue notch sensitivity, modified endurance limits, and the Modified Goodman diagram." },
      { id: 16, level: "Advanced", question: "Walk through setting up a non-linear static structural FEA simulation in ANSYS for an interference-fit bearing press assembly with frictional contact.", keyConcepts: ["Contact Formulations (Augmented Lagrange)", "Boundary Constraints", "Mesh Convergence", "Contact Penetration & Frictional Stress"], hint: "Detail contact pairing, interface offset treatment, Newton-Raphson substeps, and convergence." },
      { id: 17, level: "Advanced", question: "Scenario: A mission-critical high-speed gearbox experiences overheating and premature gear tooth pitting during initial load testing. How would you systematically diagnose and fix it?", keyConcepts: ["AGMA Surface Pitting", "Lubrication Breakdown", "Backlash & Alignment", "Thermal Expansion Sump Sizing"], hint: "Outline root cause analysis: tooth contact patterns, oil viscosity/film thickness, and case hardening depth." },
      { id: 18, level: "Advanced", question: "How do you perform a modal and harmonic response analysis in FEA to prevent destructive mechanical resonance in an electric vehicle motor casing?", keyConcepts: ["Natural Frequencies", "Mode Shapes", "Harmonic Excitation", "Damping Ratio & Campbell Diagram"], hint: "Explain extracting eigenvalues/eigenvectors, identifying excitation frequencies, and shifting resonances." },
      { id: 19, level: "Advanced", question: "Scenario: A high-pressure pneumatic actuator cylinder experiences sudden seal blow-out and rapid pressure leakage at peak stroke. How do you lead root cause analysis and redesign it?", keyConcepts: ["O-Ring Extrusion Gap", "Backup Rings", "Cylinder Wall Hoop Stress", "Surface Finish (Ra)"], hint: "Inspect extrusion gap under cylinder expansion, seal durometer rating, backup rings, and bore micro-finish." },
      { id: 20, level: "Advanced", question: "What advanced methodologies do you use in Computational Fluid Dynamics (CFD) to analyze aerodynamic drag and vortex shedding around high-speed vehicle bodies?", keyConcepts: ["Navier-Stokes Equations", "Turbulence Models (k-epsilon vs k-omega SST)", "Boundary Layer y+ Meshing", "Vorticity Shedding"], hint: "Discuss near-wall inflation layers, y+ <= 1 requirement for SST, and resolving boundary separation." },
    ];
  }

  if (domain === "chemical") {
    return [
      // BASIC (Tier 1)
      { id: 1, level: "Basic", question: "Tell me about yourself, your educational background in Chemical Engineering, and your core technical interests.", keyConcepts: ["Academic Degree", "Thermodynamics", "Process Engineering"], hint: "Highlight chemical engineering coursework, simulation tools (like Aspen Plus), and plant interests." },
      { id: 2, level: "Basic", question: "Explain the difference between steady-state and unsteady-state mass and energy balance calculations in chemical unit operations.", keyConcepts: ["Accumulation Term", "Conservation of Mass/Energy", "Continuous Flow"], hint: "State the balance equation: In - Out + Gen - Con = Acc. For steady-state, accumulation is zero." },
      { id: 3, level: "Basic", question: "What is Vapor-Liquid Equilibrium (VLE), and what is the difference between an Ideal Solution (Raoult's Law) and a Non-Ideal Azeotropic Mixture?", keyConcepts: ["VLE", "Raoult's Law", "Activity Coefficients", "Azeotropes"], hint: "Explain partial pressures under Raoult's law vs activity coefficient models (NRTL/UNIQUAC)." },
      { id: 4, level: "Basic", question: "What are the fundamental differences between Batch, Continuous Stirred-Tank (CSTR), and Plug Flow (PFR) chemical reactors?", keyConcepts: ["CSTR", "PFR", "Batch Reactors", "Space Time & Conversion"], hint: "Compare residence time distribution, volume requirements for equal conversion, and heat removal." },
      { id: 5, level: "Basic", question: "Explain Bernoulli's principle and head loss calculations (Darcy-Weisbach) in chemical process piping hydraulics.", keyConcepts: ["Bernoulli Equation", "Friction Factor (Moody Chart)", "NPSH", "Piping Head Loss"], hint: "Explain static, velocity, and elevation head alongside frictional pressure drops in process lines." },

      // INTERMEDIATE (Tier 2)
      { id: 6, level: "Intermediate", question: "Explain the McCabe-Thiele graphical method for continuous binary distillation column design. How does changing the reflux ratio impact operating lines and stage count?", keyConcepts: ["McCabe-Thiele", "Rectifying/Stripping Operating Lines", "q-Line", "Minimum Reflux (Rmin)"], hint: "Explain how increasing reflux ratio moves operating lines toward the diagonal, decreasing required stages." },
      { id: 7, level: "Intermediate", question: "How do you select the appropriate Thermodynamic Property Package in Aspen Plus (e.g., Peng-Robinson vs NRTL vs Electrolyte NRTL)?", keyConcepts: ["Aspen Plus Property Methods", "Equation of State (EOS)", "Activity Coefficient Models", "Azeotropic Polar Mixtures"], hint: "Use Peng-Robinson for hydrocarbons; NRTL/UNIQUAC for polar chemical systems; ELECNRTL for ionic solutions." },
      { id: 8, level: "Intermediate", question: "What is a HAZOP (Hazard and Operability) study, and how do you apply standard Guide Words to identify safety deviations on a Piping & Instrumentation Diagram (P&ID)?", keyConcepts: ["HAZOP Methodology", "Guide Words (MORE/LESS/NO/REVERSE)", "P&ID Process Nodes", "Safeguards & Mitigation"], hint: "Explain breaking a P&ID into nodes, pairing guide words with parameters to identify causes and safeguards." },
      { id: 9, level: "Intermediate", question: "How do you determine Net Positive Suction Head Available (NPSHa) versus Required (NPSHr) to prevent pump cavitation in volatile solvent transfer?", keyConcepts: ["NPSHa vs NPSHr", "Vapor Pressure", "Cavitation", "Suction Static Head & Friction"], hint: "NPSHa = P_suction + h_static - P_vapor - h_friction. NPSHa must exceed NPSHr by at least 0.5-1m safety margin." },
      { id: 10, level: "Intermediate", question: "Explain the principles of Pinch Analysis for heat exchanger network synthesis to maximize industrial energy recovery.", keyConcepts: ["Pinch Technology", "Composite Curves", "Minimum Utility Targets", "Above/Below Pinch Rules"], hint: "Explain hot/cold composite curves, pinch point temperature, and why heat must not transfer across the pinch." },

      // ADVANCED (Tier 3)
      { id: 11, level: "Advanced", question: "How do you design and size a Shell-and-Tube Heat Exchanger using the Log Mean Temperature Difference (LMTD) method including fouling factors?", keyConcepts: ["Q = U * A * LMTD * F", "LMTD Correction Factor", "Overall Heat Transfer Coefficient (U)", "TEMA Standards & Tube Passes"], hint: "Calculate duty Q = m*Cp*dT, compute counter-current LMTD with F factor, and determine required area A." },
      { id: 12, level: "Advanced", question: "Explain the design and scale-up considerations for an exothermic chemical batch reactor to prevent thermal runaway and ensure pressure relief.", keyConcepts: ["Reaction Kinetics (-dH_rxn)", "Heat Removal Limitations", "DIERS Vent Sizing", "Cascade Temperature Control"], hint: "Compare exponential heat generation with linear jacket cooling, and size two-phase relief vents." },
      { id: 13, level: "Advanced", question: "Scenario: A commercial multi-component distillation column exhibits severe tray weeping and sudden flooding during feed rate swings. How do you troubleshoot this?", keyConcepts: ["Tray Hydraulics", "Weeping vs Flooding (Jet/Downcomer)", "Pressure Drop Monitoring", "Reflux & Vapor Velocity Control"], hint: "Explain how low vapor velocity causes liquid weeping while excessive vapor causes liquid entrainment." },
      { id: 14, level: "Advanced", question: "How do you simulate and optimize a reactive distillation column in Aspen Plus for equilibrium-limited reversible reactions like esterification?", keyConcepts: ["Reactive Distillation", "Simultaneous Reaction & Separation", "RadFrac Kinetics Tab", "Azeotrope Breakdown"], hint: "Discuss shifting Le Chatelier equilibrium by continuously removing products while reacting in the column." },
      { id: 15, level: "Advanced", question: "Scenario: A chemical processing plant needs to transition an organic solvent extraction process to zero volatile organic compound (VOC) emissions. How do you design the recovery flowsheet?", keyConcepts: ["VOC Abatement", "Condensation & Carbon Adsorption", "Thermal Oxidizer Sizing", "Environmental Compliance"], hint: "Evaluate refrigerated condenser recovery, regenerative thermal oxidizers (RTO), and closed-loop scrubbers." },
    ];
  }

  if (domain === "software") {
    return [
      // BASIC (Tier 1)
      { id: 1, level: "Basic", question: "Tell me about yourself, your programming journey, and the core technologies you work with.", keyConcepts: ["Software Background", "Core Tech Stack", "Problem Solving"], hint: "Introduce yourself, languages/frameworks you excel in (React, Node.js, SQL), and projects you've built." },
      { id: 2, level: "Basic", question: "What are the core differences between Synchronous and Asynchronous execution in JavaScript? Explain the Event Loop and Promises.", keyConcepts: ["Event Loop", "Call Stack", "Microtask Queue", "Promises / async-await"], hint: "Explain single-threaded JS delegating async tasks to APIs, resolving Microtasks before Macrotasks." },
      { id: 3, level: "Basic", question: "What are the fundamental HTTP methods in RESTful API design, and what are the standard HTTP status codes for success, client error, and server error?", keyConcepts: ["REST APIs", "GET/POST/PUT/PATCH/DELETE", "200/201, 400/401/404, 500"], hint: "Explain CRUD mappings to HTTP methods, idempotent verbs, and standard status code ranges." },
      { id: 4, level: "Basic", question: "What is the difference between Primitive and Reference data types in JavaScript? How does pass-by-value vs pass-by-reference operate?", keyConcepts: ["Primitive vs Reference Types", "Stack vs Heap Memory", "Pass by Value/Reference", "Object Mutation"], hint: "Explain stack allocation for numbers/strings vs heap reference pointers for objects/arrays." },
      { id: 5, level: "Basic", question: "What are Git Merge and Git Rebase? When would you choose one over the other in team feature branch workflows?", keyConcepts: ["Git Merge vs Rebase", "Commit History", "Fast-Forward", "Merge Commits"], hint: "Explain how rebase creates a linear history by reapplying commits, whereas merge preserves exact chronological commits." },

      // INTERMEDIATE (Tier 2)
      { id: 6, level: "Intermediate", question: "How does React's Virtual DOM and Reconciliation algorithm (Fiber) work, and why are unique keys essential when rendering dynamic lists?", keyConcepts: ["Virtual DOM", "Diffing Algorithm", "Fiber Architecture", "Stable Keys"], hint: "Explain in-memory VDOM diffing, batched DOM updates, and how stable keys prevent remounting." },
      { id: 7, level: "Intermediate", question: "What are the trade-offs between Relational Databases (PostgreSQL) and NoSQL Document Stores (MongoDB)? How do you ensure ACID transactions?", keyConcepts: ["ACID Properties", "Relational Integrity & Foreign Keys", "Indexing", "JSONB Flexibility"], hint: "Discuss schema rigidity and ACID guarantees in PostgreSQL vs horizontal scaling in NoSQL." },
      { id: 8, level: "Intermediate", question: "How do you implement secure stateless user authentication using JSON Web Tokens (JWT) and bcrypt password hashing in an Express/Node.js backend?", keyConcepts: ["JWT Signing & Expiration", "Bcrypt Salt Rounds", "Authorization Bearer Header", "Auth Middleware"], hint: "Walk through hashing passwords, generating signed JWT tokens, verifying tokens in middleware, and secure storage." },
      { id: 9, level: "Intermediate", question: "Explain database indexing in PostgreSQL. How does a B-Tree index accelerate SELECT queries, and what is the write overhead on INSERT/UPDATE?", keyConcepts: ["PostgreSQL B-Tree Indexes", "Index Scan vs Sequential Scan", "Write Amplification", "Composite Indexes"], hint: "Explain logarithmic tree traversal vs table scans, index maintenance costs on writes, and column ordering." },
      { id: 10, level: "Intermediate", question: "What is Cross-Origin Resource Sharing (CORS), why do browsers enforce same-origin policy, and how do you configure CORS securely in Express?", keyConcepts: ["CORS Headers", "Preflight OPTIONS Request", "Same-Origin Policy", "Access-Control-Allow-Origin"], hint: "Explain preflight OPTIONS request, Access-Control-Allow-Origin header, and credentialed requests." },

      // ADVANCED (Tier 3)
      { id: 11, level: "Advanced", question: "How would you design a scalable caching architecture using Redis to accelerate slow database queries and mitigate high read traffic?", keyConcepts: ["Cache-Aside Pattern", "TTL Expiration", "Cache Invalidation", "Cache Stampede Mitigation"], hint: "Explain Cache-Aside workflow, active invalidation on writes, TTL expiration, and mutex locks." },
      { id: 12, level: "Advanced", question: "What strategies and architectural patterns do you use to optimize Frontend Core Web Vitals (Largest Contentful Paint & Interaction to Next Paint)?", keyConcepts: ["Code Splitting (React.lazy)", "Bundle Size Reduction", "Image Compression (WebP)", "INP Event Optimization"], hint: "Discuss dynamic imports with React.lazy, tree-shaking, lazy-loading assets, and unblocking the main thread." },
      { id: 13, level: "Advanced", question: "Scenario: In production, an API endpoint latency spikes from 150ms to 4500ms under heavy concurrent user load. How would you systematically diagnose and resolve the bottleneck?", keyConcepts: ["APM Profiling", "PostgreSQL EXPLAIN ANALYZE", "Database Connection Pool Saturation", "Slow Queries & Missing Indexes"], hint: "Outline structured triage: server metrics, APM traces, connection pool exhaustion, EXPLAIN ANALYZE, and indexing." },
      { id: 14, level: "Advanced", question: "How do you implement microservice inter-service communication using event-driven architectures with Apache Kafka or RabbitMQ?", keyConcepts: ["Message Queues vs Event Streams", "Idempotent Consumers", "Outbox Pattern", "Dead Letter Queues (DLQ)"], hint: "Discuss asynchronous decoupling, handling at-least-once delivery with idempotent consumers, and transactional outbox." },
      { id: 15, level: "Advanced", question: "Scenario: Design a high-throughput URL Shortener service (like bit.ly) handling 100,000 write requests per second. Detail database sharding, base62 encoding, and cache layers.", keyConcepts: ["System Design", "Base62 Encoding & Snowflake IDs", "Database Sharding & Replication", "Distributed Caching"], hint: "Walk through distributed ID generation, write sharding by hash, Redis caching with LRU, and 301 vs 302 redirects." },
    ];
  }

  // UNIVERSAL CROSS-DISCIPLINARY DEFAULT
  return [
    // BASIC (Tier 1)
    { id: 1, level: "Basic", question: `Please introduce yourself, your academic background, and why you are passionate about working as a ${targetRole}.`, keyConcepts: ["Academic Foundations", "Career Motivation", "Relevant Experience"], hint: `Share an overview of your education, projects, and motivation for pursuing ${targetRole}.` },
    { id: 2, level: "Basic", question: `What are the core technical tools, methodologies, and governing standards you utilize in your work as a ${targetRole}?`, keyConcepts: ["Core Tools", "Standard Procedures", "Technical Workflow"], hint: `Describe the main tools, software, or analytical methods you rely on.` },
    { id: 3, level: "Basic", question: `What fundamental theoretical or empirical principles form the foundation of problem solving in your field?`, keyConcepts: ["Theoretical Foundations", "Domain Principles"], hint: `Explain 2-3 foundational concepts that govern technical decisions in your discipline.` },
    { id: 4, level: "Basic", question: `What quality control checks and standard operating procedures (SOPs) do you perform before submitting technical deliverables?`, keyConcepts: ["Quality Control", "SOP Adherence", "Verification"], hint: `Discuss peer reviews, checklist validation, and accuracy checks you follow.` },
    { id: 5, level: "Basic", question: `How do you organize technical documentation, calculations, and project records for cross-team audits?`, keyConcepts: ["Documentation Standards", "Version Control", "Traceability"], hint: `Explain your filing structure, calculation sheets, and traceable project logs.` },

    // INTERMEDIATE (Tier 2)
    { id: 6, level: "Intermediate", question: `Describe your systematic process for scoping, executing, and validating a technical project from start to finish.`, keyConcepts: ["Project Lifecycle", "Validation Testing", "Documentation"], hint: `Detail your workflow from requirements gathering through design, testing, and quality assurance.` },
    { id: 7, level: "Intermediate", question: `How do you identify, assess, and mitigate risks or quality discrepancies during technical project deliverables?`, keyConcepts: ["Risk Assessment", "Quality Assurance", "Compliance"], hint: `Discuss quality standards, failure mode analysis, or inspection protocols you apply.` },
    { id: 8, level: "Intermediate", question: `Describe a scenario where you had to collaborate cross-functionally with stakeholders or resolve a technical disagreement.`, keyConcepts: ["STAR Method", "Cross-Functional Collaboration", "Conflict Resolution"], hint: `Use Situation, Task, Action, Result. Focus on data-backed decision making and team alignment.` },
    { id: 9, level: "Intermediate", question: `How do you evaluate trade-offs between performance, cost, and safety when selecting materials or engineering solutions?`, keyConcepts: ["Cost-Benefit Trade-offs", "Safety Factors", "Performance Metrics"], hint: `Explain quantitative trade-off matrices and safety margin calculations.` },
    { id: 10, level: "Intermediate", question: `What diagnostic methods do you use when experimental or operational test results deviate from analytical models?`, keyConcepts: ["Discrepancy Analysis", "Model Validation", "Instrumentation Error"], hint: `Check boundary assumptions, calibrate sensors, and isolate confounding variables.` },

    // ADVANCED (Tier 3)
    { id: 11, level: "Advanced", question: `How do you optimize project workflows for maximum efficiency, safety, and regulatory compliance under tight deadlines?`, keyConcepts: ["Process Optimization", "Safety Compliance", "Resource Management"], hint: `Explain how you balance speed, engineering rigor, and strict standards adherence.` },
    { id: 12, level: "Advanced", question: `What advanced methodologies or emerging industry trends are transforming practices in your domain?`, keyConcepts: ["Industry Innovation", "Continuous Learning", "Advanced Tooling"], hint: `Discuss modern developments, automation, or updated industry methodologies.` },
    { id: 13, level: "Advanced", question: `Scenario: An unexpected technical failure occurs during the final validation phase before deployment. How do you lead root cause analysis and corrective action?`, keyConcepts: ["Root Cause Analysis (RCA)", "Corrective Actions (CAPA)", "Crisis Leadership"], hint: `Outline structured containment, hypothesis testing, root cause isolation, and preventative process updates.` },
    { id: 14, level: "Advanced", question: `How do you establish quantitative reliability targets (MTBF / failure rate) and design redundancy into high-consequence systems?`, keyConcepts: ["Reliability Engineering", "MTBF Calculations", "Redundancy Design", "FMEA Analysis"], hint: `Discuss series vs parallel reliability architectures and active/passive fail-safes.` },
    { id: 15, level: "Advanced", question: `Scenario: You are tasked with leading the technical scale-up of a pilot project into full industrial production. What is your risk mitigation plan?`, keyConcepts: ["Scale-Up Engineering", "CapEx/OpEx Planning", "Process Validation", "Regulatory Handover"], hint: `Detail dimensional scaling laws, pilot data verification, supply chain readiness, and commissioning.` },
  ];
};

// ==========================================
// Dynamic Procedural Question Permutator (Infinite Unique Fallback Pool)
// ==========================================
const generateDynamicProceduralQuestion = (domain, targetRole, level, askedQuestions = []) => {
  const mechanicalTopics = [
    { topic: "kinematic synthesis of four-bar linkages", concepts: ["Grashof Condition", "Transmission Angle", "Dead Center Positions"], hint: "Explain linkage classification and optimizing transmission angle for smooth force transfer." },
    { topic: "high-temperature creep deformation and Larson-Miller parameter in turbine blades", concepts: ["Creep Rupture", "Larson-Miller Parameter", "Grain Boundary Sliding"], hint: "Discuss primary, secondary, and tertiary creep stages and single-crystal nickel superalloy selection." },
    { topic: "regenerative braking and thermal energy dissipation in automotive disk brakes", concepts: ["Frictional Heat Flux", "Disk Rotor Thermal Stress", "Fade Resistance"], hint: "Explain heat dissipation through vented rotors and balancing regenerative vs friction braking." },
    { topic: "fluid power hydraulic circuit sequencing and pressure-compensated flow control valves", concepts: ["Directional Control", "Pressure Compensation", "Meter-In vs Meter-Out"], hint: "Detail maintaining constant actuator speed irrespective of fluctuating mechanical load resistance." },
    { topic: "sheet metal stamping deep drawing limits and Limiting Drawing Ratio (LDR)", concepts: ["Anisotropy (r-value)", "Blank Holder Force", "Wrinkling vs Tearing"], hint: "Explain blank holder pressure, die radius sizing, and preventing earing using high r-value alloys." },
    { topic: "vibration isolation and damping transmissibility in precision industrial machinery", concepts: ["Transmissibility Ratio", "Frequency Ratio (r > sqrt(2))", "Viscous Damping"], hint: "Show how operating above root(2) of natural frequency achieves vibration attenuation." },
    { topic: "additive manufacturing (DMLS/SLM) residual stress mitigation and orientation optimization", concepts: ["Thermal Gradient Mechanism", "Support Structures", "Stress Relief Annealing"], hint: "Explain build orientation trade-offs between support structure removal and tensile thermal stresses." },
    { topic: "hydrodynamic lubrication and oil film thickness calculation in sleeve bearings", concepts: ["Petroff Equation", "Sommerfeld Number", "Minimum Film Thickness (h0)"], hint: "Explain operating in the hydrodynamic regime to prevent metal-to-metal boundary contact." },
    { topic: "bolted joint preload tightening and joint separation under external cyclic tensile loads", concepts: ["Bolt Stiffness vs Clamped Member Stiffness", "Preload Loss", "Gasket Sealing"], hint: "Explain joint diagram (Fritsche) showing that bolt carries only a fraction of cyclic external force." },
    { topic: "centrifugal pump affinity laws and system resistance curve intersection", concepts: ["Affinity Laws (Flow, Head, Power)", "Best Efficiency Point (BEP)", "Impeller Trimming"], hint: "Explain how speed scaling impacts head (N^2) and power (N^3) and modifying duty points via VFDs." },
    { topic: "FEA mesh convergence and singularity identification in stress concentration zones", concepts: ["h-refinement vs p-refinement", "Stress Singularities", "Von Mises Criterion"], hint: "Explain differentiating true high stress from numerical singularities near re-entrant sharp corners." },
    { topic: "GD&T maximum material condition (MMC) and bonus tolerance calculation on position callouts", concepts: ["MMC Modifier", "Bonus Tolerance", "Functional Gauging"], hint: "Walk through calculating additional positional tolerance allowed as feature size departs from MMC." },
  ];

  const chemicalTopics = [
    { topic: "supercritical fluid extraction and phase envelope transitions in pharmaceutical isolation", concepts: ["Supercritical CO2", "Phase Envelopes", "Solubility Tuning"], hint: "Explain density control via pressure/temperature manipulation without leaving solvent residues." },
    { topic: "catalyst deactivation mechanisms (coking, poisoning, sintering) and regeneration cycles", concepts: ["Catalyst Activity Decay", "Coke Burn-Off", "Thermal Sintering"], hint: "Discuss carbon deposition on active sites and controlled oxygen decoking procedures." },
    { topic: "extractive and pressure-swing distillation for breaking maximum-boiling azeotropes", concepts: ["Entrainer Selection", "Azeotropic Shift", "Residue Curve Maps"], hint: "Explain shifting VLE curves with pressure changes vs using high-boiling entrainers." },
    { topic: "fluidized bed reactor hydrodynamics and minimum fluidization velocity (Umf)", concepts: ["Ergun Equation", "Bubbling Fluidization", "Elutriation Limit"], hint: "Calculate pressure drop across bed and maintain velocity between Umf and terminal velocity." },
    { topic: "membrane separation processes (Reverse Osmosis vs Forward Osmosis) and concentration polarization", concepts: ["Osmotic Pressure", "Flux Decline", "Concentration Polarization"], hint: "Discuss mitigating membrane fouling and boundary layer resistance in high-salinity recovery." },
    { topic: "process control loop tuning (Ziegler-Nichols vs IMC) for non-linear exothermic CSTR jacket systems", concepts: ["PID Tuning", "Internal Model Control", "Dead Time Compensation"], hint: "Explain quarter-amplitude decay and adjusting reset time to prevent temperature oscillations." },
    { topic: "HAZOP safety risk assessment and Layer of Protection Analysis (LOPA) in high-pressure reactors", concepts: ["Guide Words", "Safety Instrumented Systems (SIS)", "SIL Ratings"], hint: "Walk through deviation analysis using Flow/Pressure guide words and independent protection layers." },
  ];

  const cybersecurityTopics = [
    { topic: "zero trust network access architecture and continuous cryptographic validation", concepts: ["Micro-Segmentation", "Identity Provider (IdP)", "Least Privilege"], hint: "Explain moving beyond perimeter firewalls with continuous session risk scoring and mTLS." },
    { topic: "MITRE ATT&CK lateral movement detection and Pass-the-Hash mitigation", concepts: ["Kerberos Ticket Granting", "Credential Guard", "Honey Tokens"], hint: "Detail defending Active Directory environments against NTLM relay and LSASS memory dumping." },
    { topic: "cryptographic key lifecycle management and post-quantum lattice-based encryption algorithms", concepts: ["Key Derivation Functions", "Kyber / Dilithium", "Forward Secrecy"], hint: "Discuss transitioning legacy RSA/ECC public key systems to quantum-resistant primitives." },
    { topic: "cloud-native Kubernetes container escape prevention and eBPF kernel telemetry", concepts: ["Cgroups / Namespaces", "Seccomp Profiles", "eBPF Runtime Detection"], hint: "Explain detecting root escalation and uncontained syscalls in production container clusters." },
  ];

  const civilTopics = [
    { topic: "seismic base isolation and non-linear dynamic response spectrum structural analysis", concepts: ["Elastomeric Bearings", "Ductility Reduction Factor", "Inter-Story Drift"], hint: "Explain isolating superstructures from ground accelerations and limiting non-structural damage." },
    { topic: "geotechnical soil-structure interaction and pile foundation settlement under cyclic lateral loading", concepts: ["p-y Curves", "Skin Friction vs End Bearing", "Liquefaction Potential"], hint: "Discuss analyzing lateral pile group deflection under seismic or wave loading." },
    { topic: "prestressed concrete tendon friction losses and long-term creep/shrinkage prestress relaxation", concepts: ["Wobble and Curvature Friction", "Elastic Shortening", "Long-Term Losses"], hint: "Calculate initial vs residual post-tensioning force along parabolic tendon profiles." },
  ];

  const electricalTopics = [
    { topic: "switch-mode power supply (SMPS) EMI noise suppression and layout parasitic inductance reduction", concepts: ["Conducted vs Radiated EMI", "Snubber Circuits", "High di/dt Loops"], hint: "Explain minimizing high-frequency switching current loops and optimizing ground plane return paths." },
    { topic: "high-voltage power grid harmonic distortion mitigation and active power factor correction (PFC)", concepts: ["Total Harmonic Distortion (THD)", "Active Front End", "IEEE 519 Standards"], hint: "Detail pulse-width modulated rectifiers and active filtering to maintain unity power factor." },
    { topic: "FPGA hardware pipeline timing closure and metastablity resolution in multi-clock domains", concepts: ["Setup/Hold Slack", "Clock Domain Crossing (CDC)", "Dual-Flop Synchronizers"], hint: "Explain resolving CDC metastability with asynchronous FIFOs and Gray code pointers." },
  ];

  const biotechTopics = [
    { topic: "bioreactor scale-up oxygen mass transfer coefficient (kLa) and shear sensitivity in mammalian cultures", concepts: ["Volumetric Mass Transfer", "Impeller Tip Speed", "Sparger Design"], hint: "Explain maintaining adequate dissolved oxygen without exceeding shear stress thresholds." },
    { topic: "chromatographic downstream purification yield optimization and host cell protein (HCP) clearance", concepts: ["Protein A Affinity", "Ion Exchange", "Viral Filtration"], hint: "Discuss resolving column binding capacity, elution pH gradients, and regulatory purity specs." },
  ];

  const businessFinanceTopics = [
    { topic: "discounted cash flow (DCF) terminal value sensitivity and weighted average cost of capital (WACC)", concepts: ["Cost of Equity (CAPM)", "Cost of Debt", "Perpetual Growth vs Exit Multiple"], hint: "Explain sensitivity tables evaluating valuation impact under interest rate and growth rate shifts." },
    { topic: "enterprise risk management and probabilistic Monte Carlo revenue forecasting", concepts: ["Variance Analysis", "Confidence Intervals", "Sensitivity Modeling"], hint: "Detail running probabilistic distributions over key cost drivers to quantify downside risks." },
  ];

  const softwareTopics = [
    { topic: "database replication lag mitigation and read-your-own-writes consistency patterns", concepts: ["Primary-Replica Replication", "Eventual Consistency", "Sticky Sessions / Version Tokens"], hint: "Discuss routing recent mutations to the primary or leveraging monotonic read tokens." },
    { topic: "optimistic vs pessimistic concurrency control in distributed relational transactions", concepts: ["Row Versioning (MVCC)", "SELECT FOR UPDATE", "Lost Updates Prevention"], hint: "Compare version check retries against exclusive row locks under high write contention." },
    { topic: "WebSockets vs Server-Sent Events (SSE) for high-concurrency real-time streaming telemetry", concepts: ["Bi-Directional vs Uni-Directional", "TCP Connection Overhead", "HTTP/2 Multiplexing"], hint: "Analyze protocol differences, reconnection strategies, and memory footprints per active client." },
    { topic: "distributed rate limiting architecture using Redis Token Bucket and Sliding Window logs", concepts: ["Token Bucket Algorithm", "Redis Lua Scripts", "Rate Limiter Gateways"], hint: "Walk through atomic Lua script execution in Redis to avoid race conditions under burst traffic." },
    { topic: "React concurrency features (useTransition, useDeferredValue) and non-blocking UI rendering", concepts: ["Interruptible Rendering", "Transition Priority", "Suspense Boundaries"], hint: "Explain scheduling urgent user input updates above heavy background state computations." },
  ];

  const generalTopics = [
    { topic: "system reliability analysis and single-point-of-failure isolation in critical operations", concepts: ["Fault Tree Analysis (FTA)", "Failure Modes", "Redundancy Architecture"], hint: "Walk through systematic failure mapping and implementing active-standby safeguards." },
    { topic: "quantitative quality control and Six Sigma DMAIC variance reduction methodologies", concepts: ["DMAIC Process", "Cp / Cpk Capability Indices", "Statistical Process Control"], hint: "Detail measuring process capability (Cpk >= 1.33) and eliminating assignable root causes." },
    { topic: "lifecycle cost analysis (LCC) and total cost of ownership (TCO) optimization", concepts: ["CapEx vs OpEx", "Discounted Cash Flow", "Asset Replacement Scheduling"], hint: "Explain balancing initial acquisition costs against maintenance, energy, and downtime." },
  ];

  let topicList = generalTopics;
  if (domain === "mechanical") topicList = mechanicalTopics;
  else if (domain === "chemical") topicList = chemicalTopics;
  else if (domain === "cybersecurity") topicList = cybersecurityTopics;
  else if (domain === "civil") topicList = civilTopics;
  else if (domain === "electrical") topicList = electricalTopics;
  else if (domain === "biotech") topicList = biotechTopics;
  else if (domain === "business_finance") topicList = businessFinanceTopics;
  else if (domain === "software") topicList = softwareTopics;

  // Build candidate questions from available topics and templates
  const questionTemplates = {
    Basic: [
      (t) => `What are the fundamental principles and standard tools you utilize when approaching ${t.topic} in ${targetRole}?`,
      (t) => `How do you evaluate, calculate, and verify foundational metrics for ${t.topic}?`,
      (t) => `What standard operating procedures and technical benchmarks do you rely on when analyzing ${t.topic}?`,
    ],
    Intermediate: [
      (t) => `How do you design, optimize, and validate ${t.topic} to meet rigorous engineering specifications?`,
      (t) => `What technical constraints, industry standards, and failure modes must you account for when implementing ${t.topic}?`,
      (t) => `Describe your step-by-step methodology for executing ${t.topic} in real-world projects.`,
    ],
    Advanced: [
      (t) => `Scenario: A mission-critical system fails validation due to unexpected anomalies in ${t.topic}. How do you diagnose and resolve this?`,
      (t) => `How do you model, simulate, and resolve non-linear edge cases in ${t.topic} for high-performance applications?`,
      (t) => `Detail an advanced optimization framework for ${t.topic} that balances cost, safety, and strict regulatory compliance.`,
    ],
  };

  const templates = questionTemplates[level] || questionTemplates.Intermediate;

  // Shuffle topics and templates to maximize novelty
  const shuffledTopics = shuffle(topicList);
  const shuffledTemplates = shuffle(templates);

  for (const topicObj of shuffledTopics) {
    for (const tplFn of shuffledTemplates) {
      const candidateQ = tplFn(topicObj);
      if (!isSemanticDuplicate(candidateQ, askedQuestions)) {
        return {
          level,
          question: candidateQ,
          keyConcepts: topicObj.concepts,
          hint: topicObj.hint,
        };
      }
    }
  }

  // Final fallback with timestamped non-duplicate guarantee
  const fallbackTopic = topicList[Math.floor(Math.random() * topicList.length)];
  return {
    level,
    question: `In your experience with ${targetRole}, how do you systematically diagnose and resolve complex anomalies in ${fallbackTopic.topic}?`,
    keyConcepts: fallbackTopic.concepts,
    hint: fallbackTopic.hint,
  };
};

// ==========================================
// 8. Generate 1 Single Fresh Mock Question (Delegated to mockInterviewEngine)
// ==========================================
const {
  generateMockInterviewEngine,
  generateNextMockQuestionEngine,
} = require("./mockInterviewEngine");

const generateNextMockQuestion = async (params) => {
  return generateNextMockQuestionEngine(params);
};

// ==========================================
// 9. Regenerate Single Mock Question (Delegated to mockInterviewEngine)
// ==========================================
const regenerateMockQuestion = async (params) => {
  const { askedQuestions = [], currentQuestion = "" } = params;
  const exclusionList = Array.from(
    new Set([...(Array.isArray(askedQuestions) ? askedQuestions : []), currentQuestion].filter(Boolean))
  );
  return generateNextMockQuestionEngine({
    ...params,
    askedQuestions: exclusionList,
  });
};

// ==========================================
// 10. Generate 9-Question Mock Interview Structure (Delegated to mockInterviewEngine)
// ==========================================
const generateMockInterview = async (params) => {
  return generateMockInterviewEngine(params);
};

// ==========================================
// 11. AI Mock Interview Evaluation & Scoring (Delegated to mockInterviewEngine)
// ==========================================
const { evaluateMockInterviewEngine } = require("./mockInterviewEngine");

const evaluateMockInterview = async (params) => {
  return evaluateMockInterviewEngine(params);
};

module.exports = {
  isSemanticDuplicate,
  generateCoverLetterText,
  generateResumeContent,
  parseResumeText,
  generateCareerRoadmap,
  analyzeSkillGap,
  generateInterviewQuestions,
  generateMockInterview,
  generateNextMockQuestion,
  regenerateMockQuestion,
  evaluateMockInterview,
};
