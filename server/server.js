const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const coverLetterRoutes = require("./routes/coverLetterRoutes");
const externalJobRoutes = require("./routes/externalJobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/cover-letter", coverLetterRoutes);
app.use("/api/external-jobs", externalJobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/interview", interviewRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "CareerMatrix Backend is running!",
  });
});

const PORT = process.env.PORT || 5000;

// Auto-initialize PostgreSQL tables if needed
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        city VARCHAR(255),
        career_field VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS career_field VARCHAR(255);

      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        job_role VARCHAR(255) NOT NULL,
        application_date DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        job_description TEXT,
        job_url VARCHAR(500),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        template VARCHAR(100) DEFAULT 'Professional',
        personal_info JSONB,
        professional_info JSONB,
        generated_content JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
      CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
    `);
    console.log("PostgreSQL database tables and indexes verified successfully!");
  } catch (err) {
    console.error("Database initialization warning:", err.message);
  }
};

pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("PostgreSQL connection failed:", err.message);
  } else {
    console.log("PostgreSQL connected successfully!");
    initDb();
  }
});

app.listen(PORT, () => {
  console.log(`CareerMatrix backend running on port ${PORT}`);
});