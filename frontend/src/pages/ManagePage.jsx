import React, { useState, useEffect, useCallback } from "react";
import { getReports, updateReportStatus, updateReportFeedback, uploadCompletionImages } from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const STATUS_GROUPS = [
    { key: "รอรับเรื่อง", label: "📨 รอรับเรื่อง", color: "#ffc107", bgColor: "rgba(255, 193, 7, 0.08)", borderColor: "rgba(255, 193, 7, 0.25)" },
    { key: "กำลังดำเนินการ", label: "🔧 กำลังดำเนินการ", color: "#4fc3f7", bgColor: "rgba(109, 221, 255, 0.08)", borderColor: "rgba(109, 221, 255, 0.25)" },
    { key: "เสร็จสิ้น", label: "✅ เสร็จสิ้น", color: "#28a745", bgColor: "rgba(40, 167, 69, 0.08)", borderColor: "rgba(40, 167, 69, 0.25)" },
];

export default function ManagePage() {
    const { user } = useAuth();
    const isTech = user?.role === "tech";
    const [reports, setReports] = useState([]);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, reportId: null });
    const [lightbox, setLightbox] = useState(null);
    const [uploading, setUploading] = useState(null);
    const [expandedCards, setExpandedCards] = useState({});
    const [sortBy, setSortBy] = useState("priority");

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
        } catch (e) { alert("❌ " + e.message); }
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

    function toggleExpand(id) {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    }

    // Sort reports
    const sortedReports = [...reports].sort((a, b) => {
        if (sortBy === "priority") return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Group by status
    const grouped = {};
    STATUS_GROUPS.forEach(g => { grouped[g.key] = []; });
    sortedReports.forEach(r => {
        if (grouped[r.status]) grouped[r.status].push(r);
        else if (grouped["รอรับเรื่อง"]) grouped["รอรับเรื่อง"].push(r);
    });

    const totalReports = reports.length;

    return (
        <section>
            <h3>⚙️ จัดการงาน</h3>

            {/* Summary Bar */}
            <div className="manage-summary">
                {STATUS_GROUPS.map(g => (
                    <div key={g.key} className="manage-summary-item" style={{ borderLeft: `4px solid ${g.color}` }}>
                        <span className="manage-summary-count" style={{ color: g.color }}>{grouped[g.key]?.length || 0}</span>
                        <span className="manage-summary-label">{g.label}</span>
                    </div>
                ))}
                <div className="manage-summary-item" style={{ borderLeft: "4px solid #888" }}>
                    <span className="manage-summary-count" style={{ color: "#aaa" }}>{totalReports}</span>
                    <span className="manage-summary-label">📋 ทั้งหมด</span>
                </div>
            </div>

            {/* Sort */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="status-select" style={{ minWidth: "160px" }}>
                    <option value="priority">⚠️ เรียงตามความสำคัญ</option>
                    <option value="date">🕐 เรียงตามวันที่</option>
                </select>
            </div>

            {/* Status Groups */}
            {STATUS_GROUPS.map(group => {
                const items = grouped[group.key] || [];
                return (
                    <div key={group.key} className="manage-group" style={{ marginBottom: "2rem" }}>
                        {/* Group Header */}
                        <div className="manage-group-header" style={{
                            background: group.bgColor,
                            border: `1px solid ${group.borderColor}`,
                            borderRadius: "12px",
                            padding: "0.75rem 1.25rem",
                            marginBottom: "1rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <h4 style={{ margin: 0, color: group.color, fontSize: "1.05rem" }}>
                                {group.label}
                            </h4>
                            <span style={{
                                background: group.color,
                                color: "#111",
                                padding: "2px 12px",
                                borderRadius: "20px",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                            }}>
                                {items.length} รายการ
                            </span>
                        </div>

                        {/* Cards */}
                        {items.length === 0 ? (
                            <div style={{
                                textAlign: "center", padding: "1.5rem", color: "#666",
                                background: "rgba(255,255,255,0.02)", borderRadius: "10px",
                                border: "1px dashed rgba(255,255,255,0.08)",
                            }}>
                                ไม่มีรายการ
                            </div>
                        ) : (
                            <div className="manage-cards-grid">
                                {items.map((r, idx) => {
                                    const isExpanded = expandedCards[r.reportId || r._id];
                                    const daysAgo = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000);
                                    return (
                                        <div key={r.reportId || r._id}
                                            className="manage-card"
                                            style={{ borderLeft: `4px solid ${group.color}` }}
                                        >
                                            {/* Card Header */}
                                            <div className="manage-card-header" onClick={() => toggleExpand(r.reportId || r._id)}>
                                                <div className="manage-card-title-row">
                                                    <span className="manage-card-number" style={{ color: group.color }}>
                                                        #{idx + 1}
                                                    </span>
                                                    <strong className="accent-text" style={{ fontSize: "0.95rem" }}>
                                                        RPT-{String(r.reportId).padStart(3, "0")}
                                                    </strong>
                                                    <span className="priority-badge" style={{
                                                        background: PRIORITY_COLOR[r.priority],
                                                        fontSize: "0.75rem", padding: "2px 8px",
                                                    }}>
                                                        ⚠️ {PRIORITY_TEXT[r.priority] || "ปกติ"}
                                                    </span>
                                                </div>
                                                <span className="manage-card-toggle">
                                                    {isExpanded ? "▲" : "▼"}
                                                </span>
                                            </div>

                                            {/* Card Info */}
                                            <div className="manage-card-info">
                                                <div className="manage-card-meta">
                                                    <span>📂 {r.category}{r.customCategory ? ` (${r.customCategory})` : ""}</span>
                                                    <span>👤 {r.owner}</span>
                                                    <span>📅 {daysAgo === 0 ? "วันนี้" : `${daysAgo} วันที่แล้ว`}</span>
                                                </div>
                                                {r.location && (
                                                    <div style={{ color: "#4fc3f7", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                                        🏠 สถานที่: {r.location}
                                                    </div>
                                                )}
                                                <div className="manage-card-detail">{r.detail}</div>
                                            </div>

                                            {/* Actions */}
                                            <div className="manage-card-actions">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => changeStatus(r.reportId, e.target.value)}
                                                    className="status-select"
                                                    style={{ flex: 1 }}
                                                >
                                                    <option>รอรับเรื่อง</option>
                                                    <option>กำลังดำเนินการ</option>
                                                    <option>เสร็จสิ้น</option>
                                                </select>
                                                <button
                                                    className="btn-feedback"
                                                    onClick={() => setFeedbackModal({ open: true, reportId: r.reportId })}
                                                >
                                                    📝 หมายเหตุ
                                                </button>
                                            </div>

                                            {/* Feedback Box */}
                                            {r.feedback && (
                                                <div className="feedback-box">
                                                    💬 หมายเหตุจาก{r.feedbackBy === "admin" ? "แอดมิน" : "ช่าง"}: {r.feedback}
                                                </div>
                                            )}

                                            {/* Expanded Detail */}
                                            {isExpanded && (
                                                <div className="manage-card-expanded">
                                                    {/* Evidence Images */}
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

                                                    {/* Completion Upload */}
                                                    <div style={{
                                                        marginTop: "0.75rem", padding: "0.75rem",
                                                        background: "linear-gradient(135deg, rgba(40, 167, 69, 0.08), rgba(40, 167, 69, 0.02))",
                                                        border: "1px solid rgba(40, 167, 69, 0.2)", borderRadius: "10px",
                                                    }}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                                            <strong style={{ color: "#28a745", fontSize: "0.9rem" }}>
                                                                📸 {isTech ? "แนบรูปงานเสร็จ" : "รูปงานเสร็จจากช่าง"} {r.completionImages?.length > 0 ? `(${r.completionImages.length} รูป)` : ""}
                                                            </strong>
                                                            {isTech && (
                                                                <label style={{
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
                                                            <div style={{ fontSize: "0.8rem", color: "#888" }}>
                                                                {isTech ? 'ยังไม่มีรูปซ่อมเสร็จ — กดปุ่ม "เลือกรูป" เพื่อแนบหลักฐาน' : "ช่างยังไม่ได้แนบรูปซ่อมเสร็จ"}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Timeline */}
                                                    <div className="manage-card-timeline">
                                                        <div className="timeline-item" style={{ color: "#4fc3f7" }}>
                                                            📅 แจ้งเมื่อ: <strong>{new Date(r.createdAt).toLocaleString("th-TH")}</strong>
                                                        </div>
                                                        {r.startedAt && (
                                                            <div className="timeline-item" style={{ color: "#ffc107" }}>
                                                                🔧 ช่างรับเรื่อง: <strong>{new Date(r.startedAt).toLocaleString("th-TH")}</strong>
                                                            </div>
                                                        )}
                                                        {r.completedAt && (
                                                            <div className="timeline-item" style={{ color: "#28a745" }}>
                                                                ✅ เสร็จ: <strong>{new Date(r.completedAt).toLocaleString("th-TH")}</strong>
                                                                {r.startedAt && (
                                                                    <span> (ใช้เวลา {Math.max(1, Math.ceil((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 86400000))} วัน)</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Rating */}
                                                    {r.rating > 0 && (
                                                        <div style={{ marginTop: "0.5rem", color: "#ffc107" }}>
                                                            ⭐ คะแนนจากลูกบ้าน: {"⭐".repeat(r.rating)} ({r.rating}/5)
                                                        </div>
                                                    )}

                                                    {/* Like / Dislike */}
                                                    <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                                                        <span className="like-text">👍 พอใจ: {r.likesCount || 0}</span>
                                                        {" | "}
                                                        <span className="dislike-text">👎 ไม่พอใจ: {r.dislikesCount || 0}</span>
                                                    </div>

                                                    {/* Comments */}
                                                    {r.comments && r.comments.length > 0 && (
                                                        <div className="comments-section">
                                                            <strong>💬 ความคิดเห็น ({r.comments.length}):</strong>
                                                            {r.comments.map((c, i) => (
                                                                <div key={c.commentId || i} className="comment-item">
                                                                    <span className="comment-author">{c.author}</span>
                                                                    <span className="comment-date">{new Date(c.createdAt).toLocaleString("th-TH")}</span>
                                                                    <p className="comment-text">{c.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

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
