function Template5({ resumeData, generatedContent }) {
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
      className="bg-white shadow-sm mx-auto print-resume text-dark text-start border"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Segoe UI', 'Arial', sans-serif",
      }}
    >
      {/* Corporate Top Banner */}
      <div className="bg-primary text-white p-4" style={{ backgroundColor: "#1e3a8a" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h2 className="fw-bold text-white mb-0 text-uppercase" style={{ letterSpacing: "1.5px" }}>
              {personal.name || "Full Name"}
            </h2>
            <span className="small text-white-50">Enterprise Professional Profile</span>
          </div>
          <div className="text-end small text-white-50 mt-2 mt-md-0">
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.city && <div>{personal.city}</div>}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Contact Links Row */}
        {(personal.linkedin || personal.github) && (
          <div className="d-flex gap-4 p-2 mb-4 bg-light rounded border small text-muted">
            {personal.linkedin && (
              <div>
                <strong>LinkedIn:</strong>{" "}
                <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                  {personal.linkedin}
                </a>
              </div>
            )}
            {personal.github && (
              <div>
                <strong>GitHub:</strong>{" "}
                <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                  {personal.github}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="card shadow-none border mb-4 bg-light bg-opacity-25">
            <div className="card-header bg-white py-2 fw-bold text-primary text-uppercase small">
              Executive Profile Summary
            </div>
            <div className="card-body p-3 small text-secondary">
              {summary}
            </div>
          </div>
        )}

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="card shadow-none border mb-4">
            <div className="card-header bg-white py-2 fw-bold text-primary text-uppercase small">
              Technical & Professional Competencies
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-wrap gap-2">
                {skillsList.map((s, idx) => (
                  <span key={idx} className="badge bg-light text-dark border px-2 py-1 small fw-normal">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="card shadow-none border mb-4">
            <div className="card-header bg-white py-2 fw-bold text-primary text-uppercase small">
              Work History
            </div>
            <div className="card-body p-3">
              {experiences.map((exp, idx) => (
                <div key={idx} className="mb-3 border-bottom pb-2">
                  <div className="d-flex justify-content-between">
                    <strong className="text-dark small">{exp.role}</strong>
                    <span className="small text-muted">{exp.duration}</span>
                  </div>
                  {exp.company && <div className="text-primary small fw-semibold">{exp.company}</div>}
                  {exp.bullets && (
                    <ul className="small text-secondary ps-3 mb-0 mt-1">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="card shadow-none border mb-4">
            <div className="card-header bg-white py-2 fw-bold text-primary text-uppercase small">
              Key Projects & Delivery
            </div>
            <div className="card-body p-3">
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <strong className="small text-dark">{proj.title}</strong>
                    {proj.techStack && <span className="badge bg-light text-primary border small">{proj.techStack}</span>}
                  </div>
                  {proj.bullets && (
                    <ul className="small text-secondary ps-3 mb-0 mt-1">
                      {proj.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications Row */}
        <div className="row g-3">
          {educationList.length > 0 && (
            <div className="col-md-6">
              <div className="card shadow-none border h-100">
                <div className="card-header bg-white py-2 fw-bold text-primary text-uppercase small">
                  Education
                </div>
                <div className="card-body p-3 small">
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="fw-bold">{edu.degree}</div>
                      <div className="text-muted">{edu.institution}</div>
                      {edu.year && <div className="text-muted small">{edu.year}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(certifications.length > 0 || languages.length > 0) && (
            <div className="col-md-6">
              <div className="card shadow-none border h-100">
                <div className="card-header bg-white py-2 fw-bold text-primary text-uppercase small">
                  Qualifications & Languages
                </div>
                <div className="card-body p-3 small text-secondary">
                  {certifications.length > 0 && (
                    <div className="mb-2">
                      <strong>Certifications:</strong>
                      <ul className="ps-3 mb-1">
                        {certifications.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {languages.length > 0 && (
                    <div>
                      <strong>Languages:</strong> {languages.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Template5;
