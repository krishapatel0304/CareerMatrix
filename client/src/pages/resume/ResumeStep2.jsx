import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ResumeContext } from "../../context/ResumeContext";
import ResumeNavbar from "../../components/ResumeNavbar";
import Footer from "../../components/Footer";
import { generateResumeAI } from "../../services/resumeService";
import { CAREER_FIELDS } from "../../constants/careerFields";

function ResumeStep2() {
  const navigate = useNavigate();
  const {
    resumeData,
    updateProfessional,
    selectedTemplate,
    setGeneratedContent,
    saveResumeToDb,
    setHasCompletedResume,
  } = useContext(ResumeContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const professional = resumeData.professional || {};

  const handleGenerateAI = async () => {
    setError("");
    setLoading(true);

    try {
      const effectiveCareerField = professional.careerField === "Other"
        ? (professional.customField || "Other Discipline")
        : (professional.careerField || "");

      const response = await generateResumeAI({
        careerField: effectiveCareerField,
        personal: resumeData.personal,
        professional: resumeData.professional,
        template: selectedTemplate,
      });

      if (response.generatedContent) {
        setGeneratedContent(response.generatedContent);
        setHasCompletedResume(true);
        // Persist to database
        try {
          await saveResumeToDb({
            template: selectedTemplate,
            personal: resumeData.personal,
            professional: resumeData.professional,
            generatedContent: response.generatedContent,
          });
        } catch (dbErr) {
          console.warn("Could not auto-save after AI generation:", dbErr.message);
        }
        navigate("/resume-preview");
      } else {
        setError("Failed to generate resume content with AI. Please try again.");
      }
    } catch (err) {
      console.error("AI Resume Generation error:", err);
      setError(err.message || "Failed to generate AI resume. You can still preview your entered details directly.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewDirectly = () => {
    setHasCompletedResume(true);
    navigate("/resume-preview");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <ResumeNavbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Step Indicator & Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <span className="badge bg-success px-3 py-2 mb-1">Step 2 of 2: Professional Details</span>
                <h2 className="fw-bold text-dark mb-0">Career & Technical Background</h2>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Template:</span>
                <span className="badge bg-light text-primary border px-2 py-1 me-2">{selectedTemplate}</span>
                <Link to="/templates" className="small text-decoration-none">
                  Change
                </Link>
              </div>
            </div>

            {error && <div className="alert alert-warning shadow-sm mb-4">{error}</div>}

            <div className="card shadow-sm border-0 p-4 p-md-5">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Career Field / Industry <span className="text-muted small">(Recommended)</span>
                  </label>
                  <select
                    className="form-select"
                    value={professional.careerField || ""}
                    onChange={(e) => updateProfessional("careerField", e.target.value)}
                  >
                    <option value="">-- Select Career Field / Industry --</option>
                    {CAREER_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>

                  {professional.careerField === "Other" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Specify your field (e.g. Food Technology, Architecture, Law, Agriculture)"
                        value={professional.customField || ""}
                        onChange={(e) => updateProfessional("customField", e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Target Job Role / Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mechanical Engineer, Security Analyst, Financial Analyst"
                    value={professional.targetRole || ""}
                    onChange={(e) => updateProfessional("targetRole", e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Career Objective / Summary
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Briefly describe your career background, key focus areas, and professional goals..."
                    value={professional.objective || ""}
                    onChange={(e) => updateProfessional("objective", e.target.value)}
                  ></textarea>
                  <small className="text-muted">
                    Tip: Enter rough notes; Gemini AI will polish this into an impactful executive summary for your field.
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Education <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Bachelor of Engineering in Mechanical / Chemical / Civil / Computer Science / Business&#10;XYZ University, 2021 - 2025&#10;CGPA: 8.8 / 10.0"
                    value={professional.education || ""}
                    onChange={(e) => updateProfessional("education", e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Skills & Technical Tools <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. AutoCAD, SolidWorks, FEA, DFM (Mechanical) / Thermodynamics, Aspen Plus (Chemical) / Python, SQL, React (Software/Data)..."
                    value={professional.skills || ""}
                    onChange={(e) => updateProfessional("skills", e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Academic / Industry Projects
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Project 1: Mechanical Gearbox Assembly Optimization&#10;Modeled 3D components in SolidWorks and performed FEA stress analysis in ANSYS.&#10;&#10;Project 2: Distillation Column Simulation&#10;Simulated continuous ethanol separation flowsheet in Aspen Plus."
                    value={professional.projects || ""}
                    onChange={(e) => updateProfessional("projects", e.target.value)}
                  ></textarea>
                  <small className="text-muted">
                    Separate projects with empty lines. AI will structure and optimize project bullet points.
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Work / Internship / Industrial Training (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Engineering / Technical Intern — Acme Corp (May 2024 - Aug 2024)&#10;Designed components, conducted quality inspection, and assisted with process modeling."
                    value={professional.experience || ""}
                    onChange={(e) => updateProfessional("experience", e.target.value)}
                  ></textarea>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Certifications (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CSWA / CSWP SolidWorks, Lean Six Sigma, Aspen Process Certified, PMP"
                    value={professional.certifications || ""}
                    onChange={(e) => updateProfessional("certifications", e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Languages Known</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. English, Spanish, Hindi"
                    value={professional.languages || ""}
                    onChange={(e) => updateProfessional("languages", e.target.value)}
                  />
                </div>

                <div className="col-12 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 w-md-auto"
                    onClick={() => navigate("/resume-step1")}
                    disabled={loading}
                  >
                    ← Back to Step 1
                  </button>

                  <div className="d-flex gap-2 w-100 w-md-auto justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handlePreviewDirectly}
                      disabled={loading}
                    >
                      Direct Preview
                    </button>

                    <button
                      type="button"
                      className="btn btn-success px-4 fw-bold shadow-sm"
                      onClick={handleGenerateAI}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating with Gemini AI...
                        </>
                      ) : (
                        "✨ Enhance & Generate Resume →"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ResumeStep2;