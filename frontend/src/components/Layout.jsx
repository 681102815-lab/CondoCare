import { useState } from "react";
import { useAuth } from "../AuthContext";
import { changePassword, updateName } from "../api";
import Modal from "./Modal";

const NAV_ITEMS = [
    { key: "overview", label: "📊 ภาพรวม", roles: ["admin", "tech", "resident"] },
    { key: "report", label: "📋 แจ้งปัญหา", roles: ["admin", "tech", "resident"] },
    { key: "done", label: "✅ งานเสร็จแล้ว", roles: ["resident"] },
    { key: "manage", label: "⚙️ จัดการงาน", roles: ["admin", "tech"] },
    { key: "users", label: "👥 สมาชิก", roles: ["admin"] },
];

export default function Layout({ children, activePage, onNavigate }) {
    const { user, logout, updateUser } = useAuth();
    const [pwModal, setPwModal] = useState(false);
    const [nameModal, setNameModal] = useState(false);
    const [toast, setToast] = useState(null);

    const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function handlePasswordChange(values) {
        try {
            await changePassword(values.oldPassword, values.newPassword);
            setPwModal(false);
            showToast("✅ เปลี่ยนรหัสผ่านสำเร็จ!");
        } catch (err) {
            showToast("❌ " + err.message, "error");
        }
    }

    async function handleNameChange(values) {
        try {
            const res = await updateName(values.firstName);
            updateUser({ name: res.firstName });
            setNameModal(false);
            showToast("✅ เปลี่ยนชื่อเป็น: " + res.firstName);
        } catch (err) {
            showToast("❌ " + err.message, "error");
        }
    }

    return (
        <div className="app-container">
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
                    {toast.msg}
                </div>
            )}

            <header className="app-header card">
                <div className="header-left">
                    <h2 className="app-title">
                        <span className="title-icon">🏢</span> CondoCare
                    </h2>
                </div>
                <div className="header-right">
                    <div className="user-badge">
                        <span className="user-avatar">{user?.name?.[0] || "?"}</span>
                        <span className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </span>
                    </div>
                    <button className="btn-ghost" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="app-grid">
                <aside className="sidebar card">
                    {visibleItems.map((item) => (
                        <button
                            key={item.key}
                            className={`nav-link ${activePage === item.key ? "active" : ""}`}
                            onClick={() => onNavigate(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                    <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.5rem 0" }} />
                    <button className="nav-link" onClick={() => setPwModal(true)}>
                        🔑 เปลี่ยนรหัส
                    </button>
                    <button className="nav-link" onClick={() => setNameModal(true)}>
                        ✏️ แก้ชื่อ
                    </button>
                </aside>

                <main className="main-content card">{children}</main>
            </div>

            {/* Password Change Modal */}
            <Modal
                open={pwModal}
                title="🔑 เปลี่ยนรหัสผ่าน"
                onClose={() => setPwModal(false)}
                onSubmit={handlePasswordChange}
                fields={[
                    { name: "oldPassword", label: "รหัสผ่านเดิม", type: "password", placeholder: "กรอกรหัสเก่า" },
                    { name: "newPassword", label: "รหัสผ่านใหม่", type: "password", placeholder: "กรอกรหัสใหม่", minLength: 4, hint: "อย่างน้อย 4 ตัวอักษร" },
                ]}
            />

            {/* Name Change Modal */}
            <Modal
                open={nameModal}
                title="✏️ เปลี่ยนชื่อแสดงผล"
                onClose={() => setNameModal(false)}
                onSubmit={handleNameChange}
                fields={[
                    { name: "firstName", label: "ชื่อใหม่", placeholder: "กรอกชื่อแสดงผล", hint: "เลขห้องเปลี่ยนไม่ได้ เปลี่ยนได้เฉพาะชื่อแสดงผล" },
                ]}
            />
        </div>
    );
}
