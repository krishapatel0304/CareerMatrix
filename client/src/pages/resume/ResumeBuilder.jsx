import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ResumeBuilder() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/resume-selection", { replace: true });
  }, [navigate]);

  return null;
}

export default ResumeBuilder;