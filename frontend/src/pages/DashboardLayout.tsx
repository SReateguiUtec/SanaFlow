import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  {
    path: '/dashboard',
    label: 'Resumen',
    sub: 'Vista general del sistema',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/upload',
    label: 'Cargar Notas',
    sub: 'Subir CSV al pipeline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/history',
    label: 'Historial',
    sub: 'Triajes procesados',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#040403] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-[#060504] border-r border-white/6
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>

        {/* Logo */}
        <div
          className="h-14 flex items-center px-6 border-b border-white/6 cursor-pointer flex-shrink-0"
          onClick={() => navigate('/')}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative w-1.5 h-1.5">
              <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse" />
            </div>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif" }} className="text-white text-base tracking-tight">
              SanaFlow
            </span>
          </div>
        </div>

        {/* Section label */}
        <div className="px-6 pt-6 pb-3">
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[8px] uppercase tracking-[0.3em] text-white/18">
            Navegación
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 transition-all duration-200 group relative ${
                  active
                    ? 'bg-amber-400/8 text-amber-400 border-l-2 border-amber-400'
                    : 'text-white/35 hover:text-white/70 hover:bg-white/[0.03] border-l-2 border-transparent'
                }`}
              >
                <span className={`flex-shrink-0 transition-colors ${active ? 'text-amber-400' : 'text-white/25 group-hover:text-white/50'}`}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-none mb-0.5 ${active ? 'text-amber-400' : ''}`}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.15em] text-white/18 truncate">
                    {item.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System status */}
        <div className="px-6 py-4 border-t border-white/6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.2em] text-emerald-400/60">
              Sistema activo
            </span>
          </div>

          {/* User row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-amber-400/15 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] text-amber-400 font-bold">DR</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70 truncate">Dr. Usuario</p>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[8px] text-white/25 uppercase tracking-[0.15em]">Médico</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-white/25 hover:text-red-400/70 hover:bg-red-400/5 transition-all duration-200 border border-transparent hover:border-red-400/10"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.2em]">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 md:px-8 border-b border-white/6 bg-[#040403] flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex flex-col gap-1 p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className="block w-4 h-px bg-white/40" />
              <span className="block w-4 h-px bg-white/40" />
              <span className="block w-4 h-px bg-white/40" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.25em] text-white/20">
                SanaFlow
              </span>
              <span className="text-white/12">/</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.25em] text-white/45">
                {navItems.find(n => n.path === location.pathname)?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right: live indicators */}
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.15em] text-white/25">
                Demo Estática
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[9px] uppercase tracking-[0.15em] text-emerald-400/50">
                Groq · Llama 3
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#040403] relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.016]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-amber-500/3 blur-[140px] rounded-full pointer-events-none" />
          <div className="relative z-10 p-6 md:p-10 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
