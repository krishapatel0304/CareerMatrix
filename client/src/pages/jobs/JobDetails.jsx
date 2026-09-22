import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { getJobById } from "../../services/jobService";
import { JobContext } from "../../context/JobContext";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setEditingJob, deleteJob } = useContext(JobContext);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await getJobById(id);
        setJob(data.job);
      } catch (err) {
        console.error("Fetch job details error:", err);
        setError(err.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this job application?")) {
      const success = await deleteJob(id);
      if (success) {
        navigate("/job-tracker");
      }
    }
  };

  const getBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "bg-primary";
      case "interview":
      case "interview scheduled":
        return "bg-info text-dark";
      case "selected":
      case "offer received":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      case "pending":
      default:
        return "bg-warning text-dark";
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/job-tracker")}
              >
                ← Back to Job Tracker
              </button>

              {job && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-warning"
                    onClick={() => {
                      setEditingJob(job);
                      navigate("/add-job");
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete}>
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            {error && <div className="alert alert-danger shadow-sm">{error}</div>}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading job details...</p>
              </div>
            ) : !job ? (
              <div className="card shadow border-0 p-5 text-center">
                <h3>Job Application Not Found</h3>
                <p className="text-muted">The requested application could not be found.</p>
              </div>
            ) : (
              <div className="card shadow border-0 p-4">
                <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                  <div>
                    <h2 className="fw-bold text-primary mb-1">{job.job_role}</h2>
                    <h4 className="text-dark mb-0">{job.company_name}</h4>
                  </div>
                  <span className={`badge rounded-pill px-3 py-2 fs-6 ${getBadgeClass(job.status)}`}>
                    {job.status || "Pending"}
                  </span>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded">
                      <span className="text-muted d-block small">Applied Date</span>
                      <strong className="fs-6">
                        {job.application_date
                          ? new Date(job.application_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not specified"}
                      </strong>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded">
                      <span className="text-muted d-block small">Original Job Link</span>
                      {job.job_url ? (
                        <a
                          href={job.job_url.startsWith("http") ? job.job_url : `https://${job.job_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-break fw-semibold"
                        >
                          🔗 {job.job_url}
                        </a>
                      ) : (
                        <span className="text-muted">No URL provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {job.job_description && (
                  <div className="mb-4">
                    <h5 className="fw-bold text-dark border-bottom pb-2">Job Description</h5>
                    <div className="p-3 bg-light rounded text-secondary whitespace-pre-wrap">
                      {job.job_description}
                    </div>
                  </div>
                )}

                {job.notes && (
                  <div className="mb-4">
                    <h5 className="fw-bold text-dark border-bottom pb-2">Notes & Reminders</h5>
                    <div className="p-3 bg-light rounded text-secondary whitespace-pre-wrap">
                      {job.notes}
                    </div>
                  </div>
                )}

                <div className="text-muted small border-top pt-3">
                  Created on: {new Date(job.created_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default JobDetails;
