function Template9({ resumeData, generatedContent }) {
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
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* Blank / Clean Canvas Header */}
      <div className="mb-4 pb-2 border-bottom border-2 border-dark">
        <h2 className="fw-bold mb-1">{personal.name || "Candidate Name"}</h2>
        <div className="small text-secondary">
          {[personal.email, personal.phone, personal.city, personal.linkedin, personal.github]
            .filter(Boolean)
            .join(" | ")}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-4">
          <div className="fw-bold text-uppercase small text-dark mb-1">[ 01. SUMMARY ]</div>
          <p className="small text-secondary mb-0">{summary}</p>
        </div>
      )}

      {/* Skills */}
      {skillsList.length > 0 && (
        <div className="mb-4">
          <div className="fw-bold text-uppercase small text-dark mb-1">[ 02. SKILLS ]</div>
          <p className="small text-secondary mb-0">{skillsList.join(", ")}</p>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="mb-4">
          <div className="fw-bold text-uppercase small text-dark mb-1">[ 03. EXPERIENCE ]</div>
          {experiences.map((exp, idx) => (
            <div key={idx} className="mb-2">
              <div className="d-flex justify-content-between small">
                <strong>{exp.role} {exp.company && `@ ${exp.company}`}</strong>
                <span>{exp.duration}</span>
              </div>
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
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-4">
          <div className="fw-bold text-uppercase small text-dark mb-1">[ 04. PROJECTS ]</div>
          {projects.map((proj, idx) => (
            <div key={idx} className="mb-2">
              <div className="small fw-bold">{proj.title} {proj.techStack && `(${proj.techStack})`}</div>
              {proj.bullets && (
                <ul className="small text-secondary ps-3 mb-0">
                  {proj.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {educationList.length > 0 && (
        <div className="mb-4">
          <div className="fw-bold text-uppercase small text-dark mb-1">[ 05. EDUCATION ]</div>
          {educationList.map((edu, idx) => (
            <div key={idx} className="small">
              <strong>{edu.degree}</strong> {edu.institution && `— ${edu.institution}`} {edu.year && `(${edu.year})`}
            </div>
          ))}
        </div>
      )}

      {/* Additional */}
      {(certifications.length > 0 || languages.length > 0) && (
        <div>
          <div className="fw-bold text-uppercase small text-dark mb-1">[ 06. ADDITIONAL ]</div>
          {certifications.length > 0 && <div className="small">Certifications: {certifications.join(", ")}</div>}
          {languages.length > 0 && <div className="small">Languages: {languages.join(", ")}</div>}
        </div>
      )}
    </div>
  );
}

export default Template9;
