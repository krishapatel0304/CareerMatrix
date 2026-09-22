import { useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { ResumeContext } from "../../context/ResumeContext";
import ResumeNavbar from "../../components/ResumeNavbar";
import Footer from "../../components/Footer";

function ResumeStep1() {
  const navigate = useNavigate();
  const { resumeData, updatePersonal, selectedTemplate } = useContext(ResumeContext);

  const personal = resumeData.personal || {};

  const handleNext = (e) => {
    e.preventDefault();
    navigate("/resume-step2");
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
                <span className="badge bg-primary px-3 py-2 mb-1">Step 1 of 2: Personal Information</span>
                <h2 className="fw-bold text-dark mb-0">Build Your Resume</h2>
              </div>
              <div className="text-end">
                <span className="text-muted small d-block">Template:</span>
                <span className="badge bg-light text-primary border px-2 py-1 me-2">{selectedTemplate}</span>
                <Link to="/templates" className="small text-decoration-none">
                  Change
                </Link>
              </div>
            </div>

            <div className="card shadow-sm border-0 p-4 p-md-5">
              <form onSubmit={handleNext}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Doe"
                      value={personal.name || ""}
                      onChange={(e) => updatePersonal("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. john.doe@email.com"
                      value={personal.email || ""}
                      onChange={(e) => updatePersonal("email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. +1 (555) 000-1234 or +91 9876543210"
                      value={personal.phone || ""}
                      onChange={(e) => updatePersonal("phone", e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City, State / Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. San Francisco, CA / Bengaluru, KA"
                      value={personal.city || ""}
                      onChange={(e) => updatePersonal("city", e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. linkedin.com/in/johndoe"
                      value={personal.linkedin || ""}
                      onChange={(e) => updatePersonal("linkedin", e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">GitHub Profile URL (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. github.com/johndoe"
                      value={personal.github || ""}
                      onChange={(e) => updatePersonal("github", e.target.value)}
                    />
                  </div>

                  <div className="col-12 d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate("/templates")}
                    >
                      ← Back to Templates
                    </button>
                    <button type="submit" className="btn btn-primary px-4 fw-bold">
                      Continue to Step 2 →
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ResumeStep1;