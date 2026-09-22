import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { JobContext } from "../../context/JobContext";
import { createJob, updateJob } from "../../services/jobService";

function AddJob() {
  const navigate = useNavigate();
  const { editingJob, setEditingJob, loadJobs } = useContext(JobContext);

  const [formData, setFormData] = useState({
    company_name: "",
    job_role: "",
    application_date: new Date().toISOString().split("T")[0],
    status: "Applied",
    job_description: "",
    job_url: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingJob) {
      setFormData({
        company_name: editingJob.company_name || editingJob.company || "",
        job_role: editingJob.job_role || editingJob.position || "",
        application_date: editingJob.application_date
          ? new Date(editingJob.application_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        status: editingJob.status || "Applied",
        job_description: editingJob.job_description || "",
        job_url: editingJob.job_url || "",
        notes: editingJob.notes || "",
      });
    }
  }, [editingJob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.company_name.trim() || !formData.job_role.trim()) {
      setError("Company Name and Job Role are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingJob?.id) {
        await updateJob(editingJob.id, formData);
      } else {
        await createJob(formData);
      }
      setEditingJob(null);
      await loadJobs();
      navigate("/job-tracker");
    } catch (err) {
      console.error("Save job error:", err);
      setError(err.message || "Failed to save job application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold text-primary mb-0">
                {editingJob ? "✏️ Edit Job Application" : "➕ Add Job Application"}
              </h2>
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setEditingJob(null);
                  navigate("/job-tracker");
                }}
              >
                ← Back to Jobs
              </button>
            </div>

            {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

            <div className="card shadow border-0 p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Company Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="company_name"
                      placeholder="e.g. Google, Microsoft, TCS"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Job Role / Position <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="job_role"
                      placeholder="e.g. Frontend Developer, SDE-1"
                      value={formData.job_role}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Application Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="application_date"
                      value={formData.application_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Application Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Offer Received">Offer Received / Selected</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Job URL / Link</label>
                    <input
                      type="url"
                      className="form-control"
                      name="job_url"
                      placeholder="https://linkedin.com/jobs/view/..."
                      value={formData.job_url}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Job Description</label>
                    <textarea
                      className="form-control"
                      name="job_description"
                      rows="3"
                      placeholder="Paste key responsibilities or requirements..."
                      value={formData.job_description}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Notes</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      rows="3"
                      placeholder="Recruiter contact, interview rounds, salary expectations..."
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingJob(null);
                        navigate("/job-tracker");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success px-4"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving..."
                        : editingJob
                        ? "Update Application"
                        : "Save Application"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default AddJob;