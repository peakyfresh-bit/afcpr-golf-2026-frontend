import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Verify token by making a test request
      await axios.get(`${API}/admin/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Store token and navigate
      localStorage.setItem("admin_token", token);
      toast.success("Acceso autorizado");
      navigate("/admin/dashboard");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Token inválido");
      } else {
        setError("Error de conexión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container min-h-screen flex items-center justify-center px-4" data-testid="admin-login-page">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="form-card p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="header-title text-2xl md:text-3xl text-white mb-2" data-testid="login-title">
              Panel de Administración
            </h1>
            <p className="text-gray-400">AFCPR Golf Tournament 2026</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-gray-400 text-sm font-medium">
                Token de Acceso
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingrese su token de administrador"
                className="custom-input"
                data-testid="admin-token-input"
                autoFocus
              />
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span data-testid="login-error">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!token.trim() || isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Verificando...
                </>
              ) : (
                <>
                  Acceder
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 text-sm hover:text-orange-500 transition-colors"
              data-testid="back-to-registration"
            >
              ← Volver al registro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
