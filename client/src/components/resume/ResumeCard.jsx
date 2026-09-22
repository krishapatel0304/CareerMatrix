import { useNavigate } from "react-router-dom";

function ResumeCard({ template = "Professional", updatedAt }) {
  const navigate = useNavigate();

  return (
    <div className="card shadow-sm border-0 p-4 bg-white">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">📄 Saved Resume</h5>
        <span className="badge bg-primary">{template}</span>
      </div>
      <p className="text-muted small mb-3">
        {updatedAt ? `Last modified: ${new Date(updatedAt).toLocaleDateString()}` : "Ready to view and download."}
      </p>
      <div className="d-flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => navigate("/resume-preview")}>
          Preview Resume
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/resume-step1")}>
          Edit Details
        </button>
      </div>
    </div>
  );
}

export default ResumeCard;
