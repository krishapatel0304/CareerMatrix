function Template3({ resumeData, generatedContent }) {
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
      className="bg-white shadow-sm p-5 mx-auto print-resume text-dark text-start"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: "#111827",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-light mb-1" style={{ fontSize: "2.5rem", letterSpacing: "-0.5px" }}>
          {personal.name || "Full Name"}
        </h1>
        <p className="text-secondary small mb-3">
          {[personal.email, personal.phone, personal.city].filter(Boolean).join("  /  ")}
        </p>
        <div className="d-flex gap-3 small text-muted">
          {personal.linkedin && (
            <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-dark text-decoration-none border-bottom">
              LinkedIn
            </a>
          )}
          {personal.github && (
            <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-dark text-decoration-none border-bottom">
              GitHub
            </a>
          )}
        </div>
      </div>

      <hr className="my-4" style={{ borderColor: "#e5e7eb" }} />

      {/* Summary */}
      {summary && (
        <div className="row mb-4">
          <div className="col-md-3">
            <span className="text-uppercase small fw-bold text-muted tracking-wider">About</span>
          </div>
          <div className="col-md-9">
            <p className="small text-secondary mb-0 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {/* Skills */}
      {skillsList.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <span className="text-uppercase small fw-bold text-muted tracking-wider">Skills</span>
          </div>
          <div className="col-md-9">
            <p className="small text-dark mb-0">{skillsList.join("  •  ")}</p>
          </div>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <span className="text-uppercase small fw-bold text-muted tracking-wider">Experience</span>
          </div>
          <div className="col-md-9">
            {experiences.map((exp, idx) => (
              <div key={idx} className="mb-3">
                <div className="d-flex justify-content-between">
                  <strong className="small text-dark">{exp.role}</strong>
                  <span className="small text-muted">{exp.duration}</span>
                </div>
                {exp.company && <div className="small text-muted mb-1">{exp.company}</div>}
                {exp.bullets && (
                  <ul className="small text-secondary ps-3 mb-0">
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
        <div className="row mb-4">
          <div className="col-md-3">
            <span className="text-uppercase small fw-bold text-muted tracking-wider">Projects</span>
          </div>
          <div className="col-md-9">
            {projects.map((proj, idx) => (
              <div key={idx} className="mb-3">
                <div className="d-flex justify-content-between">
                  <strong className="small text-dark">{proj.title}</strong>
                  {proj.techStack && <span className="small text-muted">{proj.techStack}</span>}
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

      {/* Education */}
      {educationList.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <span className="text-uppercase small fw-bold text-muted tracking-wider">Education</span>
          </div>
          <div className="col-md-9">
            {educationList.map((edu, idx) => (
              <div key={idx} className="mb-2">
                <div className="d-flex justify-content-between">
                  <strong className="small text-dark">{edu.degree}</strong>
                  <span className="small text-muted">{edu.year}</span>
                </div>
                {edu.institution && <div className="small text-muted">{edu.institution}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications & Languages */}
      {(certifications.length > 0 || languages.length > 0) && (
        <div className="row">
          <div className="col-md-3">
            <span className="text-uppercase small fw-bold text-muted tracking-wider">Additional</span>
          </div>
          <div className="col-md-9 small text-secondary">
            {certifications.length > 0 && <div className="mb-1"><strong>Certifications:</strong> {certifications.join(", ")}</div>}
            {languages.length > 0 && <div><strong>Languages:</strong> {languages.join(", ")}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Template3;
