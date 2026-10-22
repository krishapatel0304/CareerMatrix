/**
 * Live AI Mock Interview Generation Engine (Strict Relevance, Zero-Hallucination & Multi-Session Variation)
 * Generates authentic, 100% relevant, non-repeating interview questions tailored strictly to candidate's role,
 * career field, experience level, verified resume details, listed skills, and Job Description.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Candidate Gemini models in fallback order (verified working on v1beta API)
const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-pro-latest",
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

  console.warn("⚠️ [Mock Interview Engine] All Gemini model requests failed or timed out. Gracefully switching to dynamic domain procedural engine.");
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

  const toStr = (v) => {
    if (typeof v === "string") return v.trim();
    if (Array.isArray(v)) {
      return v
        .map((item) => (typeof item === "string" ? item : item?.title || item?.name || item?.description || item?.skill || JSON.stringify(item)))
        .join("\n")
        .trim();
    }
    if (v && typeof v === "object") return Object.values(v).join(" ").trim();
    return String(v || "").trim();
  };

  return {
    candidateName: toStr(cleanName),
    education: toStr(cleanEdu),
    educationList,
    experience: toStr(cleanExp),
    experienceList,
    projects: toStr(cleanProj),
    projectsList,
    certifications: toStr(cleanCert),
    certificationsList,
    skills: toStr(cleanSkills),
    skillsList,
    objective: toStr(cleanObj),
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

const DOMAIN_DEFAULT_SKILLS = {
  SOFTWARE_FRONTEND: ["HTML5/CSS3 & Responsive Layouts", "JavaScript (ES6+) & DOM Manipulation", "React.js Component Architecture & Hooks", "Frontend Performance, State Management & Accessibility (WCAG)"],
  SOFTWARE_BACKEND: ["RESTful & GraphQL API Architecture", "Database Schema Design & Query Optimization", "Authentication & Security (OAuth/JWT)", "Microservices, Caching & Message Queues"],
  SOFTWARE_FULLSTACK: ["Frontend UI & React Components", "Backend APIs & Node/Express/Django Services", "Relational & NoSQL Database Integration", "End-to-End System Architecture & Deployment"],
  SOFTWARE_DEVOPS: ["CI/CD Pipelines & Containerization (Docker)", "Kubernetes & Cloud Infrastructure (AWS/GCP/Azure)", "Infrastructure as Code (Terraform)", "Monitoring, Logging & Site Reliability (SRE)"],
  SOFTWARE_QA: ["Test Automation Frameworks (Selenium/Cypress/Playwright)", "Unit, Integration & API Testing", "Performance & Load Testing", "CI/CD Test Pipeline Integration"],
  SOFTWARE_MOBILE: ["Cross-Platform Mobile Development (React Native/Flutter)", "Native iOS (Swift) & Android (Kotlin)", "Mobile State Management & Offline Storage", "App Store Deployment & Mobile Performance"],
  SOFTWARE: ["Modern Web & Backend Architecture", "Database Design & API Integration", "Testing & Performance Optimization", "System Architecture & Scalability"],
  CYBERSECURITY: ["Threat Analysis & Vulnerability Management", "SIEM Monitoring & Incident Response", "Network Security & Cryptography", "Zero Trust Architecture & Compliance"],
  MECHANICAL: ["3D CAD Modeling & Simulation", "Material Selection & Stress Analysis", "GD&T & Design for Manufacturability", "Thermal & Dynamic Systems"],
  UIUX: ["User Experience & Wireframing", "UI Component Libraries & Design Tokens", "Usability Testing & Accessibility (WCAG)", "Interactive Prototyping in Figma"],
  DESIGN: ["Visual Design & Typography", "Design Systems & Asset Creation", "User Research & Concept Prototyping", "Brand Identity & Creative Direction"],
  CIVIL: ["Structural Analysis & Load Calculations", "Concrete & Steel Detailing", "Geotechnical & Foundation Engineering", "Building Codes & Constructability"],
  CHEMICAL: ["Process Design & Simulation", "Thermodynamics & Reaction Kinetics", "Unit Operations & Heat Transfer", "Process Safety & HAZOP Standards"],
  ELECTRICAL: ["Circuit Design & Schematic Capture", "Embedded Systems & Firmware", "Power Distribution & Signal Integrity", "PCB Layout & Hardware Testing"],
  ROBOTICS: ["Kinematics & Motion Control", "Sensors & Actuator Integration", "ROS & Embedded Robotics Programming", "Autonomous Navigation & Automation"],
  AUTOMOBILE: ["Vehicle Dynamics & Powertrain Systems", "Automotive Electronics & CAN Bus", "EV Battery & Thermal Management", "Chassis Design & Crashworthiness"],
  MANUFACTURING: ["Production Planning & Lean Six Sigma", "CNC Machining & Tooling Design", "Quality Control & Statistical Process Control (SPC)", "Supply Chain & Assembly Line Optimization"],
  BIOTECH: ["Molecular Biology & Laboratory Assays", "Bioprocess Engineering & Fermentation", "Genomics & Bio-instrumentation", "GLP/GMP Compliance & Quality Assurance"],
  HEALTHCARE: ["Clinical Protocols & Patient Care Standards", "Medical Diagnostics & Treatment Planning", "Healthcare Quality & Patient Safety", "HIPAA Compliance & Medical Ethics"],
  AEROSPACE: ["Aerodynamics & Propulsion Systems", "Avionics & Flight Control Systems", "Structural Mechanics & Lightweight Materials", "Flight Simulation & Aerospace Standards"],
  FINANCE: ["Financial Modeling & Valuation", "Corporate Accounting & GAAP/IFRS Standards", "Financial Statement Analysis & Forecasting", "Risk Management & Regulatory Compliance"],
  MARKETING: ["Digital Marketing Campaigns & Strategy", "SEO/SEM & Audience Acquisition", "Market Research & Funnel Analytics", "Brand Management & Conversion Rate Optimization"],
  HR: ["Talent Acquisition & Technical Recruiting", "Employee Relations & Conflict Resolution", "Performance Management & Compensation", "Labor Law Compliance & HR Policy Design"],
  RESEARCH: ["Experimental Design & Hypothesis Testing", "Data Analysis & Statistical Modeling", "Scientific Literature Review & Synthesis", "Peer-Reviewed Publication & Research Ethics"],
  EDUCATION: ["Curriculum Design & Lesson Planning", "Pedagogical Methodologies & Student Engagement", "Assessment Design & Learning Analytics", "Classroom Management & Educational Technology"],
  BUSINESS: ["Strategic Planning & Business Analysis", "Operations Management & Process Optimization", "Financial Forecasting & Resource Allocation", "Stakeholder Management & KPI Tracking"],
  DATA_AI: ["Machine Learning & Statistical Modeling", "Data Pipelines & Feature Engineering", "Deep Learning Architectures", "Model Evaluation & MLOps Deployment"],
  GENERAL_ENGINEERING: ["Core Technical Fundamentals", "Quality Standards & Verification", "Troubleshooting & Problem Solving", "Project Execution & Deliverables"],
};

/**
 * Normalize target role to canonical form, handling common typos, variations, and abbreviations
 */
function normalizeTargetRole(rawRole = "", careerField = "") {
  if (!rawRole || typeof rawRole !== "string") {
    return "Engineering Professional";
  }
  const trimmed = rawRole.trim();
  const lower = trimmed.toLowerCase();

  // Canonical Frontend Developer normalization
  // Supports: frontend developer, front end developer, front-end developer, frotend developer, frotnend developer,
  // react developer, react.js developer, ui developer, ui engineer, web developer, client-side developer, etc.
  if (
    /^(?:front[\s-]*end|frot[\s-]*end|frotn[\s-]*end|react(?:\.js)?|ui|web|client[\s-]*side)\s*(?:developer|engineer|programmer|specialist|dev)?$/i.test(lower) ||
    /frot(?:n)?end|front[\s-]*end|react(?:\.js)?\s*(?:developer|dev|engineer)|ui\s*(?:developer|engineer|dev)|web\s*(?:developer|dev)|client[\s-]*side\s*(?:developer|dev|engineer)/i.test(lower)
  ) {
    if (!/back[\s-]*end|full[\s-]*stack/i.test(lower)) {
      return "Frontend Developer";
    }
  }

  return trimmed;
}

/**
 * Detect primary domain archetype covering all 20 centralized CareerMatrix career fields & software roles
 */
function detectDomainArchetype(careerField = "", role = "") {
  const normRole = normalizeTargetRole(role, careerField);
  const f = (careerField || "").toLowerCase();
  const r = (normRole || role || "").toLowerCase();
  const combined = `${f} ${r}`;

  // 1. Cybersecurity / Information Security
  if (f.includes("cyber") || f.includes("security") || f.includes("infosec") || /cyber|infosec|soc\b|penetration|threat|vulnerab/i.test(combined)) {
    return "CYBERSECURITY";
  }
  // 2. Chemical Engineering
  if (f.includes("chemical") || /chemical|petroleum|refinery|polymer|hazop|aspen|distillation/i.test(combined)) {
    return "CHEMICAL";
  }
  // 3. Civil Engineering
  if (f.includes("civil") || /civil|structural|construction|geotechnical|transportation|concrete|staad|etabs/i.test(combined)) {
    return "CIVIL";
  }
  // 4. Electrical / Electronics
  if (f.includes("electrical") || f.includes("electronic") || /electrical|electronics|embedded|vlsi|pcb|circuit|microcontroller|fpga/i.test(combined)) {
    return "ELECTRICAL";
  }
  // 5. Mechatronics / Robotics
  if (f.includes("mechatronic") || f.includes("robotic") || /mechatronic|robotics|actuator|ros\b|kinematics|motion\s*control|plc/i.test(combined)) {
    return "ROBOTICS";
  }
  // 6. Automobile Engineering
  if (f.includes("automobile") || f.includes("automotive") || /automobile|automotive|ev\b|electric\s*vehicle|powertrain|chassis|vehicle\s*dynamic/i.test(combined)) {
    return "AUTOMOBILE";
  }
  // 7. Aerospace Engineering
  if (f.includes("aerospace") || /aerospace|avionics|aeronautic|propulsion|spacecraft|satellite|flight/i.test(combined)) {
    return "AEROSPACE";
  }
  // 8. Production / Manufacturing
  if (f.includes("production") || f.includes("manufacturing") || (/production|manufacturing|six\s*sigma|lean|machining|cnc|assembly\s*line|tooling/i.test(combined) && !f.includes("software"))) {
    return "MANUFACTURING";
  }
  // 9. Biotechnology / Biomedical
  if (f.includes("biotech") || f.includes("biomedic") || /biotech|biomedic|molecular|pcr|genetics|bioprocess|bioinformatics|genomics|tissue\s*eng/i.test(combined)) {
    return "BIOTECH";
  }
  // 10. Healthcare
  if (f.includes("health") || f.includes("medical") || f.includes("clinical") || /health|clinical|medical|nurse|doctor|hospital|patient|pharmacy|physician|drug/i.test(combined)) {
    return "HEALTHCARE";
  }
  // 11. Finance / Accounting
  if (f.includes("finance") || f.includes("account") || (/finance|account|cpa|cfa|audit|tax|banking|financial|investment|ledger|bookkeep|treasury|wealth/i.test(combined) && !/software|developer/i.test(r))) {
    return "FINANCE";
  }
  // 12. Marketing / Sales
  if (f.includes("marketing") || f.includes("sales") || (/marketing|sales|brand|seo|sem|advertising|campaign|crm|growth|b2b|b2c|social\s*media/i.test(combined) && !/software|developer/i.test(r))) {
    return "MARKETING";
  }
  // 13. Human Resources
  if (f.includes("human resource") || f.includes("hr") || /human\s*resource|hr\b|talent|recruiting|onboarding|compensation|employee\s*relation|payroll/i.test(combined)) {
    return "HR";
  }
  // 14. Design (UI/UX vs General Design)
  if (f.includes("design") || /design|ui\b|ux\b|figma|graphic|visual|product\s*design|industrial\s*design|typography|creative\s*director/i.test(combined)) {
    if (r.includes("ui") || r.includes("ux") || r.includes("product designer") || r.includes("interaction") || r.includes("web design")) {
      return "UIUX";
    }
    return "DESIGN";
  }
  // 15. Research
  if (f.includes("research") || (/research|scientist|phd|laboratory|experiment|postdoc|fellow/i.test(combined) && !f.includes("software"))) {
    return "RESEARCH";
  }
  // 16. Education
  if (f.includes("education") || /educat|teacher|professor|pedagogy|curriculum|teaching|instruction|academic|school|tutor/i.test(combined)) {
    return "EDUCATION";
  }
  // 17. Business / Management
  if (f.includes("business") || f.includes("management") || (/business|management|operations|consulting|strategy|project\s*management|mba\b/i.test(combined) && !/software/i.test(r))) {
    return "BUSINESS";
  }
  // 18. Mechanical Engineering
  if (f.includes("mechanical") || /mechanical|solidworks|catia|ansys|fea|cad\b|gdt|thermodynamics|machine\s*design/i.test(combined)) {
    return "MECHANICAL";
  }
  // 19. Data & AI (if role is explicitly data/AI)
  if (/data\s*scientist|data\s*science|machine\s*learning|deep\s*learning|ai\s*engineer|nlp/i.test(combined)) {
    return "DATA_AI";
  }
  // 20. Software / IT (Role-Specialized Sub-Archetypes)
  if (f.includes("software") || f.includes("it") || /software|frontend|backend|full\s*stack|developer|programmer|coding|react|node|javascript|python|java\b|c\+\+|html|css|web\s*dev|devops|cloud|aws|azure/i.test(combined)) {
    // 20a. Frontend Developer / UI Developer / React Developer / Web Developer
    if (/front\s*end|frontend|frotend|frotnend|ui\s*dev|react|vue|angular|web\s*dev|client\s*side|html|css|javascript\s*dev/i.test(r)) {
      return "SOFTWARE_FRONTEND";
    }
    // 20b. Backend Developer / API Engineer
    if (/back\s*end|backend|node|express|django|flask|spring|fastapi|golang|database\s*engineer|api\s*engineer/i.test(r)) {
      return "SOFTWARE_BACKEND";
    }
    // 20c. DevOps & Cloud Infrastructure
    if (/devops|cloud|sre|site\s*reliability|infrastructure|kubernetes|docker|aws|azure\s*eng/i.test(r)) {
      return "SOFTWARE_DEVOPS";
    }
    // 20d. QA & Test Automation
    if (/qa\b|test|quality\s*assurance|sdet|automation/i.test(r)) {
      return "SOFTWARE_QA";
    }
    // 20e. Mobile Developer
    if (/mobile|ios|android|react\s*native|flutter|swift|kotlin/i.test(r)) {
      return "SOFTWARE_MOBILE";
    }
    // 20f. Full Stack Developer
    if (/full\s*stack|fullstack/i.test(r)) {
      return "SOFTWARE_FULLSTACK";
    }
    return "SOFTWARE";
  }

  return "GENERAL_ENGINEERING";
}

/**
 * Build consolidated interview context
 */
function extractInterviewContext(params = {}) {
  const highlights = extractResumeHighlights(params);
  const rawRole = (params.role || params.targetRole || params.jobRole || "Engineering Professional").trim();
  const careerField = (params.careerField || params.field || params.industry || "Software / IT").trim();
  const targetRole = normalizeTargetRole(rawRole, careerField);
  const experienceLevel = normalizeExperienceLevel(params.experienceLevel || params.difficulty || params.level);
  const jobDescription = (params.jobDescription || "").trim();
  const jdSkills = extractSkillsFromJobDescription(jobDescription);
  const archetype = detectDomainArchetype(careerField, targetRole);

  const defaultSkills = DOMAIN_DEFAULT_SKILLS[archetype] || DOMAIN_DEFAULT_SKILLS.GENERAL_ENGINEERING;
  const userCombinedSkills = Array.from(new Set([...highlights.skillsList, ...jdSkills]));
  const allSkills = userCombinedSkills.length > 0
    ? userCombinedSkills
    : defaultSkills;

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
    SOFTWARE_FRONTEND: ["database foreign key indexing", "acid transaction isolation level", "database shard", "connection pooling pgbouncer", "ddos traffic shedding", "auto-scaling group kubernetes", "kafka consumer group lag", "circuit breaker resilience4j", "deadlock isolation", "kernel driver", "welding inspection", "concrete slump test", "distillation column"],
    SOFTWARE_BACKEND: ["css flexbox", "css grid layout", "color contrast ratio wcag", "figma tokens", "welding inspection", "concrete slump test"],
    MECHANICAL: ["react component", "sql query", "rest api", "xss attack", "css flexbox", "accounting balance sheet", "siem alert", "html form", "nosql", "redux state"],
    CIVIL: ["react hooks", "sql query", "rest api", "cyber threat", "injection molding", "microcontroller register", "siem", "css styling", "vue component"],
    CHEMICAL: ["react hooks", "sql query", "rest api", "solidworks extrude", "penetration testing", "css grid", "staad pro beam", "pcb routing"],
    ELECTRICAL: ["concrete slump", "civil foundation", "chemical reactor", "accounting debit", "seo keyword", "css flexbox"],
    CYBERSECURITY: [
      "injection molding", "tensile stress strain", "civil foundation", "concrete beam", "distillation column",
      "css flexbox", "css grid", "figma wireframe", "api integration contract", "service boundar", "schema migration",
      "backwards compatib", "react component", "virtual dom", "box model", "webpack bundle", "lighthouse score",
      "frontend component", "database shard", "b-tree index", "redux toolkit", "props drilling", "interface contract",
      "interface contracts", "microservice", "rest api", "graphql api", "orm model", "foreign key constraint", "acid transaction",
      "system performance and long-term maintainability", "component architecture"
    ],
    UIUX: ["kernel driver", "chemical reactor kinetics", "firmware register", "distillation column", "tensile strength curve", "staad pro load"],
    DESIGN: ["kernel driver", "chemical reactor kinetics", "firmware register", "sql query", "microcontroller register"],
    SOFTWARE: ["welding inspection", "concrete slump test", "distillation column", "asphalt compaction", "geotechnical soil bearing", "accounting journal debit"],
    FINANCE: ["react component", "solidworks cad", "concrete beam", "siem event", "packet sniffing", "css flexbox", "microcontroller"],
    HR: ["sql query", "react component", "finite element analysis", "circuit schematics", "distillation column", "packet capture"],
    MARKETING: ["kernel driver", "finite element analysis", "sql foreign key constraint", "pcb trace", "distillation column"],
    HEALTHCARE: ["react component", "solidworks cad", "sql injection", "css grid", "staad pro", "pcb layout"],
    BIOTECH: ["react component", "solidworks extrude", "sql query", "siem alert", "css flexbox", "accounting debit"],
    EDUCATION: ["react hooks", "finite element analysis", "pcb trace", "siem alert", "sql injection"],
    RESEARCH: ["css flexbox", "react hooks", "accounting debit"],
    BUSINESS: ["react component", "circuit schematic", "pcb trace", "packet sniffing"],
    ROBOTICS: ["accounting debit", "seo keyword", "clinical triage"],
    AUTOMOBILE: ["react component", "sql query", "accounting debit"],
    MANUFACTURING: ["react component", "sql query", "siem alert"],
    AEROSPACE: ["react component", "accounting debit", "seo keyword"],
  };

  const forbidden = domainForbiddenTerms[archetype] || [];
  for (const term of forbidden) {
    if (lower.includes(term)) {
      return { valid: false, reason: `Question mentions "${term}" which is incompatible with domain ${archetype}` };
    }
  }

  // Anti-template injection check: Reject questions that tack on raw skill category names into generic patterns
  const rawSkillBadPatterns = [
    /in SIEM Monitoring & Incident Response/i,
    /when managing schema migrations/i,
    /interface contracts/i,
    /resilient APIs/i,
    /service boundaries/i,
    /applied SIEM Monitoring & Incident Response/i,
    /in Threat Analysis & Vulnerability Management/i,
    /applied Threat Analysis & Vulnerability Management/i,
    /engineering trade-offs between system performance and long-term maintainability/i,
    /in (?:SIEM Monitoring|Threat Analysis|Network Security|Zero Trust|Vulnerability Management)[,\s]/i,
    /applied (?:SIEM Monitoring|Threat Analysis|Network Security|Zero Trust|Vulnerability Management)/i,
    /focusing on (?:SIEM Monitoring|Threat Analysis|Network Security|Zero Trust|Vulnerability Management)/i
  ];
  if (archetype === "CYBERSECURITY") {
    for (const pat of rawSkillBadPatterns) {
      if (pat.test(qText)) {
        return { valid: false, reason: `Question contains generic software template phrasing or raw category label injection: ${pat}` };
      }
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
    SOFTWARE_FRONTEND: [
      "html", "css", "javascript", "typescript", "react", "vue", "angular", "dom", "virtual dom", "hooks",
      "state", "props", "context", "redux", "zustand", "tailwind", "bootstrap", "flexbox", "grid", "responsive",
      "media query", "api", "fetch", "axios", "lighthouse", "core web vitals", "lcp", "cls", "accessibility",
      "wcag", "aria", "event listener", "closure", "promise", "async", "await", "browser", "debugging", "devtools",
      "rendering", "bundle", "webpack", "vite", "component", "ui", "ux", "form", "validation", "routing", "router",
      "spa", "ssr", "ssg", "csr", "hydration", "frontend", "web"
    ],
    SOFTWARE_BACKEND: [
      "api", "rest", "graphql", "database", "sql", "nosql", "query", "schema", "postgres", "mongodb",
      "redis", "node", "express", "django", "spring", "fastapi", "golang", "microservice", "jwt", "oauth",
      "auth", "cache", "queue", "kafka", "docker", "scalability", "transaction", "latency", "backend", "endpoint"
    ],
    SOFTWARE_FULLSTACK: [
      "react", "frontend", "backend", "api", "database", "sql", "node", "javascript", "typescript", "css",
      "html", "rest", "graphql", "component", "state", "schema", "full stack", "web", "architecture"
    ],
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
    DESIGN: [
      "design", "visual", "typography", "color", "layout", "figma", "adobe", "illustrator", "photoshop",
      "composition", "branding", "identity", "logo", "vector", "grid", "render", "prototype", "aesthetic",
      "hierarchy", "creative", "style guide", "concept"
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
    ROBOTICS: [
      "robotics", "mechatronics", "kinematics", "actuator", "motor", "sensor", "ros", "motion control",
      "encoder", "servo", "microcontroller", "pid", "trajectory", "inverse kinematics", "automation", "plc"
    ],
    AUTOMOBILE: [
      "automobile", "automotive", "vehicle", "powertrain", "chassis", "engine", "ev", "battery", "bms",
      "suspension", "brake", "transmission", "torque", "can bus", "ecu", "crashworthiness", "aerodynamic"
    ],
    MANUFACTURING: [
      "manufacturing", "production", "lean", "six sigma", "cnc", "machining", "tooling", "assembly",
      "spc", "quality", "tqm", "kaizen", "cycle time", "scrap rate", "oee", "fabrication", "supply chain"
    ],
    BIOTECH: [
      "biotechnology", "biomedical", "molecular", "dna", "rna", "pcr", "cell", "protein", "assay",
      "fermentation", "bioreactor", "bioinformatics", "genomics", "cloning", "gmp", "glp", "culture", "enzyme"
    ],
    HEALTHCARE: [
      "healthcare", "patient", "clinical", "medical", "diagnosis", "treatment", "protocol", "hospital",
      "vital", "triage", "care", "safety", "hipaa", "pathology", "pharmacology", "physician", "nurse"
    ],
    AEROSPACE: [
      "aerospace", "aircraft", "propulsion", "aerodynamic", "avionics", "mach", "thrust", "lift",
      "drag", "airfoil", "flight control", "satellite", "payload", "spacecraft", "composite", "faa"
    ],
    FINANCE: [
      "finance", "financial", "accounting", "balance sheet", "cash flow", "income statement", "audit",
      "tax", "valuation", "ratio", "dcf", "wacc", "ebitda", "ledger", "gaap", "ifrs", "portfolio", "risk", "revenue", "capital", "budget", "variance", "npv", "irr", "hedging", "liquidity", "forensic"
    ],
    MARKETING: [
      "marketing", "campaign", "seo", "sem", "conversion", "funnel", "analytics", "branding", "growth",
      "cac", "ltv", "roas", "content", "social media", "lead", "segmentation", "audience", "ctr", "cpc", "attribution", "a/b testing", "cro"
    ],
    HR: [
      "hr", "human resources", "recruitment", "talent", "onboarding", "performance management", "retention",
      "employee relations", "hiring", "culture", "compensation", "benefits", "labor law", "compliance", "interview",
      "grievance", "harassment", "discrimination", "restructuring", "workforce", "turnover", "burnout", "rif", "enps"
    ],
    RESEARCH: [
      "research", "hypothesis", "experiment", "methodology", "data analysis", "literature", "variable",
      "control group", "statistical", "peer review", "citation", "findings", "sample", "publication",
      "reproducibility", "calibration", "instrumentation", "protocol", "anova", "regression"
    ],
    EDUCATION: [
      "education", "teaching", "curriculum", "pedagogy", "lesson plan", "student", "learning", "assessment",
      "rubric", "classroom", "engagement", "instruction", "differentiation", "academic", "outcome",
      "summative", "formative", "hybrid", "remote", "instructional"
    ],
    BUSINESS: [
      "business", "strategy", "operations", "management", "kpi", "roi", "stakeholder", "process",
      "market analysis", "swot", "resource allocation", "budget", "consulting", "governance", "efficiency",
      "bottleneck", "value chain", "workflow", "initiative", "cost savings", "disruption"
    ],
    DATA_AI: [
      "data", "machine learning", "model", "feature", "training", "neural network", "deep learning",
      "python", "pandas", "pytorch", "tensorflow", "nlp", "classification", "regression", "overfitting",
      "roc-auc", "f1-score", "precision", "recall", "imputation", "drift", "shap", "lime", "hyperparameter"
    ],
    GENERAL_ENGINEERING: [
      "engineering", "technical", "trade-offs", "scalability", "maintainability", "validation", "quality",
      "deliverable", "architecture", "requirements", "troubleshooting", "safety", "standards"
    ]
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
  const primarySkill = allSkills[0] || (archetype === "SOFTWARE_FRONTEND" ? "React.js & Modern JavaScript" : archetype === "SOFTWARE" ? "Modern Web Technologies" : archetype === "CYBERSECURITY" ? "Network Security" : archetype === "MECHANICAL" ? "CAD & Engineering Design" : archetype === "UIUX" ? "UI Component Design" : "Core Technical Fundamentals");
  const secondarySkill = allSkills[1] || allSkills[0] || (archetype === "SOFTWARE_FRONTEND" ? "CSS3, HTML5 & Responsive Layouts" : archetype === "SOFTWARE" ? "Database & API Design" : archetype === "CYBERSECURITY" ? "Incident Response" : archetype === "MECHANICAL" ? "Material Selection & Stress Analysis" : archetype === "UIUX" ? "User Experience & Prototyping" : "Quality Standards & Verification");
  const tertiarySkill = allSkills[2] || allSkills[1] || allSkills[0] || (archetype === "SOFTWARE_FRONTEND" ? "Frontend Performance & Accessibility" : archetype === "SOFTWARE" ? "Testing & Performance" : archetype === "CYBERSECURITY" ? "Threat Modeling" : archetype === "MECHANICAL" ? "GD&T & Manufacturing" : archetype === "UIUX" ? "Design Systems & Accessibility" : "Troubleshooting & Problem Solving");
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
    const q1Text = "Tell me about yourself.";
    return {
      id: 1,
      level: "Basic",
      question: q1Text,
      keyConcepts: ["Self-Introduction", "Background", "Career Goals"],
      hint: `Provide a concise overview of your background, technical skills in ${primarySkill}, and enthusiasm for this ${targetRole} role.`,
      idealAnswer: generateFallbackIdealAnswer(q1Text, "Basic", targetRole, careerField, highlights, jobDescription),
    };
  }

  // Define Extensive Slot-by-Slot Question Pools (50+ variations per domain)
  const domainPools = {
    // -------------------------------------------------------------
    // SOFTWARE / IT -> FRONTEND DEVELOPER
    // -------------------------------------------------------------
    SOFTWARE_FRONTEND: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what is the fundamental difference between the browser's Real DOM and the Virtual DOM in React, and how does reconciliation optimize rendering?`
          : `How do you evaluate component lifecycle, state management, and render performance when designing interactive UI features using ${primarySkill}?`,
        `Explain the CSS Box Model and how "box-sizing: border-box" alters padding, margin, and width calculations in responsive layouts.`,
        `What is the difference between CSS Flexbox (1D) and CSS Grid (2D), and when should you choose one over the other for responsive interfaces?`,
        `Explain JavaScript event bubbling, capturing, and event delegation. How do you attach a single listener to handle events on dynamic child elements?`,
        `What are JavaScript closures, and how do they enable data encapsulation and function factories in modern frontend development?`,
        `Explain the difference between synchronous JavaScript, callback functions, Promises, and async/await syntax when fetching remote API data.`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain how you designed the frontend component architecture, managed UI state, and handled asynchronous data loading?`
          : `Can you describe a challenging frontend project or web application where you built interactive user interfaces using ${primarySkill} from scratch?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what was the most difficult client-side rendering or responsive design bottleneck you encountered and how did you resolve it?`
          : `Can you walk me through how you integrated REST APIs, managed loading spinners, and handled error states in your primary frontend project?`,
        primaryProject
          ? `If you were asked to refactor "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}" to achieve a 100/100 Google Lighthouse performance score, what optimization strategies would you implement?`
          : `How did you approach modular CSS, reusable UI components, and client-side form validation in your main frontend project?`,
        `What trade-offs did you evaluate between using a UI component library (like Tailwind, Bootstrap, or Material UI) versus writing custom CSS in your project?`,
      ],
      slot4: [
        isFresher
          ? `When building mobile-responsive web pages using ${secondarySkill} or CSS frameworks like Bootstrap and Tailwind, how do you manage media queries and fluid breakpoints?`
          : `How do you architect a scalable CSS and UI design system using utility classes, CSS Modules, or Styled Components to prevent specificity conflicts in large codebases?`,
        `How do you ensure seamless cross-browser layout consistency across modern browsers (Chrome, Firefox, Safari, Edge) and handle vendor prefixes or CSS polyfills?`,
        `What strategies do you follow to implement fluid typography and responsive image loading (srcset, picture element, modern formats like WebP/AVIF)?`,
        `How do you build accessible, mobile-first navigation menus and modal dialogs with proper keyboard focus traps and backdrop scroll locking?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. How do you decide between local component state (useState/useReducer), React Context, and external state stores (like Redux Toolkit or Zustand)?`,
        `Explain the rules of React hooks and the precise differences between useEffect, useMemo, and useCallback. How do you prevent stale closures in hook dependencies?`,
        `How do you manage server state, caching, pagination, and optimistic UI updates using client libraries like React Query (TanStack Query) or SWR?`,
        `What is your approach to complex client-side form handling, schema validation (using Zod or Hook Form), and error messaging without causing unnecessary re-renders?`,
      ],
      slot6: [
        isFresher
          ? `Scenario: A React component is re-rendering continuously in an infinite loop, freezing the browser tab. How do you use Chrome DevTools and the React Profiler to isolate the trigger?`
          : `Scenario: A high-traffic landing page experiences poor Core Web Vitals with high Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS). Walk me through your step-by-step diagnostic and optimization workflow.`,
        `Scenario: Users report that client memory usage steadily increases over time when navigating between SPA routes, causing browser sluggishness. How do you track down memory leaks in event listeners, timers, or uncleaned subscriptions?`,
        `Scenario: Your frontend bundle size has grown to over 5MB, causing noticeable page load delays on mobile 4G networks. How do you configure code splitting, dynamic imports (React.lazy/Suspense), and bundle analysis?`,
        `Scenario: An interactive data-grid rendering 5,000 rows causes noticeable input latency and frame drops on user keystrokes. How do you implement list virtualization, debouncing, or Web Workers to maintain 60 FPS?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your frontend experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most significant frontend performance improvement or UI architecture decision you made there?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced frontend architecture challenges as a ${targetRole}?`
          : `In advanced ${targetRole} projects using ${tertiarySkill}, how do you implement WCAG 2.1 AA accessibility standards including ARIA roles, focus management, and screen reader announcements?`,
        `What are the architectural trade-offs between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG), and how does client hydration work?`,
        `How do you implement modern frontend security practices on the client, including XSS prevention, Content Security Policy (CSP), and secure storage of authentication tokens?`,
        `How do you set up automated frontend testing combining unit tests (Jest/Vitest), component testing (React Testing Library), and end-to-end tests (Cypress/Playwright)?`,
      ],
      slot8: [
        `Describe a situation where a UI/UX designer provided a visually complex design that would severely degrade frontend runtime performance. How did you collaborate to find a balanced compromise?`,
        `Tell me about a time when a backend API response schema did not match your frontend UI requirements close to a release deadline. How did you negotiate and adapt the integration?`,
        `Describe a challenging technical disagreement you had with a teammate regarding frontend architecture (e.g. state management or CSS strategy) and how you resolved it collaboratively.`,
        `Tell me about a time you introduced a frontend bug that broke user interaction in production. How did you communicate the issue, roll out a fix, and implement regression tests?`,
        `Describe an experience where you had to refactor a monolithic, poorly structured legacy frontend component into reusable, modular UI elements without introducing visual regressions.`,
      ],
      slot9: [
        isSenior
          ? `Scenario: Immediately after a major deployment, users on mobile Safari report that the primary checkout CTA button is completely unclickable due to an unhandled JavaScript runtime error, causing revenue loss. How do you triage, rollback, fix, and add automated regression guardrails?`
          : `Scenario: A production release introduces a critical React error boundary crash that renders a blank white screen for all logged-in users. How do you contain the crisis, isolate the broken module, and restore service?`,
        `Scenario: An updated third-party analytics script injected into your web application is blocking the main browser thread and causing 10-second page freezes. How do you diagnose, isolate, and asynchronously sandbox third-party scripts?`,
        `Scenario: A critical client-side state synchronization bug causes duplicate form submissions and incorrect shopping cart totals under flaky network conditions. How do you implement idempotency, optimistic locking, and resilient retry logic on the frontend?`,
      ],
    },
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
          ? `What are the core principles of the CIA Triad and Defense-in-Depth, and how do you apply them in enterprise security monitoring?`
          : `How do you construct and tune SIEM correlation rules to distinguish legitimate user activity from advanced persistent threat (APT) reconnaissance?`,
        `What fundamental differences exist between symmetric and asymmetric cryptography, and how do TLS/SSL handshakes secure data in transit?`,
        `How do you align enterprise security architectures with recognized cybersecurity frameworks like NIST CSF, ISO 27001, and CIS Controls?`,
        `What is the difference between vulnerability scanning, risk assessment, and active penetration testing, and when do you employ each?`,
        `How do Public Key Infrastructure (PKI), digital certificates, and certificate revocation lists (CRL/OCSP) maintain trust across enterprise networks?`,
        `What are the security trade-offs between different Multi-Factor Authentication (MFA) mechanisms (such as TOTP, FIDO2/WebAuthn, and push notifications) and how do you defend against MFA fatigue?`,
        `Explain the Principle of Least Privilege (PoLP) and how you design Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC).`,
        `How do you perform DNS security auditing and mitigate common DNS-based threats like DNS tunneling, cache poisoning, and domain hijacking?`
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the main technical security challenge it addressed and your specific contribution?`
          : `Can you describe a challenging security project, lab simulation, or practical implementation where you analyzed network traffic to identify suspicious activity?`,
        `How would you investigate a suspicious authentication pattern in a SIEM that suggests credential abuse or brute-force activity?`,
        `In your security projects, how did you simulate attack vectors (such as brute force, phishing, or port scanning) and validate defensive controls?`,
        `Can you walk me through how you set up log ingestion, parsing, and custom correlation rules for a threat monitoring pipeline in a SIEM?`,
        `In your practical security work, how did you analyze packet captures (PCAPs) in Wireshark or Zeek to isolate anomalous command-and-control (C2) communication?`,
        `Can you describe how you deployed, configured, or tuned Endpoint Detection and Response (EDR) agent policies to detect credential dumping or process injection?`,
        `How would you prioritize vulnerabilities when several critical findings affect systems with different business impacts using CVSS scores and threat intelligence?`,
        `Can you walk me through a security assessment where you evaluated cloud infrastructure configurations (e.g. AWS S3 bucket policies or Azure IAM roles) for security weaknesses?`
      ],
      slot4: [
        isFresher
          ? `How do you analyze suspicious packet captures, authentication logs, and endpoint alerts when investigating an anomaly in a SOC environment?`
          : `Describe your methodology for mitigating OWASP Top 10 vulnerabilities (like SQL injection, XSS, and broken access control) and establishing Zero Trust network architecture.`,
        `How do you perform static and dynamic malware analysis on a suspicious executable or PowerShell script without jeopardizing production environments?`,
        `What methods do you use to map adversary tactics and techniques to the MITRE ATT&CK framework when evaluating detection coverage?`,
        `How do you design and enforce network segmentation and micro-segmentation using Next-Generation Firewalls (NGFW) and software-defined perimeters?`,
        `How do you secure cloud environments and configure Identity and Access Management (IAM) policies following least privilege and Service Control Policies (SCPs)?`,
        `What is your approach to engineering automated Security Orchestration, Automation, and Response (SOAR) playbooks for repetitive alert triage?`,
        `How do you implement and monitor Data Loss Prevention (DLP) controls to prevent unauthorized data exfiltration across endpoints, email, and cloud storage?`
      ],
      slot5: [
        `Can you walk me through a complex scenario where you investigated a suspicious security event or potential intrusion?`,
        `When configuring firewall access control lists (ACLs) or EDR behavioral policies, how do you eliminate false positives without creating detection blind spots?`,
        `How do you conduct credential stuffing and brute-force mitigation using rate limiting, multi-factor authentication (MFA), and risk-based adaptive policies?`,
        `What methodologies and diagnostic tools do you use for proactive threat hunting to detect fileless malware and living-off-the-land binaries (LOLBins)?`,
        `How do you secure continuous integration and continuous deployment (CI/CD) pipelines against software supply chain attacks and secret leakage?`,
        `When monitoring database activity logs, how do you detect unauthorized privilege escalation or anomalous bulk data queries?`,
        `How do you configure Security Information and Event Management (SIEM) index retention, warm/cold tiering, and search performance optimization?`
      ],
      slot6: [
        isFresher
          ? `Scenario: An employee clicks on a suspicious phishing attachment, triggering an endpoint alert. Walk me through your immediate containment and triage steps.`
          : `Scenario: You detect abnormal outbound beaconing traffic and lateral movement on an internal database subnet. How do you execute the incident response lifecycle?`,
        `Scenario: An employee opens a suspected phishing attachment. Walk me through your immediate response, containment, and investigation steps.`,
        `Scenario: Multiple failed SSH/RDP login attempts followed by a successful privileged login originate from an unknown foreign IP address outside business hours. How do you respond?`,
        `Scenario: An internal vulnerability scan reveals an unpatched Remote Code Execution (RCE) flaw on a mission-critical web server that cannot be rebooted immediately. How do you apply compensating controls?`,
        `Scenario: A sudden spike in failed API authentication requests indicates an ongoing distributed credential stuffing attack against the customer login portal. How do you mitigate the attack?`,
        `Scenario: An endpoint alerts on anomalous PowerShell execution attempting to invoke Mimikatz in memory. Walk me through your step-by-step containment, volatile memory preservation, and eradication workflow.`,
        `Scenario: A high-volume DDoS flood threatens external firewall and DNS service availability. How do you coordinate traffic scrubbing, rate limiting, and upstream provider mitigation?`
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful security enhancement or technical accomplishment from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced technical challenges as a ${targetRole}?`
          : `How do you keep your technical skills current with emerging zero-day exploits, threat intelligence feeds, and defensive toolkits?`,
        `Describe how you create, document, and maintain incident response playbooks and standard operating procedures (SOPs) for a Security Operations Center (SOC).`,
        `How do you integrate Threat Intelligence Platforms (TIP) to automatically enrich SIEM alerts with Indicators of Compromise (IOCs) and calculate threat fidelity scores?`,
        `How do you conduct purple-team adversary emulation exercises to validate blue-team detection engineering rules and close visibility gaps?`,
        `How do you align enterprise security monitoring and audit logging with regulatory compliance mandates like PCI-DSS, HIPAA, SOC 2 Type II, and GDPR?`
      ],
      slot8: [
        `Describe a challenging technical disagreement or unexpected roadblock you encountered while working on a ${targetRole} project and how you resolved it using data.`,
        `Tell me about a time you had to balance strict security policies against engineering team productivity and how you reached a pragmatic compromise.`,
        `Describe a high-pressure situation where you had to communicate a potential security risk or incident to non-technical executives.`,
        `Tell me about a time you identified a critical security vulnerability or configuration flaw before production deployment and convinced the team to remediate it.`,
        `Describe a situation where an unexpected security alert disrupted your planned workflow during an on-call rotation and how you prioritized multiple competing tasks.`
      ],
      slot9: [
        `Scenario: An enterprise ransomware outbreak or active data exfiltration event is detected across production servers. How do you lead isolation, forensic evidence preservation, eradication, and post-incident reporting?`,
        `Scenario: An unauthorized insider is suspected of dumping sensitive customer records from a backend database. How do you conduct covert forensic auditing while maintaining chain of custody?`,
        `Scenario: A critical zero-day remote code execution exploit in an enterprise perimeter VPN gateway is published with active in-the-wild exploitation. Walk through your emergency perimeter triage and containment plan.`,
        `Scenario: An AWS/Azure administrative service account key is accidentally committed to a public code repository. How do you execute emergency credential revocation, session termination, and audit trail reconstruction?`
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
    // FINANCE / ACCOUNTING / BANKING
    // -------------------------------------------------------------
    FINANCE: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, how do you analyze the interrelationships between the Balance Sheet, Income Statement, and Cash Flow Statement?`
          : `How do you construct robust discounted cash flow (DCF) models, WACC estimations, and sensitivity analyses when evaluating transactions in ${primarySkill}?`,
        `What key financial ratios (liquidity, solvency, profitability) do you prioritize when evaluating corporate fiscal health in ${primarySkill}?`,
        `How do you ensure strict compliance with GAAP/IFRS standards and internal controls when preparing financial reports in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the financial models, valuation methods, or variance analysis you performed and your specific contribution?`
          : `Can you describe a challenging financial analysis, budgeting model, or valuation project where you applied ${primarySkill} from data gathering to final recommendations?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what fiscal risks or forecast variances did you identify and how did you mitigate them?`
          : `Can you walk me through the financial statement modeling and working capital optimization choices you made in your primary project using ${primarySkill}?`,
      ],
      slot4: [
        `How do you conduct comprehensive budget variance analysis and capital budgeting (NPV/IRR) using ${secondarySkill}?`,
        `When auditing general ledgers or month-end close schedules in ${secondarySkill}, how do you ensure reconciliation accuracy and detect irregularities?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where your financial forecasting or cost-benefit analysis directly influenced an executive business decision?`,
        `How do you model macroeconomic risk factors, interest rate volatility, and currency hedging strategies in ${tertiarySkill}?`,
      ],
      slot6: [
        `Scenario: A mid-quarter financial audit reveals an unexplained 15% discrepancy between inventory valuations and general ledger accounts. How do you investigate the discrepancy?`,
        `Scenario: Cash flow projections indicate a severe liquidity shortfall within 60 days despite strong reported accounting profits. How do you diagnose working capital bottlenecks?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful financial accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced financial challenges as a ${targetRole}?`
          : `How do you stay abreast of evolving tax regulations, ESG reporting mandates, and SEC/IFRS accounting standard updates as a ${targetRole}?`,
      ],
      slot8: [
        `Describe a challenging situation where department heads pushed back against budget cuts or fiscal constraints and how you used financial data to reach consensus.`,
      ],
      slot9: [
        `Scenario: An unexpected liquidity crisis or forensic accounting irregularity is uncovered right before annual earnings release. How do you lead crisis containment, audit reconciliation, and stakeholder disclosure?`,
      ],
    },

    // -------------------------------------------------------------
    // MARKETING / SALES / GROWTH
    // -------------------------------------------------------------
    MARKETING: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, how do you define target audience personas, map the customer acquisition funnel, and measure conversion metrics?`
          : `How do you optimize multi-channel marketing attribution, customer acquisition cost (CAC), and customer lifetime value (LTV) across digital campaigns in ${primarySkill}?`,
        `What data analytics and A/B testing methodologies do you rely on when optimizing landing pages and campaign creatives in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the campaign objectives, channel strategy, and measurable ROI you achieved?`
          : `Can you describe a successful marketing campaign, launch strategy, or growth experiment where you applied ${primarySkill} from conception to execution?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what audience conversion hurdles did you encounter and how did you resolve them?`
          : `How did you structure audience segmentation, ad spend allocation, and tracking pixels in your primary marketing project?`,
      ],
      slot4: [
        `How do you design and execute organic SEO and paid performance marketing (SEM/PPC) strategies using ${secondarySkill}?`,
        `When architecting email nurture flows, CRM segmentation, and marketing automation in ${secondarySkill}, how do you maximize engagement without increasing churn?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where you scaled audience reach or turned around an underperforming campaign?`,
        `When evaluating marketing analytics dashboards and multi-touch attribution models in ${tertiarySkill}, what optimization techniques do you apply?`,
      ],
      slot6: [
        `Scenario: A core digital ad campaign experiences a 40% surge in CAC and a steep drop in click-through rates over a two-week period. How do you diagnose ad fatigue, bidding saturation, or audience decay?`,
        `Scenario: A major brand campaign triggers unexpected negative social sentiment. Walk me through your crisis communication, PR containment, and campaign adjustment plan.`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful growth achievement or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced marketing challenges as a ${targetRole}?`
          : `How do you evaluate emerging marketing channels (such as AI-driven personalization and short-form video) to determine whether they align with your brand's growth strategy?`,
      ],
      slot8: [
        `Describe a time when you had to align conflicting sales and marketing priorities regarding lead quality versus lead volume.`,
      ],
      slot9: [
        `Scenario: A public relations crisis threatens brand reputation during a major product rollout. How do you coordinate messaging, halt scheduled campaigns, and rebuild consumer trust?`,
      ],
    },

    // -------------------------------------------------------------
    // HUMAN RESOURCES / TALENT ACQUISITION
    // -------------------------------------------------------------
    HR: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what foundational principles guide your candidate sourcing, structured interviewing, and onboarding processes?`
          : `How do you design strategic workforce planning, compensation benchmarking, and employee retention programs in ${primarySkill}?`,
        `How do you ensure equitable talent acquisition practices and strict compliance with employment law regulations in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the talent acquisition or organizational initiative you led and its measurable impact?`
          : `Can you describe an HR initiative, recruitment drive, or culture program where you applied ${primarySkill} to solve an organizational challenge?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what employee engagement hurdles did you address and how did you resolve them?`
          : `How did you design candidate evaluation scorecards and structured behavioral interviews in your primary HR project?`,
      ],
      slot4: [
        `How do you structure performance management cycles, 360-degree reviews, and employee development frameworks in ${secondarySkill}?`,
        `When managing employee relations and conflict mediation in ${secondarySkill}, what objective investigation procedures do you follow?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex employee grievance or organizational restructuring scenario you managed?`,
        `When monitoring HR metrics (eNPS, retention curves, time-to-hire) in ${tertiarySkill}, what proactive strategies do you deploy?`,
      ],
      slot6: [
        `Scenario: High turnover is identified within a critical technical department, accompanied by reports of managerial burnout. How do you diagnose root causes and implement intervention strategies?`,
        `Scenario: An employee files a formal harassment or discrimination complaint against a high-performing senior executive. Walk through your confidential investigation and documentation process.`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful people accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced human resource challenges as a ${targetRole}?`
          : `How do you leverage HR metrics and analytics (such as eNPS, time-to-hire, offer acceptance rate, and retention curves) to drive executive decision-making?`,
      ],
      slot8: [
        `Describe a time you had to coach a resistant manager on delivering difficult performance feedback constructively.`,
      ],
      slot9: [
        `Scenario: An organizational restructuring or reduction in force (RIF) must be executed on a tight timeline. How do you lead compassionate, legally compliant communications and workforce transition?`,
      ],
    },

    // -------------------------------------------------------------
    // HEALTHCARE / CLINICAL / MEDICAL
    // -------------------------------------------------------------
    HEALTHCARE: {
      slot2: [
        isFresher
          ? `What core clinical protocols, patient assessment frameworks, and safety guidelines form the foundation of your practice in ${primarySkill}?`
          : `How do you manage complex clinical decision-making, patient triage, and multi-disciplinary care coordination in ${primarySkill}?`,
        `How do you maintain rigorous infection control, medical documentation accuracy, and HIPAA regulatory compliance in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your background that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the clinical protocol, care improvement initiative, or healthcare project and your specific contribution?`
          : `Can you describe a clinical case, patient care scenario, or healthcare initiative where you applied ${primarySkill} to achieve positive patient outcomes?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what patient care challenges did you manage and how did you resolve them?`
          : `How did you coordinate patient assessments, diagnostic reviews, and care plans in your primary clinical project?`,
      ],
      slot4: [
        `How do you handle diagnostic evaluations, medication administration safety, and emergency response protocols in ${secondarySkill}?`,
        `When coordinating patient discharge planning and family education in ${secondarySkill}, how do you ensure continuity of care?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where your rapid clinical assessment prevented patient deterioration?`,
        `When auditing clinical quality indicators and patient safety metrics in ${tertiarySkill}, what improvements do you enforce?`,
      ],
      slot6: [
        `Scenario: A patient in your care displays sudden vital sign instability and acute respiratory distress. Walk me through your step-by-step triage and clinical intervention workflow.`,
        `Scenario: An electronic health record (EHR) outage occurs during peak clinical rounds. How do you maintain safe medication reconciliation and patient handover?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful clinical accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to deliver high-quality healthcare as a ${targetRole}?`
          : `How do you integrate evidence-based medicine and updated clinical practice guidelines into daily healthcare delivery as a ${targetRole}?`,
      ],
      slot8: [
        `Describe an emotionally demanding patient or family interaction and how you communicated with empathy, clarity, and professionalism.`,
      ],
      slot9: [
        `Scenario: A critical medical emergency or mass-casualty incident tests hospital resources and triage protocols. How do you lead rapid prioritization, resource allocation, and patient safety?`,
      ],
    },

    // -------------------------------------------------------------
    // BIOTECHNOLOGY / BIOMEDICAL
    // -------------------------------------------------------------
    BIOTECH: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what core molecular biology techniques (such as PCR, electrophoresis, and aseptic culture) form the basis of your experimental work?`
          : `How do you optimize bioprocess scale-up, fermentation kinetics, and recombinant protein expression in ${primarySkill}?`,
        `How do you ensure strict Good Laboratory Practice (GLP) and Good Manufacturing Practice (GMP) compliance when executing assays in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the experimental design, assay validation, or analytical methods you used and your specific results?`
          : `Can you describe a biotechnology laboratory project, capstone, or assay optimization study where you applied ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what bio-analytical bottlenecks did you overcome?`
          : `How did you validate cell culture viability and protein yield in your primary biotechnology project?`,
      ],
      slot4: [
        `How do you design chromatography purification protocols and spectrophotometric quality assays using ${secondarySkill}?`,
        `When analyzing genomic or proteomic datasets in ${secondarySkill}, what statistical validation standards do you apply?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where you troubleshot assay variability or cell culture contamination?`,
        `When calibrating bio-analytical instrumentation (HPLC, Mass Spec, Flow Cytometry) in ${tertiarySkill}, what controls do you maintain?`,
      ],
      slot6: [
        `Scenario: A high-value bioreactor batch exhibits unexpected pH drift and foaming during exponential cell growth. Walk through your diagnostic and remediation steps.`,
        `Scenario: An analytical HPLC assay produces split peaks and shifting retention times during batch release testing. How do you troubleshoot the column and mobile phase?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful laboratory breakthrough or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced biotechnology challenges as a ${targetRole}?`
          : `How do you stay current with emerging biotech methodologies (such as CRISPR gene editing, mRNA synthesis, or single-cell sequencing) as a ${targetRole}?`,
      ],
      slot8: [
        `Describe a situation where experimental data directly contradicted your initial scientific hypothesis and how you pivoted your research methodology.`,
      ],
      slot9: [
        `Scenario: A critical sterility breach or cross-contamination is detected in a clinical-grade manufacturing cleanroom. How do you lead quarantine, root cause investigation, and corrective action (CAPA)?`,
      ],
    },

    // -------------------------------------------------------------
    // DESIGN / CREATIVE / GRAPHIC / BRAND
    // -------------------------------------------------------------
    DESIGN: {
      slot2: [
        isFresher
          ? `What core design fundamentals (typography, grid systems, color theory, visual hierarchy) guide your creative work in ${primarySkill}?`
          : `How do you establish cohesive brand identity systems, design guidelines, and cross-medium visual assets using ${primarySkill}?`,
        `How do you balance aesthetic originality with practical production constraints across print, digital, and environmental media in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your portfolio/resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the creative brief, design concept, and execution process?`
          : `Can you walk me through a major design project or brand identity campaign where you applied ${primarySkill} from concept sketches to final assets?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what visual hierarchy or composition challenges did you overcome?`
          : `How did you manage style guides and design asset pipelines in your primary design project?`,
      ],
      slot4: [
        `How do you organize design assets, vector libraries, and style guides in ${secondarySkill} to streamline collaboration with cross-functional teams?`,
        `When preparing production-ready artwork in ${secondarySkill}, how do you manage color profiles (CMYK vs RGB), resolution, and asset export specifications?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where your visual design strategy revitalized a brand or product?`,
        `When conducting visual design audits and asset optimization in ${tertiarySkill}, what quality standards do you apply?`,
      ],
      slot6: [
        `Scenario: A client provides vague, contradictory creative feedback that conflicts with established brand guidelines. How do you interpret stakeholder needs and present revised concepts?`,
        `Scenario: A final design asset renders with inconsistent color shifts across digital platforms and physical packaging. How do you diagnose and standardize color management?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful creative accomplishment from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced visual design challenges as a ${targetRole}?`
          : `How do you incorporate accessibility, ethical design principles, and cultural inclusivity into your visual creative work as a ${targetRole}?`,
      ],
      slot8: [
        `Describe a time when a stakeholder rejected your preferred creative direction and how you negotiated a solution that preserved design integrity.`,
      ],
      slot9: [
        `Scenario: A major brand relaunch asset contains a trademark or copyright conflict discovered hours before public release. How do you rapidly redesign and deploy replacement creative?`,
      ],
    },

    // -------------------------------------------------------------
    // MECHATRONICS / ROBOTICS
    // -------------------------------------------------------------
    ROBOTICS: {
      slot2: [
        isFresher
          ? `What core kinematics, sensor interfacing, and motor control principles do you prioritize when developing robotic systems in ${primarySkill}?`
          : `How do you formulate forward/inverse kinematics, trajectory planning, and closed-loop PID control algorithms in ${primarySkill}?`,
        `How do you integrate sensor fusion (IMU, LiDAR, encoders, vision) to achieve accurate robot state estimation in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the robotic hardware/software architecture and your specific contribution?`
          : `Can you describe an autonomous robotics or mechatronics project where you applied ${primarySkill} from hardware assembly to software control?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what control stability or sensor calibration hurdles did you overcome?`
          : `How did you validate motor torque curves and sensor communication bus speeds in your primary robotics project?`,
      ],
      slot4: [
        `How do you structure Robot Operating System (ROS/ROS2) nodes, message passing, and real-time middleware in ${secondarySkill}?`,
        `When designing motor drive circuits, H-bridges, and power management in ${secondarySkill}, how do you prevent inductive voltage spikes?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you tuned control loop stability or resolved sensor noise?`,
        `When debugging autonomous navigation algorithms (SLAM, path planning) in ${tertiarySkill}, what diagnostic tools do you use?`,
      ],
      slot6: [
        `Scenario: An autonomous mobile robot experiences wheel slippage and severe odometry drift in a GPS-denied environment. How do you implement SLAM and sensor fusion corrections?`,
        `Scenario: A robotic manipulator arm exhibits sudden oscillation and joint overshoot near singular configurations. How do you diagnose the Jacobian matrix and damp resonance?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful robotics accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced mechatronics challenges as a ${targetRole}?`
          : `How do you balance real-time operating system (RTOS) latency constraints with high-level perception algorithms in embedded robotics?`,
      ],
      slot8: [
        `Describe a time you had to resolve a difficult hardware-software integration bug where it was unclear whether the fault was in firmware or mechanical tolerances.`,
      ],
      slot9: [
        `Scenario: An industrial robotic cell encounters an emergency stop (E-stop) interlock failure during high-speed operation. How do you execute safety containment, fail-safe braking, and ISO 10218 compliance audit?`,
      ],
    },

    // -------------------------------------------------------------
    // AUTOMOBILE ENGINEERING
    // -------------------------------------------------------------
    AUTOMOBILE: {
      slot2: [
        isFresher
          ? `What core automotive engineering principles (powertrain mechanics, chassis dynamics, thermal management) guide your work in ${primarySkill}?`
          : `How do you evaluate vehicle longitudinal/lateral dynamics, suspension kinematics, and regenerative braking efficiency in ${primarySkill}?`,
        `What standards (such as ISO 26262 functional safety and OBD-II diagnostics) do you enforce when designing automotive systems in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the automotive component design, simulation, or testing you conducted and your specific results?`
          : `Can you describe an automotive engineering project or Formula Student/SAE vehicle design where you applied ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what vehicle dynamic or thermal management hurdles did you overcome?`
          : `How did you calculate gear ratios, brake thermal capacities, or suspension spring rates in your primary automotive project?`,
      ],
      slot4: [
        `How do you design Electronic Control Unit (ECU) communication architectures and CAN/LIN bus networks using ${secondarySkill}?`,
        `When designing high-voltage EV battery packs and Battery Management Systems (BMS) in ${secondarySkill}, how do you ensure thermal runaway prevention?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you optimized powertrain efficiency or vehicle aerodynamics?`,
        `When configuring automotive dynamometer test benches and telemetry loggers in ${tertiarySkill}, what is your testing methodology?`,
      ],
      slot6: [
        `Scenario: An electric vehicle powertrain exhibits unexpected inverter thermal throttling and torque derating during high-speed acceleration testing. How do you diagnose cooling loop flow and IGBT switching losses?`,
        `Scenario: Severe steering wheel shimmy and brake judder occur during vehicle dynamic coast-down testing. Walk through your chassis diagnostic workflow.`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful automotive accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced automotive engineering challenges as a ${targetRole}?`
          : `How do you bridge CAD/CAE simulations (crashworthiness, CFD, NVH) with real-world automotive proving ground testing?`,
      ],
      slot8: [
        `Describe a time when you had to balance strict vehicle weight reduction targets against crash safety and manufacturing cost constraints.`,
      ],
      slot9: [
        `Scenario: A critical steering or braking component exhibits micro-cracking during 100,000-mile endurance validation. How do you lead root cause analysis, supplier containment, and recall prevention?`,
      ],
    },

    // -------------------------------------------------------------
    // AEROSPACE ENGINEERING
    // -------------------------------------------------------------
    AEROSPACE: {
      slot2: [
        isFresher
          ? `What fundamental aerodynamic principles (lift, drag, airfoil camber, boundary layer separation) govern your engineering calculations in ${primarySkill}?`
          : `How do you evaluate supersonic/subsonic aerodynamics, aeroelastic flutter, and propulsion thermodynamic cycles in ${primarySkill}?`,
        `How do you apply FAA/EASA airworthiness standards and structural safety factors when selecting aerospace materials in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the aerodynamic simulation, avionics integration, or flight testing you performed?`
          : `Can you describe an aerospace engineering project or UAV/spacecraft design where you applied ${primarySkill} from mission requirements to validation?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what flight dynamic or structural weight challenges did you resolve?`
          : `How did you validate aerodynamic lift-to-drag ratios and structural stability in your primary aerospace project?`,
      ],
      slot4: [
        `How do you model flight dynamics, stability derivatives, and fly-by-wire flight control laws using ${secondarySkill}?`,
        `When designing lightweight carbon-fiber composite layups and honeycomb sandwich panels in ${secondarySkill}, how do you evaluate delamination risk?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where you resolved an aerodynamic instability or thermal barrier challenge?`,
        `When analyzing CFD flow fields and shock wave propagation in ${tertiarySkill}, what convergence criteria do you enforce?`,
      ],
      slot6: [
        `Scenario: Wind tunnel or CFD testing reveals sudden shock-induced boundary layer separation at high angles of attack. How do you modify wing leading-edge vortex generators or camber?`,
        `Scenario: Flight telemetry shows intermittent avionics bus packet drops and sensor drift during high-G maneuvers. Walk through your telemetry diagnostic steps.`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful aerospace accomplishment or lesson from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced aerospace challenges as a ${targetRole}?`
          : `How do you balance payload capacity, fuel fraction, and structural margin of safety in advanced aerospace vehicle design?`,
      ],
      slot8: [
        `Describe a time when you had to defend a safety-critical aerospace design change that increased project weight or manufacturing timeline.`,
      ],
      slot9: [
        `Scenario: An uncontained engine rotor failure or flight control surface jam is simulated during certification flight testing. How do you lead fault-tree analysis, redundant backup verification, and FAA compliance sign-off?`,
      ],
    },

    // -------------------------------------------------------------
    // PRODUCTION / MANUFACTURING
    // -------------------------------------------------------------
    MANUFACTURING: {
      slot2: [
        isFresher
          ? `What core manufacturing methodologies (CNC machining, injection molding, sheet metal forming, quality inspection) guide your work in ${primarySkill}?`
          : `How do you optimize Overall Equipment Effectiveness (OEE), cycle times, and cellular manufacturing layouts using Lean Six Sigma in ${primarySkill}?`,
        `How do you implement Statistical Process Control (SPC), control charts (X-bar & R), and process capability indices (Cp/Cpk) in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the manufacturing process optimization, tooling design, or scrap reduction you achieved?`
          : `Can you describe a production engineering project or assembly line design where you applied ${primarySkill} to enhance throughput and quality?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what bottleneck or scrap rate issues did you resolve?`
          : `How did you optimize takt time and line balancing in your primary manufacturing project?`,
      ],
      slot4: [
        `How do you design high-precision jigs, fixtures, and automated assembly tooling in ${secondarySkill} to minimize operator ergonomics issues and cycle bottlenecks?`,
        `When implementing Total Productive Maintenance (TPM) and Poke-Yoke (mistake-proofing) in ${secondarySkill}, what strategies ensure zero defects?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where you reduced manufacturing lead times or resolved a severe bottleneck?`,
        `When conducting Root Cause Analysis (8D, Ishikawa, 5 Whys) for recurring quality defects in ${tertiarySkill}, what methodology do you follow?`,
      ],
      slot6: [
        `Scenario: A high-speed CNC milling line begins producing out-of-spec dimensions with high surface roughness halfway through a production shift. How do you diagnose tool wear, spindle runout, or thermal expansion?`,
        `Scenario: A major automated assembly cell experiences intermittent robotic jamming, dropping production yield below 85%. Walk through your troubleshooting workflow.`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful manufacturing achievement from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced production challenges as a ${targetRole}?`
          : `How do you balance automation capital expenditures (CapEx) against labor flexibility and product lifecycle changes in modern manufacturing?`,
      ],
      slot8: [
        `Describe a time when you had to implement a major manufacturing process change on the plant floor and how you overcame operator resistance.`,
      ],
      slot9: [
        `Scenario: A batch of 50,000 finished components fails final quality audit due to a supplier raw material hardness defect. How do you lead containment, supplier chargeback, and production rescheduling?`,
      ],
    },

    // -------------------------------------------------------------
    // RESEARCH / SCIENTIFIC INQUIRY
    // -------------------------------------------------------------
    RESEARCH: {
      slot2: [
        isFresher
          ? `What core scientific research methodologies (hypothesis formulation, controlled variables, literature synthesis) guide your investigations in ${primarySkill}?`
          : `How do you design rigorous experimental methodologies, control for confounding variables, and conduct multivariate statistical analysis in ${primarySkill}?`,
        `How do you ensure data integrity, reproducibility, and ethical research compliance when conducting studies in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your background that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the scientific hypothesis, research methodology, and novel findings you generated?`
          : `Can you describe a challenging scientific research project or academic study where you applied ${primarySkill} from initial literature review to data interpretation?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what experimental hurdles or anomalous data did you investigate?`
          : `How did you determine sample sizes, confidence intervals, and statistical significance in your primary research project?`,
      ],
      slot4: [
        `How do you apply quantitative data analysis tools and statistical modeling (ANOVA, regression, p-value validation) using ${secondarySkill}?`,
        `When reviewing scientific literature and synthesizing peer-reviewed publications in ${secondarySkill}, what criteria determine study credibility?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where your research findings uncovered an unexpected pattern or breakthrough?`,
        `When managing laboratory data logging, versioning, and open-science repositories in ${tertiarySkill}, what standards do you enforce?`,
      ],
      slot6: [
        `Scenario: Experimental results across three laboratory trial batches show high variance and low statistical reproducibility. How do you systematically isolate protocol deviations and instrumental calibration drift?`,
        `Scenario: A primary analytical instrument suffers baseline drift during a critical longitudinal study. How do you validate existing data and recalibrate the system?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful scientific insight from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to conduct rigorous scientific research as a ${targetRole}?`
          : `How do you translate complex, novel academic research findings into practical industrial or commercial applications as a ${targetRole}?`,
      ],
      slot8: [
        `Describe a time when peer reviewers or research advisors offered severe critique on your experimental design and how you refined your methodology.`,
      ],
      slot9: [
        `Scenario: Discrepancies in research data are detected right before publication submission. How do you lead forensic data auditing, verify lab notebooks, and protect research integrity?`,
      ],
    },

    // -------------------------------------------------------------
    // EDUCATION / TEACHING / ACADEMIA
    // -------------------------------------------------------------
    EDUCATION: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what foundational pedagogical strategies, lesson planning models, and classroom management techniques form your teaching philosophy?`
          : `How do you design comprehensive curriculum maps, differentiated instructional frameworks, and learning outcome assessments in ${primarySkill}?`,
        `How do you incorporate active learning methodologies, inquiry-based projects, and educational technology into ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the curriculum design, student engagement initiative, or learning program and its measurable outcomes?`
          : `Can you describe an instructional unit, teaching module, or academic program you developed and delivered using ${primarySkill}?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what student engagement challenges did you overcome?`
          : `How did you adapt learning materials for varying student aptitude levels in your primary educational project?`,
      ],
      slot4: [
        `How do you design formative and summative assessments, diagnostic rubrics, and feedback loops in ${secondarySkill} to measure student mastery?` ,
        `When accommodating diverse learning styles, IEPs (Individualized Education Programs), and English Language Learners (ELL) in ${secondarySkill}, what differentiation strategies do you apply?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where your instructional intervention helped an underperforming student achieve academic success?`,
        `When integrating educational software and digital learning analytics in ${tertiarySkill}, how do you evaluate pedagogical efficacy?`,
      ],
      slot6: [
        `Scenario: Mid-semester assessment data reveals that 40% of students have failed to grasp a foundational concept. How do you re-teach, adjust pacing, and scaffold learning without derailing the syllabus?`,
        `Scenario: Persistent disengagement and disruptive classroom behavior emerge among a subset of learners. Walk through your restorative classroom management plan.`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful teaching accomplishment from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to deliver rigorous educational instruction as a ${targetRole}?`
          : `How do you leverage educational data analytics and standardized learning benchmarks to iteratively improve curriculum rigor as an educator?`,
      ],
      slot8: [
        `Describe a challenging interaction with a parent or academic administrator regarding student grading or curriculum standards and how you communicated constructively.`,
      ],
      slot9: [
        `Scenario: A sudden transition to remote/hybrid learning or major school policy shift occurs mid-term. How do you adapt instructional delivery, maintain student engagement, and support vulnerable learners?`,
      ],
    },

    // -------------------------------------------------------------
    // BUSINESS / MANAGEMENT / OPERATIONS
    // -------------------------------------------------------------
    BUSINESS: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what fundamental business analysis frameworks (SWOT, Porter's Five Forces, stakeholder mapping) guide your strategic thinking?`
          : `How do you lead cross-functional strategic planning, process optimization, and KPI alignment across business units in ${primarySkill}?`,
        `How do you evaluate business case viability, ROI, and resource allocation trade-offs when initiating new projects in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the business problem, strategy formulated, and bottom-line impact achieved?`
          : `Can you describe a major business project, market analysis, or operational transformation where you applied ${primarySkill} from strategy to execution?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what operational bottlenecks or change management hurdles did you resolve?`
          : `How did you align financial budgets, milestone tracking, and stakeholder reporting in your primary business project?`,
      ],
      slot4: [
        `How do you map operational workflows, identify value chain bottlenecks, and implement continuous process improvements using ${secondarySkill}?`,
        `When building executive financial models, cost-benefit analyses, and risk matrices in ${secondarySkill}, how do you ensure assumption accuracy?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a scenario where your business analysis or strategic recommendation delivered measurable revenue growth or cost savings?`,
        `When monitoring business intelligence dashboards and operational KPIs in ${tertiarySkill}, what metrics dictate corrective intervention?`,
      ],
      slot6: [
        `Scenario: A key strategic initiative is running 30% over budget and 2 months behind schedule due to shifting scope and vendor bottlenecks. How do you restructure project governance and deliver results?`,
        `Scenario: A competitor launches a disruptive product offering that cuts into your market share. How do you lead market analysis and formulate an operational response?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful business leadership accomplishment from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve complex business challenges as a ${targetRole}?`
          : `How do you bridge the gap between high-level executive strategy and day-to-day front-line execution as a ${targetRole}?`,
      ],
      slot8: [
        `Describe a time when you had to manage conflicting priorities between executive stakeholders with divergent business agendas.`,
      ],
      slot9: [
        `Scenario: A critical supply chain disruption or operational crisis threatens delivery to core enterprise clients. How do you lead crisis triage, resource reallocation, and executive communication?`,
      ],
    },

    // -------------------------------------------------------------
    // DATA SCIENCE & ARTIFICIAL INTELLIGENCE
    // -------------------------------------------------------------
    DATA_AI: {
      slot2: [
        isFresher
          ? `In ${primarySkill}, what fundamental machine learning principles (bias-variance trade-off, regularization, cross-validation) guide your modeling workflow?`
          : `How do you architect end-to-end machine learning pipelines, feature stores, and model monitoring architectures in ${primarySkill}?`,
        `How do you evaluate classification/regression metrics (ROC-AUC, Precision-Recall, F1-score, RMSE) when tuning models in ${primarySkill}?`,
      ],
      slot3: [
        primaryProject
          ? `I can see from your resume that you worked on "${primaryProject.length > 65 ? primaryProject.slice(0, 65) + '...' : primaryProject}". Can you explain the data engineering, modeling architecture, and measurable performance you achieved?`
          : `Can you describe a data science or machine learning project where you applied ${primarySkill} from raw data preprocessing to model deployment?`,
        secondProject
          ? `In your work on "${secondProject.length > 65 ? secondProject.slice(0, 65) + '...' : secondProject}", what feature engineering or overfitting hurdles did you overcome?`
          : `How did you validate training/testing data splits and hyperparameter optimization in your primary data science project?`,
      ],
      slot4: [
        `How do you handle data preprocessing, missing value imputation, and automated feature engineering in ${secondarySkill}?`,
        `When deploying machine learning models into production using ${secondarySkill}, how do you monitor for data drift and concept drift?`,
      ],
      slot5: [
        `Your profile highlights your experience with ${secondarySkill}. Can you walk me through a complex scenario where you tuned hyperparameters or resolved model overfitting?`,
        `When evaluating neural network architectures and loss functions in ${tertiarySkill}, what design decisions do you prioritize?`,
      ],
      slot6: [
        `Scenario: A deployed machine learning model experiences sudden degradation in prediction accuracy on live traffic due to upstream schema changes and feature drift. How do you diagnose and retrain?`,
        `Scenario: Highly imbalanced training data causes severe false-negative rates in a critical fraud detection model. How do you apply sampling, loss weighting, or threshold tuning?`,
      ],
      slot7: [
        primaryExp
          ? `Your resume mentions your experience with "${primaryExp.length > 60 ? primaryExp.slice(0, 60) + '...' : primaryExp}". What was the most impactful data science insight or model from that role?`
          : primaryEdu
          ? `How did your academic background and coursework in "${primaryEdu}" prepare you to solve advanced data science challenges as a ${targetRole}?`
          : `How do you ensure model explainability (SHAP/LIME), ethical AI compliance, and data privacy in production ML systems?`,
      ],
      slot8: [
        `Describe a time when you had to explain complex machine learning model decisions and trade-offs to non-technical business stakeholders.`,
      ],
      slot9: [
        `Scenario: A critical AI inference service suffers latency spikes and Out-of-Memory (OOM) GPU crashes during high-throughput requests. How do you optimize batching, quantization, and auto-scaling?`,
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

  // 2. Domain-Aware Dynamic Fallback Generator (No generic template injection)
  const dynamicSkill = primarySkill || (archetype === "CYBERSECURITY" ? "Threat Analysis and Vulnerability Management" : archetype === "SOFTWARE_FRONTEND" ? "React.js and Modern Frontend Architecture" : archetype === "SOFTWARE" ? "Database Architecture and API Integration" : "Core Technical Fundamentals");
  let domainDynamicQuestions = {};
  if (archetype === "CYBERSECURITY") {
    domainDynamicQuestions = {
      2: [
        `What fundamental security principles, cryptographic mechanisms, or defense frameworks (such as NIST CSF or ISO 27001) guide your daily security analysis?`,
        `How do you construct and tune security monitoring rules in a SIEM to distinguish legitimate user behavior from adversary reconnaissance?`,
        `What core access control models (like RBAC vs ABAC) and least privilege principles do you apply when securing enterprise identities and assets?`,
        `When evaluating network traffic, how do you differentiate between benign operational anomalies and stealthy command-and-control (C2) beaconing?`
      ],
      3: [
        `In your practical security work, what key detection engineering decisions and log ingestion pipelines did you build to capture critical telemetry?`,
        `Can you walk me through a complex threat detection workflow or packet analysis investigation where you analyzed PCAPs using tools like Wireshark or Zeek?`,
        `How did you perform vulnerability triage, CVSS scoring, and remediation validation on a major system vulnerability assessment project?`,
        `What specific methods and tooling did you use to test defensive controls against simulated adversary techniques like brute force or port scanning?`
      ],
      4: [
        `How do you map adversary tactics, techniques, and procedures (TTPs) to the MITRE ATT&CK framework when analyzing endpoint and network alerts?`,
        `Describe your approach to designing resilient perimeter defenses, endpoint detection policies (EDR), and network micro-segmentation.`,
        `How do you perform static and dynamic malware analysis on suspicious files, payloads, and scripts when evaluating threat severity?`,
        `When implementing Zero Trust architecture and multi-factor authentication (MFA), how do you enforce continuous validation across cloud and on-premise environments?`
      ],
      5: [
        `When tuning Next-Gen Firewall ACLs or EDR behavioral policies, how do you mitigate alert fatigue without creating blind spots for stealthy threats?`,
        `Can you walk me through an edge-case security anomaly you investigated involving obfuscated PowerShell, LOLBins, or living-off-the-land techniques?`,
        `How do you configure and triage email security mechanisms—such as SPF, DKIM, and DMARC—to mitigate advanced spear-phishing campaigns?`,
        `What diagnostic tools and endpoint telemetry sources do you rely on to hunt for stealthy persistence mechanisms like registry run keys or scheduled tasks?`
      ],
      6: [
        `Scenario: An endpoint EDR agent triggers an alert for abnormal outbound beaconing and lateral movement using PsExec. Walk me through your step-by-step containment and triage workflow.`,
        `Scenario: An employee reports executing a suspicious email attachment, and network telemetry shows an outbound connection to an untrusted IP. Walk through your immediate host isolation and investigation steps.`,
        `Scenario: An internal vulnerability scan reveals an unpatched Remote Code Execution (RCE) vulnerability on a mission-critical server that cannot be rebooted immediately. How do you apply compensating controls?`,
        `Scenario: An alert indicates multiple failed authentication attempts across distributed IPs followed by a single successful privileged login. How do you respond and preserve forensic evidence?`
      ],
      7: [
        `How do you stay current with emerging zero-day vulnerabilities, threat intelligence feeds (STIX/TAXII), and newly released exploit techniques?`,
        `Describe how you create and operationalize incident response playbooks and standard operating procedures (SOPs) for SOC Tier 1/2 analysts.`,
        `How do you integrate automated Threat Intelligence Platforms (TIP) to enrich SIEM alerts and prioritize high-confidence Indicators of Compromise (IOCs)?`,
        `How do you align enterprise security monitoring, audit logging, and data retention policies with regulatory standards like PCI-DSS or HIPAA?`
      ],
      8: [
        `Describe a challenging technical disagreement you had with a system administrator or developer regarding security controls vs usability, and how you resolved it.`,
        `Tell me about a time you had to balance strict security policies against engineering productivity and how you reached a pragmatic compromise.`,
        `Describe a high-pressure situation where you had to communicate an active security risk or incident to non-technical executives.`,
        `Tell me about a time you identified a critical security vulnerability before production deployment and convinced the application team to prioritize remediation.`
      ],
      9: [
        `Scenario: An enterprise ransomware outbreak or active data exfiltration event is detected across production servers. How do you lead isolation, forensic evidence preservation, eradication, and post-incident reporting?`,
        `Scenario: An unauthorized insider is suspected of dumping sensitive customer records from a core database. How do you conduct covert forensic auditing while maintaining strict chain of custody?`,
        `Scenario: A critical zero-day exploit in an enterprise perimeter gateway is published with active in-the-wild exploitation. Walk through your emergency triage, threat hunting, and remediation plan.`,
        `Scenario: An administrative service account API key is accidentally exposed publicly. How do you execute emergency credential revocation, session termination, and audit log reconstruction?`
      ]
    };
  } else if (archetype === "SOFTWARE_FRONTEND") {
    domainDynamicQuestions = {
      2: [
        `In ${dynamicSkill}, what is the fundamental difference between the Real DOM and the Virtual DOM, and how does reconciliation optimize rendering?`,
        `How do you evaluate component lifecycle, state management, and render performance when designing interactive UI features using ${dynamicSkill}?`,
        `What architectural trade-offs do you evaluate between local component state, React Context, and external state stores in ${dynamicSkill}?`,
        `How do you ensure responsive layout integrity and cross-browser consistency when developing interfaces in ${dynamicSkill}?`
      ],
      3: [
        `In your practical frontend project work, what key component architecture and state management decisions did you make using ${dynamicSkill}?`,
        `Can you walk me through how you integrated REST/GraphQL APIs, loading states, and error handling in your primary ${dynamicSkill} project?`,
        `What performance optimization strategies did you implement to achieve high Lighthouse scores on your main ${dynamicSkill} web application?`,
        `How did you approach modular styling, reusable UI component libraries, and client-side validation in your ${dynamicSkill} project?`
      ],
      4: [
        `When building responsive web pages using ${dynamicSkill}, how do you manage media queries, fluid typography, and modern image formats?`,
        `How do you architect a scalable CSS design system using utility classes, CSS Modules, or Styled Components in ${dynamicSkill}?`,
        `How do you build accessible, mobile-first navigation menus and modal dialogs with proper keyboard focus management in ${dynamicSkill}?`,
        `What strategies do you follow to implement client-side form validation and schema parsing (e.g. using Zod) in ${dynamicSkill}?`
      ],
      5: [
        `How do you manage server state, caching, pagination, and optimistic UI updates using client libraries like React Query or SWR in ${dynamicSkill}?`,
        `Explain the rules of React hooks and how you prevent stale closures in hook dependency arrays when building with ${dynamicSkill}.`,
        `When profiling runtime performance or memory leaks in SPA routes using ${dynamicSkill}, what browser DevTools do you rely on?`,
        `How do you implement modern client-side security practices (such as XSS prevention, CSP, and secure cookie storage) in ${dynamicSkill}?`
      ],
      6: [
        `Scenario: A React component in ${dynamicSkill} is re-rendering continuously in an infinite loop, freezing the browser tab. How do you isolate the trigger?`,
        `Scenario: A high-traffic landing page in ${dynamicSkill} experiences poor Core Web Vitals with high LCP and CLS. Walk through your step-by-step optimization workflow.`,
        `Scenario: Users report that client memory usage steadily increases over time when navigating SPA routes in ${dynamicSkill}. How do you track down memory leaks?`,
        `Scenario: An interactive data-grid in ${dynamicSkill} rendering 5,000 rows causes noticeable input latency and frame drops. How do you implement virtualization?`
      ],
      7: [
        `In advanced ${targetRole} projects using ${dynamicSkill}, how do you implement WCAG 2.1 AA accessibility standards including ARIA roles and screen reader announcements?`,
        `What are the architectural trade-offs between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG) in ${dynamicSkill}?`,
        `How do you set up automated frontend testing combining unit tests (Vitest/Jest), component testing, and end-to-end tests (Playwright/Cypress) in ${dynamicSkill}?`,
        `How did your academic coursework and foundational software training prepare you to solve advanced UI architecture challenges as a ${targetRole}?`
      ],
      8: [
        `Describe a situation where a UI/UX designer provided a visually complex design that would degrade frontend runtime performance and how you reached a compromise.`,
        `Tell me about a time when a backend API response schema did not match your frontend UI requirements close to a release deadline. How did you adapt?`,
        `Describe a challenging technical disagreement you had with a teammate regarding frontend architecture (e.g. state management or CSS strategy) and how you resolved it.`,
        `Tell me about a time you introduced a frontend bug that broke user interaction in production. How did you roll out a fix and add regression tests?`
      ],
      9: [
        `Scenario: A production release introduces a critical React error boundary crash that renders a blank white screen for logged-in users. How do you restore service?`,
        `Scenario: A critical third-party NPM dependency in your frontend application contains a remote code execution vulnerability. How do you remediate it?`,
        `Scenario: Cross-browser rendering inconsistencies break checkout buttons on Safari iOS devices. How do you diagnose and hotfix the layout defect?`,
        `Scenario: Your frontend bundle size grows unexpectedly to over 5MB, causing mobile page load timeouts. How do you configure dynamic code splitting and asset preloading?`
      ]
    };
  } else {
    // Standard Engineering Dynamic Questions for other domains
    domainDynamicQuestions = {
      2: [
        `What core domain principles, engineering standards, or theoretical foundations guide your technical work in ${dynamicSkill}?`,
        `How do you evaluate system performance, quality metrics, and operational constraints when designing solutions in ${dynamicSkill}?`,
        `What foundational domain methodologies form the cornerstone of your deliverables in ${dynamicSkill}?`,
        `In ${dynamicSkill}, what technical trade-offs do you evaluate to ensure reliability, maintainability, and safety?`
      ],
      3: [
        `In your practical project work, what key technical decisions and implementation choices did you make using ${dynamicSkill}?`,
        `Can you walk me through the system architecture, calculation models, or workflows of a major project where you applied ${dynamicSkill}?`,
        `How did you perform quality verification, empirical validation, and testing on your primary ${dynamicSkill} project?`,
        `What trade-offs between delivery schedule, technical complexity, and quality did you navigate in your ${dynamicSkill} project?`
      ],
      4: [
        `How do you apply industry-standard tools, calculation frameworks, and verification protocols in ${dynamicSkill}?`,
        `Describe your approach to designing robust, scalable, and compliant deliverables using ${dynamicSkill}.`,
        `How do you configure automated workflows, standard operating procedures, and quality gates for systems utilizing ${dynamicSkill}?`,
        `When managing technical constraints or regulatory standards in ${dynamicSkill}, how do you ensure full compliance?`
      ],
      5: [
        `When diagnosing operational bottlenecks, edge-case failures, or performance deviations in ${dynamicSkill}, what diagnostic tools do you rely on?`,
        `Can you walk me through a complex defect or technical challenge you isolated and resolved while implementing ${dynamicSkill}?`,
        `How do you enforce domain safety and quality control standards when working with ${dynamicSkill}?`,
        `When implementing updates or optimizations in ${dynamicSkill}, how do you ensure seamless backwards compatibility and stability?`
      ],
      6: [
        `Scenario: A mission-critical system in ${dynamicSkill} experiences an unexpected operational deviation or performance anomaly. Walk me through your triage workflow.`,
        `Scenario: After a technical deployment in ${dynamicSkill}, quality metrics show unexpected variance. How do you isolate the root cause and execute corrective actions?`,
        `Scenario: An unexpected component failure occurs during operational testing in ${dynamicSkill}. How do you contain the failure and prevent escalation?`,
        `Scenario: A third-party supplier deliverable fails quality verification in ${dynamicSkill}. How do you manage technical remediation?`
      ],
      7: [
        `How did your academic coursework and engineering foundations prepare you to solve advanced, ambiguous technical problems in ${dynamicSkill}?`,
        `How do you evaluate and safely adopt newly released tools, methodologies, or standards within ${dynamicSkill}?`,
        `How do you establish engineering team standards for technical documentation, peer reviews, and quality assurance in ${dynamicSkill}?`,
        `How do you balance rapid delivery timelines with rigorous engineering standards when executing ${targetRole} projects?`
      ],
      8: [
        `Describe a challenging technical disagreement you had with a team member regarding technical design in ${targetRole} deliverables and how you resolved it using data.`,
        `Tell me about a time you encountered an unexpected roadblock on a project. How did you communicate the impact and resolve the challenge?`,
        `Describe a situation where project requirements were changing rapidly near a delivery milestone. How did you maintain high technical quality?`,
        `Can you share an experience where you had to collaborate cross-functionally to achieve an engineering objective?`
      ],
      9: [
        `Scenario: A major operational crisis or critical failure threatens core deliverables. How do you lead containment, root cause analysis, and post-incident reporting?`,
        `Scenario: An unexpected critical defect is discovered during the final validation phase before client delivery. Walk through your emergency mitigation plan.`,
        `Scenario: Extreme operational demands threaten system failure across core components. How do you implement emergency containment and stabilization?`,
        `Scenario: A mission-critical process encounters unexpected regulatory or safety non-compliance. How do you recover full compliance without disruption?`
      ]
    };
  }

  const dynamicList = domainDynamicQuestions[slotIndex] || domainDynamicQuestions[2];
  for (const synText of dynamicList) {
    if (!isSemanticDuplicate(synText, sessionTracker)) {
      return {
        id: slotIndex,
        level,
        category,
        question: synText,
        keyConcepts: [dynamicSkill, "Domain Competency", "Engineering Best Practices"],
        hint: `Explain your technical thought process and best practices clearly.`,
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
          keyConcepts: [primarySkill, "Domain Expertise", "Applied Practice"],
          hint: `Detail your methodology and hands-on experience clearly.`,
          idealAnswer: generateFallbackIdealAnswer(otherQ, level, targetRole, careerField, highlights, jobDescription),
        };
      }
    }
  }

  // 4. Clean, natural, domain-tailored unique fallback
  const cleanUniqueText = archetype === "CYBERSECURITY"
    ? `In your technical work as a ${targetRole}, how do you evaluate and implement security best practices when protecting organizational assets and investigating potential threats?`
    : archetype === "SOFTWARE_FRONTEND"
    ? `In your work as a ${targetRole}, how do you evaluate UI component architecture, state flows, and rendering performance when developing with ${dynamicSkill}?`
    : `In your work as a ${targetRole}, how do you evaluate and apply technical best practices when delivering core objectives in ${dynamicSkill}?`;

  return {
    id: slotIndex,
    level,
    category,
    question: cleanUniqueText,
    keyConcepts: [dynamicSkill, "Domain Practices", "Problem Solving"],
    hint: `Provide concrete technical examples from your engineering background.`,
    idealAnswer: generateFallbackIdealAnswer(cleanUniqueText, level, targetRole, careerField, highlights, jobDescription),
  };
}

/**
 * Dynamic domain blueprint generator to enforce domain-driven question architecture
 */
function getDomainSlotBlueprint(archetype, targetRole, careerField, allSkills = [], experienceLevel = "Intermediate") {
  if (archetype === "CYBERSECURITY") {
    return `
DOMAIN-DRIVEN QUESTION BLUEPRINT FOR CYBERSECURITY / SECURITY ANALYST:
Every question MUST be an authentic cybersecurity question reflecting real SOC operations, threat analysis, incident response, network security, and vulnerability management.
PROHIBITED: Do NOT ask software engineering questions (no REST API design, microservice contracts, DB schema migrations, React/frontend components, code maintainability vs performance).
PROHIBITED: Do NOT tack on raw category labels into generic sentence templates.

Slot 1 (Basic) - [Introduction]: MUST ALWAYS BE EXACTLY: "Tell me about yourself."
Slot 2 (Basic) - [Core Security Fundamentals]: Foundational cybersecurity concepts (Least Privilege PoLP, Defense-in-Depth, CIA triad, NIST CSF / ISO 27001 / CIS Controls, RBAC vs ABAC access control models, symmetric vs asymmetric encryption in TLS, or PKI).
Slot 3 (Intermediate) - [Threat Detection & Packet/Log Analysis]: Practical technical investigation (SIEM correlation rules, analyzing PCAPs in Wireshark/Zeek to detect anomalous C2 beaconing, CVSS vulnerability prioritization, or validating controls against simulated brute-force/port scans).
Slot 4 (Intermediate) - [Security Architecture & Threat Modeling]: Security architecture (Mapping adversary TTPs to MITRE ATT&CK, Next-Gen Firewall NGFW rule design, EDR behavioral policies, Zero Trust continuous verification, or static/dynamic malware analysis).
Slot 5 (Intermediate) - [Applied Security Operations & Triage]: SOC operations & edge cases (Mitigating SIEM alert fatigue, triaging phishing campaigns with SPF/DKIM/DMARC, threat hunting for LOLBins and registry persistence, or AWS/Azure IAM least-privilege policies).
Slot 6 (Intermediate) - [Incident Response Scenario]: Realistic SOC triage scenario (Containing an endpoint with abnormal outbound beaconing and lateral movement, responding to a phishing attachment execution, applying compensating controls for an unpatched RCE on a critical server, or investigating suspicious foreign logins).
Slot 7 (Advanced) - [Advanced Threat Intel & Security Governance]: Advanced governance and intel (Operationalizing threat intelligence feeds STIX/TAXII, developing SOC incident playbooks/SOPs, audit logging compliance for PCI-DSS/HIPAA, or zero-day patch prioritization).
Slot 8 (Advanced) - [Behavioral & Cross-Functional Security]: STAR behavioral question (Resolving disagreements with IT/developers over security controls vs usability, balancing strict security with engineering agility, or communicating active security risks to non-technical executives).
Slot 9 (Advanced) - [High-Stakes Crisis Response]: Enterprise breach recovery scenario (Containing an active ransomware outbreak and preserving forensic memory/chain of custody, investigating suspected insider data exfiltration, or emergency revocation of exposed cloud admin credentials).
`.trim();
  }

  if (archetype === "SOFTWARE_FRONTEND") {
    return `
DOMAIN-DRIVEN QUESTION BLUEPRINT FOR FRONTEND / UI DEVELOPER:
Every question MUST test client-side web technologies (HTML5, CSS3, Flexbox/Grid, responsive layouts, modern JS ES6+, React.js/Vue/Angular, DOM/Virtual DOM reconciliation, client state management, Core Web Vitals, browser rendering pipeline, WCAG accessibility).
PROHIBITED: Do NOT ask backend DB schema design, ACID transactions, connection pooling, or server microservice infrastructure.

Slot 1 (Basic) - [Introduction]: MUST ALWAYS BE EXACTLY: "Tell me about yourself."
Slot 2 (Basic) - [Frontend Fundamentals]: DOM vs Virtual DOM, browser rendering lifecycle, CSS layout models (Flexbox vs Grid), or JavaScript closures/event loop.
Slot 3 (Intermediate) - [Component Architecture & State Management]: Practical frontend project deep-dive (Component hierarchy, local vs global state, React hooks/Context, or REST/GraphQL client integration).
Slot 4 (Intermediate) - [Responsive Design & Styling Systems]: CSS architectures (Tailwind/CSS Modules/Styled Components), responsive design, fluid typography, or client-side form validation (Zod/React Hook Form).
Slot 5 (Intermediate) - [Performance & Client Optimization]: Frontend performance optimization (Core Web Vitals LCP/CLS/FID, bundle splitting, code splitting, memoization, or client caching with React Query/SWR).
Slot 6 (Intermediate) - [UI Debugging & Problem-Solving Scenario]: Practical troubleshooting scenario (Fixing infinite re-render loops, hunting client memory leaks in SPAs, or virtualizing massive data tables).
Slot 7 (Advanced) - [Advanced Web Standards & Accessibility]: Advanced frontend architecture (WCAG 2.1 AA accessibility/ARIA, SSR vs CSR vs SSG trade-offs, or automated frontend testing with Vitest/Playwright).
Slot 8 (Advanced) - [Behavioral & Design Collaboration]: STAR behavioral question (Navigating trade-offs with UI/UX designers, handling unexpected backend API contract discrepancies, or production bug rollouts).
Slot 9 (Advanced) - [High-Stakes UI Crisis Recovery]: Production frontend incident scenario (Recovering from React error boundary blank white screens, patching vulnerable NPM dependencies, or fixing critical mobile browser layout crashes).
`.trim();
  }

  if (archetype === "SOFTWARE_BACKEND") {
    return `
DOMAIN-DRIVEN QUESTION BLUEPRINT FOR BACKEND DEVELOPER:
Every question MUST test server-side architecture (REST/GraphQL APIs, database modeling, SQL indexing/query optimization, caching, authentication/authorization, concurrency, microservices, and server scalability).
PROHIBITED: Do NOT ask CSS layout, browser DOM rendering, or UI wireframing questions.

Slot 1 (Basic) - [Introduction]: MUST ALWAYS BE EXACTLY: "Tell me about yourself."
Slot 2 (Basic) - [Backend Fundamentals]: REST vs GraphQL, HTTP status codes, database normalization vs denormalization, ACID transactions, or hashing/authentication principles.
Slot 3 (Intermediate) - [API Design & Database Architecture]: Practical project deep-dive (Designing RESTful endpoints, SQL schema modeling, indexing strategies, or ORM/query optimizations).
Slot 4 (Intermediate) - [System Architecture & Data Pipelines]: Scalable backend architecture (Microservices vs modular monolith, message queues like Kafka/RabbitMQ, Redis caching strategies, or rate limiting).
Slot 5 (Intermediate) - [Applied Backend Engineering]: Practical server implementation (Connection pooling, background worker jobs, idempotency in payment/order processing, or zero-downtime schema migrations).
Slot 6 (Intermediate) - [Backend Troubleshooting Scenario]: Practical debugging scenario (Diagnosing database connection pool exhaustion, investigating slow N+1 query bottlenecks, or memory leaks in server processes).
Slot 7 (Advanced) - [Distributed Systems & Scalability]: Advanced server architecture (Distributed locking, CAP theorem trade-offs, event-driven architecture, or database sharding/read replicas).
Slot 8 (Advanced) - [Behavioral & Engineering Trade-offs]: STAR behavioral question (Resolving technical debt vs feature delivery trade-offs, cross-team API contract alignment, or post-mortem reviews).
Slot 9 (Advanced) - [High-Stakes Outage Recovery]: Production server outage scenario (Handling database failover, cascading service failures with circuit breakers, or critical data corruption recovery).
`.trim();
  }

  if (archetype === "MECHANICAL") {
    return `
DOMAIN-DRIVEN QUESTION BLUEPRINT FOR MECHANICAL ENGINEERING:
Every question MUST test mechanical engineering principles (CAD/SolidWorks/CATIA, GD&T, FEA/ANSYS stress analysis, thermodynamics, fluid dynamics, material selection, manufacturing processes, tolerance stack-up).
PROHIBITED: Do NOT ask software programming, React, SQL, or web development questions.

Slot 1 (Basic) - [Introduction]: MUST ALWAYS BE EXACTLY: "Tell me about yourself."
Slot 2 (Basic) - [Mechanical Fundamentals]: Stress-strain curves, ductile vs brittle failure modes, thermodynamic cycles, or basic GD&T datum referencing.
Slot 3 (Intermediate) - [CAD Modeling & Practical Design]: Practical project deep-dive (3D CAD part/assembly modeling, design for manufacturability DFM, or tolerance stack-up analysis).
Slot 4 (Intermediate) - [Finite Element Analysis & Simulation]: FEA simulation (Mesh convergence, boundary conditions, static vs dynamic stress analysis, or thermal dissipation modeling).
Slot 5 (Intermediate) - [Materials & Manufacturing Processes]: Practical manufacturing (Material selection, CNC machining constraints, sheet metal forming, injection molding, or heat treatment).
Slot 6 (Intermediate) - [Mechanical Troubleshooting Scenario]: Engineering problem scenario (Diagnosing fatigue failure, structural vibration resonance, or unexpected assembly interference).
Slot 7 (Advanced) - [Advanced Mechanical Theory & Standards]: Advanced theory (Non-linear FEA, fracture mechanics, ISO/ASME Y14.5 standards, or computational fluid dynamics CFD).
Slot 8 (Advanced) - [Behavioral & Engineering Collaboration]: STAR behavioral question (Navigating cost vs structural integrity trade-offs, collaborating with manufacturing shop floor, or design change validation).
Slot 9 (Advanced) - [High-Stakes Hardware Crisis Recovery]: Structural failure scenario (Containment of critical component failure during prototype testing, recall mitigation, or emergency redesign).
`.trim();
  }

  return `
DOMAIN-DRIVEN QUESTION BLUEPRINT FOR ${careerField.toUpperCase()} / ${targetRole.toUpperCase()}:
Every question MUST be 100% relevant and authentic to ${targetRole} in ${careerField}.
PROHIBITED: Do NOT use generic software engineering phrasing or out-of-domain concepts.

Slot 1 (Basic) - [Introduction]: MUST ALWAYS BE EXACTLY: "Tell me about yourself."
Slot 2 (Basic) - [Domain Technical Fundamentals]: Foundational domain principles, core methodologies, and industry standards for ${targetRole}.
Slot 3 (Intermediate) - [Resume & Project Implementation]: Deep-dive into an actual technical project or practical application of core domain skills.
Slot 4 (Intermediate) - [System / Process Architecture & Tooling]: Core tools, design frameworks, workflows, or operational architectures used daily by a ${targetRole}.
Slot 5 (Intermediate) - [Applied Technical Practice & Verification]: Practical application, quality assurance, diagnostic methodologies, or testing standards.
Slot 6 (Intermediate) - [Problem-Solving Scenario]: Realistic troubleshooting, debugging, or situational problem tailored strictly to ${targetRole}.
Slot 7 (Advanced) - [Advanced Domain Theory & Governance]: Advanced theoretical concepts, emerging industry trends, regulatory compliance, or standards.
Slot 8 (Advanced) - [Behavioral & Teamwork]: STAR behavioral question (Resolving technical disagreements, balancing competing priorities, or cross-functional teamwork).
Slot 9 (Advanced) - [High-Stakes Crisis Recovery]: High-impact operational crisis, critical failure recovery, or emergency defect containment.
`.trim();
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

  const domainBlueprint = getDomainSlotBlueprint(context.archetype, targetRole, careerField, allSkills, experienceLevel);

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

${domainBlueprint}

CRITICAL ANTI-CONTAMINATION & RELEVANCE MANDATES:
- NEVER use generic software development question templates (such as APIs, service boundaries, database schemas, frontend components, or code maintainability) when interviewing for non-software roles like Cybersecurity, Mechanical, Civil, Chemical, Finance, HR, Marketing, etc.
- NEVER interpolate or tack on raw skill category names into generic sentence templates (e.g. NEVER write "in SIEM Monitoring & Incident Response, how do you...", "when managing schema migrations in SIEM", or "interface contracts in SIEM").
- If the role is Cybersecurity / Security Analyst: ALL technical questions MUST be authentic cybersecurity questions testing real SOC workflows, threat analysis, incident response, SIEM, EDR, network packet captures, CVE/CVSS vulnerability management, MITRE ATT&CK, or cloud security.
- If the target role is Frontend Developer: Questions MUST evaluate client-side web technologies (HTML5, CSS3, Flexbox/Grid, JS ES6+, React, DOM/Virtual DOM reconciliation, state management, Core Web Vitals, accessibility).
- If the target role is Backend Developer: Focus on REST/GraphQL APIs, database modeling, query optimization, authentication, microservices, and server scalability.
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

  const domainBlueprint = getDomainSlotBlueprint(context.archetype, targetRole, careerField, allSkills, experienceLevel);

  const prompt = `You are a technical hiring manager conducting a mock interview for a "${targetRole}" position in "${careerField}".

Candidate Profile:
${resumeSnippet}
Experience Level: ${experienceLevel}
${jobDescription ? `Target Job Description: ${jobDescription.trim()}` : ""}

Previously Asked Questions (DO NOT REPEAT OR PARAPHRASE):
${safeAsked.slice(-25).map((q, i) => `${i + 1}. "${q}"`).join("\n")}

${domainBlueprint}

CRITICAL ANTI-CONTAMINATION & RELEVANCE MANDATES:
Generate ONE brand new interview question at the "${level}" tier.
- Must be 100% relevant to ${targetRole} in ${careerField}.
- NEVER use generic software development question templates (APIs, microservices, schemas, frontend components) for non-software roles like Cybersecurity.
- NEVER interpolate or tack on raw skill category names into generic sentence templates.
- If the role is Cybersecurity / Security Analyst: The question MUST be an authentic cybersecurity question testing SOC operations, threat analysis, incident response, SIEM, EDR, network packets, CVE/CVSS, MITRE ATT&CK, or cloud security.
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
 * Helper to generate a comprehensive, question-specific Ideal Reference Answer strictly tailored to candidate's domain & question
 */
/**
 * Stage 2: High-Precision Domain Intent Classification
 */
/**
 * Stage 2: High-Precision Domain Intent Classification
 */
/**
 * Stage 2: High-Precision Domain Intent Classification
 */
function classifyQuestionIntent(qText = "", archetype = "GENERAL_ENGINEERING", category = "") {
  const qLower = (qText || "").toLowerCase().trim();

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasWord = (word) => {
    if (!word) return false;
    return new RegExp(`(?:^|[^a-zA-Z0-9_])${escapeRegex(word.toLowerCase())}(?:$|[^a-zA-Z0-9_])`, "i").test(qLower);
  };
  const hasPhrase = (phrase) => {
    if (!phrase) return false;
    const p = phrase.toLowerCase().trim();
    if (p.includes(" ") || p.includes("-") || p.includes("/")) {
      return qLower.includes(p);
    }
    return hasWord(p);
  };
  const hasAny = (...items) => items.some((item) => hasPhrase(item));
  const hasAll = (...items) => items.every((item) => hasPhrase(item));

  // 1. Introduction (Slot 1)
  if (hasAny("tell me about yourself", "introduce yourself", "walk me through your background")) {
    return "INTRO";
  }

  // -------------------------------------------------------------
  // CYBERSECURITY INTENTS (Strict Specificity Ordering)
  // -------------------------------------------------------------
  if (archetype === "CYBERSECURITY" || hasAny("cybersecurity", "security analyst", "soc", "infosec", "threat analyst")) {
    // Highly Specific Technical Topics (Must be matched before general terms)
    if (hasAny("fileless malware", "fileless", "lolbins", "living-off-the-land", "living off the land", "threat hunting to detect fileless")) {
      return "CYBER_THREAT_HUNTING_FILELESS_LOLBINS";
    }
    if (hasAny("ddos flood", "ddos", "traffic scrubbing", "rate limiting, and upstream provider", "upstream provider mitigation", "firewall and dns service availability", "distributed denial-of-service")) {
      return "CYBER_SCENARIO_DDOS_MITIGATION";
    }
    if (hasAny("zero-day remote code execution", "zero-day rce", "perimeter vpn gateway", "vpn gateway", "enterprise perimeter vpn", "zero-day exploit in an enterprise perimeter")) {
      return "CYBER_CRISIS_ZERO_DAY_GATEWAY";
    }
    if (hasAny("packet capture", "packet captures", "pcaps", "pcap", "wireshark", "zeek", "c2 communication", "analyzed network traffic", "command-and-control")) {
      return "CYBER_NETWORK_TRAFFIC_ANALYSIS";
    }
    if (hasAny("principle of least privilege", "polp", "role-based access control", "rbac", "attribute-based access control", "abac", "privileged access")) {
      return "CYBER_LEAST_PRIVILEGE_RBAC_ABAC";
    }
    if (hasAny("network segmentation", "micro-segmentation", "next-generation firewalls", "ngfw", "software-defined perimeters", "security zones")) {
      return "CYBER_NETWORK_SEGMENTATION_NGFW";
    }
    if (hasAny("threat intelligence platforms", "tip", "enrich siem alerts", "indicators of compromise", "iocs", "threat fidelity scores", "fidelity scores")) {
      return "CYBER_TIP_ENRICHMENT";
    }
    if (hasAny("identified a critical security vulnerability", "vulnerability or configuration flaw before production", "convinced the team to remediate", "critical security vulnerability or configuration flaw")) {
      return "CYBER_BEHAVIORAL_VULN_PRE_PROD";
    }

    // Additional Specific Technical & Scenario Topics
    if (hasAny("ransomware outbreak", "data exfiltration", "active data exfiltration")) return "CYBER_CRISIS_RANSOMWARE_EXFILTRATION";
    if (hasAny("unauthorized insider", "dumping sensitive customer records", "database records", "covert forensic auditing", "chain of custody")) return "CYBER_CRISIS_INSIDER_THREAT";
    if (hasAny("service account key is accidentally committed", "public code repository", "credential revocation", "publicly exposed")) return "CYBER_CRISIS_EXPOSED_CLOUD_KEY";

    if (hasAny("abnormal outbound beaconing", "beaconing traffic", "beaconing", "lateral movement", "database subnet")) return "CYBER_SCENARIO_BEACONING_LATERAL";
    if (hasAny("phishing email attachment", "suspicious phishing", "clicks on a suspicious")) return "CYBER_SCENARIO_PHISHING";
    if (hasAny("unpatched remote code execution", "unpatched rce", "cannot be rebooted", "compensating controls")) return "CYBER_SCENARIO_UNPATCHED_RCE";
    if (hasAny("failed authentication attempts", "privileged login in", "successful privileged login", "failed ssh/rdp login")) return "CYBER_SCENARIO_PRIVILEGE_ANOMALY";
    if (hasAny("mimikatz in memory", "mimikatz", "volatile memory preservation")) return "CYBER_SCENARIO_MIMIKATZ_MEMORY";

    if (hasAny("emerging zero-day exploits", "threat intelligence feeds", "defensive toolkits")) return "CYBER_ZERO_DAY_THREAT_INTEL";
    if (hasAny("incident response playbooks", "standard operating procedures", "soc playbooks", "playbooks and standard operating procedures")) return "CYBER_INCIDENT_RESPONSE_PLAYBOOKS";
    if (hasAny("purple-team", "adversary emulation exercises", "validate blue-team")) return "CYBER_PURPLE_TEAM_EMULATION";
    if (hasAny("regulatory compliance mandates", "pci-dss", "hipaa", "soc 2", "gdpr", "compliance standards")) return "CYBER_COMPLIANCE_MANDATES";

    if (hasAny("owasp top 10", "sql injection", "xss", "broken access control", "zero trust")) return "CYBER_OWASP_ZERO_TRUST";
    if (hasAny("malware analysis", "powershell script", "static and dynamic malware")) return "CYBER_MALWARE_ANALYSIS";
    if (hasAny("mitre att&ck", "adversary tactics and techniques", "detection coverage")) return "CYBER_MITRE_ATTACK_MAPPING";
    if (hasAny("secure cloud environments", "identity and access management", "service control policies", "scps", "iam policies")) return "CYBER_CLOUD_IAM_LEAST_PRIVILEGE";
    if (hasAny("security orchestration", "soar playbooks", "automated soar", "repetitive alert triage")) return "CYBER_SOAR_PLAYBOOKS";
    if (hasAny("data loss prevention", "dlp controls", "data exfiltration across endpoints")) return "CYBER_DLP_CONTROLS";

    if (hasAny("firewall access control lists", "firewall acls", "edr behavioral policies", "false positives")) return "CYBER_FIREWALL_EDR_FALSE_POSITIVES";
    if (hasAny("investigate a suspicious security event", "complex scenario where you leveraged", "suspicious security event", "leveraged siem")) return "CYBER_SUSPICIOUS_EVENT_INVESTIGATION";
    if (hasAny("credential stuffing", "brute-force mitigation", "adaptive authentication", "distributed credential stuffing")) return "CYBER_CREDENTIAL_STUFFING";
    if (hasAny("stealthy persistence mechanisms", "persistence mechanisms", "diagnostic tools and telemetry")) return "CYBER_PERSISTENCE_HUNTING";
    if (hasAny("edge-case security anomaly", "complex edge-case security")) return "CYBER_EDGE_CASE_ANOMALY";

    if (hasAny("correlation rules", "distinguish legitimate user activity", "apt reconnaissance", "apt activity")) return "CYBER_SIEM_CORRELATION_APT";
    if (hasAny("cia triad", "defense-in-depth", "core principles of the cia")) return "CYBER_CIA_DEFENSE_IN_DEPTH";
    if (hasAny("symmetric and asymmetric cryptography", "tls/ssl handshakes", "symmetric and asymmetric", "cryptography")) return "CYBER_CRYPTO_SYMMETRIC_ASYMMETRIC";
    if (hasAny("nist csf", "iso 27001", "cis controls", "cybersecurity frameworks", "align enterprise security")) return "CYBER_FRAMEWORKS_NIST_ISO_CIS";
    if (hasAny("vulnerability scanning", "risk assessment", "penetration testing") && (hasAny("difference") || hasAny("employ each"))) return "CYBER_VULN_SCAN_VS_PENTEST";
    if (hasAny("public key infrastructure", "pki", "digital certificates", "certificate revocation lists", "crl/ocsp")) return "CYBER_PKI_DIGITAL_CERTIFICATES";
    if (hasAny("multi-factor authentication", "mfa mechanisms", "mfa fatigue", "totp", "fido2")) return "CYBER_MFA_FATIGUE";
    if (hasAny("dns security auditing", "dns tunneling", "cache poisoning", "domain hijacking")) return "CYBER_DNS_SECURITY";

    if (hasAny("simulate attack vectors", "brute force, phishing", "port scanning", "validate defensive controls")) return "CYBER_ATTACK_SIMULATION";
    if (hasAny("log ingestion", "parsing", "custom alert rules", "threat monitoring pipeline")) return "CYBER_LOG_INGESTION_PIPELINE";
    if (hasAny("endpoint detection and response", "edr agent policies", "credential dumping", "process hollowing")) return "CYBER_EDR_DEPLOYMENT_TUNING";
    if (hasAny("vulnerability remediation", "patch prioritization workflow", "cvss scores")) return "CYBER_VULN_PRIORITIZATION_CVSS";
    if (hasAny("cloud infrastructure configurations", "s3 bucket policies", "azure iam roles")) return "CYBER_CLOUD_INFRASTRUCTURE_IAM";
    if (hasAny("i can see from your resume that you worked on", "security project", "lab simulation", "practical implementation")) return "CYBER_RESUME_PROJECT";

    // Behavioral
    if (hasAny("balance strict security policies", "security policies against engineering", "developer velocity", "productivity")) return "CYBER_BEHAVIORAL_SECURITY_VS_PRODUCTIVITY";
    if (hasAny("communicate a potential security risk", "non-technical executives", "executives", "executive risk")) return "CYBER_BEHAVIORAL_EXECUTIVE_COMM";
    if (hasAny("unexpected security alert disrupted", "on-call rotation", "prioritized multiple competing tasks")) return "CYBER_BEHAVIORAL_ONCALL";
    if (hasAny("disagreement", "friction", "divergent perspectives") && hasAny("security controls", "security architecture", "security analyst", "deliverables", "project")) return "CYBER_BEHAVIORAL_DISAGREEMENT";

    return "CYBER_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // FRONTEND DEVELOPER INTENTS
  // -------------------------------------------------------------
  if (archetype === "SOFTWARE_FRONTEND" || hasAny("frontend developer", "react developer", "front end developer")) {
    if (hasAny("real dom", "virtual dom", "reconciliation", "diffing")) return "FRONTEND_VIRTUAL_DOM_RECONCILIATION";
    if (hasAny("component lifecycle", "render performance", "re-render", "memoization")) return "FRONTEND_LIFECYCLE_STATE_RENDER";
    if (hasAny("box model", "box-sizing", "flexbox", "css grid", "responsive layout")) return "FRONTEND_CSS_BOX_MODEL_LAYOUT";
    if (hasAny("local component state", "react context", "external state stores", "zustand", "redux")) return "FRONTEND_STATE_MANAGEMENT_STORES";
    if (hasAny("lighthouse", "core web vitals", "lcp", "cls", "fid", "inp")) return "FRONTEND_PERFORMANCE_LIGHTHOUSE";
    if (hasAny("design system", "css modules", "styled components", "tailwind")) return "FRONTEND_DESIGN_SYSTEM_CSS";
    if (hasAny("accessibility", "a11y", "wcag", "aria", "focus management")) return "FRONTEND_ACCESSIBILITY_A11Y";
    if (hasAny("form validation", "react hook form", "zod", "client-side form")) return "FRONTEND_FORM_VALIDATION_ZOD";
    if (hasAny("react hooks", "stale closures", "dependency array", "useeffect", "usecallback")) return "FRONTEND_REACT_HOOKS_CLOSURES";
    if (hasAny("profiling", "devtools", "memory leak", "flamegraph")) return "FRONTEND_DEVTOOLS_PROFILING";
    if (hasAny("xss prevention", "csp", "content security policy", "secure cookie")) return "FRONTEND_CLIENT_SECURITY";
    if (hasAny("react query", "swr", "caching", "optimistic ui", "server state")) return "FRONTEND_API_INTEGRATION_DATA_FETCH";
    if (hasAny("white screen", "error boundary crash", "blank white screen")) return "FRONTEND_CRISIS_WHITE_SCREEN";
    if (hasAny("third-party npm dependency", "remote code execution vulnerability in npm", "npm dependency")) return "FRONTEND_CRISIS_NPM_DEPENDENCY_RCE";
    if (hasAny("safari ios", "cross-browser rendering", "checkout buttons")) return "FRONTEND_CRISIS_CROSS_BROWSER_BREAK";
    if (hasAny("bundle size grows", "5mb", "dynamic code splitting")) return "FRONTEND_CRISIS_BUNDLE_BLOAT";
    if (hasAny("freeze", "rendering thousands of items", "unresponsive table", "virtualization")) return "FRONTEND_SCENARIO_LARGE_TABLE_FREEZE";
    if (hasAny("backend api returns 500", "error boundary", "offline fallback")) return "FRONTEND_SCENARIO_API_OUTAGE";
    if (hasAny("jwt authentication token expires", "refresh token", "silent refresh")) return "FRONTEND_SCENARIO_AUTH_EXPIRATION";
    if (hasAny("react server components", "next.js", "ssr", "ssg", "modern frontend")) return "FRONTEND_TRENDS_RSC";
    if (hasAny("jest", "react testing library", "vitest", "unit testing")) return "FRONTEND_TESTING_JEST_RTL";
    if (hasAny("disagreement", "conflict") && hasAny("state management", "component architecture", "ui")) return "FRONTEND_BEHAVIORAL_DISAGREEMENT";
    if (hasAny("deadline", "tight timeline", "visually complex design", "balanced compromise") && hasAny("accessibility", "clean code", "design", "performance")) return "FRONTEND_BEHAVIORAL_DEADLINE_QUALITY";
    if (hasAny("resume", "project", "web application")) return "FRONTEND_RESUME_PROJECT";

    return "FRONTEND_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // SOFTWARE / BACKEND INTENTS
  // -------------------------------------------------------------
  if (archetype === "SOFTWARE" || hasAny("backend developer", "software engineer", "full stack")) {
    if (hasAny("b-tree", "indexing", "query execution plan", "database index")) return "BACKEND_DATABASE_INDEXING_SQL";
    if (hasAny("restful api", "rest api", "graphql", "idempotency", "http status")) return "BACKEND_API_DESIGN_REST_GRAPHQL";
    if (hasAny("microservices", "service boundaries", "domain-driven design", "api gateway")) return "BACKEND_MICROSERVICES_SERVICE_BOUNDARIES";
    if (hasAny("redis", "caching", "cache-aside", "cache stampede")) return "BACKEND_CACHING_REDIS";
    if (hasAny("message queue", "kafka", "rabbitmq", "dead-letter queue", "asynchronous processing")) return "BACKEND_ASYNC_MESSAGE_QUEUES";
    if (hasAny("schema migration", "breaking changes", "backwards compatibility", "zero downtime")) return "BACKEND_SCHEMA_MIGRATIONS";
    if (hasAny("oauth2", "jwt", "token rotation", "stateless auth")) return "BACKEND_AUTHENTICATION_JWT_OAUTH";
    if (hasAny("distributed transactions", "saga pattern", "2pc", "eventual consistency")) return "BACKEND_DISTRIBUTED_TRANSACTIONS";
    if (hasAny("cpu spikes to 100", "slow queries", "unindexed query")) return "BACKEND_SCENARIO_SLOW_QUERIES";
    if (hasAny("memory leak", "heap out of memory", "garbage collection")) return "BACKEND_SCENARIO_MEMORY_LEAK";
    if (hasAny("cascading failure", "circuit breaker", "fallback degradation")) return "BACKEND_SCENARIO_CASCADING_FAILURE";
    if (hasAny("data corruption", "race condition", "transaction rollback")) return "BACKEND_CRISIS_DATA_CORRUPTION";
    if (hasAny("resume", "project", "architecture")) return "BACKEND_RESUME_PROJECT";

    return "BACKEND_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // DATA SCIENCE / AI / ML INTENTS
  // -------------------------------------------------------------
  if (archetype === "DATA_AI" || hasAny("data scientist", "machine learning", "ai engineer", "data analyst")) {
    if (hasAny("feature engineering", "missing values", "scaling", "one-hot encoding")) return "DATA_FEATURE_ENGINEERING";
    if (hasAny("precision", "recall", "f1-score", "roc-auc", "confusion matrix")) return "DATA_MODEL_EVALUATION_METRICS";
    if (hasAny("overfitting", "underfitting", "regularization", "l1", "l2", "dropout")) return "DATA_OVERFITTING_REGULARIZATION";
    if (hasAny("pyspark", "spark", "etl pipeline", "distributed dataframe", "sql window")) return "DATA_BIG_DATA_SPARK";
    if (hasAny("transformer", "attention mechanism", "rag", "llm", "fine-tuning", "prompt")) return "DATA_DEEP_LEARNING_LLMS";
    if (hasAny("model drift", "data drift", "concept drift", "mlops", "mlflow")) return "DATA_MLOPS_MODEL_DRIFT";
    if (hasAny("pipeline failure", "data pipeline drops", "etl failure")) return "DATA_SCENARIO_PIPELINE_FAILURE";
    if (hasAny("model bias", "fairness", "adversarial bias", "hallucination")) return "DATA_CRISIS_MODEL_BIAS";
    if (hasAny("resume", "project", "dataset")) return "DATA_RESUME_PROJECT";

    return "DATA_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // DEVOPS / CLOUD INTENTS
  // -------------------------------------------------------------
  if (hasAny("devops", "cloud engineer", "sre", "site reliability")) {
    if (hasAny("ci/cd", "continuous integration", "github actions", "gitlab ci", "blue-green")) return "DEVOPS_CICD_PIPELINES";
    if (hasAny("terraform", "infrastructure as code", "iac", "drift detection")) return "DEVOPS_IAC_TERRAFORM";
    if (hasAny("kubernetes", "k8s", "pod", "deployment", "hpa", "ingress", "docker")) return "DEVOPS_KUBERNETES_CONTAINERS";
    if (hasAny("prometheus", "grafana", "opentelemetry", "observability", "slo", "sla")) return "DEVOPS_MONITORING_OBSERVABILITY";
    if (hasAny("crashloopbackoff", "pod fails to start", "oomkilled")) return "DEVOPS_SCENARIO_K8S_CRASHLOOP";
    if (hasAny("502 bad gateway", "global outage", "emergency rollback")) return "DEVOPS_CRISIS_OUTAGE_ROLLBACK";
    return "DEVOPS_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // MECHANICAL / CAD INTENTS
  // -------------------------------------------------------------
  if (archetype === "MECHANICAL" || hasAny("mechanical engineer", "cad designer", "solidworks")) {
    if (hasAny("gd&t", "geometric dimensioning", "datum", "tolerance stackup")) return "MECH_GDNT_TOLERANCES";
    if (hasAny("fea", "finite element", "von mises", "stress analysis", "factor of safety")) return "MECH_FEA_STRESS_ANALYSIS";
    if (hasAny("dfm", "dfa", "manufacturing", "material selection", "casting", "machining")) return "MECH_DFM_MATERIALS";
    if (hasAny("thermal dissipation", "heat transfer", "conduction", "cooling")) return "MECH_THERMAL_HEAT_TRANSFER";
    if (hasAny("fatigue crack", "vibration testing", "structural failure")) return "MECH_SCENARIO_FATIGUE_FAILURE";
    if (hasAny("supplier out of spec", "tolerance verification", "dimensional defect")) return "MECH_CRISIS_SUPPLIER_OUT_OF_SPEC";
    return "MECH_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // ELECTRICAL INTENTS
  // -------------------------------------------------------------
  if (archetype === "ELECTRICAL" || hasAny("electrical engineer", "pcb designer", "power electronics")) {
    if (hasAny("pcb layout", "signal integrity", "ground plane", "impedance")) return "ELEC_PCB_SIGNAL_INTEGRITY";
    if (hasAny("buck", "boost", "inverter", "power converter", "power electronics")) return "ELEC_POWER_ELECTRONICS";
    if (hasAny("emc", "emi", "electromagnetic", "filtering", "shielding")) return "ELEC_EMC_EMI_COMPLIANCE";
    if (hasAny("voltage sag", "voltage ripple", "power rail failure")) return "ELEC_SCENARIO_VOLTAGE_SAG";
    return "ELEC_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // CIVIL INTENTS
  // -------------------------------------------------------------
  if (archetype === "CIVIL" || hasAny("civil engineer", "structural engineer")) {
    if (hasAny("structural load", "dead load", "live load", "seismic", "reinforced concrete")) return "CIVIL_STRUCTURAL_DESIGN";
    if (hasAny("geotechnical", "soil bearing", "foundation", "settlement")) return "CIVIL_GEOTECHNICAL_FOUNDATION";
    if (hasAny("differential settlement", "crack inspection", "structural anomaly")) return "CIVIL_SCENARIO_SETTLEMENT";
    return "CIVIL_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // CHEMICAL INTENTS
  // -------------------------------------------------------------
  if (archetype === "CHEMICAL" || hasAny("chemical engineer", "process engineer")) {
    if (hasAny("mass and energy balance", "thermodynamics", "reaction kinetics")) return "CHEM_MASS_ENERGY_BALANCES";
    if (hasAny("hazop", "process safety", "pressure relief", "runaway reaction")) return "CHEM_SAFETY_HAZOP";
    if (hasAny("temperature runaway", "exothermic reaction", "emergency quench")) return "CHEM_SCENARIO_RUNAWAY_REACTION";
    return "CHEM_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // AUTOMOBILE INTENTS
  // -------------------------------------------------------------
  if (archetype === "AUTOMOBILE" || hasAny("automobile engineer", "automotive", "ev engineer")) {
    if (hasAny("suspension", "vehicle dynamics", "chassis", "braking system")) return "AUTO_VEHICLE_DYNAMICS";
    if (hasAny("can bus", "lin bus", "iso 26262", "asil", "ecu communication")) return "AUTO_CAN_STANDARDS";
    if (hasAny("bus-off", "can communication error", "sensor timeout")) return "AUTO_SCENARIO_BUS_OFF";
    return "AUTO_GENERAL_PRACTICE";
  }

  // -------------------------------------------------------------
  // UI / UX INTENTS
  // -------------------------------------------------------------
  if (archetype === "UIUX" || hasAny("ui/ux", "product designer", "user experience")) {
    if (hasAny("user research", "usability testing", "heuristic evaluation", "persona")) return "UX_RESEARCH_HEURISTICS";
    if (hasAny("design system", "figma", "typography", "color contrast", "wcag")) return "UX_DESIGN_SYSTEM_A11Y";
    if (hasAny("drop-off", "checkout abandonment", "usability defect")) return "UX_SCENARIO_USABILITY_DROPOFF";
    return "UX_GENERAL_PRACTICE";
  }

  // Universal Behavioral / STAR
  const isBehavioral =
    hasAny("tell me about a time", "describe a situation where", "describe a time when", "describe a high-pressure situation", "give me an example of a time", "can you share an experience where you had to collaborate") ||
    (qLower.startsWith("describe") && hasAny("disagreement", "roadblock", "compromise", "conflict", "pushback", "interaction", "friction", "balance strict", "unexpected alert"));

  if (isBehavioral) {
    if (hasAny("disagreement", "conflict", "divergent")) return "UNIVERSAL_BEHAVIORAL_DISAGREEMENT";
    if (hasAny("roadblock", "unexpected obstacle", "challenge")) return "UNIVERSAL_BEHAVIORAL_ROADBLOCK";
    if (hasAny("changing requirements", "tight milestone", "deadline")) return "UNIVERSAL_BEHAVIORAL_DEADLINE";
    if (hasAny("collaborate", "cross-functional", "teamwork")) return "UNIVERSAL_BEHAVIORAL_COLLABORATION";
    return "UNIVERSAL_BEHAVIORAL_GENERAL";
  }

  // Universal Crisis / Scenario
  const isScenario = qLower.startsWith("scenario:") || hasAny("scenario:", "an incident occurs", "operational crisis", "major failure", "unexpected defect");
  if (isScenario) {
    return "UNIVERSAL_CRISIS_CONTAINMENT";
  }

  return "UNIVERSAL_TECHNICAL_PRACTICE";
}

/**
 * Stage 3: Question-Specific Reference Answer Synthesis
 */
function generateFallbackIdealAnswer(qText = "", level = "Intermediate", targetRoleName = "Engineering Professional", fieldName = "", highlights = {}, jobDescription = "") {
  const qLower = (qText || "").toLowerCase().trim();
  const archetype = detectDomainArchetype(fieldName, targetRoleName);

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasWord = (word) => {
    if (!word) return false;
    return new RegExp(`(?:^|[^a-zA-Z0-9_])${escapeRegex(word.toLowerCase())}(?:$|[^a-zA-Z0-9_])`, "i").test(qLower);
  };
  const hasPhrase = (phrase) => {
    if (!phrase) return false;
    const p = phrase.toLowerCase().trim();
    if (p.includes(" ") || p.includes("-") || p.includes("/")) {
      return qLower.includes(p);
    }
    return hasWord(p);
  };
  const hasAny = (...items) => items.some((item) => hasPhrase(item));
  const hasAll = (...items) => items.every((item) => hasPhrase(item));

  const intent = classifyQuestionIntent(qText, archetype);

  const defaultDomainSkill = (DOMAIN_DEFAULT_SKILLS[archetype] || DOMAIN_DEFAULT_SKILLS.GENERAL_ENGINEERING)[0];
  const skillsList = highlights.skills
    ? highlights.skills.split(",").slice(0, 3).map((s) => s.trim()).join(", ")
    : defaultDomainSkill;
  const primaryProj = highlights.projects
    ? highlights.projects.split(";")[0].split(",")[0].trim()
    : `practical projects in ${fieldName || "engineering"}`;

  let selectedAnswer = null;

  // -------------------------------------------------------------
  // INTENT DISPATCHER
  // -------------------------------------------------------------
  switch (intent) {
    case "INTRO":
      selectedAnswer = `I am a dedicated ${targetRoleName} with a strong foundation in ${skillsList}. Throughout my work, including ${primaryProj}, I focus on applying methodical engineering practices, domain standards, and rigorous quality principles to solve complex technical challenges. In this role, I look forward to leveraging my expertise in ${fieldName || "the domain"} to deliver high-impact, reliable results while collaborating effectively across engineering teams.`;
      break;

    // -------------------------------------------------------------
    // CYBERSECURITY REFERENCE ANSWERS
    // -------------------------------------------------------------
    case "CYBER_THREAT_HUNTING_FILELESS_LOLBINS":
      selectedAnswer = `In threat hunting for fileless malware and living-off-the-land binaries (LOLBins):\n• Understanding Fileless Attacks & LOLBins: Fileless malware executes entirely in volatile system memory (RAM) or registry scripts, leveraging legitimate built-in administrative binaries (LOLBins like powershell.exe, wmic.exe, mshta.exe, certutil.exe, regsvr32.exe, and rundll32.exe) to bypass traditional file-based signature antivirus.\n• Telemetry & Diagnostic Tools: I rely on deep endpoint telemetry including Microsoft Sysmon (Event ID 1 for process creation with full command-line arguments, Event ID 7 for image loading, and Event ID 10 for process access), PowerShell Script Block Logging (Event ID 4104), and enterprise EDR platforms (CrowdStrike, Defender for Endpoint, SentinelOne).\n• Behavioral Hunting Methodologies: I hunt for anomalous parent-child process lineages (e.g. Microsoft Office or web servers spawning PowerShell or cmd.exe), unusual base64-encoded command parameters (-enc, -w hidden), reflective DLL injection, and unapproved API calls to memory allocation functions (VirtualAlloc, WriteProcessMemory).\n• Containment & Defensive Hardening: Upon identifying malicious activity, I isolate affected endpoints via EDR, terminate rogue processes, enable PowerShell Constrained Language Mode (CLM), enforce AppLocker/Application Control policies to restrict unapproved LOLBin execution paths, and deploy custom Sigma behavioral hunting rules across the SIEM.`;
      break;

    case "CYBER_SCENARIO_DDOS_MITIGATION":
      selectedAnswer = `When mitigating a high-volume DDoS flood threatening external firewall and DNS availability:\n• Phase 1 (Triage & Attack Vector Identification): Analyze NetFlow/sFlow telemetry, edge firewall state tables, and DNS query metrics to identify attack characteristics (e.g. volumetric UDP/ICMP amplification, SYN flood exhausting connection states, or Layer 7 DNS/HTTP flood).\n• Phase 2 (Emergency Upstream Scrubbing & BGP Diversion): Immediately contact upstream Internet Service Providers (ISPs) and cloud DDoS mitigation providers (e.g. Cloudflare, AWS Shield, Akamai) to swing BGP routing announcements to external traffic scrubbing centers, absorbing multi-gigabit volumetric traffic upstream before it saturates edge firewalls.\n• Phase 3 (Authoritative DNS Protection): Protect DNS service availability by enabling Anycast DNS routing across multiple geolocations, applying DNS Response Rate Limiting (RRL), and dropping malformed, recursive, or amplification queries at upstream scrubbing edges.\n• Phase 4 (Edge Rate Limiting & Firewall Hardening): Configure perimeter rate limiting on edge firewalls, enable SYN cookies on load balancers to protect TCP connection tables from state exhaustion, and deploy challenge-based bot protection (managed CAPTCHA/JS challenges) on exposed web services.\n• Phase 5 (Continuous Monitoring & Recovery): Continuously monitor bandwidth utilization, latency, and packet drop metrics until the flood subsides, verify normal service restoration with external uptime monitors, and conduct a post-incident review to tune automated DDoS diversion thresholds and playbooks.`;
      break;

    case "CYBER_LEAST_PRIVILEGE_RBAC_ABAC":
      selectedAnswer = `In access control architecture and least privilege governance:\n• Principle of Least Privilege (PoLP): Users, applications, and system processes are granted only the minimum permissions necessary to execute authorized duties, with zero standing administrative privileges.\n• Role-Based Access Control (RBAC): Assigns permissions to standardized job roles (e.g. SOC Analyst Tier 1, Security Engineer), simplifying entitlement management across groups of users with shared responsibilities.\n• Attribute-Based Access Control (ABAC): Evaluates dynamic, contextual attributes (user department, device compliance health, geographic location, time of access, data sensitivity classification) using policy engines (XACML / OPA Rego) for fine-grained authorization.\n• Privileged Access Management (PAM): Enforces Just-in-Time (JIT) access elevation with multi-factor authentication, approval workflows, session recording, and automated credential rotation following administrative tasks.`;
      break;

    case "CYBER_NETWORK_TRAFFIC_ANALYSIS":
      selectedAnswer = `In practical network traffic analysis and PCAP investigation:\n• Telemetry & Ingestion: Capture and inspect raw packet streams (PCAPs) using Wireshark for deep interactive inspection and Zeek (Bro) for automated protocol parsing and connection logging across TCP, DNS, HTTP, and TLS handshakes.\n• Isolating Anomalous C2 Communication: Filter for suspicious beaconing patterns (regular or jittered connection intervals), non-standard port utilization, abnormal DNS query length and entropy (indicating DNS tunneling), and untrusted or self-signed TLS certificates with mismatched SNI headers.\n• Stream Reconstruction & Artifact Extraction: Reconstruct TCP streams to inspect unencrypted payloads, isolate compromised source IP addresses, and trace communication to external malicious infrastructure.\n• Defensive Containment: Extract atomic Indicators of Compromise (malicious IPs, domains, JA3 fingerprints) and deploy custom Suricata/Snort network IDS rules and perimeter firewall egress blocks to sever C2 channels.`;
      break;

    case "CYBER_NETWORK_SEGMENTATION_NGFW":
      selectedAnswer = `In network segmentation, micro-segmentation, and perimeter defense:\n• Network Segmentation & Security Zones: Partition enterprise networks into distinct security enclaves (User Tier, DMZ, Application Tier, Database Tier, Management VLAN) separated by Next-Generation Firewalls (NGFWs) with strict default-deny inter-zone policies.\n• Micro-Segmentation: Implement workload-level and hypervisor/software-defined networking (SDN) micro-segmentation policies to isolate lateral traffic between servers within the same subnet, stopping lateral threat spread.\n• Next-Generation Firewall (NGFW) Enforcement: Deploy NGFWs (Palo Alto, Fortinet) with Deep Packet Inspection (DPI), Application Identification (App-ID), User-ID mapping, and TLS inspection to enforce Layer 7 application policies rather than relying on port numbers alone.\n• Software-Defined Perimeters (SDP): Enforce identity-centric software-defined perimeters with continuous device posture assessment and mutual TLS (mTLS), granting authenticated users and workloads encrypted access only to specific authorized applications.`;
      break;

    case "CYBER_TIP_ENRICHMENT":
      selectedAnswer = `In integrating Threat Intelligence Platforms (TIP) to enrich SIEM alerts with Indicators of Compromise (IOCs):\n• Automated Feed Aggregation: Connect commercial and open-source threat intelligence feeds (AlienVault OTX, MISP, Recorded Future, CISA AIS) into a centralized TIP, deduplicating and normalizing IOCs (IPs, domains, hashes, URLs).\n• SIEM Telemetry Correlation: Ingest normalized IOC datasets into SIEM lookup tables (Splunk, Elastic, Sentinel), automatically correlating real-time network and endpoint events against high-fidelity threat indicators.\n• Threat Scoring & Contextualization: Assign dynamic confidence scores to IOCs based on source reliability, indicator age, and sighting frequency, enriching triggered alerts with threat actor attribution, known malware families, and recommended mitigation steps.\n• Automated Orchestration (SOAR): Route high-confidence alerts directly to SOAR playbooks for automated host quarantine or perimeter blocking while downgrading stale or low-confidence indicators to reduce analyst alert fatigue.`;
      break;

    case "CYBER_BEHAVIORAL_VULN_PRE_PROD":
      selectedAnswer = `• Situation: An exemplary response: During a pre-deployment security review, I identified a critical authorization flaw (such as an Insecure Direct Object Reference or unauthenticated API route) in a release candidate that would have exposed sensitive organizational data if deployed.\n• Task: My objective was to clearly articulate the exploitability and business risk to development leads and product stakeholders without creating adversarial friction, prioritizing remediation before release.\n• Action: I documented a responsible proof of concept demonstrating the vulnerability, calculated the potential risk impact, proposed a concrete code and configuration fix (enforcing server-side ownership verification), and worked collaboratively with developers to implement and validate the patch.\n• Result: The team integrated the fix prior to production rollout, added automated security regression test cases to the CI/CD pipeline to prevent recurrence, and strengthened collaborative security culture across the engineering team.`;
      break;

    case "CYBER_CRISIS_ZERO_DAY_GATEWAY":
      selectedAnswer = `When triaging an active in-the-wild zero-day exploit against an enterprise perimeter VPN gateway:\n• Phase 1 (Emergency Perimeter Isolation & Access Restriction): Immediately restrict or disable external administrative management access to the VPN gateway. Route authorized remote access through secondary secure jump hosts or restrict external VPN ingress to pre-approved corporate IP ranges.\n• Phase 2 (Vendor Mitigation & Virtual Patching): Apply vendor-published emergency workarounds or hotfixes immediately, or deploy custom Web Application Firewall (WAF) / Next-Gen Firewall IPS virtual patching signatures to drop malicious exploitation payloads before reaching the appliance.\n• Phase 3 (Compromise Assessment & Active Session Audit): Perform an immediate forensic audit of VPN connection logs, historical authentication records, and active sessions during the zero-day window. Terminate suspicious active sessions and check for anomalous data transfers or unauthorized administrative account creations.\n• Phase 4 (Lateral Movement & Internal Hunting): Threat-hunt across internal subnets connected to the VPN gateway for indicators of lateral movement (e.g. Pass-the-Hash, PsExec, anomalous Kerberos tickets, or unauthorized internal port scans originating from VPN IP pools).\n• Phase 5 (Credential Revocation & Hardening): Force credential rotation for administrative accounts, regenerate VPN device certificates/pre-shared keys, and maintain heightened 24/7 EDR monitoring across connected internal hosts.\n• Phase 6 (Post-Incident RCA & Runbook Update): Verify patch integrity, document root cause and timeline, and update incident response playbooks for zero-day perimeter gateway emergencies.`;
      break;

    case "CYBER_SIEM_CORRELATION_APT":
      selectedAnswer = `In engineering SIEM correlation rules and detecting APT activity:\n• Multi-Source Log Ingestion & Normalization: Ingest multi-source telemetry (Windows Event Logs, Linux Syslog, CloudTrail, Core Firewall, and EDR feeds) into a centralized SIEM (Splunk, Elastic, Sentinel), normalizing disparate fields according to Open Cybersecurity Schema Framework (OCSF).\n• Stateful Correlation & Chaining: Construct multi-stage stateful detection rules combining temporal thresholds and behavioral sequences (e.g. repeated authentication failures across multiple endpoints followed by successful privilege escalation and unapproved PowerShell execution within a 10-minute window).\n• False Positive Baselining: Benchmark detection rules against 30-day historical operational baselines, implement whitelists for authorized administrative automation scripts, and continuously track alert fidelity to eliminate SOC alert fatigue.`;
      break;

    case "CYBER_FRAMEWORKS_NIST_ISO_CIS":
      selectedAnswer = `In aligning enterprise security architectures with recognized cybersecurity frameworks (NIST CSF, ISO 27001, and CIS Controls):\n• Framework Selection & Governance: I leverage NIST CSF (Identify, Protect, Detect, Respond, Recover) as the overarching risk management lifecycle, ISO 27001 for formal Information Security Management System (ISMS) governance and external certification audits, and CIS Critical Security Controls (v8) for prioritized technical baseline hardening (e.g. inventory controls, secure configurations, continuous vulnerability management).\n• Gap Assessment & Maturity Scoring: I conduct comprehensive maturity gap assessments against current-state security controls, quantifying organizational maturity across each domain and prioritizing critical deficiencies in a centralized risk register.\n• Technical Control Mapping: I map technical solutions (EDR, SIEM, Firewalls, IAM, WAF) to specific framework controls, formalizing standard operating procedures (SOPs), data classification policies, and audit evidence artifacts.\n• Continuous Control Auditing: I establish continuous telemetry-based control monitoring and quarterly audit reviews to maintain alignment with organizational risk appetite and regulatory mandates.`;
      break;

    case "CYBER_CRYPTO_SYMMETRIC_ASYMMETRIC":
      selectedAnswer = `In cryptographic architecture and data-in-transit security:\n• Symmetric vs Asymmetric Algorithms: Symmetric encryption (AES-256-GCM, ChaCha20) uses a shared secret key for high-throughput bulk data encryption, while asymmetric encryption (RSA-4096, ECC/ECDSA) uses public-private key pairs for digital signatures, identity verification, and key encapsulation.\n• Modern TLS 1.3 Handshake: Secure communication starts with client/server hello negotiating cipher suites, followed by ephemeral Diffie-Hellman (ECDHE) key exchange providing Perfect Forward Secrecy (PFS), and authenticating the server via X.509 digital certificates.\n• Certificate Revocation & Trust: Enterprise trust chains are maintained by validating root CA signatures and querying Online Certificate Status Protocol (OCSP) stapling or Certificate Revocation Lists (CRLs) to guard against revoked or compromised certificates.`;
      break;

    case "CYBER_VULN_SCAN_VS_PENTEST":
      selectedAnswer = `In evaluating enterprise security posture across assessments:\n• Vulnerability Scanning: Automated, non-intrusive scans (using tools like Nessus, Qualys, or OpenVAS) designed to identify known software flaws, misconfigurations, and missing patches across a broad attack surface against standard CVE databases.\n• Risk Assessment: A formal governance and analytical process evaluating the likelihood and business impact of identified vulnerabilities, factoring in asset criticality, threat agent capability, and existing compensating controls.\n• Active Penetration Testing: Manual, simulated adversarial engagements where ethical hackers actively exploit vulnerabilities, chain multiple low-severity weaknesses, test defensive detection thresholds, and attempt to achieve specific objectives (e.g. exfiltrating crown-jewel data or domain admin escalation).`;
      break;

    case "CYBER_PKI_DIGITAL_CERTIFICATES":
      selectedAnswer = `In Public Key Infrastructure (PKI) and enterprise certificate lifecycle management:\n• Certificate Hierarchy: Hierarchical trust models utilize an offline Root Certificate Authority (CA) that signs subordinate Intermediate CAs, which issue end-entity certificates for TLS servers, VPN endpoints, and code signing.\n• Revocation Mechanisms: Revocation status is validated via Certificate Revocation Lists (CRLs) and real-time Online Certificate Status Protocol (OCSP) with OCSP Stapling enabled on web servers to minimize latency and preserve client privacy.\n• Automated Lifecycle Management: I utilize protocols like ACME (Automated Certificate Management Environment) or SCEP/EST to automate certificate enrollment, renewal, and installation, preventing catastrophic service outages caused by expired certificates.`;
      break;

    case "CYBER_MFA_FATIGUE":
      selectedAnswer = `In Multi-Factor Authentication (MFA) mechanisms and defending against bypass techniques:\n• Mechanism Comparison: Time-based One-Time Passwords (TOTP) provide solid out-of-band security; push notifications provide high usability but remain vulnerable to MFA fatigue; FIDO2/WebAuthn hardware security keys (YubiKeys) provide phishing-resistant cryptographic binding to the origin URL.\n• Defending Against MFA Fatigue: To neutralize prompt-bombing attacks, I enforce number-matching challenges (requiring the user to type a 2-digit number displayed on the login screen), enable geographic and IP anomaly alerting, and enforce risk-based adaptive step-up authentication.\n• Lockout & Triage: After three unprompted push rejections within a short window, the user account is temporarily locked, and a high-priority SOC alert is dispatched to investigate potential credential compromise.`;
      break;

    case "CYBER_DNS_SECURITY":
      selectedAnswer = `In DNS security auditing and threat mitigation:\n• Threat Vectors: Attackers exploit DNS for Command & Control (C2) communication, high-entropy DNS tunneling (exfiltrating base64/hex data via TXT queries), DNS cache poisoning (spoofing resolver caches), and unauthorized domain hijacking.\n• Defensive Telemetry: I audit DNS query logs across internal resolvers and firewall sensors, monitoring query volume anomalies, domain generation algorithms (DGAs), and newly registered domains (NRDs).\n• Technical Mitigations: Enforce DNSSEC (Domain Name System Security Extensions) with cryptographic signature validation (RRSIG/DS records), implement DNS sinkholing for known malicious indicators, and enforce registrar registry locks and DNS CAA records.`;
      break;

    case "CYBER_ATTACK_SIMULATION":
      selectedAnswer = `In simulating attack vectors and validating defensive security controls:\n• Controlled Testing Environment: I execute simulated adversarial campaigns in isolated sandbox labs and purple-team ranges adhering to strict Rules of Engagement (ROE).\n• Adversary TTP Execution: Using frameworks like Atomic Red Team and Caldera mapped to MITRE ATT&CK, I simulate password spraying, controlled port scanning (Nmap), Kerberoasting, and mock payload execution.\n• Control Validation: During and after execution, I inspect SIEM (Splunk/Sentinel), EDR (CrowdStrike/Sysmon), and firewall logs to ensure alerts trigger at the appropriate severity tier and automated containment playbooks fire as designed.\n• Gap Remediation: Any detection blind spot is documented, analyzed, and mitigated by writing new Sigma/YARA detection rules and tuning firewall ACLs.`;
      break;

    case "CYBER_LOG_INGESTION_PIPELINE":
      selectedAnswer = `In architecting a threat monitoring log ingestion pipeline:\n• Log Forwarding: Deploy lightweight log collectors (Fluentbit, Logstash, Splunk Universal Forwarder) across domain controllers, cloud infrastructure, network appliances, and endpoint operating systems.\n• Parsing & Schema Normalization: Ingest unstructured syslogs and event streams, parse log structures using Grok/Regex patterns, and normalize field names to Open Cybersecurity Schema Framework (OCSF) or Elastic Common Schema (ECS).\n• Custom Detection Rules: Develop stateful correlation queries with severity weighting (e.g. flagging anomalous PowerShell downloading scripts from external IPs), configure automated alert deduplication, and route critical events directly to on-call SOC queues.`;
      break;

    case "CYBER_EDR_DEPLOYMENT_TUNING":
      selectedAnswer = `In Endpoint Detection and Response (EDR) engineering:\n• Agent Deployment & Policy Hardening: Deploy EDR agents (CrowdStrike Falcon, Microsoft Defender for Endpoint, SentinelOne) enterprise-wide with tamper protection, full-disk memory scanning, and kernel-level process monitoring enabled.\n• Behavioral Threat Detection: Configure behavioral blocking rules for LSASS memory dumping (Mimikatz), malicious process injection (process hollowing, reflective DLL loading), and script-based Living-off-the-Land (LotL) binaries (certutil, powershell).\n• Policy Tuning & Exclusion Management: Perform rigorous baseline profiling of development tools and system administration scripts, creating cryptographic-hash-bound exclusions to eliminate false positives without opening security blind spots.`;
      break;

    case "CYBER_VULN_PRIORITIZATION_CVSS":
      selectedAnswer = `In vulnerability management and patch prioritization workflows:\n• Scoring & Contextualization: I combine CVSS v3.1/v4 base scores with Exploit Prediction Scoring System (EPSS) probabilities, CISA Known Exploited Vulnerabilities (KEV) catalog status, and internal asset criticality matrices.\n• SLA-Driven Remediation: Enforce strict remediation SLAs: Critical vulnerabilities with active in-the-wild exploitation patched within 24–48 hours; High vulnerabilities remediated within 14 days; Medium within 30 days.\n• Verification & Reporting: Following patch deployment, execute automated delta resynchronization scans to verify successful remediation and generate executive compliance scorecards.`;
      break;

    case "CYBER_CLOUD_INFRASTRUCTURE_IAM":
      selectedAnswer = `In evaluating cloud infrastructure and IAM security posture (AWS/Azure):\n• Storage & Network Hardening: Audit cloud storage (AWS S3 bucket policies / Azure Blob containers) to eliminate public access, enforce server-side encryption (KMS CMKs), and restrict network ingress via VPC Service Endpoints.\n• IAM Least Privilege: Eliminate wildcard permissions (\`*\`), convert long-lived credentials to short-lived IAM roles with OIDC federation, and enforce Multi-Factor Authentication for all administrative consoles.\n• Guardrails & Posture Management: Implement Service Control Policies (SCPs) and Azure Policy initiatives, continuously monitoring compliance using Cloud Security Posture Management (CSPM) tools.`;
      break;

    case "CYBER_OWASP_ZERO_TRUST":
      selectedAnswer = `In mitigating OWASP Top 10 vulnerabilities and establishing Zero Trust architecture:\n• SQL Injection (SQLi): Enforce parameterized queries (PreparedStatements) and ORM query abstraction, apply strict input validation, and restrict database account privileges using Least Privilege.\n• Cross-Site Scripting (XSS): Implement context-aware output encoding, sanitize dynamic content using DOMPurify, enforce strict Content Security Policies (CSP: default-src 'self'), and store authentication tokens in HttpOnly, Secure, SameSite cookies.\n• Broken Access Control: Enforce server-side Role-Based and Attribute-Based Access Control (RBAC/ABAC) on every API endpoint, validate object ownership to prevent Insecure Direct Object References (IDOR), and deny access by default.\n• Zero Trust Network Architecture: Adopt the core principle 'Never Trust, Always Verify' across identity and network perimeters. Enforce continuous risk-based Multi-Factor Authentication (MFA), micro-segmentation with software-defined perimeters (SDP), mutual TLS (mTLS) for all service-to-service communication, and continuous endpoint health checks.`;
      break;

    case "CYBER_MALWARE_ANALYSIS":
      selectedAnswer = `In static and dynamic malware analysis of suspicious files and scripts:\n• Safe Containment: Perform all analysis inside an isolated, non-networked malware sandbox virtual machine with memory snapshotting and host isolation.\n• Static Analysis: Extract cryptographic hashes (SHA-256), inspect Portable Executable (PE) headers, strings, import address tables (IAT), and disassemble suspicious PowerShell/VBScript to identify obfuscated commands, encoded base64 strings, and hardcoded C2 domains.\n• Dynamic Analysis: Execute the payload in a dynamic behavioral sandbox (Cuckoo/ANY.RUN), capturing process tree creation, registry persistence modifications, file drops, and network traffic callbacks in Wireshark.\n• Threat Eradication: Extract atomic Indicators of Compromise (IOCs), author YARA and Sigma detection signatures, and deploy enterprise-wide EDR containment.`;
      break;

    case "CYBER_MITRE_ATTACK_MAPPING":
      selectedAnswer = `In mapping adversary TTPs to the MITRE ATT&CK framework:\n• Matrix Mapping: Align SOC detection logic and threat intelligence reports to specific ATT&CK tactics (Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Lateral Movement, Exfiltration).\n• Coverage Heatmaps: Utilize the MITRE ATT&CK Navigator to generate enterprise detection heatmaps, color-coding techniques by validation status (e.g. Blocked by EDR, Detected by SIEM, or Blind Spot).\n• Detection Engineering: Prioritize engineering new detection rules for high-risk adversary techniques (e.g. T1059 Command and Scripting Interpreter, T1003 OS Credential Dumping) and validate coverage with purple-team simulations.`;
      break;

    case "CYBER_SOAR_PLAYBOOKS":
      selectedAnswer = `In engineering automated Security Orchestration, Automation, and Response (SOAR) playbooks:\n• Playbook Workflow Design: Design automated triage playbooks in SOAR platforms (Cortex XSOAR, Splunk SOAR) for high-volume, repetitive alerts (such as reported phishing emails and endpoint malware detections).\n• Automated Enrichment: Automatically parse artifacts from alerts, query Threat Intelligence Platforms (VirusTotal, AlienVault OTX, AbuseIPDB) for IP/domain reputation scores, and calculate automated risk scores.\n• Controlled Orchestration: For confirmed high-fidelity threats, execute automated containment (quarantining infected endpoints via EDR, blocking malicious IPs at firewalls, and revoking compromised user sessions) while routing ambiguous cases to human analysts with full context.`;
      break;

    case "CYBER_DLP_CONTROLS":
      selectedAnswer = `In Data Loss Prevention (DLP) architecture and monitoring:\n• Data Classification: Implement automated data classification labels (Public, Internal, Confidential, Restricted) across files, databases, and emails using natural language pattern matching and regex expressions (identifying SSNs, PII, PCI data, and API keys).\n• Multi-Vector Enforcement: Deploy DLP policies across three core vectors: Endpoint DLP (blocking unencrypted USB transfers, screen captures of sensitive apps), Network DLP (inspecting web and email egress for unauthorized data transmissions), and Cloud DLP (monitoring OneDrive, Google Drive, and AWS S3 sharing permissions).\n• Incident Triage: Investigate high-risk policy violations, evaluate exfiltration intent versus user error, and educate end-users via real-time policy warning prompts.`;
      break;

    case "CYBER_FIREWALL_EDR_FALSE_POSITIVES":
      selectedAnswer = `In tuning firewall access control lists (ACLs) and EDR behavioral policies:\n• Baseline Profiling: Conduct rigorous baseline traffic and process profiling during a dedicated monitoring/learning phase prior to switching policies to blocking mode.\n• Precision Tuning: When tuning EDR behavioral alerts for legitimate administrative scripts (e.g. PowerShell automation or SCCM software distribution), bind exclusions to specific parent-child process relationships, full executable file paths, and cryptographic code-signing certificates rather than generic path wildcards.\n• Metric Tracking: Continuously measure SOC alert precision (True Positive Rate) and false positive noise, retiring low-fidelity signatures and updating detection documentation.`;
      break;

    case "CYBER_SUSPICIOUS_EVENT_INVESTIGATION":
      selectedAnswer = `In investigating a suspicious security event in SIEM/SOC operations:\n• Triage & Blast Radius Scoping: Analyze the initial alert trigger in the SIEM, immediately pivoting across endpoint EDR telemetry, firewall traffic logs, authentication events, and DNS records to determine the full scope of compromised hosts and accounts.\n• Root Cause Analysis: Reconstruct the complete attack timeline from initial access (e.g. malicious macro execution from email) through execution, persistence, and lateral movement.\n• Containment & Eradication: Isolate affected endpoints from the network via EDR host isolation, terminate unauthorized active sessions, block external adversary C2 infrastructure at perimeter firewalls, and purge persistence artifacts.\n• Post-Incident Remediation: Compile a structured incident summary detailing attack vectors, impact, and actionable recommendations to update detection rules and harden defenses against recurrence.`;
      break;

    case "CYBER_CREDENTIAL_STUFFING":
      selectedAnswer = `In credential stuffing and brute-force mitigation:\n• Perimeter Defenses: Implement Web Application Firewall (WAF) bot management rules, IP reputation filtering, and aggressive rate limiting on authentication endpoints.\n• Adaptive Authentication: Deploy risk-based adaptive authentication that triggers CAPTCHA challenges or step-up Multi-Factor Authentication upon detecting anomalous login velocity, known Tor exit nodes, or unfamiliar geolocations.\n• Breached Password Checking: Integrate API lookups against known compromised credential databases (e.g. Have I Been Pwned / enterprise identity threat databases) to block user logins matching active credential dumps and force password resets.`;
      break;

    case "CYBER_PERSISTENCE_HUNTING":
      selectedAnswer = `In threat hunting for stealthy persistence mechanisms:\n• Telemetry Inspection: Query endpoint telemetry (Sysmon, EDR logs) for suspicious modifications to Windows Registry Run keys (\`HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\`), Scheduled Tasks, WMI event subscriptions, and rogue system service installations.\n• Baseline Comparison: Compare running services and auto-start extensibility points against known-good golden image baselines across servers and workstations.\n• Eradication: Terminate unauthorized services, delete persistence registry keys and scheduled task triggers, and deploy automated hunting scripts across all enterprise hosts to verify no dormant persistence survives.`;
      break;

    case "CYBER_SCENARIO_BEACONING_LATERAL":
      selectedAnswer = `When responding to abnormal outbound beaconing and lateral movement on an internal database subnet:\n• Phase 1 (Triage & C2 Identification): Analyze network flow telemetry, firewall logs, and DNS query logs to identify Command and Control (C2) beaconing intervals (jitter/heartbeats), destination IP/domains, and compromised internal source hosts.\n• Phase 2 (Emergency Isolation & Containment): Immediately isolate the affected database subnet and beaconing endpoints via EDR host isolation and firewall egress sinkholing, while severing lateral communication paths (disabling SMB/RDP/WMI lateral ports).\n• Phase 3 (Lateral Movement Investigation): Hunt for Pass-the-Hash, PsExec, and PowerShell remoting artifacts across domain controllers and database servers. Inspect Kerberos Ticket Granting Service (TGS) requests for Kerberoasting activity.\n• Phase 4 (Evidence Preservation & Forensic Analysis): Capture volatile RAM and forensic disk images of patient-zero systems under strict chain of custody protocols.\n• Phase 5 (Eradication & Recovery): Rebuild compromised hosts from known-good golden images, force enterprise-wide credential rotations for all administrative and service accounts, and verify database integrity.\n• Phase 6 (Lessons Learned): Create custom Sigma/YARA detection rules for the identified adversary behavior and update SOC incident response playbooks.`;
      break;

    case "CYBER_SCENARIO_PHISHING":
      selectedAnswer = `When containing a phishing incident involving a clicked malicious attachment:\n• Immediate Host Isolation: Isolate the affected user's endpoint from the network via EDR host isolation while preserving internet connectivity to the EDR cloud console for live response.\n• Gateway Block & Message Purge: Extract malicious attachment hashes and embedded phishing URLs, add them to email security gateway blocklists, and execute an automated search-and-purge query to delete the weaponized email from all organizational inboxes.\n• Forensic Triage: Analyze EDR process creation logs on the victim machine to determine if macro execution spawned child processes (cmd.exe, powershell.exe, certutil.exe), dropped payloads, or established network connections.\n• Identity Protection: If credential harvesting is suspected, immediately terminate all active user web and VPN sessions, reset the Active Directory password, and revoke OAuth application tokens.`;
      break;

    case "CYBER_SCENARIO_UNPATCHED_RCE":
      selectedAnswer = `When applying compensating controls for an unpatched Remote Code Execution (RCE) on a mission-critical non-rebootable server:\n• Network Isolation: Move the vulnerable server into an isolated quarantine VLAN with micro-segmentation firewall rules restricting ingress traffic exclusively to designated administrative jump boxes over encrypted tunnels.\n• WAF Virtual Patching: Deploy custom Web Application Firewall (WAF) and Next-Gen Firewall IPS virtual patching signatures that inspect incoming payload patterns and block specific exploit signatures before reaching the server.\n• Service Hardening & Least Privilege: Disable unnecessary server sub-features and remote management services, restrict operating system service account permissions, and remove outbound internet access from the server to prevent reverse shell callbacks.\n• Enhanced EDR Monitoring: Configure heightened EDR behavioral alerting with strict in-memory execution blocking and continuous file integrity monitoring (FIM).`;
      break;

    case "CYBER_SCENARIO_PRIVILEGE_ANOMALY":
      selectedAnswer = `When responding to multiple failed authentication attempts followed by a successful privileged login from an unknown external IP:\n• Immediate Session Revocation: Immediately terminate all active web, VPN, and SSH/RDP sessions for the compromised user account and temporarily disable the account in Active Directory / Azure AD.\n• Perimeter IP Block: Block the external attacker IP address across all perimeter firewalls and Cloudflare/WAF edge gateways.\n• Forensic Audit: Inspect authentication logs, audit trails, and command histories (PowerShell/Bash history, CloudTrail) during the window of unauthorized access to identify any unauthorized data access, privilege modifications, or persistence creation.\n• Remediation & Re-Enrollment: Enforce a full credential reset, verify that MFA tokens were not re-enrolled on an unauthorized device, and conduct an audit of other enterprise accounts accessed from the same subnet.`;
      break;

    case "CYBER_SCENARIO_MIMIKATZ_MEMORY":
      selectedAnswer = `When responding to an endpoint alert for anomalous PowerShell execution attempting in-memory Mimikatz invocation:\n• Immediate Endpoint Isolation: Execute network isolation of the affected endpoint via EDR host isolation while maintaining console connectivity for forensic response.\n• Volatile Memory Preservation: Prior to killing the malicious process or rebooting, capture a volatile memory dump (RAM) using WinPmem or EDR live response for full process analysis.\n• Process Termination & LSASS Protection: Terminate the offending PowerShell process, verify that LSASS process access was blocked by EDR Credential Guard / RunAsPPL, and verify no dump files were written to disk.\n• Credential Revocation: Invalidate active Kerberos tickets and force immediate password and session resets for any account logged into the affected host during the event.`;
      break;

    case "CYBER_ZERO_DAY_THREAT_INTEL":
      selectedAnswer = `In staying ahead of emerging zero-day vulnerabilities and threat intelligence:\n• Automated Threat Intelligence Ingestion: I ingest structured STIX/TAXII threat feeds (e.g. FS-ISAC, AlienVault OTX, Mandiant, CISA AIS) directly into SIEM/SOAR platforms to automatically enrich telemetry and correlate emerging Indicators of Compromise (IOCs).\n• Vulnerability Monitoring & Advisories: I continuously track CISA's Known Exploited Vulnerabilities (KEV) catalog, NVD CVE disclosures, vendor security bulletins (Microsoft MSRC, Cisco PSIRT), and zero-day research disclosures from Project Zero and BleepingComputer.\n• Hands-On Lab Research & Purple Teaming: I reverse-engineer public proof-of-concept (PoC) exploits in isolated sandbox labs, participate in CTF competitions, and execute purple-team emulation exercises to test and refine organizational detection engineering rules.\n• Community Collaboration: I actively engage in threat research communities (Infosec Mastodon/Twitter, GitHub Sigma repositories, SANS ISC handler diaries) to understand novel attacker tradecraft before widespread exploitation.`;
      break;

    case "CYBER_INCIDENT_RESPONSE_PLAYBOOKS":
      selectedAnswer = `In creating, documenting, and maintaining SOC incident response playbooks and SOPs:\n• Playbook Structure: Standardize playbooks around the 6-phase NIST SP 800-61 lifecycle (Preparation, Detection & Analysis, Containment, Eradication, Recovery, Lessons Learned), defining clear trigger conditions, severity matrices, and step-by-step triage checklists.\n• RACI & Escalation Pathways: Clearly define roles and responsibilities (RACI matrices) for SOC analysts, incident commanders, legal counsel, PR, and executive leadership.\n• Regular Review & Tabletop Drills: Conduct semi-annual tabletop simulation exercises (TTXs) with technical teams and business stakeholders to test playbooks against realistic adversary scenarios, updating runbooks based on post-incident retrospectives.`;
      break;

    case "CYBER_PURPLE_TEAM_EMULATION":
      selectedAnswer = `In conducting purple-team adversary emulation exercises:\n• Collaborative Objective Scoping: Red and blue teams collaborate to select specific adversary tactics from MITRE ATT&CK (e.g. LSASS dumping via comsvcs.dll or DLL side-loading) to test in a non-disruptive, controlled sequence.\n• Atomic Execution & Real-Time Monitoring: Red team executes specific technique variations while blue team monitors EDR, SIEM, and firewall consoles to verify whether the technique generated raw telemetry, triggered a low-severity alert, or executed undetected.\n• Immediate Rule Tuning: For any detection gap identified, both teams collaborate on-the-fly to author new Sigma detection rules, tighten endpoint configurations, and re-test the technique until 100% detection fidelity is verified.`;
      break;

    case "CYBER_COMPLIANCE_MANDATES":
      selectedAnswer = `In aligning enterprise security monitoring and audit logging with regulatory compliance mandates (PCI-DSS, HIPAA, SOC 2 Type II, GDPR):\n• Audit Log Collection: Configure comprehensive audit logging across all systems storing or processing regulated data, capturing user authentications, administrative privilege elevations, data access events, and system configuration modifications.\n• Immutable Log Storage & NTP: Store audit logs in centralized, immutable write-once-read-many (WORM) storage with cryptographic hashing, automated backups, and strict Network Time Protocol (NTP) time synchronization.\n• Retention & Compliance Dashboards: Enforce regulatory retention policies (e.g. 1 year for PCI-DSS) and build automated compliance dashboards tracking access reviews, vulnerability patch compliance, and incident response SLA metrics.`;
      break;

    case "CYBER_BEHAVIORAL_DISAGREEMENT":
      selectedAnswer = `• Situation: An exemplary response: During a security architecture review, a senior engineer and I had divergent technical perspectives regarding whether to enforce strict kernel-level EDR process blocking or rely on monitoring-only mode for critical production servers.\n• Task: My objective was to resolve the disagreement constructively, eliminate subjective assumptions, and establish an optimal security posture without introducing application stability risks.\n• Action: I proposed conducting an empirical side-by-side benchmark proof of concept across a staging replica. We monitored CPU overhead, memory consumption, latency, and simulated false-positive impact under peak synthetic workloads over a test period while analyzing detection telemetry together.\n• Result: The benchmark proved that kernel blocking operated cleanly within safe performance thresholds without blocking critical services. The team unanimously adopted the data-backed configuration, delivering the milestone on schedule and strengthening collaborative trust.`;
      break;

    case "CYBER_BEHAVIORAL_SECURITY_VS_PRODUCTIVITY":
      selectedAnswer = `• Situation: An exemplary response: While rolling out mandatory pre-deployment security scanning and strict vulnerability gating, software engineering leads expressed concern that manual security reviews were creating bottlenecks that delayed sprint releases.\n• Task: My goal was to reconcile rigorous security guardrails with developer velocity, eliminating friction and transforming security into an automated enabler.\n• Action: I worked directly with DevOps leads to shift security left into the CI/CD pipeline. We integrated automated SAST and container vulnerability linters that run within seconds and provide developers with automated pull-request remediation guidance. We also created pre-approved secure golden base images and established clear, automated exemption workflows for non-exploitable edge cases.\n• Result: Release cycle velocity improved significantly while pre-production security defects were reduced, establishing a culture of proactive DevSecOps collaboration.`;
      break;

    case "CYBER_BEHAVIORAL_EXECUTIVE_COMM":
      selectedAnswer = `• Situation: An exemplary response: When our security team identified a critical vulnerability in our customer-facing authentication gateway, I was tasked with briefing executive leadership on the risk and justifying an emergency maintenance window.\n• Task: My objective was to communicate the technical vulnerability clearly to non-technical C-suite executives without inducing panic, framing the risk in terms of business impact, financial liability, and customer trust.\n• Action: I structured the briefing around an executive risk scorecard. Instead of detailing low-level exploit payloads, I explained the potential business impact (risk of customer data exposure and regulatory fines), presented a clear 3-step mitigation plan, and showed how our proposed maintenance window would eliminate the vulnerability with minimal customer disruption.\n• Result: The executive team approved the maintenance plan unanimously. The patch was deployed smoothly, and executive leadership commended the clarity and business alignment of our security communication.`;
      break;

    case "CYBER_BEHAVIORAL_ONCALL":
      selectedAnswer = `• Situation: An exemplary response: During an on-call shift, multiple high-severity alerts fired simultaneously across our SIEM, including potential brute-force activity on an external portal and anomalous script execution on an internal server.\n• Task: My objective was to manage the high-pressure situation methodically, prioritize competing demands, and contain genuine threats without succumbing to alert fatigue.\n• Action: I applied our SOC severity triage matrix to evaluate blast radius and asset criticality. I prioritized the internal server alert, initiating immediate EDR host isolation to contain potential lateral movement while executing an automated IP block on the external brute-force source. I then notified the incident commander and systematically investigated both incidents.\n• Result: Both incidents were successfully contained with zero data loss, and I completed comprehensive post-incident documentation to automate future responses.`;
      break;

    case "CYBER_CRISIS_RANSOMWARE_EXFILTRATION":
      selectedAnswer = `When leading the response to an enterprise ransomware outbreak and active data exfiltration:\n• Phase 1 (Emergency Network Containment & Isolation): Immediately sever external VPN and inter-site WAN connections, disconnect infected subnets at the core switch level, and execute EDR host isolation across all flagged endpoints to halt lateral worm propagation and ongoing exfiltration.\n• Phase 2 (Volatile Evidence Preservation): Before power cycling or rebuilding any system, capture volatile RAM and bit-stream disk images of patient-zero systems under strict chain of custody protocols for forensic analysis and regulatory reporting.\n• Phase 3 (Scope Assessment & Root Cause Analysis): Analyze EDR process trees, Kerberos authentications, and firewall egress logs to identify initial access vectors, compromised domain administrator accounts, and exfiltration staging locations.\n• Phase 4 (Eradication & Credential Rotation): Terminate adversary C2 channels, block external malicious IPs/domains globally, reset all Active Directory user and service account passwords (including double KRBTGT password rotation), and patch exploited vulnerabilities.\n• Phase 5 (Clean Recovery from Immutable Backups): Validate the integrity of offline, immutable air-gapped backups and systematically restore critical services in an isolated staging environment before re-introducing production traffic.\n• Phase 6 (Post-Incident Reporting & Compliance): Compile an exhaustive forensic post-mortem report detailing the attack timeline and root cause, coordinate required regulatory disclosures (e.g. GDPR/SEC/HIPAA breach notifications within mandated statutory timeframes), and update incident response runbooks.`;
      break;

    case "CYBER_CRISIS_INSIDER_THREAT":
      selectedAnswer = `When conducting a covert forensic investigation into a suspected insider data theft:\n• Covert Telemetry & Chain of Custody: Work under strict non-disclosure with Legal and HR to establish a formal chain of custody. Enable covert audit logging on database transaction logs, egress proxies, and file servers without alerting the suspect.\n• Forensic Evidence Collection: Mirror the suspect's user sessions, capture full database query logs, analyze USB insertion telemetry, and inspect cloud storage sharing records to quantify exact exfiltrated records.\n• Evidence Preservation & Coordinated Revocation: When evidence is solidified, coordinate with HR and Executive Leadership to freeze the suspect's physical access badges and digital credentials simultaneously, preserving all digital evidence for potential legal proceedings.`;
      break;

    case "CYBER_CRISIS_EXPOSED_CLOUD_KEY":
      selectedAnswer = `When responding to an administrative service account key accidentally committed to a public repository:\n• Immediate Credential Revocation: Immediately delete or deactivate the exposed access key via the cloud IAM management console, terminating all active authenticated sessions.\n• Activity Log Auditing: Inspect CloudTrail / Azure Activity Logs for all actions initiated by the compromised key, reviewing resource creation, permission escalations, and unexpected outbound data transfers.\n• Key Rotation & Pre-Commit Hardening: Generate a new secret key, update dependent production services via secure secret vaults (HashiCorp Vault / AWS Secrets Manager), and enforce pre-commit secret-scanning hooks across all developer workstations.`;
      break;

    case "CYBER_RESUME_PROJECT":
      selectedAnswer = `In my practical cybersecurity project work (${primaryProj}):\n• Scoping & Architecture: I designed and configured the security architecture, integrating log shippers, centralized SIEM correlation rules, and endpoint monitoring telemetry.\n• Threat Analysis & Simulation: I simulated adversary attack vectors (including brute-force authentication, port scanning, and suspicious script execution) to evaluate alert fidelity and measure Mean Time to Detect (MTTD).\n• Control Hardening & Outcomes: I documented findings in comprehensive incident response reports, remediated control gaps, tuned false positives, and established standard operating procedures that significantly strengthened overall defense-in-depth posture.`;
      break;

    case "CYBER_GENERAL_PRACTICE":
      selectedAnswer = `In cybersecurity engineering for ${targetRoleName}:\n• Threat Detection & SIEM: Ingest and correlate multi-source telemetry (firewall, endpoint EDR, cloud logs) into SIEM with custom detection rules mapped to MITRE ATT&CK.\n• Vulnerability & Threat Mitigation: Remediate OWASP Top 10 web vulnerabilities, enforce input sanitization, parameterized queries, and automated dependency scanning.\n• Access Control & Hardening: Enforce Least Privilege RBAC, Multi-Factor Authentication (MFA), network segmentation, and cryptographic key rotation.\n• Incident Response: Execute structured containment, volatile forensic preservation, eradication, and post-incident root-cause remediation.`;
      break;

    // -------------------------------------------------------------
    // FRONTEND DEVELOPER REFERENCE ANSWERS
    // -------------------------------------------------------------
    case "FRONTEND_VIRTUAL_DOM_RECONCILIATION":
      selectedAnswer = `In React and modern frontend rendering architecture:\n• Virtual DOM vs Real DOM: The Real DOM represents the browser's actual HTML tree, where direct mutations trigger expensive style calculations, layout recalculation, and page repaints. The Virtual DOM is a lightweight in-memory JavaScript representation of the UI.\n• React Fiber & Reconciliation: When component state changes, React creates a new Virtual DOM tree and executes its diffing algorithm (Reconciliation) using React Fiber. It identifies the minimal set of DOM nodes that changed and batches those mutations into a single optimized DOM update.\n• Key Props & Heuristics: Stable \`key\` props in lists allow React to match existing fiber nodes across renders, avoiding unnecessary unmounting and recreating of DOM elements.`;
      break;

    case "FRONTEND_LIFECYCLE_STATE_RENDER":
      selectedAnswer = `In component lifecycle, state management, and render performance:\n• Re-Render Triggers: React components re-render whenever their state updates, their parent component re-renders, or context values they consume change.\n• Optimization Techniques: I leverage memoization (\`React.memo\` for component purity, \`useMemo\` for expensive calculations, and \`useCallback\` to preserve referential equality of callbacks passed to children).\n• State Colocation & Architecture: I keep state colocated as close as possible to where it is used rather than lifting state unnecessarily, minimizing broad tree re-renders.`;
      break;

    case "FRONTEND_CSS_BOX_MODEL_LAYOUT":
      selectedAnswer = `In modern CSS architecture and responsive layout design:\n• Box Model: Every element is composed of content, padding, border, and margin. I universally apply \`box-sizing: border-box\` so that padding and border are included in the element's total width and height.\n• Flexbox vs CSS Grid: I use Flexbox for 1-dimensional component alignment (navbars, button groups) and CSS Grid for 2-dimensional page layouts and complex responsive dashboards.\n• Responsive Techniques: I build mobile-first using relative units (rem, em, clamp(), min/max) and fluid CSS media queries to ensure layout integrity across all viewport widths.`;
      break;

    case "FRONTEND_STATE_MANAGEMENT_STORES":
      selectedAnswer = `In state architecture and store evaluation:\n• State Granularity: I separate local component state (\`useState\`, \`useReducer\`), shared global UI state (Zustand, Redux Toolkit), and server cache state (React Query / SWR).\n• Context API vs External Stores: React Context is ideal for low-frequency global data (themes, authenticated user profile) but can trigger unnecessary child re-renders on frequent updates; Zustand or Redux Toolkit provide selector-based subscriptions so components re-render only when their specific slice of data changes.`;
      break;

    case "FRONTEND_PERFORMANCE_LIGHTHOUSE":
      selectedAnswer = `In optimizing Core Web Vitals and Lighthouse scores:\n• Largest Contentful Paint (LCP): Preload critical hero images, convert assets to modern formats (WebP/AVIF), and inline critical above-the-fold CSS to render main content within 2.5 seconds.\n• First Input Delay / Interaction to Next Paint (FID/INP): Minimize main-thread blocking by code-splitting JavaScript bundles (\`React.lazy\`, dynamic \`import()\`), debouncing user input handlers, and offloading heavy computation to Web Workers.\n• Cumulative Layout Shift (CLS): Explicitly specify \`width\` and \`height\` aspect ratios on all images and video elements, reserve layout space for dynamic ads/skeletons, and use \`font-display: swap\` with matched fallback metrics.`;
      break;

    case "FRONTEND_DESIGN_SYSTEM_CSS":
      selectedAnswer = `In building scalable CSS design systems:\n• Token Architecture: Define standardized design tokens for color palettes, spacing scales, typography, elevation, and border radii using CSS custom properties or Tailwind configuration.\n• Component Architecture: Structure reusable atomic UI primitives (Buttons, Modals, Form Controls) with clear variant props, enforcing accessibility and style consistency across the entire product.\n• Scoped Styling: Utilize CSS Modules, Tailwind CSS, or Styled Components to eliminate global CSS namespace pollution and dead code bloat.`;
      break;

    case "FRONTEND_ACCESSIBILITY_A11Y":
      selectedAnswer = `In frontend accessibility (a11y) and WCAG compliance:\n• Semantic HTML5: Use native semantic elements (\`<main>\`, \`<nav>\`, \`<article>\`, \`<button>\`) rather than generic \`<div>\` tags to provide natural screen reader hierarchy.\n• Keyboard Navigation & Focus: Ensure all interactive components are fully operable via keyboard (Tab, Enter, Space, Escape) with visible focus indicators and proper focus traps inside modal dialogs.\n• ARIA & Contrast: Apply appropriate ARIA attributes (\`aria-expanded\`, \`aria-live\`, \`aria-labelledby\`) where semantic HTML is insufficient, and ensure text meets WCAG 2.1 AA 4.5:1 contrast ratios.`;
      break;

    case "FRONTEND_FORM_VALIDATION_ZOD":
      selectedAnswer = `In form management and client-side validation:\n• React Hook Form Integration: Use uncontrolled inputs with React Hook Form to eliminate unnecessary form-wide re-renders during typing.\n• Schema Parsing with Zod: Define strict type-safe validation schemas with Zod, validating complex inputs (regex email rules, password entropy, conditional fields) synchronously and asynchronously.\n• User Feedback: Display contextual, accessible inline error messages bound with \`aria-describedby\` attributes so screen readers announce validation errors immediately.`;
      break;

    case "FRONTEND_REACT_HOOKS_CLOSURES":
      selectedAnswer = `In React hooks and preventing stale closures:\n• Rules of Hooks: Call hooks exclusively at the top level of React function components or custom hooks; never call hooks inside loops, conditions, or nested functions.\n• Stale Closure Mitigation: Ensure all variables and state values referenced inside \`useEffect\`, \`useCallback\`, or \`useMemo\` are accurately listed in the dependency array, or use functional state updates (\`setState(prev => prev + 1)\`) to reference latest state without extra dependencies.`;
      break;

    case "FRONTEND_DEVTOOLS_PROFILING":
      selectedAnswer = `In browser DevTools and runtime performance profiling:\n• React DevTools Profiler: Record component render cycles to identify high render counts, analyze flamegraphs to spot costly render durations, and inspect "Why did this render?" cues.\n• Memory & Heap Profiling: Take heap snapshots in Chrome DevTools before and after user interactions to identify memory leaks caused by detached DOM nodes, uncleared \`setInterval\` timers, or unremoved global event listeners.`;
      break;

    case "FRONTEND_CLIENT_SECURITY":
      selectedAnswer = `In modern client-side frontend security:\n• Cross-Site Scripting (XSS): Sanitize any dynamic HTML injection using DOMPurify, avoid \`dangerouslySetInnerHTML\`, and rely on React's automatic string escaping in JSX.\n• Content Security Policy (CSP): Enforce strict CSP response headers (\`default-src 'self'\`) to restrict script execution origins and prevent inline malicious injections.\n• Token Storage: Store sensitive authentication tokens in \`HttpOnly\`, \`Secure\`, \`SameSite=Strict\` cookies rather than \`localStorage\` to protect against script token theft.`;
      break;

    case "FRONTEND_API_INTEGRATION_DATA_FETCH":
      selectedAnswer = `In server state management and data fetching:\n• Modern Fetching Libraries: Leverage React Query (TanStack Query) or SWR for declarative data fetching, automated background refetching, and automatic deduplication of identical requests.\n• Optimistic UI Updates: Update the client UI immediately upon user action while rolling back changes gracefully if the backend mutation rejects.\n• Loading & Error States: Implement shimmer skeleton loaders for smooth UX and wrap data-fetching components in React Error Boundaries for resilient error handling.`;
      break;

    case "FRONTEND_CRISIS_WHITE_SCREEN":
      selectedAnswer = `When triaging a production white screen error boundary crash:\n• Telemetry Inspection: Inspect error tracking telemetry (Sentry/Datadog) to isolate the unhandled JavaScript exception, component stack trace, and browser user agent.\n• Emergency Fallback: Deploy an immediate hotfix wrapping the broken route in a localized React Error Boundary that displays a friendly retry UI rather than crashing the entire app tree.\n• Fast Rollback / Fix: If the defect impacts core revenue flows, execute an automated rollback to the previous stable release bundle while engineering the permanent fix.`;
      break;

    case "FRONTEND_CRISIS_NPM_DEPENDENCY_RCE":
      selectedAnswer = `When remediating a vulnerable third-party NPM dependency:\n• Lockfile Audit: Run \`npm audit\` or \`snyk test\` to identify the exact dependency tree path and CVE severity score.\n• Version Pinning & Overrides: Use \`package.json\` \`overrides\` or \`resolutions\` to force a patched version of the transitive sub-dependency without waiting for upstream package maintainers.\n• Secret Rotation: If the malicious package had potential runtime execution, rotate all exposed build environment secrets, API keys, and deploy tokens immediately.`;
      break;

    case "FRONTEND_CRISIS_CROSS_BROWSER_BREAK":
      selectedAnswer = `When diagnosing and hotfixing a Safari iOS layout defect:\n• Device Reproduction: Connect an iOS physical device or simulator to Safari Web Inspector to inspect CSS box styles and JavaScript console errors.\n• WebKit Compatibility Fix: Address WebKit-specific layout quirks (e.g. \`-webkit-overflow-scrolling\`, flexbox min-height bugs, or 100vh viewport height inconsistencies using \`100dvh\`).\n• Cross-Browser CI Testing: Add automated cross-browser visual regression testing (Playwright / BrowserStack) to prevent future regression escapes.`;
      break;

    case "FRONTEND_CRISIS_BUNDLE_BLOAT":
      selectedAnswer = `When remediating a 5MB frontend bundle size spike:\n• Bundle Analysis: Run \`webpack-bundle-analyzer\` or \`rollup-plugin-visualizer\` to identify the largest dependency chunks and duplicate packages.\n• Tree Shaking & Modular Imports: Convert bulky third-party libraries (e.g. lodash, moment.js) to lightweight modern alternatives (date-fns, native ECMAScript utilities) with named modular imports.\n• Route-Based Code Splitting: Implement route-level dynamic imports with \`React.lazy\` and \`Suspense\`, ensuring initial page loads deliver only critical CSS and JavaScript chunks under 200KB.`;
      break;

    case "FRONTEND_SCENARIO_LARGE_TABLE_FREEZE":
      selectedAnswer = `When optimizing a large data table with thousands of rows causing UI freeze:\n• DOM Virtualization: Implement windowing/virtualization (\`tanstack-virtual\` / \`react-window\`) to render only the 20–30 table rows visible in the active viewport.\n• Debouncing & Offloading: Debounce search/filter input handlers and offload complex sorting or filtering operations to Web Workers or backend paginated API endpoints.\n• Pure Components: Memoize table row components to prevent re-rendering unaffected rows when an individual row selection toggles.`;
      break;

    case "FRONTEND_SCENARIO_API_OUTAGE":
      selectedAnswer = `When handling backend API 500 outages gracefully on the frontend:\n• Error Boundaries: Wrap major layout sections in granular Error Boundaries so an API outage in one widget does not break the entire application.\n• Cached Offline State: Fall back to local storage or IndexedDB cached data, informing the user that offline cached data is being displayed.\n• Exponential Backoff Retries: Implement automated retry queries with exponential backoff and jitter, providing a manual "Retry" button.`;
      break;

    case "FRONTEND_SCENARIO_AUTH_EXPIRATION":
      selectedAnswer = `When managing JWT token expiration and silent renewal:\n• Axios Interceptors: Intercept 401 Unauthorized responses using Axios response interceptors.\n• Queued Token Refresh: Pause outgoing requests, trigger a silent refresh token request to the auth server, update the in-memory access token, and replay all queued requests seamlessly.\n• Graceful Logout: If the refresh token has expired or is invalid, redirect the user smoothly to the login page while saving their current route for post-login return.`;
      break;

    case "FRONTEND_TRENDS_RSC":
      selectedAnswer = `In modern frontend architecture and React Server Components:\n• Server vs Client Components: React Server Components (RSC) execute exclusively on the server, keeping large dependencies out of the client JavaScript bundle and fetching data directly close to databases.\n• Client Interactivity: Client Components (\`"use client"\`) are used selectively for interactive UI elements requiring React hooks and browser event listeners.\n• Build & Bundling: Modern frameworks (Next.js App Router, Vite) optimize streaming HTML responses with React Suspense for fast Time-to-First-Byte (TTFB).`;
      break;

    case "FRONTEND_TESTING_JEST_RTL":
      selectedAnswer = `In frontend testing strategies:\n• Testing User Behavior: Use React Testing Library and Vitest to test components from the user's perspective (querying by accessible role, label, and text) rather than testing internal implementation details or state variables.\n• API Mocking: Utilize Mock Service Worker (MSW) to intercept and mock HTTP requests at the network level.\n• End-to-End Testing: Implement Playwright or Cypress for critical user journey end-to-end tests (authentication, checkout flows).`;
      break;

    case "FRONTEND_BEHAVIORAL_DISAGREEMENT":
      selectedAnswer = `• Situation: An exemplary response: During an architectural review for a large dashboard project, a teammate and I had divergent views on whether to use Redux Toolkit or Zustand for global UI state management.\n• Task: My goal was to resolve the disagreement constructively and choose the best technical solution based on objective metrics rather than personal preference.\n• Action: I built two lightweight proof-of-concept prototypes implementing a shared feature set. We benchmarked bundle size, evaluated boilerplate developer experience, and profiled re-render performance across both implementations during a collaborative team review.\n• Result: The team unanimously selected Zustand for our project scope, reducing boilerplate significantly and delivering the project on schedule with high team satisfaction.`;
      break;

    case "FRONTEND_BEHAVIORAL_DEADLINE_QUALITY":
      selectedAnswer = `• Situation: An exemplary response: We were facing an aggressive product delivery deadline, and there was pressure to compromise on WCAG accessibility compliance and runtime rendering performance to ship on time.\n• Task: My objective was to meet the business deadline without compromising core accessibility standards or introducing UI performance degradation.\n• Action: I proposed a phased delivery strategy: We scoped a streamlined MVP focusing on core user flows, built with accessible headless UI primitives that provided native keyboard navigation and ARIA support out-of-the-box, and scheduled secondary visual enhancements for subsequent iterations.\n• Result: We launched the MVP on time, achieved full WCAG 2.1 AA compliance, and maintained smooth 60 FPS interactions in production.`;
      break;

    case "FRONTEND_RESUME_PROJECT":
      selectedAnswer = `In my practical frontend project work (${primaryProj}):\n• Architecture & Components: I structured a modular component hierarchy in React, separating presentational UI components from custom data-fetching hooks.\n• State & Data Fetching: I managed client and server state using modern state stores and caching libraries, ensuring optimistic updates and resilient error handling.\n• Performance & Optimization: I optimized asset delivery, implemented dynamic code-splitting, and enforced responsive styling, achieving fast load times and smooth 60 FPS interactions across mobile and desktop viewports.`;
      break;

    case "FRONTEND_GENERAL_PRACTICE":
      selectedAnswer = `In modern frontend engineering for ${targetRoleName}:\n• Component Architecture: Structure modular, reusable React components with clean state management, separating presentation from data-fetching hooks.\n• Performance & Web Vitals: Optimize Core Web Vitals (LCP/CLS) using code-splitting, React.memo, virtualization, and asset preloading to maintain smooth 60 FPS rendering.\n• Quality & Accessibility: Enforce WCAG 2.1 AA accessibility standards, responsive CSS layout architecture, and automated testing (Vitest / React Testing Library / Playwright).`;
      break;

    // -------------------------------------------------------------
    // SOFTWARE / BACKEND REFERENCE ANSWERS
    // -------------------------------------------------------------
    case "BACKEND_DATABASE_INDEXING_SQL":
      selectedAnswer = `In relational database indexing and query optimization:\n• B-Tree Index Structure: Relational databases use B-Tree indexes to provide O(log N) lookup, insertion, and range scan performance by maintaining balanced search trees on disk.\n• Indexing Strategies: Create composite indexes ordered by cardinality (equality filters first, range filters second), leverage covering indexes to fulfill queries entirely from index pages, and eliminate redundant unindexed table scans.\n• Execution Plans: Analyze \`EXPLAIN ANALYZE\` query plans to identify sequential scans, costly nested loop joins, and temporary disk spills, optimizing query joins and adding targeted indexes.`;
      break;

    case "BACKEND_API_DESIGN_REST_GRAPHQL":
      selectedAnswer = `In API design and integration architecture:\n• RESTful Best Practices: Design resource-oriented endpoints with proper HTTP verbs (GET, POST, PUT, PATCH, DELETE), standardized JSON response envelopes, and appropriate status codes (200, 201, 400, 401, 403, 404, 409, 500).\n• Idempotency & Versioning: Enforce idempotency on state-changing requests using idempotency keys, and manage API evolution through URI or header versioning.\n• REST vs GraphQL: REST provides simple HTTP caching and strict boundary enforcement, while GraphQL eliminates over-fetching and under-fetching for complex frontends by allowing clients to request specific data graphs.`;
      break;

    case "BACKEND_MICROSERVICES_SERVICE_BOUNDARIES":
      selectedAnswer = `In microservices architecture and service boundaries:\n• Domain-Driven Design (DDD): Define service boundaries around Bounded Contexts where each microservice owns its private database schema, avoiding shared database anti-patterns.\n• API Gateway & Routing: Deploy an API Gateway for centralized authentication, rate limiting, request routing, and SSL termination.\n• Resilient Communication: Use asynchronous messaging (Kafka/RabbitMQ) for decoupled event workflows and synchronous gRPC/REST with circuit breakers (Resilience4j) for low-latency queries.`;
      break;

    case "BACKEND_CACHING_REDIS":
      selectedAnswer = `In distributed caching and Redis architecture:\n• Caching Patterns: Implement Cache-Aside (Lazy Loading) for read-heavy workloads, Write-Through or Write-Behind for data consistency, and define explicit Time-To-Live (TTL) expirations on all cache keys.\n• Cache Stampede & Penetration Mitigation: Use distributed mutex locking (Redlock) to prevent cache stampedes on cache misses, and employ Bloom filters to prevent cache penetration from nonexistent keys.`;
      break;

    case "BACKEND_ASYNC_MESSAGE_QUEUES":
      selectedAnswer = `In asynchronous message queues and event-driven architecture:\n• Message Broker Decoupling: Use message brokers (Kafka, RabbitMQ, AWS SQS) to decouple time-consuming tasks from HTTP request lifecycles, enabling horizontal scaling of consumer workers.\n• Reliability & Dead-Letter Queues: Configure consumer acknowledgments, retry policies with exponential backoff, and Dead-Letter Queues (DLQs) to isolate poison-pill messages without halting queues.\n• Idempotent Processing: Ensure consumers process messages idempotently using unique message IDs and database deduplication constraints.`;
      break;

    case "BACKEND_SCHEMA_MIGRATIONS":
      selectedAnswer = `In managing database schema migrations and backwards compatibility:\n• Expand and Contract Pattern: Execute schema changes in non-breaking phases: Phase 1 (Expand - add new nullable column/table), Phase 2 (Dual Write / Backfill data), Phase 3 (Update application code to read new column), Phase 4 (Contract - drop old column).\n• Zero-Downtime Deployments: Use automated migration tools (Liquibase, Flyway, Prisma Migrate) run prior to application container deployment, ensuring database changes are strictly backwards-compatible with running versions.`;
      break;

    case "BACKEND_AUTHENTICATION_JWT_OAUTH":
      selectedAnswer = `In modern authentication and session architecture:\n• OAuth 2.0 & OpenID Connect: Implement authorization code flows with PKCE for secure client authorization and identity claims via JWT ID tokens.\n• Token Rotation & Stateless Auth: Issue short-lived JWT access tokens (15-minute validity) accompanied by long-lived, securely rotated refresh tokens stored in HTTP-only cookies, with token revocation tracking in Redis.`;
      break;

    case "BACKEND_DISTRIBUTED_TRANSACTIONS":
      selectedAnswer = `In distributed transactions and data consistency:\n• Saga Pattern: Implement orchestrated or choreographed Sagas where each local transaction publishes domain events, executing compensating transactions in reverse if any downstream step fails.\n• Eventual Consistency: Embrace eventual consistency across microservice boundaries, using outbox patterns to guarantee atomic database write and message dispatch.`;
      break;

    case "BACKEND_SCENARIO_SLOW_QUERIES":
      selectedAnswer = `When resolving a 100% database CPU spike from unindexed queries:\n• Identification: Query \`pg_stat_activity\` or MySQL processlist to identify long-running blocking queries and analyze their execution plans with \`EXPLAIN\`.\n• Emergency Mitigation: Add missing indexes concurrently on hot columns, terminate runaway queries, and implement query timeout limits.\n• Long-Term Fix: Implement read replicas to offload analytical queries and place a Redis cache layer ahead of hot read queries.`;
      break;

    case "BACKEND_SCENARIO_MEMORY_LEAK":
      selectedAnswer = `When diagnosing a production heap memory leak:\n• Heap Snapshot Capture: Capture V8 / JVM heap dumps before container restart and analyze memory retaining trees in Chrome DevTools or Eclipse Memory Analyzer.\n• Root Cause Isolation: Identify memory retention culprits (such as uncleared event listeners, growing global maps, or unclosed database connections).\n• Remediation: Fix memory leak in code, configure container memory limits with restart policies, and establish alerting on heap memory growth trends.`;
      break;

    case "BACKEND_SCENARIO_CASCADING_FAILURE":
      selectedAnswer = `When mitigating cascading service failure across microservices:\n• Circuit Breaker Tripping: Configure circuit breakers (Resilience4j) to open automatically when downstream service error rates exceed 50%, returning cached or graceful fallback responses.\n• Rate Limiting & Shedding: Apply API gateway load shedding and rate limiting to protect degraded services during traffic spikes.\n• Decoupled Retries: Implement exponential backoff with jitter to prevent retry storms from overwhelming recovering instances.`;
      break;

    case "BACKEND_CRISIS_DATA_CORRUPTION":
      selectedAnswer = `When recovering from transactional data corruption:\n• Blast Radius Isolation: Temporarily suspend writes to affected database tables and put the service in read-only maintenance mode.\n• Transaction Log Replay: Restore point-in-time recovery (PITR) backups up to the exact transaction prior to corruption, replaying valid subsequent transactions from write-ahead logs (WAL) or Kafka event streams.\n• Verification: Run data integrity verification scripts, reconcile database totals, and re-enable production traffic.`;
      break;

    case "BACKEND_RESUME_PROJECT":
      selectedAnswer = `In my practical backend project work (${primaryProj}):\n• System Architecture: I engineered scalable REST/gRPC APIs, structured relational and NoSQL database schemas, and implemented caching and message queues.\n• Performance & Reliability: I conducted load testing, optimized query execution plans, and implemented automated CI/CD deployment pipelines.\n• Outcomes: The architecture delivered high throughput, sub-50ms latency, and 99.9% uptime under high concurrent user traffic.`;
      break;

    case "BACKEND_GENERAL_PRACTICE":
      selectedAnswer = `In backend software engineering for ${targetRoleName}:\n• API & Service Design: Architect scalable REST/gRPC microservices with clean domain boundaries, validation, and standardized error handling.\n• Database Engineering: Optimize SQL query execution plans, B-Tree index structures, and ACID transaction boundaries.\n• Reliability & Performance: Implement distributed caching (Redis), message queues (Kafka), and automated CI/CD testing pipelines.`;
      break;

    // -------------------------------------------------------------
    // DATA SCIENCE / AI / ML REFERENCE ANSWERS
    // -------------------------------------------------------------
    case "DATA_FEATURE_ENGINEERING":
      selectedAnswer = `In feature engineering and data preprocessing:\n• Missing Data & Outliers: Impute missing numerical data using median or iterative KNN imputation, and treat outliers using IQR clipping or robust scaling.\n• Categorical Encoding: Apply one-hot encoding for low-cardinality categorical variables and target/frequency encoding for high-cardinality features to prevent dimensionality explosion.\n• Feature Scaling: Apply StandardScaler (Z-score normalization) for algorithms sensitive to scale (SVM, neural networks, linear regression) and MinMaxScaler for bounded range models.`;
      break;

    case "DATA_MODEL_EVALUATION_METRICS":
      selectedAnswer = `In model evaluation metrics and selection:\n• Precision vs Recall: For imbalanced classification (e.g. fraud detection), accuracy is misleading; prioritize Precision when false positives are costly, and Recall when false negatives are critical, balancing them using F1-score or PR-AUC.\n• ROC-AUC & Confusion Matrix: Evaluate model discriminative power across all decision thresholds using ROC-AUC, and inspect the confusion matrix to understand misclassification distributions.`;
      break;

    case "DATA_OVERFITTING_REGULARIZATION":
      selectedAnswer = `In mitigating overfitting and ensuring generalization:\n• Regularization Techniques: Apply L1 regularization (Lasso) for feature sparsity and selection, L2 regularization (Ridge) to penalize large weights, and Dropout in deep neural networks.\n• Validation Strategies: Use K-Fold Cross-Validation and Stratified K-Fold for imbalanced datasets, enforcing early stopping based on validation loss plateaus.`;
      break;

    case "DATA_BIG_DATA_SPARK":
      selectedAnswer = `In distributed big data processing with PySpark:\n• Dataframe Partitioning: Optimize cluster parallelism by tuning partition counts, avoiding data skew with salting techniques, and using broadcast joins for joining large tables with small lookup datasets.\n• ETL Pipeline Optimization: Leverage Spark SQL window functions, persist intermediate dataframes in memory/disk appropriately, and eliminate costly full-dataset shuffles.`;
      break;

    case "DATA_DEEP_LEARNING_LLMS":
      selectedAnswer = `In deep learning, Transformers, and LLM architectures:\n• Transformer Mechanics: Self-attention mechanisms compute query-key-value dot products to capture contextual relationships across long token sequences simultaneously.\n• Retrieval-Augmented Generation (RAG): Build vector embedding pipelines with chunking, indexing in vector databases (Pinecone, Chroma), and performing similarity search (cosine distance) to ground LLM generations in factual domain documents.\n• Fine-Tuning: Apply parameter-efficient fine-tuning (PEFT/LoRA) to adapt foundation models to domain tasks with minimal GPU memory overhead.`;
      break;

    case "DATA_MLOPS_MODEL_DRIFT":
      selectedAnswer = `In MLOps and production model monitoring:\n• Drift Detection: Monitor data drift (covariate shift using PSI / KS tests) and concept drift (degradation in model prediction accuracy over time) using MLflow and Evidently AI.\n• Automated Retraining: Trigger automated retraining pipelines and model validation gates in CI/CD when drift metrics exceed predefined thresholds.`;
      break;

    case "DATA_SCENARIO_PIPELINE_FAILURE":
      selectedAnswer = `When recovering from an overnight data pipeline failure:\n• Pipeline Triage: Inspect Airflow DAG task execution logs, pinpoint the failing data transformation task, and isolate corrupt upstream source records.\n• Idempotent Backfill: Fix data parsing logic, clear failed task states, and execute an idempotent partition backfill to restore downstream data tables with zero duplicates.`;
      break;

    case "DATA_CRISIS_MODEL_BIAS":
      selectedAnswer = `When addressing demographic bias in a production model:\n• Bias Auditing: Evaluate disparate impact ratios across demographic subgroups using fairness toolkits (AIF360, Fairlearn).\n• Mitigation: Re-balance training data distributions, apply adversarial debiasing, adjust classification decision thresholds, and document algorithmic accountability.`;
      break;

    case "DATA_RESUME_PROJECT":
      selectedAnswer = `In my data science project work (${primaryProj}):\n• Data Preprocessing & Modeling: I engineered features, cleaned messy datasets, and trained machine learning models (XGBoost, Random Forest, PyTorch).\n• Evaluation & MLOps: I evaluated models with precision, recall, and ROC-AUC metrics, deploying models as REST APIs with containerization.\n• Business Impact: The project delivered accurate predictions that automated workflows and drove measurable decision-making value.`;
      break;

    case "DATA_GENERAL_PRACTICE":
      selectedAnswer = `In data science and AI engineering for ${targetRoleName}:\n• Feature Engineering: Clean, scale, and transform structured/unstructured datasets with robust imputation and categorical encoding.\n• Model Development: Train and evaluate statistical and machine learning models with rigorous cross-validation and hyperparameter tuning.\n• Production Deployment: Deploy models via scalable API endpoints, monitor data and concept drift, and enforce ethical fairness standards.`;
      break;

    // -------------------------------------------------------------
    // DEVOPS / CLOUD REFERENCE ANSWERS
    // -------------------------------------------------------------
    case "DEVOPS_CICD_PIPELINES":
      selectedAnswer = `In CI/CD automation and deployment strategies:\n• Pipeline Architecture: Automate build, lint, test, and security scanning gates in GitHub Actions or GitLab CI.\n• Zero-Downtime Deployments: Use Blue-Green or Canary deployment strategies with automated health checks to route traffic smoothly with instant rollback capabilities.`;
      break;

    case "DEVOPS_IAC_TERRAFORM":
      selectedAnswer = `In Infrastructure as Code (IaC) and Terraform:\n• State Management: Store Terraform state in remote backend (AWS S3 + DynamoDB locking), modularize infrastructure components, and run automated \`terraform plan\` drift detection in CI.`;
      break;

    case "DEVOPS_KUBERNETES_CONTAINERS":
      selectedAnswer = `In Kubernetes and container orchestration:\n• Container Architecture: Author multi-stage Dockerfiles for minimal image sizes, define declarative Kubernetes manifests (Deployments, Services, Ingress), and configure Horizontal Pod Autoscalers (HPA) and resource limits (requests/limits).`;
      break;

    case "DEVOPS_MONITORING_OBSERVABILITY":
      selectedAnswer = `In monitoring and observability:\n• Metrics & Tracing: Deploy Prometheus for metric scraping, Grafana for visualization dashboards, and OpenTelemetry for distributed request tracing across microservices.\n• Alerting: Define alerting rules tied to Service Level Objectives (SLOs) and Error Budgets to eliminate alert fatigue.`;
      break;

    case "DEVOPS_SCENARIO_K8S_CRASHLOOP":
      selectedAnswer = `When troubleshooting a Kubernetes CrashLoopBackOff:\n• Triage: Run \`kubectl describe pod\` and \`kubectl logs --previous\` to inspect container exit codes, memory limits (OOMKilled), and missing environment variables.\n• Resolution: Fix configuration errors in ConfigMaps/Secrets, adjust container memory requests, and verify successful pod startup.`;
      break;

    case "DEVOPS_CRISIS_OUTAGE_ROLLBACK":
      selectedAnswer = `When recovering from a global 502 Bad Gateway outage:\n• Emergency Rollback: Execute an immediate one-click rollback to the previous stable container image tag at the ingress controller.\n• RCA: Reconstruct failure timeline from APM logs, identify broken database connection pools, and deploy permanent fix with automated smoke tests.`;
      break;

    case "DEVOPS_GENERAL_PRACTICE":
      selectedAnswer = `In DevOps and Cloud engineering for ${targetRoleName}:\n• CI/CD & Automation: Design automated testing, containerization, and blue-green deployment pipelines.\n• Infrastructure as Code: Manage cloud infrastructure declaratively using Terraform, Helm, and Kubernetes.\n• Observability & Reliability: Monitor system health using Prometheus, Grafana, and distributed tracing.`;
      break;

    // -------------------------------------------------------------
    // OTHER ENGINEERING DOMAINS (MECHANICAL, ELECTRICAL, CIVIL, ETC.)
    // -------------------------------------------------------------
    case "MECH_GDNT_TOLERANCES":
      selectedAnswer = `In Geometric Dimensioning & Tolerancing (GD&T - ASME Y14.5):\n• Datum Systems: Establish primary, secondary, and tertiary datum reference frames to control part alignment during manufacturing and inspection.\n• Tolerance Controls: Apply position, flatness, cylindricity, and runout tolerances with Maximum Material Condition (MMC) modifiers to ensure interchangeability and reduce production scrap.`;
      break;

    case "MECH_FEA_STRESS_ANALYSIS":
      selectedAnswer = `In Finite Element Analysis (FEA) and structural integrity:\n• Mesh & Boundary Conditions: Generate refined mesh geometry near stress concentrations, apply accurate boundary constraints, and verify mesh convergence.\n• Stress Criteria: Evaluate Von Mises stress against material yield strength, ensuring safety factors meet regulatory standards.`;
      break;

    case "MECH_DFM_MATERIALS":
      selectedAnswer = `In Design for Manufacturing (DFM) and Material Selection:\n• DFM/DFA Principles: Optimize draft angles, uniform wall thicknesses, and minimize part counts for injection molding, casting, and CNC machining.\n• Material Selection: Select engineering materials (aluminum alloys, stainless steel, polymers) balancing strength-to-weight ratio, thermal properties, and cost.`;
      break;

    case "MECH_THERMAL_HEAT_TRANSFER":
      selectedAnswer = `In thermal management and heat dissipation:\n• Heat Transfer Modes: Model conduction, convection, and radiation dissipation through heatsinks and thermal interface materials (TIM).\n• CFD Analysis: Conduct computational thermal simulations to optimize airflow and prevent component junction overheating.`;
      break;

    case "MECH_SCENARIO_FATIGUE_FAILURE":
      selectedAnswer = `When investigating a structural fatigue crack failure:\n• Root Cause Analysis: Inspect fracture surfaces via SEM (scanning electron microscopy) to identify beach marks and fatigue initiation sites.\n• Remediation: Increase fillet radii to eliminate sharp stress risers and select materials with higher endurance limits.`;
      break;

    case "MECH_CRISIS_SUPPLIER_OUT_OF_SPEC":
      selectedAnswer = `When managing out-of-spec supplier components:\n• Containment: Issue an immediate Quality Hold on the supplier lot and execute CMM dimensional verification.\n• Remediation: Perform tolerance stackup analysis to determine if parts can be reworked under concession or rejected.`;
      break;

    case "MECH_GENERAL_PRACTICE":
      selectedAnswer = `In mechanical engineering for ${targetRoleName}:\n• Mechanical Design: Develop 3D CAD models, detailed 2D manufacturing drawings with GD&T, and conduct tolerance stackup analysis.\n• Simulation & Verification: Execute FEA stress and thermal analysis to validate safety factors and performance.\n• Manufacturing & Quality: Apply DFM/DFA principles and ensure compliance with ISO/ASME engineering standards.`;
      break;

    case "ELEC_PCB_SIGNAL_INTEGRITY":
      selectedAnswer = `In PCB layout design and signal integrity:\n• Layer Stackup: Design multi-layer PCB stackups with dedicated unbroken ground reference planes to minimize crosstalk and EMI.\n• High-Speed Routing: Match trace impedances (e.g. 50-ohm single-ended, 100-ohm differential) and length-match high-speed differential pairs.`;
      break;

    case "ELEC_POWER_ELECTRONICS":
      selectedAnswer = `In power electronics and converter design:\n• Converter Topologies: Design Buck, Boost, and Synchronous converters, selecting MOSFETs, inductors, and capacitors to minimize switching losses and ripple.\n• Thermal Management: Implement thermal vias, copper pours, and heatsinks to manage semiconductor junction temperatures.`;
      break;

    case "ELEC_EMC_EMI_COMPLIANCE":
      selectedAnswer = `In EMC/EMI compliance and filtering:\n• Noise Suppression: Place decoupling capacitors close to IC power pins, implement common-mode chokes, and use ferrite beads to suppress conducted and radiated emissions.\n• Compliance Standards: Test against FCC Part 15 and CISPR standards in anechoic chambers.`;
      break;

    case "ELEC_SCENARIO_VOLTAGE_SAG":
      selectedAnswer = `When resolving an unexpected voltage sag on a power rail:\n• Triage: Probe power rails with an oscilloscope during transient load steps to measure voltage drop and ripple.\n• Resolution: Add low-ESR ceramic bulk capacitors near high-current loads and adjust feedback loop compensation.`;
      break;

    case "ELEC_GENERAL_PRACTICE":
      selectedAnswer = `In electrical engineering for ${targetRoleName}:\n• Schematic & PCB Design: Author circuit schematics, layout multi-layer PCBs, and simulate analog/digital circuits.\n• Power & Signal Integrity: Optimize power distribution networks (PDN), impedance matching, and EMI filtering.\n• Verification: Validate hardware using oscilloscopes, spectrum analyzers, and automated test fixtures.`;
      break;

    case "CIVIL_STRUCTURAL_DESIGN":
      selectedAnswer = `In structural engineering and load analysis:\n• Load Calculations: Calculate dead, live, wind, and seismic loads per ASCE 7 and local building codes.\n• Material Design: Design reinforced concrete and structural steel members with appropriate load resistance factors (LRFD).`;
      break;

    case "CIVIL_GEOTECHNICAL_FOUNDATION":
      selectedAnswer = `In geotechnical and foundation design:\n• Soil Mechanics: Analyze soil boring logs, standard penetration tests (SPT), and calculate allowable soil bearing capacity.\n• Foundation Selection: Select shallow footings or deep piles based on soil settlement criteria and groundwater levels.`;
      break;

    case "CIVIL_SCENARIO_SETTLEMENT":
      selectedAnswer = `When addressing differential foundation settlement on site:\n• Inspection: Install crack monitors and optical leveling targets to quantify settlement rates.\n• Remediation: Implement underpinning or pressure grouting to stabilize soil subgrade beneath settled footings.`;
      break;

    case "CIVIL_GENERAL_PRACTICE":
      selectedAnswer = `In civil engineering for ${targetRoleName}:\n• Structural & Civil Design: Model structures in STAAD/ETABS and ensure compliance with building codes.\n• Project Management & Safety: Oversee site quality assurance, soil verification, and construction safety protocols.`;
      break;

    case "CHEM_MASS_ENERGY_BALANCES":
      selectedAnswer = `In chemical process engineering and thermodynamics:\n• Conservation Equations: Formulate steady-state mass and energy balances across unit operations (reactors, distillation columns, heat exchangers).\n• Thermodynamic Modeling: Utilize equation of state models (Peng-Robinson, NRTL) to predict vapor-liquid equilibrium (VLE).`;
      break;

    case "CHEM_SAFETY_HAZOP":
      selectedAnswer = `In process safety and HAZOP analysis:\n• Hazard Identification: Apply guide words (No, More, Less, Reverse) to process nodes to identify deviations in pressure, temperature, and flow.\n• Safeguards: Design redundant safety instrumented systems (SIS) and pressure relief valves (PRVs).`;
      break;

    case "CHEM_SCENARIO_RUNAWAY_REACTION":
      selectedAnswer = `When mitigating an exothermic reactor temperature runaway:\n• Emergency Actions: Trigger emergency inhibitor injection, open reactor emergency vent systems, and initiate full cooling jacket flow.\n• Post-Incident: Recalculate cooling capacities and update interlock safety logic.`;
      break;

    case "CHEM_GENERAL_PRACTICE":
      selectedAnswer = `In chemical engineering for ${targetRoleName}:\n• Process Design: Simulate chemical processes, design heat exchangers and separation units, and optimize yield.\n• Safety & Quality: Enforce OSHA PSM, HAZOP reviews, and environmental discharge compliance.`;
      break;

    case "AUTO_VEHICLE_DYNAMICS":
      selectedAnswer = `In vehicle dynamics and chassis engineering:\n• Suspension Geometry: Optimize roll centers, camber gain, and anti-dive/anti-squat kinematics for handling stability and ride comfort.\n• Tire Dynamics: Model tire cornering stiffness using Pacejka magic formula models to balance understeer/oversteer gradients.`;
      break;

    case "AUTO_CAN_STANDARDS":
      selectedAnswer = `In automotive communication standards and functional safety:\n• Bus Protocols: Configure Controller Area Network (CAN/CAN-FD) and LIN message frames with cyclic redundancy checks (CRC).\n• Functional Safety: Implement ISO 26262 functional safety lifecycles, assigning ASIL ratings (A through D) and hazard analysis (HARA).`;
      break;

    case "AUTO_SCENARIO_BUS_OFF":
      selectedAnswer = `When resolving a CAN Bus-Off state in an ECU network:\n• Triage: Probe CAN-High and CAN-Low with an oscilloscope to detect reflections, ground offsets, or short circuits.\n• Resolution: Verify 120-ohm bus termination resistors, eliminate bit-timing misconfigurations, and re-enable ECU transmission.`;
      break;

    case "AUTO_GENERAL_PRACTICE":
      selectedAnswer = `In automotive engineering for ${targetRoleName}:\n• Automotive Systems: Design powertrain, chassis, and EV battery/thermal systems per OEM standards.\n• Standards Compliance: Ensure compliance with ISO 26262 functional safety and CAN/LIN communication protocols.`;
      break;

    case "UX_RESEARCH_HEURISTICS":
      selectedAnswer = `In user experience research and usability evaluation:\n• Discovery & Testing: Conduct generative user interviews, author journey maps, and execute moderated usability testing sessions.\n• Heuristic Evaluation: Evaluate UI flows against Nielsen's 10 Usability Heuristics to identify friction points and cognitive overload.`;
      break;

    case "UX_DESIGN_SYSTEM_A11Y":
      selectedAnswer = `In UI design systems and accessible interface design:\n• Component Libraries: Build scalable Figma design systems with auto-layout, atomic variants, and design token architectures.\n• Accessibility: Enforce WCAG 2.1 AA color contrast, clear typography hierarchy, and touch target minimums (44x44px).`;
      break;

    case "UX_SCENARIO_USABILITY_DROPOFF":
      selectedAnswer = `When addressing a high checkout drop-off rate:\n• Funnel Analysis: Analyze session recordings and click heatmaps to identify where users encounter friction.\n• Redesign & Testing: Simplify multi-step forms into single-page accordions with autofill and validate with A/B testing.`;
      break;

    case "UX_GENERAL_PRACTICE":
      selectedAnswer = `In UI/UX design for ${targetRoleName}:\n• User Centered Design: Conduct user research, wireframing, and interactive prototyping in Figma.\n• Design Systems & a11y: Maintain component libraries compliant with WCAG 2.1 AA accessibility standards.`;
      break;

    // -------------------------------------------------------------
    // UNIVERSAL BEHAVIORAL & SCENARIO REFERENCE ANSWERS
    // -------------------------------------------------------------
    case "UNIVERSAL_BEHAVIORAL_DISAGREEMENT":
      selectedAnswer = `• Situation: An exemplary response: During an engineering design phase, a teammate and I had divergent perspectives on technical architecture and tool selection.\n• Task: My objective was to resolve the disagreement constructively and align the team around the optimal data-backed solution.\n• Action: I proposed building a side-by-side proof of concept to benchmark both approaches objectively against predefined criteria (performance, maintainability, scalability). We reviewed the empirical data together in a collaborative session.\n• Result: The team selected the data-validated approach unanimously, delivering the project on schedule and strengthening team trust.`;
      break;

    case "UNIVERSAL_BEHAVIORAL_ROADBLOCK":
      selectedAnswer = `• Situation: An exemplary response: During a critical project milestone, an unexpected technical blocker arose due to external dependency changes that threatened delivery.\n• Task: My goal was to overcome the roadblock quickly without compromising quality or missing client delivery commitments.\n• Action: I performed root-cause analysis, scoped an alternative technical path, communicated transparently with stakeholders, and collaborated with the team to implement the solution.\n• Result: We resolved the blocker effectively, delivering the project on time and documenting the solution for future reference.`;
      break;

    case "UNIVERSAL_BEHAVIORAL_DEADLINE":
      selectedAnswer = `• Situation: An exemplary response: Project requirements expanded significantly close to an aggressive delivery deadline.\n• Task: My goal was to deliver high-quality technical outcomes while managing team workload and scope creep.\n• Action: I worked with product managers to prioritize must-have MVP features using the MoSCoW method, setting realistic delivery phases and maintaining rigorous code review and testing standards.\n• Result: We launched the core release on schedule with zero critical defects, following up with secondary enhancements in the next iteration.`;
      break;

    case "UNIVERSAL_BEHAVIORAL_COLLABORATION":
      selectedAnswer = `• Situation: An exemplary response: I worked on a cross-functional initiative requiring close collaboration between engineering, product, and operations teams.\n• Task: My objective was to facilitate seamless technical integration and align diverse stakeholders around shared deliverables.\n• Action: I established regular syncs, authored clear technical interface specifications, and proactively addressed integration hurdles through collaborative pair programming.\n• Result: The cross-functional initiative launched seamlessly, improving operational efficiency and receiving positive stakeholder feedback.`;
      break;

    case "UNIVERSAL_BEHAVIORAL_GENERAL":
      selectedAnswer = `• Situation: An exemplary response: In a demanding project environment, I encountered a complex technical challenge that required innovative problem-solving.\n• Task: My objective was to deliver a reliable, well-tested solution under tight operational constraints.\n• Action: I structured a methodical plan, consulted domain literature, developed robust prototypes, and executed rigorous validation tests.\n• Result: The solution successfully resolved the challenge, delivering measurable improvements in system performance and reliability.`;
      break;

    case "UNIVERSAL_CRISIS_CONTAINMENT":
      selectedAnswer = `When managing an emergency operational crisis:\n• Phase 1 (Immediate Containment): Assess severity, isolate failing components to prevent cascading outages, and establish an incident command bridge.\n• Phase 2 (Root Cause Investigation): Analyze system telemetry, audit logs, and diagnostic traces to identify the exact trigger condition.\n• Phase 3 (Eradication & Restoration): Deploy verified hotfixes or failover systems in an isolated environment before restoring production traffic.\n• Phase 4 (Post-Mortem & Prevention): Author an exhaustive root-cause analysis (RCA) report and implement automated safeguards to prevent recurrence.`;
      break;

    default:
      selectedAnswer = `In technical engineering for ${targetRoleName}:\n• Technical Standards: Apply industry best practices, domain standards, and rigorous quality verification protocols.\n• System Architecture & Problem Solving: Formulate structured solutions, evaluate performance trade-offs, and maintain thorough documentation.\n• Continuous Improvement: Benchmark results against empirical metrics, optimize workflows, and drive collaborative engineering outcomes.`;
      break;
  }

  // Terminology Relevance Safety Enforcement Gate
  const ansLower = (selectedAnswer || "").toLowerCase();
  if (archetype === "CYBERSECURITY") {
    if (hasAny("fileless", "lolbin", "living-off-the-land") && !ansLower.includes("fileless")) {
      return generateFallbackIdealAnswer(qText, level, targetRoleName, fieldName, highlights, jobDescription);
    }
    if (hasAny("ddos", "traffic scrubbing", "upstream provider") && !ansLower.includes("ddos")) {
      return generateFallbackIdealAnswer(qText, level, targetRoleName, fieldName, highlights, jobDescription);
    }
  }

  return selectedAnswer;
}


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
  normalizeTargetRole,
  detectDomainArchetype,
  isSemanticDuplicate,
  extractResumeHighlights,
  extractSkillsFromJobDescription,
  extractInterviewContext,
  validateQuestionRelevance,
  generateDomainRelevantQuestion,
  generateMockInterviewEngine,
  generateNextMockQuestionEngine,
  evaluateMockInterviewEngine,
  classifyQuestionIntent,
  generateFallbackIdealAnswer,
};



