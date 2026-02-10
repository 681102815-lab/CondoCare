import { useState, useCallback } from "react";
import { getReports, createReport, deleteReport, toggleLike, toggleDislike, addComment } from "../api";
import { useAuth } from "../AuthContext";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };

export default function ReportPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState(() => getReports().filter((x) => x.owner === user?.username));
    const [cat, setCat] = useState("ไฟฟ้า");
    const [priority, setPriority] = useState("medium");
    const [detail, setDetail] = useState("");

    const reload = useCallback(() => {
        setReports(getReports().filter((x) => x.owner === user?.username));
    }, [user]);

    function submit(e) {
        e.preventDefault();
        if (!detail.trim()) { alert("❌ กรุณากรอกรายละเอียด"); return; }
        createReport({ category: cat, detail, priority, owner: user.username });
        setDetail("");
        setPriority("medium");
        alert("✓ ส่ง Report สำเร็จ!");
        reload();
    }

    function handleDelete(id) {
        if (!confirm("ต้องการลบงานนี้หรือไม่?")) return;
        deleteReport(id);
        reload();
    }

    function handleLike(id) { toggleLike(id, user.username); reload(); }
    function handleDislike(id) { toggleDislike(id, user.username); reload(); }
    function handleComment(id) {
        const text = prompt("เพิ่มความเห็น:");
        if (!text?.trim()) return;
        addComment(id, user.username, text);
        reload();
    }

    function statusClass(s) {
        if (s === "รอรับเรื่อง") return "wait";
        if (s === "กำลังดำเนินการ") return "doing";
        return "done";
    }

    return (
        <section>
            <h3>📋 Report ปัญหา</h3>

            <form className="report-form" onSubmit={submit}>
                <div className="form-row">
                    <div className="input-group">
                        <label>📌 ประเภท</label>
                        <select value={cat} onChange={(e) => setCat(e.target.value)}>
                            <option>ไฟฟ้า</option>
                            <option>ประปา</option>
                            <option>ลิฟต์</option>
                            <option>อื่นๆ</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>⚠️ ความสำคัญ</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="low">ต่ำ - Low</option>
                            <option value="medium">ปกติ - Medium</option>
                            <option value="high">สูง - High</option>
                            <option value="critical">วิกฤต - Critical</option>
                        </select>
                    </div>
                </div>
                <div className="input-group">
                    <label>📝 รายละเอียด</label>
                    <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="อธิบายปัญหาที่พบ..." rows={4} />
                </div>
                <button type="submit" className="btn-primary full-width">
                    📤 ส่ง Report
                </button>
            </form>

            <h4 className="section-title">📊 Report ของฉัน</h4>

            {reports.length === 0 ? (
                <div className="empty-state">📭 ยังไม่มี Report</div>
            ) : (
                reports.map((r) => (
                    <div key={r.reportId} className={`report-card border-${statusClass(r.status)}`}>
                        <div className="report-header">
                            <strong>#{r.reportId} - {r.category}</strong>
                            <span className={`tag ${statusClass(r.status)}`}>{r.status}</span>
                            <span className="priority-badge" style={{ background: PRIORITY_COLOR[r.priority] }}>
                                ⚠️ {PRIORITY_TEXT[r.priority] || "ปกติ"}
                            </span>
                        </div>
                        <div className="report-date">📅 {new Date(r.createdAt).toLocaleString("th-TH")}</div>
                        <div className="report-detail">{r.detail}</div>

                        {r.feedback && (
                            <div className="feedback-box">
                                <strong>💬 ตอบกลับจากช่าง:</strong><br />{r.feedback}
                            </div>
                        )}

                        <div className="report-actions">
                            <button className="btn-like" onClick={() => handleLike(r.reportId)}>👍 {r.likesCount || 0}</button>
                            <button className="btn-dislike" onClick={() => handleDislike(r.reportId)}>👎 {r.dislikesCount || 0}</button>
                            {r.status === "เสร็จสิ้น" && <button className="btn-ghost-sm" onClick={() => handleComment(r.reportId)}>💬 ให้ความเห็น</button>}
                            <button className="btn-ghost-sm danger" onClick={() => handleDelete(r.reportId)}>🗑️ ลบ</button>
                        </div>
                    </div>
                ))
            )}
        </section>
    );
}
