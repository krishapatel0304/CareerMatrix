import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import ResumeNavbar from "../../components/ResumeNavbar";
import Footer from "../../components/Footer";
import { ResumeContext } from "../../context/ResumeContext";

function ResumeSelection() {
  const navigate = useNavigate();
  const { hasCompletedResume } = useContext(ResumeContext);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <ResumeNavbar />

      <div className="container py-5 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <div className="text-center mb-5" style={{ maxWidth: "650px" }}>
          <span className="badge bg-primary px-3 py-2 fs-6 mb-3">
            {hasCompletedResume ? "AI Resume Suite" : "Step 1: Resume Setup"}
          </span>
          <h2 className="fw-bold text-dark mb-2">
            {hasCompletedResume
              ? "Manage Your Resume"
              : "Welcome! Let's Set Up Your Resume"}
          </h2>
          <p className="text-muted">
            {hasCompletedResume
              ? "Choose whether to upload a new resume file or generate an updated ATS-optimized resume using Gemini AI."
              : "To personalize your job tracking and career recommendations, please choose how you would like to create your initial resume."}
          </p>
        </div>

        <div className="row g-4 w-100 justify-content-center" style={{ maxWidth: "900px" }}>
          {/* Option 1: Upload Existing */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100 p-4 text-center hover-shadow bg-white">
              <div className="fs-1 mb-3">📄</div>
              <h4 className="fw-bold text-primary mb-2">Upload Existing Resume</h4>
              <p className="text-muted small mb-4 flex-grow-1">
                Upload your existing resume in PDF or DOCX format. We will automatically parse and extract your contact details, education, skills, and experience.
              </p>
              <button
                className="btn btn-outline-primary btn-lg fw-semibold w-100"
                onClick={() => navigate("/upload-resume")}
              >
                Upload File →
              </button>
            </div>
          </div>

          {/* Option 2: Create Resume with AI */}
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100 p-4 text-center border-primary border-2 hover-shadow bg-white">
              <div className="fs-1 mb-3">✨</div>
              <h4 className="fw-bold text-success mb-2">Create Resume with AI</h4>
              <p className="text-muted small mb-4 flex-grow-1">
                Fill in your background details, choose from 9 executive templates, and let Gemini AI enhance your bullet points, summaries, and skills structure.
              </p>
              <button
                className="btn btn-success btn-lg fw-semibold w-100 shadow-sm"
                onClick={() => navigate("/templates")}
              >
                Start AI Builder →
              </button>
            </div>
          </div>
        </div>

        {/* If returning user, show quick options to view existing resume or return to dashboard */}
        {hasCompletedResume && (
          <div className="d-flex gap-3 justify-content-center mt-5">
            <button
              className="btn btn-outline-secondary px-4 fw-semibold"
              onClick={() => navigate("/resume-preview")}
            >
              👁️ View Current Resume Preview
            </button>
            <button
              className="btn btn-primary px-4 fw-bold shadow-sm"
              onClick={() => navigate("/dashboard")}
            >
              Continue to Dashboard →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ResumeSelection;