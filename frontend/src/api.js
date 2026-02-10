const API_PORTS = [5000, 5001];
let apiPort = 5000;
let detected = false;

export async function detectAPI() {
    if (detected) return;
    for (const port of API_PORTS) {
        try {
            const res = await fetch(`http://localhost:${port}/api/health`);
            if (res.ok) { apiPort = port; detected = true; return; }
        } catch { /* try next */ }
    }
    console.warn("API not detected, defaulting to port 5000");
}

export function getBase() {
    return `http://localhost:${apiPort}/api`;
}

export function getToken() {
    const s = localStorage.getItem("cc_session");
    if (!s) return null;
    try { return JSON.parse(s).token; } catch { return null; }
}

export async function api(path, options = {}) {
    await detectAPI();
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${getBase()}${path}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || res.statusText);
    return json;
}
