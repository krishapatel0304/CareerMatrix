import apiRequest from "./api";

export async function getJobs(params = {}) {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key]) cleanParams[key] = params[key];
  });
  const query = new URLSearchParams(cleanParams).toString();
  const suffix = query ? `?${query}` : "";
  return apiRequest(`/jobs${suffix}`);
}

export async function getJobStats() {
  return apiRequest("/jobs/stats");
}

export async function getJobById(id) {
  return apiRequest(`/jobs/${id}`);
}

export async function createJob(jobData) {
  return apiRequest("/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

export async function updateJob(id, jobData) {
  return apiRequest(`/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(jobData),
  });
}

export async function deleteJob(id) {
  return apiRequest(`/jobs/${id}`, {
    method: "DELETE",
  });
}
