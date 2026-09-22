import apiRequest from "./api";

/**
 * Generate practice question bank
 */
export async function generateInterviewQuestions(data) {
  return apiRequest("/interview/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Initialize 9-question Mock Interview
 */
export async function startMockInterview(data) {
  return apiRequest("/interview/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Generate a single next question on-demand avoiding all previously asked questions
 */
export async function generateNextMockQuestion(data) {
  return apiRequest("/interview/next-question", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Regenerate a single question at the current difficulty level
 */
export async function regenerateMockQuestion(data) {
  return apiRequest("/interview/regenerate-question", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Evaluate complete mock interview questions and candidate answers
 */
export async function evaluateMockInterview(data) {
  return apiRequest("/interview/evaluate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
