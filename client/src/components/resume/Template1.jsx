function Template1({ resumeData, generatedContent }) {
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
          role: "Professional Experience",
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
      className="bg-white shadow-sm rounded-1 p-5 mx-auto print-resume text-dark text-start"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        lineHeight: "1.5",
      }}
    >
      {/* Header */}
      <div className="border-bottom border-3 border-primary pb-3 mb-4 text-center">
        <h1 className="fw-bold text-primary mb-1 text-uppercase tracking-wide" style={{ letterSpacing: "1px" }}>
          {personal.name || "Full Name"}
        </h1>
        <div className="d-flex flex-wrap justify-content-center gap-3 text-muted small mt-2">
          {personal.email && <span>✉️ {personal.email}</span>}
          {personal.phone && <span>📞 {personal.phone}</span>}
          {personal.city && <span>📍 {personal.city}</span>}
          {personal.linkedin && (
            <span>
              🔗 <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-decoration-none text-muted">LinkedIn</a>
            </span>
          )}
          {personal.github && (
            <span>
              💻 <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-decoration-none text-muted">GitHub</a>
            </span>
          )}
        </div>
      </div>

      {/* Summary / Objective */}
      {summary && (
        <section className="mb-4">
          <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
            Executive Summary
          </h5>
          <p className="text-secondary small mb-0" style={{ textAlign: "justify" }}>
            {summary}
          </p>
        </section>
      )}

      {/* Technical Skills */}
      {skillsList.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
            Core Competencies & Skills
          </h5>
          <div className="d-flex flex-wrap gap-2">
            {skillsList.map((skill, idx) => (
              <span key={idx} className="badge bg-light text-dark border px-2 py-1 small fw-normal">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
            Work Experience
          </h5>
          {experiences.map((exp, idx) => (
            <div key={idx} className="mb-3">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark">{exp.role}</strong>
                <span className="text-muted small fst-italic">{exp.duration}</span>
              </div>
              {exp.company && <div className="text-primary small fw-semibold mb-1">{exp.company}</div>}
              {exp.bullets && exp.bullets.length > 0 && (
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
          <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
            Key Projects
          </h5>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-3">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark">{proj.title}</strong>
                {proj.techStack && <span className="badge bg-light text-primary border small">{proj.techStack}</span>}
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

      {/* Education */}
      {educationList.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
            Education
          </h5>
          {educationList.map((edu, idx) => (
            <div key={idx} className="mb-2">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark">{edu.degree}</strong>
                <span className="text-muted small">{edu.year}</span>
              </div>
              {edu.institution && <div className="text-muted small">{edu.institution}</div>}
              {edu.details && edu.details !== edu.degree && (
                <p className="text-secondary small mb-0">{edu.details}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications & Languages */}
      <div className="row g-3">
        {certifications.length > 0 && (
          <div className="col-md-6">
            <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
              Certifications
            </h5>
            <ul className="small text-secondary ps-3 mb-0">
              {certifications.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {languages.length > 0 && (
          <div className="col-md-6">
            <h5 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 fs-6">
              Languages
            </h5>
            <p className="small text-secondary mb-0">
              {languages.join(" • ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Template1;