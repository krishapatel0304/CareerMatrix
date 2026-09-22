function Template8({ resumeData, generatedContent }) {
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
          title: lines[0] || `Academic Project ${i + 1}`,
          techStack: "",
          bullets: lines.slice(1).length > 0 ? lines.slice(1) : [lines[0]],
        };
      })
    : []);

  const experiences = generatedContent?.experience || (professional.experience
    ? [
        {
          role: "Internship / Practical Experience",
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
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Student Top Header */}
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 border-primary pb-3 mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-0">{personal.name || "Student Name"}</h2>
          <span className="text-muted small">Aspiring Software Engineer / Graduate</span>
        </div>
        <div className="text-end small text-secondary">
          {personal.email && <div>{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.city && <div>{personal.city}</div>}
          <div className="d-flex gap-2 justify-content-end mt-1">
            {personal.linkedin && (
              <a href={personal.linkedin.startsWith("http") ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                LinkedIn
              </a>
            )}
            {personal.github && (
              <a href={personal.github.startsWith("http") ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Objective */}
      {summary && (
        <section className="mb-4">
          <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
            Career Objective
          </h6>
          <p className="text-secondary small mb-0">{summary}</p>
        </section>
      )}

      {/* Education First for Students */}
      {educationList.length > 0 && (
        <section className="mb-4">
          <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
            🎓 Education & Academic Background
          </h6>
          {educationList.map((edu, idx) => (
            <div key={idx} className="mb-2">
              <div className="d-flex justify-content-between">
                <strong className="text-dark small">{edu.degree}</strong>
                <span className="text-muted small">{edu.year}</span>
              </div>
              {edu.institution && <div className="text-primary small fw-semibold">{edu.institution}</div>}
              {edu.details && <p className="text-secondary small mb-0">{edu.details}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Technical Skills */}
      {skillsList.length > 0 && (
        <section className="mb-4">
          <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
            🛠️ Technical Skills & Coursework
          </h6>
          <div className="d-flex flex-wrap gap-1">
            {skillsList.map((skill, idx) => (
              <span key={idx} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 small fw-normal">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Academic & Personal Projects */}
      {projects.length > 0 && (
        <section className="mb-4">
          <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
            🚀 Academic & Personal Projects
          </h6>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-3">
              <div className="d-flex justify-content-between align-items-baseline">
                <strong className="text-dark small">{proj.title}</strong>
                {proj.techStack && <span className="badge bg-light text-secondary border small">{proj.techStack}</span>}
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

      {/* Experience / Internships */}
      {experiences.length > 0 && (
        <section className="mb-4">
          <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
            💼 Internships & Practical Experience
          </h6>
          {experiences.map((exp, idx) => (
            <div key={idx} className="mb-2">
              <div className="d-flex justify-content-between">
                <strong className="text-dark small">{exp.role}</strong>
                <span className="text-muted small">{exp.duration}</span>
              </div>
              {exp.company && <div className="text-muted small">{exp.company}</div>}
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

      {/* Certifications & Extracurricular */}
      {(certifications.length > 0 || languages.length > 0) && (
        <div className="row g-3">
          {certifications.length > 0 && (
            <div className="col-md-6">
              <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
                📜 Certifications & Honors
              </h6>
              <ul className="small text-secondary ps-3 mb-0">
                {certifications.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {languages.length > 0 && (
            <div className="col-md-6">
              <h6 className="fw-bold text-primary text-uppercase border-bottom pb-1 mb-2 small">
                🌐 Languages
              </h6>
              <p className="small text-secondary mb-0">{languages.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Template8;
