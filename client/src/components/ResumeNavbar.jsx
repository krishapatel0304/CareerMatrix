import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function ResumeNavbar() {
  const navigate = useNavigate();
  const { user, logoutUser } = useContext(UserContext);

  const handleLogout = (e) => {
    e.preventDefault();
    logoutUser();
    navigate("/");
  };

  return (
    <nav className="navbar navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <span className="navbar-brand fw-bold fs-4 d-flex align-items-center mb-0">
          <span className="me-2">⚡</span> CareerMatrix — AI Resume Builder
        </span>

        <div className="d-flex align-items-center gap-2">
          {user && (
            <span className="navbar-text me-2 text-white-50 small">
              Hi, {user.name?.split(" ")[0]}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm fw-semibold"
            title="Log out"
          >
            Logout 🚪
          </button>
        </div>
      </div>
    </nav>
  );
}

export default ResumeNavbar;
