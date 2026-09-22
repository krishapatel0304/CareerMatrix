import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { ResumeContext } from "../context/ResumeContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser } = useContext(UserContext);
  const { hasCompletedResume } = useContext(ResumeContext);

  const handleLogout = (e) => {
    e.preventDefault();
    logoutUser();
    navigate("/");
  };

  const isActive = (path) => (location.pathname.startsWith(path) ? "active fw-bold" : "");

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center" to={hasCompletedResume ? "/dashboard" : "/resume-selection"}>
          <span className="me-2">⚡</span> CareerMatrix
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          <div className="navbar-nav ms-auto align-items-lg-center">
            {hasCompletedResume ? (
              <>
                <Link className={`nav-link ${location.pathname === "/dashboard" ? "active fw-bold" : ""}`} to="/dashboard">
                  Dashboard
                </Link>

                <Link className={`nav-link ${isActive("/resume") || isActive("/template") || isActive("/upload-resume")}`} to="/resume-selection">
                  Resume Builder
                </Link>

                <Link className={`nav-link ${isActive("/job-tracker") || isActive("/add-job") || isActive("/job-details")}`} to="/job-tracker">
                  Job Tracker
                </Link>

                <Link className={`nav-link ${isActive("/external-jobs")}`} to="/external-jobs">
                  External Jobs
                </Link>

                <Link className={`nav-link ${isActive("/cover-letter")}`} to="/cover-letter">
                  Cover Letter
                </Link>

                <Link className={`nav-link ${isActive("/career-roadmap")}`} to="/career-roadmap">
                  Roadmap
                </Link>

                <Link className={`nav-link ${isActive("/skill-gap")}`} to="/skill-gap">
                  Skill Gap
                </Link>

                <Link className={`nav-link ${isActive("/interview-questions")}`} to="/interview-questions">
                  Interview Prep
                </Link>

                <Link className={`nav-link ${isActive("/profile")}`} to="/profile">
                  Profile
                </Link>
              </>
            ) : (
              <span className="badge bg-light text-primary me-lg-3 px-3 py-2 fw-semibold">
                📝 Initial Resume Setup
              </span>
            )}

            {user && (
              <span className="navbar-text ms-lg-2 me-lg-2 text-white-50 small">
                Hi, {user.name?.split(" ")[0]}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm ms-lg-2 mt-2 mt-lg-0 fw-semibold"
            >
              Logout 🚪
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;