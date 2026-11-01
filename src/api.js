// Centralized API configuration and client for Campus Skill Exchange
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

/**
 * Helper to build auth headers with JWT token if present
 */
const getAuthHeaders = (extraHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  try {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    // LocalStorage access might fail in restricted environments
  }
  return headers;
};

/**
 * Universal safe request wrapper with JSON and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: getAuthHeaders(options.headers),
  };

  try {
    const response = await fetch(url, config);

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => "");
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If it's a network error (backend down/offline/CORS)
    if (!error.status) {
      const netError = new Error(
        `Unable to reach the server at ${API_BASE_URL}. Please ensure the backend is running.`
      );
      netError.isNetworkError = true;
      throw netError;
    }
    throw error;
  }
}

// -------------------------------------------------------------
// API Services
// -------------------------------------------------------------

export const api = {
  // Check backend availability
  checkHealth: () => request("/"),

  // Students & Directory
  getStudents: () => request("/api/students"),

  // Authentication
  login: (studentId, password) =>
    request("/api/login", {
      method: "POST",
      body: JSON.stringify({ studentId: studentId.trim(), password }),
    }),

  register: (userData) =>
    request("/api/register", {
      method: "POST",
      body: JSON.stringify({
        studentId: userData.id?.trim() || userData.studentId?.trim(),
        name: userData.name?.trim(),
        email: userData.email?.trim(),
        phone: userData.phone?.trim() || "",
        password: userData.password,
      }),
    }),

  logout: async () => {
    try {
      return await request("/api/logout", { method: "POST" });
    } catch {
      // Allow client logout even if backend call fails
      return null;
    }
  },

  getProfile: () => request("/api/profile"),

  // Skills
  getSkills: () => request("/api/skills"),

  createSkill: (skillData) =>
    request("/api/skills", {
      method: "POST",
      body: JSON.stringify({
        name: skillData.name?.trim(),
        category: skillData.category,
        level: skillData.level,
      }),
    }),

  // Admin Dashboard (requires admin role)
  getAdminDashboard: () => request("/api/admin/dashboard"),

  // Audit Logs (requires admin access or available endpoint)
  getLoginLogs: () => request("/api/loginlogs"),
};

export default api;

