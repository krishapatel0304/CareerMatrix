function Template2({ resumeData, generatedContent }) {
  const personal = resumeData?.personal || {};
  const professional = resumeData?.professional || {};

  const summary = generatedContent?.summary || professional.objective;
  const skillsList = generatedContent?.skillsFormatted
    ? generatedContent.skillsFormatted.split(",").map((s) => s.trim())
    : (professional.skills || "").split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);

  const projects = generatedContent?.projects || (professional.projects
    ? professional.projects.split("\n\n").map((p, i) => {
        const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
        return {
          title: lines[0] || `Project ${i + 1}`,
          techStack: "",
          bullets: lines.slice(1).length > 0 ? lines.slice(1) : [lines[0]],
        };
      })
    : []);

  const experiences = generatedContent?.experience || (professional.experience
    ? [
        {
          role: "Work Experience",
          company: "",
          duration: "",
          bullets: professional.experience.split("\n").map((l) => l.trim()).filter(Boolean),
        },
      ]
    : []);

  const educationList = generatedContent?.education || (professional.education
    ? [
        {
          degree: professional.education.split("\n")[0] || professional.education,
          institution: professional.education.split("\n")[1] || "",
          year: "",
          details: professional.education,
        },
      ]
    : []);

  const certifications = generatedContent?.certifications || (professional.certifications
    ? professional.certifications.split(/[,;\n]+/).map((c) => c.trim()).filter(Boolean)
    : []);

  const languages = generatedContent?.languages || (professional.languages
    ? professional.languages.split(/[,;\n]+/).map((l) => l.trim()).filter(Boolean)
    : []);

  return (
    <div
      className="bg-white shadow-sm rounded-1 mx-auto print-resume text-dark text-start overflow-hidden"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div className="row g-0 min-vh-100">
        {/* Left Sidebar */}
        <div className="col-4 bg-dark text-white p-4" style={{ backgroundColor: "#1e293b" }}>
          <div className="mb-4">
            <h3 className="fw-bold text-white mb-1">{personal.name || "Full Name"}</h3>
            <span className="badge bg-primary text-white small px-2 py-1">Applicant</span>
          </div>

          {/* Contact */}
          <div className="mb-4 pb-3 border-bottom border-secondary">
            <h6 className="text-uppercase fw-bold text-info small mb-3">Contact</h6>
            <div className="small text-white-50 d-flex flex-column gap-2">
              {personal.email && <div>✉️ {personal.email}</div>}
              {personal.phone && <div>📞 {personal.phone}</div>}
              {personal.city && <div>📍 {personal.city}</div>}
              {personal.linkedin && (
                <div>
                  🔗 <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-info text-decoration-none">LinkedIn</a>
                </div>
              )}
              {personal.github && (
                <div>
                  💻 <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-info text-decoration-none">GitHub</a>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="mb-4 pb-3 border-bottom border-secondary">
              <h6 className="text-uppercase fw-bold text-info small mb-3">Skills & Tools</h6>
              <div className="d-flex flex-wrap gap-1">
                {skillsList.map((skill, idx) => (
                  <span key={idx} className="badge bg-secondary text-white small fw-normal py-1 px-2 mb-1">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education in Sidebar */}
          {educationList.length > 0 && (
            <div className="mb-4 pb-3 border-bottom border-secondary">
              <h6 className="text-uppercase fw-bold text-info small mb-3">Education</h6>
              {educationList.map((edu, idx) => (
                <div key={idx} className="mb-2 small">
                  <div className="fw-bold text-white">{edu.degree}</div>
                  <div className="text-white-50">{edu.institution}</div>
                  {edu.year && <div className="text-info">{edu.year}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="mb-4 pb-3 border-bottom border-secondary">
              <h6 className="text-uppercase fw-bold text-info small mb-3">Certifications</h6>
              <ul className="small text-white-50 ps-3 mb-0">
                {certifications.map((c, idx) => (
                  <li key={idx} className="mb-1">{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div>
              <h6 className="text-uppercase fw-bold text-info small mb-2">Languages</h6>
              <p className="small text-white-50 mb-0">{languages.join(", ")}</p>
            </div>
          )}
        </div>

        {/* Right Main Column */}
        <div className="col-8 p-4 bg-white">
          {/* Executive Summary */}
          {summary && (
            <section className="mb-4">
              <h5 className="fw-bold text-dark text-uppercase border-bottom border-2 border-primary pb-1 mb-2 fs-6">
                Professional Profile
              </h5>
              <p className="text-secondary small mb-0" style={{ textAlign: "justify" }}>
                {summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {experiences.length > 0 && (
            <section className="mb-4">
              <h5 className="fw-bold text-dark text-uppercase border-bottom border-2 border-primary pb-1 mb-2 fs-6">
                Experience
              </h5>
              {experiences.map((exp, idx) => (
                <div key={idx} className="mb-3">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <strong className="text-dark">{exp.role}</strong>
                    <span className="text-muted small">{exp.duration}</span>
                  </div>
                  {exp.company && <div className="text-primary small fw-semibold mb-1">{exp.company}</div>}
                  {exp.bullets && (
                    <ul className="mb-0 small text-secondary ps-3">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="mb-1">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section className="mb-4">
              <h5 className="fw-bold text-dark text-uppercase border-bottom border-2 border-primary pb-1 mb-2 fs-6">
                Featured Projects
              </h5>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <strong className="text-dark small">{proj.title}</strong>
                    {proj.techStack && <span className="badge bg-white text-dark border small">{proj.techStack}</span>}
                  </div>
                  {proj.bullets && (
                    <ul className="mb-0 small text-secondary ps-3 mt-1">
                      {proj.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="mb-1">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Template2;
