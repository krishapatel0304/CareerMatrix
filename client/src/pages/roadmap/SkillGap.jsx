import { useState, useEffect, useContext } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { analyzeSkillGap } from "../../services/skillGapService";
import { CAREER_FIELDS } from "../../constants/careerFields";
import { ResumeContext } from "../../context/ResumeContext";
import { UserContext } from "../../context/UserContext";

function SkillGap() {
  const { resumeData } = useContext(ResumeContext);
  const { user } = useContext(UserContext);

  const [careerField, setCareerField] = useState("");
  const [customField, setCustomField] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [jobDescription, setJobDescription] = useState("");
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
        setTargetRole((prev) => prev || prof.targetRole);
      }
      if (prof?.skills) {
        setCurrentSkills((prev) => prev || prof.skills);
      }
      if (prof?.careerField || prof?.targetRole || prof?.skills) {
        setAutoFilled(true);
      }
    }
  }, [resumeData, user]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (e, isRegen = false) => {
    if (e) e.preventDefault();
    setError("");

    if (!currentSkills.trim() || !targetRole.trim()) {
      setError("Both Current Skills and Target Role are required.");
      return;
    }

    const effectiveField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    setLoading(true);
    if (isRegen) setIsRegenerating(true);

    try {
      const data = await analyzeSkillGap({
        careerField: effectiveField,
        targetRole: targetRole.trim(),
        currentSkills: currentSkills.trim(),
        jobDescription: jobDescription.trim(),
        isRegenerate: isRegen,
      });

      if (data.analysis) {
        setResult(data.analysis);
      } else {
        setError("Unable to generate AI content. Please try again.");
      }
    } catch (err) {
      console.error("Skill Gap error:", err);
      setError("Unable to generate AI content. Please try again.");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleClear = () => {
    setCareerField("");
    setCustomField("");
    setCurrentSkills("");
    setTargetRole("");
    setJobDescription("");
    setResult(null);
    setAutoFilled(false);
    setError("");
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-danger";
      case "medium":
        return "bg-warning text-dark";
      case "low":
      default:
        return "bg-info text-dark";
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header */}
            <div className="text-center mb-4">
              <span className="badge bg-primary px-3 py-2 fs-6 mb-2">Cross-Disciplinary AI Competency Diagnostic</span>
              <h2 className="text-dark fw-bold mb-1">📈 AI Skill Gap Analyzer</h2>
              <p className="text-muted">
                Benchmark your skills against standards across any engineering, technical, or professional career
              </p>
            </div>

            {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

            {/* Input Form Card */}
            <div className="card shadow-sm border-0 p-4 p-md-5 mb-5 bg-white">
              {autoFilled && (
                <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-center justify-content-between small">
                  <span>✨ <strong>Auto-filled from your saved resume:</strong> Review or modify your competencies below anytime.</span>
                  <button type="button" className="btn-close btn-sm" onClick={() => setAutoFilled(false)} aria-label="Close"></button>
                </div>
              )}
              <form onSubmit={(e) => handleAnalyze(e, false)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Career Field / Industry <span className="text-muted small">(Optional / Recommended)</span>
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
                    <label className="form-label fw-semibold">
                      Target Career Role <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mechanical Design Engineer, Process Engineer, Civil Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Current Skills & Technologies <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. AutoCAD, SolidWorks / Thermodynamics, Aspen Plus / Python, SQL, Excel"
                      value={currentSkills}
                      onChange={(e) => setCurrentSkills(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Target Job Description / Industry Benchmarks (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Paste specific job posting requirements, equipment standards, or key responsibilities..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={loading}
                    ></textarea>
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2 mt-4">
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
                          Analyzing Skill Gaps...
                        </>
                      ) : (
                        "Analyze Skill Gap →"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Analysis Results Display */}
            {result && (
              <div className="card shadow border-0 p-4 p-md-5 bg-white">
                {/* Score & Summary Banner */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-4 mb-4 gap-3">
                  <div>
                    <span className="badge bg-primary px-3 py-1 mb-2">Role Benchmark</span>
                    <h3 className="fw-bold text-dark mb-1">{result.targetRole}</h3>
                    <p className="text-muted small mb-0">{result.summary}</p>
                  </div>

                  <div className="d-flex flex-column flex-sm-row align-items-center gap-3">
                    <div className="text-center p-3 bg-light rounded border" style={{ minWidth: "160px" }}>
                      <div className="display-6 fw-bold text-primary mb-0">
                        {result.matchPercentage || 75}%
                      </div>
                      <span className="small text-muted fw-semibold">Profile Match</span>
                      <div className="progress mt-2" style={{ height: "6px" }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${result.matchPercentage || 75}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      className="btn btn-outline-primary btn-sm fw-semibold text-nowrap"
                      onClick={(e) => handleAnalyze(e, true)}
                      disabled={loading}
                    >
                      {isRegenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Regenerating...
                        </>
                      ) : (
                        "🔄 Regenerate Analysis"
                      )}
                    </button>
                  </div>
                </div>

                {/* Matched Skills */}
                {result.matchedSkills && result.matchedSkills.length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold text-success mb-3">✅ Matched Skills & Strengths</h5>
                    <div className="row g-2">
                      {result.matchedSkills.map((m, idx) => (
                        <div key={idx} className="col-md-6">
                          <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-2 d-flex justify-content-between align-items-center">
                            <div>
                              <strong className="text-success">{m.skill}</strong>
                              {m.notes && <div className="small text-muted mt-1">{m.notes}</div>}
                            </div>
                            <span className="badge bg-success small">{m.level || "Proficient"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills Table */}
                {result.missingSkills && result.missingSkills.length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold text-danger mb-3">❌ Missing Skills & Action Priorities</h5>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle border">
                        <thead className="table-light">
                          <tr>
                            <th>Skill</th>
                            <th>Priority</th>
                            <th>Requirement Rationale</th>
                            <th>Recommended Learning Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.missingSkills.map((gap, idx) => (
                            <tr key={idx}>
                              <td className="fw-bold text-dark">{gap.skill}</td>
                              <td>
                                <span className={`badge px-2 py-1 ${getPriorityBadgeClass(gap.priority)}`}>
                                  {gap.priority || "High"}
                                </span>
                              </td>
                              <td className="small text-secondary">{gap.reason}</td>
                              <td className="small text-primary fw-semibold">{gap.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Skills to Improve */}
                {result.skillsToImprove && result.skillsToImprove.length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold text-warning text-dark mb-3">🟡 Skills to Level Up</h5>
                    <div className="row g-3">
                      {result.skillsToImprove.map((item, idx) => (
                        <div key={idx} className="col-md-6">
                          <div className="p-3 bg-light rounded border">
                            <div className="d-flex justify-content-between mb-1">
                              <strong>{item.skill}</strong>
                              <span className="small text-muted">
                                {item.currentLevel} → <strong className="text-primary">{item.targetLevel}</strong>
                              </span>
                            </div>
                            <p className="small text-secondary mb-0">{item.tips}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Plan */}
                {result.recommendedActionPlan && result.recommendedActionPlan.length > 0 && (
                  <div>
                    <h5 className="fw-bold text-dark mb-3">📋 Strategic Next Steps</h5>
                    <ol className="ps-3 mb-0">
                      {result.recommendedActionPlan.map((step, idx) => (
                        <li key={idx} className="mb-2 text-secondary small">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default SkillGap;