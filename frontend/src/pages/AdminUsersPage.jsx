import React, { useState, useEffect, useCallback } from "react";
import { getUsers, registerUser, deleteUser, editUser } from "../api";

const ROLE_LABELS = { admin: "👑 แอดมิน", tech: "🔧 ช่าง", resident: "🏠 ผู้พักอาศัย" };
const ROLE_COLORS = { admin: "#ff6b6b", tech: "#ffc107", resident: "#28a745" };

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ username: "", password: "", role: "resident", firstName: "" });
    const [editModal, setEditModal] = useState({ open: false, user: null });
    const [editForm, setEditForm] = useState({ firstName: "", role: "", username: "" });
    const [credentialPopup, setCredentialPopup] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const reload = useCallback(() => {
        getUsers().then(setUsers).catch((e) => setError(e.message));
    }, []);

    useEffect(() => { reload(); }, [reload]);

    async function handleRegister(e) {
        e.preventDefault();
        setError(""); setSuccess("");
        if (form.password.length < 6) {
            setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
            return;
        }
        try {
            const res = await registerUser(form.username, form.password, form.role, form.firstName);
            setSuccess(res.message || "สร้าง user สำเร็จ");
            // แสดง popup ข้อมูล username/password เพื่อแจ้งสมาชิก
            setCredentialPopup({
                username: res.credentials?.username || form.username,
                password: form.password,
                role: form.role,
                firstName: form.firstName || form.username,
            });
            setForm({ username: "", password: "", role: "resident", firstName: "" });
            reload();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(userId, username) {
        if (!confirm(`ต้องการลบ "${username}" จริงหรือไม่?`)) return;
        setError(""); setSuccess("");
        try {
            await deleteUser(userId);
            setSuccess(`ลบ ${username} สำเร็จ`);
            reload();
        } catch (err) {
            setError(err.message);
        }
    }

    function openEditModal(u) {
        setEditModal({ open: true, user: u });
        setEditForm({ firstName: u.firstName || "", role: u.role, username: u.username });
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            await editUser(editModal.user.userId, editForm);
            setSuccess(`แก้ไข ${editForm.username} สำเร็จ`);
            setEditModal({ open: false, user: null });
            reload();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <section>
            <h3>👥 จัดการสมาชิก</h3>

            {/* ฟอร์มเพิ่ม user */}
            <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "1rem" }}>➕ เพิ่มสมาชิกใหม่</h4>
                <form onSubmit={handleRegister} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>ประเภท <span className="required">*</span></label>
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
                            {form.role === "resident" ? "เลขห้อง (ชื่อผู้ใช้)" : "ชื่อผู้ใช้"} <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder={form.role === "resident" ? "เช่น 101, 205" : "username"}
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                            style={{ width: "100%", padding: "0.5rem", background: "#1e1e2e", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                        />
                        {form.role === "resident" && (
                            <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>
                                💡 1 ห้อง สามารถมีได้เพียง 1 บัญชีผู้ใช้
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>รหัสผ่าน <span className="required">*</span></label>
                        <input
                            type="text"
                            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={6}
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

            {/* Credential Popup */}
            {credentialPopup && (
                <div className="modal-overlay" onClick={() => setCredentialPopup(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
                        <h3 style={{ marginBottom: "1rem" }}>🎉 สร้างสมาชิกสำเร็จ</h3>
                        <p style={{ marginBottom: "0.5rem" }}>ข้อมูลสำหรับแจ้งสมาชิก:</p>
                        <div style={{ background: "#1a1a2e", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                            <div><strong>👤 ชื่อ:</strong> {credentialPopup.firstName}</div>
                            <div><strong>🔑 Username:</strong> <code>{credentialPopup.username}</code></div>
                            <div><strong>🔒 Password:</strong> <code>{credentialPopup.password}</code></div>
                            <div><strong>📋 ประเภท:</strong> {ROLE_LABELS[credentialPopup.role]}</div>
                        </div>
                        <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                            📌 กรุณาแจ้ง username และ password ให้สมาชิกเพื่อใช้เข้าสู่ระบบ
                        </p>
                        <button className="btn-primary full-width" onClick={() => setCredentialPopup(null)}>ปิด</button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal.open && (
                <div className="modal-overlay" onClick={() => setEditModal({ open: false, user: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
                        <h3 style={{ marginBottom: "1rem" }}>✏️ แก้ไขสมาชิก</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: "0.75rem" }}>
                                <label style={{ fontSize: "0.85rem", color: "#aaa" }}>ชื่อผู้ใช้</label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    style={{ width: "100%", padding: "0.5rem", background: "#1e1e2e", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                                />
                            </div>
                            <div style={{ marginBottom: "0.75rem" }}>
                                <label style={{ fontSize: "0.85rem", color: "#aaa" }}>ชื่อแสดง</label>
                                <input
                                    type="text"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                    style={{ width: "100%", padding: "0.5rem", background: "#1e1e2e", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                                />
                            </div>
                            <div style={{ marginBottom: "0.75rem" }}>
                                <label style={{ fontSize: "0.85rem", color: "#aaa" }}>ประเภท</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="status-select"
                                    style={{ width: "100%", padding: "0.5rem" }}
                                >
                                    <option value="resident">🏠 ผู้พักอาศัย</option>
                                    <option value="tech">🔧 ช่าง</option>
                                    <option value="admin">👑 แอดมิน</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button type="submit" className="btn-submit" style={{ flex: 1 }}>💾 บันทึก</button>
                                <button type="button" className="btn-ghost" onClick={() => setEditModal({ open: false, user: null })} style={{ flex: 1 }}>ยกเลิก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ตาราง user */}
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
                                        <div style={{ display: "flex", gap: "0.3rem" }}>
                                            <button
                                                className="btn-ghost-sm"
                                                onClick={() => openEditModal(u)}
                                                title="แก้ไข user"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-ghost-sm"
                                                onClick={() => handleDelete(u.userId, u.username)}
                                                title="ลบ user"
                                            >
                                                🗑️
                                            </button>
                                        </div>
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
