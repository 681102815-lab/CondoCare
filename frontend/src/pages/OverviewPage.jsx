import { useState, useEffect } from "react";
import { getReports } from "../api";
import { useAuth } from "../AuthContext";

export default function OverviewPage({ onNavigate }) {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState("all");

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

    function goManage() {
        if (onNavigate) onNavigate("manage");
    }

    return (
        <section>
            <h3>📊 ภาพรวมระบบแจ้งซ่อม</h3>

            {/* Filter buttons */}
            <div className="ov-filter-bar">
                {[
                    { key: "all", label: "📋 ข้อมูลทั้งหมด" },
                    { key: "month", label: "📅 เฉพาะเดือนนี้" },
                    { key: "pending", label: "⏳ เฉพาะงานค้าง" },
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

            {/* === Urgent Section (if any) === */}
            {(critical > 0 || high > 0) && (
                <div className="ov-urgent-section">
                    <h4 className="ov-section-header danger">🚨 งานเร่งด่วน</h4>
                    <div className="ov-urgent-cards">
                        {critical > 0 && (
                            <div className="ov-card ov-critical clickable" onClick={goManage}>
                                <div className="ov-card-value">{critical}</div>
                                <div className="ov-card-label">🔴 วิกฤต</div>
                                <div className="ov-card-sub">ต้องดำเนินการทันที</div>
                            </div>
                        )}
                        {high > 0 && (
                            <div className="ov-card ov-high clickable" onClick={goManage}>
                                <div className="ov-card-value">{high}</div>
                                <div className="ov-card-label">🟡 สำคัญสูง</div>
                                <div className="ov-card-sub">ควรดำเนินการโดยเร็ว</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === Status Section === */}
            <h4 className="ov-section-header">📋 สถานะงานแจ้งซ่อม</h4>
            <div className="ov-status-cards">
                <div className="ov-card ov-wait clickable" onClick={goManage}>
                    <div className="ov-card-value">{wait}</div>
                    <div className="ov-card-label">📨 รอรับเรื่อง</div>
                    <div className="ov-card-sub">ยังไม่มีช่างรับงาน</div>
                </div>
                <div className="ov-card ov-doing clickable" onClick={goManage}>
                    <div className="ov-card-value">{doing}</div>
                    <div className="ov-card-label">🔧 กำลังดำเนินการ</div>
                    <div className="ov-card-sub">ช่างกำลังซ่อมแซม</div>
                </div>
                <div className="ov-card ov-done" onClick={goManage} style={{ cursor: "pointer" }}>
                    <div className="ov-card-value">{done}</div>
                    <div className="ov-card-label">✅ ซ่อมเสร็จแล้ว</div>
                    <div className="ov-card-sub">{rate}% ของงานทั้งหมด {total} รายการ</div>
                </div>
            </div>

            {/* === Total Bar === */}
            <div className="ov-total-bar">
                📊 จำนวนงานแจ้งซ่อมทั้งหมด: <strong>{total}</strong> รายการ
                {(wait + doing) > 0 && (
                    <span className="ov-pending-note">
                        &nbsp;(ยังไม่เสร็จ <strong>{wait + doing}</strong> รายการ)
                    </span>
                )}
            </div>

            {/* === Category Breakdown (admin/tech only) === */}
            {!isResident && sorted.length > 0 && (
                <>
                    <h4 className="ov-section-header">📂 จำนวนตามประเภทปัญหา</h4>
                    <div className="ov-cat-grid">
                        {sorted.map(([cat, count]) => (
                            <div key={cat} className="ov-cat-card clickable" onClick={goManage}>
                                <div className="ov-cat-count">{count}</div>
                                <div className="ov-cat-name">{cat}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* === Monthly Report === */}
            <hr className="divider" />
            <h4 className="ov-section-header">📈 สรุปงานซ่อมเสร็จรายเดือน</h4>
            {monthEntries.length > 0 ? (
                <>
                    <p className="muted small">📊 รวม {done} รายการ | เฉลี่ย {avgPerMonth} รายการ/เดือน</p>
                    <div className="monthly-list">
                        {monthEntries.map(([k, v]) => (
                            <div key={k} className="monthly-row">
                                <div><strong>{k}:</strong> <span className="accent-text">{v}</span> รายการ</div>
                                <span className="muted">{Math.round((v / Math.max(done, 1)) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="muted">ยังไม่มีงานซ่อมเสร็จ</p>
            )}
        </section>
    );
}
