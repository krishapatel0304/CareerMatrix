import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ResumeContext } from "../../context/ResumeContext";
import ResumeNavbar from "../../components/ResumeNavbar";
import Footer from "../../components/Footer";

function TemplateGallery() {
  const navigate = useNavigate();
  const { selectedTemplate, setSelectedTemplate, resumeData } = useContext(ResumeContext);

  const templates = [
    {
      id: "Professional",
      title: "Professional",
      badge: "Most Popular",
      badgeClass: "bg-primary",
      desc: "Classic navy accents with clean ATS-friendly single column structure.",
      previewStyle: { borderTop: "4px solid #0d6efd" },
    },
    {
      id: "Modern",
      title: "Modern",
      badge: "Two-Column",
      badgeClass: "bg-dark",
      desc: "Deep slate sidebar with clean right content column for modern tech roles.",
      previewStyle: { background: "linear-gradient(to right, #1e293b 35%, #f8fafc 35%)" },
    },
    {
      id: "Minimal",
      title: "Minimal",
      badge: "Swiss Clean",
      badgeClass: "bg-secondary",
      desc: "Generous whitespace, elegant monochrome typography, and distraction-free layout.",
      previewStyle: { border: "1px solid #e5e7eb", background: "#ffffff" },
    },
    {
      id: "Creative",
      title: "Creative",
      badge: "Design & Tech",
      badgeClass: "bg-success",
      desc: "Vibrant teal accents, skill pill tags, and dynamic modern section markers.",
      previewStyle: { borderTop: "4px solid #0d9488" },
    },
    {
      id: "Corporate",
      title: "Corporate",
      badge: "Enterprise",
      badgeClass: "bg-info text-dark",
      desc: "Formal enterprise banner with structured boxed compartments.",
      previewStyle: { borderTop: "4px solid #1e3a8a" },
    },
    {
      id: "Executive",
      title: "Executive",
      badge: "Leadership",
      badgeClass: "bg-warning text-dark",
      desc: "Dark slate header with gold accents and high-impact accomplishment focus.",
      previewStyle: { borderTop: "4px solid #d97706" },
    },
    {
      id: "Elegant",
      title: "Elegant",
      badge: "Serif Classic",
      badgeClass: "bg-danger",
      desc: "Sophisticated serif typography with centered header and delicate horizontal rules.",
      previewStyle: { fontStyle: "italic", borderBottom: "2px solid #2c3e50" },
    },
    {
      id: "Student",
      title: "Student",
      badge: "College / Fresher",
      badgeClass: "bg-primary",
      desc: "Education-first layout with high emphasis on academic projects and coursework.",
      previewStyle: { borderLeft: "4px solid #0d6efd" },
    },
    {
      id: "Blank Template",
      title: "Blank Template",
      badge: "Clean Canvas",
      badgeClass: "bg-secondary",
      desc: "Minimalist open format with clean monospace structure and full flexibility.",
      previewStyle: { border: "1px dashed #6c757d" },
    },
  ];

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    navigate("/resume-step1");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <ResumeNavbar />

      <div className="container py-5 flex-grow-1">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-primary mb-2">🎨 Choose Your Resume Template</h2>
          <p className="text-muted fs-6">
            Select from 9 professionally crafted resume designs tailored for modern applicant tracking systems
          </p>
        </div>

        <div className="row g-4">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            return (
              <div className="col-md-6 col-lg-4" key={tpl.id}>
                <div className={`card shadow-sm border-0 h-100 d-flex flex-column ${isSelected ? "ring-2 border border-2 border-primary" : ""}`}>
                  <div
                    className="p-4 d-flex flex-column justify-content-between align-items-center text-center bg-light rounded-top"
                    style={{ height: "180px", ...tpl.previewStyle }}
                  >
                    <span className={`badge ${tpl.badgeClass} px-3 py-1 mb-2`}>
                      {tpl.badge}
                    </span>
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{tpl.title}</h4>
                      {isSelected && <span className="badge bg-success small">✓ Currently Active</span>}
                    </div>
                    <div className="small text-muted">A4 Optimized Layout</div>
                  </div>

                  <div className="card-body d-flex flex-column p-4">
                    <p className="text-secondary small mb-4 flex-grow-1">
                      {tpl.desc}
                    </p>

                    <button
                      className={`btn w-100 fw-bold ${isSelected ? "btn-success" : "btn-primary"}`}
                      onClick={() => handleSelectTemplate(tpl.id)}
                    >
                      {isSelected ? "Continue with " + tpl.title : "Use Template →"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default TemplateGallery;