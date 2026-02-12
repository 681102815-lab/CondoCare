import { useState, useEffect, useCallback } from "react";
import { getReports, toggleLike, toggleDislike, addComment } from "../api";
import { useAuth } from "../AuthContext";

export default function DonePage() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);

    const reload = useCallback(() => {
        getReports()
            .then((all) => setReports(all.filter((x) => x.owner === user?.username && x.status === "เสร็จสิ้น")))
            .catch(console.error);
    }, [user]);

    useEffect(() => { reload(); }, [reload]);

    async function handleLike(id) { try { await toggleLike(id, user.username); reload(); } catch (e) { console.error(e); } }
    async function handleDislike(id) { try { await toggleDislike(id, user.username); reload(); } catch (e) { console.error(e); } }
    async function handleComment(id) {
        const text = prompt("เพิ่มความเห็น:");
        if (!text?.trim()) return;
        try { await addComment(id, user.username, text); reload(); } catch (e) { console.error(e); }
    }

    return (
        <section>
            <h3>✅ งานเสร็จแล้ว</h3>
            {reports.length === 0 ? (
                <div className="empty-state">ยังไม่มีงานเสร็จแล้ว</div>
            ) : (
                reports.map((r) => (
                    <div key={r.reportId || r._id} className="report-card border-done">
                        <strong>✅ {r.category}</strong>
                        <div className="report-date">📅 แจ้งเมื่อ: {new Date(r.createdAt).toLocaleString("th-TH")} | #{r.reportId}</div>
                        <div className="report-detail">{r.detail}</div>
                        {/* ——— Timeline ——— */}
                        <div style={{ margin: "0.5rem 0", padding: "0.5rem", background: "#1a1a2e", borderRadius: "8px", fontSize: "0.85rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            {r.startedAt && (
                                <span style={{ color: "#ffc107" }}>🔧 เริ่มงาน: {new Date(r.startedAt).toLocaleString("th-TH")}</span>
                            )}
                            {r.completedAt && (
                                <span style={{ color: "#28a745" }}>
                                    ✅ เสร็จ: {new Date(r.completedAt).toLocaleString("th-TH")}
                                    {r.startedAt && ` (ใช้เวลา ${Math.max(1, Math.ceil((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 86400000))} วัน)`}
                                </span>
                            )}
                        </div>
                        {r.feedback && (
                            <div className="feedback-box">
                                <strong>💬 หมายเหตุจากช่าง:</strong><br />{r.feedback}
                            </div>
                        )}
                        <div className="report-actions">
                            <button className="btn-like" onClick={() => handleLike(r.reportId)}>👍 {r.likesCount || 0}</button>
                            <button className="btn-dislike" onClick={() => handleDislike(r.reportId)}>👎 {r.dislikesCount || 0}</button>
                            <button className="btn-ghost-sm" onClick={() => handleComment(r.reportId)}>💬 ให้ความเห็น</button>
                        </div>
                    </div>
                ))
            )}
        </section>
    );
}
