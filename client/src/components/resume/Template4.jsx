function Template4({ resumeData, generatedContent }) {
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
      className="bg-white shadow-sm rounded-2 p-5 mx-auto print-resume text-dark text-start"
      style={{
        maxWidth: "850px",
        minHeight: "1050px",
        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      }}
    >
      {/* Creative Header Banner */}
      <div className="p-4 rounded-3 text-white mb-4 shadow-sm" style={{ background: "linear-gradient(135deg, #0d9488 0%, #065f46 100%)" }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div>
            <h2 className="fw-bold mb-1 text-white">{personal.name || "Full Name"}</h2>
            <p className="mb-0 text-white-50 small">✨ Creative & Technical Professional</p>
          </div>
          <div className="text-md-end text-white-50 small mt-2 mt-md-0">
            {personal.email && <div>✉️ {personal.email}</div>}
            {personal.phone && <div>📞 {personal.phone}</div>}
            {personal.city && <div>📍 {personal.city}</div>}
          </div>
        </div>
        {(personal.linkedin || personal.github) && (
          <div className="d-flex gap-3 mt-3 pt-2 border-top border-white border-opacity-25 small">
            {personal.linkedin && (
              <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-white text-decoration-none">
                🔗 LinkedIn
              </a>
            )}
            {personal.github && (
              <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-white text-decoration-none">
                💻 GitHub
              </a>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <section className="mb-4">
          <h5 className="fw-bold text-success text-uppercase fs-6 border-start border-4 border-success ps-2 mb-2">
            Professional Summary
          </h5>
          <p className="text-secondary small mb-0">{summary}</p>
        </section>
      )}

      {/* Skills Pill Badges */}
      {skillsList.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-bold text-success text-uppercase fs-6 border-start border-4 border-success ps-2 mb-2">
            Skills & Superpowers
          </h5>
          <div className="d-flex flex-wrap gap-2">
            {skillsList.map((skill, idx) => (
              <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill small fw-semibold">
                ⚡ {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="mb-4">
          <h5 className="fw-bold text-success text-uppercase fs-6 border-start border-4 border-success ps-2 mb-2">
            Career Experience
          </h5>
          {experiences.map((exp, idx) => (
            <div key={idx} className="mb-3 ps-2 border-start border-2 border-light">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark">{exp.role}</strong>
                <span className="badge bg-light text-muted border small">{exp.duration}</span>
              </div>
              {exp.company && <div className="text-success small fw-semibold mb-1">{exp.company}</div>}
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
          <h5 className="fw-bold text-success text-uppercase fs-6 border-start border-4 border-success ps-2 mb-2">
            Featured Projects
          </h5>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-3 p-3 bg-light rounded-2 border">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark">{proj.title}</strong>
                {proj.techStack && <span className="badge bg-success text-white small">{proj.techStack}</span>}
              </div>
              {proj.bullets && (
                <ul className="mb-0 small text-secondary ps-3 mt-2">
                  {proj.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="mb-1">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education & Certifications */}
      <div className="row g-3">
        {educationList.length > 0 && (
          <div className="col-md-6">
            <h5 className="fw-bold text-success text-uppercase fs-6 border-start border-4 border-success ps-2 mb-2">
              Education
            </h5>
            {educationList.map((edu, idx) => (
              <div key={idx} className="small mb-2">
                <div className="fw-bold">{edu.degree}</div>
                <div className="text-muted">{edu.institution}</div>
              </div>
            ))}
          </div>
        )}
        {(certifications.length > 0 || languages.length > 0) && (
          <div className="col-md-6">
            <h5 className="fw-bold text-success text-uppercase fs-6 border-start border-4 border-success ps-2 mb-2">
              Certificates & Languages
            </h5>
            {certifications.length > 0 && (
              <ul className="small text-secondary ps-3 mb-2">
                {certifications.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            )}
            {languages.length > 0 && (
              <p className="small text-muted mb-0">🗣️ {languages.join(", ")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Template4;
