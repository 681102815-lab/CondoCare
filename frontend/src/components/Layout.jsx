import { useState } from "react";
import { useAuth } from "../AuthContext";
import { changePassword, updateName } from "../api";

const NAV_ITEMS = [
    { key: "overview", label: "📊 ภาพรวม", roles: ["admin", "tech", "resident"] },
    { key: "report", label: "📋 แจ้งปัญหา", roles: ["admin", "tech", "resident"] },
    { key: "done", label: "✅ งานเสร็จแล้ว", roles: ["resident"] },
    { key: "manage", label: "⚙️ จัดการงาน", roles: ["admin", "tech"] },
    { key: "users", label: "👥 สมาชิก", roles: ["admin"] },
];

export default function Layout({ children, activePage, onNavigate }) {
    const { user, logout, updateUser } = useAuth();

    const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

    return (
        <div className="app-container">
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
                    <button
                        className="nav-link"
                        onClick={async () => {
                            const oldPw = prompt("กรอกรหัสเก่า:");
                            if (!oldPw) return;
                            const newPw = prompt("กรอกรหัสใหม่ (อย่างน้อย 4 ตัว):");
                            if (!newPw) return;
                            try {
                                await changePassword(oldPw, newPw);
                                alert("✅ เปลี่ยนรหัสผ่านสำเร็จ!");
                            } catch (err) {
                                alert("❌ " + err.message);
                            }
                        }}
                    >
                        🔑 เปลี่ยนรหัส
                    </button>
                    <button
                        className="nav-link"
                        onClick={async () => {
                            const newName = prompt("กรอกชื่อใหม่ (ชื่อแสดงผลเท่านั้น เลขห้องเปลี่ยนไม่ได้):");
                            if (!newName?.trim()) return;
                            try {
                                const res = await updateName(newName.trim());
                                updateUser({ name: res.firstName });
                                alert("✅ เปลี่ยนชื่อเป็น: " + res.firstName);
                            } catch (err) {
                                alert("❌ " + err.message);
                            }
                        }}
                    >
                        ✏️ แก้ชื่อ
                    </button>
                </aside>

                <main className="main-content card">{children}</main>
            </div>
        </div>
    );
}
