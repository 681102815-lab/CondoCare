const BASE = "http://localhost:5000";

async function test() {
    // Login as admin
    const login = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "1234" }),
    }).then((r) => r.json());
    const token = login.token;
    console.log("Logged in:", login.user.username);

    // Create a test report
    const rpt = await fetch(`${BASE}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: "test-ts", detail: "testing timestamps", priority: "low" }),
    }).then((r) => r.json());
    console.log("1. CREATED:", rpt.reportId, "startedAt:", rpt.startedAt, "completedAt:", rpt.completedAt);

    // Change to กำลังดำเนินการ
    const s1 = await fetch(`${BASE}/api/reports/${rpt.reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23" }), // กำลังดำเนินการ
    }).then((r) => r.json());
    console.log("2. IN PROGRESS:", "startedAt:", s1.startedAt);

    // Change to เสร็จสิ้น
    const s2 = await fetch(`${BASE}/api/reports/${rpt.reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e2a\u0e34\u0e49\u0e19" }), // เสร็จสิ้น
    }).then((r) => r.json());
    console.log("3. COMPLETED:", "completedAt:", s2.completedAt, "startedAt:", s2.startedAt);

    // Delete test report
    await fetch(`${BASE}/api/reports/${rpt.reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log("4. CLEANUP OK");
}

test().catch((e) => console.error("Error:", e.message));
