import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import ChatbotCopilot from '../components/dashboard/ChatbotCopilot';
import { api, getUser, removeToken, removeUser } from '../lib/api';
import { wsService } from '../lib/wsService';
const mono  = "'IBM Plex Mono', monospace";
const serif = "'DM Serif Display', Georgia, serif";

const navItems = [
  {
    path: '/dashboard',
    label: 'Resumen',
    sub: 'Vista general',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/upload',
    label: 'Cargar Notas',
    sub: 'Subir CSV',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/history',
    label: 'Historial',
    sub: 'Triajes procesados',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    path: '/dashboard/analytics',
    label: 'Analíticas',
    sub: 'Estadísticas',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
];

// Mini sparkline data (last 12 ticks)
const sparkValues = [4, 7, 5, 9, 6, 12, 8, 15, 10, 13, 9, 11];
const sparkMax = Math.max(...sparkValues);

const SidebarSparkline = () => {
  const w = 180; const h = 36; const pad = 2;
  const pts = sparkValues.map((v, i) => {
    const x = pad + (i / (sparkValues.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v / sparkMax) * (h - pad * 2));
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A85A" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#D4A85A" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${pad},${h} ${pts} ${w - pad},${h}`} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke="#D4A85A" strokeWidth="1.2" strokeOpacity="0.7" strokeLinejoin="round" strokeLinecap="round"/>
      {/* Last point dot */}
      <circle cx={w - pad} cy={h - pad - ((sparkValues[sparkValues.length-1] / sparkMax) * (h - pad * 2))} r="2" fill="#D4A85A"/>
    </svg>
  );
};

const LiveClock = () => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time}</span>;
};

interface TriageResult {
  id?: string;
  nivel_urgencia?: string;
  especialidad_sugerida?: string;
  nota_clinica?: string;
  motivo_consulta?: string;
  [key: string]: unknown;
}

const DashboardLayout = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCompleted, setTotalCompleted] = useState(0);

  const [allResults, setAllResults] = useState<TriageResult[]>([]);

  useEffect(() => {
    if (searchOpen && allResults.length === 0) {
      api.results.get(100).then((res: { resultados?: TriageResult[] }) => setAllResults(res.resultados || [])).catch(console.error);
    }
  }, [searchOpen, allResults.length]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return allResults.slice(0, 5);
    }
    const q = searchQuery.toLowerCase();
    const filtered = allResults.filter(r => 
      (r.nivel_urgencia || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    );
    return filtered.slice(0, 10);
  }, [searchQuery, allResults]);

  // Initial fetch and WebSocket listener for total completed
  useEffect(() => {
    api.results.get()
      .then((res: { total?: number }) => setTotalCompleted(res.total || 0))
      .catch(console.error);

    const unsub = wsService.onMessage((msg: unknown) => {
      const payload = msg as { tipo?: string };
      if (payload.tipo === 'RESULTADO_TRIAJE') {
        setTotalCompleted(prev => prev + 1);
      }
    });
    return () => unsub();
  }, []);

  // Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#040403] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-[#060504] border-r border-white/6
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>

        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-white/6 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <span style={{ fontFamily: serif }} className="text-white text-base tracking-tight">SanaFlow</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="px-5 pt-5 pb-2">
          <span style={{ fontFamily: mono }} className="text-[7px] uppercase tracking-[0.35em] text-white/15">Navegación</span>
        </div>
        <nav className="px-2 space-y-0.5 flex-shrink-0">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group border-l-2 ${
                  active
                    ? 'bg-amber-400/8 border-amber-400'
                    : 'border-transparent text-white/35 hover:text-white/65 hover:bg-white/[0.03]'
                }`}>
                <span className={`flex-shrink-0 ${active ? 'text-amber-400' : 'text-white/22 group-hover:text-white/45'}`}>{item.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium leading-none mb-0.5 ${active ? 'text-amber-400' : ''}`}>{item.label}</p>
                  <p style={{ fontFamily: mono }} className="text-[8px] uppercase tracking-[0.15em] text-white/16 truncate">{item.sub}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ── DIVIDER ── */}
        <div className="mx-5 my-4 h-px bg-white/5" />

        {/* ── LIVE ACTIVITY WIDGET ── */}
        <div className="px-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: mono }} className="text-[7px] uppercase tracking-[0.3em] text-white/15">Actividad</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span style={{ fontFamily: mono }} className="text-[7px] text-emerald-400/50">Live</span>
            </div>
          </div>
          <SidebarSparkline />
          <div className="flex items-center justify-between mt-1.5">
            <span style={{ fontFamily: mono }} className="text-[7px] text-white/18">Últimas 12h</span>
            <span style={{ fontFamily: mono }} className="text-[7px] text-amber-400/50">↑ +11 triajes</span>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="mx-5 my-4 h-px bg-white/5" />

        {/* ── SQS QUEUE STATUS ── */}
        <div className="px-5 flex-shrink-0">
          <span style={{ fontFamily: mono }} className="text-[7px] uppercase tracking-[0.3em] text-white/15 block mb-3">Cola SQS</span>
          <div className="space-y-2">
            {[
              { label: 'En cola',     val: 0,   color: 'text-white/35',    dot: 'bg-white/20'     },
              { label: 'Procesando',  val: 0,   color: 'text-amber-400/50',dot: 'bg-amber-400/50' },
              { label: 'Completados', val: totalCompleted, color: 'text-emerald-400/60', dot: 'bg-emerald-400' },
              { label: 'Fallidos',    val: 0,   color: 'text-white/25',    dot: 'bg-white/10'     },
            ].map(({ label, val, color, dot }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${dot}`} />
                  <span style={{ fontFamily: mono }} className="text-[8px] text-white/25">{label}</span>
                </div>
                <span style={{ fontFamily: mono }} className={`text-[9px] font-medium ${color}`}>{val}</span>
              </div>
            ))}
          </div>
          {/* Queue bar */}
          <div className="mt-3 h-px bg-white/5 overflow-hidden">
            <div className="h-full bg-emerald-400/40 w-full" />
          </div>
          <p style={{ fontFamily: mono }} className="text-[7px] text-white/12 mt-1">0 mensajes pendientes</p>
        </div>

        {/* ── DIVIDER ── */}
        <div className="mx-5 my-4 h-px bg-white/5" />

        {/* ── PIPELINE HEALTH ── */}
        <div className="px-5 flex-shrink-0">
          <span style={{ fontFamily: mono }} className="text-[7px] uppercase tracking-[0.3em] text-white/15 block mb-3">Pipeline</span>
          <div className="space-y-2">
            {[
              { name: 'S3',          ms: '12ms'  },
              { name: 'EventBridge', ms: '4ms'   },
              { name: 'SQS',         ms: '8ms'   },
              { name: 'Lambda',      ms: '520ms' },
              { name: 'Groq API',    ms: '380ms' },
            ].map(({ name, ms }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span style={{ fontFamily: mono }} className="text-[8px] text-white/25">{name}</span>
                </div>
                <span style={{ fontFamily: mono }} className="text-[8px] text-white/18">{ms}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── CLOCK + USER + LOGOUT ── */}
        <div className="border-t border-white/6 flex-shrink-0">

          {/* Live clock */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <span style={{ fontFamily: mono }} className="text-[7px] uppercase tracking-[0.3em] text-white/15">Hora local</span>
            <span style={{ fontFamily: mono }} className="text-[10px] text-white/30 tabular-nums">
              <LiveClock />
            </span>
          </div>

          {/* Model badge */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <span style={{ fontFamily: mono }} className="text-[7px] uppercase tracking-[0.3em] text-white/15">Modelo IA</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-amber-400/60" />
              <span style={{ fontFamily: mono }} className="text-[8px] text-amber-400/50">Llama 3 · Groq</span>
            </div>
          </div>

          {/* User */}
          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-400/12 border border-amber-400/18 flex items-center justify-center flex-shrink-0">
              <span style={{ fontFamily: mono }} className="text-[8px] text-amber-400">
                {(getUser()?.name || 'Usuario Activo').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/60 truncate">{getUser()?.name || 'Usuario Activo'}</p>
              <p style={{ fontFamily: mono }} className="text-[7px] text-white/22 uppercase tracking-[0.15em]">Personal Clínico</p>
            </div>
            <button 
              onClick={() => { removeToken(); removeUser(); navigate('/'); }} 
              className="text-white/18 hover:text-red-400/60 transition-colors" 
              title="Cerrar sesión"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 md:px-8 border-b border-white/6 bg-[#040403] flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden flex flex-col gap-1 p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              <span className="block w-4 h-px bg-white/40" />
              <span className="block w-4 h-px bg-white/40" />
              <span className="block w-4 h-px bg-white/40" />
            </button>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: mono }} className="text-[9px] uppercase tracking-[0.25em] text-white/18 hidden sm:inline">SanaFlow</span>
              <span className="text-white/10 hidden sm:inline">/</span>
              <span style={{ fontFamily: mono }} className="text-[9px] uppercase tracking-[0.25em] text-white/40">
                {navItems.find(n => n.path === location.pathname)?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Universal Search Bar */}
          <div 
            className="hidden md:flex items-center flex-1 max-w-md mx-8 relative group cursor-text"
            onClick={() => setSearchOpen(true)}
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/20 group-hover:text-amber-400/50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div className="w-full bg-white/[0.03] group-hover:bg-white/[0.05] border border-white/10 group-hover:border-amber-400/30 text-white/40 text-xs px-9 py-2 rounded-sm transition-all duration-300">
              Buscar por ID o nivel de urgencia...
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <span style={{ fontFamily: mono }} className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-sm border border-white/10">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span style={{ fontFamily: mono }} className="text-[8px] uppercase tracking-[0.15em] text-emerald-400/70">API Activa</span>
            </div>
          </div>
        </header>

        {/* Search Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <div className="relative w-full max-w-2xl bg-[#0a0806] border border-white/10 shadow-2xl rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Input */}
              <div className="flex items-center px-4 py-3 border-b border-white/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400/70 mr-3">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ej: TRJ-042, Alta, Media..."
                  className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder:text-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setSearchOpen(false)} style={{ fontFamily: mono }} className="text-[10px] bg-white/10 text-white/40 px-2 py-1 rounded-sm ml-3 hover:bg-white/20 transition-colors">ESC</button>
              </div>
              
              {/* Results */}
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2">
                  <p style={{ fontFamily: mono }} className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-2">
                    {searchQuery ? 'Resultados de búsqueda' : 'Últimos registros'}
                  </p>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-white/40 text-xs">No se encontraron resultados</div>
                ) : (
                  searchResults.map(res => (
                    <div 
                      key={res.id} 
                      onClick={() => { setSearchOpen(false); navigate('/dashboard/history', { state: { selectedId: res.id } }); }} 
                      className="flex items-center gap-3 px-3 py-3 rounded-sm hover:bg-white/[0.03] cursor-pointer group transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${res.nivel_urgencia === 'Alta' ? 'bg-red-400/10' : res.nivel_urgencia === 'Media' ? 'bg-amber-400/10' : 'bg-emerald-400/10'}`}>
                        <div className={`w-2 h-2 rounded-full ${res.nivel_urgencia === 'Alta' ? 'bg-red-400' : res.nivel_urgencia === 'Media' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontFamily: mono }} className={`text-[10px] text-white transition-colors ${res.nivel_urgencia === 'Alta' ? 'group-hover:text-red-400' : res.nivel_urgencia === 'Media' ? 'group-hover:text-amber-400' : 'group-hover:text-emerald-400'}`}>
                            ID: {res.id?.substring(0, 8)} {res.especialidad_sugerida ? `• ${res.especialidad_sugerida}` : ''}
                          </span>
                          <span style={{ fontFamily: mono }} className={`text-[9px] uppercase tracking-widest ${res.nivel_urgencia === 'Alta' ? 'text-red-400/80' : res.nivel_urgencia === 'Media' ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                            {res.nivel_urgencia || 'Baja'}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 truncate">
                          <span className="text-white/70">{res.nota_clinica || res.motivo_consulta || 'Sin nota clínica'}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between bg-[#060504]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><kbd style={{ fontFamily: mono }} className="text-[9px] bg-white/10 text-white/50 px-1.5 rounded-sm">↑↓</kbd><span className="text-[10px] text-white/30">Navegar</span></span>
                  <span className="flex items-center gap-1.5"><kbd style={{ fontFamily: mono }} className="text-[9px] bg-white/10 text-white/50 px-1.5 rounded-sm">↵</kbd><span className="text-[10px] text-white/30">Abrir ficha</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                  <span style={{ fontFamily: mono }} className="text-[8px] text-emerald-400/40 uppercase tracking-widest">DynamoDB Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#040403] relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.016]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-amber-500/3 blur-[140px] rounded-full pointer-events-none" />
          <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
            <Outlet />
          </div>
          <ChatbotCopilot />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
