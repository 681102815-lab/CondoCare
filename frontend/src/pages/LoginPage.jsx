import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!username || !password) { setError("❌ กรุณากรอก username และ password"); return; }
        setLoading(true);
        setError("");
        try {
            await login(username, password);
        } catch (err) {
            setError("❌ " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-overlay">
            <form className="login-card" onSubmit={handleSubmit}>
                <div className="login-icon">🏢</div>
                <h2>CondoCare</h2>
                <p className="muted">ระบบแจ้งซ่อมคอนโดมิเนียม</p>

                <div className="input-group">
                    <label>Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="กรอกชื่อผู้ใช้"
                        autoComplete="off"
                    />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="กรอกรหัสผ่าน"
                            autoComplete="off"
                            style={{ paddingRight: "2.5rem" }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "1.1rem", color: "#888", padding: "4px",
                            }}
                            tabIndex={-1}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary full-width" disabled={loading}>
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

                {error && <div className="error-text">{error}</div>}

                <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#888", textAlign: "center", lineHeight: "1.6" }}>
                    <p style={{ margin: 0 }}>ยังไม่มีบัญชี? กรุณาติดต่อนิติบุคคล</p>
                    <p style={{ margin: 0, fontSize: "0.75rem" }}>📞 สำนักงานนิติบุคคล หรือ LINE @condocare</p>
                </div>
            </form>
        </div>
    );
}
