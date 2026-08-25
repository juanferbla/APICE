import React, { useState } from "react";
import {
  LayoutDashboard,
  LogIn,
  UserPlus,
  ShieldAlert,
  Sparkles,
  Layout,
  FolderKanban,
  CheckSquare,
  Smile,
  Mail,
  Send,
  Chrome,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "../utils/api";

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string; username: string; photoURL?: string }) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  // Custom states for verification handling
  const [isUnverified, setIsUnverified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setVerificationSent(false);
    setLoading(true);

    try {
      if (isLogin) {
        // Try standard login
        const user = await api.login(email, password);
        api.setUserId(user.id);
        onAuthSuccess(user);
      } else {
        if (!username.trim()) {
          throw new Error("El nombre de usuario es requerido.");
        }
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        
        await api.signup(email, username, password);
        // Signup was successful, verification email sent!
        setVerificationSent(true);
        setIsLogin(true); // Switch to login view
        setPassword(""); // Clear password for security
      }
    } catch (err: any) {
      if (err.message && (err.message.includes("verificar tu correo") || err.message.includes("verification"))) {
        setIsUnverified(true);
      }
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsUnverified(false);
    setVerificationSent(false);
    setLoading(true);

    try {
      const user = await api.signInWithGoogle();
      api.setUserId(user.id);
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError("Por favor ingresa tu correo y contraseña para reenviar la activación.");
      return;
    }
    setResendLoading(true);
    setError(null);
    try {
      await api.resendVerification(email, password);
      setVerificationSent(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al reenviar el enlace.");
    } finally {
      setResendLoading(false);
    }
  };

  const loadDemo = () => {
    // In Firebase context, demo accounts must be real accounts in the database.
    // If the user wants a demo account, we can notify them to sign up, or we can use our seeded juanferbla@gmail.com account
    setEmail("juanferbla@gmail.com");
    setPassword("123456");
    setIsLogin(true);
    setError(null);
    setIsUnverified(false);
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-[#F0F2F5] text-[#1A1C1E] flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Abstract Animated Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Hero / Intro Column */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-slate-200 bg-white/60 backdrop-blur-3xl z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-800 font-display">
            Ommm Dashboard
          </span>
        </div>

        <div className="my-12 max-w-lg space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizador Diario Todo-en-Uno</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-gray-900 font-display">
            Diseña tu espacio de trabajo diario <span className="text-indigo-600">perfecto</span>.
          </h1>
          
          <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">
            Inspirado en los mejores lanzadores de productividad, Ommm te ofrece tableros personalizados, widgets interactivos totalmente adaptables y análisis inteligente para que rindas tu tiempo y disfrutes tus hábitos de forma segura.
          </p>

          {/* Key Pillars */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 mt-1">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Tableros Múltiples</h4>
                <p className="text-[11px] text-slate-500 font-medium">Trabajo, Estudio, Hogar, Hobbies, Personal.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 mt-1">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">15+ Widgets Únicos</h4>
                <p className="text-[11px] text-slate-500 font-medium">Pomodoro, Clima, RSS, Finanzas, Tareas.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-sky-50 border border-sky-100 rounded-lg text-sky-600 mt-1">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Rendimiento Semanal</h4>
                <p className="text-[11px] text-slate-500 font-medium">Visualiza tu foco diario y rachas con gráficos.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-600 mt-1">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Ommm Coach AI</h4>
                <p className="text-[11px] text-slate-500 font-medium">Consejos de enfoque con Gemini server-side.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-1 font-semibold">
          <span>Hecho por entusiastas de la productividad personal © 2026</span>
        </div>
      </div>

      {/* Auth Form Column */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 z-10 bg-slate-100/10">
        <div className="w-full max-w-md bg-white border border-[#E1E4E8] rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 font-display">
              {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta de Ommm"}
            </h2>
            <p className="text-slate-500 text-xs font-semibold mt-2">
              {isLogin
                ? "Inicia sesión para restaurar tus tableros"
                : "Regístrate para comenzar a diseñar tus widgets personalizados"}
            </p>
          </div>

          {/* Social Sign In (Google) */}
          <div className="mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-sm transition flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
            >
              <Chrome className="w-4 h-4 text-indigo-600" />
              <span>Continuar con Google</span>
            </button>
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-slate-100 w-full"></div>
              <span className="absolute bg-white px-3 text-[10px] uppercase font-black tracking-wider text-slate-400">O ingresa con tu correo</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !isUnverified && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-start space-x-2 font-semibold">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Verification Banner */}
            {isUnverified && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs space-y-3 font-semibold">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Por favor, verifica tu dirección de correo electrónico para activar tu cuenta de Ommm.</span>
                </div>
                <div className="text-[11px] text-amber-700">
                  Hemos enviado un enlace de activación a <strong>{email}</strong>. Por favor haz clic en él para proceder.
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Reenviar enlace de activación</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Email Verification Success Notice */}
            {verificationSent && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start space-x-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <div className="space-y-1">
                  <div>¡Enlace de activación enviado!</div>
                  <div className="text-[11px] text-emerald-700">Revisa tu bandeja de entrada en <strong>{email}</strong> para activar tu cuenta de Ommm antes de iniciar sesión.</div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Fernando"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm text-slate-900 outline-none transition"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                placeholder="juanferbla@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm text-slate-900 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Contraseña</label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm text-slate-900 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isLogin ? "Iniciar Sesión" : "Crear Cuenta Verificable"}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Trigger */}
          {isLogin && (
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <button
                onClick={loadDemo}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold underline cursor-pointer"
              >
                Autocompletar juanferbla@gmail.com
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setIsUnverified(false);
                setVerificationSent(false);
              }}
              className="text-slate-500 hover:text-indigo-600 text-xs transition font-semibold cursor-pointer"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
