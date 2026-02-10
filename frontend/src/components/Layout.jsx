import { useState } from "react";
import { useAuth } from "../AuthContext";

const NAV_ITEMS = [
    { key: "overview", label: "📊 ภาพรวม", roles: ["admin", "tech", "resident"] },
    { key: "report", label: "📋 แจ้งปัญหา", roles: ["admin", "tech", "resident"] },
    { key: "done", label: "✅ งานเสร็จแล้ว", roles: ["resident"] },
    { key: "manage", label: "⚙️ จัดการงาน", roles: ["admin", "tech"] },
];

export default function Layout({ children, activePage, onNavigate }) {
    const { user, logout } = useAuth();

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
                </aside>

                <main className="main-content card">{children}</main>
            </div>
        </div>
    );
}
