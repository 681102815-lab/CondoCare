import { useState, useEffect, useCallback } from "react";
import { getReports, toggleLike, toggleDislike, addComment, updateReportRating } from "../api";
import { useAuth } from "../AuthContext";
import Modal from "../components/Modal";

export default function DonePage() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [commentModal, setCommentModal] = useState({ open: false, reportId: null });
    const [lightbox, setLightbox] = useState(null);
    const [ratingHover, setRatingHover] = useState({});

    const reload = useCallback(() => {
        getReports()
            .then((all) => setReports(all.filter((x) => x.owner === user?.username && x.status === "เสร็จสิ้น")))
            .catch(console.error);
    }, [user]);

    useEffect(() => { reload(); }, [reload]);

    async function handleLike(id) { try { await toggleLike(id, user.username); reload(); } catch (e) { console.error(e); } }
    async function handleDislike(id) { try { await toggleDislike(id, user.username); reload(); } catch (e) { console.error(e); } }

    async function handleRating(reportId, rating) {
        try {
            await updateReportRating(reportId, rating);
            reload();
        } catch (e) {
            alert("❌ " + e.message);
        }
    }

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

    return (
        <section>
            <h3>✅ งานเสร็จแล้ว</h3>
            {reports.length === 0 ? (
                <div className="empty-state">ยังไม่มีงานเสร็จแล้ว</div>
            ) : (
                reports.map((r) => (
                    <div key={r.reportId || r._id} className="report-card border-done">
                        <div className="report-header">
                            <strong>✅ RPT-{String(r.reportId).padStart(3, "0")} — {r.category}{r.customCategory ? ` (${r.customCategory})` : ""}</strong>
                        </div>
                        <div className="report-date">📅 แจ้งเมื่อ: {new Date(r.createdAt).toLocaleString("th-TH")}</div>
                        {r.location && <div style={{ color: "#4fc3f7", fontSize: "0.85rem" }}>🏠 สถานที่: {r.location}</div>}
                        <div className="report-detail">{r.detail}</div>

                        {/* Timeline */}
                        <div style={{ margin: "0.5rem 0", padding: "0.5rem", background: "#1a1a2e", borderRadius: "8px", fontSize: "0.85rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            {r.startedAt && (
                                <span style={{ color: "#ffc107" }}>🔧 ช่างรับเรื่อง: {new Date(r.startedAt).toLocaleString("th-TH")}</span>
                            )}
                            {r.completedAt && (
                                <span style={{ color: "#28a745" }}>
                                    ✅ เสร็จ: {new Date(r.completedAt).toLocaleString("th-TH")}
                                    {r.startedAt && ` (ใช้เวลา ${Math.max(1, Math.ceil((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 86400000))} วัน)`}
                                </span>
                            )}
                        </div>

                        {r.images && r.images.length > 0 && (
                            <div className="report-images" style={{ margin: "0.5rem 0" }}>
                                <strong>📷 รูปหลักฐาน:</strong>
                                <div className="image-gallery">
                                    {r.images.map((url, i) => (
                                        <img key={i} src={url} alt={`evidence-${i}`} className="gallery-thumb" onClick={() => setLightbox(url)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {r.completionImages && r.completionImages.length > 0 && (
                            <div className="report-images completion" style={{ margin: "0.5rem 0" }}>
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

                        {/* ⭐ Rating & Feedback — เด่นชัด */}
                        <div className="rating-feedback-section">
                            <div className="rating-section">
                                <strong>⭐ ให้คะแนนช่าง:</strong>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`star ${star <= (ratingHover[r.reportId] || r.rating || 0) ? "active" : ""}`}
                                            onMouseEnter={() => setRatingHover(p => ({ ...p, [r.reportId]: star }))}
                                            onMouseLeave={() => setRatingHover(p => ({ ...p, [r.reportId]: 0 }))}
                                            onClick={() => handleRating(r.reportId, star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                    <span className="rating-text">
                                        {r.rating > 0 ? `${r.rating}/5` : "ยังไม่ได้ให้คะแนน"}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="btn-comment-prominent"
                                onClick={() => setCommentModal({ open: true, reportId: r.reportId })}
                            >
                                💬 เขียนความเห็น / แจ้งปัญหาเพิ่มเติม
                            </button>
                        </div>

                        <div className="report-actions">
                            <button className="btn-like" onClick={() => handleLike(r.reportId)}>👍 พอใจ {r.likesCount || 0}</button>
                            <button className="btn-dislike" onClick={() => handleDislike(r.reportId)}>👎 ไม่พอใจ {r.dislikesCount || 0}</button>
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
