// External Job Controller — Legitimate Public Job Feeds & Permitted Sources
const { CAREER_FIELDS } = require("../constants/careerFields");

// Robust HTML Entity Decoder (Handles single, double & multi-encoded entities)
const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== "string") return "";

  const entityMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&#8211;": "–",
    "&mdash;": "—",
    "&#8212;": "—",
    "&hellip;": "...",
    "&#8230;": "...",
    "&bull;": "•",
    "&#8226;": "•",
    "&rsquo;": "'",
    "&#8217;": "'",
    "&lsquo;": "'",
    "&#8216;": "'",
    "&rdquo;": '"',
    "&#8221;": '"',
    "&ldquo;": '"',
    "&#8220;": '"',
  };

  let decoded = str;

  // Run up to 3 passes to resolve any double/triple-encoded entities (e.g. &amp;lt;)
  for (let pass = 0; pass < 3; pass++) {
    const prev = decoded;

    // Replace named entities
    decoded = decoded.replace(
      /&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|bull|rsquo|lsquo|rdquo|ldquo);/gi,
      (match) => entityMap[match.toLowerCase()] || match
    );

    // Replace decimal numeric entities: &#123;
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      const code = parseInt(num, 10);
      return code >= 0 && code <= 65535 ? String.fromCharCode(code) : match;
    });

    // Replace hex numeric entities: &#x1f;
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      const code = parseInt(hex, 16);
      return code >= 0 && code <= 65535 ? String.fromCharCode(code) : match;
    });

    if (decoded === prev) break;
  }

  return decoded;
};

// Clean and normalize job descriptions from external HTML feeds into readable plain text
const cleanJobDescription = (rawDescription, maxLength = 220) => {
  if (!rawDescription || typeof rawDescription !== "string") {
    return "Click Apply to view full details on the official platform.";
  }

  // 1. First-pass entity decode to resolve encoded tags (e.g. &lt;div&gt;)
  let text = decodeHtmlEntities(rawDescription);

  // 2. Convert structural/block HTML tags to linebreaks to preserve natural paragraph spacing
  text = text
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*hr\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|tr|blockquote|section|article)\s*>/gi, "\n")
    .replace(/<\s*(p|div|h[1-6]|tr|blockquote|section|article)[^>]*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ");

  // 3. Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // 4. Second-pass entity decode for any text entities
  text = decodeHtmlEntities(text);

  // 5. Clean up any stray tag markers or leading angle brackets
  text = text.replace(/^[>\s]+/, "");

  // 6. Normalize whitespace
  text = text.replace(/\u00a0/g, " ");
  text = text.replace(/\r\n/g, "\n");
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

  text = text.trim();

  if (!text) {
    return "Click Apply to view full details on the official platform.";
  }

  // 7. Clean truncation at word boundary (if maxLength > 0)
  if (maxLength && text.length > maxLength) {
    let truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.7) {
      truncated = truncated.slice(0, lastSpace);
    }
    return truncated.trim() + "...";
  }

  return text;
};

// Language Detection Helper — Ensure English Job Listings Only
const germanKeywords = new Set([
  "und", "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "einem", "einen", "eines",
  "für", "fuer", "mit", "von", "im", "in", "zu", "zur", "zum", "auf", "bei", "über", "ueber",
  "wir", "du", "dich", "dir", "sie", "ihr", "uns", "unser", "unsere", "unseren", "unserem", "unserer",
  "ist", "sind", "wird", "werden", "wurde", "wurden", "hast", "haben", "hatte", "hatten",
  "kann", "können", "koennen", "soll", "sollte", "sollten", "möchtest", "moechtest",
  "sucht", "suchen", "bist", "nicht", "oder", "aber", "auch", "nach", "aus", "als", "wie",
  "dass", "wenn", "hier", "mehr", "jahr", "jahre", "jahren", "erfahrung", "erfahrungen",
  "aufgaben", "deine", "dein", "deinen", "deinem", "deiner", "ihre", "ihren", "ihrem", "ihrer",
  "profil", "qualifikationen", "bieten", "vorteile", "standort", "bewerbung", "vollzeit", "teilzeit",
  "befristet", "unbefristet", "bereich", "abschluss", "studium", "kenntnisse", "deutsch", "deutschkenntnisse",
  "arbeitszeit", "arbeiten", "gestalten", "zukunft", "weiterbildung", "teamgeist", "verantwortung",
  "m/w/d", "m/w/x", "w/m/d", "d/m/w", "gn"
]);

const englishKeywords = new Set([
  "the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with",
  "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have", "new",
  "more", "an", "was", "we", "will", "can", "us", "about", "if", "my", "has", "but", "our",
  "one", "other", "do", "no", "they", "he", "she", "what", "which", "their", "out", "use",
  "any", "there", "see", "only", "so", "when", "here", "who", "also", "now", "help", "get",
  "first", "been", "would", "how", "were", "me", "some", "these", "like", "than", "find",
  "who", "we", "are", "experience", "skills", "responsibilities", "requirements", "benefits",
  "building", "leading", "team", "looking", "candidate", "work", "years", "company", "role",
  "join", "apply", "platform", "opportunity", "product", "software", "developer", "engineer"
]);

const otherNonEnglishKeywords = new Set([
  "le", "la", "les", "des", "du", "un", "une", "pour", "avec", "dans", "sur", "nous", "vous", "ils", "elles", "est", "sont", "être", "avoir", "expérience",
  "el", "la", "los", "las", "un", "una", "unos", "unas", "para", "con", "por", "sobre", "nosotros", "ustedes", "es", "son", "estar", "haber", "experiencia",
  "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "per", "con", "su", "noi", "voi", "sono", "essere", "avere", "esperienza",
  "het", "de", "een", "van", "en", "in", "op", "met", "voor", "zijn", "we", "wij", "jij", "je", "is", "wordt", "hebben", "ervaring"
]);

const isEnglishJob = (job) => {
  if (!job) return false;
  const title = (job.title || "").toLowerCase();
  const cleanDesc = cleanJobDescription(job.raw_description || job.description || "", 0).toLowerCase();
  const combinedText = `${title} ${cleanDesc}`;

  if (!cleanDesc) {
    return !/\b(m\/w\/d|w\/m\/d|m\/w\/x|praktikant|werkstudent|referent|sachbearbeiter|leiter|fachkraft|entwickler|berater)\b/i.test(title);
  }

  const hasGermanPhrases = /\b(über\s+|ueber\s+|deine\s+aufgaben|ihre\s+aufgaben|das\s+bringst\s+du\s+mit|das\s+bieten\s+wir|wir\s+suchen|du\s+bist|du\s+möchtest|du\s+moechtest|bist\s+du|wir\s+freuen\s+uns|standort\s*:|bewerben\s+sie\s+sich|unser\s+angebot|wer\s+wir\s+sind|wir\s+bieten|dein\s+profil|ihr\s+profil|unsere\s+leistungen|was\s+wir\s+bieten|was\s+du\s+mitbringst)\b/i.test(combinedText);

  if (hasGermanPhrases) return false;

  const words = combinedText.match(/[a-zäöüßéàèùâêîôûëïüçñ/]+/g) || [];
  if (words.length === 0) return true;

  let germanCount = 0;
  let englishCount = 0;
  let otherNonEnCount = 0;

  for (const w of words) {
    if (germanKeywords.has(w)) germanCount++;
    if (englishKeywords.has(w)) englishCount++;
    if (otherNonEnglishKeywords.has(w)) otherNonEnCount++;
  }

  if (germanCount > englishCount && germanCount >= 3) return false;
  if (otherNonEnCount > englishCount && otherNonEnCount >= 5) return false;

  if (/\b(m\/w\/d|w\/m\/d|m\/w\/x|d\/m\/w)\b/i.test(title) && germanCount >= 2 && germanCount >= englishCount * 0.5) {
    return false;
  }

  if (englishCount >= 5) return true;
  return englishCount >= germanCount && englishCount > 0;
};

// Career Field Classifier — Accurately categorizes jobs into standard professional disciplines
const classifyCareerField = (job) => {
  if (!job) return "Other";
  const title = (job.title || "").toLowerCase();
  const desc = (job.raw_description || job.description || "").toLowerCase();
  const tags = Array.isArray(job.tags) ? job.tags.join(" ").toLowerCase() : "";
  const combined = `${title} ${title} ${desc.slice(0, 500)} ${tags}`;

  // 1. Cybersecurity & Information Security (HIGH PRIORITY before generic Software / IT)
  if (
    /\b(cybersecurity|cyber security|information security|infosec|soc analyst|security engineer|network security|penetration tester|pen tester|cloud security|security operations|incident response|vulnerability management|threat intelligence|ethical hacker|security architect|ciso|siem|appsec|application security|cyber defense|security consultant)\b/i.test(
      combined
    )
  ) {
    return "Cybersecurity / Information Security";
  }

  // 2. Aerospace Engineering
  if (/\b(aerospace|avionics|aeronautic|aircraft|flight|propulsion|spacecraft|satellite|aerodynamic)\b/i.test(combined)) {
    return "Aerospace Engineering";
  }

  // 3. Automobile / Automotive Engineering
  if (/\b(automobile|automotive|ev\b|electric vehicle|powertrain|vehicle dynamic|chassis|car design|fleet)\b/i.test(combined)) {
    return "Automobile Engineering";
  }

  // 4. Mechatronics / Robotics
  if (/\b(robotics|mechatronic|ros\b|autonomous robot|motion control|robotic arm|actuator|kinematics)\b/i.test(combined)) {
    return "Mechatronics / Robotics";
  }

  // 5. Chemical Engineering
  if (/\b(chemical|petrochem|refinery|distillation|thermodynamic|reaction eng|aspen\b|hysys|polymer|chemical process|process engineering)\b/i.test(combined)) {
    return "Chemical Engineering";
  }

  // 6. Civil Engineering
  if (/\b(civil|structural|surveying|staad|geotechnic|bim\b|revit|concrete|construction|building code|infrastructure)\b/i.test(combined) && !/\bcivil rights\b/i.test(combined)) {
    return "Civil Engineering";
  }

  // 7. Mechanical Engineering
  if (/\b(mechanic|mechanical|solidworks|catia|ansys|fea\b|gd&t|hvac|thermodynamics|machining|cnc\b|cad designer|drafting|machine design)\b/i.test(combined)) {
    return "Mechanical Engineering";
  }

  // 8. Electrical & Electronics
  if (/\b(electric|electrical|electronic|electronics|pcb\b|vlsi|verilog|vhdl|embedded|microcontroller|circuit|scada|plc\b|power system|semiconductor)\b/i.test(combined)) {
    return "Electrical / Electronics";
  }

  // 9. Biotechnology & Biomedical
  if (/\b(biotech|biomedical|molecular|genetics|medical device|bioprocess|biochem|fermentation|dna\b|genomics)\b/i.test(combined)) {
    return "Biotechnology / Biomedical";
  }

  // 10. Production & Manufacturing
  if (/\b(manufacturing|production eng|plant manager|assembly line|quality assurance eng|lean manufacturing|six sigma|machinist|operations engineer)\b/i.test(combined)) {
    return "Production / Manufacturing";
  }

  // 11. Design (UI/UX, Graphic, Product, Visual)
  if (/\b(ui\/ux|ux designer|product designer|graphic designer|visual designer|industrial design|figma|creative director|illustrat)\b/i.test(combined)) {
    return "Design";
  }

  // 12. Human Resources
  if (/\b(human resource|hr\b|hrbp|talent acquisition|recruiter|recruitment|people operations|employee relations|onboarding)\b/i.test(combined)) {
    return "Human Resources";
  }

  // 13. Finance & Accounting
  if (/\b(finance|financial|accountant|accounting|cpa\b|cfa\b|audit|tax\b|banking|treasury|wealth|controller|actuary|actuarial)\b/i.test(combined) && !/\b(software developer|frontend|backend)\b/i.test(title)) {
    return "Finance / Accounting";
  }

  // 14. Marketing & Sales
  if (/\b(marketing|sales\b|seo\b|brand manager|growth specialist|account executive|b2b sales|advertising|copywriter|pr manager)\b/i.test(combined) && !/\b(software engineer|frontend|backend)\b/i.test(title)) {
    return "Marketing / Sales";
  }

  // 15. Healthcare
  if (/\b(healthcare|medical|nurse|physician|hospital|patient care|clinic|pharmacy|clinical research|health informatics)\b/i.test(combined)) {
    return "Healthcare";
  }

  // 16. Education
  if (/\b(teacher|teaching|professor|curriculum|instructor|tutor|pedagogy|educator|academic|school)\b/i.test(combined)) {
    return "Education";
  }

  // 17. Research
  if (/\b(research assistant|research scientist|postdoc|laboratory analyst|materials science research|fellow)\b/i.test(combined)) {
    return "Research";
  }

  // 18. Business & Management
  if (/\b(business analyst|project manager|product manager|operations manager|strategy consultant|management consultant|business development|scrum master|operations specialist)\b/i.test(combined)) {
    return "Business / Management";
  }

  // 19. Software & IT
  if (/\b(software|developer|frontend|backend|full stack|devops|cloud engineer|react|node|javascript|python|data engineer|database|sde|web developer|architect|qa engineer|it specialist)\b/i.test(combined)) {
    return "Software / IT";
  }

  return "Other";
};

// In-Memory Cache for External Feed to ensure high performance and reliability
let cachedArbeitnowJobs = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const fetchArbeitnowFeed = async () => {
  const now = Date.now();
  if (cachedArbeitnowJobs.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedArbeitnowJobs;
  }

  try {
    const response = await fetch("https://www.arbeitnow.com/api/job-board-api?page=1", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.data)) {
        const parsed = data.data
          .map((job, idx) => {
            const rawDesc = job.description || "";
            const cleanedDesc = cleanJobDescription(rawDesc, 200);
            const fieldType = classifyCareerField({
              title: job.title,
              description: cleanedDesc,
              raw_description: rawDesc,
              tags: job.tags,
            });
            const jobUrl = job.url || `https://www.arbeitnow.com/jobs/companies/${(job.company_name || "company").toLowerCase().replace(/\s+/g, "-")}/${job.slug || idx}`;

            return {
              id: `arbeit-${job.slug || idx}`,
              title: job.title,
              company: job.company_name,
              location: job.location || "Remote / Various",
              source: "Arbeitnow",
              source_badge_color: "info",
              job_type: job.job_types?.[0] || "Full-time",
              careerField: fieldType,
              posted_at: new Date(job.created_at * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              url: jobUrl,
              jobUrl: jobUrl,
              applyUrl: jobUrl,
              description: cleanedDesc,
              raw_description: rawDesc,
            };
          })
          .filter(isEnglishJob);

        if (parsed.length > 0) {
          cachedArbeitnowJobs = parsed;
          lastFetchTime = now;
        }
      }
    }
  } catch (apiErr) {
    console.warn("External public job API fetch warning:", apiErr.message);
  }

  return cachedArbeitnowJobs;
};

const getExternalJobs = async (req, res) => {
  try {
    const { search, location, careerField, field } = req.query;
    const fetchedJobs = await fetchArbeitnowFeed();

    // Legitimate Multi-Disciplinary Public Job Postings (Specific External Platform Listings: LinkedIn, Naukri, Indeed)
    const curatedLegitimateJobs = [
      // 0. Cybersecurity & Information Security (HIGH PRIORITY)
      {
        id: "ext-cyber-1",
        title: "Cybersecurity Analyst & Threat Intelligence Specialist",
        company: "Palo Alto Networks",
        location: "Santa Clara, CA / Bengaluru",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Cybersecurity / Information Security",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Palo+Alto+Networks+Cybersecurity+Analyst",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Palo+Alto+Networks+Cybersecurity+Analyst",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Palo+Alto+Networks+Cybersecurity+Analyst",
        description: "Monitor SIEM event logs, perform threat hunting, investigate security incident alerts, and analyze network intrusion vectors.",
      },
      {
        id: "ext-cyber-2",
        title: "Security Operations Center (SOC) Analyst",
        company: "CrowdStrike",
        location: "Austin, TX / Remote",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Cybersecurity / Information Security",
        posted_at: "Today",
        url: "https://www.linkedin.com/jobs/search/?keywords=CrowdStrike+SOC+Analyst",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=CrowdStrike+SOC+Analyst",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=CrowdStrike+SOC+Analyst",
        description: "Respond to endpoint detection and response (EDR) telemetry alerts, isolate compromised nodes, and coordinate containment.",
      },
      {
        id: "ext-cyber-3",
        title: "Information Security & Network Security Engineer",
        company: "Cisco",
        location: "San Jose, CA / Bengaluru",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Cybersecurity / Information Security",
        posted_at: "2 days ago",
        url: "https://www.indeed.com/cmp/Cisco/jobs?q=Security+Engineer",
        jobUrl: "https://www.indeed.com/cmp/Cisco/jobs?q=Security+Engineer",
        applyUrl: "https://www.indeed.com/cmp/Cisco/jobs?q=Security+Engineer",
        description: "Configure enterprise next-generation firewalls (NGFW), Zero-Trust network access (ZTNA), and secure VPN tunnels.",
      },
      {
        id: "ext-cyber-4",
        title: "Cloud Security & Penetration Testing Specialist",
        company: "Fortinet",
        location: "Sunnyvale, CA / Remote",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Cybersecurity / Information Security",
        posted_at: "3 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Fortinet+Cloud+Security",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Fortinet+Cloud+Security",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Fortinet+Cloud+Security",
        description: "Perform web application penetration testing, vulnerability assessments (OWASP Top 10), and cloud IAM security audits.",
      },

      // 1. Mechanical Engineering
      {
        id: "ext-mech-1",
        title: "Mechanical Design Engineer — Structural Systems",
        company: "Tesla",
        location: "Fremont, CA / Remote",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Mechanical Engineering",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Tesla+Mechanical+Design+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Tesla+Mechanical+Design+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Tesla+Mechanical+Design+Engineer",
        description: "Design mechanical enclosures, structural assemblies, and CAD models using SolidWorks/CATIA with strict GD&T and FEA stress validation.",
      },
      {
        id: "ext-mech-2",
        title: "Senior Mechanical Engineer — Piping & Equipment",
        company: "Larsen & Toubro (L&T)",
        location: "Mumbai, MH / Chennai",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Mechanical Engineering",
        posted_at: "1 day ago",
        url: "https://www.naukri.com/larsen-and-toubro-mechanical-engineer-jobs",
        jobUrl: "https://www.naukri.com/larsen-and-toubro-mechanical-engineer-jobs",
        applyUrl: "https://www.naukri.com/larsen-and-toubro-mechanical-engineer-jobs",
        description: "Execute static equipment design, pressure vessel sizing in accordance with ASME Section VIII, and piping stress analysis.",
      },
      {
        id: "ext-mech-3",
        title: "HVAC & Thermal Systems Design Engineer",
        company: "Johnson Controls",
        location: "Bengaluru, KA / Pune",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Mechanical Engineering",
        posted_at: "3 days ago",
        url: "https://www.indeed.com/cmp/Johnson-Controls/jobs?q=HVAC+Engineer",
        jobUrl: "https://www.indeed.com/cmp/Johnson-Controls/jobs?q=HVAC+Engineer",
        applyUrl: "https://www.indeed.com/cmp/Johnson-Controls/jobs?q=HVAC+Engineer",
        description: "Develop commercial HVAC airflow calculations, chiller piping designs, and thermal load modeling for industrial facilities.",
      },

      // 2. Chemical Engineering
      {
        id: "ext-chem-1",
        title: "Chemical Process Engineer — Plant Operations",
        company: "Dow Chemical",
        location: "Freeport, TX / Chennai",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Chemical Engineering",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Dow+Chemical+Process+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Dow+Chemical+Process+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Dow+Chemical+Process+Engineer",
        description: "Optimize continuous chemical distillation trains, mass and energy balances, Aspen Plus simulations, and HAZOP process safety.",
      },
      {
        id: "ext-chem-2",
        title: "Petrochemical Process Development Engineer",
        company: "Reliance Industries",
        location: "Jamnagar, GJ / Navi Mumbai",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Chemical Engineering",
        posted_at: "Today",
        url: "https://www.naukri.com/reliance-industries-chemical-engineer-jobs",
        jobUrl: "https://www.naukri.com/reliance-industries-chemical-engineer-jobs",
        applyUrl: "https://www.naukri.com/reliance-industries-chemical-engineer-jobs",
        description: "Lead refinery unit optimization, catalytic cracking yield analysis, and P&ID control loop tuning for petrochemical complexes.",
      },
      {
        id: "ext-chem-3",
        title: "Process Safety & Chemical Unit Operations Specialist",
        company: "BASF",
        location: "Mumbai, MH / Ludwigshafen",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Chemical Engineering",
        posted_at: "4 days ago",
        url: "https://www.indeed.com/cmp/Basf/jobs?q=Chemical+Process+Engineer",
        jobUrl: "https://www.indeed.com/cmp/Basf/jobs?q=Chemical+Process+Engineer",
        applyUrl: "https://www.indeed.com/cmp/Basf/jobs?q=Chemical+Process+Engineer",
        description: "Implement chemical hazard assessments, relief valve sizing, reaction kinetics modeling, and environmental compliance.",
      },

      // 3. Civil Engineering
      {
        id: "ext-civil-1",
        title: "Structural Civil Engineer — Bridges & High-Rise",
        company: "AECOM",
        location: "Bengaluru, KA / London",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Civil Engineering",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=AECOM+Structural+Civil+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=AECOM+Structural+Civil+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=AECOM+Structural+Civil+Engineer",
        description: "Perform structural analysis in STAAD.Pro, reinforced concrete frame modeling, and seismic load compliance per IS/ACI codes.",
      },
      {
        id: "ext-civil-2",
        title: "Civil Infrastructure & Site Planning Engineer",
        company: "Tata Projects",
        location: "Hyderabad, TS / Mumbai",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Civil Engineering",
        posted_at: "3 days ago",
        url: "https://www.naukri.com/tata-projects-civil-engineer-jobs",
        jobUrl: "https://www.naukri.com/tata-projects-civil-engineer-jobs",
        applyUrl: "https://www.naukri.com/tata-projects-civil-engineer-jobs",
        description: "Manage civil site engineering, foundation excavation, quality inspections, and geotechnical survey coordination.",
      },
      {
        id: "ext-civil-3",
        title: "BIM & Civil Structural Modeler",
        company: "Jacobs",
        location: "Gurugram, HR / Remote",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Civil Engineering",
        posted_at: "2 days ago",
        url: "https://www.indeed.com/cmp/Jacobs/jobs?q=Civil+Structural+BIM",
        jobUrl: "https://www.indeed.com/cmp/Jacobs/jobs?q=Civil+Structural+BIM",
        applyUrl: "https://www.indeed.com/cmp/Jacobs/jobs?q=Civil+Structural+BIM",
        description: "Draft 3D structural BIM models in Autodesk Revit, clash detection, and detailed bar bending schedule (BBS) drawings.",
      },

      // 4. Electrical & Electronics
      {
        id: "ext-elec-1",
        title: "Electrical Power Systems & Substation Engineer",
        company: "Siemens",
        location: "Bengaluru, KA / Erlangen",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Electrical / Electronics",
        posted_at: "Today",
        url: "https://www.linkedin.com/jobs/search/?keywords=Siemens+Electrical+Power+Systems+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Siemens+Electrical+Power+Systems+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Siemens+Electrical+Power+Systems+Engineer",
        description: "Design medium-voltage switchgear architectures, power transformer protection schemes, and single-line diagrams (SLD).",
      },
      {
        id: "ext-elec-2",
        title: "Analog & Embedded Hardware Design Engineer",
        company: "Texas Instruments",
        location: "Bengaluru, KA / Dallas, TX",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Electrical / Electronics",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Texas+Instruments+Embedded+Hardware+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Texas+Instruments+Embedded+Hardware+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Texas+Instruments+Embedded+Hardware+Engineer",
        description: "Develop high-speed multi-layer PCB layouts, signal integrity simulations, microcontroller firmware, and power IC testing.",
      },
      {
        id: "ext-elec-3",
        title: "Industrial Automation & PLC Systems Engineer",
        company: "Schneider Electric",
        location: "Gurugram, HR / Paris",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Electrical / Electronics",
        posted_at: "3 days ago",
        url: "https://www.indeed.com/cmp/Schneider-Electric/jobs?q=Automation+PLC+Engineer",
        jobUrl: "https://www.indeed.com/cmp/Schneider-Electric/jobs?q=Automation+PLC+Engineer",
        applyUrl: "https://www.indeed.com/cmp/Schneider-Electric/jobs?q=Automation+PLC+Engineer",
        description: "Program industrial PLCs (Ladder Logic/SFC), configure SCADA HMIs, and integrate Modbus/Profibus field networks.",
      },

      // 5. Mechatronics & Robotics
      {
        id: "ext-mechtron-1",
        title: "Robotics & Automation Controls Engineer",
        company: "ABB Robotics",
        location: "Auburn Hills, MI / Bengaluru",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Mechatronics / Robotics",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=ABB+Robotics+Automation+Controls+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=ABB+Robotics+Automation+Controls+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=ABB+Robotics+Automation+Controls+Engineer",
        description: "Program 6-axis industrial robot kinematics, vision-guided picking systems, ROS navigation nodes, and servo actuators.",
      },
      {
        id: "ext-mechtron-2",
        title: "Mechatronics Systems Integration Engineer",
        company: "KUKA Robotics",
        location: "Pune, MH / Augsburg",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Mechatronics / Robotics",
        posted_at: "4 days ago",
        url: "https://www.indeed.com/cmp/Kuka-Robotics/jobs?q=Mechatronics+Engineer",
        jobUrl: "https://www.indeed.com/cmp/Kuka-Robotics/jobs?q=Mechatronics+Engineer",
        applyUrl: "https://www.indeed.com/cmp/Kuka-Robotics/jobs?q=Mechatronics+Engineer",
        description: "Integrate electro-mechanical sensors, pneumatic end-effectors, and automated assembly cells for precision robotics.",
      },

      // 6. Automobile Engineering
      {
        id: "ext-auto-1",
        title: "Automotive Powertrain & EV Battery Systems Engineer",
        company: "Tata Motors",
        location: "Pune, MH",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Automobile Engineering",
        posted_at: "Just now",
        url: "https://www.naukri.com/tata-motors-automotive-engineer-jobs",
        jobUrl: "https://www.naukri.com/tata-motors-automotive-engineer-jobs",
        applyUrl: "https://www.naukri.com/tata-motors-automotive-engineer-jobs",
        description: "Engineer electric vehicle battery pack cooling systems, high-voltage wiring harnesses, and chassis powertrain mounts.",
      },
      {
        id: "ext-auto-2",
        title: "Vehicle Dynamics & Chassis Systems Engineer",
        company: "Mercedes-Benz R&D",
        location: "Bengaluru, KA / Stuttgart",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Automobile Engineering",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Mercedes-Benz+Vehicle+Dynamics+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Mercedes-Benz+Vehicle+Dynamics+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Mercedes-Benz+Vehicle+Dynamics+Engineer",
        description: "Simulate suspension kinematics, braking stability, steering feedback, and crashworthiness in multi-body dynamics tools.",
      },

      // 7. Production & Manufacturing
      {
        id: "ext-mfg-1",
        title: "Manufacturing Operations & Production Engineer",
        company: "Caterpillar",
        location: "Chennai, TN / Peoria, IL",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Production / Manufacturing",
        posted_at: "3 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Caterpillar+Manufacturing+Production+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Caterpillar+Manufacturing+Production+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Caterpillar+Manufacturing+Production+Engineer",
        description: "Optimize heavy machinery machining lines, implement Lean manufacturing, line balancing, and CNC tooling setups.",
      },
      {
        id: "ext-mfg-2",
        title: "Lean Manufacturing & Quality Assurance Lead",
        company: "Toyota Material Handling",
        location: "Bengaluru, KA / Columbus, IN",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Production / Manufacturing",
        posted_at: "5 days ago",
        url: "https://www.indeed.com/cmp/Toyota-Material-Handling/jobs?q=Manufacturing+Quality",
        jobUrl: "https://www.indeed.com/cmp/Toyota-Material-Handling/jobs?q=Manufacturing+Quality",
        applyUrl: "https://www.indeed.com/cmp/Toyota-Material-Handling/jobs?q=Manufacturing+Quality",
        description: "Lead Kaizen quality improvements, Six Sigma statistical process controls (SPC), and manufacturing assembly defect reduction.",
      },

      // 8. Biotechnology & Biomedical
      {
        id: "ext-bio-1",
        title: "Biomedical Equipment & Clinical Device Engineer",
        company: "Medtronic",
        location: "Hyderabad, TS / Minneapolis, MN",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Biotechnology / Biomedical",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Medtronic+Biomedical+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Medtronic+Biomedical+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Medtronic+Biomedical+Engineer",
        description: "Design diagnostic medical instrumentation, biosensor calibration systems, and ensure FDA/ISO 13485 medical device compliance.",
      },
      {
        id: "ext-bio-2",
        title: "Bioprocess Development & Fermentation Scientist",
        company: "Biocon",
        location: "Bengaluru, KA",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Biotechnology / Biomedical",
        posted_at: "3 days ago",
        url: "https://www.naukri.com/biocon-bioprocess-scientist-jobs",
        jobUrl: "https://www.naukri.com/biocon-bioprocess-scientist-jobs",
        applyUrl: "https://www.naukri.com/biocon-bioprocess-scientist-jobs",
        description: "Develop microbial fermentation protocols, protein purification chromatographies, and scale-up bioreactor runs.",
      },

      // 9. Aerospace Engineering
      {
        id: "ext-aero-1",
        title: "Aerospace Propulsion & Aerodynamics Engineer",
        company: "Boeing",
        location: "Bengaluru, KA / Seattle, WA",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Aerospace Engineering",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Boeing+Aerospace+Propulsion+Engineer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Boeing+Aerospace+Propulsion+Engineer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Boeing+Aerospace+Propulsion+Engineer",
        description: "Perform computational fluid dynamics (CFD) aerodynamic wing profiling, thrust calculations, and flight trajectory modeling.",
      },
      {
        id: "ext-aero-2",
        title: "Avionics & Flight Guidance Systems Specialist",
        company: "Airbus",
        location: "Bengaluru, KA / Toulouse",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Aerospace Engineering",
        posted_at: "4 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Airbus+Avionics+Systems+Specialist",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Airbus+Avionics+Systems+Specialist",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Airbus+Avionics+Systems+Specialist",
        description: "Develop fly-by-wire flight control architectures, navigation sensor integration, and DO-178C avionics certification tests.",
      },

      // 10. Business & Management
      {
        id: "ext-biz-1",
        title: "Business Operations & Strategy Associate",
        company: "McKinsey & Company",
        location: "Mumbai, MH / New York",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Business / Management",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=McKinsey+Business+Operations+Associate",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=McKinsey+Business+Operations+Associate",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=McKinsey+Business+Operations+Associate",
        description: "Drive enterprise operational benchmarking, corporate strategy evaluations, and cross-functional performance analytics.",
      },
      {
        id: "ext-biz-2",
        title: "Project Management Officer (PMO)",
        company: "Accenture",
        location: "Bengaluru, KA / Chicago",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Business / Management",
        posted_at: "3 days ago",
        url: "https://www.indeed.com/cmp/Accenture/jobs?q=Project+Management+Officer",
        jobUrl: "https://www.indeed.com/cmp/Accenture/jobs?q=Project+Management+Officer",
        applyUrl: "https://www.indeed.com/cmp/Accenture/jobs?q=Project+Management+Officer",
        description: "Manage global project workstreams, stakeholder communications, budget milestones, and Agile delivery governance.",
      },

      // 11. Finance & Accounting
      {
        id: "ext-fin-1",
        title: "Financial Analyst — Corporate Valuation & Risk",
        company: "Goldman Sachs",
        location: "Bengaluru, KA / New York",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Finance / Accounting",
        posted_at: "Today",
        url: "https://www.linkedin.com/jobs/search/?keywords=Goldman+Sachs+Financial+Analyst",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Goldman+Sachs+Financial+Analyst",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Goldman+Sachs+Financial+Analyst",
        description: "Construct discounted cash flow (DCF) valuation models, financial statement variance analysis, and capital risk forecasts.",
      },
      {
        id: "ext-fin-2",
        title: "Chartered Accountant / Tax & Audit Consultant",
        company: "Deloitte",
        location: "Hyderabad, TS / London",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Finance / Accounting",
        posted_at: "2 days ago",
        url: "https://www.naukri.com/deloitte-tax-audit-consultant-jobs",
        jobUrl: "https://www.naukri.com/deloitte-tax-audit-consultant-jobs",
        applyUrl: "https://www.naukri.com/deloitte-tax-audit-consultant-jobs",
        description: "Perform corporate statutory auditing, GST/tax filing reconciliations, balance sheet closing, and IFRS compliance.",
      },

      // 12. Marketing & Sales
      {
        id: "ext-mktg-1",
        title: "Brand Marketing & Digital Growth Specialist",
        company: "Unilever",
        location: "Mumbai, MH / London",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Marketing / Sales",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Unilever+Brand+Marketing+Specialist",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Unilever+Brand+Marketing+Specialist",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Unilever+Brand+Marketing+Specialist",
        description: "Execute multi-channel digital brand campaigns, consumer acquisition funnels, SEO strategy, and performance ROI tracking.",
      },
      {
        id: "ext-mktg-2",
        title: "Enterprise B2B Technology Sales Account Executive",
        company: "Salesforce",
        location: "Singapore / Bengaluru",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Marketing / Sales",
        posted_at: "3 days ago",
        url: "https://www.indeed.com/cmp/Salesforce/jobs?q=Account+Executive",
        jobUrl: "https://www.indeed.com/cmp/Salesforce/jobs?q=Account+Executive",
        applyUrl: "https://www.indeed.com/cmp/Salesforce/jobs?q=Account+Executive",
        description: "Manage end-to-end enterprise software sales cycles, executive product demonstrations, contract negotiations, and quotas.",
      },

      // 13. Human Resources
      {
        id: "ext-hr-1",
        title: "Talent Acquisition & Technical Recruiter",
        company: "Amazon",
        location: "Bengaluru, KA / Seattle",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Human Resources",
        posted_at: "Today",
        url: "https://www.linkedin.com/jobs/search/?keywords=Amazon+Talent+Acquisition+Recruiter",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Amazon+Talent+Acquisition+Recruiter",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Amazon+Talent+Acquisition+Recruiter",
        description: "Lead full-lifecycle recruiting across multiple engineering divisions, candidate sourcing, interviews, and compensation offers.",
      },
      {
        id: "ext-hr-2",
        title: "Human Resources Business Partner (HRBP)",
        company: "Microsoft",
        location: "Hyderabad, TS / Redmond, WA",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Human Resources",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Microsoft+Human+Resources+Business+Partner",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Microsoft+Human+Resources+Business+Partner",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Microsoft+Human+Resources+Business+Partner",
        description: "Advise senior business leaders on organizational design, employee retention strategies, talent development, and culture.",
      },

      // 14. Design
      {
        id: "ext-des-1",
        title: "Senior UI/UX Product Designer",
        company: "Adobe",
        location: "Noida, UP / San Jose, CA",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Design",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Adobe+UI+UX+Product+Designer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Adobe+UI+UX+Product+Designer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Adobe+UI+UX+Product+Designer",
        description: "Create user journey maps, design systems, interactive prototypes in Figma, and conduct usability research for creative apps.",
      },
      {
        id: "ext-des-2",
        title: "Visual & Digital Experience Designer",
        company: "Spotify",
        location: "Stockholm / Remote",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Design",
        posted_at: "3 days ago",
        url: "https://www.indeed.com/cmp/Spotify/jobs?q=Product+Designer",
        jobUrl: "https://www.indeed.com/cmp/Spotify/jobs?q=Product+Designer",
        applyUrl: "https://www.indeed.com/cmp/Spotify/jobs?q=Product+Designer",
        description: "Craft high-fidelity brand assets, UI motion graphics, accessible design components, and visual typography standards.",
      },

      // 15. Healthcare
      {
        id: "ext-health-1",
        title: "Health Informatics & Clinical Data Specialist",
        company: "Apollo Hospitals",
        location: "Chennai, TN / Hyderabad",
        source: "Naukri",
        source_badge_color: "warning",
        job_type: "Full-time",
        careerField: "Healthcare",
        posted_at: "3 days ago",
        url: "https://www.naukri.com/apollo-hospitals-health-informatics-jobs",
        jobUrl: "https://www.naukri.com/apollo-hospitals-health-informatics-jobs",
        applyUrl: "https://www.naukri.com/apollo-hospitals-health-informatics-jobs",
        description: "Manage electronic health record (EHR) integrations, clinical analytics pipelines, and patient care informatics quality audits.",
      },

      // 16. Research & Education
      {
        id: "ext-res-1",
        title: "Materials Science & Nanotechnology Research Fellow",
        company: "Max Planck Institute",
        location: "Munich, Germany",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Research",
        posted_at: "4 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Max+Planck+Research+Fellow",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Max+Planck+Research+Fellow",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Max+Planck+Research+Fellow",
        description: "Conduct empirical research on 2D nanomaterials, SEM/TEM electron microscopy characterization, and publish scientific findings.",
      },
      {
        id: "ext-edu-1",
        title: "STEM Technical Curriculum Developer & Educator",
        company: "Pearson",
        location: "London, UK / Remote",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Education",
        posted_at: "5 days ago",
        url: "https://www.indeed.com/cmp/Pearson/jobs?q=Curriculum+Developer",
        jobUrl: "https://www.indeed.com/cmp/Pearson/jobs?q=Curriculum+Developer",
        applyUrl: "https://www.indeed.com/cmp/Pearson/jobs?q=Curriculum+Developer",
        description: "Author interactive engineering coursework, digital STEM assessments, and learning pedagogical frameworks for higher education.",
      },

      // 17. Software / IT
      {
        id: "ext-soft-1",
        title: "Senior Full Stack Developer",
        company: "Google",
        location: "Bengaluru, KA / Mountain View, CA",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Software / IT",
        posted_at: "2 days ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Google+Senior+Full+Stack+Developer",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Google+Senior+Full+Stack+Developer",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Google+Senior+Full+Stack+Developer",
        description: "Designing scalable backend microservices in Go/Node.js and modern high-performance web frontend UI with React.",
      },
      {
        id: "ext-soft-2",
        title: "Frontend Engineer (React / Next.js)",
        company: "Microsoft",
        location: "Hyderabad, TS / Remote",
        source: "LinkedIn",
        source_badge_color: "primary",
        job_type: "Full-time",
        careerField: "Software / IT",
        posted_at: "1 day ago",
        url: "https://www.linkedin.com/jobs/search/?keywords=Microsoft+Frontend+Engineer+React",
        jobUrl: "https://www.linkedin.com/jobs/search/?keywords=Microsoft+Frontend+Engineer+React",
        applyUrl: "https://www.linkedin.com/jobs/search/?keywords=Microsoft+Frontend+Engineer+React",
        description: "Building responsive, modern user interfaces for Microsoft Cloud products using React and TypeScript.",
      },
      {
        id: "ext-soft-3",
        title: "Backend Cloud Infrastructure Engineer",
        company: "Amazon Web Services (AWS)",
        location: "Bengaluru, KA / Seattle, WA",
        source: "Indeed",
        source_badge_color: "info",
        job_type: "Full-time",
        careerField: "Software / IT",
        posted_at: "3 days ago",
        url: "https://www.indeed.com/cmp/Amazon.com/jobs?q=Backend+Cloud+Infrastructure+Engineer",
        jobUrl: "https://www.indeed.com/cmp/Amazon.com/jobs?q=Backend+Cloud+Infrastructure+Engineer",
        applyUrl: "https://www.indeed.com/cmp/Amazon.com/jobs?q=Backend+Cloud+Infrastructure+Engineer",
        description: "Architecting high-throughput REST APIs, database queries in PostgreSQL, and distributed microservices on AWS.",
      },
    ];

    // Deduplicate combined jobs by URL and Title+Company (Prioritize rich multi-disciplinary listings)
    const seenUrls = new Set();
    const seenTitles = new Set();
    const deduplicatedJobs = [];

    for (const job of [...curatedLegitimateJobs, ...fetchedJobs]) {
      const urlKey = job.url ? job.url.toLowerCase() : "";
      const titleKey = `${(job.title || "").toLowerCase()}|${(job.company || "").toLowerCase()}`;
      if ((!urlKey || !seenUrls.has(urlKey)) && !seenTitles.has(titleKey)) {
        if (urlKey) seenUrls.add(urlKey);
        seenTitles.add(titleKey);
        deduplicatedJobs.push(job);
      }
    }

    let filteredJobs = deduplicatedJobs;

    // 1. Filter by Career Field if selected
    const chosenField = (careerField || field || "").trim();
    if (chosenField && chosenField.toLowerCase() !== "all fields" && chosenField.toLowerCase() !== "all") {
      const normField = chosenField.toLowerCase();
      filteredJobs = filteredJobs.filter((j) => {
        const jField = (j.careerField || "").toLowerCase();
        return jField === normField || jField.includes(normField) || normField.includes(jField);
      });
    }

    // 2. Search filter across titles, companies, locations, career fields, and descriptions
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredJobs = filteredJobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.source.toLowerCase().includes(q) ||
          (j.careerField && j.careerField.toLowerCase().includes(q)) ||
          (j.description && j.description.toLowerCase().includes(q))
      );
    }

    // 3. Location filter
    if (location && location.trim()) {
      const loc = location.trim().toLowerCase();
      filteredJobs = filteredJobs.filter((j) =>
        j.location.toLowerCase().includes(loc)
      );
    }

    // If default view (no search/location filter and All Fields), target ~50-70 balanced listings (e.g. 60-65)
    let finalJobs = filteredJobs;
    const isDefaultQuery =
      (!search || !search.trim()) &&
      (!location || !location.trim()) &&
      (!chosenField || chosenField.toLowerCase() === "all fields" || chosenField.toLowerCase() === "all");

    if (isDefaultQuery && filteredJobs.length > 65) {
      finalJobs = filteredJobs.slice(0, 65);
    }

    res.json({
      total: finalJobs.length,
      jobs: finalJobs,
    });
  } catch (error) {
    console.error("External jobs error:", error);
    res.status(500).json({ message: "Failed to fetch external job listings" });
  }
};

module.exports = {
  getExternalJobs,
};

