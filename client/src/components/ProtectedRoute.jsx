import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { getStoredToken } from "../services/authService";
import { ResumeContext } from "../context/ResumeContext";

function ProtectedRoute({ children, requireResume = false }) {
  const token = getStoredToken();
  const { hasCompletedResume, initialResumeLoaded } = useContext(ResumeContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireResume && initialResumeLoaded && !hasCompletedResume) {
    return <Navigate to="/resume-selection" replace />;
  }

  return children;
}

export default ProtectedRoute;
