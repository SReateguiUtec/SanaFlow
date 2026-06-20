import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auth logic goes here
  };

  return (
    <div className="min-h-screen bg-[#060503] text-white flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Background ambiance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/4 blur-[120px] rounded-full" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="mb-10 animate-fade-up" style={{ animationDelay: '0ms' }}>
            <span className="section-label">/ Acceso al sistema</span>
            <h1 className="font-serif text-4xl md:text-5xl text-white mt-4 leading-tight">
              Iniciar<br />
              <span className="italic text-white/30">Sesión</span>
            </h1>
            <p className="mt-4 font-mono-custom text-[10px] text-white/25 uppercase tracking-[0.2em] leading-relaxed">
              Accede a tu panel de triaje clínico
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: '80ms' }}
            >
              <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                Correo electrónico
              </label>
              <div className={`border transition-all duration-300 ${focused === 'email' ? 'border-amber-400/50 bg-amber-400/4' : 'border-white/8 bg-white/[0.02]'}`}>
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
            <div
              className="animate-fade-up"
              style={{ animationDelay: '160ms' }}
            >
              <label className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/30 block mb-2">
                Contraseña
              </label>
              <div className={`border transition-all duration-300 flex items-center ${focused === 'password' ? 'border-amber-400/50 bg-amber-400/4' : 'border-white/8 bg-white/[0.02]'}`}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
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
            </div>

            {/* Forgot password */}
            <div className="flex justify-end animate-fade-up" style={{ animationDelay: '220ms' }}>
              <button
                type="button"
                className="font-mono-custom text-[9px] uppercase tracking-[0.2em] text-white/20 hover:text-amber-400/60 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <div className="pt-2 animate-fade-up" style={{ animationDelay: '280ms' }}>
              <button
                type="submit"
                className="w-full py-4 bg-amber-400 text-black font-mono-custom text-[11px] uppercase tracking-[0.25em] hover:bg-amber-300 active:bg-amber-500 transition-colors duration-200 relative group overflow-hidden"
              >
                <span className="relative z-10">Ingresar →</span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4 animate-fade-up" style={{ animationDelay: '340ms' }}>
            <div className="flex-1 h-px bg-white/6" />
            <span className="font-mono-custom text-[9px] uppercase tracking-[0.2em] text-white/15">o</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Register link */}
          <div className="text-center animate-fade-up" style={{ animationDelay: '380ms' }}>
            <p className="font-mono-custom text-[10px] text-white/25 uppercase tracking-[0.15em]">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-amber-400/70 hover:text-amber-400 transition-colors underline underline-offset-4"
              >
                Registrarse
              </button>
            </p>
          </div>

          {/* Security note */}
          <div className="mt-10 pt-8 border-t border-white/5 flex items-start gap-3 animate-fade-up" style={{ animationDelay: '420ms' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 mt-1 flex-shrink-0" />
            <p className="font-mono-custom text-[9px] text-white/15 uppercase tracking-[0.15em] leading-relaxed">
              Conexión cifrada · Datos clínicos protegidos bajo estándares HIPAA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
