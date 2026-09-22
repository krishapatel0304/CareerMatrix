import apiRequest from "./api";

export async function getExternalJobs(params = {}) {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key]) cleanParams[key] = params[key];
  });
  const query = new URLSearchParams(cleanParams).toString();
  const suffix = query ? `?${query}` : "";
  return apiRequest(`/external-jobs${suffix}`);
}
