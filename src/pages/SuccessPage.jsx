import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { CheckCircle, Users, Building2, CreditCard, Mail, ArrowRight } from "lucide-react";

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const registration = location.state?.registration;

  if (!registration) {
    return <Navigate to="/" replace />;
  }

  const paymentMethodLabel = {
    cheque: "Cheque",
    visa: "Visa",
    mastercard: "Mastercard",
  }[registration.payment_method] || registration.payment_method;

  const validPlayers = registration.players?.filter(p => p.name?.trim()) || [];

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
                {validPlayers.map((player, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white">{player.name}</span>
                    <span className="text-gray-400">{player.shirt_size}</span>
                  </div>
                ))}
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
                  {registration.last4 && (
                    <p className="text-gray-400 text-sm">•••• {registration.last4}</p>
                  )}
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
