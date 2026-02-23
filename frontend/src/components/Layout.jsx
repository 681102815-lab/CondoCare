import { useState } from "react";
import { useAuth } from "../AuthContext";
import { changePassword, updateName } from "../api";
import Modal from "./Modal";

const NAV_ITEMS = [
    { key: "overview", label: "📊 ภาพรวม", roles: ["admin", "tech", "resident"] },
    { key: "report", label: "📋 แจ้งปัญหา", techLabel: "📋 รายการแจ้ง", roles: ["admin", "tech", "resident"] },
    { key: "done", label: "✅ งานเสร็จแล้ว", roles: ["resident"] },
    { key: "manage", label: "⚙️ จัดการงาน", roles: ["admin", "tech"] },
    { key: "users", label: "👥 สมาชิก", roles: ["admin"] },
    { key: "profile", label: "👤 ตั้งค่าโปรไฟล์", roles: ["admin", "tech", "resident"] },
];

export default function Layout({ children, activePage, onNavigate }) {
    const { user, logout, updateUser } = useAuth();
    const [toast, setToast] = useState(null);

    const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
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
                            <span className="user-role">{user?.role === "admin" ? "👑 แอดมิน" : user?.role === "tech" ? "🔧 ช่าง" : "🏠 ผู้พักอาศัย"}</span>
                        </span>
                    </div>
                    <button className="btn-ghost" onClick={logout}>
                        🚪 ออกจากระบบ
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
                            {/* Tech เห็น "รายการแจ้ง" แทน "แจ้งปัญหา" */}
                            {item.techLabel && user?.role === "tech" ? item.techLabel : item.label}
                        </button>
                    ))}
                </aside>

                <main className="main-content card">{children}</main>
            </div>
        </div>
    );
}
