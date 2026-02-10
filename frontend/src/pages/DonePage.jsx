import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function DonePage() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);

    const load = useCallback(() => {
        api("/reports")
            .then((r) => setReports((r.data || []).filter((x) => x.owner === user?.username && x.status === "เสร็จสิ้น")))
            .catch(console.error);
    }, [user]);

    useEffect(() => { load(); }, [load]);

    async function toggleLike(id) {
        try { await api(`/reports/${id}/like`, { method: "POST", body: JSON.stringify({ username: user.username }) }); load(); } catch (e) { console.error(e); }
    }

    async function toggleDislike(id) {
        try { await api(`/reports/${id}/dislike`, { method: "POST", body: JSON.stringify({ username: user.username }) }); load(); } catch (e) { console.error(e); }
    }

    async function addComment(id) {
        const text = prompt("เพิ่มความเห็น:");
        if (!text?.trim()) return;
        try { await api(`/reports/${id}/comment`, { method: "POST", body: JSON.stringify({ author: user.username, text }) }); load(); } catch (e) { console.error(e); }
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
                        <div className="report-date">📅 {new Date(r.createdAt).toLocaleString("th-TH")} | #{r.reportId}</div>
                        <div className="report-detail">{r.detail}</div>

                        {r.feedback && (
                            <div className="feedback-box">
                                <strong>💬 หมายเหตุจากช่าง:</strong><br />{r.feedback}
                            </div>
                        )}

                        <div className="report-actions">
                            <button className="btn-like" onClick={() => toggleLike(r.reportId)}>👍 {r.likesCount || 0}</button>
                            <button className="btn-dislike" onClick={() => toggleDislike(r.reportId)}>👎 {r.dislikesCount || 0}</button>
                            <button className="btn-ghost-sm" onClick={() => addComment(r.reportId)}>💬 ให้ความเห็น</button>
                        </div>
                    </div>
                ))
            )}
        </section>
    );
}
