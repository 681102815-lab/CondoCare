/*  CondoCare — API Layer
 *  Connects to backend server (Express + MongoDB)
 */

const PROD_API = "https://condocare-backend.onrender.com/api";
const DEV_API = "http://localhost:5000/api";
const API_URL = import.meta.env.VITE_API_URL || (location.hostname === "localhost" ? DEV_API : PROD_API);

export function getToken() {
    const s = localStorage.getItem("cc_session");
    if (!s) return null;
    try { return JSON.parse(s).token; } catch { return null; }
}

export async function api(path, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || res.statusText);
    return json;
}

// ========== Auth ==========
export async function loginUser(username, password) {
    const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
    return {
        username: res.user.username,
        role: res.user.role,
        name: res.user.firstName || res.user.username,
        token: res.token,
    };
}

export async function getUsers() {
    const res = await api("/auth/users");
    return res.data || [];
}

export async function registerUser(username, password, role, firstName) {
    return api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, role, firstName }),
    });
}

export async function editUser(userId, data) {
    return api(`/auth/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteUser(userId) {
    return api(`/auth/users/${userId}`, { method: "DELETE" });
}

export async function changePassword(oldPassword, newPassword) {
    return api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword }),
    });
}

export async function updateName(firstName) {
    return api("/auth/update-name", {
        method: "PUT",
        body: JSON.stringify({ firstName }),
    });
}

// ========== Reports ==========
export async function getReports() {
    const res = await api("/reports");
    return res.data || [];
}

export async function createReportWithImages({ category, customCategory, detail, priority, owner, location, images }) {
    const formData = new FormData();
    formData.append("category", category);
    if (customCategory) formData.append("customCategory", customCategory);
    formData.append("detail", detail);
    formData.append("priority", priority);
    formData.append("owner", owner);
    if (location) formData.append("location", location);
    for (const img of (images || [])) {
        formData.append("images", img);
    }
    const token = getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/reports`, { method: "POST", headers, body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || res.statusText);
    return json;
}

export async function deleteReport(reportId) {
    return api(`/reports/${reportId}`, { method: "DELETE" });
}

export async function updateReportStatus(reportId, status) {
    return api(`/reports/${reportId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
}

export async function updateReportFeedback(reportId, feedback) {
    return api(`/reports/${reportId}/feedback`, { method: "PUT", body: JSON.stringify({ feedback }) });
}

export async function updateReportRating(reportId, rating) {
    return api(`/reports/${reportId}/rating`, { method: "PUT", body: JSON.stringify({ rating }) });
}

export async function toggleCommentLike(reportId, commentId, username) {
    return api(`/reports/${reportId}/comment/${commentId}/like`, { method: "POST", body: JSON.stringify({ username }) });
}

export async function toggleCommentDislike(reportId, commentId, username) {
    return api(`/reports/${reportId}/comment/${commentId}/dislike`, { method: "POST", body: JSON.stringify({ username }) });
}

export async function addComment(reportId, author, text) {
    return api(`/reports/${reportId}/comment`, { method: "POST", body: JSON.stringify({ author, text }) });
}

export async function uploadCompletionImages(reportId, images) {
    const formData = new FormData();
    for (const img of images) {
        formData.append("images", img);
    }
    const token = getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/reports/${reportId}/completion-images`, { method: "POST", headers, body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || res.statusText);
    return json;
}
