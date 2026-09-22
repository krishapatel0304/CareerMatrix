import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { JobContext } from "../../context/JobContext";

function JobTracker() {
  const navigate = useNavigate();
  const { jobs, loadJobs, deleteJob, setEditingJob, loading, error } = useContext(JobContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Applications");

  useEffect(() => {
    loadJobs({ search: searchTerm, status: selectedStatus });
  }, [loadJobs, selectedStatus, searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadJobs({ search: searchTerm, status: selectedStatus });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job application?")) {
      await deleteJob(id);
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold text-primary mb-1">📂 My Job Applications</h2>
            <p className="text-muted mb-0">Track and manage all your active job applications</p>
          </div>

          <button
            className="btn btn-success btn-lg shadow-sm"
            onClick={() => {
              setEditingJob(null);
              navigate("/add-job");
            }}
          >
            + Add New Job
          </button>
        </div>

        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

        {/* Filter and Search Bar */}
        <div className="card shadow-sm p-3 mb-4 bg-light border-0">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
            <div className="col-md-7">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Company or Job Role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
              </div>
            </div>

            <div className="col-md-5">
              <div className="d-flex align-items-center">
                <label className="me-2 fw-semibold text-nowrap">Filter Status:</label>
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All Applications">All Applications</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview Scheduled</option>
                  <option value="Selected">Selected / Offer Received</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Jobs Table */}
        <div className="card shadow border-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-primary text-uppercase fs-7">
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Job Role</th>
                  <th scope="col">Applied Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Job Link</th>
                  <th scope="col" className="text-end pe-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted mb-0">Loading job applications...</p>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="mb-2 fs-3 text-muted">📭</div>
                      <h5 className="fw-normal text-muted">No job applications found</h5>
                      <p className="text-secondary small mb-3">
                        {searchTerm || selectedStatus !== "All Applications"
                          ? "Try clearing your search or filter"
                          : "Start tracking by adding your first job application"}
                      </p>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setEditingJob(null);
                          navigate("/add-job");
                        }}
                      >
                        + Add Application
                      </button>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="fw-bold">{job.company_name || job.company}</td>
                      <td>{job.job_role || job.position}</td>
                      <td>
                        {job.application_date
                          ? new Date(job.application_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-2 ${getBadgeClass(job.status)}`}>
                          {job.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        {job.job_url ? (
                          <a
                            href={job.job_url.startsWith("http") ? job.job_url : `https://${job.job_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                          >
                            🔗 View Post
                          </a>
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm btn-outline-info me-2"
                          title="View Details"
                          onClick={() => navigate(`/job-details/${job.id}`)}
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          title="Edit"
                          onClick={() => {
                            setEditingJob(job);
                            navigate("/add-job");
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          title="Delete"
                          onClick={() => handleDelete(job.id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default JobTracker;