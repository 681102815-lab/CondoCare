import { useState, useEffect, useRef } from "react";
import { changePassword, updateName } from "../api";
import { useAuth } from "../AuthContext";

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [oldPwd, setOldPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [newName, setNewName] = useState(user?.name || "");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const timerRef = useRef(null);

    function showMessage(text) { setError(""); setMsg(text); clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMsg(""), 4000); }
    function showError(text) { setMsg(""); setError(text); clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setError(""), 4000); }
    useEffect(() => () => clearTimeout(timerRef.current), []);

    async function handleChangePassword(e) {
        e.preventDefault();
        if (newPwd.length < 6) { showError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
        try {
            await changePassword(oldPwd, newPwd);
            showMessage("✅ เปลี่ยนรหัสผ่านสำเร็จ!");
            setOldPwd(""); setNewPwd("");
        } catch (err) {
            showError(err.message || "รหัสเก่าไม่ถูกต้อง");
        }
    }

    async function handleChangeName(e) {
        e.preventDefault();
        if (!newName.trim()) { showError("กรุณากรอกชื่อใหม่"); return; }
        try {
            const res = await updateName(newName.trim());
            showMessage("✅ เปลี่ยนชื่อสำเร็จ!");
            if (updateUser) updateUser({ ...user, name: res.firstName || newName.trim() });
        } catch (err) {
            showError(err.message);
        }
    }

    return (
        <section>
            <h3>👤 ตั้งค่าโปรไฟล์</h3>

            {/* User Info */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.75rem" }}>📋 ข้อมูลปัจจุบัน</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <div><strong>ชื่อผู้ใช้:</strong> {user?.username}</div>
                    <div><strong>ชื่อแสดง:</strong> {user?.name}</div>
                    <div><strong>ประเภท:</strong> {user?.role === "admin" ? "👑 แอดมิน" : user?.role === "tech" ? "🔧 ช่าง" : "🏠 ผู้พักอาศัย"}</div>
                </div>
            </div>

            {msg && <div className="profile-alert success">{msg}</div>}
            {error && <div className="profile-alert error">❌ {error}</div>}

            {/* Change Name */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.75rem" }}>✏️ เปลี่ยนชื่อแสดง</h4>
                <form onSubmit={handleChangeName}>
                    <div className="input-group">
                        <label>ชื่อใหม่</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="กรอกชื่อใหม่"
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>
                        💾 บันทึกชื่อ
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="card" style={{ padding: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.75rem" }}>🔒 เปลี่ยนรหัสผ่าน</h4>
                <form onSubmit={handleChangePassword}>
                    <div className="input-group">
                        <label>รหัสผ่านเก่า</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showOld ? "text" : "password"}
                                value={oldPwd}
                                onChange={(e) => setOldPwd(e.target.value)}
                                placeholder="กรอกรหัสเก่า"
                                style={{ paddingRight: "2.5rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                style={{
                                    position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                                    background: "none", border: "none", cursor: "pointer",
                                    fontSize: "1.1rem", color: "#888", padding: "4px",
                                }}
                                tabIndex={-1}
                            >
                                {showOld ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPwd}
                                onChange={(e) => setNewPwd(e.target.value)}
                                placeholder="กรอกรหัสใหม่"
                                style={{ paddingRight: "2.5rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                style={{
                                    position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                                    background: "none", border: "none", cursor: "pointer",
                                    fontSize: "1.1rem", color: "#888", padding: "4px",
                                }}
                                tabIndex={-1}
                            >
                                {showNew ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>
                        🔑 เปลี่ยนรหัสผ่าน
                    </button>
                </form>
            </div>
        </section>
    );
}
