import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ResumeNavbar from "../../components/ResumeNavbar";
import Footer from "../../components/Footer";
import { ResumeContext } from "../../context/ResumeContext";
import { uploadResumeFile } from "../../services/resumeService";

function UploadResume() {
  const navigate = useNavigate();
  const { setResumeData, setGeneratedContent, setHasCompletedResume, saveResumeToDb } = useContext(ResumeContext);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return "Please choose a file to upload.";
    const validExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    if (!isValidExt) {
      return "Supported formats are PDF, DOC, DOCX, and TXT.";
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB.";
    }
    return "";
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError("");
    if (selected) {
      const err = validateFile(selected);
      if (err) {
        setError(err);
        setFile(null);
      } else {
        setFile(selected);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setError("");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      const err = validateFile(selected);
      if (err) {
        setError(err);
      } else {
        setFile(selected);
      }
    }
  };

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a resume file to upload.");
      return;
    }

    setLoading(true);
    try {
      const response = await uploadResumeFile(file);
      if (response.data) {
        const { personal, professional } = response.data;
        const newResumeData = {
          personal: personal || {},
          professional: professional || {},
        };
        setResumeData(newResumeData);
        setGeneratedContent(null);
        setHasCompletedResume(true);

        try {
          await saveResumeToDb({
            template: "Professional",
            personal: newResumeData.personal,
            professional: newResumeData.professional,
            generatedContent: null,
          });
        } catch (saveErr) {
          console.warn("Could not auto-save uploaded resume:", saveErr.message);
        }

        navigate("/resume-preview");
      } else {
        setError("Could not extract data from the uploaded file.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload and parse resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <ResumeNavbar />

      <div className="container py-5 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <div className="card shadow-sm border-0 p-4 p-md-5" style={{ maxWidth: "650px", width: "100%" }}>
          <div className="text-center mb-4">
            <span className="fs-1 d-block mb-2">📂</span>
            <h2 className="fw-bold text-primary mb-1">Upload Existing Resume</h2>
            <p className="text-muted small">
              Upload your PDF or DOCX file to automatically extract personal details, work experience, and skills.
            </p>
          </div>

          {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

          {/* Drag & Drop Zone */}
          <div
            className={`border border-2 border-dashed rounded-3 p-4 text-center mb-4 ${
              dragOver ? "border-primary bg-primary bg-opacity-10" : "border-secondary bg-light"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ cursor: "pointer" }}
            onClick={() => document.getElementById("resumeFileInput").click()}
          >
            <input
              id="resumeFileInput"
              type="file"
              className="d-none"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
            <div className="fs-2 mb-2">📥</div>
            <h6 className="fw-bold mb-1">
              {file ? file.name : "Drag and drop your resume here"}
            </h6>
            <p className="text-muted small mb-0">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports PDF, DOC, DOCX up to 10MB"}
            </p>
          </div>

          <div className="d-grid gap-2">
            <button
              className="btn btn-primary btn-lg fw-bold"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Extracting & Parsing with AI...
                </>
              ) : (
                "Upload & Preview Resume →"
              )}
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/resume-selection")}
              disabled={loading}
            >
              ← Back to Options
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default UploadResume;