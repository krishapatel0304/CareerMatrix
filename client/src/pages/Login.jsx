import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { login as loginApi } from "../services/authService";
import { getResume } from "../services/resumeService";
import { UserContext } from "../context/UserContext";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(UserContext);

  const [emailOrName, setEmailOrName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginApi({ emailOrName, password });
      loginUser(data.user);

      try {
        const resumeRes = await getResume();
        if (resumeRes?.resume?.id && (resumeRes.resume.personal?.name || resumeRes.resume.professional?.skills || resumeRes.resume.generatedContent)) {
          navigate("/dashboard");
        } else {
          navigate("/resume-selection");
        }
      } catch {
        navigate("/resume-selection");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h1 className="text-primary text-center">CareerMatrix</h1>

        <p className="text-center text-muted">
          AI-Powered Job Application Tracker
        </p>

        <h3 className="text-center mb-4">Login</h3>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Email or Name"
            value={emailOrName}
            onChange={(e) => setEmailOrName(e.target.value)}
            required
          />

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>

        <p className="text-center mt-3">
          Don&apos;t have an account?{" "}
          <Link to="/register">Register Here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
