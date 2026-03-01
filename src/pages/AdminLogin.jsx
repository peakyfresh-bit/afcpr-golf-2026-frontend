import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_USER = "afcpradmin";

// 🎨 AFCPR Golf Tournament theme
const THEME = {
  bgTop: "#0b0f14",
  bgMid: "#0c1117",
  bgBot: "#070a0f",
  panel: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.14)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.70)",
  subtle: "rgba(255,255,255,0.55)",
  accent: "#ff7a00",
  accent2: "#ff9a3d",
  dangerBg: "rgba(220, 38, 38, 0.14)",
  dangerBorder: "rgba(220, 38, 38, 0.35)",
  dangerText: "#fecaca",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: ADMIN_USER, password }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.detail || "Password incorrecto";
        throw new Error(msg);
      }

      if (!data?.token) {
        throw new Error("Login OK pero faltó token en la respuesta");
      }

      localStorage.setItem("afcpr_admin_token", data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "grid",
        placeItems: "center",
        background: `
          radial-gradient(1200px 700px at 50% -10%, rgba(255,122,0,0.18), transparent 60%),
          radial-gradient(1000px 650px at 10% 30%, rgba(255,255,255,0.06), transparent 55%),
          linear-gradient(180deg, ${THEME.bgTop} 0%, ${THEME.bgMid} 55%, ${THEME.bgBot} 100%)
        `,
        color: THEME.text,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 18,
          border: `1px solid ${THEME.border}`,
          background: THEME.panel,
          boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 18px 14px",
            background: `linear-gradient(90deg, rgba(255,122,0,0.20), rgba(255,122,0,0.00) 60%)`,
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1.2,
              color: THEME.muted,
            }}
          >
            AFCPR Golf Tournament 2026
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: 0.4,
              color: THEME.accent,
            }}
          >
            7th Edition
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: THEME.subtle,
            }}
          >
            Admin Panel Login
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: THEME.muted,
            }}
          >
            Usuario:{" "}
            <span style={{ fontWeight: 700 }}>
              {ADMIN_USER}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 18 }}>
          <form
            onSubmit={onSubmit}
            style={{ display: "grid", gap: 12 }}
          >
            <label
              style={{
                display: "grid",
                gap: 8,
                fontSize: 13,
                color: THEME.muted,
              }}
            >
              Password
              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                placeholder="Escribe el password..."
                style={{
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: `1px solid ${THEME.border2}`,
                  background: "rgba(0,0,0,0.22)",
                  color: THEME.text,
                  outline: "none",
                }}
              />
            </label>

            {error && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: THEME.dangerBg,
                  border: `1px solid ${THEME.dangerBorder}`,
                  color: THEME.dangerText,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border:
                  "1px solid rgba(0,0,0,0.15)",
                background: loading
                  ? "rgba(255,122,0,0.35)"
                  : `linear-gradient(180deg, ${THEME.accent2} 0%, ${THEME.accent} 100%)`,
                color: "#111",
                fontWeight: 900,
                letterSpacing: 0.2,
                cursor:
                  loading || !password
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  "0 16px 40px rgba(255,122,0,0.18)",
              }}
            >
              {loading ? "Validando..." : "Entrar"}
            </button>

            {/* Footer elegante */}
            <div
              style={{
                marginTop: 18,
                textAlign: "center",
                fontSize: 11,
                letterSpacing: 0.5,
                color: THEME.subtle,
                opacity: 0.75,
              }}
            >
              © AFCPR Golf Tournament 2026 — Admin Access
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}