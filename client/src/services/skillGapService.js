import apiRequest from "./api";

export async function analyzeSkillGap(data) {
  return apiRequest("/skill-gap/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
