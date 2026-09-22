import { useEffect, useState, useCallback, useContext } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getExternalJobs } from "../../services/externalJobService";
import { CAREER_FIELD_FILTER_OPTIONS } from "../../constants/careerFields";
import { ResumeContext } from "../../context/ResumeContext";
import { UserContext } from "../../context/UserContext";

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
  for (let pass = 0; pass < 3; pass++) {
    const prev = decoded;
    decoded = decoded.replace(
      /&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|bull|rsquo|lsquo|rdquo|ldquo);/gi,
      (match) => entityMap[match.toLowerCase()] || match
    );
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      const code = parseInt(num, 10);
      return code >= 0 && code <= 65535 ? String.fromCharCode(code) : match;
    });
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      const code = parseInt(hex, 16);
      return code >= 0 && code <= 65535 ? String.fromCharCode(code) : match;
    });
    if (decoded === prev) break;
  }
  return decoded;
};

// Clean and normalize job descriptions from external HTML feeds into readable plain text
const cleanJobDescription = (rawDescription) => {
  if (!rawDescription || typeof rawDescription !== "string") {
    return "Click Apply to view full details on the official platform.";
  }

  let text = decodeHtmlEntities(rawDescription);

  text = text
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*hr\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|tr|blockquote|section|article)\s*>/gi, "\n")
    .replace(/<\s*(p|div|h[1-6]|tr|blockquote|section|article)[^>]*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ");

  text = text.replace(/<[^>]+>/g, " ");
  text = decodeHtmlEntities(text);
  text = text.replace(/^[>\s]+/, "");
  text = text.replace(/\u00a0/g, " ");
  text = text.replace(/\r\n/g, "\n");
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

  return text.trim() || "Click Apply to view full details on the official platform.";
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

const isEnglishJob = (job) => {
  if (!job) return false;
  const title = (job.title || "").toLowerCase();
  const cleanDesc = cleanJobDescription(job.description || "").toLowerCase();
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

  for (const w of words) {
    if (germanKeywords.has(w)) germanCount++;
    if (englishKeywords.has(w)) englishCount++;
  }

  if (germanCount > englishCount && germanCount >= 3) return false;

  if (/\b(m\/w\/d|w\/m\/d|m\/w\/x|d\/m\/w)\b/i.test(title) && germanCount >= 2 && germanCount >= englishCount * 0.5) {
    return false;
  }

  if (englishCount >= 5) return true;
  return englishCount >= germanCount && englishCount > 0;
};

function ExternalJobs() {
  const { resumeData } = useContext(ResumeContext);
  const { user } = useContext(UserContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [careerFieldFilter, setCareerFieldFilter] = useState("All Fields");
  const [initialFieldLoaded, setInitialFieldLoaded] = useState(false);

  // Auto-default filter based on user's saved resume
  useEffect(() => {
    if (!initialFieldLoaded) {
      const field = resumeData?.professional?.careerField || user?.career_field;
      if (field && CAREER_FIELD_FILTER_OPTIONS.includes(field)) {
        setCareerFieldFilter(field);
        setInitialFieldLoaded(true);
      }
    }
  }, [resumeData, user, initialFieldLoaded]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getExternalJobs({
        search: searchTerm,
        location: locationFilter,
        careerField: careerFieldFilter !== "All Fields" ? careerFieldFilter : "",
      });
      const validJobs = (data.jobs || []).filter(isEnglishJob);
      setJobs(validJobs);
    } catch (err) {
      console.error("Fetch external jobs error:", err);
      setError("Failed to load external job listings.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationFilter, careerFieldFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const getSourceBadgeClass = (source) => {
    switch (source?.toLowerCase()) {
      case "linkedin":
        return "bg-primary text-white";
      case "indeed":
        return "bg-info text-dark";
      case "naukri":
        return "bg-warning text-dark";
      case "remotive":
      case "arbeitnow":
      default:
        return "bg-secondary text-white";
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-primary mb-1">🌐 Multi-Discipline External Job Listings</h2>
            <p className="text-muted mb-0">
              Browse legitimate career opportunities across all engineering branches, sciences, business, and tech
            </p>
          </div>
          <span className="badge bg-light text-dark border p-2 fs-6">
            Showing {jobs.length} Verified Listings
          </span>
        </div>

        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

        {/* Search, Career Field & Location Filter Bar */}
        <div className="card shadow-sm p-3 mb-4 bg-light border-0">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search title, skills, company (e.g. Mechanical, Dow, Python)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={careerFieldFilter}
                onChange={(e) => setCareerFieldFilter(e.target.value)}
                aria-label="Filter by Career Field"
              >
                {CAREER_FIELD_FILTER_OPTIONS.map((field) => (
                  <option key={field} value={field}>
                    {field === "All Fields" ? "📁 All Career Fields" : field}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Filter by Location (e.g. Bengaluru, Berlin, Remote)..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100 fw-semibold">
                Filter Jobs
              </button>
            </div>
          </form>

          {resumeData?.professional?.targetRole && (
            <div className="mt-2 text-start small">
              <span className="text-muted me-2">Suggested from your resume:</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill"
                onClick={() => {
                  setSearchTerm(resumeData.professional.targetRole);
                }}
              >
                🎯 {resumeData.professional.targetRole}
              </button>
            </div>
          )}
        </div>

        {/* Job Listings Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Fetching verified multi-discipline job posts...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card shadow border-0 p-5 text-center">
            <h5>No job listings found</h5>
            <p className="text-muted">Try choosing &quot;All Fields&quot; or broadening your search keywords.</p>
          </div>
        ) : (
          <div className="row g-4">
            {jobs.map((job) => (
              <div key={job.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100 d-flex flex-column p-4 hover-shadow">
                  <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                    <div className="d-flex gap-1 flex-wrap">
                      <span className={`badge px-2 py-1 rounded-1 ${getSourceBadgeClass(job.source)}`}>
                        {job.source}
                      </span>
                      {job.careerField && (
                        <span className="badge bg-light text-primary border border-primary-subtle">
                          {job.careerField}
                        </span>
                      )}
                    </div>
                    <span className="badge bg-light text-secondary border">
                      {job.job_type || "Full-time"}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-1">{job.title}</h5>
                  <h6 className="text-primary fw-semibold mb-2">{job.company}</h6>

                  <p className="text-muted small mb-3">
                    📍 {job.location} • <span className="fst-italic">{job.posted_at}</span>
                  </p>

                  <p
                    className="card-text text-secondary fs-7 mb-4 flex-grow-1"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {cleanJobDescription(job.description)}
                  </p>

                  <a
                    href={job.jobUrl || job.applyUrl || job.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary w-100 mt-auto fw-bold"
                  >
                    Apply on {job.source} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ExternalJobs;
