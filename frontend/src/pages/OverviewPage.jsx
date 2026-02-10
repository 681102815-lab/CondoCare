import { useState, useEffect } from "react";
import { getReports } from "../api";

export default function OverviewPage() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        setReports(getReports());
    }, []);

    const total = reports.length;
    const done = reports.filter((r) => r.status === "เสร็จสิ้น").length;
    const doing = reports.filter((r) => r.status === "กำลังดำเนินการ").length;
    const wait = reports.filter((r) => r.status === "รอรับเรื่อง").length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Category breakdown
    const cats = {};
    reports.forEach((r) => { cats[r.category] = (cats[r.category] || 0) + 1; });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];

    // Monthly done
    const monthly = {};
    reports.filter((r) => r.status === "เสร็จสิ้น").forEach((r) => {
        const d = new Date(r.createdAt);
        if (isNaN(d)) return;
        const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        monthly[k] = (monthly[k] || 0) + 1;
    });
    const monthEntries = Object.entries(monthly).sort().reverse();
    const avgPerMonth = monthEntries.length > 0 ? Math.round(done / monthEntries.length) : 0;

    return (
        <section>
            <h3>📊 ภาพรวมระบบ</h3>

            <div className="stats-grid-3">
                <div className="stat-card accent">
                    <div className="stat-value">{total}</div>
                    <div className="stat-label">ทั้งหมด</div>
                    <div className="stat-sub">งานทั้งสิ้น</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-value">{doing}</div>
                    <div className="stat-label">กำลังดำเนินการ</div>
                    <div className="stat-sub">{total > 0 ? Math.round((doing / total) * 100) : 0}% ของทั้งหมด</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-value">{done}</div>
                    <div className="stat-label">เสร็จสิ้น</div>
                    <div className="stat-sub">{rate}% สำเร็จ</div>
                </div>
            </div>

            <div className="stat-bar warning">
                ⏳ รอรับเรื่อง: {wait} ({total > 0 ? Math.round((wait / total) * 100) : 0}%)
            </div>

            <div className="stats-grid-2">
                <div className="stat-card-sm muted-border">
                    <div className="stat-value-sm">{doing + wait}</div>
                    <div className="stat-label-sm">งานที่เหลือ</div>
                </div>
                <div className="stat-card-sm danger-border">
                    <div className="stat-value-sm">{total - done}</div>
                    <div className="stat-label-sm">ยังไม่เสร็จสิ้น</div>
                </div>
            </div>

            {top && (
                <div className="stat-bar danger">
                    <div className="stat-bar-title">🔥 ปัญหาที่มีการแจ้งมากที่สุด</div>
                    <div className="stat-bar-value">{top[0]}</div>
                    <div className="stat-bar-sub">{top[1]} งาน ({Math.round((top[1] / total) * 100)}%)</div>
                </div>
            )}

            <div className="cat-grid">
                {sorted.map(([cat, count]) => (
                    <div key={cat} className="cat-card">
                        <div className="cat-count">{count}</div>
                        <div className="cat-name">{cat}</div>
                    </div>
                ))}
            </div>

            <hr className="divider" />

            <h4 className="section-title">📈 งานเสร็จรายเดือน</h4>
            {monthEntries.length > 0 ? (
                <>
                    <p className="muted small">📊 รวม {done} งาน | เฉลี่ย {avgPerMonth} งาน/เดือน</p>
                    <div className="monthly-list">
                        {monthEntries.map(([k, v]) => (
                            <div key={k} className="monthly-row">
                                <div><strong>{k}:</strong> <span className="accent-text">{v}</span> งาน</div>
                                <span className="muted">{Math.round((v / done) * 100)}%</span>
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
