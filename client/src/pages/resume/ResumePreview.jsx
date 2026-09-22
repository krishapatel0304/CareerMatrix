import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResumeContext } from "../../context/ResumeContext";
import ResumeNavbar from "../../components/ResumeNavbar";
import Footer from "../../components/Footer";
import { generateResumeAI } from "../../services/resumeService";

// 9 Templates
import Template1 from "../../components/resume/Template1";
import Template2 from "../../components/resume/Template2";
import Template3 from "../../components/resume/Template3";
import Template4 from "../../components/resume/Template4";
import Template5 from "../../components/resume/Template5";
import Template6 from "../../components/resume/Template6";
import Template7 from "../../components/resume/Template7";
import Template8 from "../../components/resume/Template8";
import Template9 from "../../components/resume/Template9";

function ResumePreview() {
  const navigate = useNavigate();
  const {
    resumeData,
    generatedContent,
    setGeneratedContent,
    selectedTemplate,
    setSelectedTemplate,
    saveResumeToDb,
    savedSuccess,
    setHasCompletedResume,
  } = useContext(ResumeContext);

  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setHasCompletedResume(true);
    localStorage.setItem("hasCompletedResume", "true");
  }, [setHasCompletedResume]);

  const templatesList = [
    "Professional",
    "Modern",
    "Minimal",
    "Creative",
    "Corporate",
    "Executive",
    "Elegant",
    "Student",
    "Blank Template",
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMsg("");
      setError("");
      await saveResumeToDb();
      localStorage.setItem("hasCompletedResume", "true");
      setSaveMsg("Resume saved to your account in PostgreSQL!");
      setTimeout(() => setSaveMsg(""), 3500);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save resume. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateAI = async () => {
    try {
      setRegenerating(true);
      setSaveMsg("");
      setError("");

      const effectiveCareerField = resumeData.professional?.careerField === "Other"
        ? (resumeData.professional?.customField || "Other Discipline")
        : (resumeData.professional?.careerField || "");

      const response = await generateResumeAI({
        careerField: effectiveCareerField,
        personal: resumeData.personal,
        professional: resumeData.professional,
        template: selectedTemplate,
        isRegenerate: true,
      });

      if (response.generatedContent) {
        setGeneratedContent(response.generatedContent);
        // Persist updated AI content to database
        try {
          await saveResumeToDb({
            template: selectedTemplate,
            personal: resumeData.personal,
            professional: resumeData.professional,
            generatedContent: response.generatedContent,
          });
        } catch (dbErr) {
          console.warn("Could not auto-save after regeneration:", dbErr.message);
        }
        setSaveMsg("✨ Fresh AI resume content generated and saved!");
        setTimeout(() => setSaveMsg(""), 3500);
      } else {
        setError("Unable to generate AI content. Please try again.");
      }
    } catch (err) {
      console.error("Regenerate AI resume error:", err);
      setError("Unable to generate AI content. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleContinueToDashboard = async () => {
    try {
      await saveResumeToDb();
    } catch (e) {
      console.warn("Could not save before continuing to dashboard:", e.message);
    }
    localStorage.setItem("hasCompletedResume", "true");
    setHasCompletedResume(true);
    navigate("/dashboard");
  };

  const handlePrint = () => {
    window.print();
  };

  const renderActiveTemplate = () => {
    const props = { resumeData, generatedContent };
    switch (selectedTemplate) {
      case "Modern":
        return <Template2 {...props} />;
      case "Minimal":
        return <Template3 {...props} />;
      case "Creative":
        return <Template4 {...props} />;
      case "Corporate":
        return <Template5 {...props} />;
      case "Executive":
        return <Template6 {...props} />;
      case "Elegant":
        return <Template7 {...props} />;
      case "Student":
        return <Template8 {...props} />;
      case "Blank Template":
        return <Template9 {...props} />;
      case "Professional":
      default:
        return <Template1 {...props} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <div className="d-print-none">
        <ResumeNavbar />
      </div>

      <div className="container py-4 flex-grow-1">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="d-print-none card shadow-sm border-0 p-3 mb-4 bg-white sticky-top" style={{ top: "10px", zIndex: 100 }}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h4 className="fw-bold text-primary mb-1">📄 Resume Preview & Completion</h4>
              <p className="text-muted small mb-0">
                Active Template: <strong className="text-dark">{selectedTemplate}</strong> {generatedContent && <span className="badge bg-success small ms-2">✨ AI Enhanced</span>}
              </p>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Template Switcher Dropdown */}
              <div className="d-flex align-items-center me-2">
                <label className="small fw-semibold me-2 text-nowrap">Template:</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ width: "160px" }}
                  disabled={regenerating || saving}
                >
                  {templatesList.map((tpl) => (
                    <option key={tpl} value={tpl}>
                      {tpl}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate("/resume-step1")}
                title="Edit Resume Details"
                disabled={regenerating || saving}
              >
                ✏️ Edit
              </button>

              <button
                className="btn btn-sm btn-outline-primary fw-semibold"
                onClick={handleRegenerateAI}
                disabled={regenerating || saving}
                title="Generate fresh alternative AI phrasing & structure"
              >
                {regenerating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Regenerating...
                  </>
                ) : (
                  "🔄 Regenerate AI"
                )}
              </button>

              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleSave}
                disabled={saving || regenerating}
                title="Save to PostgreSQL"
              >
                {saving ? "Saving..." : savedSuccess || saveMsg.includes("saved") ? "✅ Saved" : "💾 Save Resume"}
              </button>

              <button
                className="btn btn-sm btn-outline-success fw-semibold"
                onClick={handlePrint}
                title="Download / Print PDF"
                disabled={regenerating || saving}
              >
                🖨️ Download PDF
              </button>

              <button
                className="btn btn-sm btn-success fw-bold px-3 shadow-sm"
                onClick={handleContinueToDashboard}
                disabled={regenerating || saving}
              >
                Continue to Dashboard →
              </button>
            </div>
          </div>

          {saveMsg && (
            <div className="alert alert-success py-1 px-3 mt-2 mb-0 small text-center shadow-sm">
              {saveMsg}
            </div>
          )}
          {error && (
            <div className="alert alert-danger py-1 px-3 mt-2 mb-0 small text-center shadow-sm">
              {error}
            </div>
          )}
        </div>

        {/* Resume Preview Paper Display */}
        <div className="d-flex justify-content-center mb-5">
          <div className="w-100" style={{ maxWidth: "850px" }}>
            {renderActiveTemplate()}
          </div>
        </div>
      </div>

      <div className="d-print-none">
        <Footer />
      </div>
    </div>
  );
}

export default ResumePreview;