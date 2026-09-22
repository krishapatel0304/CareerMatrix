import apiRequest from "./api";

export async function generateCareerRoadmap(data) {
  return apiRequest("/roadmap/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
