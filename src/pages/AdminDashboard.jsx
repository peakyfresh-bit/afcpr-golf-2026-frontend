// ✅ DEBUG MARKER: ADMIN DASHBOARD THEME v2 (Tournament Branding + Footer)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "afcpr_admin_token";

// 🎨 AFCPR Golf Tournament theme (match AdminLogin vibe)
const THEME = {
  bgTop: "#0b0f14",
  bgMid: "#0c1117",
  bgBot: "#070a0f",
  panel: "rgba(255,255,255,0.04)",
  panel2: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.14)",
  text: "rgba(255,255,255,0.92)",
  subtext: "rgba(255,255,255,0.70)",
  muted: "rgba(255,255,255,0.55)",
  orange: "#ff7a18",
  orange2: "#ff9a3c",
  danger: "#ff4d4f",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = useMemo(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }, []);

  const totalAmount = useMemo(() => {
    // Suma robusta: amount puede venir number o string
    return (items || []).reduce((sum, it) => {
      const raw = it?.amount ?? 0;
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.]/g, ""));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [items]);

  const fetchRegistrations = async ({ isRefresh = false } = {}) => {
    setError("");
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const jwt = token || localStorage.getItem(TOKEN_KEY) || "";
      if (!jwt) {
        // Si no hay token, manda a login
        navigate("/admin", { replace: true });
        return;
      }

      const res = await axios.get(`${API}/admin/registrations`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      const data = res?.data;
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setItems(list);
    } catch (err) {
      // Mensaje de error legible
      const status = err?.response?.status;
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Error loading registrations.";

      // Si el token expiró o es inválido, saca al login
      if (status === 401 || status === 403) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
        navigate("/admin", { replace: true });
        return;
      }

      setError(typeof detail === "string" ? detail : "Error loading registrations.");
      // Mantén consola útil para debugging
      // eslint-disable-next-line no-console
      console.error("AdminDashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    navigate("/admin", { replace: true });
  };

  const formatMoney = (value) => {
    const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.]/g, ""));
    const safe = Number.isFinite(n) ? n : 0;
    return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const paymentLabel = (pm) => {
    const v = String(pm || "").toLowerCase();
    if (v === "visa") return "Visa";
    if (v === "mastercard") return "Mastercard";
    if (v === "checks" || v === "check") return "Checks";
    return pm || "-";
  };

  // ✅ Contact: PRIORIDAD: contact_name → phone → email → "-"
  const contactLabel = (it) => {
    const name =
      it?.contact_name ||
      it?.contactName ||
      it?.contact_full_name ||
      it?.contactFullName ||
      "";

    const safeName = String(name || "").trim();

    return (
      safeName ||
      it?.phone ||
      it?.phone_number ||
      it?.contactPhone ||
      it?.email ||
      "-"
    );
  };

  // ✅ Shirt sizes: vienen dentro de players (Array)
  const shirtSizesLabel = (it) => {
    const players = Array.isArray(it?.players) ? it.players : [];
    const sizes = players
      .map((p) => p?.shirt_size || p?.shirtSize || p?.shirt || p?.size)
      .filter(Boolean)
      .map((s) => String(s).toUpperCase().trim());

    return sizes.length ? sizes.join(", ") : "-";
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `radial-gradient(1200px 700px at 20% 10%, rgba(255,122,24,0.16), transparent 55%),
                     radial-gradient(900px 600px at 80% 0%, rgba(255,154,60,0.10), transparent 55%),
                     linear-gradient(180deg, ${THEME.bgTop}, ${THEME.bgMid} 55%, ${THEME.bgBot})`,
        color: THEME.text,
      }}
    >
      {/* Header */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div
            className="rounded-2xl border p-5 sm:p-6 flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
            }}
          >
            <div className="flex items-start gap-4">
              {/* Badge / icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{
                  background: "rgba(255,122,24,0.10)",
                  borderColor: "rgba(255,122,24,0.35)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.orange}, ${THEME.orange2})`,
                    boxShadow: "0 10px 30px rgba(255,122,24,0.22)",
                  }}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1
                    className="text-xl sm:text-2xl font-semibold tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.orange}, ${THEME.orange2})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    AFCPR Golf Tournament 2026 — 7th Edition
                  </h1>
                </div>
                <p className="text-sm mt-1" style={{ color: THEME.subtext }}>
                  Admin Dashboard — Registrations Overview
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => fetchRegistrations({ isRefresh: true })}
                className="h-10 px-4 rounded-xl border font-medium transition active:scale-[0.99]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: THEME.border2,
                  color: THEME.text,
                }}
                title="Refresh registrations"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={onLogout}
                className="h-10 px-4 rounded-xl border font-semibold transition active:scale-[0.99]"
                style={{
                  background: "rgba(255,77,79,0.10)",
                  borderColor: "rgba(255,77,79,0.28)",
                  color: "rgba(255,255,255,0.90)",
                }}
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px--8 py-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="rounded-2xl border p-5"
              style={{
                background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
                borderColor: THEME.border,
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: THEME.muted }}>
                Total Registrations
              </div>
              <div className="mt-2 text-3xl font-semibold">{(items || []).length}</div>
              <div className="mt-1 text-sm" style={{ color: THEME.subtext }}>
                Pulled from admin API
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                background: `linear-gradient(180deg, rgba(255,122,24,0.10), ${THEME.panel})`,
                borderColor: "rgba(255,122,24,0.25)",
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: THEME.muted }}>
                Total Amount
              </div>
              <div className="mt-2 text-3xl font-semibold">{formatMoney(totalAmount)}</div>
              <div className="mt-1 text-sm" style={{ color: THEME.subtext }}>
                Sum of all registration amounts
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
                borderColor: THEME.border,
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: THEME.muted }}>
                Status
              </div>
              <div className="mt-2 text-lg font-semibold">
                {loading ? "Loading..." : error ? "Attention needed" : "Connected"}
              </div>
              <div className="mt-1 text-sm" style={{ color: error ? THEME.danger : THEME.subtext }}>
                {error ? error : "Admin endpoint responding normally"}
              </div>
            </div>
          </div>

          {/* Table */}
          <div
            className="mt-6 rounded-2xl border overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            }}
          >
            <div className="p-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Registrations</h2>
                <p className="text-sm" style={{ color: THEME.subtext }}>
                  Review recent submissions and payment methods.
                </p>
              </div>
              <div
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: THEME.border2,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                Items: {(items || []).length}
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.78)",
                    }}
                  >
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Company
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Contact
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Email
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Shirt Size(s)
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Payment
                    </th>
                    <th className="text-right font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Amount
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-5 py-6" colSpan={7} style={{ color: THEME.subtext }}>
                        Loading registrations…
                      </td>
                    </tr>
                  ) : (items || []).length === 0 ? (
                    <tr>
                      <td className="px-5 py-6" colSpan={7} style={{ color: THEME.subtext }}>
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    (items || []).map((it, idx) => {
                      const created = it?.created_at || it?.createdAt || it?.created || it?.timestamp || "";

                      const createdLabel = created
                        ? (() => {
                            const d = new Date(created);
                            return Number.isNaN(d.getTime()) ? String(created) : d.toLocaleString();
                          })()
                        : "-";

                      return (
                        <tr
                          key={it?._id || it?.id || idx}
                          style={{
                            background: idx % 2 === 0 ? "rgba(255,255,255,0.00)" : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            {it?.company || it?.organization || "-"}
                          </td>
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            {contactLabel(it)}
                          </td>
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            {it?.email || "-"}
                          </td>
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            {shirtSizesLabel(it)}
                          </td>
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold"
                              style={{
                                background: "rgba(255,122,24,0.08)",
                                borderColor: "rgba(255,122,24,0.22)",
                                color: "rgba(255,255,255,0.85)",
                              }}
                            >
                              {paymentLabel(it?.payment_method || it?.paymentMethod)}
                            </span>
                          </td>
                          <td className="px-5 py-3 border-b text-right" style={{ borderColor: THEME.border }}>
                            {formatMoney(it?.amount)}
                          </td>
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            {createdLabel}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div
            className="rounded-2xl border px-5 py-4 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              color: THEME.subtext,
            }}
          >
            <div className="font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>
              © AFCPR Golf Tournament 2026 — Admin Access
            </div>
            <div className="text-xs" style={{ color: THEME.muted }}>
              Secure administrative portal
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}