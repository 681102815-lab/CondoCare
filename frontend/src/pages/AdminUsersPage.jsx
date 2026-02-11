import React, { useState, useEffect, useCallback } from "react";
import { getUsers, registerUser, deleteUser } from "../api";

const ROLE_LABELS = { admin: "👑 แอดมิน", tech: "🔧 ช่าง", resident: "🏠 ผู้พักอาศัย" };
const ROLE_COLORS = { admin: "#ff6b6b", tech: "#ffc107", resident: "#28a745" };

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ username: "", password: "", role: "resident", firstName: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const reload = useCallback(() => {
        getUsers().then(setUsers).catch((e) => setError(e.message));
    }, []);

    useEffect(() => { reload(); }, [reload]);

    async function handleRegister(e) {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            const res = await registerUser(form.username, form.password, form.role, form.firstName);
            setSuccess(res.message || "สร้าง user สำเร็จ");
            setForm({ username: "", password: "", role: "resident", firstName: "" });
            reload();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(userId, username) {
        if (!confirm(`ต้องการลบ "${username}" (${userId}) จริงหรือไม่?`)) return;
        setError(""); setSuccess("");
        try {
            await deleteUser(userId);
            setSuccess(`ลบ ${username} สำเร็จ`);
            reload();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <section>
            <h3>👥 จัดการสมาชิก</h3>

            {/* ——— ฟอร์มเพิ่ม user ——— */}
            <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "1rem" }}>➕ เพิ่มสมาชิกใหม่</h4>
                <form onSubmit={handleRegister} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>ประเภท</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="status-select"
                            style={{ width: "100%", padding: "0.5rem" }}
                        >
                            <option value="resident">🏠 ผู้พักอาศัย</option>
                            <option value="tech">🔧 ช่าง</option>
                            <option value="admin">👑 แอดมิน</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>
                            {form.role === "resident" ? "เลขห้อง (ชื่อผู้ใช้)" : "ชื่อผู้ใช้"}
                        </label>
                        <input
                            type="text"
                            placeholder={form.role === "resident" ? "เช่น 101, 205" : "username"}
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                            style={{ width: "100%", padding: "0.5rem", background: "#1e1e2e", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>รหัสผ่าน</label>
                        <input
                            type="text"
                            placeholder="รหัสผ่าน (อย่างน้อย 4 ตัว)"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            style={{ width: "100%", padding: "0.5rem", background: "#1e1e2e", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>ชื่อ (แสดงผล)</label>
                        <input
                            type="text"
                            placeholder="ชื่อจริง / ชื่อเล่น"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            style={{ width: "100%", padding: "0.5rem", background: "#1e1e2e", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                        />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                        <button type="submit" className="btn-submit" style={{ width: "100%", padding: "0.6rem" }}>
                            ✅ สร้างสมาชิก
                        </button>
                    </div>
                </form>
                {error && <p style={{ color: "#ff6b6b", marginTop: "0.75rem" }}>❌ {error}</p>}
                {success && <p style={{ color: "#28a745", marginTop: "0.75rem" }}>✅ {success}</p>}
            </div>

            {/* ——— ตาราง user ——— */}
            <div className="table-wrapper">
                <table className="manage-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ชื่อผู้ใช้</th>
                            <th>ชื่อแสดง</th>
                            <th>ประเภท</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.userId}>
                                <td><strong className="accent-text">{u.userId}</strong></td>
                                <td>{u.username}</td>
                                <td>{u.firstName}</td>
                                <td>
                                    <span
                                        className="priority-badge"
                                        style={{ background: ROLE_COLORS[u.role] || "#666", fontSize: "0.8rem" }}
                                    >
                                        {ROLE_LABELS[u.role] || u.role}
                                    </span>
                                </td>
                                <td>
                                    {u.username !== "admin" ? (
                                        <button
                                            className="btn-ghost-sm"
                                            onClick={() => handleDelete(u.userId, u.username)}
                                            title="ลบ user"
                                        >
                                            🗑️
                                        </button>
                                    ) : (
                                        <span style={{ color: "#666", fontSize: "0.8rem" }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
