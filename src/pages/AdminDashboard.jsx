import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Search, Download, LogOut, Eye, EyeOff, Users, DollarSign,
  CheckCircle, Clock, XCircle, AlertTriangle, RefreshCw, CreditCard, Mail, Send
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealReason, setRevealReason] = useState("");
  const [revealedCard, setRevealedCard] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [cardHideTimeout, setCardHideTimeout] = useState(null);
  
  // Email resend state
  const [emailStatus, setEmailStatus] = useState({ email_configured: false });
  const [resendCount, setResendCount] = useState({ remaining: 3 });
  const [isResending, setIsResending] = useState(false);

  const getToken = useCallback(() => {
    return localStorage.getItem("admin_token");
  }, []);

  const fetchRegistrations = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/admin");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(`${API}/admin/registrations?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("admin_token");
        navigate("/admin");
      } else {
        toast.error("Error al cargar registros");
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, navigate, search, statusFilter]);

  useEffect(() => {
    fetchRegistrations();
    // Check email configuration status
    const checkEmailStatus = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const response = await axios.get(`${API}/admin/email_status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmailStatus(response.data);
      } catch (err) {
        console.error("Failed to check email status");
      }
    };
    checkEmailStatus();
  }, [fetchRegistrations, getToken]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  const handleExport = async () => {
    const token = getToken();
    try {
      const response = await axios.get(`${API}/admin/export.csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `afcpr_registrations_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Exportación completada");
    } catch (err) {
      toast.error("Error al exportar");
    }
  };

  const handleStatusChange = async (registrationId, newStatus) => {
    const token = getToken();
    try {
      await axios.patch(`${API}/admin/registrations/${registrationId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Estado actualizado a ${newStatus}`);
      fetchRegistrations();
      
      if (selectedRegistration?.id === registrationId) {
        setSelectedRegistration(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleRevealCard = async () => {
    if (!revealReason.trim() || revealReason.trim().length < 5) {
      toast.error("La razón debe tener al menos 5 caracteres");
      return;
    }

    const token = getToken();
    setIsRevealing(true);
    
    try {
      const response = await axios.post(
        `${API}/admin/registrations/${selectedRegistration.id}/reveal_card`,
        { reason: revealReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRevealedCard(response.data);
      setShowRevealModal(false);
      setRevealReason("");
      
      // Auto-hide after 30 seconds
      if (cardHideTimeout) clearTimeout(cardHideTimeout);
      const timeout = setTimeout(() => {
        setRevealedCard(null);
      }, 30000);
      setCardHideTimeout(timeout);
      
      toast.success("Tarjeta revelada - se ocultará en 30 segundos");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al revelar tarjeta");
    } finally {
      setIsRevealing(false);
    }
  };

  const hideCard = () => {
    if (cardHideTimeout) clearTimeout(cardHideTimeout);
    setRevealedCard(null);
  };

  const fetchResendCount = async (registrationId) => {
    const token = getToken();
    try {
      const response = await axios.get(`${API}/admin/registrations/${registrationId}/resend_count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResendCount(response.data);
    } catch (err) {
      setResendCount({ remaining: 0 });
    }
  };

  const handleResendEmail = async () => {
    if (!selectedRegistration) return;
    
    const token = getToken();
    setIsResending(true);
    
    try {
      const response = await axios.post(
        `${API}/admin/registrations/${selectedRegistration.id}/resend_email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message);
      setResendCount(prev => ({ ...prev, remaining: response.data.remaining_resends }));
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Error al reenviar correo";
      toast.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  const openDetail = (registration) => {
    setSelectedRegistration(registration);
    setRevealedCard(null);
    setResendCount({ remaining: 3 });
    fetchResendCount(registration.id);
    setShowDetailModal(true);
  };

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === "pending").length,
    paid: registrations.filter(r => r.status === "paid").length,
    cancelled: registrations.filter(r => r.status === "cancelled").length,
    totalAmount: registrations.reduce((sum, r) => sum + (r.amount || 0), 0),
  };

  const statusBadge = (status) => {
    const styles = {
      pending: "badge badge-pending",
      paid: "badge badge-paid",
      cancelled: "badge badge-cancelled",
    };
    const labels = {
      pending: "Pendiente",
      paid: "Pagado",
      cancelled: "Cancelado",
    };
    return <span className={styles[status] || "badge"}>{labels[status] || status}</span>;
  };

  return (
    <div className="app-container min-h-screen" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-[#232629] border-b border-gray-700 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="header-title text-2xl md:text-3xl text-white" data-testid="dashboard-title">
              Panel de Administración
            </h1>
            <p className="text-gray-400 text-sm">AFCPR Golf Tournament 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm h-auto"
              data-testid="export-btn"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm h-auto text-red-400 border-red-500/30 hover:border-red-500"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="form-card p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-total">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="form-card p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-gray-400 text-sm">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-500" data-testid="stat-pending">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="form-card p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-gray-400 text-sm">Pagados</p>
                <p className="text-2xl font-bold text-green-500" data-testid="stat-paid">{stats.paid}</p>
              </div>
            </div>
          </div>
          <div className="form-card p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-gray-400 text-sm">Cancelados</p>
                <p className="text-2xl font-bold text-red-500" data-testid="stat-cancelled">{stats.cancelled}</p>
              </div>
            </div>
          </div>
          <div className="form-card p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-gray-400 text-sm">Total $</p>
                <p className="text-2xl font-bold text-orange-500" data-testid="stat-amount">
                  ${stats.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa, email, jugador o código..."
              className="custom-input pl-12"
              data-testid="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="custom-select w-full md:w-48"
            data-testid="status-filter"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <button
            onClick={fetchRegistrations}
            className="btn-secondary px-4 flex items-center justify-center gap-2 h-14"
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="form-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No se encontraron registros
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Empresa</th>
                    <th>Jugadores</th>
                    <th>Pago</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} data-testid={`registration-row-${reg.id}`}>
                      <td className="font-mono text-orange-500">{reg.confirmation_code}</td>
                      <td>
                        <div>
                          <p className="text-white">{reg.company}</p>
                          <p className="text-gray-400 text-sm">{reg.email}</p>
                        </div>
                      </td>
                      <td>
                        <p className="text-white">
                          {reg.players?.filter(p => p.name?.trim()).length || 0} jugadores
                        </p>
                        <p className="text-gray-400 text-sm truncate max-w-[150px]">
                          {reg.players?.find(p => p.name?.trim())?.name || "-"}
                        </p>
                      </td>
                      <td>
                        <p className="text-white capitalize">{reg.payment_method}</p>
                        {reg.last4 && (
                          <p className="text-gray-400 text-sm">•••• {reg.last4}</p>
                        )}
                      </td>
                      <td className="text-white font-semibold">${reg.amount?.toLocaleString()}</td>
                      <td>{statusBadge(reg.status)}</td>
                      <td>
                        <button
                          onClick={() => openDetail(reg)}
                          className="btn-secondary px-3 py-2 text-sm h-auto"
                          data-testid={`view-btn-${reg.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-[#232629] border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-500">
              {selectedRegistration?.confirmation_code}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Detalles del registro
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6 mt-4">
              {/* Status Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Estado:</span>
                  {statusBadge(selectedRegistration.status)}
                </div>
                <div className="flex gap-2">
                  {["pending", "paid", "cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedRegistration.id, status)}
                      disabled={selectedRegistration.status === status}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        selectedRegistration.status === status
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-[#1a1c1e] text-gray-300 hover:bg-gray-700"
                      }`}
                      data-testid={`status-btn-${status}`}
                    >
                      {status === "pending" && "Pendiente"}
                      {status === "paid" && "Pagado"}
                      {status === "cancelled" && "Cancelado"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team */}
              <div className="bg-[#1a1c1e] p-4 rounded-lg">
                <h3 className="text-orange-500 font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Equipo
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedRegistration.players?.filter(p => p.name?.trim()).map((player, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-white">{player.name}</span>
                      <span className="text-gray-400">{player.shirt_size}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[#1a1c1e] p-4 rounded-lg">
                <h3 className="text-orange-500 font-semibold mb-3">Contacto</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Empresa:</span> <span className="text-white">{selectedRegistration.company}</span></p>
                  <p><span className="text-gray-400">Email:</span> <span className="text-white">{selectedRegistration.email}</span></p>
                  <p><span className="text-gray-400">Teléfono:</span> <span className="text-white">{selectedRegistration.phone}</span></p>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-[#1a1c1e] p-4 rounded-lg">
                <h3 className="text-orange-500 font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Pago
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Método:</span> <span className="text-white capitalize">{selectedRegistration.payment_method}</span></p>
                  <p><span className="text-gray-400">Monto:</span> <span className="text-white font-bold">${selectedRegistration.amount?.toLocaleString()}</span></p>
                  
                  {selectedRegistration.payment_method !== "cheque" && (
                    <>
                      <p><span className="text-gray-400">Titular:</span> <span className="text-white">{selectedRegistration.cardholder_name}</span></p>
                      <p><span className="text-gray-400">Expiración:</span> <span className="text-white">{selectedRegistration.expiration}</span></p>
                      
                      {/* Card Number - Masked or Revealed */}
                      <div className="mt-4 p-4 bg-[#232629] rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-sm mb-2">Número de Tarjeta:</p>
                        {revealedCard ? (
                          <div className="space-y-3">
                            <p className="card-number-reveal" data-testid="revealed-card-number">
                              {revealedCard.card_number.replace(/(\d{4})/g, "$1 ").trim()}
                            </p>
                            <button
                              onClick={hideCard}
                              className="btn-secondary px-4 py-2 text-sm h-auto flex items-center gap-2"
                              data-testid="hide-card-btn"
                            >
                              <EyeOff className="w-4 h-4" />
                              Ocultar
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-white font-mono text-lg">•••• •••• •••• {selectedRegistration.last4}</p>
                            <button
                              onClick={() => setShowRevealModal(true)}
                              className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-500/30 transition-colors"
                              data-testid="reveal-card-btn"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Tarjeta Completa
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Created At */}
              <p className="text-gray-500 text-sm">
                Registrado: {new Date(selectedRegistration.created_at).toLocaleString("es-PR")}
              </p>

              {/* Resend Email Section */}
              <div className="bg-[#1a1c1e] p-4 rounded-lg border border-gray-700">
                <h3 className="text-orange-500 font-semibold mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5" /> Reenviar Confirmación
                </h3>
                
                {!emailStatus.email_configured ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      El servicio de correo no está configurado. Contacte al administrador del sistema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        Reenvíos disponibles: <span className="text-white font-semibold">{resendCount.remaining}</span> de 3
                      </span>
                      <span className="text-gray-500 text-xs">
                        Se enviará a {selectedRegistration.email}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleResendEmail}
                      disabled={isResending || resendCount.remaining <= 0}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        resendCount.remaining <= 0
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                      }`}
                      data-testid="resend-email-btn"
                    >
                      {isResending ? (
                        <>
                          <div className="spinner" />
                          Enviando...
                        </>
                      ) : resendCount.remaining <= 0 ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Límite de reenvíos alcanzado
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Reenviar Confirmación
                        </>
                      )}
                    </button>
                    
                    {resendCount.remaining > 0 && (
                      <p className="text-gray-500 text-xs text-center">
                        Se enviará copia a {emailStatus.admin_email || "admin"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reveal Card Modal */}
      <Dialog open={showRevealModal} onOpenChange={setShowRevealModal}>
        <DialogContent className="bg-[#232629] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Acceso a Información Sensible
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Este acceso será registrado en el sistema de auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 text-sm">
                Al revelar el número completo de la tarjeta, esta acción quedará registrada con su identificador, fecha/hora y razón.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-medium">
                Razón del acceso <span className="text-red-500">*</span>
              </label>
              <textarea
                value={revealReason}
                onChange={(e) => setRevealReason(e.target.value)}
                placeholder="Ej: Procesamiento manual de pago en terminal"
                className="custom-input h-24 resize-none"
                data-testid="reveal-reason-input"
              />
              <p className="text-gray-500 text-xs">Mínimo 5 caracteres</p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowRevealModal(false);
                setRevealReason("");
              }}
              className="btn-secondary flex-1"
              data-testid="cancel-reveal-btn"
            >
              Cancelar
            </button>
            <button
              onClick={handleRevealCard}
              disabled={revealReason.trim().length < 5 || isRevealing}
              className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
              data-testid="confirm-reveal-btn"
            >
              {isRevealing ? (
                <>
                  <div className="spinner" />
                  Revelando...
                </>
              ) : (
                "Confirmar y Revelar"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
