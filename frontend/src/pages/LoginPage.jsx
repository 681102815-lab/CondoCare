import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
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
                <p className="muted">เข้าสู่ระบบ — Admin / ช่าง / ผู้พัก</p>

                <div className="input-group">
                    <label>Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        autoComplete="off"
                    />
                </div>
                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        autoComplete="off"
                    />
                </div>

                <button type="submit" className="btn-primary full-width" disabled={loading}>
                    {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

                {error && <div className="error-text">{error}</div>}

                <div className="demo-accounts">
                    <span>ตัวอย่างบัญชี:</span>
                    <code>admin / 1234</code>
                    <code>tech / 1234</code>
                    <code>resident / 1234</code>
                </div>
            </form>
        </div>
    );
}
