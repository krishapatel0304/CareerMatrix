import apiRequest from "./api";

export async function register(userData) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function login(credentials) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getStoredToken() {
  return localStorage.getItem("token");
}

export async function getProfile() {
  return apiRequest("/auth/profile");
}

export async function updateProfile(profileData) {
  const data = await apiRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });

  if (data.user) {
    const current = getStoredUser() || {};
    const updated = { ...current, ...data.user };
    localStorage.setItem("user", JSON.stringify(updated));
  }

  return data;
}
