import { useState, useEffect, useCallback } from "react";
import { getReports, createReportWithImages, deleteReport, toggleLike, toggleDislike, addComment } from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

const PRIORITY_COLOR = { low: "#28a745", medium: "#17a2b8", high: "#ffc107", critical: "#ff6b6b" };
const PRIORITY_TEXT = { low: "ต่ำ", medium: "ปกติ", high: "สูง", critical: "วิกฤต" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

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
    const [sortBy, setSortBy] = useState("date"); // date, priority
    const [statusFilter, setStatusFilter] = useState("all"); // all, รอรับเรื่อง, กำลังดำเนินการ, เสร็จสิ้น

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
                category: cat,
                customCategory: cat === "อื่นๆ" ? customCat : "",
                detail,
                priority,
                owner: user.username,
                location: location || "",
                images,
            });
            setDetail("");
            setPriority("medium");
            setCat("ไฟฟ้า");
            setCustomCat("");
            setLocation("");
            setImages([]);
            setPreviews([]);
            alert("✅ ส่ง Report สำเร็จ!");
            reload();
        } catch (err) {
            alert("❌ " + err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id, status) {
        if (status === "กำลังดำเนินการ") {
            alert("❌ ไม่สามารถลบ Report ที่กำลังดำเนินการได้");
            return;
        }
        if (!confirm("ต้องการลบงานนี้หรือไม่?")) return;
        try { await deleteReport(id); reload(); } catch (e) { alert("❌ " + e.message); }
    }

    async function handleLike(id) { try { await toggleLike(id, user.username); reload(); } catch (e) { console.error(e); } }
    async function handleDislike(id) { try { await toggleDislike(id, user.username); reload(); } catch (e) { console.error(e); } }

    async function handleCommentSubmit(values) {
        if (!values.comment?.trim()) return;
        try {
            await addComment(commentModal.reportId, user.username, values.comment);
            setCommentModal({ open: false, reportId: null });
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

    // Sort and filter
    let displayReports = [...reports];
    if (statusFilter !== "all") {
        displayReports = displayReports.filter(r => r.status === statusFilter);
    }
    if (sortBy === "priority") {
        displayReports.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));
    } else {
        displayReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const isAdmin = user?.role === "admin";
    const isTech = user?.role === "tech";

    return (
        <section>
            <h3>{isTech ? "📋 รายการแจ้งซ่อม" : "📋 แจ้งปัญหา"}</h3>

            {/* Form — tech ไม่ต้องแจ้งปัญหา (แค่ดูรายการ) */}
            {!isTech && (
                <form className="report-form" onSubmit={submit}>
                    <div className="form-row">
                        <div className="input-group">
                            <label>📌 ประเภท <span className="required">*</span></label>
                            <select value={cat} onChange={(e) => setCat(e.target.value)}>
                                <option>ไฟฟ้า</option>
                                <option>ประปา</option>
                                <option>ลิฟต์</option>
                                <option>แมลง/สัตว์</option>
                                <option>ความสะอาด</option>
                                <option>อื่นๆ</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>⚠️ ความสำคัญ <span className="required">*</span></label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="low">ต่ำ - Low</option>
                                <option value="medium">ปกติ - Medium</option>
                                <option value="high">สูง - High</option>
                                <option value="critical">วิกฤต - Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* ช่องกรอกประเภทเพิ่มเติม (เมื่อเลือก "อื่นๆ") */}
                    {cat === "อื่นๆ" && (
                        <div className="input-group">
                            <label>📎 ระบุประเภทเพิ่มเติม <span className="required">*</span></label>
                            <input
                                type="text"
                                value={customCat}
                                onChange={(e) => setCustomCat(e.target.value)}
                                placeholder="เช่น ระบบรักษาความปลอดภัย, ที่จอดรถ..."
                            />
                        </div>
                    )}

                    {/* Admin แจ้งแทน → ระบุเลขห้อง */}
                    {isAdmin && (
                        <div className="input-group">
                            <label>🏠 เลขห้อง / สถานที่ <span className="required">*</span></label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="เช่น ห้อง 101, ล็อบบี้ชั้น 1, ลานจอดรถ B1"
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>📝 รายละเอียด <span className="required">*</span></label>
                        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="อธิบายปัญหาที่พบ..." rows={4} />
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
            )}

            {/* Sort and Filter controls */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <h4 className="section-title" style={{ margin: 0, flex: 1 }}>
                    {isTech ? "📊 รายการแจ้งทั้งหมด" : "📊 Report ของฉัน"}
                </h4>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="status-select"
                    style={{ minWidth: "120px" }}
                >
                    <option value="date">🕐 เรียงตามวันที่</option>
                    <option value="priority">⚠️ เรียงตามความสำคัญ</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-select"
                    style={{ minWidth: "120px" }}
                >
                    <option value="all">ทุกสถานะ</option>
                    <option value="รอรับเรื่อง">รอรับเรื่อง</option>
                    <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                    <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                </select>
            </div>

            {displayReports.length === 0 ? (
                <div className="empty-state">📭 ไม่มี Report {statusFilter !== "all" ? `(สถานะ: ${statusFilter})` : ""}</div>
            ) : (
                displayReports.map((r) => (
                    <div key={r.reportId || r._id} className={`report-card border-${statusClass(r.status)}`}>
                        <div className="report-header">
                            <strong>RPT-{String(r.reportId).padStart(3, "0")} — {r.category}{r.customCategory ? ` (${r.customCategory})` : ""}</strong>
                            <span className={`tag ${statusClass(r.status)}`}>{r.status}</span>
                            <span className="priority-badge" style={{ background: PRIORITY_COLOR[r.priority] }}>
                                ⚠️ {PRIORITY_TEXT[r.priority] || "ปกติ"}
                            </span>
                        </div>
                        {r.location && <div className="report-location">🏠 สถานที่: {r.location}</div>}
                        <div className="report-date">📅 {new Date(r.createdAt).toLocaleString("th-TH")}</div>
                        <div className="report-detail">{r.detail}</div>
                        {r.images && r.images.length > 0 && (
                            <div className="report-images">
                                <strong>📷 รูปหลักฐาน:</strong>
                                <div className="image-gallery">
                                    {r.images.map((url, i) => (
                                        <img key={i} src={url} alt={`evidence-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {r.completionImages && r.completionImages.length > 0 && (
                            <div className="report-images completion">
                                <strong>✅ รูปซ่อมเสร็จ:</strong>
                                <div className="image-gallery">
                                    {r.completionImages.map((url, i) => (
                                        <img key={i} src={url} alt={`completion-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {r.feedback && (
                            <div className="feedback-box">
                                <strong>💬 หมายเหตุจาก{r.feedbackBy === "admin" ? "แอดมิน" : "ช่าง"}:</strong><br />{r.feedback}
                            </div>
                        )}
                        {/* แสดงความคิดเห็นของตัวเอง */}
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
                        <div className="report-actions">
                            <button className="btn-like" onClick={() => handleLike(r.reportId)}>👍 พอใจ {r.likesCount || 0}</button>
                            <button className="btn-dislike" onClick={() => handleDislike(r.reportId)}>👎 ไม่พอใจ {r.dislikesCount || 0}</button>
                            {r.status === "เสร็จสิ้น" && <button className="btn-comment" onClick={() => setCommentModal({ open: true, reportId: r.reportId })}>⭐ ให้ความเห็น</button>}
                            {r.status !== "กำลังดำเนินการ" && (
                                <button className="btn-ghost-sm danger" onClick={() => handleDelete(r.reportId, r.status)}>🗑️ ลบ</button>
                            )}
                        </div>
                    </div>
                ))
            )}

            <Modal
                open={commentModal.open}
                title="💬 เพิ่มความคิดเห็น"
                onClose={() => setCommentModal({ open: false, reportId: null })}
                onSubmit={handleCommentSubmit}
                fields={[
                    { name: "comment", label: "ข้อความ", placeholder: "พิมพ์ความคิดเห็นของคุณ...", required: true },
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
