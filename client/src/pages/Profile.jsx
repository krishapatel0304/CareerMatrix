import { useContext, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { UserContext } from "../context/UserContext";
import { ResumeContext } from "../context/ResumeContext";
import { updateProfile } from "../services/authService";
import { CAREER_FIELDS } from "../constants/careerFields";

function Profile() {
  const { user, loginUser } = useContext(UserContext);
  const { resumeData } = useContext(ResumeContext);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || resumeData?.personal?.name || "");
  const [city, setCity] = useState(user?.city || resumeData?.personal?.city || "");
  const [careerField, setCareerField] = useState(user?.career_field || resumeData?.professional?.careerField || "");
  const [customField, setCustomField] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    const effectiveField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    setLoading(true);
    try {
      const data = await updateProfile({
        name,
        city,
        career_field: effectiveField,
      });
      if (data.user) {
        loginUser(data.user);
        setMessage("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name || resumeData?.personal?.name || "N/A";
  const displayEmail = user?.email || resumeData?.personal?.email || "N/A";
  const displayCity = user?.city || resumeData?.personal?.city || "Not set";
  const displayField = user?.career_field || resumeData?.professional?.careerField || "Not selected (Multi-disciplinary)";
  const displayRole = resumeData?.professional?.targetRole || "";
  const displaySkills = resumeData?.professional?.skills || "";
  const displayEdu = resumeData?.professional?.education || "";
  const displayExp = resumeData?.professional?.experience || "";

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <div className="container py-5 flex-grow-1">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-8">
            <div className="card shadow border-0 p-4 p-md-5 bg-white">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <div>
                  <h3 className="fw-bold text-primary mb-1">👤 Candidate Profile</h3>
                  <p className="text-muted small mb-0">Your centralized identity and background across CareerMatrix</p>
                </div>
                {!isEditing && (
                  <button
                    className="btn btn-outline-primary btn-sm px-3"
                    onClick={() => {
                      setName(user?.name || resumeData?.personal?.name || "");
                      setCity(user?.city || resumeData?.personal?.city || "");
                      setCareerField(user?.career_field || resumeData?.professional?.careerField || "");
                      setCustomField("");
                      setIsEditing(true);
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              {message && <div className="alert alert-success shadow-sm mb-3">{message}</div>}
              {error && <div className="alert alert-danger shadow-sm mb-3">{error}</div>}

              {isEditing ? (
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={user?.email || ""}
                      disabled
                    />
                    <small className="text-muted">Email cannot be changed.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">City / State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru, Karnataka"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Career Field / Industry</label>
                    <select
                      className="form-select"
                      value={careerField}
                      onChange={(e) => setCareerField(e.target.value)}
                    >
                      <option value="">-- Select Career Field / Industry --</option>
                      {CAREER_FIELDS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>

                    {careerField === "Other" && (
                      <div className="mt-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Specify your field (e.g. Food Technology, Architecture, Law, Agriculture)"
                          value={customField}
                          onChange={(e) => setCustomField(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success px-4"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="fs-6">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded h-100">
                        <span className="text-muted d-block small">Full Name</span>
                        <strong className="fs-5">{displayName}</strong>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded h-100">
                        <span className="text-muted d-block small">Email Address</span>
                        <strong>{displayEmail}</strong>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded h-100">
                        <span className="text-muted d-block small">City / Location</span>
                        <strong>{displayCity}</strong>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded h-100">
                        <span className="text-muted d-block small">Career Field / Industry</span>
                        <strong className="text-primary">{displayField}</strong>
                      </div>
                    </div>

                    {displayRole && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <span className="text-muted d-block small">Target Job Role</span>
                          <strong className="text-dark">{displayRole}</strong>
                        </div>
                      </div>
                    )}

                    {displaySkills && (
                      <div className="col-12">
                        <div className="p-3 bg-light rounded">
                          <span className="text-muted d-block small">Resume Skills</span>
                          <span className="text-secondary">{displaySkills}</span>
                        </div>
                      </div>
                    )}

                    {displayEdu && (
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded h-100">
                          <span className="text-muted d-block small">Education</span>
                          <small className="text-secondary d-block whitespace-pre-line">{displayEdu}</small>
                        </div>
                      </div>
                    )}

                    {displayExp && (
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded h-100">
                          <span className="text-muted d-block small">Experience</span>
                          <small className="text-secondary d-block whitespace-pre-line">{displayExp}</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Profile;
