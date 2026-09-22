import { useState, useEffect, useContext } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { generateCareerRoadmap } from "../../services/roadmapService";
import { CAREER_FIELDS } from "../../constants/careerFields";
import { ResumeContext } from "../../context/ResumeContext";
import { UserContext } from "../../context/UserContext";

function CareerRoadmap() {
  const { resumeData } = useContext(ResumeContext);
  const { user } = useContext(UserContext);

  const [careerField, setCareerField] = useState("");
  const [customField, setCustomField] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Beginner (0-2 years)");
  const [interests, setInterests] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill from saved Resume
  useEffect(() => {
    const prof = resumeData?.professional;
    const pers = resumeData?.personal;

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
        setSkills((prev) => prev || prof.skills);
      }
      if (prof?.education || prof?.experience) {
        const inferredCurrent = prof?.education?.split("\n")[0] || prof?.experience?.split("\n")[0] || "";
        setCurrentRole((prev) => prev || inferredCurrent);
      }
      if (prof?.experience && prof.experience.toLowerCase().includes("senior")) {
        setExperienceLevel("Advanced (5+ years)");
      } else if (prof?.experience && (prof.experience.toLowerCase().includes("year") || prof.experience.length > 20)) {
        setExperienceLevel("Intermediate (2-5 years)");
      }
      if (prof?.careerField || prof?.targetRole || prof?.skills) {
        setAutoFilled(true);
      }
    }
  }, [resumeData, user]);

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e, isRegen = false) => {
    if (e) e.preventDefault();
    setError("");

    if (!targetRole.trim()) {
      setError("Please enter your Target Career Role.");
      return;
    }

    const effectiveField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    setLoading(true);
    if (isRegen) setIsRegenerating(true);

    try {
      const data = await generateCareerRoadmap({
        careerField: effectiveField,
        currentRole: currentRole.trim(),
        targetRole: targetRole.trim(),
        currentSkills: skills.trim(),
        experienceLevel,
        interests: interests.trim(),
        isRegenerate: isRegen,
      });

      if (data.roadmap) {
        setRoadmap(data.roadmap);
      } else {
        setError("Unable to generate AI content. Please try again.");
      }
    } catch (err) {
      console.error("Roadmap generation error:", err);
      setError("Unable to generate AI content. Please try again.");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleClear = () => {
    setCareerField("");
    setCustomField("");
    setCurrentRole("");
    setTargetRole("");
    setSkills("");
    setExperienceLevel("Beginner (0-2 years)");
    setInterests("");
    setRoadmap(null);
    setAutoFilled(false);
    setError("");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header */}
            <div className="text-center mb-4">
              <span className="badge bg-primary px-3 py-2 fs-6 mb-2">Cross-Disciplinary AI Career Strategist</span>
              <h2 className="text-dark fw-bold mb-1">🗺️ Personalized Career Roadmap</h2>
              <p className="text-muted">
                Generate an actionable step-by-step development roadmap for any academic or engineering field powered by Gemini AI
              </p>
            </div>

            {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

            {/* Input Form Card */}
            <div className="card shadow-sm border-0 p-4 p-md-5 mb-5 bg-white">
              {autoFilled && (
                <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-center justify-content-between small">
                  <span>✨ <strong>Auto-filled from your saved resume:</strong> Review or customize your fields below anytime.</span>
                  <button type="button" className="btn-close btn-sm" onClick={() => setAutoFilled(false)} aria-label="Close"></button>
                </div>
              )}
              <form onSubmit={(e) => handleGenerate(e, false)}>
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
                      placeholder="e.g. Mechanical Design Engineer, Process Engineer, Data Analyst"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Current Role / Academic Background</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Engineering Student / Graduate / Junior Engineer"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Experience Level</label>
                    <select
                      className="form-select"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      disabled={loading}
                    >
                      <option value="Beginner (0-2 years)">Beginner (0-2 years)</option>
                      <option value="Intermediate (2-5 years)">Intermediate (2-5 years)</option>
                      <option value="Advanced (5+ years)">Advanced (5+ years)</option>
                      <option value="Career Switcher">Career Switcher</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Current Skills & Tools Known</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. AutoCAD, SolidWorks, CAD / Thermodynamics, Aspen Plus, Process Design / Python, SQL, Excel..."
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Specific Interests / Specializations (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Structural FEA, Plant Safety, Renewable Energy, Plant Automation, Quantitative Analysis"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      disabled={loading}
                    />
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
                          Architecting Career Roadmap...
                        </>
                      ) : (
                        "Generate Career Roadmap →"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Generated Roadmap Display */}
            {roadmap && (
              <div className="card shadow border-0 p-4 p-md-5 bg-white">
                {/* Header Summary Banner */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-4 mb-4 gap-3">
                  <div>
                    <span className="badge bg-success px-3 py-1 mb-2">Target Career Role</span>
                    <h3 className="fw-bold text-dark mb-1">{roadmap.targetRole}</h3>
                    <p className="text-muted small mb-0">
                      ⏱️ Estimated Timeframe: <strong>{roadmap.estimatedTimeframe || "6 - 9 Months"}</strong>
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm fw-semibold"
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
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => window.print()}
                      disabled={loading}
                    >
                      🖨️ Print Roadmap
                    </button>
                  </div>
                </div>

                {/* Skill Assessment */}
                {roadmap.skillAssessment && (
                  <div className="alert alert-info border-0 shadow-sm mb-4">
                    <h6 className="fw-bold mb-1">📊 Skill Assessment & Strategy</h6>
                    <p className="mb-0 small text-dark">{roadmap.skillAssessment}</p>
                  </div>
                )}

                {/* Recommended Skills */}
                {roadmap.recommendedSkills && roadmap.recommendedSkills.length > 0 && (
                  <div className="mb-5">
                    <h5 className="fw-bold text-dark mb-3">🎯 High-Priority Skills to Master</h5>
                    <div className="d-flex flex-wrap gap-2">
                      {roadmap.recommendedSkills.map((sk, idx) => (
                        <span key={idx} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 fs-7 fw-semibold">
                          ✦ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phased Roadmap Timeline */}
                {roadmap.stages && roadmap.stages.length > 0 && (
                  <div className="mb-5">
                    <h5 className="fw-bold text-dark mb-4">🚀 Step-by-Step Learning Stages</h5>
                    <div className="row g-4">
                      {roadmap.stages.map((stage, idx) => (
                        <div key={idx} className="col-md-6">
                          <div className="card shadow-sm h-100 border-0 border-top border-4 border-primary p-4 bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="badge bg-primary">Phase {stage.phase || idx + 1}</span>
                              <span className="text-muted small fw-semibold">📅 {stage.timeframe}</span>
                            </div>
                            <h5 className="fw-bold text-dark mt-1 mb-2">{stage.title}</h5>
                            <p className="text-secondary small mb-3">{stage.description}</p>

                            {stage.topics && stage.topics.length > 0 && (
                              <div className="mb-3">
                                <span className="text-dark small fw-bold d-block mb-1">Key Topics:</span>
                                <ul className="small text-secondary ps-3 mb-0">
                                  {stage.topics.map((t, tIdx) => (
                                    <li key={tIdx}>{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {stage.milestoneProject && (
                              <div className="mt-auto pt-2 border-top">
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small d-block text-start p-2">
                                  🏆 <strong>Milestone Project:</strong> {stage.milestoneProject}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones & Goals Breakdown */}
                {roadmap.goals && (
                  <div>
                    <h5 className="fw-bold text-dark mb-3">🎯 Career Goals Timeline</h5>
                    <div className="row g-3">
                      {roadmap.goals.shortTerm && (
                        <div className="col-md-4">
                          <div className="card p-3 border-0 bg-light border-start border-3 border-info">
                            <span className="text-muted small fw-bold">SHORT-TERM (1-3 MONTHS)</span>
                            <p className="small text-dark mt-1 mb-0">{roadmap.goals.shortTerm}</p>
                          </div>
                        </div>
                      )}
                      {roadmap.goals.mediumTerm && (
                        <div className="col-md-4">
                          <div className="card p-3 border-0 bg-light border-start border-3 border-warning">
                            <span className="text-muted small fw-bold">MEDIUM-TERM (3-6 MONTHS)</span>
                            <p className="small text-dark mt-1 mb-0">{roadmap.goals.mediumTerm}</p>
                          </div>
                        </div>
                      )}
                      {roadmap.goals.longTerm && (
                        <div className="col-md-4">
                          <div className="card p-3 border-0 bg-light border-start border-3 border-success">
                            <span className="text-muted small fw-bold">LONG-TERM (6-12 MONTHS)</span>
                            <p className="small text-dark mt-1 mb-0">{roadmap.goals.longTerm}</p>
                          </div>
                        </div>
                      )}
                    </div>
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

export default CareerRoadmap;