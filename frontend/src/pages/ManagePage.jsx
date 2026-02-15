import React, { useState, useEffect, useCallback } from "react";
import { getReports, updateReportStatus, updateReportFeedback } from "../api";
import Modal from "../components/Modal";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ManagePage() {
    const [reports, setReports] = useState([]);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, reportId: null });

    const reload = useCallback(() => {
        getReports()
            .then((all) => setReports(all.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))))
            .catch(console.error);
    }, []);

    useEffect(() => { reload(); }, [reload]);

    async function changeStatus(id, status) {
        try { await updateReportStatus(id, status); reload(); } catch (e) { console.error(e); }
    }

    async function handleFeedbackSubmit(values) {
        if (!values.feedback?.trim()) return;
        try {
            await updateReportFeedback(feedbackModal.reportId, values.feedback);
            setFeedbackModal({ open: false, reportId: null });
            reload();
        } catch (e) {
            console.error(e);
            alert("❌ " + e.message);
        }
    }

    function statusClass(s) {
        if (s === "รอรับเรื่อง") return "wait";
        if (s === "กำลังดำเนินการ") return "doing";
        return "done";
    }

    return (
        <section>
            <h3>⚙️ จัดการงาน</h3>
            {reports.length === 0 ? (
                <div className="empty-state">📭 ไม่มี Report ที่จัดการ</div>
            ) : (
                <div className="table-wrapper">
                    <table className="manage-table">
                        <thead>
                            <tr>
                                <th>#ID</th>
                                <th>ประเภท</th>
                                <th>ผู้แจ้ง</th>
                                <th>วันที่</th>
                                <th>ความสำคัญ</th>
                                <th>สถานะ</th>
                                <th>การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => (
                                <React.Fragment key={r.reportId || r._id}>
                                    <tr>
                                        <td><strong className="accent-text">#{r.reportId}</strong></td>
                                        <td>{r.category}</td>
                                        <td><span className="owner-badge">{r.owner}</span></td>
                                        <td className="date-cell">{new Date(r.createdAt).toLocaleString("th-TH")}</td>
                                        <td>
                                            <span className="priority-badge" style={{ background: PRIORITY_COLOR[r.priority] }}>
                                                ⚠️ {PRIORITY_TEXT[r.priority] || "ปกติ"}
                                            </span>
                                        </td>
                                        <td><span className={`tag ${statusClass(r.status)}`}>{r.status}</span></td>
                                        <td className="actions-cell">
                                            <select
                                                value={r.status}
                                                onChange={(e) => changeStatus(r.reportId, e.target.value)}
                                                className="status-select"
                                            >
                                                <option>รอรับเรื่อง</option>
                                                <option>กำลังดำเนินการ</option>
                                                <option>เสร็จสิ้น</option>
                                            </select>
                                            <button className="btn-ghost-sm" onClick={() => setFeedbackModal({ open: true, reportId: r.reportId })}>✏️</button>
                                        </td>
                                    </tr>
                                    <tr className="detail-row">
                                        <td colSpan={7}>
                                            <strong>📝 รายละเอียด:</strong> {r.detail}
                                            {r.feedback && <><br /><strong className="accent-text">💬 หมายเหตุ:</strong> {r.feedback}</>}

                                            {/* ——— Timeline เวลา ——— */}
                                            <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #333", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                                                <span style={{ color: "#4fc3f7" }}>
                                                    📅 แจ้งเมื่อ: <strong>{new Date(r.createdAt).toLocaleString("th-TH")}</strong>
                                                    {" "}({Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000)} วันที่แล้ว)
                                                </span>
                                                {r.startedAt && (
                                                    <span style={{ color: "#ffc107" }}>
                                                        🔧 เริ่มงาน: <strong>{new Date(r.startedAt).toLocaleString("th-TH")}</strong>
                                                    </span>
                                                )}
                                                {r.completedAt && (
                                                    <span style={{ color: "#28a745" }}>
                                                        ✅ เสร็จ: <strong>{new Date(r.completedAt).toLocaleString("th-TH")}</strong>
                                                        {r.startedAt && (
                                                            <span> (ใช้เวลา {Math.max(1, Math.ceil((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 86400000))} วัน)</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ marginTop: "0.5rem" }}>
                                                <span className="like-text">👍 ถูกใจ: {r.likesCount || 0}</span>
                                                {" | "}
                                                <span className="dislike-text">👎 ไม่ถูกใจ: {r.dislikesCount || 0}</span>
                                            </div>
                                            {r.comments && r.comments.length > 0 && (
                                                <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #333" }}>
                                                    <strong>💬 ความคิดเห็น ({r.comments.length}):</strong>
                                                    {r.comments.map((c, i) => (
                                                        <div key={c.commentId || i} style={{ marginTop: "0.4rem", padding: "0.4rem 0.6rem", background: "#1a1a2e", borderRadius: "6px", fontSize: "0.85rem" }}>
                                                            <strong style={{ color: "#4fc3f7" }}>{c.author}</strong>
                                                            <span style={{ color: "#888", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                                                                {new Date(c.createdAt).toLocaleString("th-TH")}
                                                            </span>
                                                            <div style={{ marginTop: "0.2rem" }}>{c.text}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                open={feedbackModal.open}
                title="✏️ เพิ่มหมายเหตุ"
                onClose={() => setFeedbackModal({ open: false, reportId: null })}
                onSubmit={handleFeedbackSubmit}
                fields={[
                    { name: "feedback", label: "ข้อความ", placeholder: "ระบุสาเหตุหรือรายละเอียดการแก้ไข...", required: true },
                ]}
            />
        </section >
    );
}
