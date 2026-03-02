import { useState, useEffect, useCallback } from "react";
import { getReports, createReportWithImages, deleteReport, toggleCommentLike, toggleCommentDislike, addComment } from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const STATUS_CONFIG = {
    "รอรับเรื่อง": { icon: "📨", color: "#ffc107", bg: "rgba(255,193,7,0.08)", border: "rgba(255,193,7,0.25)" },
    "กำลังดำเนินการ": { icon: "🔧", color: "#4fc3f7", bg: "rgba(109,221,255,0.08)", border: "rgba(109,221,255,0.25)" },
    "เสร็จสิ้น": { icon: "✅", color: "#28a745", bg: "rgba(40,167,69,0.08)", border: "rgba(40,167,69,0.25)" },
};

function formatId(id) {
    const num = Number(id);
    if (num > 100000) return `RPT-${String(id).slice(-4)}`;
    return `RPT-${String(id).padStart(3, "0")}`;
}

function timeAgo(date) {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return "วันนี้";
    if (days === 1) return "เมื่อวาน";
    return `${days} วันที่แล้ว`;
}

export default function ReportPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [cat, setCat] = useState("ไฟฟ้า");
    const [customCat, setCustomCat] = useState("");
    const [priority, setPriority] = useState("medium");
    const [detail, setDetail] = useState("");
    const [location, setLocation] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [commentModal, setCommentModal] = useState({ open: false, reportId: null });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [lightbox, setLightbox] = useState(null);
    const [sortBy, setSortBy] = useState("date");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);

    const reload = useCallback(() => {
        getReports().then((all) => {
            const mine = user?.role === "resident"
                ? all.filter(x => x.owner === user?.username)
                : all;
            setReports(mine);
        }).catch(console.error);
    }, [user]);

    useEffect(() => { reload(); }, [reload]);

    function handleImageChange(e) {
        const files = Array.from(e.target.files || []);
        if (files.length > 5) { alert("แนบได้สูงสุด 5 รูป"); return; }
        setImages(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    }

    function removeImage(idx) {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
    }

    async function submit(e) {
        e.preventDefault();
        if (!detail.trim()) { alert("❌ กรุณากรอกรายละเอียด"); return; }
        if (cat === "อื่นๆ" && !customCat.trim()) { alert("❌ กรุณาระบุประเภทเพิ่มเติม"); return; }
        if (user?.role === "admin" && !location.trim()) { alert("❌ กรุณาระบุเลขห้อง/สถานที่"); return; }
        setSubmitting(true);
        try {
            await createReportWithImages({
                category: cat, customCategory: cat === "อื่นๆ" ? customCat : "",
                detail, priority, owner: user.username, location: location || "", images,
            });
            setDetail(""); setPriority("medium"); setCat("ไฟฟ้า"); setCustomCat("");
            setLocation(""); setImages([]); setPreviews([]); setShowForm(false);
            alert("✅ ส่ง Report สำเร็จ!"); reload();
        } catch (err) { alert("❌ " + err.message); } finally { setSubmitting(false); }
    }

    async function handleDelete(id, status) {
        if (status === "กำลังดำเนินการ") { alert("❌ ไม่สามารถลบ Report ที่กำลังดำเนินการได้"); return; }
        if (!confirm("ต้องการลบงานนี้หรือไม่?")) return;
        try { await deleteReport(id); reload(); } catch (e) { alert("❌ " + e.message); }
    }

    async function handleCommentLike(reportId, commentId) { try { await toggleCommentLike(reportId, commentId, user.username); reload(); } catch (e) { console.error(e); } }
    async function handleCommentDislike(reportId, commentId) { try { await toggleCommentDislike(reportId, commentId, user.username); reload(); } catch (e) { console.error(e); } }

    async function handleCommentSubmit(values) {
        if (!values.comment?.trim()) return;
        try {
            await addComment(commentModal.reportId, user.username, values.comment);
            setCommentModal({ open: false, reportId: null }); reload();
        } catch (e) { alert("❌ " + e.message); }
    }

    // Sort and filter
    let displayReports = [...reports];
    if (statusFilter !== "all") displayReports = displayReports.filter(r => r.status === statusFilter);
    if (sortBy === "priority") displayReports.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
    else displayReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const isAdmin = user?.role === "admin";
    const isTech = user?.role === "tech";

    // Counts
    const counts = { wait: 0, doing: 0, done: 0 };
    reports.forEach(r => {
        if (r.status === "รอรับเรื่อง") counts.wait++;
        else if (r.status === "กำลังดำเนินการ") counts.doing++;
        else counts.done++;
    });

    return (
        <section>
            <h3>{isTech ? "📋 รายการแจ้งซ่อม" : "📋 แจ้งปัญหา"}</h3>

            {/* ปุ่ม + แจ้งปัญหาใหม่ (toggle form) */}
            {!isTech && (
                <button
                    className="btn-primary full-width"
                    onClick={() => setShowForm(!showForm)}
                    style={{ marginBottom: "1.25rem", padding: "0.75rem" }}
                >
                    {showForm ? "✕ ปิดแบบฟอร์ม" : "➕ แจ้งปัญหาใหม่"}
                </button>
            )}

            {/* Form (collapsible) */}
            {!isTech && showForm && (
                <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", animation: "fadeIn 0.25s ease-out" }}>
                    <h4 style={{ marginBottom: "1rem", color: "var(--accent)" }}>📝 แบบฟอร์มแจ้งปัญหา</h4>
                    <form onSubmit={submit}>
                        <div className="form-row">
                            <div className="input-group">
                                <label>📌 ประเภท <span className="required">*</span></label>
                                <select value={cat} onChange={(e) => setCat(e.target.value)}>
                                    <option>ไฟฟ้า</option><option>ประปา</option><option>ลิฟต์</option>
                                    <option>แมลง/สัตว์</option><option>ความสะอาด</option><option>อื่นๆ</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>⚠️ ความสำคัญ <span className="required">*</span></label>
                                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                    <option value="low">ต่ำ</option><option value="medium">ปกติ</option>
                                    <option value="high">สูง</option><option value="critical">วิกฤต</option>
                                </select>
                            </div>
                        </div>
                        {cat === "อื่นๆ" && (
                            <div className="input-group">
                                <label>📎 ระบุประเภทเพิ่มเติม <span className="required">*</span></label>
                                <input type="text" value={customCat} onChange={(e) => setCustomCat(e.target.value)} placeholder="เช่น ระบบรักษาความปลอดภัย, ที่จอดรถ..." />
                            </div>
                        )}
                        {isAdmin && (
                            <div className="input-group">
                                <label>🏠 เลขห้อง / สถานที่ <span className="required">*</span></label>
                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="เช่น ห้อง 101, ล็อบบี้ชั้น 1" />
                            </div>
                        )}
                        <div className="input-group">
                            <label>📝 รายละเอียด <span className="required">*</span></label>
                            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="อธิบายปัญหาที่พบ..." rows={3} />
                        </div>
                        <div className="input-group">
                            <label>📷 แนบรูปหลักฐาน (สูงสุด 5 รูป)</label>
                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="file-input" />
                            {previews.length > 0 && (
                                <div className="image-preview-grid">
                                    {previews.map((src, i) => (
                                        <div key={i} className="preview-thumb">
                                            <img src={src} alt={`preview-${i}`} />
                                            <button type="button" className="remove-preview" onClick={() => removeImage(i)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn-primary full-width" disabled={submitting}>
                            {submitting ? "กำลังส่ง..." : `📤 ส่ง Report${images.length > 0 ? ` (${images.length} รูป)` : ""}`}
                        </button>
                    </form>
                </div>
            )}

            {/* Summary Badges */}
            <div className="rp-summary">
                <div className="rp-summary-badge" style={{ borderColor: "#ffc107" }}>
                    <span style={{ color: "#ffc107", fontWeight: 800, fontSize: "1.2rem" }}>{counts.wait}</span>
                    <span style={{ fontSize: "0.78rem", color: "#aaa" }}>📨 รอ</span>
                </div>
                <div className="rp-summary-badge" style={{ borderColor: "#4fc3f7" }}>
                    <span style={{ color: "#4fc3f7", fontWeight: 800, fontSize: "1.2rem" }}>{counts.doing}</span>
                    <span style={{ fontSize: "0.78rem", color: "#aaa" }}>🔧 ดำเนินการ</span>
                </div>
                <div className="rp-summary-badge" style={{ borderColor: "#28a745" }}>
                    <span style={{ color: "#28a745", fontWeight: 800, fontSize: "1.2rem" }}>{counts.done}</span>
                    <span style={{ fontSize: "0.78rem", color: "#aaa" }}>✅ เสร็จ</span>
                </div>
                <div className="rp-summary-badge" style={{ borderColor: "#888" }}>
                    <span style={{ color: "#ddd", fontWeight: 800, fontSize: "1.2rem" }}>{reports.length}</span>
                    <span style={{ fontSize: "0.78rem", color: "#aaa" }}>📋 ทั้งหมด</span>
                </div>
            </div>

            {/* Sort + Filter */}
            <div className="rp-controls">
                <h4 className="section-title" style={{ margin: 0, flex: 1 }}>
                    {isTech ? "📊 รายการแจ้งทั้งหมด" : "📊 Report ของฉัน"}
                </h4>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="status-select">
                    <option value="date">🕐 วันที่</option>
                    <option value="priority">⚠️ ความสำคัญ</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-select">
                    <option value="all">ทุกสถานะ</option>
                    <option value="รอรับเรื่อง">📨 รอรับเรื่อง</option>
                    <option value="กำลังดำเนินการ">🔧 ดำเนินการ</option>
                    <option value="เสร็จสิ้น">✅ เสร็จสิ้น</option>
                </select>
            </div>

            {/* Report Cards */}
            {displayReports.length === 0 ? (
                <div className="empty-state">📭 ไม่มี Report {statusFilter !== "all" ? `(สถานะ: ${statusFilter})` : ""}</div>
            ) : (
                <div className="rp-card-list">
                    {displayReports.map((r, idx) => {
                        const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG["รอรับเรื่อง"];
                        return (
                            <div key={r.reportId || r._id} className="rp-card" style={{ borderLeft: `4px solid ${sc.color}` }}>
                                {/* Row 1: ID + Status + Priority */}
                                <div className="rp-card-top">
                                    <div className="rp-card-id">
                                        <span className="rp-card-num">#{idx + 1}</span>
                                        <strong className="accent-text">{formatId(r.reportId)}</strong>
                                    </div>
                                    <div className="rp-card-badges">
                                        <span className="rp-status-tag" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                            {sc.icon} {r.status}
                                        </span>
                                        <span className="priority-badge" style={{ background: PRIORITY_COLOR[r.priority], fontSize: "0.72rem", padding: "2px 8px" }}>
                                            {PRIORITY_TEXT[r.priority] || "ปกติ"}
                                        </span>
                                    </div>
                                </div>

                                {/* Row 2: Category + Owner + Date */}
                                <div className="rp-card-meta">
                                    <span>📂 {r.category}{r.customCategory ? ` → ${r.customCategory}` : ""}</span>
                                    <span>👤 {r.owner}</span>
                                    <span>📅 {timeAgo(r.createdAt)}</span>
                                </div>

                                {/* Location */}
                                {r.location && (
                                    <div style={{ color: "#4fc3f7", fontSize: "0.85rem", margin: "0.25rem 0" }}>
                                        🏠 สถานที่: {r.location}
                                    </div>
                                )}

                                {/* Detail */}
                                <div className="rp-card-detail">{r.detail}</div>

                                {/* Images (compact) */}
                                {r.images && r.images.length > 0 && (
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <div className="image-gallery">
                                            {r.images.map((url, i) => (
                                                <img key={i} src={url} alt={`evidence-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Completion images */}
                                {r.completionImages && r.completionImages.length > 0 && (
                                    <div className="report-images completion" style={{ marginTop: "0.5rem" }}>
                                        <strong>✅ รูปซ่อมเสร็จ:</strong>
                                        <div className="image-gallery">
                                            {r.completionImages.map((url, i) => (
                                                <img key={i} src={url} alt={`completion-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback */}
                                {r.feedback && (
                                    <div className="feedback-box">
                                        💬 หมายเหตุจาก{r.feedbackBy === "admin" ? "แอดมิน" : "ช่าง"}: {r.feedback}
                                    </div>
                                )}

                                {/* Comments + Like/Dislike per comment */}
                                <div className="comments-section">
                                    {r.comments && r.comments.length > 0 && (
                                        <>
                                            <strong>💬 ความคิดเห็น ({r.comments.length}):</strong>
                                            {r.comments.map((c, i) => (
                                                <div key={c.commentId || i} className="comment-item">
                                                    <div className="comment-header">
                                                        <span className="comment-author">{c.author}</span>
                                                        <span className="comment-date">{new Date(c.createdAt).toLocaleString("th-TH")}</span>
                                                    </div>
                                                    <p className="comment-text">{c.text}</p>
                                                    <div className="comment-reactions">
                                                        <button className="btn-react" onClick={() => handleCommentLike(r.reportId, c.commentId)}>👍 {c.likesCount || 0}</button>
                                                        <button className="btn-react" onClick={() => handleCommentDislike(r.reportId, c.commentId)}>👎 {c.dislikesCount || 0}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>

                                {/* Actions (compact) */}
                                <div className="rp-card-actions">
                                    <button className="btn-comment" onClick={() => setCommentModal({ open: true, reportId: r.reportId })}>💬 เขียนความเห็น</button>
                                    <button className="btn-ghost-sm danger" onClick={() => handleDelete(r.reportId, r.status)}>🗑️</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                open={commentModal.open}
                title="💬 เพิ่มความคิดเห็น"
                onClose={() => setCommentModal({ open: false, reportId: null })}
                onSubmit={handleCommentSubmit}
                fields={[{ name: "comment", label: "ข้อความ", placeholder: "พิมพ์ความคิดเห็นของคุณ...", required: true }]}
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
