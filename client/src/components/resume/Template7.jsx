function Template7({ resumeData, generatedContent }) {
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
          role: "Professional Background",
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
      className="bg-white shadow-sm p-5 mx-auto print-resume text-dark text-start"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
        color: "#2c3e50",
      }}
    >
      {/* Centered Elegant Header */}
      <div className="text-center mb-4 pb-3 border-bottom border-dark border-opacity-25">
        <h1 className="fw-normal mb-1 text-dark" style={{ letterSpacing: "2px", fontStyle: "italic", fontSize: "2.3rem" }}>
          {personal.name || "Full Name"}
        </h1>
        <div className="text-muted small mt-2">
          {[personal.email, personal.phone, personal.city].filter(Boolean).join("  ♦  ")}
        </div>
        <div className="d-flex justify-content-center gap-3 small text-muted mt-2">
          {personal.linkedin && (
            <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-secondary text-decoration-none fst-italic">
              LinkedIn
            </a>
          )}
          {personal.github && (
            <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-secondary text-decoration-none fst-italic">
              GitHub
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <section className="mb-4 text-center">
          <p className="fst-italic text-secondary small px-4 mb-0" style={{ lineHeight: "1.7" }}>
            "{summary}"
          </p>
        </section>
      )}

      {/* Skills */}
      {skillsList.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-normal text-dark text-center text-uppercase fs-6 mb-2" style={{ letterSpacing: "1.5px" }}>
            — Areas of Expertise —
          </h5>
          <p className="text-center text-secondary small mb-0">
            {skillsList.join("  •  ")}
          </p>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-normal text-dark text-uppercase fs-6 border-bottom pb-1 mb-3" style={{ letterSpacing: "1.5px" }}>
            Experience
          </h5>
          {experiences.map((exp, idx) => (
            <div key={idx} className="mb-3">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark fst-italic">{exp.role}</strong>
                <span className="text-muted small">{exp.duration}</span>
              </div>
              {exp.company && <div className="text-muted small mb-1">{exp.company}</div>}
              {exp.bullets && (
                <ul className="small text-secondary ps-3 mb-0">
                  {exp.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
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
          <h5 className="fw-normal text-dark text-uppercase fs-6 border-bottom pb-1 mb-3" style={{ letterSpacing: "1.5px" }}>
            Select Projects
          </h5>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-3">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark fst-italic">{proj.title}</strong>
                {proj.techStack && <span className="text-muted small fst-italic">{proj.techStack}</span>}
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
        </section>
      )}

      {/* Education & Certifications */}
      <div className="row g-4">
        {educationList.length > 0 && (
          <div className="col-md-6">
            <h5 className="fw-normal text-dark text-uppercase fs-6 border-bottom pb-1 mb-2" style={{ letterSpacing: "1.5px" }}>
              Education
            </h5>
            {educationList.map((edu, idx) => (
              <div key={idx} className="small mb-2">
                <div className="fw-bold fst-italic">{edu.degree}</div>
                <div className="text-muted">{edu.institution}</div>
              </div>
            ))}
          </div>
        )}

        {(certifications.length > 0 || languages.length > 0) && (
          <div className="col-md-6">
            <h5 className="fw-normal text-dark text-uppercase fs-6 border-bottom pb-1 mb-2" style={{ letterSpacing: "1.5px" }}>
              Distinctions
            </h5>
            {certifications.length > 0 && (
              <ul className="small text-secondary ps-3 mb-1">
                {certifications.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            )}
            {languages.length > 0 && (
              <p className="small text-muted mb-0">Languages: {languages.join(", ")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Template7;
