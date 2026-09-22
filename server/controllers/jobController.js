const pool = require("../config/db");

// Get all jobs for authenticated user (with optional search and status filter)
const getJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { search, status } = req.query;

    let queryText = "SELECT * FROM job_applications WHERE user_id = $1";
    const queryParams = [userId];
    let paramIndex = 2;

    if (search && search.trim() !== "") {
      queryText += ` AND (company_name ILIKE $${paramIndex} OR job_role ILIKE $${paramIndex})`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (status && status.trim() !== "" && status !== "All Applications" && status !== "All") {
      queryText += ` AND status ILIKE $${paramIndex}`;
      queryParams.push(status.trim());
      paramIndex++;
    }

    queryText += " ORDER BY created_at DESC";

    const result = await pool.query(queryText, queryParams);
    res.json({ jobs: result.rows });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Failed to fetch job applications" });
  }
};

// Get Dashboard Stats for authenticated user
const getJobStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const statsResult = await pool.query(
      `SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status ILIKE 'Applied' THEN 1 END)::int AS applied,
        COUNT(CASE WHEN status ILIKE 'Interview%' THEN 1 END)::int AS interview,
        COUNT(CASE WHEN status ILIKE 'Selected%' OR status ILIKE 'Offer%' THEN 1 END)::int AS selected,
        COUNT(CASE WHEN status ILIKE 'Rejected' THEN 1 END)::int AS rejected,
        COUNT(CASE WHEN status ILIKE 'Pending' THEN 1 END)::int AS pending
       FROM job_applications
       WHERE user_id = $1`,
      [userId]
    );

    const recentResult = await pool.query(
      `SELECT * FROM job_applications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    res.json({
      stats: statsResult.rows[0] || {
        total: 0,
        applied: 0,
        interview: 0,
        selected: 0,
        rejected: 0,
        pending: 0,
      },
      recentJobs: recentResult.rows,
    });
  } catch (error) {
    console.error("Get job stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

// Get single job by ID
const getJobById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM job_applications WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job application not found" });
    }

    res.json({ job: result.rows[0] });
  } catch (error) {
    console.error("Get job by ID error:", error);
    res.status(500).json({ message: "Failed to fetch job application" });
  }
};

// Create new job application
const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      company_name,
      company,
      job_role,
      position,
      application_date,
      date,
      status,
      job_description,
      job_url,
      notes,
    } = req.body;

    const comp = (company_name || company || "").trim();
    const role = (job_role || position || "").trim();
    const appDate = application_date || date || new Date().toISOString().split("T")[0];
    const stat = status || "Pending";

    if (!comp || !role) {
      return res.status(400).json({ message: "Company Name and Job Role are required" });
    }

    const result = await pool.query(
      `INSERT INTO job_applications 
       (user_id, company_name, job_role, application_date, status, job_description, job_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        comp,
        role,
        appDate,
        stat,
        job_description || "",
        job_url || "",
        notes || "",
      ]
    );

    res.status(201).json({
      message: "Job application added successfully",
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Failed to create job application" });
  }
};

// Update existing job application
const updateJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const {
      company_name,
      company,
      job_role,
      position,
      application_date,
      date,
      status,
      job_description,
      job_url,
      notes,
    } = req.body;

    const comp = (company_name || company || "").trim();
    const role = (job_role || position || "").trim();
    const appDate = application_date || date || null;
    const stat = status || "Pending";

    if (!comp || !role) {
      return res.status(400).json({ message: "Company Name and Job Role are required" });
    }

    const result = await pool.query(
      `UPDATE job_applications
       SET company_name = $1,
           job_role = $2,
           application_date = $3,
           status = $4,
           job_description = $5,
           job_url = $6,
           notes = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        comp,
        role,
        appDate,
        stat,
        job_description || "",
        job_url || "",
        notes || "",
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job application not found or unauthorized" });
    }

    res.json({
      message: "Job application updated successfully",
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ message: "Failed to update job application" });
  }
};

// Delete job application
const deleteJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job application not found or unauthorized" });
    }

    res.json({ message: "Job application deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ message: "Failed to delete job application" });
  }
};

module.exports = {
  getJobs,
  getJobStats,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
