/**
 * CareerMatrix Centralized Career Fields & Industry Categories
 * Shared across server controllers and Gemini service
 */

const CAREER_FIELDS = [
  "Software / IT",
  "Cybersecurity / Information Security",
  "Mechanical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Electrical / Electronics",
  "Mechatronics / Robotics",
  "Automobile Engineering",
  "Production / Manufacturing",
  "Biotechnology / Biomedical",
  "Aerospace Engineering",
  "Business / Management",
  "Finance / Accounting",
  "Marketing / Sales",
  "Human Resources",
  "Design",
  "Healthcare",
  "Research",
  "Education",
  "Other",
];

const CAREER_FIELD_FILTER_OPTIONS = [
  "All Fields",
  ...CAREER_FIELDS,
];

module.exports = {
  CAREER_FIELDS,
  CAREER_FIELD_FILTER_OPTIONS,
};
