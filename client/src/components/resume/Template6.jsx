function Template6({ resumeData, generatedContent }) {
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
          role: "Executive Leadership & Experience",
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
      className="bg-white shadow-sm mx-auto print-resume text-dark text-start"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Cinzel', 'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Executive Header */}
      <div className="bg-dark text-white p-4 border-bottom border-warning border-4 text-center">
        <h1 className="fw-bold mb-1 text-uppercase text-light" style={{ letterSpacing: "2px", fontSize: "2rem" }}>
          {personal.name || "Full Name"}
        </h1>
        <div className="text-warning small text-uppercase fw-semibold mb-2" style={{ letterSpacing: "1px" }}>
          Executive Resume & Portfolio
        </div>
        <div className="d-flex flex-wrap justify-content-center gap-3 small text-white-50" style={{ fontFamily: "sans-serif" }}>
          {personal.email && <span>✉️ {personal.email}</span>}
          {personal.phone && <span>📞 {personal.phone}</span>}
          {personal.city && <span>📍 {personal.city}</span>}
          {personal.linkedin && (
            <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-warning text-decoration-none">
              LinkedIn
            </a>
          )}
          {personal.github && (
            <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-warning text-decoration-none">
              GitHub
            </a>
          )}
        </div>
      </div>

      <div className="p-5" style={{ fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
        {/* Executive Summary Callout */}
        {summary && (
          <section className="mb-4 p-3 bg-light rounded border-start border-warning border-4">
            <h6 className="fw-bold text-dark text-uppercase small mb-2">Executive Summary</h6>
            <p className="text-secondary small mb-0 fst-italic" style={{ textAlign: "justify" }}>
              "{summary}"
            </p>
          </section>
        )}

        {/* Core Competencies */}
        {skillsList.length > 0 && (
          <section className="mb-4">
            <h5 className="fw-bold text-dark text-uppercase border-bottom pb-1 mb-2 fs-6">
              Strategic & Technical Competencies
            </h5>
            <div className="d-flex flex-wrap gap-2">
              {skillsList.map((skill, idx) => (
                <span key={idx} className="badge bg-dark text-warning px-3 py-2 small fw-normal">
                  ★ {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <section className="mb-4">
            <h5 className="fw-bold text-dark text-uppercase border-bottom pb-1 mb-2 fs-6">
              Leadership & Experience
            </h5>
            {experiences.map((exp, idx) => (
              <div key={idx} className="mb-3">
                <div className="d-flex justify-content-between align-items-baseline">
                  <strong className="text-dark">{exp.role}</strong>
                  <span className="text-muted small">{exp.duration}</span>
                </div>
                {exp.company && <div className="text-warning text-dark small fw-semibold mb-1">{exp.company}</div>}
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
            <h5 className="fw-bold text-dark text-uppercase border-bottom pb-1 mb-2 fs-6">
              High-Impact Deliverables & Projects
            </h5>
            {projects.map((proj, idx) => (
              <div key={idx} className="mb-3">
                <div className="d-flex justify-content-between align-items-baseline">
                  <strong className="text-dark small">{proj.title}</strong>
                  {proj.techStack && <span className="badge bg-light text-dark border small">{proj.techStack}</span>}
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

        {/* Education & Credentials */}
        <div className="row g-3">
          {educationList.length > 0 && (
            <div className="col-md-6">
              <h5 className="fw-bold text-dark text-uppercase border-bottom pb-1 mb-2 fs-6">
                Education
              </h5>
              {educationList.map((edu, idx) => (
                <div key={idx} className="small mb-2">
                  <div className="fw-bold">{edu.degree}</div>
                  <div className="text-muted">{edu.institution}</div>
                  {edu.year && <div className="text-muted small">{edu.year}</div>}
                </div>
              ))}
            </div>
          )}

          {(certifications.length > 0 || languages.length > 0) && (
            <div className="col-md-6">
              <h5 className="fw-bold text-dark text-uppercase border-bottom pb-1 mb-2 fs-6">
                Credentials & Languages
              </h5>
              {certifications.length > 0 && (
                <ul className="small text-secondary ps-3 mb-2">
                  {certifications.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              )}
              {languages.length > 0 && (
                <p className="small text-muted mb-0">{languages.join(" • ")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Template6;
