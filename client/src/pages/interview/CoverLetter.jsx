import { useState, useEffect, useContext } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { generateCoverLetter } from "../../services/coverLetterService";
import { CAREER_FIELDS } from "../../constants/careerFields";
import { ResumeContext } from "../../context/ResumeContext";
import { UserContext } from "../../context/UserContext";

function CoverLetter() {
  const { resumeData } = useContext(ResumeContext);
  const { user } = useContext(UserContext);

  const [careerField, setCareerField] = useState("");
  const [customField, setCustomField] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill from saved Resume
  useEffect(() => {
    const prof = resumeData?.professional;
    if (prof || user) {
      if (prof?.careerField || user?.career_field) {
        setCareerField((prev) => prev || prof?.careerField || user?.career_field || "");
      }
      if (prof?.customField) {
        setCustomField((prev) => prev || prof.customField);
      }
      if (prof?.targetRole) {
        setJobRole((prev) => prev || prof.targetRole);
      }
      if (prof?.skills) {
        setUserSkills((prev) => prev || prof.skills);
      }
      if (prof?.experience) {
        setExperience((prev) => prev || prof.experience);
      }
      if (prof?.careerField || prof?.targetRole || prof?.skills) {
        setAutoFilled(true);
      }
    }
  }, [resumeData, user]);

  const [generatedLetter, setGeneratedLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e, isRegen = false) => {
    if (e) e.preventDefault();
    setError("");
    setCopied(false);

    if (!companyName.trim() || !jobRole.trim()) {
      setError("Company Name and Job Role are required to generate a cover letter.");
      return;
    }

    const effectiveField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    setLoading(true);
    if (isRegen) setIsRegenerating(true);

    try {
      const data = await generateCoverLetter({
        careerField: effectiveField,
        companyName: companyName.trim(),
        jobRole: jobRole.trim(),
        jobDescription: jobDescription.trim(),
        userSkills: userSkills.trim(),
        experience: experience.trim(),
        education: resumeData?.professional?.education || "",
        projects: resumeData?.professional?.projects || "",
        certifications: resumeData?.professional?.certifications || "",
        candidateName: resumeData?.personal?.name || user?.name || "",
        isRegenerate: isRegen,
      });

      if (data.coverLetter) {
        setGeneratedLetter(data.coverLetter);
      } else {
        setError("Unable to generate AI content. Please try again.");
      }
    } catch (err) {
      console.error("Cover letter generation error:", err);
      setError("Unable to generate AI content. Please try again.");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClear = () => {
    setCareerField("");
    setCustomField("");
    setCompanyName("");
    setJobRole("");
    setJobDescription("");
    setUserSkills("");
    setExperience("");
    setGeneratedLetter("");
    setError("");
    setCopied(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="text-center mb-4">
              <span className="badge bg-primary px-3 py-2 fs-6 mb-2">Cross-Disciplinary AI Document Creator</span>
              <h2 className="text-dark fw-bold mb-1">✉️ AI Cover Letter Generator</h2>
              <p className="text-muted">
                Generate a custom-tailored, professional cover letter for any engineering, scientific, or corporate career powered by Gemini AI
              </p>
            </div>

            <div className="card shadow-sm border-0 p-4 p-md-5 mb-4 bg-white">
              {autoFilled && (
                <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-center justify-content-between small">
                  <span>✨ <strong>Auto-filled from your saved resume:</strong> Your role, skills, and background are pre-filled below.</span>
                  <button type="button" className="btn-close btn-sm" onClick={() => setAutoFilled(false)} aria-label="Close"></button>
                </div>
              )}
              <form onSubmit={(e) => handleGenerate(e, false)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Target Company / Organization <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Larsen & Toubro, Reliance, Tesla, Google, Deloitte"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Job Role / Target Position <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mechanical Design Engineer, Process Engineer, Civil Engineer"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Career Field / Industry <span className="text-muted small">(Optional)</span>
                    </label>
                    <select
                      className="form-select"
                      value={careerField}
                      onChange={(e) => setCareerField(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">-- Select Career Field / Industry --</option>
                      {CAREER_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>

                    {careerField === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Specify your field (e.g. Food Technology, Architecture, Law, Agriculture)"
                          value={customField}
                          onChange={(e) => setCustomField(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Years of Experience / Background</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 2 years design experience / Recent Engineering Graduate"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Your Key Skills & Tools</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. AutoCAD, SolidWorks, FEA / Thermodynamics, Aspen Plus / Python, SQL"
                      value={userSkills}
                      onChange={(e) => setUserSkills(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Job Description / Requirements (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Paste key responsibilities or job posting summary to tailor content..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={loading}
                    ></textarea>
                  </div>

                  <div className="col-12 d-flex gap-2 justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleClear}
                      disabled={loading}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 fw-bold shadow-sm"
                      disabled={loading}
                    >
                      {loading && !isRegenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating with Gemini AI...
                        </>
                      ) : (
                        "Generate Cover Letter →"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Generated Cover Letter Result */}
            {generatedLetter && (
              <div className="card shadow border-0 p-4 p-md-5 bg-white">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center border-bottom pb-3 mb-4 gap-2">
                  <div>
                    <span className="badge bg-success px-3 py-1 mb-1">Tailored for {companyName}</span>
                    <h4 className="fw-bold text-dark mb-0">📄 Your Generated Cover Letter</h4>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary fw-semibold"
                      onClick={(e) => handleGenerate(e, true)}
                      disabled={loading}
                    >
                      {isRegenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Regenerating...
                        </>
                      ) : (
                        "🔄 Regenerate Alternative"
                      )}
                    </button>
                    <button
                      className="btn btn-sm btn-success fw-semibold"
                      onClick={handleCopy}
                      disabled={loading}
                    >
                      {copied ? "✅ Copied!" : "📋 Copy Cover Letter"}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-light rounded-3 border text-dark fs-6">
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      fontFamily: "inherit",
                      margin: 0,
                      lineHeight: "1.6",
                    }}
                  >
                    {generatedLetter}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CoverLetter;