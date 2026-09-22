function TemplateCard({ template, isSelected, onSelect }) {
  return (
    <div className={`card shadow-sm border-0 h-100 ${isSelected ? "border border-2 border-primary" : ""}`}>
      <div
        className="p-4 d-flex flex-column justify-content-between align-items-center text-center bg-light rounded-top"
        style={{ height: "180px", ...template.previewStyle }}
      >
        <span className={`badge ${template.badgeClass || "bg-primary"} px-3 py-1 mb-2`}>
          {template.badge || "Template"}
        </span>
        <div>
          <h5 className="fw-bold text-dark mb-1">{template.title}</h5>
          {isSelected && <span className="badge bg-success small">✓ Active</span>}
        </div>
      </div>

      <div className="card-body d-flex flex-column p-3">
        <p className="text-secondary small mb-3 flex-grow-1">{template.desc}</p>
        <button
          className={`btn w-100 btn-sm fw-bold ${isSelected ? "btn-success" : "btn-primary"}`}
          onClick={() => onSelect(template.id)}
        >
          {isSelected ? "Selected" : "Use Template"}
        </button>
      </div>
    </div>
  );
}

export default TemplateCard;
