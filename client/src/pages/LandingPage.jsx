import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "📄",
      title: "AI Resume Builder",
      desc: "Build ATS-optimized resumes with 9 distinct executive templates or extract details from existing PDF/DOCX files.",
    },
    {
      icon: "📂",
      title: "Job Application Tracker",
      desc: "Manage, filter, search, and monitor all your active job applications with persistent PostgreSQL tracking.",
    },
    {
      icon: "🌐",
      title: "External Job Listings",
      desc: "Discover verified real-world job openings directly from LinkedIn, Indeed, Naukri, and open public job feeds.",
    },
    {
      icon: "✉️",
      title: "AI Cover Letter Generator",
      desc: "Generate professional, tailored cover letters customized for target companies and specific job descriptions.",
    },
    {
      icon: "🗺️",
      title: "AI Career Roadmap",
      desc: "Architect actionable step-by-step career development roadmaps with phased learning stages and milestone goals.",
    },
    {
      icon: "📈",
      title: "AI Skill Gap Analyzer",
      desc: "Benchmark your skillset against industry role benchmarks to identify critical missing skills and prioritized learning paths.",
    },
    {
      icon: "💬",
      title: "AI Interview Preparation",
      desc: "Practice high-yield Technical, Behavioral (STAR method), and System Design interview questions with model answer guidelines.",
    },
  ];

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Top Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center" to="/">
            <span className="me-2">⚡</span> CareerMatrix
          </Link>

          <div className="d-flex align-items-center gap-2 ms-auto">
            <Link to="/login" className="btn btn-outline-light btn-sm fw-semibold">
              Login
            </Link>
            <Link to="/register" className="btn btn-light btn-sm fw-bold text-primary shadow-sm">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-5 bg-white border-bottom">
        <div className="container py-4 text-center">
          <div className="mx-auto" style={{ maxWidth: "860px" }}>
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 fs-6 mb-3 rounded-pill fw-semibold">
              🚀 All-in-One Career Development Platform
            </span>
            <h1 className="fw-bold text-dark display-5 mb-3">
              Build Your Career. Track Your Progress. Achieve Your Goals.
            </h1>
            <p className="lead text-secondary mb-4 fs-5" style={{ lineHeight: "1.6" }}>
              CareerMatrix is an AI-powered career development platform that helps users build resumes, discover jobs, analyze skills, prepare for interviews, generate cover letters, and create personalized career roadmaps.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <button
                className="btn btn-primary btn-lg px-5 py-3 fw-bold shadow-sm"
                onClick={() => navigate("/login")}
              >
                Get Started →
              </button>
              <button
                className="btn btn-outline-secondary btn-lg px-4 py-3 fw-semibold"
                onClick={() => navigate("/register")}
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Core Features Grid */}
      <section className="py-5 flex-grow-1">
        <div className="container py-2">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark mb-2">Comprehensive Career Intelligence Suite</h2>
            <p className="text-muted fs-6">
              Everything you need to accelerate your software engineering and tech career in one unified dashboard.
            </p>
          </div>

          <div className="row g-4 justify-content-center">
            {features.map((feat, idx) => (
              <div key={idx} className="col-md-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100 p-4 bg-white hover-shadow">
                  <div className="fs-1 mb-2">{feat.icon}</div>
                  <h5 className="fw-bold text-dark mb-2">{feat.title}</h5>
                  <p className="text-secondary small mb-0">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Callout Banner */}
          <div className="card shadow-sm border-0 p-5 mt-5 bg-primary text-white text-center rounded-3">
            <h3 className="fw-bold text-white mb-2">Ready to take control of your career path?</h3>
            <p className="text-white-50 mb-4 mx-auto" style={{ maxWidth: "600px" }}>
              Join CareerMatrix today to organize your applications, optimize your resume with Gemini AI, and master your technical interviews.
            </p>
            <div>
              <button
                className="btn btn-light btn-lg fw-bold text-primary px-5 shadow-sm"
                onClick={() => navigate("/login")}
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
