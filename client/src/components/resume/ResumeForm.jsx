function ResumeForm({ personal, professional, onChangePersonal, onChangeProfessional }) {
  return (
    <div className="card shadow-sm border-0 p-4">
      <h5 className="fw-bold mb-3">Resume Information</h5>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Full Name</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={personal?.name || ""}
            onChange={(e) => onChangePersonal("name", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Email</label>
          <input
            type="email"
            className="form-control form-control-sm"
            value={personal?.email || ""}
            onChange={(e) => onChangePersonal("email", e.target.value)}
          />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold">Career Objective</label>
          <textarea
            className="form-control form-control-sm"
            rows="2"
            value={professional?.objective || ""}
            onChange={(e) => onChangeProfessional("objective", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default ResumeForm;
