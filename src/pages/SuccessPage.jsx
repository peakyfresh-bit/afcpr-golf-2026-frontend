import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Users, Building2, CreditCard, Mail, ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1) Si venimos desde submit, esto existe:
  const stateRegistration = location.state?.registration;

  // 2) Si refrescamos, el state se pierde; usamos ?code=
  const codeFromUrl = searchParams.get("code");

  // Estado final que usará la UI
  const [registration, setRegistration] = useState(stateRegistration || null);

  // Si hay code en URL, queremos fetch para soportar refresh / link compartido.
  const [loading, setLoading] = useState(!!codeFromUrl && !stateRegistration);

  // Guard: solo hacemos fetch si hay code en URL
  const shouldFetch = useMemo(() => !!codeFromUrl, [codeFromUrl]);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;

    async function fetchByCode() {
      try {
        setError("");
        setLoading(true);

        // ✅ IMPORTANTE:
        // Este endpoint existe en tu backend:
        // GET /api/registrations/confirm/{code}
        const res = await axios.get(
          `${API}/registrations/confirm/${encodeURIComponent(codeFromUrl)}`
        );

        if (!cancelled) setRegistration(res.data);
      } catch (err) {
        // ⚠️ No pongas registration en null aquí, porque en refresh te redirige al home.
        // Mejor mostramos error y dejamos lo que haya (o se quedará null y mostramos mensaje).
        const msg =
          err?.response?.data?.detail ||
          "No se pudo cargar el registro. Verifica el código de confirmación.";

        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchByCode();

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, codeFromUrl]);

  // Si está cargando, mostramos algo simple
  if (loading) {
    return (
      <div className="app-container min-h-screen flex items-center justify-center px-4 py-8">
        <div className="form-card p-8 md:p-12 text-center max-w-2xl w-full">
          <p className="text-white text-xl font-semibold mb-2">Cargando registro...</p>
          <p className="text-gray-400">Un momento por favor.</p>
        </div>
      </div>
    );
  }

  // Si no hay registration (y no está cargando), mostramos un mensaje en vez de mandar al home
  // Esto es mejor UX si la gente abre el link tarde o el code está mal.
  if (!registration) {
    return (
      <div className="app-container min-h-screen flex items-center justify-center px-4 py-8">
        <div className="form-card p-8 md:p-12 text-center max-w-2xl w-full">
          <h1 className="header-title text-2xl md:text-3xl text-white mb-3">
            No pudimos cargar tu registro
          </h1>
          <p className="text-gray-400 mb-6">
            {error || "El enlace puede estar incompleto o el código no existe."}
          </p>

          {codeFromUrl && (
            <div className="bg-[#1a1c1e] p-4 rounded-lg border border-orange-500/30 mb-6">
              <p className="text-gray-400 text-sm mb-1">Código detectado</p>
              <p className="text-xl font-bold text-orange-500 tracking-wider">
                {codeFromUrl}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate("/")}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            Volver al Registro
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const paymentMethodLabel =
    {
      cheque: "Cheque",
      visa: "Visa",
      mastercard: "Mastercard",
    }[registration.payment_method] || registration.payment_method;

  const validPlayers = registration.players?.filter((p) => p.name?.trim()) || [];

  return (
    <div className="app-container min-h-screen flex items-center justify-center px-4 py-8" data-testid="success-page">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="form-card p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center success-checkmark">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="header-title text-3xl md:text-4xl text-white mb-2" data-testid="success-title">
            ¡Registro Exitoso!
          </h1>
          <p className="text-gray-400 mb-8">Su registro ha sido procesado correctamente</p>

          {/* Optional error (non-blocking) */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Confirmation Code */}
          <div className="bg-[#1a1c1e] p-6 rounded-lg border border-orange-500/30 mb-8">
            <p className="text-gray-400 text-sm mb-2">Código de Confirmación</p>
            <p className="text-3xl md:text-4xl font-bold text-orange-500 tracking-wider" data-testid="confirmation-code">
              {registration.confirmation_code}
            </p>
          </div>

          {/* Registration Details */}
          <div className="text-left space-y-6 mb-8">
            {/* Team Info */}
            <div className="bg-[#1a1c1e] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400 text-sm font-medium">Equipo</span>
              </div>
              <div className="space-y-2">
                {validPlayers.length ? (
                  validPlayers.map((player, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-white">{player.name}</span>
                      <span className="text-gray-400">{player.shirt_size}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay jugadores registrados.</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-[#1a1c1e] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400 text-sm font-medium">Contacto</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-white">{registration.company}</p>
                <p className="text-gray-400">{registration.email}</p>
                <p className="text-gray-400">{registration.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-[#1a1c1e] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400 text-sm font-medium">Pago</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">{paymentMethodLabel}</p>
                  {registration.last4 && <p className="text-gray-400 text-sm">•••• {registration.last4}</p>}
                </div>
                <p className="text-2xl font-bold text-orange-500" data-testid="payment-amount">
                  ${registration.amount?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Email Notice */}
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-8">
            <Mail className="w-4 h-4" />
            <span>Se envió confirmación a su correo</span>
          </div>

          {/* New Registration Button */}
          <button
            onClick={() => navigate("/")}
            className="btn-secondary w-full flex items-center justify-center gap-2"
            data-testid="new-registration-btn"
          >
            Registrar Otro Equipo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>AFCPR Golf Tournament 2026</p>
        </footer>
      </div>
    </div>
  );
}