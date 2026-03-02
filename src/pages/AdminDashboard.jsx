// ✅ DEBUG MARKER: ADMIN DASHBOARD THEME v8 PREMIUM++++ (Add Resend Button + Logs Trigger)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "afcpr_admin_token";

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
  ok: "#22c55e",
};

// ✅ Dark dropdown option styles (fix for “text not visible until selected”)
const SELECT_DARK = {
  background: "#0c1117",
  color: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(255,255,255,0.14)",
};
const OPTION_DARK = {
  backgroundColor: "#0c1117",
  color: "rgba(255,255,255,0.92)",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // ✅ NEW: resend busy (separate so Mark Paid can still work independently)
  const [resendBusyId, setResendBusyId] = useState("");

  // ✅ Premium controls
  const [filterStatus, setFilterStatus] = useState("all"); // all | paid | pending (pending = NOT paid)
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ✅ Premium Sort (client-side)
  const [sortKey, setSortKey] = useState("date_desc"); // date_desc | date_asc | amount_desc | amount_asc

  const token = useMemo(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }, []);

  const authHeader = () => {
    const jwt = token || localStorage.getItem(TOKEN_KEY) || "";
    return { Authorization: `Bearer ${jwt}` };
  };

  const formatMoney = (value) => {
    const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.]/g, ""));
    const safe = Number.isFinite(n) ? n : 0;
    return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  // ✅ Paid auditing: total = SUMA SOLO status=paid
  const totalPaidAmount = useMemo(() => {
    return (items || []).reduce((sum, it) => {
      const status = String(it?.status || "").toLowerCase();
      if (status !== "paid") return sum;
      const raw = it?.amount ?? 0;
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.]/g, ""));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [items]);

  const totalPaidCount = useMemo(() => {
    return (items || []).filter((it) => String(it?.status || "").toLowerCase() === "paid").length;
  }, [items]);

  // ✅ Pending = NOT paid (Opción 1)
  const totalPendingCount = useMemo(() => {
    return (items || []).filter((it) => String(it?.status || "").toLowerCase() !== "paid").length;
  }, [items]);

  const totalAllCount = (items || []).length;

  // ✅ Total Players Registered: cuenta nombres no vacíos en todos los registros
  const totalPlayersRegistered = useMemo(() => {
    return (items || []).reduce((sum, it) => {
      const players = Array.isArray(it?.players) ? it.players : [];
      const count = players.filter((p) => String(p?.name || "").trim().length > 0).length;
      return sum + count;
    }, 0);
  }, [items]);

  // ✅ Total Players PAID: cuenta jugadores solo de registros paid
  const totalPlayersPaid = useMemo(() => {
    return (items || []).reduce((sum, it) => {
      const status = String(it?.status || "").toLowerCase();
      if (status !== "paid") return sum;

      const players = Array.isArray(it?.players) ? it.players : [];
      const count = players.filter((p) => String(p?.name || "").trim().length > 0).length;
      return sum + count;
    }, 0);
  }, [items]);

  // ✅ Progress for players
  const playersPaidPct = useMemo(() => {
    if (!totalPlayersRegistered) return 0;
    const pct = (totalPlayersPaid / totalPlayersRegistered) * 100;
    return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  }, [totalPlayersPaid, totalPlayersRegistered]);

  const fetchRegistrations = async ({ isRefresh = false } = {}) => {
    setError("");
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const jwt = token || localStorage.getItem(TOKEN_KEY) || "";
      if (!jwt) {
        navigate("/admin", { replace: true });
        return;
      }

      const res = await axios.get(`${API}/admin/registrations`, {
        headers: authHeader(),
      });

      const data = res?.data;
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setItems(list);
      setLastUpdated(new Date());
    } catch (err) {
      const status = err?.response?.status;
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Error loading registrations.";

      if (status === 401 || status === 403) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
        navigate("/admin", { replace: true });
        return;
      }

      setError(typeof detail === "string" ? detail : "Error loading registrations.");
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

  // ✅ Payment label: si visa/mastercard => "Pago con Tarjeta"
  const paymentLabel = (pm) => {
    const v = String(pm || "").toLowerCase();
    if (v === "visa" || v === "mastercard") return "Pago con Tarjeta";
    if (v === "checks" || v === "check" || v === "cheque") return "Cheque";
    return pm || "-";
  };

  // ✅ Contact: PRIORIDAD: contact_name → phone → email → "-"
  const contactLabel = (it) => {
    const name = String(it?.contact_name || it?.contactName || "").trim();
    return name || it?.phone || it?.phone_number || it?.email || "-";
  };

  // ✅ Players: Nombre (Talla) — evita "()" cuando talla está vacía
  const playersLabel = (it) => {
    const players = Array.isArray(it?.players) ? it.players : [];
    const list = players
      .map((p) => {
        const name = String(p?.name || "").trim();
        const size = String(p?.shirt_size || "").trim();
        if (!name) return "";
        const cleanSize = size ? size.toUpperCase() : "";
        return cleanSize ? `${name} (${cleanSize})` : name;
      })
      .filter(Boolean);

    return list.length ? list.join(", ") : "-";
  };

  const createdLabel = (it) => {
    const created = it?.created_at || it?.createdAt || it?.created || it?.timestamp || "";
    if (!created) return "-";
    const d = new Date(created);
    return Number.isNaN(d.getTime()) ? String(created) : d.toLocaleString();
  };

  // ✅ Search + filter logic (Premium)
  const filteredItems = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    return (items || [])
      .filter((it) => {
        const status = String(it?.status || "").toLowerCase();
        if (filterStatus === "paid") return status === "paid";
        if (filterStatus === "pending") return status !== "paid"; // ✅ option 1
        return true; // all
      })
      .filter((it) => {
        if (!q) return true;

        const company = String(it?.company || it?.organization || "").toLowerCase();
        const email = String(it?.email || "").toLowerCase();
        const phone = String(it?.phone || it?.phone_number || "").toLowerCase();
        const code = String(it?.confirmation_code || it?.confirmationCode || "").toLowerCase();
        const players = String(playersLabel(it) || "").toLowerCase();

        return (
          company.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          code.includes(q) ||
          players.includes(q)
        );
      });
  }, [items, filterStatus, query]);

  // ✅ Premium Sort (works on the current view: filters + search)
  const sortedItems = useMemo(() => {
    const arr = Array.isArray(filteredItems) ? [...filteredItems] : [];

    const getDateMs = (it) => {
      const raw = it?.created_at || it?.createdAt || it?.created || it?.timestamp || "";
      const t = raw ? Date.parse(raw) : NaN;
      return Number.isFinite(t) ? t : 0;
    };

    const getAmount = (it) => {
      const raw = it?.amount ?? 0;
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    const getId = (it) => String(it?.id || it?._id || "");

    switch (sortKey) {
      case "date_asc":
        arr.sort((a, b) => {
          const d = getDateMs(a) - getDateMs(b);
          if (d !== 0) return d;
          return getId(a).localeCompare(getId(b));
        });
        break;
      case "amount_desc":
        arr.sort((a, b) => {
          const d = getAmount(b) - getAmount(a);
          if (d !== 0) return d;
          return getId(a).localeCompare(getId(b));
        });
        break;
      case "amount_asc":
        arr.sort((a, b) => {
          const d = getAmount(a) - getAmount(b);
          if (d !== 0) return d;
          return getId(a).localeCompare(getId(b));
        });
        break;
      case "date_desc":
      default:
        arr.sort((a, b) => {
          const d = getDateMs(b) - getDateMs(a);
          if (d !== 0) return d;
          return getId(a).localeCompare(getId(b));
        });
        break;
    }

    return arr;
  }, [filteredItems, sortKey]);

  // ✅ Mark Paid
  const tryMarkPaid = async (id) => {
    return axios.patch(
      `${API}/admin/registrations/${id}/status`,
      { status: "paid" },
      { headers: authHeader() }
    );
  };

  const markPaid = async (it) => {
    const id = it?.id || it?._id;
    if (!id) {
      toast.error("Missing registration id");
      return;
    }

    setBusyId(String(id));
    try {
      await tryMarkPaid(id);

      // Update UI optimista
      setItems((prev) =>
        (prev || []).map((x) => {
          const xid = x?.id || x?._id;
          if (String(xid) !== String(id)) return x;
          return { ...x, status: "paid" };
        })
      );

      toast.success("Marked as paid");
      await fetchRegistrations({ isRefresh: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update status";
      toast.error(msg);
      // eslint-disable-next-line no-console
      console.error("markPaid error:", err);
    } finally {
      setBusyId("");
    }
  };

  // ✅ NEW: Resend confirmation email (creates email_resend_logs when backend supports it)
  const resendConfirmation = async (it) => {
    const id = it?.id || it?._id;
    if (!id) {
      toast.error("Missing registration id");
      return;
    }

    setResendBusyId(String(id));
    try {
      await axios.post(`${API}/admin/registrations/${id}/resend`, {}, { headers: authHeader() });
      toast.success("Confirmation email resent");
      await fetchRegistrations({ isRefresh: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Resend failed";
      toast.error(msg);
      // eslint-disable-next-line no-console
      console.error("resendConfirmation error:", err);
    } finally {
      setResendBusyId("");
    }
  };

  // ✅ Copy confirmation code (per row)
  const copyConfirmationCode = async (it) => {
    const code = String(it?.confirmation_code || it?.confirmationCode || "").trim();
    if (!code) {
      toast.error("No confirmation code");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Confirmation code copied");
    } catch (e) {
      toast.error("Copy failed");
      // eslint-disable-next-line no-console
      console.error("copyConfirmationCode error:", e);
    }
  };

  // ✅ Chip styles (premium)
  const chipStyle = (active, tone = "neutral") => {
    const base = {
      height: "38px",
      padding: "0 12px",
      borderRadius: "12px",
      border: `1px solid ${THEME.border2}`,
      background: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.90)",
      fontWeight: 800,
      letterSpacing: "0.02em",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      transition: "transform 120ms ease, background 120ms ease, border-color 120ms ease",
    };

    if (!active) return base;

    if (tone === "orange") {
      return { ...base, background: "rgba(255,122,24,0.18)", border: "1px solid rgba(255,122,24,0.35)" };
    }
    if (tone === "green") {
      return { ...base, background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.30)" };
    }
    return { ...base, background: "rgba(255,255,255,0.06)", border: `1px solid ${THEME.border2}` };
  };

  // ✅ Donut chart helpers (Paid vs Pending registrations)
  const donut = useMemo(() => {
    const paid = totalPaidCount;
    const pending = totalPendingCount;
    const total = paid + pending;
    const pct = total ? paid / total : 0;

    const size = 82;
    const stroke = 10;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = pct * c;

    return { paid, pending, total, pct, size, stroke, r, c, dash };
  }, [totalPaidCount, totalPendingCount]);

  // ✅ CSV Export (frontend-only) using sortedItems (current view + sort)
  const exportCsv = () => {
    try {
      const headers = [
        "id",
        "company",
        "contact",
        "email",
        "phone",
        "payment_method",
        "amount",
        "status",
        "confirmation_code",
        "created_at",
        "players",
      ];

      const escape = (v) => {
        const s = String(v ?? "");
        const cleaned = s.replace(/\r?\n|\r/g, " ").trim();
        if (/[",]/.test(cleaned)) return `"${cleaned.replace(/"/g, '""')}"`;
        return cleaned;
      };

      const rows = sortedItems.map((it) => {
        const id = it?.id || it?._id || "";
        const company = it?.company || it?.organization || "";
        const contact = contactLabel(it);
        const email = it?.email || "";
        const phone = it?.phone || it?.phone_number || "";
        const payment = it?.payment_method || it?.paymentMethod || "";
        const amount = it?.amount ?? "";
        const status = it?.status ?? "";
        const code = it?.confirmation_code || it?.confirmationCode || "";
        const created = it?.created_at || it?.createdAt || it?.created || it?.timestamp || "";
        const players = playersLabel(it);

        return [
          escape(id),
          escape(company),
          escape(contact),
          escape(email),
          escape(phone),
          escape(payment),
          escape(amount),
          escape(status),
          escape(code),
          escape(created),
          escape(players),
        ].join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(
        2,
        "0"
      )}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = `afcpr_registrations_${filterStatus}_${sortKey}_${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("CSV exported");
    } catch (e) {
      toast.error("CSV export failed");
      // eslint-disable-next-line no-console
      console.error("CSV export failed:", e);
    }
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return "—";
    try {
      return lastUpdated.toLocaleString();
    } catch {
      return String(lastUpdated);
    }
  }, [lastUpdated]);

  // ✅ Sticky header styles
  const thBase = {
    borderColor: THEME.border,
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(12,17,23,0.92)", // dark solid-ish so it stays readable
    backdropFilter: "blur(8px)",
  };

  // ✅ Sticky Actions column styles
  const thActions = {
    ...thBase,
    right: 0,
    zIndex: 30, // above other sticky th
    boxShadow: "-12px 0 18px rgba(0,0,0,0.28)",
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
                <p className="text-sm mt-1" style={{ color: THEME.subtext }}>
                  Admin Dashboard — Registrations Overview
                </p>
                <p className="text-xs mt-2" style={{ color: THEME.muted }}>
                  Last updated: {lastUpdatedLabel}
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
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ✅ Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Players Registered */}
            <div
              className="rounded-2xl border p-5"
              style={{
                background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
                borderColor: THEME.border,
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: THEME.muted }}>
                Total Players Registered
              </div>
              <div className="mt-2 text-3xl font-semibold">{totalPlayersRegistered}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs" style={{ color: THEME.subtext }}>
                  <span>Players Paid</span>
                  <span>
                    {totalPlayersPaid} / {totalPlayersRegistered} ({playersPaidPct.toFixed(0)}%)
                  </span>
                </div>
                <div
                  className="mt-2 h-2.5 rounded-full border overflow-hidden"
                  style={{ borderColor: THEME.border2, background: "rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${playersPaidPct}%`,
                      background: `linear-gradient(90deg, ${THEME.ok}, rgba(34,197,94,0.55))`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 text-xs" style={{ color: THEME.muted }}>
                Registrations: {totalAllCount} · Paid: {totalPaidCount} · Pending: {totalPendingCount}
              </div>
            </div>

            {/* Total Players Paid */}
            <div
              className="rounded-2xl border p-5"
              style={{
                background: `linear-gradient(180deg, rgba(34,197,94,0.10), ${THEME.panel})`,
                borderColor: "rgba(34,197,94,0.25)",
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: THEME.muted }}>
                Total Players Paid
              </div>
              <div className="mt-2 text-3xl font-semibold">{totalPlayersPaid}</div>
              <div className="mt-1 text-sm" style={{ color: THEME.subtext }}>
                Counts only players from PAID registrations
              </div>
              <div className="mt-4 flex items-center gap-3">
                <svg width={donut.size} height={donut.size} viewBox={`0 0 ${donut.size} ${donut.size}`}>
                  <circle
                    cx={donut.size / 2}
                    cy={donut.size / 2}
                    r={donut.r}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={donut.stroke}
                  />
                  <circle
                    cx={donut.size / 2}
                    cy={donut.size / 2}
                    r={donut.r}
                    fill="transparent"
                    stroke="rgba(34,197,94,0.95)"
                    strokeWidth={donut.stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${donut.dash} ${donut.c - donut.dash}`}
                    transform={`rotate(-90 ${donut.size / 2} ${donut.size / 2})`}
                  />
                </svg>

                <div className="text-sm">
                  <div className="font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                    Paid vs Pending
                  </div>
                  <div className="mt-1" style={{ color: THEME.subtext }}>
                    Paid: <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>{donut.paid}</span>
                  </div>
                  <div style={{ color: THEME.subtext }}>
                    Pending: <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>{donut.pending}</span>
                  </div>
                  <div className="mt-1 text-xs" style={{ color: THEME.muted }}>
                    Paid rate: {(donut.pct * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount Paid */}
            <div
              className="rounded-2xl border p-5"
              style={{
                background: `linear-gradient(180deg, rgba(255,122,24,0.10), ${THEME.panel})`,
                borderColor: "rgba(255,122,24,0.25)",
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em]" style={{ color: THEME.muted }}>
                Total Amount (Paid)
              </div>
              <div className="mt-2 text-3xl font-semibold">{formatMoney(totalPaidAmount)}</div>
              <div className="mt-1 text-sm" style={{ color: THEME.subtext }}>
                Audit total sums only PAID registrations
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="h-10 px-4 rounded-xl border text-sm font-semibold transition active:scale-[0.99]"
                  style={{
                    background: "rgba(255,122,24,0.14)",
                    borderColor: "rgba(255,122,24,0.30)",
                    color: "rgba(255,255,255,0.95)",
                    width: "100%",
                  }}
                  title="Export the current view (filters + search + sort) to CSV"
                >
                  Export CSV (Current View)
                </button>
                <div className="mt-2 text-xs" style={{ color: THEME.muted }}>
                  Exports what you see: {filterStatus.toUpperCase()} + Search + Sort
                </div>
              </div>
            </div>

            {/* Status */}
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

          {/* ✅ Premium toolbar */}
          <div
            className="mt-6 rounded-2xl border px-5 py-4"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Registrations</h2>
                  <p className="text-sm" style={{ color: THEME.subtext }}>
                    Mark PAID after phone processing (no card data stored).
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                {/* Row 1 */}
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="text-xs font-semibold px-3 py-2 rounded-xl border"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: THEME.border2,
                      color: "rgba(255,255,255,0.82)",
                      lineHeight: 1,
                    }}
                    title="Number of rows currently shown (after filters + search + sort)"
                  >
                    Showing: {sortedItems.length}
                  </div>

                  <button type="button" onClick={() => setFilterStatus("all")} style={chipStyle(filterStatus === "all")}>
                    All <span style={{ color: THEME.muted }}>{totalAllCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus("pending")}
                    style={chipStyle(filterStatus === "pending", "orange")}
                  >
                    Pending <span style={{ color: THEME.muted }}>{totalPendingCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus("paid")}
                    style={chipStyle(filterStatus === "paid", "green")}
                  >
                    Paid <span style={{ color: THEME.muted }}>{totalPaidCount}</span>
                  </button>

                  {/* ✅ Sort (FIXED dropdown visibility) */}
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-xs font-semibold" style={{ color: THEME.muted }}>
                      Sort:
                    </span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value)}
                      className="h-[38px] px-3 rounded-xl text-sm outline-none"
                      style={{
                        ...SELECT_DARK,
                        borderRadius: "12px",
                      }}
                      title="Sort current view"
                    >
                      <option value="date_desc" style={OPTION_DARK}>
                        Newest
                      </option>
                      <option value="date_asc" style={OPTION_DARK}>
                        Oldest
                      </option>
                      <option value="amount_desc" style={OPTION_DARK}>
                        Amount (High → Low)
                      </option>
                      <option value="amount_asc" style={OPTION_DARK}>
                        Amount (Low → High)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search: company, email, phone, code, players…"
                    className="h-10 px-3 rounded-xl border text-sm outline-none"
                    style={{
                      width: "340px",
                      maxWidth: "100%",
                      background: "rgba(255,255,255,0.03)",
                      borderColor: THEME.border2,
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="h-10 px-3 rounded-xl border text-sm font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: THEME.border2,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Table (Sticky header + Sticky actions col) */}
          <div
            className="mt-4 rounded-2xl border overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            }}
          >
            <div className="w-full overflow-x-auto" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <table className="min-w-[1150px] w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ color: "rgba(255,255,255,0.78)" }}>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Company
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Contact
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Email
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Players
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Payment
                    </th>
                    <th className="text-right font-semibold px-5 py-3 border-b" style={thBase}>
                      Amount
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Status
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thBase}>
                      Created
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={thActions}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-5 py-6" colSpan={9} style={{ color: THEME.subtext }}>
                        Loading registrations…
                      </td>
                    </tr>
                  ) : sortedItems.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6" colSpan={9} style={{ color: THEME.subtext }}>
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((it, idx) => {
                      const status = String(it?.status || "pending").toLowerCase();
                      const isPaid = status === "paid";
                      const rowId = String(it?.id || it?._id || "");
                      const code = String(it?.confirmation_code || it?.confirmationCode || "").trim();

                      const rowBg = idx % 2 === 0 ? "rgba(255,255,255,0.00)" : "rgba(255,255,255,0.02)";

                      return (
                        <tr key={rowId || idx} style={{ background: rowBg }}>
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
                            {playersLabel(it)}
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
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold"
                              style={{
                                background: isPaid ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                                borderColor: isPaid ? "rgba(34,197,94,0.28)" : THEME.border2,
                                color: isPaid ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.78)",
                              }}
                            >
                              {isPaid ? "PAID" : "PENDING"}
                            </span>
                          </td>
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                            {createdLabel(it)}
                          </td>

                          {/* ✅ Sticky Actions column */}
                          <td
                            className="px-5 py-3 border-b"
                            style={{
                              borderColor: THEME.border,
                              position: "sticky",
                              right: 0,
                              zIndex: 10,
                              background: rowBg,
                              boxShadow: "-12px 0 18px rgba(0,0,0,0.22)",
                              backdropFilter: "blur(6px)",
                            }}
                          >
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => copyConfirmationCode(it)}
                                disabled={!code}
                                className="h-9 px-3 rounded-xl border text-xs font-semibold transition active:scale-[0.99]"
                                style={{
                                  background: code ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
                                  borderColor: THEME.border2,
                                  color: "rgba(255,255,255,0.90)",
                                  opacity: code ? 1 : 0.55,
                                  cursor: code ? "pointer" : "not-allowed",
                                }}
                                title={code ? `Copy confirmation code: ${code}` : "No confirmation code"}
                              >
                                Copy Code
                              </button>

                              {/* ✅ NEW: Resend button */}
                              <button
                                type="button"
                                onClick={() => resendConfirmation(it)}
                                disabled={!rowId || resendBusyId === rowId}
                                className="h-9 px-3 rounded-xl border text-xs font-semibold transition active:scale-[0.99]"
                                style={{
                                  background: "rgba(59,130,246,0.10)",
                                  borderColor: "rgba(59,130,246,0.30)",
                                  color: "rgba(255,255,255,0.95)",
                                  opacity: resendBusyId === rowId ? 0.70 : 1,
                                  cursor: resendBusyId === rowId ? "not-allowed" : "pointer",
                                }}
                                title="Resend confirmation email and log the attempt"
                              >
                                {resendBusyId === rowId ? "Resending..." : "Resend"}
                              </button>

                              <button
                                onClick={() => markPaid(it)}
                                disabled={isPaid || busyId === rowId}
                                className="h-9 px-3 rounded-xl border text-xs font-semibold transition active:scale-[0.99]"
                                style={{
                                  background: isPaid ? "rgba(255,255,255,0.03)" : "rgba(255,122,24,0.14)",
                                  borderColor: isPaid ? THEME.border2 : "rgba(255,122,24,0.35)",
                                  color: "rgba(255,255,255,0.95)",
                                  opacity: isPaid || busyId === rowId ? 0.65 : 1,
                                  cursor: isPaid ? "not-allowed" : "pointer",
                                }}
                                title={isPaid ? "Already paid" : "Mark as paid after phone processing"}
                              >
                                {isPaid ? "Paid" : busyId === rowId ? "Updating..." : "Mark Paid"}
                              </button>
                            </div>
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