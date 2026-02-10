/*  CondoCare — Standalone API Layer
 *  Uses localStorage for all data (no backend needed).
 *  Works on Vercel, GitHub Pages, or any static hosting.
 */

const USERS = [
    { username: "admin", password: "1234", role: "admin", firstName: "Admin" },
    { username: "tech", password: "1234", role: "tech", firstName: "ช่าง" },
    { username: "resident", password: "1234", role: "resident", firstName: "ผู้พัก" },
];

const STORAGE_KEY = "cc_reports";

function loadReports() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveReports(reports) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// ========== Auth ==========
export function loginUser(username, password) {
    const user = USERS.find((u) => u.username === username && u.password === password);
    if (!user) throw new Error("username หรือ password ไม่ถูกต้อง");
    return {
        username: user.username,
        role: user.role,
        name: user.firstName,
    };
}

// ========== Reports CRUD ==========
export function getReports() {
    return loadReports().sort((a, b) => b.reportId - a.reportId);
}

export function createReport({ category, detail, priority, owner }) {
    const reports = loadReports();
    const report = {
        reportId: Date.now(),
        category,
        detail,
        priority: priority || "medium",
        owner,
        status: "รอรับเรื่อง",
        feedback: "",
        likesCount: 0,
        dislikesCount: 0,
        likedBy: [],
        dislikedBy: [],
        comments: [],
        createdAt: new Date().toISOString(),
    };
    reports.push(report);
    saveReports(reports);
    return report;
}

export function deleteReport(reportId) {
    let reports = loadReports();
    reports = reports.filter((r) => r.reportId !== reportId);
    saveReports(reports);
}

export function updateReportStatus(reportId, status) {
    const reports = loadReports();
    const r = reports.find((r) => r.reportId === reportId);
    if (r) r.status = status;
    saveReports(reports);
    return r;
}

export function updateReportFeedback(reportId, feedback) {
    const reports = loadReports();
    const r = reports.find((r) => r.reportId === reportId);
    if (r) r.feedback = feedback;
    saveReports(reports);
    return r;
}

export function toggleLike(reportId, username) {
    const reports = loadReports();
    const r = reports.find((r) => r.reportId === reportId);
    if (!r) return null;
    const idx = r.likedBy.indexOf(username);
    if (idx >= 0) {
        r.likedBy.splice(idx, 1);
        r.likesCount = Math.max(0, r.likesCount - 1);
    } else {
        r.likedBy.push(username);
        r.likesCount += 1;
        const dIdx = r.dislikedBy.indexOf(username);
        if (dIdx >= 0) { r.dislikedBy.splice(dIdx, 1); r.dislikesCount = Math.max(0, r.dislikesCount - 1); }
    }
    saveReports(reports);
    return r;
}

export function toggleDislike(reportId, username) {
    const reports = loadReports();
    const r = reports.find((r) => r.reportId === reportId);
    if (!r) return null;
    const idx = r.dislikedBy.indexOf(username);
    if (idx >= 0) {
        r.dislikedBy.splice(idx, 1);
        r.dislikesCount = Math.max(0, r.dislikesCount - 1);
    } else {
        r.dislikedBy.push(username);
        r.dislikesCount += 1;
        const lIdx = r.likedBy.indexOf(username);
        if (lIdx >= 0) { r.likedBy.splice(lIdx, 1); r.likesCount = Math.max(0, r.likesCount - 1); }
    }
    saveReports(reports);
    return r;
}

export function addComment(reportId, author, text) {
    const reports = loadReports();
    const r = reports.find((r) => r.reportId === reportId);
    if (!r) return null;
    r.comments.push({ author, text, createdAt: new Date().toISOString() });
    saveReports(reports);
    return r;
}
