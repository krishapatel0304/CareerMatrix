function Footer() {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container text-center text-md-between d-flex flex-column flex-md-row align-items-center">
        <div className="mb-2 mb-md-0">
          <span className="fw-bold text-primary">CareerMatrix</span> &copy; {new Date().getFullYear()} — AI-Powered Job Application Tracker & Cover Letter Generator
        </div>
        <div className="small text-muted">
          Built with React, Bootstrap, Node.js, Express, PostgreSQL & Gemini AI
        </div>
      </div>
    </footer>
  );
}

export default Footer;
