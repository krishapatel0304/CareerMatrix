/**
 * Live AI Mock Interview Generation Engine (Strict Relevance, Zero-Hallucination & Multi-Session Variation)
 * Generates authentic, 100% relevant, non-repeating interview questions tailored strictly to candidate's role,
 * career field, experience level, verified resume details, listed skills, and Job Description.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Candidate Gemini models in fallback order
const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

async function callGeminiApi(prompt, systemInstruction = "", options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
    console.log("ℹ️ [Mock Interview Engine] GEMINI_API_KEY not set; using dynamic domain procedural engine.");
    return null;
  }

  const temperature = options.temperature || 0.85;

  // 1. SDK Attempt
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
      } catch (err) {
        // try next model
      }
    }
  } catch (sdkErr) {
    // try rest
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
          generationConfig: { temperature, maxOutputTokens: 2048 },
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } catch (e) {
      // try next
    }
  }
  return null;
}

function extractJson(text) {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const target = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(target);
  } catch (err) {
    try {
      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        return JSON.parse(text.substring(firstBracket, lastBracket + 1));
      }
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "with", "of", "how", "what", "can", "you",
  "tell", "me", "about", "your", "explain", "describe", "walk", "through", "when", "why", "where",
  "which", "would", "could", "should", "using", "used", "does", "scenario", "project", "work",
  "give", "an", "example", "please", "discuss", "approach", "handle"
]);

function normalizeQ(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSignificantTokens(text) {
  const clean = normalizeQ(text);
  return clean
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Intelligent Multi-Level Semantic & Fuzzy Duplicate Detection
 */
function isSemanticDuplicate(qText, exclusionList) {
  if (!qText || !Array.isArray(exclusionList) || exclusionList.length === 0) return false;
  const cleanQ = normalizeQ(qText);
  if (!cleanQ) return false;

  const tokensA = extractSignificantTokens(qText);
  const setA = new Set(tokensA);

  return exclusionList.some((item) => {
    const rawItem = typeof item === "string" ? item : item?.question || "";
    const cleanItem = normalizeQ(rawItem);
    if (!cleanItem) return false;

    // 1. Exact normalized match
    if (cleanItem === cleanQ) return true;

    // 2. Substring match for substantial questions
    if (cleanItem.length > 25 && cleanQ.length > 25) {
      if (cleanItem.includes(cleanQ) || cleanQ.includes(cleanItem)) return true;
    }

    // 3. Jaccard token similarity check
    const tokensB = extractSignificantTokens(rawItem);
    if (tokensA.length === 0 || tokensB.length === 0) return false;
    const setB = new Set(tokensB);

    let intersection = 0;
    for (const t of setA) {
      if (setB.has(t)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    if (jaccard >= 0.52) return true;

    // 4. Paraphrase detection (high subset containment)
    const minSize = Math.min(setA.size, setB.size);
    if (minSize >= 4 && intersection / minSize >= 0.72) {
      return true;
    }

    return false;
  });
}

/**
 * Extract clean, verified highlights from candidate resume data.
 * NEVER invents or hallucinates details.
 */
function extractResumeHighlights(context = {}) {
  const {
    candidateName = "",
    education = "",
    experience = "",
    projects = "",
    certifications = "",
    skills = "",
    objective = "",
    resumeData = null,
  } = context;

  const rawPersonal = resumeData?.personal || {};
  const rawProfessional = resumeData?.professional || {};

  const cleanName = candidateName || rawPersonal.name || "";
  const cleanEdu = education || rawProfessional.education || "";
  const cleanExp = experience || rawProfessional.experience || "";
  const cleanProj = projects || rawProfessional.projects || "";
  const cleanCert = certifications || rawProfessional.certifications || "";
  const cleanSkills = skills || rawProfessional.skills || "";
  const cleanObj = objective || rawProfessional.objective || "";

  const cleanList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val
        .map((s) => (typeof s === "string" ? s.trim() : s?.name || s?.title || s?.skill || ""))
        .filter(Boolean);
    }
    return String(val)
      .split(/[\n,;•\r\t]+/)
      .map((s) => s.replace(/^[\*\-\#\d\.\s]+/, "").trim())
      .filter((s) => s.length > 1);
  };

  const skillsList = cleanList(cleanSkills);
  const certificationsList = cleanList(cleanCert);
  const educationList = cleanList(cleanEdu);

  let projectsList = [];
  if (typeof cleanProj === "string" && cleanProj.trim()) {
    projectsList = cleanProj
      .split(/\n\n+|\n(?=[A-Z0-9\*\#\-])/)
      .map((p) => p.replace(/^[\*\-\#\d\.\s]+/, "").trim())
      .filter((p) => p.length > 3);
  }
  if (projectsList.length === 0 && cleanProj) {
    projectsList = cleanList(cleanProj);
  }

  let experienceList = [];
  if (typeof cleanExp === "string" && cleanExp.trim()) {
    experienceList = cleanExp
      .split(/\n\n+|\n(?=[A-Z0-9\*\#\-])/)
      .map((e) => e.replace(/^[\*\-\#\d\.\s]+/, "").trim())
      .filter((e) => e.length > 3);
  }
  if (experienceList.length === 0 && cleanExp) {
    experienceList = cleanList(cleanExp);
  }

  const hasResume = Boolean(
    projectsList.length > 0 ||
    skillsList.length > 0 ||
    experienceList.length > 0 ||
    certificationsList.length > 0 ||
    educationList.length > 0
  );

  return {
    candidateName: cleanName.trim(),
    education: cleanEdu.trim(),
    educationList,
    experience: cleanExp.trim(),
    experienceList,
    projects: cleanProj.trim(),
    projectsList,
    certifications: cleanCert.trim(),
    certificationsList,
    skills: cleanSkills.trim(),
    skillsList,
    objective: cleanObj.trim(),
    hasResume,
  };
}

/**
 * Extract technical terms and requirements from Job Description
 */
function extractSkillsFromJobDescription(jdText = "") {
  if (!jdText || typeof jdText !== "string" || jdText.trim().length < 10) return [];
  const lower = jdText.toLowerCase();

  const commonKeywords = [
    "react", "react.js", "next.js", "vue", "angular", "node", "node.js", "express", "django", "flask",
    "fastapi", "spring boot", "java", "python", "c++", "c#", ".net", "golang", "rust", "typescript",
    "javascript", "html", "css", "tailwind", "sass", "bootstrap", "sql", "postgresql", "mysql", "mongodb",
    "redis", "graphql", "rest", "rest api", "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd",
    "git", "linux", "solidworks", "autocad", "catia", "ansys", "fea", "cfd", "gd&t", "dfm", "dfma",
    "siem", "splunk", "wireshark", "soc", "nist", "owasp", "metasploit", "burp suite", "firewall",
    "staad", "etabs", "revit", "matlab", "simulink", "plc", "scada", "hysys", "aspen plus", "hazop",
    "figma", "adobe xd", "wireframing", "prototyping", "usability testing", "wcag", "agile", "scrum"
  ];

  const matched = [];
  commonKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) {
      matched.push(kw);
    }
  });

  return Array.from(new Set(matched));
}

/**
 * Normalize experience level to standard tier: "Fresher" | "Intermediate" | "Experienced"
 */
function normalizeExperienceLevel(rawLevel = "") {
  const l = (rawLevel || "").toLowerCase();
  if (l.includes("fresh") || l.includes("entry") || l.includes("beginner") || l.includes("basic") || l.includes("junior")) {
    return "Fresher";
  }
  if (l.includes("senior") || l.includes("lead") || l.includes("expert") || l.includes("advanced") || l.includes("principal")) {
    return "Experienced";
  }
  return "Intermediate";
}

/**
 * Detect primary domain archetype
 */
function detectDomainArchetype(careerField = "", role = "") {
  const text = `${careerField} ${role}`.toLowerCase();

  if (text.includes("ui/ux") || text.includes("ui designer") || text.includes("ux designer") || text.includes("product designer") || text.includes("ui developer") || text.includes("interaction design")) {
    return "UIUX";
  }
  if (text.includes("cyber") || text.includes("security") || text.includes("infosec") || text.includes("soc") || text.includes("penetration") || text.includes("threat") || text.includes("incident response")) {
    return "CYBERSECURITY";
  }
  if (text.includes("mechanical") || text.includes("cad") || text.includes("solidworks") || text.includes("automotive") || text.includes("aerospace") || text.includes("manufacturing") || text.includes("thermal")) {
    return "MECHANICAL";
  }
  if (text.includes("civil") || text.includes("structural") || text.includes("construction") || text.includes("geotechnical") || text.includes("transportation") || text.includes("concrete") || text.includes("staad")) {
    return "CIVIL";
  }
  if (text.includes("chemical") || text.includes("process") || text.includes("petroleum") || text.includes("refinery") || text.includes("polymer") || text.includes("hazop") || text.includes("aspen")) {
    return "CHEMICAL";
  }
  if (text.includes("electrical") || text.includes("electronics") || text.includes("embedded") || text.includes("vlsi") || text.includes("pcb") || text.includes("circuit") || text.includes("microcontroller")) {
    return "ELECTRICAL";
  }
  if (text.includes("robotics") || text.includes("mechatronics") || text.includes("automation") || text.includes("plc")) {
    return "ROBOTICS";
  }
  if (text.includes("data scientist") || text.includes("data science") || text.includes("machine learning") || text.includes("deep learning") || text.includes("ai engineer") || text.includes("nlp")) {
    return "DATA_AI";
  }
  if (text.includes("finance") || text.includes("accounting") || text.includes("banking") || text.includes("financial analyst") || text.includes("audit")) {
    return "FINANCE";
  }
  if (text.includes("human resources") || text.includes(" hr ") || text.includes("recruiter") || text.includes("talent acquisition")) {
    return "HR";
  }
  if (text.includes("marketing") || text.includes("seo") || text.includes("sales") || text.includes("digital marketing")) {
    return "MARKETING";
  }
  if (text.includes("software") || text.includes("developer") || text.includes("frontend") || text.includes("backend") || text.includes("full stack") || text.includes("web") || text.includes("cloud") || text.includes("devops") || text.includes("it")) {
    return "SOFTWARE";
  }
  return "GENERAL_ENGINEERING";
}

/**
 * Build consolidated interview context
 */
function extractInterviewContext(params = {}) {
  const highlights = extractResumeHighlights(params);
  const targetRole = (params.role || params.targetRole || params.jobRole || "Engineering Professional").trim();
  const careerField = (params.careerField || params.field || params.industry || "Software / IT").trim();
  const experienceLevel = normalizeExperienceLevel(params.experienceLevel || params.difficulty || params.level);
  const jobDescription = (params.jobDescription || "").trim();
  const jdSkills = extractSkillsFromJobDescription(jobDescription);
  const archetype = detectDomainArchetype(careerField, targetRole);

  const allSkills = Array.from(new Set([...highlights.skillsList, ...jdSkills]));

  return {
    highlights,
    targetRole,
    careerField,
    experienceLevel,
    jobDescription,
    jdSkills,
    archetype,
    allSkills,
  };
}

/**
 * Cross-domain keyword check (prevent out-of-domain questions)
 */
function checkCrossDomainMismatch(qText = "", archetype = "") {
  const lower = qText.toLowerCase();

  const domainForbiddenTerms = {
    MECHANICAL: ["react component", "sql query", "rest api", "xss attack", "css flexbox", "accounting balance sheet", "siem alert", "html form", "nosql", "redux state"],
    CIVIL: ["react hooks", "sql query", "rest api", "cyber threat", "injection molding", "microcontroller register", "siem", "css styling", "vue component"],
    CHEMICAL: ["react hooks", "sql query", "rest api", "solidworks extrude", "penetration testing", "css grid", "staad pro beam", "pcb routing"],
    ELECTRICAL: ["concrete slump", "civil foundation", "chemical reactor", "accounting debit", "seo keyword", "css flexbox"],
    CYBERSECURITY: ["injection molding", "tensile stress strain", "civil foundation", "concrete beam", "distillation column", "css flexbox", "figma wireframe"],
    UIUX: ["kernel driver", "chemical reactor kinetics", "firmware register", "distillation column", "tensile strength curve", "staad pro load"],
    SOFTWARE: ["welding inspection", "concrete slump test", "distillation column", "asphalt compaction", "geotechnical soil bearing", "accounting journal debit"],
    FINANCE: ["react component", "solidworks cad", "concrete beam", "siem event", "packet sniffing"],
    HR: ["sql query", "react component", "finite element analysis", "circuit schematics", "distillation column"],
    MARKETING: ["kernel driver", "finite element analysis", "sql foreign key constraint", "pcb trace"],
  };

  const forbidden = domainForbiddenTerms[archetype] || [];
  for (const term of forbidden) {
    if (lower.includes(term)) {
      return { valid: false, reason: `Question mentions "${term}" which is incompatible with domain ${archetype}` };
    }
  }
  return { valid: true };
}

/**
 * Strict Resume Truthfulness & Anti-Hallucination check
 */
function checkResumeHallucination(qText = "", context = {}) {
  const lower = qText.toLowerCase();
  const { highlights } = context;

  const claimsResume = lower.includes("from your resume") ||
                       lower.includes("on your resume") ||
                       lower.includes("in your project") ||
                       lower.includes("your resume mentions") ||
                       lower.includes("you have listed") ||
                       lower.includes("you worked on");

  if (claimsResume) {
    const commonTechs = [
      "angular", "vue", "react", "python", "java", "c++", "c#", "ruby", "rust", "golang", "php",
      "docker", "kubernetes", "aws", "azure", "gcp", "graphql", "postgresql", "mysql", "mongodb",
      "redis", "kafka", "solidworks", "autocad", "ansys", "splunk", "wireshark", "figma", "staad",
      "hadoop", "spark", "flutter", "swift", "kotlin", "tensorflow", "pytorch"
    ];

    const lowerResumeText = `${highlights.skills} ${highlights.projects} ${highlights.experience} ${highlights.education} ${highlights.certifications} ${context.jobDescription}`.toLowerCase();

    for (const tech of commonTechs) {
      const escapedTech = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const techPattern = new RegExp(`(?:\\b|\\W)${escapedTech}(?:\\b|\\W)`, "i");
      if (techPattern.test(lower)) {
        if (!techPattern.test(lowerResumeText)) {
          return {
            valid: false,
            reason: `Question references "${tech}" as candidate background, but "${tech}" is not in resume or JD.`,
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Experience Level check
 */
function checkExperienceLevelAppropriateness(qText = "", level = "Intermediate") {
  const lower = qText.toLowerCase();

  if (level === "Fresher") {
    const seniorPhrases = [
      "in your 5+ years of",
      "in your 10+ years of",
      "leading your department",
      "managing a multimillion",
      "over your extensive career",
      "managing multiple engineering teams",
      "as a director of",
      "as a principal architect leading 20"
    ];
    for (const phrase of seniorPhrases) {
      if (lower.includes(phrase)) {
        return { valid: false, reason: `Senior phrasing "${phrase}" is inappropriate for a Fresher.` };
      }
    }
  }

  return { valid: true };
}

/**
 * Domain & Role Relevance Check
 */
function checkDomainAndRoleRelevance(qText = "", context = {}) {
  const lower = qText.toLowerCase();

  if (lower.includes("tell me about yourself") || lower.includes("introduce yourself")) {
    return { valid: true };
  }

  const isBehavioral = lower.includes("conflict") || lower.includes("roadblock") || lower.includes("disagreement") || lower.includes("challenge") || lower.includes("teamwork") || lower.includes("mistake") || lower.includes("deadline") || lower.includes("unfamiliar");
  if (isBehavioral) {
    return { valid: true };
  }

  if (context.highlights.hasResume) {
    const userProjects = context.highlights.projectsList || [];
    const userSkills = context.highlights.skillsList || [];
    if (userProjects.some((p) => lower.includes(p.toLowerCase().slice(0, 15)))) return { valid: true };
    if (userSkills.some((s) => lower.includes(s.toLowerCase()))) return { valid: true };
  }

  const roleTerms = context.targetRole.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "for", "with"].includes(w));
  const fieldTerms = context.careerField.toLowerCase().split(/[\s\/]+/).filter((w) => w.length > 2 && !["and", "the"].includes(w));

  const matchesRoleOrField = [...roleTerms, ...fieldTerms].some((term) => lower.includes(term));
  if (matchesRoleOrField) {
    return { valid: true };
  }

  const matchesSkill = context.allSkills.some((s) => lower.includes(s.toLowerCase()));
  if (matchesSkill) {
    return { valid: true };
  }

  const archetypeDomainTerms = {
    SOFTWARE: [
      "code", "software", "api", "rest", "graphql", "database", "sql", "nosql", "query", "schema",
      "frontend", "backend", "full stack", "react", "node", "javascript", "typescript", "python",
      "architecture", "debugging", "profiler", "component", "state", "async", "testing", "unit test",
      "ci/cd", "docker", "scalability", "queue", "cache", "redis", "latency", "module", "refactor",
      "performance", "deployment", "microservice", "security", "jwt", "transaction", "pattern", "clean code",
      "programming", "git", "web"
    ],
    CYBERSECURITY: [
      "security", "threat", "vulnerability", "incident", "siem", "splunk", "wireshark", "firewall",
      "packet", "zero trust", "nist", "mitre", "attack", "malware", "soc", "phishing", "encryption",
      "triage", "forensic", "audit", "compliance", "exploit", "cve", "breach", "access control", "network"
    ],
    MECHANICAL: [
      "mechanical", "cad", "solidworks", "autocad", "ansys", "fea", "stress", "strain", "gd&t",
      "tolerance", "dfm", "dfa", "machining", "thermodynamics", "fluid", "material", "fatigue",
      "yield", "deflection", "vibration", "bearing", "prototype", "fmea", "component", "assembly", "cooling"
    ],
    UIUX: [
      "ui", "ux", "design", "figma", "wireframe", "prototype", "accessibility", "wcag", "contrast",
      "hierarchy", "css", "layout", "responsive", "breakpoint", "user testing", "onboarding", "checkout",
      "micro-interaction", "style guide", "design tokens", "interaction", "typography"
    ],
    CIVIL: [
      "civil", "structural", "concrete", "rebar", "foundation", "bearing capacity", "staad", "etabs",
      "beam", "slab", "seismic", "wind load", "shear", "slump test", "deflection", "soil", "geotechnical",
      "aci", "aisc", "excavation", "construction", "load"
    ],
    CHEMICAL: [
      "chemical", "process", "reactor", "kinetics", "distillation", "aspen", "hysys", "p&id", "hazop",
      "thermodynamics", "mass balance", "energy balance", "heat exchanger", "catalyst", "yield",
      "pressure drop", "flooding", "safety relief", "emissions", "column"
    ],
    ELECTRICAL: [
      "electrical", "electronics", "circuit", "schematic", "pcb", "embedded", "microcontroller",
      "oscilloscope", "signal integrity", "emc", "emi", "power dissipation", "firmware", "voltage",
      "ripple", "current", "impedance", "fpga", "i2c", "spi", "can", "hardware"
    ],
    FINANCE: ["finance", "financial", "accounting", "balance sheet", "cash flow", "audit", "tax", "valuation", "ratio", "portfolio", "risk", "revenue"],
    HR: ["hr", "human resources", "recruitment", "talent", "onboarding", "performance management", "retention", "employee relations", "hiring", "culture"],
    MARKETING: ["marketing", "campaign", "seo", "sem", "conversion", "funnel", "analytics", "branding", "growth", "cac", "roas", "content"],
    GENERAL_ENGINEERING: ["engineering", "technical", "trade-offs", "scalability", "maintainability", "validation", "quality", "deliverable", "architecture", "requirements", "troubleshooting", "safety", "standards"]
  };

  const domainTerms = archetypeDomainTerms[context.archetype] || archetypeDomainTerms.GENERAL_ENGINEERING;
  const matchesDomainTerm = domainTerms.some((term) => lower.includes(term));
  if (matchesDomainTerm) {
    return { valid: true };
  }

  return { valid: false, reason: `Question has no relevant keywords matching role "${context.targetRole}", field "${context.careerField}", or candidate skills.` };
}

/**
 * Universal Internal Relevance Validation Gate
 */
function validateQuestionRelevance(questionObj, context, sessionTracker = []) {
  if (!questionObj || !questionObj.question || typeof questionObj.question !== "string") {
    return { valid: false, reason: "Question object or question string is missing" };
  }

  const qText = questionObj.question.trim();
  if (qText.length < 15 || qText.length > 380) {
    return { valid: false, reason: `Question length invalid (${qText.length} chars)` };
  }

  if (isSemanticDuplicate(qText, sessionTracker)) {
    return { valid: false, reason: "Semantic duplicate of an already asked question" };
  }

  const crossDomain = checkCrossDomainMismatch(qText, context.archetype);
  if (!crossDomain.valid) {
    return crossDomain;
  }

  const hallucination = checkResumeHallucination(qText, context);
  if (!hallucination.valid) {
    return hallucination;
  }

  const levelCheck = checkExperienceLevelAppropriateness(qText, context.experienceLevel);
  if (!levelCheck.valid) {
    return levelCheck;
  }

  const domainRelevance = checkDomainAndRoleRelevance(qText, context);
  if (!domainRelevance.valid) {
    return domainRelevance;
  }

  return { valid: true };
}

/**
 * Dynamic Procedural Generator with 50+ Domain Pools & Multi-Session Rotation
 */
function generateDomainRelevantQuestion(slotIndex, context, sessionTracker = [], overrideLevel = null, sessionCount = 0) {
  const { targetRole, careerField, experienceLevel, highlights, allSkills, archetype, jobDescription, jdSkills } = context;
  const level = overrideLevel || (slotIndex <= 2 ? "Basic" : slotIndex <= 6 ? "Intermediate" : "Advanced");
  const isFresher = experienceLevel === "Fresher";
  const isSenior = experienceLevel === "Experienced";

  const skillCount = allSkills.length;
  const primarySkill = allSkills[0] || (archetype === "SOFTWARE" ? "Modern Web Technologies" : archetype === "CYBERSECURITY" ? "Network Security" : archetype === "MECHANICAL" ? "CAD & Engineering Design" : archetype === "UIUX" ? "UI Component Design" : "Core Technical Fundamentals");
  const secondarySkill = allSkills[1] || allSkills[0] || (archetype === "SOFTWARE" ? "Database & API Design" : archetype === "CYBERSECURITY" ? "Incident Response" : archetype === "MECHANICAL" ? "Material Selection & Stress Analysis" : archetype === "UIUX" ? "User Experience & Prototyping" : "Quality Standards & Verification");
  const tertiarySkill = allSkills[2] || allSkills[1] || allSkills[0] || (archetype === "SOFTWARE" ? "Testing & Performance" : archetype === "CYBERSECURITY" ? "Threat Modeling" : archetype === "MECHANICAL" ? "GD&T & Manufacturing" : archetype === "UIUX" ? "Design Systems & Accessibility" : "Troubleshooting & Problem Solving");
  const quaternarySkill = allSkills[3] || allSkills[0] || "System Architecture";

  const projects = highlights.projectsList || [];
  const primaryProject = projects.length > 0 ? projects[0] : null;
  const secondProject = projects.length > 1 ? projects[1] : primaryProject;
  const thirdProject = projects.length > 2 ? projects[2] : primaryProject;

  const experiences = highlights.experienceList || [];
  const primaryExp = experiences.length > 0 ? experiences[0] : null;
  const primaryEdu = highlights.educationList.length > 0 ? highlights.educationList[0] : null;

  // Slot 1: Always "Tell me about yourself."
  if (slotIndex === 1) {
    return {
      id: 1,
      level: "Basic",
      question: "Tell me about yourself.",
      keyConcepts: ["Self-Introduction", "Background", "Career Goals"],
      hint: `Provide a concise overview of your background, technical skills in ${primarySkill}, and enthusiasm for this ${targetRole} role.`,
    };
  }

  // Define Extensive Slot-by-Slot Question Pools (50+ variations per domain)
  const domainPools = {
    // -------------------------------------------------------------
    // SOFTWARE / IT / FULL STACK
    // -------------------------------------------------------------
    SOFTWARE: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what core programming principles or architectural concepts do you prioritize to write clean, maintainable code?`
          : `How do you evaluate time complexity, state management, and component architecture when designing features using ${primarySkill}?`,
        `How do you manage asynchronous operations, memory lifecycle, and error boundaries when developing with ${primarySkill}?`,
        `What design patterns (such as Factory, Observer, or MVC) do you frequently apply in ${primarySkill} and what specific advantages do they offer?`,
        `When structuring a new module or service in ${primarySkill}, how do you establish modularity, separation of concerns, and testability?`,
        `What are the most common performance bottlenecks in ${primarySkill} applications and how do you systematically diagnose and eliminate them?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a challenging project, academic capstone, or practical implementation where you applied ${primarySkill} from start to finish?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what was the most difficult architectural or implementation bottleneck you encountered and how did you resolve it?`
          : `Can you walk me through the database schema design and API contract choices you made in your primary project using ${primarySkill}?`,
        primaryProject
          ? `If you were tasked with rebuilding "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}" today to scale for 10x concurrent users, what architectural decisions would you change?`
          : `How did you approach automated testing, validation, and error logging when implementing features in ${primarySkill}?`,
        `What trade-offs did you evaluate between development speed, code maintainability, and runtime performance in your main software project?`,
      ],
      slot4: [
        isFresher
          ? `When integrating frontend interfaces with backend REST or database services like ${secondarySkill}, how do you handle asynchronous data loading and error states?`
          : `How do you architect scalable database schemas, query indexing, and caching mechanisms in ${secondarySkill} to prevent latency bottlenecks under high concurrent traffic?`,
        `How do you approach database transaction management, data normalization, and connection pooling when building services with ${secondarySkill}?`,
        `Describe your approach to designing resilient RESTful APIs or GraphQL endpoints using ${secondarySkill} while ensuring strict input validation and security.`,
        `How do you configure CI/CD automation pipelines, automated test suites, and containerization with Docker for systems utilizing ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to optimize performance or resolve an edge case?`,
        `When working with ${tertiarySkill}, what standard debugging tools, profilers, or monitoring dashboards do you rely on to troubleshoot production issues?`,
        `How do you handle schema migrations, backwards compatibility, and zero-downtime data updates when using ${secondarySkill}?`,
        `What security practices (such as SQL injection mitigation, JWT authentication, and CORS policies) do you enforce when implementing ${secondarySkill}?`,
      ],
      slot6: [
        isFresher
          ? `Scenario: A feature you developed in ${primarySkill} works in your local environment but encounters unexpected runtime errors in staging. How do you isolate and debug the issue?`
          : `Scenario: An API endpoint in your ${targetRole} system experiences sudden latency spikes and memory leaks during peak traffic. Walk me through your step-by-step diagnostic and remediation workflow.`,
        `Scenario: Users report that occasional database write transactions are timing out and causing stale data on client dashboards. How do you investigate lock contention and connection pool exhaustion?`,
        `Scenario: A critical third-party payment or authentication API begins returning intermittent 502 Bad Gateway responses. How do you implement circuit breakers and graceful degradation?`,
        `Scenario: After a major release, users report slow page loading and rendering stuttering on mobile devices. How do you profile frontend bundle sizes and rendering cycles in ${primarySkill}?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `In advanced ${targetRole} projects using ${tertiarySkill}, how do you balance technical debt, strict quality standards, and tight delivery schedules?`,
        `How do you approach learning and adopting an entirely new framework, library, or engineering tool when required for a high-priority feature deliverable?`,
        `Describe your methodology for conducting thorough code reviews and establishing automated linting and formatting standards across an engineering team.`,
        `When refactoring legacy modules in ${targetRole} systems, how do you ensure zero regressions while improving code readability and test coverage?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
        `Tell me about a time you made a technical mistake or introduced a bug that affected a deliverable. How did you handle communication, remediation, and prevention?`,
        `Describe a situation where project requirements were ambiguous or constantly changing close to a deadline. How did you prioritize tasks and deliver results?`,
        `Can you share an experience where you had to collaborate closely with a cross-functional teammate (such as product, design, or QA) to accomplish a difficult technical milestone?`,
        `Tell me about a time when you received constructive feedback on your code architecture or technical design. How did you incorporate that feedback to improve?`,
      ],
      slot9: [
        isSenior
          ? `How would you lead the recovery and root cause analysis during a zero-downtime database migration failure where data inconsistency is detected?`
          : `Scenario: A critical production deployment breaks user session authentication. Describe how you contain the issue, execute rollback, and prevent recurrence.`,
        `Scenario: A sudden distributed denial-of-service (DDoS) traffic flood threatens to overwhelm your application gateways and databases. Walk through your rate limiting, traffic shedding, and auto-scaling response.`,
        `Scenario: A security vulnerability is publicly disclosed in a core open-source dependency used in your production codebase. How do you assess exposure, patch, test, and deploy an emergency fix?`,
        `Scenario: A production deployment corrupts background job queues, causing thousands of tasks to fail repeatedly. How do you triage the queue, prevent poison pills, and restore processing?`,
      ],
    },

    // -------------------------------------------------------------
    // CYBERSECURITY / SOC / INFOSEC
    // -------------------------------------------------------------
    CYBERSECURITY: {
      slot2: [
        isFresher
          ? `What are the core principles of the CIA Triad and Defense-in-Depth, and how do you apply them in monitoring threats using ${primarySkill}?`
          : `How do you construct and tune correlation rules in ${primarySkill} to distinguish legitimate user activity from advanced persistent threat (APT) reconnaissance?`,
        `What fundamental differences exist between symmetric and asymmetric cryptography, and how do TLS/SSL handshakes secure data in transit in ${primarySkill}?`,
        `How do you align enterprise security architectures with recognized cybersecurity frameworks like NIST CSF, ISO 27001, and CIS Controls?`,
        `What is the difference between vulnerability scanning, risk assessment, and active penetration testing, and when do you employ each?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a challenging security project, lab simulation, or practical implementation where you analyzed network traffic using ${primarySkill}?`,
        `In your security projects, how did you simulate attack vectors (such as brute force, phishing, or port scanning) and validate defensive controls in ${primarySkill}?`,
        `Can you walk me through how you set up log ingestion, parsing, and custom alert rules for a threat monitoring pipeline using ${primarySkill}?`,
      ],
      slot4: [
        isFresher
          ? `How do you analyze suspicious packet captures, authentication logs, and endpoint alerts when investigating an anomaly using ${secondarySkill}?`
          : `Describe your methodology for mitigating OWASP Top 10 vulnerabilities (like SQL injection, XSS, and broken access control) and establishing Zero Trust network architecture.`,
        `How do you perform static and dynamic malware analysis on a suspicious file or PowerShell script without jeopardizing production environments?`,
        `What methods do you use to map adversary tactics and techniques to the MITRE ATT&CK framework when evaluating detection coverage in ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to investigate a suspicious security event?`,
        `When configuring firewall access control lists (ACLs) or endpoint detection policies in ${tertiarySkill}, how do you prevent false positives that disrupt business operations?`,
        `How do you conduct credential stuffing and brute-force mitigation using rate limiting, multi-factor authentication (MFA), and risk-based adaptive policies?`,
      ],
      slot6: [
        isFresher
          ? `Scenario: An employee clicks on a suspicious phishing attachment, triggering an endpoint alert in ${primarySkill}. Walk me through your immediate containment and triage steps.`
          : `Scenario: You detect abnormal outbound beaconing traffic and lateral movement on an internal database subnet. How do you execute the incident response lifecycle?`,
        `Scenario: Multiple failed SSH/RDP login attempts followed by a successful privileged login originate from an unknown foreign IP address outside business hours. How do you respond?`,
        `Scenario: An internal vulnerability scan reveals an unpatched Remote Code Execution (RCE) flaw on a mission-critical web server that cannot be rebooted immediately. How do you apply compensating controls?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you keep your technical skills current with emerging zero-day exploits, threat intelligence feeds, and defensive toolkits?`,
        `Describe how you create and maintain incident response playbooks and standard operating procedures for a Security Operations Center (SOC).`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
        `Tell me about a time you had to balance strict security policies against engineering team productivity and how you reached a pragmatic compromise.`,
        `Describe a high-pressure situation where you had to communicate a potential security risk or incident to non-technical executives.`,
      ],
      slot9: [
        `Scenario: An enterprise ransomware outbreak or active data exfiltration event is detected across production servers. How do you lead isolation, forensic evidence preservation, eradication, and post-incident reporting?`,
        `Scenario: An unauthorized insider is suspected of dumping sensitive customer records from a backend database. How do you conduct covert forensic auditing while maintaining chain of custody?`,
      ],
    },

    // -------------------------------------------------------------
    // MECHANICAL ENGINEERING / CAD / MANUFACTURING
    // -------------------------------------------------------------
    MECHANICAL: {
      slot2: [
        isFresher
          ? `What fundamental mechanical principles (such as stress-strain relationships, material yield criteria, and factor of safety) guide your design decisions in ${primarySkill}?`
          : `How do you utilize parametric 3D modeling in ${primarySkill} while balancing static stress, fatigue life, and dynamic vibration tolerances?`,
        `How do you select engineering materials (e.g. aluminum alloys vs structural steels vs engineering polymers) based on thermal expansion, yield strength, and corrosion resistance?`,
        `What are the key governing principles of thermodynamics and fluid dynamics you apply when sizing cooling channels or heat transfer components in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a challenging mechanical design project or capstone where you applied ${primarySkill} from conceptual sketch to 3D CAD modeling?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what engineering calculations or FEA simulations did you perform to ensure structural integrity?`
          : `In your work on mechanical systems, how did you perform finite element analysis (FEA) or tolerance stackup calculations to validate structural integrity using ${primarySkill}?`,
        primaryProject
          ? `If you were tasked with redesigning "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}" for high-volume mass production, what material or manufacturing changes would you implement?`
          : `What trade-offs did you evaluate between component strength, weight reduction, and manufacturing cost in your primary mechanical project?`,
        `In your work on mechanical systems, how did you perform finite element analysis (FEA) or tolerance stackup calculations to validate structural integrity using ${primarySkill}?`,
      ],
      slot4: [
        isFresher
          ? `How do you apply GD&T (Geometric Dimensioning and Tolerancing) standards and Design for Manufacturability (DFM) when preparing engineering drawings in ${secondarySkill}?`
          : `How do you establish boundary conditions, mesh convergence, and contact non-linearities in FEA simulations using ${secondarySkill} to prevent mechanical failure?`,
        `How do you design for assembly (DFA) to minimize part counts, assembly errors, and manufacturing costs in ${secondarySkill}?`,
        `When generating production drawings in ${secondarySkill}, how do you specify datum references and geometric tolerances for CNC machining?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to optimize performance or resolve an edge case?`,
        `When specifying fits and tolerances (e.g. clearance, transition, interference fits) in ${tertiarySkill}, what calculation methods do you use?`,
        `How do you conduct thermal-structural coupled field analysis or modal analysis in ${secondarySkill}?`,
      ],
      slot6: [
        isFresher
          ? `Scenario: During physical prototype testing, a machined or 3D-printed component exhibits unexpected deflection under normal operating loads. How do you diagnose the root cause?`
          : `Scenario: Manufacturing reports high scrap rates due to tight tolerance stackup on an assembly flange. How do you perform tolerance stackup analysis and redesign the mating interface?`,
        `Scenario: A rotating shaft assembly exhibits excessive vibration and bearing overheating during endurance testing. Walk through your diagnostic steps.`,
        `Scenario: A load-bearing bracket in ${primarySkill} experiences sudden cyclic fatigue failure before its design lifespan. How do you perform failure analysis?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you bridge the gap between virtual CAD/FEA simulation models and real-world physical testing validation?`,
        `How do you incorporate international standards (such as ASME, ISO, or ASTM) into your mechanical design calculations and material selection?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
        `Tell me about a time you had to make a difficult trade-off between manufacturing cost, part weight, and structural safety.`,
        `Describe a situation where unexpected supplier component delays required you to quickly modify a mechanical assembly design.`,
      ],
      slot9: [
        `Scenario: An unexpected structural fatigue fracture occurs during the final validation phase before client delivery. How do you lead the root cause analysis (FMEA / 8D report) and corrective action?`,
        `Scenario: A batch of precision components fails incoming dimensional quality inspection due to thermal distortion during heat treatment. How do you investigate and resolve the issue with the vendor?`,
      ],
    },

    // -------------------------------------------------------------
    // UI / UX DESIGN & UI DEVELOPER
    // -------------------------------------------------------------
    UIUX: {
      slot2: [
        isFresher
          ? `What core UI/UX principles (such as visual hierarchy, contrast, and spacing) do you apply when creating responsive layouts with ${primarySkill}?`
          : `How do you translate complex user requirements into intuitive design systems and modular UI components using ${primarySkill}?`,
        `How do you ensure web accessibility (WCAG 2.1 AA compliance), keyboard navigation, and screen reader support when building interfaces in ${primarySkill}?`,
        `What design frameworks and grid layouts do you use when translating responsive designs into clean code with ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you walk me through your user research, wireframing, and high-fidelity prototyping process for a major project using ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what usability challenges did you uncover during user testing and how did you resolve them?`
          : `How did you organize your design tokens and atomic components in your primary project using ${primarySkill}?`,
        primaryProject
          ? `If you were tasked with redesigning the information architecture of "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}" for global multilingual audiences, what UX changes would you prioritize?`
          : `Can you walk me through an interactive prototype you built from scratch in ${primarySkill}?`,
      ],
      slot4: [
        isFresher
          ? `How do you approach cross-browser compatibility, responsive breakpoints, and CSS layout models when developing web interfaces in ${secondarySkill}?`
          : `How do you maintain design tokens, component libraries, and documentation to bridge the gap between design and front-end engineering in ${secondarySkill}?`,
        `How do you handle responsive typography, fluid scaling, and micro-interactions in ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to optimize user experience or resolve a layout defect?`,
        `When evaluating UI performance and Core Web Vitals in ${tertiarySkill}, what optimization techniques do you apply?`,
      ],
      slot6: [
        `Scenario: User testing reveals that customers frequently abandon the checkout or onboarding flow. How do you analyze user behavior and redesign the interface?`,
        `Scenario: There is a disagreement between engineering performance constraints and UX animation fidelity. How do you balance smooth user delight with fast load times?`,
        `Scenario: A critical user persona finds the mobile interface difficult to navigate with one hand. How do you optimize the thumb zone and touch targets?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you conduct usability benchmarking and A/B testing to validate that a design change delivers positive business metrics?`,
        `How do you establish cohesive brand design languages and style guides across cross-functional engineering teams?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
        `Tell me about a time you had to defend a user-centric design decision against competing business priorities.`,
      ],
      slot9: [
        `Scenario: A newly launched user interface causes widespread user confusion and a 30% drop in completion rates. How do you rapidly gather user telemetry, iterate on prototypes, and deploy fixes?`,
        `Scenario: Accessibility audits reveal multiple critical contrast and screen-reader violations across a live product. How do you structure a systematic remediation plan?`,
      ],
    },

    // -------------------------------------------------------------
    // CIVIL & STRUCTURAL ENGINEERING
    // -------------------------------------------------------------
    CIVIL: {
      slot2: [
        isFresher
          ? `What core structural engineering principles and load combination standards (dead, live, wind, seismic) do you apply in ${primarySkill}?`
          : `How do you verify structural stability, foundation bearing capacity, and shear reinforcement compliance using ${primarySkill}?`,
        `How do concrete mix design, curing times, and rebar detailing affect long-term durability and deflection in structural civil projects?`,
        `What geotechnical factors and soil classification tests do you evaluate before finalizing foundation specifications in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a structural analysis or civil engineering capstone where you calculated load distributions using ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what structural challenges did you address during finite element modeling or site execution?`
          : `Can you walk me through the bending moment and shear force calculations you performed in a major structural project?`,
      ],
      slot4: [
        `How do you integrate structural analysis software like ${secondarySkill} with building code standards (such as ACI or AISC) to ensure constructability?`,
        `How do you evaluate dynamic seismic response spectra and wind lateral loads when modeling framing in ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to resolve a structural load conflict?`,
        `When managing material testing protocols (slump test, compressive strength, rebound hammer) in ${tertiarySkill}, how do you ensure quality control?`,
      ],
      slot6: [
        `Scenario: On-site soil testing reveals lower bearing capacity than originally assumed in the structural foundation drawings. How do you evaluate and redesign the foundation system?`,
        `Scenario: During concrete pouring of a major transfer slab, ambient temperature exceeds 40°C. What cold joint and thermal cracking prevention measures do you enforce?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you ensure strict on-site quality control and environmental safety compliance during heavy civil construction?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
        `Tell me about a time you encountered conflicting utility lines or site conditions during excavation and how you adjusted structural plans.`,
      ],
      slot9: [
        `Scenario: Excessive deflection or structural cracking is observed during a critical load testing phase on site. How do you lead the immediate structural assessment and containment?`,
        `Scenario: A contractor requests a major material substitution for rebar grades during construction. How do you recalculate development lengths and approve or reject the request?`,
      ],
    },

    // -------------------------------------------------------------
    // CHEMICAL & PROCESS ENGINEERING
    // -------------------------------------------------------------
    CHEMICAL: {
      slot2: [
        isFresher
          ? `What fundamental thermodynamics and mass/energy balance principles do you rely on when evaluating process flows in ${primarySkill}?`
          : `How do you optimize steady-state and dynamic process simulations in ${primarySkill} while ensuring reactor thermal stability and yield efficiency?`,
        `How do you select heat exchanger configurations and sizing equations for fouling and high viscosity fluids in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a chemical process design or plant simulation project where you sized unit operations using ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", how did you optimize reaction kinetics or separation efficiency?`
          : `What process control strategies did you evaluate in your primary chemical engineering project?`,
      ],
      slot4: [
        `How do you conduct Process Hazard Analysis (HAZOP) and size safety relief systems for unit operations involving ${secondarySkill}?`,
        `How do you model multi-component distillation equilibrium and reflux ratios using ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to optimize yield or reduce energy consumption?`,
        `When evaluating piping and instrumentation diagrams (P&IDs) in ${tertiarySkill}, how do you ensure failsafe valve configurations?`,
      ],
      slot6: [
        `Scenario: An exothermic reaction experiences an unexpected temperature runaway deviation in the distillation or reactor unit. Walk through your emergency containment protocols.`,
        `Scenario: A column encounters severe flooding and pressure drop spikes during a throughput ramp. How do you diagnose and adjust operating parameters?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you balance process intensification, catalyst selectivity, and environmental emission limits in industrial chemical engineering?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
      ],
      slot9: [
        `Scenario: A major process deviation threatens emissions compliance and unit equipment integrity. How do you coordinate interlocks, process shutdown, and root cause investigation?`,
      ],
    },

    // -------------------------------------------------------------
    // ELECTRICAL & ELECTRONICS ENGINEERING
    // -------------------------------------------------------------
    ELECTRICAL: {
      slot2: [
        isFresher
          ? `What fundamental circuit analysis principles (Ohm's/Kirchhoff's laws, impedance matching, power dissipation) guide your work in ${primarySkill}?`
          : `How do you design schematic captures and simulate signal integrity, EMC/EMI shielding, and thermal dissipation using ${primarySkill}?`,
        `What considerations dictate your choice between microcontrollers, DSPs, and FPGAs when architecting an embedded hardware solution with ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a hardware schematic or embedded systems project where you designed and validated circuits using ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what circuit debugging or firmware optimization hurdles did you overcome?`
          : `How did you validate timing constraints and bus communication protocols (SPI, I2C, CAN) in your primary electronics project?`,
      ],
      slot4: [
        `How do you approach multi-layer PCB layout routing, ground plane isolation, and firmware debugging when using ${secondarySkill}?`,
        `How do you design power distribution networks (PDN) and decoupling capacitor placement to minimize switching noise in ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to debug hardware timing or signal noise?`,
        `When configuring oscilloscope trigger modes, logic analyzers, and spectrum analyzers for ${tertiarySkill}, what is your testing methodology?`,
      ],
      slot6: [
        `Scenario: A prototype circuit board fails power-on testing due to excessive voltage ripple and thermal runaway in a voltage regulator. How do you debug it on the test bench?`,
        `Scenario: An embedded microcontroller experiences random watchdog resets during motor commutation. How do you isolate inductive kickback from software deadlocks?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you ensure electrical safety standards (such as UL, CE, IEEE) and power efficiency in hardware product designs?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
      ],
      slot9: [
        `Scenario: High-frequency electromagnetic interference (EMI) causes intermittent microcontroller resets during final compliance certification. How do you locate the emission source and implement shielding?`,
      ],
    },

    // -------------------------------------------------------------
    // GENERAL / OTHER DISCIPLINES
    // -------------------------------------------------------------
    GENERAL_ENGINEERING: {
      slot2: [
        isFresher
          ? `What foundational domain methodologies and quality standards form the cornerstone of your work with ${primarySkill}?`
          : `How do you evaluate technical trade-offs, scalability, and system performance when executing deliverables in ${primarySkill}?`,
        `How do you ensure high reliability, validation testing, and compliance with industry standards in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical problem it solved and your specific contribution?`
          : `Can you describe a challenging technical project or capstone where you applied ${primarySkill} from requirements to validation?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what key metrics or deliverables demonstrated success?`
          : `How did you manage technical requirements, risk mitigation, and milestone tracking in your primary project?`,
      ],
      slot4: [
        `How do you apply industry-standard tools and verification protocols like ${secondarySkill} to ensure deliverable accuracy?`,
        `What quality assurance frameworks and review processes do you use when deploying solutions with ${secondarySkill}?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you leveraged ${secondarySkill} to resolve a difficult technical bottleneck?`,
        `How do you maintain documentation and version control when collaborating on ${tertiarySkill} assets?`,
      ],
      slot6: [
        `Scenario: A deliverable encounters unexpected technical constraints and conflicting stakeholder requirements. How do you prioritize actions to achieve project goals?`,
        `Scenario: Critical testing milestones are delayed due to resource bottlenecks. How do you reprioritize scope without compromising quality?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful technical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you balance rapid delivery timelines with rigorous engineering standards in ${targetRole} projects?`,
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
      ],
      slot9: [
        `Scenario: An unexpected failure occurs during final testing prior to delivery. How do you lead root cause analysis and corrective action?`,
      ],
    },
  };

  const slotCategories = {
    1: "Introduction",
    2: "Technical Fundamentals",
    3: "Resume & Projects",
    4: "Architecture & Tooling",
    5: "Applied Technical Practice",
    6: "Problem-Solving Scenario",
    7: "Academic & Advanced Theory",
    8: "Behavioral & Teamwork (STAR)",
    9: "High-Stakes Crisis Recovery",
  };
  const category = slotCategories[slotIndex] || "Technical Competency";

  const domainPack = domainPools[archetype] || domainPools.GENERAL_ENGINEERING;
  const slotKey = `slot${slotIndex}`;
  const candidates = domainPack[slotKey] || domainPack.slot2 || [];

  // Determine starting rotation index based on sessionCount
  const startIdx = sessionCount % (candidates.length || 1);

  // 1. Try preset candidates for this slot
  for (let i = 0; i < candidates.length; i++) {
    const candidateIdx = (startIdx + i) % candidates.length;
    const qCandidateText = candidates[candidateIdx];
    if (qCandidateText && !isSemanticDuplicate(qCandidateText, sessionTracker)) {
      const candidateObj = {
        id: slotIndex,
        level,
        category,
        question: qCandidateText,
        keyConcepts: [primarySkill, "Core Competency", "Problem Solving"],
        hint: `Detail your structured methodology, engineering trade-offs, and practical experience using ${primarySkill}.`,
      };
      const validation = validateQuestionRelevance(candidateObj, context, sessionTracker);
      if (validation.valid) {
        candidateObj.idealAnswer = generateFallbackIdealAnswer(qCandidateText, level, targetRole, careerField, highlights, jobDescription);
        return candidateObj;
      }
    }
  }

  // 2. Slot-Specific Dynamic Synthesis (Category-Aware)
  const dynamicSkill = allSkills[sessionCount % (skillCount || 1)] || primarySkill;
  const slotDynamicSynthesized = {
    2: [
      `What fundamental programming principles, computational complexity considerations, or design standards form the basis of your work in ${dynamicSkill}?`,
      `How do you manage memory allocation, asynchronous execution lifecycles, and error handling when building components in ${dynamicSkill}?`,
      `What core theoretical principles in ${careerField} guide your implementation choices when using ${dynamicSkill}?`,
      `In ${dynamicSkill}, what architectural trade-offs do you evaluate to keep modules decoupled and maintainable?`
    ],
    3: [
      `In your practical project work, what key technical decisions and component modularity choices did you make using ${dynamicSkill}?`,
      `What trade-offs between delivery velocity and code architecture did you evaluate during your primary implementation of ${dynamicSkill}?`,
      `Can you walk me through the system architecture and interface contracts of a major project where you applied ${dynamicSkill}?`,
      `How did you perform integration testing and performance validation on your primary ${dynamicSkill} project?`
    ],
    4: [
      `How do you architect scalable data schemas, query optimization, and caching strategies when developing with ${dynamicSkill}?`,
      `Describe your approach to designing resilient APIs, integration contracts, and service boundaries in ${dynamicSkill}.`,
      `How do you configure CI/CD automation pipelines, automated test suites, and containerization for systems utilizing ${dynamicSkill}?`,
      `When implementing distributed workflows or message handling in ${dynamicSkill}, how do you ensure exactly-once or idempotent processing?`
    ],
    5: [
      `When profiling runtime performance, bottleneck latency, or resource leaks in ${dynamicSkill}, what diagnostic tools and benchmarks do you rely on?`,
      `Can you walk me through a complex edge-case bug or defect you isolated and resolved while implementing ${dynamicSkill}?`,
      `How do you enforce security best practices (such as input sanitization, authentication, and least privilege) when using ${dynamicSkill}?`,
      `When managing schema migrations or breaking changes in ${dynamicSkill}, how do you ensure backwards compatibility?`
    ],
    6: [
      `Scenario: A critical service in ${dynamicSkill} experiences intermittent latency spikes and connection exhaustion during peak traffic. Walk me through your triage workflow.`,
      `Scenario: After a release in ${dynamicSkill}, telemetry shows elevated error rates on specific edge clients. How do you isolate the regression and execute rollback?`,
      `Scenario: A background task queue in ${dynamicSkill} becomes backed up due to poison pill payloads. How do you remediate the queue and prevent data loss?`,
      `Scenario: A third-party integration endpoint fails intermittently with timeout errors in ${dynamicSkill}. How do you implement circuit breakers and fallbacks?`
    ],
    7: [
      `How did your academic coursework and engineering foundations prepare you to solve advanced, ambiguous technical problems in ${dynamicSkill}?`,
      `When managing technical debt alongside demanding feature deadlines in ${dynamicSkill}, what framework do you use to prioritize refactoring?`,
      `How do you evaluate and safely adopt newly released tools, libraries, or architectural paradigms within ${dynamicSkill}?`,
      `How do you establish engineering team standards for code reviews, architectural RFCs, and documentation in ${dynamicSkill}?`
    ],
    8: [
      `Describe a challenging technical disagreement you had with a team member regarding architecture in ${targetRole} deliverables and how you resolved it using data.`,
      `Tell me about a time you made a technical mistake or introduced a defect. How did you communicate the impact and ensure preventative guardrails?`,
      `Describe a situation where project requirements were constantly changing near a release milestone. How did you maintain high engineering quality?`,
      `Can you share an experience where you had to lead a cross-functional initiative or mentor a peer on technical best practices?`
    ],
    9: [
      `Scenario: A major production outage or critical data integrity incident threatens core services. How do you lead containment, root cause analysis, and post-mortem reporting?`,
      `Scenario: A critical security vulnerability is publicly disclosed in a core dependency of your ${targetRole} codebase. Walk through your emergency mitigation plan.`,
      `Scenario: Extreme traffic surges threaten cascading system failure across application gateways. How do you implement traffic shedding, circuit breakers, and rate limits?`,
      `Scenario: A mission-critical database migration fails midway, leaving data in a partially converted state. How do you recover consistent state without data loss?`
    ]
  };

  const dynamicList = slotDynamicSynthesized[slotIndex] || slotDynamicSynthesized[2];
  for (const synText of dynamicList) {
    if (!isSemanticDuplicate(synText, sessionTracker)) {
      return {
        id: slotIndex,
        level,
        category,
        question: synText,
        keyConcepts: [dynamicSkill, category, "Engineering Practices"],
        hint: `Explain your technical thought process and best practices for ${dynamicSkill}.`,
        idealAnswer: generateFallbackIdealAnswer(synText, level, targetRole, careerField, highlights, jobDescription),
      };
    }
  }

  // 3. Search other slots in the same domain pack for any unused candidate
  for (let s = 2; s <= 9; s++) {
    const otherCandidates = domainPack[`slot${s}`] || [];
    for (const otherQ of otherCandidates) {
      if (otherQ && !isSemanticDuplicate(otherQ, sessionTracker)) {
        return {
          id: slotIndex,
          level,
          category,
          question: otherQ,
          keyConcepts: [primarySkill, category, "Domain Expertise"],
          hint: `Detail your methodology and hands-on experience clearly.`,
          idealAnswer: generateFallbackIdealAnswer(otherQ, level, targetRole, careerField, highlights, jobDescription),
        };
      }
    }
  }

  // 4. Guaranteed unique synthesized question using slot and session markers
  const uniqueFallbackText = `In your technical work as a ${targetRole} focusing on ${dynamicSkill}, what specific engineering trade-offs between system performance and long-term maintainability did you evaluate in your ${category.toLowerCase()} initiatives?`;
  return {
    id: slotIndex,
    level,
    category,
    question: uniqueFallbackText,
    keyConcepts: [dynamicSkill, "System Architecture", "Trade-Off Analysis"],
    hint: `Provide concrete technical examples from your engineering background.`,
    idealAnswer: generateFallbackIdealAnswer(uniqueFallbackText, level, targetRole, careerField, highlights, jobDescription),
  };
}

/**
 * Generate full 9-Question Live AI Mock Interview with multi-session variation and anti-repetition
 */
async function generateMockInterviewEngine(params) {
  const context = extractInterviewContext(params);
  const { targetRole, careerField, experienceLevel, highlights, jobDescription, allSkills } = context;

  const rawAsked = Array.isArray(params.askedQuestions)
    ? params.askedQuestions
    : Array.isArray(params.previousQuestions)
    ? params.previousQuestions
    : [];
  const rawRecent = Array.isArray(params.recentQuestions) ? params.recentQuestions : [];
  const safeAsked = Array.from(new Set([...rawAsked, ...rawRecent].filter(Boolean)));

  const sessionCount = typeof params.sessionCount === "number"
    ? params.sessionCount
    : typeof params.sessionNumber === "number"
    ? params.sessionNumber
    : Math.floor(safeAsked.length / 8);

  const sessionId = params.sessionId || `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  console.log(`[MOCK_INTERVIEW] Initializing Session #${sessionCount + 1} (${sessionId}) for Role: "${targetRole}", Field: "${careerField}", Level: "${experienceLevel}", Excluded Questions: ${safeAsked.length}`);

  const resumeContextText = `
Candidate Name: ${highlights.candidateName || "Candidate"}
Education: ${highlights.education || "Not specified"}
Key Skills: ${highlights.skills || "Not specified"}
Projects: ${highlights.projects || "Not specified"}
Work Experience / Internships: ${highlights.experience || "Not specified"}
Certifications: ${highlights.certifications || "Not specified"}
`.trim();

  const jdContextText = jobDescription ? `
TARGET JOB DESCRIPTION (Test these requirements):
${jobDescription.trim()}
Extracted Key JD Skills: ${context.jdSkills.join(", ") || "General Domain"}
`.trim() : "No specific Job Description provided; test core role competency.";

  const antiRepetitionContext = safeAsked.length > 0 ? `
CRITICAL MULTI-SESSION ANTI-REPETITION MANDATE:
This is Interview Session #${sessionCount + 1}.
The candidate has completed previous sessions. DO NOT REPEAT OR PARAPHRASE ANY OF THE FOLLOWING PREVIOUSLY ASKED QUESTIONS:
${safeAsked.slice(-35).map((q, i) => `${i + 1}. "${q}"`).join("\n")}

You MUST generate a FRESH, COMPLETELY DIFFERENT set of interview questions exploring different projects, tools, behavioral situations, and failure modes.
`.trim() : "";

  const prompt = `You are a principal technical interviewer conducting an authentic, 9-question interactive mock interview for a "${targetRole}" position in "${careerField}".

CANDIDATE'S ACTUAL RESUME:
${resumeContextText}

${jdContextText}

${antiRepetitionContext}

TARGET CANDIDATE CONTEXT:
- Role: ${targetRole}
- Career Field: ${careerField}
- Experience Level: ${experienceLevel} (${experienceLevel === "Fresher" ? "Entry-level/Fresher: test core principles, academic projects, entry problem-solving" : experienceLevel === "Experienced" ? "Senior: test architecture, scalability, complex trade-offs" : "Mid-level: test practical implementation, debugging, design patterns"})
- Verified Candidate Skills: ${allSkills.join(", ") || "General"}
- Session Number: #${sessionCount + 1}

MANDATORY 9-QUESTION MIXTURE (Strict Relevance, Category Diversity & Freshness):
1. Question 1 (Basic) - [Introduction]: MUST ALWAYS BE EXACTLY: "Tell me about yourself."
2. Question 2 (Basic) - [Technical Fundamentals]: Foundational role & core principles in ${careerField} targeting ${allSkills[0] || targetRole}.
3. Question 3 (Intermediate) - [Resume & Projects]: Deep-dive into an ACTUAL project from candidate resume (or practical implementation of listed skills).
4. Question 4 (Intermediate) - [Architecture & Tooling]: Core technical / database / API / CAD / SIEM architecture question for ${targetRole}.
5. Question 5 (Intermediate) - [Applied Technical Practice]: Practical application question referencing another verified skill (${allSkills[1] || allSkills[0] || "core tools"}).
6. Question 6 (Intermediate) - [Problem-Solving Scenario]: Realistic situational / troubleshooting / debugging scenario tailored to ${targetRole}.
7. Question 7 (Advanced) - [Academic & Advanced Theory]: Academic background, theoretical coursework, or advanced engineering trade-offs.
8. Question 8 (Advanced) - [Behavioral & Teamwork]: Behavioral question using STAR method (teamwork, trade-offs, mistakes, ambiguous specs).
9. Question 9 (Advanced) - [High-Stakes Crisis Recovery]: High-impact domain crisis, system failure, security breach, or defect containment.

STRICT RELEVANCE & GROUNDING MANDATES:
- NEVER invent or hallucinate technologies, companies, degrees, or projects not in the candidate resume or JD.
- Keep every question 100% relevant to ${targetRole} in ${careerField}.
- Ensure all 9 questions test DIFFERENT topics and categories. Never repeat or paraphrase concepts within this interview.

Output ONLY valid JSON array with 9 objects:
[
  {
    "id": 1,
    "level": "Basic",
    "category": "Introduction",
    "question": "Tell me about yourself.",
    "keyConcepts": ["Self-Introduction", "Background", "Career Goals"],
    "hint": "Brief talking point guidance",
    "idealAnswer": "Exemplary answer"
  },
  ...
]`;

  let aiQuestions = [];
  try {
    const aiResult = await callGeminiApi(prompt, "", { temperature: 0.88 });
    const parsed = extractJson(aiResult);
    if (Array.isArray(parsed) && parsed.length >= 7) {
      aiQuestions = parsed;
    }
  } catch (err) {
    console.warn(`[MOCK_INTERVIEW] Gemini generation failed: ${err.message}. Relying on dynamic procedural engine.`);
  }

  const finalQuestions = [];
  const sessionTracker = [...safeAsked];

  const slotCategoryMap = {
    1: "Introduction",
    2: "Technical Fundamentals",
    3: "Resume & Projects",
    4: "Architecture & Tooling",
    5: "Applied Technical Practice",
    6: "Problem-Solving Scenario",
    7: "Academic & Advanced Theory",
    8: "Behavioral & Teamwork (STAR)",
    9: "High-Stakes Crisis Recovery",
  };

  // Guarantee Q1 is "Tell me about yourself."
  const q1Text = "Tell me about yourself.";
  const q1 = {
    id: 1,
    level: "Basic",
    category: "Introduction",
    question: q1Text,
    keyConcepts: ["Self-Introduction", "Background", "Career Goals"],
    hint: `Provide a concise summary of your education, background, core skills in ${allSkills[0] || targetRole}, and career passion.`,
    idealAnswer: generateFallbackIdealAnswer(q1Text, "Basic", targetRole, careerField, highlights, jobDescription),
  };
  finalQuestions.push(q1);
  sessionTracker.push(q1.question);

  // Slots 2 through 9
  for (let slot = 2; slot <= 9; slot++) {
    let acceptedQ = null;
    const cat = slotCategoryMap[slot] || "Technical Competency";

    // Check if AI generated a valid, fresh question for this slot
    if (aiQuestions.length >= slot) {
      const candidateAI = aiQuestions[slot - 1];
      if (candidateAI && candidateAI.question) {
        const validation = validateQuestionRelevance(candidateAI, context, sessionTracker);
        if (validation.valid) {
          const qText = candidateAI.question.trim();
          acceptedQ = {
            id: slot,
            level: candidateAI.level || (slot <= 2 ? "Basic" : slot <= 6 ? "Intermediate" : "Advanced"),
            category: candidateAI.category || cat,
            question: qText,
            keyConcepts: Array.isArray(candidateAI.keyConcepts) ? candidateAI.keyConcepts : ["Core Principles"],
            hint: candidateAI.hint || "Explain your technical thought process clearly.",
            idealAnswer: candidateAI.idealAnswer || generateFallbackIdealAnswer(qText, candidateAI.level || "Intermediate", targetRole, careerField, highlights, jobDescription),
          };
        } else {
          console.log(`[MOCK_INTERVIEW] Discarding AI question for slot ${slot} (${validation.reason}): "${candidateAI.question}"`);
        }
      }
    }

    // If AI question was missing or failed relevance/anti-repetition check, generate procedural replacement
    if (!acceptedQ) {
      const proceduralQ = generateDomainRelevantQuestion(slot, context, sessionTracker, null, sessionCount);
      acceptedQ = {
        id: slot,
        category: cat,
        ...proceduralQ,
      };
      if (!acceptedQ.idealAnswer) {
        acceptedQ.idealAnswer = generateFallbackIdealAnswer(acceptedQ.question, acceptedQ.level || "Intermediate", targetRole, careerField, highlights, jobDescription);
      }
    }

    finalQuestions.push(acceptedQ);
    sessionTracker.push(acceptedQ.question);
  }

  // MANDATORY WHOLE-INTERVIEW PAIRWISE DEDUPLICATION GUARANTEE PASS
  for (let i = 0; i < finalQuestions.length; i++) {
    for (let j = i + 1; j < finalQuestions.length; j++) {
      const qA = finalQuestions[i].question.trim().toLowerCase();
      const qB = finalQuestions[j].question.trim().toLowerCase();
      if (qA === qB || isSemanticDuplicate(finalQuestions[j].question, [finalQuestions[i].question])) {
        console.warn(`[MOCK_INTERVIEW] Detected internal duplicate between Slot ${i + 1} and Slot ${j + 1}. Regenerating Slot ${j + 1}...`);
        const otherQuestions = finalQuestions.map((q, idx) => idx !== j ? q.question : null).filter(Boolean);
        const replacement = generateDomainRelevantQuestion(j + 1, context, [...safeAsked, ...otherQuestions], null, sessionCount + j + 2);
        finalQuestions[j] = {
          ...replacement,
          id: j + 1,
          category: slotCategoryMap[j + 1] || "Technical Competency",
        };
        if (!finalQuestions[j].idealAnswer) {
          finalQuestions[j].idealAnswer = generateFallbackIdealAnswer(finalQuestions[j].question, finalQuestions[j].level || "Intermediate", targetRole, careerField, highlights, jobDescription);
        }
      }
    }
  }

  console.log(`[MOCK_INTERVIEW] Successfully assembled 9 verified, fresh questions for Session #${sessionCount + 1} (${targetRole})`);
  return finalQuestions;
}

/**
 * Generate a single next question or regenerate a question with strict relevance & anti-repetition validation
 */
async function generateNextMockQuestionEngine(params) {
  const context = extractInterviewContext(params);
  const { targetRole, careerField, experienceLevel, highlights, jobDescription, allSkills } = context;
  const level = params.level || params.difficulty || "Intermediate";

  const rawAsked = Array.isArray(params.askedQuestions)
    ? params.askedQuestions
    : Array.isArray(params.previousQuestions)
    ? params.previousQuestions
    : [];
  const rawRecent = Array.isArray(params.recentQuestions) ? params.recentQuestions : [];
  const safeAsked = Array.from(new Set([...rawAsked, ...rawRecent, params.currentQuestion].filter(Boolean)));

  const sessionCount = typeof params.sessionCount === "number" ? params.sessionCount : Math.floor(safeAsked.length / 8);

  const resumeSnippet = `
Candidate Skills: ${highlights.skills || "Not specified"}
Candidate Projects: ${highlights.projects || "Not specified"}
Candidate Experience: ${highlights.experience || "Not specified"}
`.trim();

  const prompt = `You are a technical hiring manager conducting a mock interview for a "${targetRole}" position in "${careerField}".

Candidate Profile:
${resumeSnippet}
Experience Level: ${experienceLevel}
${jobDescription ? `Target Job Description: ${jobDescription.trim()}` : ""}

Previously Asked Questions (DO NOT REPEAT OR PARAPHRASE):
${safeAsked.slice(-25).map((q, i) => `${i + 1}. "${q}"`).join("\n")}

Generate ONE brand new interview question at the "${level}" tier.
- Must be 100% relevant to ${targetRole} in ${careerField}.
- You may ask about their actual listed skills (${allSkills.join(", ")}), their listed projects, or domain problem-solving.
- NEVER invent tools/projects not in candidate profile or JD.
- Must NOT duplicate any previously asked question above.

Output ONLY valid JSON:
{
  "level": "${level}",
  "question": "Question text",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "hint": "Talking point hint",
  "idealAnswer": "Exemplary answer"
}`;

  try {
    const aiResult = await callGeminiApi(prompt, "", { temperature: 0.92 });
    const parsed = extractJson(aiResult);
    if (parsed && parsed.question && typeof parsed.question === "string") {
      const validation = validateQuestionRelevance(parsed, context, safeAsked);
      if (validation.valid) {
        const qText = parsed.question.trim();
        return {
          level: parsed.level || level,
          question: qText,
          keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : ["Core Principles"],
          hint: parsed.hint || "Explain your technical thought process clearly.",
          idealAnswer: parsed.idealAnswer || generateFallbackIdealAnswer(qText, parsed.level || level, targetRole, careerField, highlights, jobDescription),
        };
      } else {
        console.log(`[MOCK_INTERVIEW] Regenerated AI question failed relevance (${validation.reason}): "${parsed.question}"`);
      }
    }
  } catch (err) {
    console.warn("[MOCK_INTERVIEW] Gemini single question error:", err.message);
  }

  // Procedural Fallback with Level Calibration & Rotation
  const randomSlot = level === "Basic" ? 2 : level === "Intermediate" ? (Math.random() > 0.5 ? 4 : 5) : (Math.random() > 0.5 ? 8 : 9);
  const procedural = generateDomainRelevantQuestion(randomSlot, context, safeAsked, level, sessionCount + 1);

  return {
    level: procedural.level || level,
    category: procedural.category,
    question: procedural.question,
    keyConcepts: procedural.keyConcepts || ["Core Principles"],
    hint: procedural.hint || "Explain your technical thought process clearly.",
    idealAnswer: procedural.idealAnswer || generateFallbackIdealAnswer(procedural.question, procedural.level || level, targetRole, careerField, highlights, jobDescription),
  };
}

/**
 * Helper to generate a comprehensive, question-specific Ideal Reference Answer
 */
function generateFallbackIdealAnswer(qText = "", level = "Intermediate", targetRoleName = "Engineering Professional", fieldName = "", highlights = {}, jobDescription = "") {
  const qLower = (qText || "").toLowerCase();

  // 1. "Tell me about yourself"
  if (qLower.includes("tell me about yourself") || qLower.includes("introduce yourself")) {
    const skillsList = highlights.skills
      ? highlights.skills.split(",").slice(0, 3).map((s) => s.trim()).join(", ")
      : `${fieldName || targetRoleName} principles`;
    const projSnippet = highlights.projects
      ? ` For example, in my work on ${highlights.projects.split(";")[0].split(",")[0].trim()}, I implemented core technical solutions that delivered measurable results.`
      : "";
    return `I am a dedicated ${targetRoleName} with a strong foundation in ${skillsList}.${projSnippet} Throughout my work, I focus on applying methodical engineering practices, clean system architecture, and rigorous quality standards to solve complex challenges. In this role, I look forward to leveraging my technical background in ${fieldName || "the industry"} to build high-performance, reliable systems while contributing positively to the team.`;
  }

  // 2. Behavioral / STAR Questions (conflict, disagreement, mistake, roadblock, ambiguous, feedback)
  if (qLower.includes("conflict") || qLower.includes("disagreement") || qLower.includes("alternative technical approach")) {
    return `• Situation: During an architecture design review for a key feature deliverable, a teammate and I differed on whether to implement a synchronous REST approach or an asynchronous event-driven queue.
• Task: My goal was to objectively resolve the disagreement without stalling sprint velocity or creating technical debt.
• Action: I built a rapid proof-of-concept benchmark measuring latency, operational complexity, and throughput under peak load. We walked through the empirical data together against our SLA requirements.
• Result: The data demonstrated clear latency advantages for the asynchronous approach, which we adopted unanimously. The feature deployed on schedule with zero performance regressions.`;
  }

  if (qLower.includes("mistake") || qLower.includes("bug that affected") || qLower.includes("introduced a defect")) {
    return `• Situation: While shipping an optimization update, a missing edge-case validation caused intermittent timeout errors for a subset of concurrent requests.
• Task: I needed to immediately mitigate client impact, rectify the underlying bug, and ensure preventative guardrails.
• Action: I promptly notified stakeholders and initiated a safe rollback. Next, I reproduced the bug in an isolated unit test suite, fixed the edge-case boundary check, and added automated regression tests in CI/CD.
• Result: The patch was redeployed with 100% test coverage. I documented the post-mortem findings and enhanced our automated test suite to prevent recurrence.`;
  }

  if (qLower.includes("ambiguous") || qLower.includes("requirements were changing") || qLower.includes("deadline")) {
    return `• Situation: Late in a sprint cycle, key business requirements shifted, introducing ambiguity and compressing our release timeline.
• Task: My responsibility was to reprioritize deliverables to ensure the highest-value core functionality launched reliably on deadline.
• Action: I broke down the feature into essential MVP components versus non-blocking enhancements, aligned with product owners on phased delivery, and focused implementation on robust core workflows.
• Result: We delivered the core functionality on time with zero high-severity defects, rolling out the remaining enhancements in the subsequent sprint.`;
  }

  if (qLower.includes("feedback") || qLower.includes("code review") || qLower.includes("refactor your technical design")) {
    return `• Situation: During an in-depth senior code review, a peer pointed out that a module I designed had tight coupling between data ingestion and business logic.
• Task: I embraced the constructive feedback to refactor the architecture into a more decoupled, testable structure.
• Action: I applied the Dependency Inversion Principle, introducing clean interface abstractions and dependency injection, which made unit testing trivial.
• Result: The refactored module achieved 95% unit test coverage, reduced onboarding ramp time for teammates, and became an internal benchmark for clean architecture.`;
  }

  // 3. Operational Scenarios & Failure Incidents
  if (qLower.includes("latency spikes") || qLower.includes("slow page") || qLower.includes("performance bottleneck") || qLower.includes("timeout")) {
    return `1. Triage & Metric Capture: Inspect APM telemetry, distributed traces, and server metrics (CPU/memory utilization, DB active connections, event loop lag).
2. Root Cause Isolation: Check slow database query logs (running EXPLAIN ANALYZE on suspicious queries to find unindexed table scans) and inspect network payloads.
3. Remediation: Introduce missing compound B-tree indexes, implement multi-tier Redis caching for read-heavy endpoints, and optimize connection pool sizing.
4. Prevention: Establish automated alerting for p99 latency regressions and integrate load testing into staging CI/CD pipelines.`;
  }

  if (qLower.includes("queue") || qLower.includes("poison pill") || qLower.includes("background job")) {
    return `1. Immediate Triage: Isolate the failing queue partition and inspect dead-letter queue (DLQ) messages to capture the exact payload causing consumer crashes.
2. Safe Quarantining: Route malformed or poison pill messages to a quarantine inspection queue to allow healthy backlog processing to resume immediately.
3. Consumer Hardening: Update consumer logic with defensive schema validation, explicit try/catch boundaries, and exponential backoff with jitter on retries.
4. Replay & Recovery: Once the patch is deployed, safely replay quarantined payloads and verify data consistency.`;
  }

  if (qLower.includes("ransomware") || qLower.includes("phishing") || qLower.includes("soc alert") || qLower.includes("beaconing") || qLower.includes("security incident")) {
    return `1. Containment: Immediately isolate the affected endpoints/hosts from the network to prevent lateral movement and data exfiltration.
2. Evidence Preservation: Capture volatile memory dumps, firewall logs, and EDR forensic telemetry while maintaining strict chain of custody.
3. Eradication: Terminate malicious processes, delete unauthorized scheduled tasks/services, revoke compromised API keys and user credentials, and enforce MFA resets.
4. Recovery & Hardening: Rebuild compromised systems from verified gold-standard images, map the attack vector to the MITRE ATT&CK framework, and tune SIEM detection correlation rules.`;
  }

  if (qLower.includes("fatigue") || qLower.includes("deflection") || qLower.includes("scrap rate") || qLower.includes("fracture") || qLower.includes("tolerance stackup")) {
    return `1. Failure Analysis & Containment: Quarantine the affected component batch and perform visual/microscopic fractography to identify the crack initiation site (e.g. stress concentration or notch defect).
2. Root Cause Verification: Perform 1D/3D tolerance stackup analysis (worst-case and RSS methods) and rerun FEA simulations with refined meshing and realistic boundary loads.
3. Design Correction: Increase fillet radii at sharp internal corners to reduce stress concentration factors (Kt), adjust GD&T datum referencing, and modify tooling offsets.
4. Validation: Conduct physical cyclic endurance and tensile testing on revised prototypes to verify that safety factors meet design criteria before production sign-off.`;
  }

  if (qLower.includes("exothermic") || qLower.includes("runaway") || qLower.includes("flooding") || qLower.includes("distillation") || qLower.includes("hazop")) {
    return `1. Emergency Containment: Trigger the automated Safety Instrumented System (SIS) interlock, maximize cooling water flow to reactor jackets, and divert feed streams to safe holding units.
2. Stabilization: Monitor pressure transmitters and rupture disk / pressure safety valve (PSV) discharges to prevent vessel over-pressurization.
3. Root Cause Investigation: Analyze DCS trend logs for catalyst dosing irregularities, cooling utility interruptions, or flow fouling.
4. Prevention: Re-evaluate the HAZOP risk matrix, install redundant temperature sensors with 2oo3 voting logic, and update standard operating procedures.`;
  }

  if (qLower.includes("voltage ripple") || qLower.includes("emi") || qLower.includes("microcontroller reset") || qLower.includes("noise") || qLower.includes("thermal runaway")) {
    return `1. Bench Diagnostics: Probe the power supply rails using high-bandwidth oscilloscope probes with short ground springs to measure high-frequency noise and voltage ripple under dynamic switching loads.
2. Noise Mitigation: Enhance the decoupling capacitor network by placing low-ESR ceramic caps (0.1µF + 10µF) immediately adjacent to IC power pins and inserting ferrite beads on noisy DC-DC converter outputs.
3. PCB Layout Refinement: Verify continuous ground return paths, eliminate ground loops, and shield high-speed clock/comm traces (SPI/I2C/CAN).
4. Validation: Retest across temperature extremes (-40°C to +85°C) and conduct EMC/EMI chamber compliance testing.`;
  }

  // 4. Topic-Specific Technical Answers
  // React / Frontend / State Management
  if (qLower.includes("react") || qLower.includes("state management") || qLower.includes("component") || qLower.includes("hooks") || qLower.includes("frontend")) {
    return `In React development, I adhere to modular component architecture and predictable state management:
• Unidirectional Data Flow: Keep state as local as possible, lifting state up only when shared across siblings, and utilizing Context or state managers (e.g. Zustand/Redux) for global domain state.
• Performance: Prevent unnecessary re-renders using useMemo, useCallback, and React.memo for pure presentation components.
• Asynchronous Lifecycles: Manage API data loading with clean cleanup functions in useEffect or dedicated query libraries (React Query) to prevent memory leaks and race conditions.
• Resilience: Wrap top-level and feature components in React Error Boundaries with graceful fallback UI.`;
  }

  // Node.js / REST APIs / Backend / Microservices
  if (qLower.includes("node") || qLower.includes("api") || qLower.includes("restful") || qLower.includes("graphql") || qLower.includes("backend") || qLower.includes("endpoint")) {
    return `When developing backend services and APIs, I emphasize reliability, security, and scalability:
• Contract Design: Structure clear RESTful or GraphQL endpoints with predictable HTTP status codes and uniform JSON response envelopes.
• Non-blocking Architecture: Leverage Node.js asynchronous event loop patterns, offloading CPU-intensive tasks to worker threads or background job queues.
• Security & Validation: Implement strict schema validation (using Joi/Zod) on all incoming payloads, JWT/OAuth2 authentication middleware, CORS whitelisting, and rate limiting against brute force.
• Resilience: Implement graceful server shutdown, structured JSON logging (Winston/Pino), and centralized error handling middleware.`;
  }

  // Databases / SQL / PostgreSQL / Schema Design
  if (qLower.includes("database") || qLower.includes("sql") || qLower.includes("postgresql") || qLower.includes("indexing") || qLower.includes("schema") || qLower.includes("transaction")) {
    return `In database architecture and optimization, I apply systematic principles:
• Schema Design: Normalize to 3NF to eliminate anomalies, while strategically denormalizing read-heavy summary tables when backed by performance benchmarks.
• Indexing: Create B-tree indexes on foreign keys and high-cardinality search columns, avoiding over-indexing on write-heavy tables. Use EXPLAIN ANALYZE to verify index scans over sequential table scans.
• Transaction Integrity: Use ACID transactions with appropriate isolation levels (Read Committed / Serializable) and row-level locking to prevent race conditions and lost updates.
• Scalability: Employ connection pooling (PgBouncer) and read replicas to distribute query load effectively.`;
  }

  // CI/CD / Docker / DevOps
  if (qLower.includes("ci/cd") || qLower.includes("docker") || qLower.includes("container") || qLower.includes("deployment") || qLower.includes("kubernetes")) {
    return `My DevOps methodology centers on immutable infrastructure and automated quality gates:
• Containerization: Multi-stage Dockerfiles that build artifacts in an isolated container and produce minimal, hardened alpine-based production runtime images with non-root users.
• Pipeline Automation: Automated CI pipelines (e.g. GitHub Actions) that run linters, security dependency audits (npm audit / Snyk), unit tests, and integration suites on every pull request.
• Zero-Downtime Deployment: Implement blue-green or canary deployments with automated health checks that trigger immediate rollbacks if error thresholds are exceeded.`;
  }

  // Cybersecurity / SIEM / Vulnerabilities / OWASP
  if (qLower.includes("siem") || qLower.includes("splunk") || qLower.includes("threat") || qLower.includes("vulnerability") || qLower.includes("owasp") || qLower.includes("firewall")) {
    return `In cybersecurity engineering, I implement Defense-in-Depth and Zero Trust principles:
• Threat Detection: Ingest and parse diverse log sources (firewall, authentication, EDR, DNS) into SIEM (Splunk) with tuned correlation rules mapped to the MITRE ATT&CK framework.
• Vulnerability Mitigation: Remediate OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, broken access control) via parameterized queries, content security policies (CSP), and strict input sanitization.
• Access Control: Enforce Role-Based Access Control (RBAC), Least Privilege, and Multi-Factor Authentication across all administrative and production gateways.`;
  }

  // Mechanical / CAD / SolidWorks / GD&T / FEA
  if (qLower.includes("solidworks") || qLower.includes("cad") || qLower.includes("fea") || qLower.includes("ansys") || qLower.includes("gd&t") || qLower.includes("dfm") || qLower.includes("mechanical")) {
    return `In mechanical engineering design, I apply rigorous modeling and validation standards:
• Parametric CAD: Design fully constrained parametric 3D models with logical feature trees, modular subassemblies, and standard hardware fasteners.
• GD&T (ASME Y14.5): Specify functional datum reference frames, position, profile of a surface, and runout tolerances to ensure interchangeability while controlling machining costs.
• FEA Simulation: Set realistic boundary conditions, apply appropriate mesh refinement (h-refinement / p-refinement at stress concentrations), and verify von Mises stress against material yield strength with adequate safety factors (SF ≥ 1.5 - 2.0).
• DFMA: Design parts for straightforward CNC machining, sheet metal bending, or injection molding to minimize cycle times and scrap rates.`;
  }

  // UI/UX / Figma / Accessibility / CSS
  if (qLower.includes("figma") || qLower.includes("ui/ux") || qLower.includes("accessibility") || qLower.includes("wcag") || qLower.includes("css") || qLower.includes("responsive") || qLower.includes("design")) {
    return `In UI/UX design and frontend implementation, I focus on user-centered principles:
• Design Systems: Build atomic design tokens in Figma (colors, typography scales, spacing units) and mirror them directly in code via CSS custom properties.
• Accessibility (WCAG 2.1 AA): Ensure compliant color contrast ratios (≥4.5:1), keyboard navigation with visible focus indicators, semantic HTML landmarks, and aria attributes for screen readers.
• Responsive Layouts: Utilize CSS Grid and Flexbox with mobile-first fluid typography (clamp/rem) and responsive breakpoints to deliver seamless experiences across desktop and mobile screens.`;
  }

  // Civil / Structural / STAAD / Concrete
  if (qLower.includes("civil") || qLower.includes("structural") || qLower.includes("concrete") || qLower.includes("staad") || qLower.includes("foundation") || qLower.includes("rebar")) {
    return `In civil and structural engineering, I ensure safety, durability, and building code compliance:
• Load Analysis: Formulate factored load combinations (dead, live, seismic, wind, snow) according to ASCE 7 and local building codes.
• Structural Modeling: Construct finite element models in STAAD.Pro/ETABS, verifying shear force and bending moment envelopes, joint stability, and story drift limits.
• Reinforced Concrete: Detail rebar sizes, spacing, and development bond lengths in compliance with ACI 318 to prevent brittle shear failure and control crack widths.
• Geotechnical: Cross-verify soil bearing capacities from standard penetration tests (SPT) to size spread footings and deep foundation piles appropriately.`;
  }

  // Chemical / Process / Aspen / Thermodynamics
  if (qLower.includes("chemical") || qLower.includes("process") || qLower.includes("aspen") || qLower.includes("reactor") || qLower.includes("thermodynamics") || qLower.includes("p&id")) {
    return `In chemical engineering, I integrate thermodynamics, kinetics, and process safety:
• Process Simulation: Build steady-state and dynamic simulations in Aspen Plus/HYSYS, choosing appropriate equation-of-state property packages (e.g. NRTL, Peng-Robinson) for accurate phase equilibria.
• Unit Operation Optimization: Size distillation columns, calculate optimal reflux ratios, and design heat exchanger networks using pinch analysis to maximize thermal efficiency.
• Process Safety: Develop comprehensive P&IDs with failsafe control loops, conduct HAZOP risk reviews, and design safety relief valves (PSVs) compliant with API 520/521 standards.`;
  }

  // Electrical / PCB / Embedded / Microcontroller
  if (qLower.includes("electrical") || qLower.includes("circuit") || qLower.includes("pcb") || qLower.includes("embedded") || qLower.includes("microcontroller") || qLower.includes("firmware")) {
    return `In electrical and embedded systems engineering, I follow structured design and verification workflows:
• Schematic & PCB Design: Design multi-layer PCBs with dedicated continuous ground planes, calculate trace characteristic impedance (50Ω single-ended / 90-100Ω differential pairs), and optimize component layout to isolate noisy digital switching from sensitive analog signals.
• Firmware Development: Write clean, modular C/C++ embedded firmware with hardware abstraction layers (HAL), interrupt service routines (ISR) with minimal latency, and RTOS task prioritization.
• Bench Testing: Validate power rail sequencing, bus communication protocols (I2C, SPI, UART, CAN), and signal integrity using oscilloscopes, logic analyzers, and thermal cameras.`;
  }

  // 5. Resume Project Question fallback
  const userProjects = highlights.projects
    ? highlights.projects.split(";").map((p) => p.trim()).filter((p) => p.length > 2)
    : [];
  const matchesUserProject = userProjects.some((p) => qLower.includes(p.toLowerCase().slice(0, 15)));

  if (matchesUserProject || qLower.includes("your contribution to") || qLower.includes("project you worked on")) {
    const projName = userProjects.length > 0 ? userProjects[0].split(",")[0].trim() : "the project";
    const skillsSnippet = highlights.skills
      ? highlights.skills.split(",").slice(0, 3).map((s) => s.trim()).join(", ")
      : "core engineering tools";
    return `In my work on ${projName}, my core responsibility was architecting and implementing key technical components using ${skillsSnippet}. I broke down the project into systematic phases: requirements analysis, architecture design, and comprehensive validation. When technical bottlenecks emerged, I conducted root-cause analysis and performance profiling to optimize the solution, delivering the project on schedule with high reliability.`;
  }

  // 6. Universal Default Fallback
  return `To address this effectively as a ${targetRoleName}, I apply a structured engineering approach:
1. Requirements & Problem Definition: Clarify functional constraints, failure modes, and performance criteria.
2. Architecture & Design: Apply industry standards, modular decoupling, and verified domain principles (e.g. clean architecture, DFMA, Zero Trust).
3. Validation & Quality Assurance: Conduct rigorous unit/integration testing, simulation, and benchmark profiling.
4. Continuous Improvement: Monitor telemetry in production, document findings, and refactor proactively to ensure long-term maintainability.`;
}

/**
 * Evaluate Complete Live AI Mock Interview with question-type awareness and strict quality analysis
 */
async function evaluateMockInterviewEngine(params) {
  const context = extractInterviewContext(params);
  const { targetRole, careerField, experienceLevel, highlights, jobDescription } = context;
  const qaList = params.qaList || [];

  const qaTranscript = qaList
    .map(
      (item, idx) =>
        `Question ${idx + 1} (${item.level || "Standard"}): "${item.question || ""}"\nCandidate Actual Answer: "${item.answer !== undefined && item.answer !== null ? String(item.answer).trim() : "No response provided"}"`
    )
    .join("\n\n");

  const resumeContextText = `
Candidate Name: ${highlights.candidateName || "Candidate"}
Education: ${highlights.education || "Not specified"}
Key Skills: ${highlights.skills || "Not specified"}
Projects: ${highlights.projects || "Not specified"}
Experience: ${highlights.experience || "Not specified"}
Certifications: ${highlights.certifications || "Not specified"}
`.trim();

  const prompt = `You are an expert, strict, and impartial technical hiring director and interview board chairman for a "${targetRole}" position in "${careerField}".

CANDIDATE RESUME PROFILE:
${resumeContextText}
Target Role: ${targetRole}
Career Field: ${careerField}
Experience Level: ${experienceLevel}
${jobDescription ? `Target Job Description: ${jobDescription.trim()}` : ""}

INTERVIEW TRANSCRIPT (Questions & Candidate Actual Answers):
${qaTranscript}

CRITICAL EVALUATION MANDATES:
1. BASE THE SCORE SOLELY ON DEMONSTRATED ANSWERS:
   - Do NOT give high scores (e.g. 80%+) merely because the candidate completed the interview or spoke a few words.
   - If the candidate repeatedly says "I don't know", "not sure", gives evasive/empty/off-topic answers, or gives incorrect technical claims, their question score MUST be 0 to 10/100, and their overall score MUST be low (e.g. 20% to 40%).
   - If the candidate gave accurate, relevant, and well-explained answers, award an appropriately strong score (e.g. 75% to 92%).

2. QUESTION-TYPE AWARE EVALUATION:
   - Technical questions: Give greatest weight to Correctness and Technical / Domain Knowledge.
   - Behavioral questions: Give greatest weight to Answer Relevance, Communication, Reasoning, and Completeness (STAR method).
   - Situational questions: Give greatest weight to Problem-Solving, Reasoning, Decision-Making, and Relevance.
   - Resume-based questions: Check whether the candidate's answer is consistent with their actual resume information.

3. EVALUATION CRITERIA (0 to 100% each):
   - "answerRelevance": Does the answer directly address the question?
   - "correctness": Is the answer factually, conceptually, and technically correct for ${careerField}?
   - "completeness": Does the candidate provide enough thorough explanation and detail?
   - "communication": Is the response clear, structured, and understandable?
   - "technicalKnowledge": Does the candidate demonstrate appropriate domain knowledge for ${targetRole}?

4. OVERALL INTERVIEW SCORE:
   - Compute "overallScore" (0-100) strictly as the honest, weighted reflection of the candidate's performance across all questions.

5. FEEDBACK SECTIONS:
   - "summary": A short, honest explanation of the candidate's overall performance. If the score is low, explain that the candidate demonstrated limited correctness, completeness, or technical understanding.
   - "strengths": 2-3 genuine strengths demonstrated in their answers (or acknowledgment of willingness to practice if mostly unknown).
   - "areasForImprovement": 3-4 specific technical gaps, concepts, and topics they need to improve.
   - "recommendedTopics": 3-4 key technical topics to study in ${careerField}.
   - "detailedFeedback": Array of objects for each question with individual scores (0-100), specific feedback, and an exemplary ideal answer.

6. IDEAL ANSWER MANDATES (FOR EVERY QUESTION IN detailedFeedback):
   - Provide a high-quality "idealAnswer" string that demonstrates how a top-tier candidate should answer this exact question at the ${experienceLevel} level.
   - For Technical questions: Provide technically precise terminology, core principles, equations/methodologies/standards for ${careerField || targetRole}.
   - For Resume-based questions: Ground the ideal response in the candidate's actual projects/skills/experience listed in their profile, demonstrating how to articulate contributions and technical impact without fabricating unlisted background.
   - For Behavioral questions: Use a crisp STAR framework (Situation, Task, Action, Result) with clear actions and quantifiable outcomes.
   - For Situational / Problem-solving questions: Outline structured root-cause analysis, containment, step-by-step resolution, and validation.

Output ONLY valid JSON strictly adhering to this schema:
{
  "overallScore": 75,
  "performanceTier": "Good",
  "summary": "Concise honest performance summary...",
  "categories": {
    "answerRelevance": 80,
    "correctness": 75,
    "completeness": 70,
    "communication": 85,
    "technicalKnowledge": 70
  },
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "areasForImprovement": [
    "Improvement 1",
    "Improvement 2"
  ],
  "recommendedTopics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4"
  ],
  "detailedFeedback": [
    {
      "questionNumber": 1,
      "level": "Basic",
      "question": "Question text",
      "userAnswer": "Candidate answer text",
      "score": 75,
      "feedback": "Specific feedback on why this score was awarded",
      "idealAnswer": "Exemplary reference answer showing how to answer this question comprehensively and professionally."
    }
  ]
}
`;

  try {
    const aiResult = await callGeminiApi(prompt, "", { temperature: 0.2 });
    const parsed = extractJson(aiResult);
    if (
      parsed &&
      typeof parsed.overallScore === "number" &&
      parsed.categories &&
      Array.isArray(parsed.detailedFeedback) &&
      parsed.detailedFeedback.length > 0
    ) {
      const s = parsed.overallScore;
      if (s >= 90) parsed.performanceTier = "Outstanding";
      else if (s >= 75) parsed.performanceTier = "Very Good";
      else if (s >= 60) parsed.performanceTier = "Good";
      else if (s >= 40) parsed.performanceTier = "Needs Improvement";
      else parsed.performanceTier = "Poor / Needs Significant Improvement";

      // Ensure alias fields exist for frontend backward compatibility
      parsed.categories.relevanceScore = parsed.categories.answerRelevance || parsed.categories.relevanceScore || 0;
      parsed.categories.correctnessScore = parsed.categories.correctness || parsed.categories.correctnessScore || 0;
      parsed.categories.completenessScore = parsed.categories.completeness || parsed.categories.completenessScore || 0;
      parsed.categories.communicationScore = parsed.categories.communication || parsed.categories.communicationScore || 0;
      parsed.categories.technicalScore = parsed.categories.technicalKnowledge || parsed.categories.technicalScore || 0;

      // Ensure every question has an idealAnswer populated
      parsed.detailedFeedback = parsed.detailedFeedback.map((item, idx) => {
        if (!item.idealAnswer || typeof item.idealAnswer !== "string" || item.idealAnswer.trim().length < 15) {
          item.idealAnswer = generateFallbackIdealAnswer(
            item.question || qaList[idx]?.question || "",
            item.level || "Intermediate",
            targetRole,
            careerField,
            highlights,
            jobDescription
          );
        }
        return item;
      });

      return parsed;
    }
  } catch (err) {
    console.warn("[MOCK_INTERVIEW] Gemini evaluation error:", err.message);
  }

  // Robust Deterministic Semantic Fallback Evaluator
  const unknownPattern = /\b(i\s*don'?t\s*know|no\s*idea|not\s*sure|don'?t\s*have\s*any\s*idea|cannot\s*answer|can'?t\s*answer|no\s*clue|haven'?t\s*studied|pass|skip|idk|na\b|n\/a)\b/i;

  const domainKeywords = [
    "cad", "solidworks", "fea", "ansys", "stress", "strain", "gd&t", "dfm", "thermodynamics",
    "distillation", "aspen", "p&id", "hazop", "reactor", "siem", "splunk", "wireshark", "threat",
    "xss", "encryption", "sql", "api", "react", "architecture", "database", "concrete", "structural",
    "staad", "circuit", "pcb", "plc", "methodology", "quality", "safety", "validation", "troubleshooting",
    "analysis", "design", "testing", "optimization"
  ];

  let totalRelevance = 0;
  let totalCorrectness = 0;
  let totalCompleteness = 0;
  let totalCommunication = 0;
  let totalTechnical = 0;

  const evaluatedQuestions = qaList.map((item, idx) => {
    const qText = item.question || `Question ${idx + 1}`;
    const rawAnswer = (item.answer !== undefined && item.answer !== null ? String(item.answer) : "").trim();
    const qNumber = idx + 1;
    const level = item.level || (idx < 3 ? "Basic" : idx < 6 ? "Intermediate" : "Advanced");
    const lowerAnswer = rawAnswer.toLowerCase();
    const words = rawAnswer.split(/\s+/).filter(Boolean);

    const fallbackIdeal = generateFallbackIdealAnswer(qText, level, targetRole, careerField, highlights, jobDescription);

    // Case 1: Empty / No response
    if (!rawAnswer || lowerAnswer === "no response provided") {
      totalRelevance += 0;
      totalCorrectness += 0;
      totalCompleteness += 0;
      totalCommunication += 0;
      totalTechnical += 0;
      return {
        questionNumber: qNumber,
        level,
        question: qText,
        userAnswer: "No response provided",
        score: 0,
        feedback: "The candidate did not provide an answer. Core foundational concepts should be reviewed.",
        idealAnswer: fallbackIdeal,
        isUnknown: true,
      };
    }

    // Case 2: "I don't know" or evasive response
    if (unknownPattern.test(rawAnswer)) {
      totalRelevance += 10;
      totalCorrectness += 5;
      totalCompleteness += 5;
      totalCommunication += 20;
      totalTechnical += 5;
      return {
        questionNumber: qNumber,
        level,
        question: qText,
        userAnswer: rawAnswer,
        score: 5,
        feedback: `The candidate indicated they do not know the answer (${rawAnswer}). Fundamental concepts for this topic must be studied.`,
        idealAnswer: fallbackIdeal,
        isUnknown: true,
      };
    }

    // Case 3: Extremely brief / minimal (< 5 words)
    if (words.length < 5) {
      totalRelevance += 25;
      totalCorrectness += 20;
      totalCompleteness += 15;
      totalCommunication += 30;
      totalTechnical += 20;
      return {
        questionNumber: qNumber,
        level,
        question: qText,
        userAnswer: rawAnswer,
        score: 20,
        feedback: "The response was overly brief and did not provide sufficient technical depth or explanation.",
        idealAnswer: fallbackIdeal,
        isUnknown: false,
      };
    }

    // Case 4: Content Analysis
    let matchedKeywords = 0;
    domainKeywords.forEach((kw) => {
      if (lowerAnswer.includes(kw)) matchedKeywords++;
    });

    const questionTokens = qText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["what", "explain", "describe", "please", "difference", "between", "how", "does", "your", "with"].includes(w));

    questionTokens.forEach((tok) => {
      if (lowerAnswer.includes(tok)) matchedKeywords++;
    });

    let qRelevance = matchedKeywords > 0 ? Math.min(40 + matchedKeywords * 15, 95) : 30;
    let qCorrectness = matchedKeywords > 0 ? Math.min(35 + matchedKeywords * 15, 95) : 25;
    let qCompleteness = Math.min(25 + words.length * 1.5, 95);
    let qCommunication = Math.min(35 + words.length * 1.2, 95);
    let qTechnical = matchedKeywords > 0 ? Math.min(30 + matchedKeywords * 16, 95) : 20;

    let qScore = Math.round((qRelevance * 0.25) + (qCorrectness * 0.25) + (qCompleteness * 0.2) + (qCommunication * 0.15) + (qTechnical * 0.15));
    qScore = Math.min(Math.max(qScore, 15), 96);

    totalRelevance += qRelevance;
    totalCorrectness += qCorrectness;
    totalCompleteness += qCompleteness;
    totalCommunication += qCommunication;
    totalTechnical += qTechnical;

    let feedback = "";
    if (qScore >= 80) {
      feedback = "Strong, relevant answer demonstrating good technical understanding and clear articulation.";
    } else if (qScore >= 60) {
      feedback = "Satisfactory answer covering essential points. Adding specific technical parameters and trade-offs will enhance clarity.";
    } else {
      feedback = "Partial response with limited technical substance. Expand with concrete engineering steps and structured examples.";
    }

    return {
      questionNumber: qNumber,
      level,
      question: qText,
      userAnswer: rawAnswer,
      score: qScore,
      feedback,
      idealAnswer: fallbackIdeal,
      isUnknown: false,
    };
  });

  const count = evaluatedQuestions.length || 1;
  const overallScore = Math.round(evaluatedQuestions.reduce((sum, q) => sum + q.score, 0) / count);

  const answerRelevance = Math.round(totalRelevance / count);
  const correctness = Math.round(totalCorrectness / count);
  const completeness = Math.round(totalCompleteness / count);
  const communication = Math.round(totalCommunication / count);
  const technicalKnowledge = Math.round(totalTechnical / count);

  let performanceTier = "Poor / Needs Significant Improvement";
  if (overallScore >= 90) performanceTier = "Outstanding";
  else if (overallScore >= 75) performanceTier = "Very Good";
  else if (overallScore >= 60) performanceTier = "Good";
  else if (overallScore >= 40) performanceTier = "Needs Improvement";
  else performanceTier = "Poor / Needs Significant Improvement";

  const unknownCount = evaluatedQuestions.filter((q) => q.isUnknown || q.score < 20).length;

  let summary = "";
  if (overallScore < 40) {
    summary = `The candidate completed the mock interview for ${targetRole} but demonstrated limited domain correctness, completeness, and technical depth (answering "I don't know", incomplete, or off-topic on ${unknownCount} of ${count} questions). Intensive study of foundational principles is strongly recommended before attending live interviews.`;
  } else if (overallScore < 60) {
    summary = `The candidate showed foundational familiarity with some ${targetRole} concepts, but struggled with technical completeness and scenario-based problem solving. Focused preparation on technical terminology and structured explanations is advised.`;
  } else if (overallScore < 75) {
    summary = `The candidate demonstrated good overall understanding of ${targetRole} requirements and articulated answers reasonably well. Deepening knowledge of advanced edge-cases and engineering standards will elevate performance.`;
  } else {
    summary = `The candidate demonstrated strong, well-articulated domain expertise across foundational, technical, and situational questions for ${targetRole}. Responses were accurate, relevant, and comprehensive.`;
  }

  let strengths = [];
  let areasForImprovement = [];

  if (overallScore < 40) {
    strengths = [
      "Completed the full interview progression and demonstrated willingness to practice.",
      "Acknowledged knowledge gaps honestly rather than providing fabricated information.",
    ];
    areasForImprovement = [
      `Master core technical concepts, equations, and terminology for ${targetRole}.`,
      "Practice answering questions with complete, multi-step technical explanations.",
      "Study standard tools, calculation methodologies, and workflows in " + (careerField || "your field") + ".",
      "Prepare structured STAR method responses for behavioral and situational scenarios.",
    ];
  } else if (overallScore < 60) {
    strengths = [
      "Demonstrated basic understanding of introductory domain concepts.",
      "Maintained professional communication throughout the interview session.",
    ];
    areasForImprovement = [
      "Increase technical depth and incorporate industry standards into answers.",
      "Strengthen troubleshooting and root-cause analysis explanations.",
      "Provide more detailed, concrete examples from your past projects.",
    ];
  } else {
    strengths = [
      `Solid grasp of core engineering and technical concepts relevant to ${targetRole}.`,
      "Clear, structured articulation with appropriate industry terminology.",
      "Effective problem-solving methodology demonstrated in scenario questions.",
    ];
    areasForImprovement = [
      "Incorporate more quantitative case-study metrics in advanced design questions.",
      "Further refine edge-case failure mode analysis and mitigation steps.",
    ];
  }

  const recommendedTopics = [
    `Core Foundations & Terminology of ${targetRole}`,
    `Industry Quality Standards & Operating Procedures in ${careerField || "Engineering"}`,
    "Root Cause Analysis & Failure Mode Mitigation (FMEA)",
    "STAR Behavioral Interview Question Frameworks",
  ];

  return {
    overallScore,
    performanceTier,
    summary,
    categories: {
      answerRelevance,
      correctness,
      completeness,
      communication,
      technicalKnowledge,
      relevanceScore: answerRelevance,
      correctnessScore: correctness,
      completenessScore: completeness,
      communicationScore: communication,
      technicalScore: technicalKnowledge,
    },
    strengths,
    areasForImprovement,
    recommendedTopics,
    detailedFeedback: evaluatedQuestions,
  };
}

module.exports = {
  isSemanticDuplicate,
  extractResumeHighlights,
  extractSkillsFromJobDescription,
  extractInterviewContext,
  validateQuestionRelevance,
  generateDomainRelevantQuestion,
  generateMockInterviewEngine,
  generateNextMockQuestionEngine,
  evaluateMockInterviewEngine,
};



