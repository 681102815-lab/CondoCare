import React, { useState, useEffect, useCallback } from "react";
import { getReports, updateReportStatus, updateReportFeedback } from "../api";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ManagePage() {
    const [reports, setReports] = useState([]);

    const reload = useCallback(() => {
        getReports()
            .then((all) => setReports(all.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))))
            .catch(console.error);
    }, []);

    useEffect(() => { reload(); }, [reload]);

    async function changeStatus(id, status) {
        try { await updateReportStatus(id, status); reload(); } catch (e) { console.error(e); }
    }

    async function handleFeedback(id) {
        const feedback = prompt("เพิ่มหมายเหตุ:");
        if (!feedback?.trim()) return;
        try { await updateReportFeedback(id, feedback); reload(); } catch (e) { console.error(e); }
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
                                            <button className="btn-ghost-sm" onClick={() => handleFeedback(r.reportId)}>✏️</button>
                                        </td>
                                    </tr>
                                    <tr className="detail-row">
                                        <td colSpan={7}>
                                            <strong>📝 รายละเอียด:</strong> {r.detail}
                                            {r.feedback && <><br /><strong className="accent-text">💬 หมายเหตุ:</strong> {r.feedback}</>}
                                            <br />
                                            <span className="like-text">👍 ถูกใจ: {r.likesCount || 0}</span>
                                            {" | "}
                                            <span className="dislike-text">👎 ไม่ถูกใจ: {r.dislikesCount || 0}</span>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            }
        </section >
    );
}
