import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Users, Building2, CreditCard, Mail, Phone, CheckCircle, User } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ✅ XS removido (no hay camisas XS)
const SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"];
const PRICE_PER_PLAYER = 275;

const registrationSchema = z.object({
  player1_name: z.string().min(2, "Nombre del jugador 1 es requerido"),
  player1_size: z.string().min(1, "Seleccione talla"),
  player2_name: z.string().optional(),
  player2_size: z.string().optional(),
  player3_name: z.string().optional(),
  player3_size: z.string().optional(),
  player4_name: z.string().optional(),
  player4_size: z.string().optional(),
  company: z.string().min(2, "Nombre de empresa es requerido"),
  contact_name: z.string().min(2, "Nombre del contacto es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(7, "Teléfono debe tener al menos 7 dígitos"),
  // ✅ Solo dos opciones visibles. Para "tarjeta por teléfono" usamos "visa" (existente en backend)
  payment_method: z.enum(["cheque", "visa"]),
});

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      player1_name: "",
      player1_size: "",
      player2_name: "",
      player2_size: "",
      player3_name: "",
      player3_size: "",
      player4_name: "",
      player4_size: "",
      company: "",
      contact_name: "",
      email: "",
      phone: "",
      payment_method: "cheque",
    },
  });

  const paymentMethod = watch("payment_method");
  const isCardByPhone = paymentMethod === "visa";

  // Calculate player count based on filled names
  const player1 = watch("player1_name");
  const player2 = watch("player2_name");
  const player3 = watch("player3_name");
  const player4 = watch("player4_name");

  useEffect(() => {
    let count = 0;
    if (player1?.trim()) count++;
    if (player2?.trim()) count++;
    if (player3?.trim()) count++;
    if (player4?.trim()) count++;
    setPlayerCount(Math.max(count, 1));
  }, [player1, player2, player3, player4]);

  const totalAmount = playerCount * PRICE_PER_PLAYER;

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const players = [
        { name: data.player1_name || "", shirt_size: data.player1_size || "" },
        { name: data.player2_name || "", shirt_size: data.player2_size || "" },
        { name: data.player3_name || "", shirt_size: data.player3_size || "" },
        { name: data.player4_name || "", shirt_size: data.player4_size || "" },
      ];

      const payload = {
        players,
        company: data.company,
        contact_name: data.contact_name, // ✅ NEW
        email: data.email,
        phone: data.phone, // ✅ obligatorio
        payment_method: data.payment_method, // "cheque" o "visa" (visa = tarjeta por teléfono)
        amount: totalAmount,
        // ✅ mantenemos este campo por compatibilidad si el backend lo espera
        authorization_accepted: false,
      };

      const response = await axios.post(`${API}/registrations`, payload);

      navigate(`/success?code=${response.data.confirmation_code}`, {
        state: { registration: response.data },
      });
    } catch (error) {
      const message = error.response?.data?.detail || "Error al procesar el registro";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container min-h-screen" data-testid="registration-page">
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="header-title text-4xl md:text-5xl lg:text-6xl text-orange-500 mb-4" data-testid="page-title">
            AFCPR Golf Tournament
          </h1>
          <p className="text-2xl md:text-3xl text-white font-semibold mb-4">7th Edition</p>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-gray-400 text-sm md:text-base">
            <span>Registro desde 7:00 AM</span>
            <span className="text-orange-500">|</span>
            <span>Shotgun Start: 8:30 AM</span>
            <span className="text-orange-500">|</span>
            <span>Inscripciones hasta el 1 de mayo de 2026</span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-6">
            <div className="bg-[#232629] px-6 py-3 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Formato</span>
              <p className="text-white font-semibold">4 Man Scramble</p>
            </div>
            <div className="bg-[#232629] px-6 py-3 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Costo</span>
              <p className="text-orange-500 font-bold text-xl">${PRICE_PER_PLAYER} / jugador</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Team Section */}
          <section className="form-card p-6 md:p-8" data-testid="team-section">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Información del Equipo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-3">
                  <label className="block text-gray-400 text-sm font-medium">
                    Jugador {num} {num === 1 && <span className="text-orange-500">*</span>}
                  </label>

                  <div className="flex gap-3 items-stretch">
                    <input
                      type="text"
                      {...register(`player${num}_name`)}
                      placeholder={`Nombre del jugador ${num}`}
                      className="custom-input"
                      style={{ flex: 1 }}
                      data-testid={`player${num}-name`}
                    />

                    <select
                      {...register(`player${num}_size`)}
                      className="custom-select"
                      style={{ width: "100px" }}
                      data-testid={`player${num}-size`}
                    >
                      <option value="">Talla</option>
                      {SHIRT_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errors?.[`player${num}_name`] && (
                    <p className="text-red-500 text-sm">{errors[`player${num}_name`].message}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section className="form-card p-6 md:p-8" data-testid="contact-section">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Información de Contacto</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="block text-gray-400 text-sm font-medium">
                  Empresa <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("company")}
                  placeholder="Nombre de la empresa"
                  className="custom-input"
                  data-testid="company-input"
                />
                {errors.company && <p className="text-red-500 text-sm">{errors.company.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-gray-400 text-sm font-medium">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombre del Contacto <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("contact_name")}
                  placeholder="Nombre y apellido"
                  className="custom-input"
                  data-testid="contact-name-input"
                />
                {errors.contact_name && <p className="text-red-500 text-sm">{errors.contact_name.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-gray-400 text-sm font-medium">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email <span className="text-orange-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="correo@empresa.com"
                  className="custom-input"
                  data-testid="email-input"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="block text-gray-400 text-sm font-medium">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono <span className="text-orange-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("phone")}
                  placeholder="(787) 555-0123"
                  inputMode="numeric"
                  className="custom-input"
                  data-testid="phone-input"
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
              </div>
            </div>
          </section>

          {/* Payment Section */}
          <section className="form-card p-6 md:p-8" data-testid="payment-section">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Método de Pago</h2>
            </div>

            <div className="space-y-6">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "cheque", label: "Cheque" },
                  { value: "visa", label: "Tarjeta (por teléfono)" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`radio-option ${paymentMethod === option.value ? "selected" : ""}`}
                    data-testid={`payment-${option.value}`}
                  >
                    <input
                      type="radio"
                      {...register("payment_method")}
                      value={option.value}
                      onChange={(e) => setValue("payment_method", e.target.value)}
                    />
                    <span className="text-lg font-medium">{option.label}</span>
                  </label>
                ))}
              </div>

              {/* Card by phone info */}
              {isCardByPhone && (
                <div className="bg-[#1a1c1e] p-4 rounded-lg border border-orange-500/30">
                  <p className="text-gray-200 text-sm leading-6">
                    <span className="text-orange-500 font-semibold">Pago con tarjeta por teléfono:</span>{" "}
                    No escriba información de tarjeta aquí. Luego del registro,{" "}
                    <span className="font-semibold">AFCPR se comunicará con usted</span> al teléfono provisto para procesar el pago.
                  </p>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex items-center justify-between bg-[#1a1c1e] p-6 rounded-lg border border-orange-500/30">
                <div>
                  <p className="text-gray-400 text-sm">
                    Total ({playerCount} jugador{playerCount !== 1 ? "es" : ""})
                  </p>
                  <p className="text-3xl font-bold text-orange-500" data-testid="total-amount">
                    ${totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-gray-400 text-sm">
                  <p>
                    ${PRICE_PER_PLAYER} x {playerCount}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full text-xl flex items-center justify-center gap-3"
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Enviar Registro
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>AFCPR Golf Tournament 2026 - Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
}