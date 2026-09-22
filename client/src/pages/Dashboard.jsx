import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { UserContext } from "../context/UserContext";
import { ResumeContext } from "../context/ResumeContext";
import { getJobStats } from "../services/jobService";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const {
    resumeData,
    generatedContent,
    selectedTemplate,
    hasCompletedResume,
    initialResumeLoaded,
    loadSavedResume,
  } = useContext(ResumeContext);

  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
    pending: 0,
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialResumeLoaded && !hasCompletedResume) {
      navigate("/resume-selection", { replace: true });
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getJobStats();
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.recentJobs) {
          setRecentJobs(data.recentJobs);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (hasCompletedResume) {
      fetchDashboardData();
      loadSavedResume();
    }
  }, [initialResumeLoaded, hasCompletedResume, navigate, loadSavedResume]);

  const personal = resumeData?.personal || {};
  const professional = resumeData?.professional || {};

  // Extract skills as an array for display
  const rawSkills = generatedContent?.skills?.join?.(", ") || professional?.skills || "";
  const skillsList = rawSkills
    ? rawSkills
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 8)
    : [];

  const displayName = personal.name || user?.name || "Candidate";
  const displayEmail = personal.email || user?.email || "";
  const displaySummary =
    generatedContent?.summary ||
    professional.objective ||
    "Professional profile configured for career tracking and applications.";

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        {/* Welcome Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 bg-primary text-white p-4 rounded-3 shadow-sm">
          <div>
            <h2 className="fw-bold mb-1">Welcome, {displayName} 👋</h2>
            <p className="mb-0 text-white-50">
              {professional.careerField ? `Industry: ${professional.careerField}` : "Multi-Disciplinary Career Platform"}
              {professional.targetRole ? ` • Target Role: ${professional.targetRole}` : ""}
            </p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button
              className="btn btn-light fw-bold text-primary shadow-sm"
              onClick={() => navigate("/resume-selection")}
            >
              📄 Update Resume
            </button>
            <button
              className="btn btn-outline-light fw-bold shadow-sm"
              onClick={() => navigate("/add-job")}
            >
              + Add Application
            </button>
          </div>
        </div>

        {/* Live Application Metrics */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 border-start border-4 border-primary p-3 bg-white">
              <span className="text-muted small fw-bold">TOTAL JOBS</span>
              <h3 className="fw-bold text-primary mb-0 mt-1">
                {loading ? "..." : stats.total}
              </h3>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 border-start border-4 border-info p-3 bg-white">
              <span className="text-muted small fw-bold">APPLIED</span>
              <h3 className="fw-bold text-info mb-0 mt-1">
                {loading ? "..." : stats.applied}
              </h3>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 border-start border-4 border-warning p-3 bg-white">
              <span className="text-muted small fw-bold">INTERVIEW</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">
                {loading ? "..." : stats.interview}
              </h3>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 border-start border-4 border-success p-3 bg-white">
              <span className="text-muted small fw-bold">OFFER / SELECTED</span>
              <h3 className="fw-bold text-success mb-0 mt-1">
                {loading ? "..." : stats.selected}
              </h3>
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout: Left Content & Right Resume Section */}
        <div className="row g-4">
          {/* Left / Main Content Area */}
          <div className="col-lg-8">
            <div className="row g-4">
              {/* Combined 💼 Jobs Section */}
              <div className="col-12">
                <div className="card shadow-sm border-0 p-4 bg-white hover-shadow border-start border-4 border-primary">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <span className="fs-3 me-2">💼</span>
                        <h4 className="fw-bold text-dark mb-0">Jobs</h4>
                      </div>
                      <p className="text-muted small mb-0">
                        Discover new opportunities and track your job applications in one place.
                      </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary fw-semibold px-3 shadow-sm"
                        onClick={() => navigate("/job-tracker")}
                      >
                        📂 Job Tracker
                      </button>
                      <button
                        className="btn btn-outline-primary fw-semibold px-3"
                        onClick={() => navigate("/external-jobs")}
                      >
                        🌐 Find External Jobs
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Cover Letter Generator */}
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100 p-4 bg-white hover-shadow d-flex flex-column">
                  <div className="fs-2 mb-2">✉️</div>
                  <h5 className="fw-bold text-dark">Cover Letter</h5>
                  <p className="text-muted small flex-grow-1">
                    Generate tailored, persuasive cover letters matching specific companies and job descriptions.
                  </p>
                  <button
                    className="btn btn-primary w-100 fw-semibold mt-auto"
                    onClick={() => navigate("/cover-letter")}
                  >
                    Generate Letter
                  </button>
                </div>
              </div>

              {/* Career Roadmap */}
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100 p-4 bg-white hover-shadow d-flex flex-column">
                  <div className="fs-2 mb-2">🗺️</div>
                  <h5 className="fw-bold text-dark">Career Roadmap</h5>
                  <p className="text-muted small flex-grow-1">
                    Generate personalized milestone stages, learning paths, and goals tailored to your dream career.
                  </p>
                  <button
                    className="btn btn-primary w-100 fw-semibold mt-auto"
                    onClick={() => navigate("/career-roadmap")}
                  >
                    View Roadmap
                  </button>
                </div>
              </div>

              {/* Skill Gap */}
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100 p-4 bg-white hover-shadow d-flex flex-column">
                  <div className="fs-2 mb-2">📈</div>
                  <h5 className="fw-bold text-dark">Skill Gap Analyzer</h5>
                  <p className="text-muted small flex-grow-1">
                    Analyze your current skills against target role benchmarks to pinpoint critical missing competencies.
                  </p>
                  <button
                    className="btn btn-primary w-100 fw-semibold mt-auto"
                    onClick={() => navigate("/skill-gap")}
                  >
                    Analyze Skills
                  </button>
                </div>
              </div>

              {/* Interview Questions */}
              <div className="col-md-6">
                <div className="card shadow-sm border-0 h-100 p-4 bg-white hover-shadow d-flex flex-column">
                  <div className="fs-2 mb-2">💬</div>
                  <h5 className="fw-bold text-dark">Interview Questions</h5>
                  <p className="text-muted small flex-grow-1">
                    Practice high-yield Technical, Behavioral (STAR), and System Design questions with model answers.
                  </p>
                  <button
                    className="btn btn-primary w-100 fw-semibold mt-auto"
                    onClick={() => navigate("/interview-questions")}
                  >
                    Start Practice
                  </button>
                </div>
              </div>

              {/* User Profile */}
              <div className="col-12">
                <div className="card shadow-sm border-0 p-4 bg-white hover-shadow d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <div className="d-flex align-items-center mb-1">
                      <span className="fs-3 me-2">👤</span>
                      <h5 className="fw-bold text-dark mb-0">User Profile</h5>
                    </div>
                    <p className="text-muted small mb-0">
                      Manage your account credentials, contact information, and location preferences.
                    </p>
                  </div>
                  <button
                    className="btn btn-outline-primary fw-semibold px-4 text-nowrap"
                    onClick={() => navigate("/profile")}
                  >
                    Manage Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated "My Resume" Section */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 h-100 bg-white d-flex flex-column p-4 sticky-top" style={{ top: "80px", zIndex: 10 }}>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center">
                  <span className="fs-4 me-2">📄</span>
                  <h5 className="fw-bold text-dark mb-0">My Resume</h5>
                </div>
                {hasCompletedResume && (
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 small">
                    {selectedTemplate || "Professional"}
                  </span>
                )}
              </div>

              {hasCompletedResume ? (
                /* Compact Professional Resume Visual Preview Card */
                <div className="d-flex flex-column flex-grow-1">
                  <div className="p-3 bg-light rounded-3 border mb-3 flex-grow-1">
                    {/* Header in Preview */}
                    <div className="border-bottom pb-2 mb-2">
                      <h6 className="fw-bold text-primary mb-0">{displayName}</h6>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {displayEmail}
                        {personal.city && ` • ${personal.city}`}
                        {personal.phone && ` • ${personal.phone}`}
                      </div>
                    </div>

                    {/* Summary in Preview */}
                    <div className="mb-2">
                      <span className="text-dark fw-bold text-uppercase d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                        Summary
                      </span>
                      <p className="text-secondary mb-0" style={{ fontSize: "0.78rem", lineHeight: "1.4" }}>
                        {displaySummary.length > 150 ? `${displaySummary.substring(0, 150)}...` : displaySummary}
                      </p>
                    </div>

                    {/* Education in Preview */}
                    {professional.education && (
                      <div className="mb-2 border-top pt-2">
                        <span className="text-dark fw-bold text-uppercase d-block" style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                          Education
                        </span>
                        <p className="text-secondary mb-0" style={{ fontSize: "0.75rem", whiteSpace: "pre-line" }}>
                          {professional.education.split("\n")[0]}
                        </p>
                      </div>
                    )}

                    {/* Skills Pills in Preview */}
                    {skillsList.length > 0 && (
                      <div className="border-top pt-2">
                        <span className="text-dark fw-bold text-uppercase d-block mb-1" style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                          Core Skills
                        </span>
                        <div className="d-flex flex-wrap gap-1">
                          {skillsList.map((skill, idx) => (
                            <span
                              key={idx}
                              className="badge bg-white text-dark border px-2 py-1"
                              style={{ fontSize: "0.68rem" }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-column gap-2 mt-auto">
                    <button
                      className="btn btn-outline-primary btn-sm fw-semibold w-100"
                      onClick={() => navigate("/resume-preview")}
                    >
                      👁️ Full Preview & PDF
                    </button>
                    <button
                      className="btn btn-primary btn-sm fw-bold w-100 shadow-sm"
                      onClick={() => navigate("/resume-selection")}
                    >
                      ✏️ Update Resume
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Resume State */
                <div className="text-center py-5 my-auto">
                  <div className="fs-1 mb-2 text-muted">📄</div>
                  <h6 className="fw-bold text-dark">No resume created yet.</h6>
                  <p className="text-muted small mb-4">
                    Build an ATS-optimized resume in minutes with Gemini AI.
                  </p>
                  <button
                    className="btn btn-primary fw-semibold px-4 shadow-sm"
                    onClick={() => navigate("/resume-selection")}
                  >
                    Build Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Applications Section */}
        <div className="card shadow-sm border-0 p-4 mt-5 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">📋 Recent Applications</h5>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => navigate("/job-tracker")}
            >
              View All →
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-4 text-center text-muted">
              No recent job applications. Click <strong>+ Add Application</strong> above to start tracking.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="fw-bold">{job.company_name || job.company}</td>
                      <td>{job.job_role || job.position}</td>
                      <td>
                        {job.application_date
                          ? new Date(job.application_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span className="badge bg-primary px-3 py-2">{job.status}</span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/job-details/${job.id}`)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Dashboard;
