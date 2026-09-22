import apiRequest from "./api";

export async function getResume() {
  return apiRequest("/resume");
}

export async function saveResume(resumeData) {
  return apiRequest("/resume", {
    method: "POST",
    body: JSON.stringify(resumeData),
  });
}

export async function generateResumeAI(data) {
  return apiRequest("/resume/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadResumeFile(file) {
  const formData = new FormData();
  formData.append("resume", file);

  return apiRequest("/resume/upload", {
    method: "POST",
    body: formData,
  });
}
