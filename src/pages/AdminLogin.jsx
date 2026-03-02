// ✅ ADMIN LOGIN — AFCPR Golf Tournament 2026 (Premium Split) using existing brand colors + tournament logo
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ Logo exists here:
// D:\projects\afcpr-golf-project\frontend\src\assets\afcpr-golf-logo.png
import AFCPRLogo from "../assets/afcpr-golf-logo.png";

const ADMIN_USER = "afcpradmin";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API = `${API_BASE}/api`;

const THEME = {
  bgTop: "#0b0f14",
  bgMid: "#0c1117",
  bgBot: "#070a0f",

  glass: "rgba(255,255,255,0.06)",
  glass2: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.16)",

  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.66)",
  subtle: "rgba(255,255,255,0.42)",

  accent: "#f59e0b",
  accent2: "#fb923c",

  shadow: "0 18px 70px rgba(0,0,0,0.55)",
};

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(ADMIN_USER);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return (username || "").trim().length > 0 && (password || "").trim().length > 0 && !loading;
  }, [username, password, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const u = (username || "").trim();
    const p = (password || "").trim();

    if (!u || !p) {
      setErrorMsg("Completa usuario y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API}/admin/login`,
        { username: u, password: p },
        { headers: { "Content-Type": "application/json" } }
      );

      const token = res?.data?.token;
      if (!token) throw new Error("Respuesta sin token");

      localStorage.setItem("afcpr_admin_token", token);
      navigate("/admin/dashboard");
    } catch (err) {
      const apiMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Credenciales incorrectas o acceso no autorizado.";

      setErrorMsg(String(apiMsg));
    } finally {
      setLoading(false);
    }
  }

  // ✅ Scattered “random” watermarks (now slightly stronger + soft glow)
  const WATERMARKS = [
    { top: "-10%", left: "-8%", w: 560, rot: -14, op: 0.075 },
    { top: "5%", left: "52%", w: 460, rot: 10, op: 0.055 },
    { top: "22%", left: "78%", w: 360, rot: 18, op: 0.06 },
    { top: "55%", left: "-12%", w: 660, rot: -8, op: 0.055 },
    { top: "62%", left: "68%", w: 580, rot: 12, op: 0.06 },
    { top: "80%", left: "14%", w: 480, rot: -18, op: 0.05 },
    { top: "90%", left: "86%", w: 400, rot: 22, op: 0.05 },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(1200px 600px at 18% 12%, rgba(245,158,11,0.11), transparent 60%),
                     radial-gradient(1100px 700px at 80% 40%, rgba(59,130,246,0.10), transparent 60%),
                     linear-gradient(180deg, ${THEME.bgTop} 0%, ${THEME.bgMid} 46%, ${THEME.bgBot} 100%)`,
        color: THEME.text,
      }}
    >
      {/* ✅ Global scattered watermarks */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* vignette keeps it premium */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.26) 58%, rgba(0,0,0,0.68) 100%)",
          }}
        />

        {/* subtle overall light to help logos read */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(900px 520px at 20% 18%, rgba(245,158,11,0.08), transparent 60%), radial-gradient(900px 520px at 82% 30%, rgba(59,130,246,0.07), transparent 60%)",
          }}
        />

        {WATERMARKS.map((m, idx) => (
          <img
            key={idx}
            src={AFCPRLogo}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              top: m.top,
              left: m.left,
              width: m.w,
              height: "auto",
              opacity: m.op,
              transform: `rotate(${m.rot}deg)`,
              filter: "saturate(1.08) contrast(1.08) brightness(1.08)",
              // ✅ gentle glow so it pops but stays classy
              WebkitFilter: "saturate(1.08) contrast(1.08) brightness(1.08) drop-shadow(0 14px 32px rgba(245,158,11,0.10))",
              userSelect: "none",
            }}
          />
        ))}
      </div>

      {/* ✅ Premium split container */}
      <div
        className="afcpr-split"
        style={{
          width: "100%",
          maxWidth: 1040,
          minHeight: 520,
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          borderRadius: 28,
          border: `1px solid ${THEME.border}`,
          overflow: "hidden",
          boxShadow: THEME.shadow,
          position: "relative",
          zIndex: 1,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* LEFT HERO */}
        <div
          style={{
            position: "relative",
            padding: 30,
            display: "grid",
            alignContent: "start",
            gap: 18,
            background: `radial-gradient(900px 520px at 14% 18%, rgba(245,158,11,0.16), transparent 55%),
                         radial-gradient(900px 520px at 72% 28%, rgba(59,130,246,0.12), transparent 55%),
                         linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
            borderRight: `1px solid ${THEME.border}`,
          }}
        >
          {/* Large hero watermark behind left content */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(closest-side at 52% 55%, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.55) 100%)",
              }}
            />
            <img
              src={AFCPRLogo}
              alt=""
              draggable={false}
              style={{
                width: "92%",
                maxWidth: 780,
                opacity: 0.075,
                transform: "rotate(-7deg) translateY(10px)",
                filter: "saturate(1.06) contrast(1.06) brightness(1.05)",
                userSelect: "none",
              }}
            />
          </div>

          {/* Foreground hero content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                border: `1px solid ${THEME.border}`,
                background: "rgba(0,0,0,0.22)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: THEME.accent,
                  boxShadow: "0 0 0 5px rgba(245,158,11,0.15)",
                }}
              />
              <span
                style={{
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  fontSize: 12,
                  color: THEME.accent,
                }}
              >
                AFCPR GOLF TOURNAMENT 2026 — ADMIN
              </span>
            </div>

            <h1 style={{ margin: "16px 0 0", fontSize: 38, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
              Panel Administrativo
            </h1>

            <p style={{ margin: "12px 0 0", color: THEME.muted, maxWidth: 540, lineHeight: 1.55 }}>
              Acceso seguro para gestionar registros, confirmaciones, estados, exportaciones y asistencia del torneo.
            </p>
          </div>

          {/* Feature cards */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: 6,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              maxWidth: 640,
            }}
          >
            {[
              { title: "Búsqueda & Filtros", desc: "Encuentra registros rápido con filtros y búsqueda." },
              { title: "Exportación CSV", desc: "Descarga registros y jugadores para reportes." },
              { title: "Acciones Rápidas", desc: "Check-in, status, resend de confirmación." },
              { title: "Código de Confirmación", desc: "Copia y verifica códigos con un clic." },
            ].map((c) => (
              <div
                key={c.title}
                style={{
                  borderRadius: 18,
                  border: `1px solid ${THEME.border}`,
                  background: "rgba(0,0,0,0.22)",
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 900 }}>{c.title}</div>
                <div style={{ marginTop: 6, color: THEME.muted, fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ position: "relative", zIndex: 1, marginTop: 8, color: THEME.subtle, fontSize: 12 }}>
            © AFCPR Golf Tournament 2026 — Admin Access
          </div>
        </div>

        {/* RIGHT FORM */}
        <div
          style={{
            padding: 26,
            display: "grid",
            alignContent: "center",
            background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 999,
              border: `1px solid ${THEME.border}`,
              background: "rgba(0,0,0,0.22)",
              width: "fit-content",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: THEME.accent,
                boxShadow: "0 0 0 5px rgba(245,158,11,0.15)",
              }}
            />
            <span style={{ fontWeight: 900, letterSpacing: "0.12em", fontSize: 12, color: THEME.accent }}>
              AFCPR GOLF TOURNAMENT 2026 — ADMIN ACCESS
            </span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Iniciar sesión</div>
            <div style={{ marginTop: 6, color: THEME.muted, fontSize: 13 }}>
              Usa tus credenciales de administrador para acceder al dashboard.
            </div>
          </div>

          {errorMsg ? (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.12)",
                color: "rgba(255,255,255,0.92)",
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {errorMsg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: THEME.muted, fontSize: 12, letterSpacing: "0.10em", fontWeight: 900 }}>
                USUARIO
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                style={{
                  width: "100%",
                  borderRadius: 14,
                  border: `1px solid ${THEME.border2}`,
                  background: "rgba(0,0,0,0.35)",
                  padding: "12px 12px",
                  color: THEME.text,
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: THEME.muted, fontSize: 12, letterSpacing: "0.10em", fontWeight: 900 }}>
                CONTRASEÑA
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: "100%",
                  borderRadius: 14,
                  border: `1px solid ${THEME.border2}`,
                  background: "rgba(0,0,0,0.35)",
                  padding: "12px 12px",
                  color: THEME.text,
                  outline: "none",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                marginTop: 6,
                width: "100%",
                borderRadius: 14,
                border: "none",
                padding: "12px 14px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontWeight: 950,
                letterSpacing: "0.03em",
                color: "#0b0f14",
                background: canSubmit
                  ? "linear-gradient(90deg, #f59e0b 0%, #fb923c 100%)"
                  : "rgba(255,255,255,0.10)",
                boxShadow: canSubmit ? "0 12px 28px rgba(245,158,11,0.22)" : "none",
                transition: "transform 0.12s ease, filter 0.12s ease",
              }}
              onMouseDown={(e) => {
                if (canSubmit) e.currentTarget.style.transform = "translateY(1px)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? "Entrando..." : "Entrar al Dashboard"}
            </button>

            <div style={{ marginTop: 12, color: THEME.subtle, fontSize: 12 }}>
              © AFCPR Golf Tournament 2026 — Admin Access
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Responsive */}
      <style>{`
        @media (max-width: 980px) {
          .afcpr-split {
            grid-template-columns: 1fr !important;
            min-height: unset !important;
          }
        }
      `}</style>
    </div>
  );
}