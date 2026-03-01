// ✅ DEBUG MARKER: ADMIN DASHBOARD THEME v4 PREMIUM (Filters + Search + Paid Auditing)
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

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // ✅ Premium controls
  const [filterStatus, setFilterStatus] = useState("all"); // all | paid | pending (pending = NOT paid)
  const [query, setQuery] = useState("");

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

  // ✅ Quick stats used in filters UI
  const totalAllCount = (items || []).length;

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

  // ✅ Mark Paid: ENDPOINT REAL (Swagger)
  // PATCH /api/admin/registrations/{registration_id}/status
  // Body: { "status": "paid" }
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

      // Update UI optimista: marcar paid localmente
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

  // ✅ Small helper for filter chips
  const chipStyle = (active, tone = "neutral") => {
    const base = {
      height: "38px",
      padding: "0 12px",
      borderRadius: "12px",
      border: `1px solid ${THEME.border2}`,
      background: "rgba(255,255,255,0.03)",
      color: "rgba(255,255,255,0.90)",
      fontWeight: 700,
      letterSpacing: "0.02em",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      transition: "transform 120ms ease, background 120ms ease, border-color 120ms ease",
    };

    if (!active) return base;

    if (tone === "orange") {
      return {
        ...base,
        background: "rgba(255,122,24,0.18)",
        border: "1px solid rgba(255,122,24,0.35)",
      };
    }
    if (tone === "green") {
      return {
        ...base,
        background: "rgba(34,197,94,0.14)",
        border: "1px solid rgba(34,197,94,0.30)",
      };
    }
    return {
      ...base,
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${THEME.border2}`,
    };
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
          {/* ✅ Cards row: exactly 4 cards in one row (md) */}
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
              <div className="mt-1 text-sm" style={{ color: THEME.subtext }}>
                Counts non-empty player names across all registrations
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

          {/* ✅ Premium controls */}
          <div
            className="mt-6 rounded-2xl border px-5 py-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Registrations</h2>
                <p className="text-sm" style={{ color: THEME.subtext }}>
                  Mark PAID after phone processing (no card data stored).
                </p>
              </div>

              <div
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: THEME.border2,
                  color: "rgba(255,255,255,0.82)",
                  height: "fit-content",
                }}
              >
                Showing: {filteredItems.length}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-end">
              {/* Filter chips */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  style={chipStyle(filterStatus === "all", "neutral")}
                  title="Show all registrations"
                >
                  All <span style={{ color: THEME.muted }}>{totalAllCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("pending")}
                  style={chipStyle(filterStatus === "pending", "orange")}
                  title="Show pending (not paid)"
                >
                  Pending <span style={{ color: THEME.muted }}>{totalPendingCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("paid")}
                  style={chipStyle(filterStatus === "paid", "green")}
                  title="Show paid only"
                >
                  Paid <span style={{ color: THEME.muted }}>{totalPaidCount}</span>
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search: company, email, phone, code, players…"
                  className="h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{
                    width: "320px",
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
                  title="Clear search"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Table */}
          <div
            className="mt-4 rounded-2xl border overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${THEME.panel2}, ${THEME.panel})`,
              borderColor: THEME.border,
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            }}
          >
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1150px] w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.78)" }}>
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
                      Players
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Payment
                    </th>
                    <th
                      className="text-right font-semibold px-5 py-3 border-b"
                      style={{ borderColor: THEME.border }}
                    >
                      Amount
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Status
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
                      Created
                    </th>
                    <th className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
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
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6" colSpan={9} style={{ color: THEME.subtext }}>
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((it, idx) => {
                      const status = String(it?.status || "pending").toLowerCase();
                      const isPaid = status === "paid";
                      const rowId = String(it?.id || it?._id || "");

                      return (
                        <tr
                          key={rowId || idx}
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
                          <td className="px-5 py-3 border-b" style={{ borderColor: THEME.border }}>
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