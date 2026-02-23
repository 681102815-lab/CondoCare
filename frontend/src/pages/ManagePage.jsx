import React, { useState, useEffect, useCallback } from "react";
import { getReports, updateReportStatus, updateReportFeedback, uploadCompletionImages } from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ManagePage() {
    const { user } = useAuth();
    const isTech = user?.role === "tech";
    const [reports, setReports] = useState([]);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, reportId: null });
    const [lightbox, setLightbox] = useState(null);
    const [uploading, setUploading] = useState(null);
    const [sortBy, setSortBy] = useState("priority"); // priority, date
    const [statusFilter, setStatusFilter] = useState("all");

    const reload = useCallback(() => {
        getReports().then(setReports).catch(console.error);
    }, []);

    useEffect(() => { reload(); }, [reload]);

    async function changeStatus(id, status) {
        try { await updateReportStatus(id, status); reload(); } catch (e) { alert("❌ " + e.message); }
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

    async function handleCompletionUpload(reportId, e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(reportId);
        try {
            await uploadCompletionImages(reportId, files);
            reload();
        } catch (err) {
            alert("❌ " + err.message);
        } finally {
            setUploading(null);
        }
    }

    // Sort + filter
    let displayReports = [...reports];
    if (statusFilter !== "all") {
        displayReports = displayReports.filter(r => r.status === statusFilter);
    }
    if (sortBy === "priority") {
        displayReports.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
    } else {
        displayReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return (
        <section>
            <h3>⚙️ จัดการงาน</h3>

            {/* Sort + Filter */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="status-select" style={{ minWidth: "140px" }}>
                    <option value="priority">⚠️ เรียงตามความสำคัญ</option>
                    <option value="date">🕐 เรียงตามวันที่</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-select" style={{ minWidth: "140px" }}>
                    <option value="all">ทุกสถานะ</option>
                    <option value="รอรับเรื่อง">📨 รอรับเรื่อง</option>
                    <option value="กำลังดำเนินการ">🔧 กำลังดำเนินการ</option>
                    <option value="เสร็จสิ้น">✅ เสร็จสิ้น</option>
                </select>
                <span className="muted" style={{ alignSelf: "center", fontSize: "0.85rem" }}>
                    แสดง {displayReports.length} / {reports.length} งาน
                </span>
            </div>

            {displayReports.length === 0 ? (
                <div className="empty-state">📭 ไม่มี Report {statusFilter !== "all" ? `(สถานะ: ${statusFilter})` : ""}</div>
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
                            {displayReports.map((r) => (
                                <React.Fragment key={r.reportId || r._id}>
                                    <tr>
                                        <td><strong className="accent-text">RPT-{String(r.reportId).padStart(3, "0")}</strong></td>
                                        <td>{r.category}{r.customCategory ? ` (${r.customCategory})` : ""}</td>
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
                                            <button
                                                className="btn-feedback"
                                                onClick={() => setFeedbackModal({ open: true, reportId: r.reportId })}
                                                title="เพิ่มหมายเหตุ"
                                            >
                                                📝 หมายเหตุ
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="detail-row">
                                        <td colSpan={7}>
                                            <strong>📝 รายละเอียด:</strong> {r.detail}
                                            {r.location && <div style={{ margin: "0.3rem 0", color: "#4fc3f7" }}>🏠 สถานที่: {r.location}</div>}

                                            {r.images && r.images.length > 0 && (
                                                <div className="report-images" style={{ marginTop: "0.5rem" }}>
                                                    <strong>📷 รูปหลักฐานจากผู้แจ้ง:</strong>
                                                    <div className="image-gallery">
                                                        {r.images.map((url, i) => (
                                                            <img key={i} src={url} alt={`evidence-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ช่างอัปโหลดรูปซ่อมเสร็จ */}
                                            <div className="completion-upload-section" style={{
                                                marginTop: "0.75rem", padding: "0.75rem",
                                                background: "linear-gradient(135deg, rgba(40, 167, 69, 0.08), rgba(40, 167, 69, 0.02))",
                                                border: "1px solid rgba(40, 167, 69, 0.2)", borderRadius: "10px",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                                    <strong style={{ color: "#28a745", fontSize: "0.9rem" }}>
                                                        📸 {isTech ? "แนบรูปงานเสร็จ" : "รูปงานเสร็จจากช่าง"} {r.completionImages?.length > 0 ? `(${r.completionImages.length} รูป)` : ""}
                                                    </strong>
                                                    {isTech && (
                                                        <label className="btn-upload-completion" style={{
                                                            display: "inline-flex", alignItems: "center", gap: "6px",
                                                            padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                                                            background: uploading === r.reportId ? "rgba(255, 193, 7, 0.15)" : "rgba(40, 167, 69, 0.15)",
                                                            color: uploading === r.reportId ? "#ffc107" : "#28a745",
                                                            border: `1px solid ${uploading === r.reportId ? "rgba(255, 193, 7, 0.3)" : "rgba(40, 167, 69, 0.3)"}`,
                                                            fontSize: "0.85rem", fontWeight: 600,
                                                        }}>
                                                            {uploading === r.reportId ? "⏳ กำลังอัปโหลด..." : "📷 เลือกรูป"}
                                                            <input type="file" accept="image/*" multiple style={{ display: "none" }}
                                                                onChange={(e) => handleCompletionUpload(r.reportId, e)}
                                                                disabled={uploading === r.reportId} />
                                                        </label>
                                                    )}
                                                </div>
                                                {r.completionImages && r.completionImages.length > 0 ? (
                                                    <div className="image-gallery">
                                                        {r.completionImages.map((url, i) => (
                                                            <img key={i} src={url} alt={`completion-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: "0.8rem", color: "#888", padding: "0.5rem 0" }}>
                                                        {isTech ? 'ยังไม่มีรูปซ่อมเสร็จ — กดปุ่ม "เลือกรูป" เพื่อแนบหลักฐาน' : "ช่างยังไม่ได้แนบรูปซ่อมเสร็จ"}
                                                    </div>
                                                )}
                                            </div>

                                            {r.feedback && (
                                                <div style={{ marginTop: "0.5rem" }}>
                                                    <strong className="accent-text">
                                                        💬 หมายเหตุจาก{r.feedbackBy === "admin" ? "แอดมิน" : "ช่าง"}:
                                                    </strong> {r.feedback}
                                                </div>
                                            )}

                                            {/* Timeline */}
                                            <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid #333", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                                                <span style={{ color: "#4fc3f7" }}>
                                                    📅 แจ้งเมื่อ: <strong>{new Date(r.createdAt).toLocaleString("th-TH")}</strong>
                                                    {" "}({Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000)} วันที่แล้ว)
                                                </span>
                                                {r.startedAt && (
                                                    <span style={{ color: "#ffc107" }}>
                                                        🔧 ช่างรับเรื่อง: <strong>{new Date(r.startedAt).toLocaleString("th-TH")}</strong>
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

                                            {/* Rating */}
                                            {r.rating > 0 && (
                                                <div style={{ marginTop: "0.5rem", color: "#ffc107" }}>
                                                    ⭐ คะแนนจากลูกบ้าน: {"⭐".repeat(r.rating)} ({r.rating}/5)
                                                </div>
                                            )}

                                            <div style={{ marginTop: "0.5rem" }}>
                                                <span className="like-text">👍 พอใจ: {r.likesCount || 0}</span>
                                                {" | "}
                                                <span className="dislike-text">👎 ไม่พอใจ: {r.dislikesCount || 0}</span>
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
                title="📝 เพิ่มหมายเหตุการดำเนินการ"
                onClose={() => setFeedbackModal({ open: false, reportId: null })}
                onSubmit={handleFeedbackSubmit}
                fields={[
                    { name: "feedback", label: "หมายเหตุ", placeholder: "ระบุสาเหตุหรือรายละเอียดการแก้ไข...", required: true },
                ]}
            />

            {lightbox && (
                <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="full" className="lightbox-image" />
                    <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
                </div>
            )}
        </section>
    );
}
