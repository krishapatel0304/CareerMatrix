import apiRequest from "./api";

export async function generateCoverLetter(data) {
  return apiRequest("/cover-letter/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
