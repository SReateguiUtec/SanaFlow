import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api, setToken } from '../lib/api';

const roles = [
  { id: 'medico', label: 'Médico', desc: 'Acceso a resultados de triaje y panel clínico' },
  { id: 'admin', label: 'Administrador', desc: 'Gestión de lotes, usuarios y configuración' },
  { id: 'enfermero', label: 'Enfermero/a', desc: 'Vista de cola de priorización de pacientes' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    institucion: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.register(form);
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-300', 'bg-emerald-400'][passwordStrength];

  const fieldClass = (name: string) =>
    `border transition-all duration-300 ${focused === name ? 'border-amber-400/50 bg-amber-400/4' : 'border-white/8 bg-white/[0.02]'}`;

  return (
    <div className="min-h-screen bg-[#060503] text-white flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/3 blur-[120px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="flex-1 flex items-start justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="mb-10 animate-fade-up">
            <span className="section-label">/ Nuevo acceso</span>
            <h1 className="font-serif text-4xl md:text-5xl text-white mt-4 leading-tight">
              Crear<br />
              <span className="italic text-white/30">Cuenta</span>
            </h1>
            <p className="mt-4 font-mono-custom text-[10px] text-white/25 uppercase tracking-[0.2em] leading-relaxed">
              Únete a SanaFlow y automatiza tu triaje clínico
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-10 animate-fade-up" style={{ animationDelay: '60ms' }}>
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-7 h-7 border font-mono-custom text-[10px] transition-all duration-300 ${
                  step === s
                    ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                    : s < step
                    ? 'border-emerald-400/40 bg-emerald-400/5 text-emerald-400/60'
                    : 'border-white/10 text-white/20'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                <span className={`font-mono-custom text-[9px] uppercase tracking-[0.2em] ${step === s ? 'text-white/50' : 'text-white/15'}`}>
                  {s === 1 ? 'Datos personales' : 'Rol e institución'}
                </span>
                {s < 2 && <div className="w-8 h-px bg-white/8 ml-1" />}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 border border-red-400/20 bg-red-400/10 text-red-400 text-sm font-mono-custom tracking-[0.05em] animate-fade-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-4">

                {/* Nombre */}
                <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                  <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                    Nombre completo
                  </label>
                  <div className={fieldClass('nombre')}>
                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      onFocus={() => setFocused('nombre')}
                      onBlur={() => setFocused(null)}
                      placeholder="Dr. Nombre Apellido"
                      required
                      className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder-white/15 outline-none font-light"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
                  <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                    Correo electrónico
                  </label>
                  <div className={fieldClass('email')}>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      placeholder="nombre@hospital.com"
                      required
                      className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder-white/15 outline-none font-light"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="animate-fade-up" style={{ animationDelay: '220ms' }}>
                  <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                    Contraseña
                  </label>
                  <div className={`${fieldClass('password')} flex items-center`}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="flex-1 bg-transparent px-5 py-4 text-sm text-white placeholder-white/15 outline-none font-light"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="px-4 text-white/20 hover:text-white/50 transition-colors"
                    >
                      {showPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-0.5 flex-1 transition-all duration-300 ${i <= passwordStrength ? strengthColor : 'bg-white/8'}`}
                          />
                        ))}
                      </div>
                      <span className={`font-mono-custom text-[9px] uppercase tracking-[0.2em] ${
                        passwordStrength <= 1 ? 'text-red-400/60' : passwordStrength === 2 ? 'text-amber-400/60' : passwordStrength === 3 ? 'text-yellow-300/60' : 'text-emerald-400/60'
                      }`}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="animate-fade-up" style={{ animationDelay: '280ms' }}>
                  <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                    Confirmar contraseña
                  </label>
                  <div className={`${fieldClass('confirm')} flex items-center`}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocused('confirm')}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      required
                      className="flex-1 bg-transparent px-5 py-4 text-sm text-white placeholder-white/15 outline-none font-light"
                    />
                    {form.confirmPassword && (
                      <div className="px-4">
                        {form.password === form.confirmPassword ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Next step */}
                <div className="pt-3 animate-fade-up" style={{ animationDelay: '340ms' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!form.nombre || !form.email || !form.password || form.password !== form.confirmPassword}
                    className="w-full py-4 bg-amber-400 text-black font-mono-custom text-[11px] uppercase tracking-[0.25em] hover:bg-amber-300 active:bg-amber-500 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-6">

                {/* Role selector */}
                <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
                  <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-3">
                    Rol en el sistema
                  </label>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, role: role.id }))}
                        className={`w-full text-left px-5 py-4 border transition-all duration-200 flex items-start gap-4 ${
                          form.role === role.id
                            ? 'border-amber-400/50 bg-amber-400/6'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${
                          form.role === role.id ? 'border-amber-400 bg-amber-400/20' : 'border-white/20'
                        }`}>
                          {form.role === role.id && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium transition-colors ${form.role === role.id ? 'text-white' : 'text-white/60'}`}>
                            {role.label}
                          </p>
                          <p className="font-mono-custom text-[9px] text-white/25 mt-0.5 leading-relaxed">
                            {role.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Institución */}
                <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
                  <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                    Institución de salud
                  </label>
                  <div className={fieldClass('institucion')}>
                    <input
                      type="text"
                      name="institucion"
                      value={form.institucion}
                      onChange={handleChange}
                      onFocus={() => setFocused('institucion')}
                      onBlur={() => setFocused(null)}
                      placeholder="Hospital / Clínica / Centro de salud"
                      className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder-white/15 outline-none font-light"
                    />
                  </div>
                </div>

                {/* Terms */}
                <div className="animate-fade-up flex items-start gap-3 pt-1" style={{ animationDelay: '240ms' }}>
                  <button
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`w-4 h-4 border mt-0.5 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      acceptedTerms ? 'border-amber-400/60 bg-amber-400/15' : 'border-white/15 bg-white/[0.02] hover:border-white/30'
                    }`}
                  >
                    {acceptedTerms && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-400">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                  <p
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className="font-mono-custom text-[9px] uppercase tracking-[0.12em] leading-relaxed cursor-pointer select-none transition-colors duration-200 ${acceptedTerms ? 'text-white/40' : 'text-white/25 hover:text-white/35'}"
                  >
                    Acepto los términos de uso y la política de privacidad de datos clínicos de SanaFlow.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 animate-fade-up" style={{ animationDelay: '300ms' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-4 border border-white/10 font-mono-custom text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white/25 transition-all"
                  >
                    ← Volver
                  </button>
                  <button
                    type="submit"
                    disabled={!form.role || !acceptedTerms || loading}
                    className="flex-1 py-4 bg-amber-400 text-black font-mono-custom text-[11px] uppercase tracking-[0.25em] hover:bg-amber-300 active:bg-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creando...' : 'Crear cuenta →'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Login link */}
          <div className="mt-8 text-center animate-fade-up" style={{ animationDelay: '360ms' }}>
            <p className="font-mono-custom text-[10px] text-white/25 uppercase tracking-[0.15em]">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-amber-400/70 hover:text-amber-400 transition-colors underline underline-offset-4"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>

          {/* Security note */}
          <div className="mt-10 pt-8 border-t border-white/5 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 mt-1 flex-shrink-0" />
            <p className="font-mono-custom text-[9px] text-white/15 uppercase tracking-[0.15em] leading-relaxed">
              Datos almacenados con cifrado AES-256 · Infraestructura AWS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
