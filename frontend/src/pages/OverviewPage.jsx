import { useState, useEffect } from "react";
import { getReports } from "../api";
import { useAuth } from "../AuthContext";

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function OverviewPage({ onNavigate }) {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState("all"); // all, month, pending

    useEffect(() => {
        getReports().then(setReports).catch(console.error);
    }, []);

    // Filter logic
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const filtered = filter === "month"
        ? reports.filter(r => { const d = new Date(r.createdAt); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") === thisMonth; })
        : filter === "pending"
            ? reports.filter(r => r.status !== "เสร็จสิ้น")
            : reports;

    const total = filtered.length;
    const done = filtered.filter(r => r.status === "เสร็จสิ้น").length;
    const doing = filtered.filter(r => r.status === "กำลังดำเนินการ").length;
    const wait = filtered.filter(r => r.status === "รอรับเรื่อง").length;
    const critical = filtered.filter(r => r.priority === "critical" && r.status !== "เสร็จสิ้น").length;
    const high = filtered.filter(r => r.priority === "high" && r.status !== "เสร็จสิ้น").length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const cats = {};
    filtered.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];

    // งานเสร็จรายเดือน
    const monthly = {};
    reports.filter(r => r.status === "เสร็จสิ้น").forEach(r => {
        const d = new Date(r.createdAt);
        if (isNaN(d)) return;
        const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        monthly[k] = (monthly[k] || 0) + 1;
    });
    const monthEntries = Object.entries(monthly).sort().reverse();
    const avgPerMonth = monthEntries.length > 0 ? Math.round(done / monthEntries.length) : 0;

    const isResident = user?.role === "resident";

    return (
        <section>
            <h3>📊 ภาพรวมระบบ</h3>

            {/* Filter buttons */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {[
                    { key: "all", label: "📋 ทั้งหมด" },
                    { key: "month", label: "📅 เดือนนี้" },
                    { key: "pending", label: "⏳ ยังไม่เสร็จ" },
                ].map(f => (
                    <button
                        key={f.key}
                        className={`btn-filter ${filter === f.key ? "active" : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Main stat cards — จัดตามลำดับความสำคัญ */}
            <div className="stats-grid-3">
                {critical > 0 && (
                    <div
                        className="stat-card danger clickable"
                        onClick={() => onNavigate && onNavigate("manage")}
                        title="คลิกเพื่อดูรายละเอียด"
                    >
                        <div className="stat-value">{critical}</div>
                        <div className="stat-label">🔴 งานวิกฤต</div>
                        <div className="stat-sub">ต้องดำเนินการเร่งด่วน</div>
                    </div>
                )}
                {high > 0 && (
                    <div
                        className="stat-card warning clickable"
                        onClick={() => onNavigate && onNavigate("manage")}
                        title="คลิกเพื่อดูรายละเอียด"
                    >
                        <div className="stat-value">{high}</div>
                        <div className="stat-label">🟡 งานสำคัญสูง</div>
                        <div className="stat-sub">ควรดำเนินการโดยเร็ว</div>
                    </div>
                )}
                <div
                    className="stat-card accent clickable"
                    onClick={() => onNavigate && onNavigate("manage")}
                    title="คลิกเพื่อดูรายละเอียด"
                >
                    <div className="stat-value">{wait}</div>
                    <div className="stat-label">📨 รอรับเรื่อง</div>
                    <div className="stat-sub">ยังไม่มีช่างรับงาน</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-value">{doing}</div>
                    <div className="stat-label">🔧 กำลังดำเนินการ</div>
                    <div className="stat-sub">ช่างกำลังซ่อม</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-value">{done}</div>
                    <div className="stat-label">✅ เสร็จสิ้นแล้ว</div>
                    <div className="stat-sub">{rate}% ของทั้งหมด ({total} งาน)</div>
                </div>
            </div>

            {/* รอดำเนินการรวม */}
            {(wait + doing) > 0 && (
                <div
                    className="stat-bar warning clickable"
                    onClick={() => onNavigate && onNavigate("manage")}
                    style={{ cursor: "pointer" }}
                >
                    ⏳ รอดำเนินการทั้งหมด: <strong>{wait + doing}</strong> งาน (รอรับเรื่อง {wait} + กำลังทำ {doing})
                </div>
            )}

            {/* ปัญหาที่แจ้งมากที่สุด — ซ่อนจาก resident */}
            {!isResident && top && (
                <div className="stat-bar danger">
                    <div className="stat-bar-title">🔥 ปัญหาที่มีการแจ้งมากที่สุด</div>
                    <div className="stat-bar-value">{top[0]}</div>
                    <div className="stat-bar-sub">{top[1]} งาน ({Math.round((top[1] / Math.max(total, 1)) * 100)}%)</div>
                </div>
            )}

            {/* จำนวนตามประเภท — คลิกได้ */}
            {!isResident && (
                <div className="cat-grid">
                    {sorted.map(([cat, count]) => (
                        <div key={cat} className="cat-card clickable" onClick={() => onNavigate && onNavigate("manage")}>
                            <div className="cat-count">{count}</div>
                            <div className="cat-name">{cat}</div>
                        </div>
                    ))}
                </div>
            )}

            <hr className="divider" />
            <h4 className="section-title">📈 งานเสร็จรายเดือน</h4>
            {monthEntries.length > 0 ? (
                <>
                    <p className="muted small">📊 รวม {done} งาน | เฉลี่ย {avgPerMonth} งาน/เดือน</p>
                    <div className="monthly-list">
                        {monthEntries.map(([k, v]) => (
                            <div key={k} className="monthly-row">
                                <div><strong>{k}:</strong> <span className="accent-text">{v}</span> งาน</div>
                                <span className="muted">{Math.round((v / Math.max(done, 1)) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="muted">ยังไม่มีงานเสร็จ</p>
            )}
        </section>
    );
}
