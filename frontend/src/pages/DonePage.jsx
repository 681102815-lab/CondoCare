import { useState, useCallback } from "react";
import { getReports, toggleLike, toggleDislike, addComment } from "../api";
import { useAuth } from "../AuthContext";

export default function DonePage() {
    const { user } = useAuth();
    const [reports, setReports] = useState(() =>
        getReports().filter((x) => x.owner === user?.username && x.status === "เสร็จสิ้น")
    );

    const reload = useCallback(() => {
        setReports(getReports().filter((x) => x.owner === user?.username && x.status === "เสร็จสิ้น"));
    }, [user]);

    function handleLike(id) { toggleLike(id, user.username); reload(); }
    function handleDislike(id) { toggleDislike(id, user.username); reload(); }
    function handleComment(id) {
        const text = prompt("เพิ่มความเห็น:");
        if (!text?.trim()) return;
        addComment(id, user.username, text);
        reload();
    }

    return (
        <section>
            <h3>✅ งานเสร็จแล้ว</h3>
            {reports.length === 0 ? (
                <div className="empty-state">ยังไม่มีงานเสร็จแล้ว</div>
            ) : (
                reports.map((r) => (
                    <div key={r.reportId} className="report-card border-done">
                        <strong>✅ {r.category}</strong>
                        <div className="report-date">📅 {new Date(r.createdAt).toLocaleString("th-TH")} | #{r.reportId}</div>
                        <div className="report-detail">{r.detail}</div>

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
