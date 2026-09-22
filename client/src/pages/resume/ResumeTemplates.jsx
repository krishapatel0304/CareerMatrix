import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ResumeTemplates() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/templates", { replace: true });
  }, [navigate]);

  return null;
}

export default ResumeTemplates;