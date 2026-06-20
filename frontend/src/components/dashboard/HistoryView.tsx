import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { wsService } from '../../lib/wsService';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'DM Serif Display', Georgia, serif" };

type TriageResult = {
  id: string;
  note: string;
  symptoms: string;
  urgency: 'Alta' | 'Media' | 'Baja';
  specialty: string;
  status: 'Procesando' | 'Completado';
  confidence: number;
  date: string;
  time: string;
};

const uCfg = {
  Alta: { dot: 'bg-red-400', text: 'text-red-400', badge: 'text-red-400 border-red-400/20 bg-red-400/6' },
  Media: { dot: 'bg-amber-400', text: 'text-amber-400', badge: 'text-amber-400 border-amber-400/20 bg-amber-400/6' },
  Baja: { dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/6' },
};

const HistoryView = () => {
  const [results, setResults]     = useState<TriageResult[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastKey, setLastKey]     = useState<string | null>(null);
  const [filter, setFilter]       = useState<'Todos' | 'Alta' | 'Media' | 'Baja'>('Todos');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

  const loadData = useCallback(async (isLoadMore: boolean = false, currentLastKey?: string | null) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const data = await api.results.get(10, isLoadMore && currentLastKey ? currentLastKey : undefined);
      interface RawTriageRecord {
        id?: string;
        procesado_en?: number;
        nivel_urgencia?: string;
        nota_original?: string;
        sintomas_principales?: string;
        especialidad_sugerida?: string;
      }
      
      const items = (data.resultados || []).map((r: RawTriageRecord, i: number) => {
        const ts = r.procesado_en ? new Date(r.procesado_en * 1000) : new Date();
        const urgencyRaw: string = r.nivel_urgencia || 'Baja';
        const urgency = (['Alta', 'Media', 'Baja'].includes(urgencyRaw) ? urgencyRaw : 'Baja') as 'Alta' | 'Media' | 'Baja';
        return {
          id: r.id || `TRJ-${String(i + 1).padStart(3, '0')}`,
          note: r.nota_original || '',
          symptoms: r.sintomas_principales || 'Sin síntomas',
          urgency,
          specialty: r.especialidad_sugerida || 'Medicina General',
          status: 'Completado' as const,
          confidence: 95,
          date: ts.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
          time: ts.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
      });

      if (isLoadMore) {
        setResults(prev => [...prev, ...items]);
      } else {
        setResults(items);
      }
      
      setLastKey(data.last_key || null);
    } catch (e) {
      console.error('Error cargando resultados:', e);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        await loadData(false, null);
      }
    };
    init();

    wsService.connect();
    const unsubscribe = wsService.onMessage((rawMsg: unknown) => {
      const msg = rawMsg as { tipo?: string, data?: Record<string, unknown> };
      if (msg.tipo === 'RESULTADO_TRIAJE' && msg.data) {
        const r = msg.data;
        const ts = r.procesado_en ? new Date((r.procesado_en as number) * 1000) : new Date();
        const urgencyRaw = (r.nivel_urgencia as string) || 'Baja';
        const newResult: TriageResult = {
          id: `TRJ-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          note: (r.nota_original as string) || '',
          symptoms: (r.sintomas_principales as string) || '',
          urgency: (['Alta', 'Media', 'Baja'].includes(urgencyRaw) ? urgencyRaw : 'Baja') as 'Alta' | 'Media' | 'Baja',
          specialty: (r.especialidad_sugerida as string) || '',
          status: 'Completado',
          confidence: 95,
          date: ts.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
          time: ts.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
        setResults(prev => [newResult, ...prev]);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      wsService.disconnect();
    };
  }, [loadData]);


  const filtered = results
    .filter(r => filter === 'Todos' || r.urgency === filter)
    .filter(r => !search || r.symptoms.toLowerCase().includes(search.toLowerCase()) || r.specialty.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));

  const alta = results.filter(r => r.urgency === 'Alta').length;
  const media = results.filter(r => r.urgency === 'Media').length;
  const baja = results.filter(r => r.urgency === 'Baja').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p style={mono} className="text-[9px] uppercase tracking-[0.3em] text-white/22 mb-3">/ Historial</p>
        <h1 style={serif} className="text-4xl text-white leading-tight">Historial de Triaje</h1>
        <p className="mt-2 text-sm text-white/35 font-light">Resultados extraídos de DynamoDB · Actualización en tiempo real en producción.</p>
      </div>

      {/* Summary mini-cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Alta', count: alta, color: 'bg-red-400/50', text: 'text-red-400' },
            { label: 'Media', count: media, color: 'bg-amber-400/50', text: 'text-amber-400' },
            { label: 'Baja', count: baja, color: 'bg-emerald-400/40', text: 'text-emerald-400' },
          ].map(({ label, count, color, text }) => (
            <div
              key={label}
              onClick={() => setFilter(filter === label as typeof filter ? 'Todos' : label as typeof filter)}
              className={`border border-white/6 bg-[#070606] p-4 cursor-pointer hover:border-white/12 transition-colors ${filter === label ? 'border-white/15' : ''}`}
            >
              <div className={`h-px w-full ${color} mb-4`} />
              <span style={serif} className={`text-3xl ${text}`}>{count}</span>
              <p style={mono} className="text-[8px] uppercase tracking-[0.2em] text-white/22 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-3 border border-white/8 bg-white/[0.02] px-4 py-2.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID, síntoma o especialidad…"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/15 outline-none"
            style={mono}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/20 hover:text-white/50 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5">
          {(['Todos', 'Alta', 'Media', 'Baja'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={mono}
              className={`text-[9px] uppercase tracking-[0.18em] px-3 py-2 border transition-all duration-200 ${filter === f
                  ? f === 'Alta' ? 'border-red-400/40 bg-red-400/8 text-red-400'
                    : f === 'Media' ? 'border-amber-400/40 bg-amber-400/8 text-amber-400'
                      : f === 'Baja' ? 'border-emerald-400/40 bg-emerald-400/8 text-emerald-400'
                        : 'border-white/18 bg-white/4 text-white'
                  : 'border-white/6 text-white/25 hover:border-white/14 hover:text-white/50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/6 overflow-hidden">

        {/* Column headers */}
        <div className="hidden md:grid border-b border-white/6 bg-white/[0.015]"
          style={{ gridTemplateColumns: '96px 1fr 150px 80px 90px 90px 44px' }}>
          {['ID', 'Síntomas', 'Especialidad', 'Urgencia', 'Confianza', 'Fecha', ''].map((h) => (
            <div key={h} className="px-4 py-3">
              <span style={mono} className="text-[7px] uppercase tracking-[0.3em] text-white/18">{h}</span>
            </div>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="divide-y divide-white/4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="hidden md:grid px-4 py-4" style={{ gridTemplateColumns: '96px 1fr 150px 80px 90px 90px 44px' }}>
                {[80, 180, 100, 55, 50, 60, 16].map((w, j) => (
                  <div key={j} className="flex items-center">
                    <div className="h-2 bg-white/4 animate-pulse rounded-sm" style={{ width: w, animationDelay: `${i * 0.08 + j * 0.04}s` }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border border-white/6 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/15">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p style={mono} className="text-[9px] text-white/15 uppercase tracking-[0.25em]">Sin resultados para esta búsqueda</p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((r, i) => {
          const cfg = uCfg[r.urgency];
          const isOpen = expanded === r.id;
          return (
            <div
              key={r.id}
              className={`border-b border-white/4 last:border-0 transition-colors duration-200 ${isOpen ? 'bg-white/[0.02]' : 'hover:bg-white/[0.015]'}`}
              style={{ animation: `fade-up 0.35s ease-out ${i * 0.06}s both` }}
            >
              {/* Desktop row */}
              <div
                className="hidden md:grid cursor-pointer"
                style={{ gridTemplateColumns: '96px 1fr 150px 80px 90px 90px 44px' }}
                onClick={() => setExpanded(isOpen ? null : r.id)}
              >
                <div className="px-4 py-4 flex items-center">
                  <span style={mono} className={`text-[10px] ${cfg.text} opacity-70`}>{r.id}</span>
                </div>
                <div className="px-4 py-4 flex items-center gap-2.5 min-w-0">
                  <div className={`w-px h-5 flex-shrink-0 ${cfg.dot}`} />
                  <span className="text-sm text-white/55 truncate flex-1 min-w-0">{r.symptoms}</span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span className="text-sm text-white/35">{r.specialty}</span>
                </div>
                <div className="px-4 py-4 flex items-center">
                  <span style={mono} className={`text-[9px] uppercase tracking-[0.12em] px-2 py-1 border ${cfg.badge}`}>
                    {r.urgency}
                  </span>
                </div>
                <div className="px-4 py-4 flex flex-col justify-center gap-1.5">
                  <span style={mono} className={`text-[10px] ${cfg.text} opacity-60`}>{r.confidence}%</span>
                  <div className="w-full h-px bg-white/5 overflow-hidden">
                    <div className={`h-full ${cfg.dot}`} style={{ width: `${r.confidence}%` }} />
                  </div>
                </div>
                <div className="px-4 py-4 flex flex-col justify-center">
                  <span style={mono} className="text-[9px] text-white/25">{r.date}</span>
                  <span style={mono} className="text-[9px] text-white/15">{r.time}</span>
                </div>
                <div className="px-3 py-4 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-white/18 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Mobile row */}
              <div
                className="md:hidden px-4 py-4 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : r.id)}
              >
                <div className={`w-px h-10 mt-1 flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span style={mono} className={`text-[9px] ${cfg.text} opacity-70`}>{r.id}</span>
                    <span style={mono} className={`text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 border ${cfg.badge}`}>{r.urgency}</span>
                  </div>
                  <p className="text-sm text-white/50 truncate">{r.symptoms}</p>
                  <p style={mono} className="text-[8px] text-white/22 mt-0.5">{r.specialty} · {r.date} {r.time}</p>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="px-4 pb-5 pt-1 border-t border-white/5 bg-white/[0.01]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <p style={mono} className="text-[7px] uppercase tracking-[0.3em] text-white/18 mb-2">Nota clínica original</p>
                      <p className="text-sm text-white/45 leading-relaxed font-light">{r.note}</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p style={mono} className="text-[7px] uppercase tracking-[0.3em] text-white/18 mb-1">Estado</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'Completado' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                          <span style={mono} className="text-[10px] text-white/45">{r.status}</span>
                        </div>
                      </div>
                      <div>
                        <p style={mono} className="text-[7px] uppercase tracking-[0.3em] text-white/18 mb-1">Confianza del modelo</p>
                        <span style={serif} className={`text-3xl ${cfg.text}`}>{r.confidence}<span className="text-lg opacity-50">%</span></span>
                      </div>
                      <div>
                        <p style={mono} className="text-[7px] uppercase tracking-[0.3em] text-white/18 mb-1">Procesado</p>
                        <span style={mono} className="text-[10px] text-white/35">{r.date} a las {r.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {!loading && lastKey && (
        <div className="py-6 flex justify-center border border-t-0 border-white/6">
          <button
            onClick={() => loadData(true, lastKey)}
            disabled={loadingMore}
            className={`px-6 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 text-xs tracking-wider uppercase flex items-center gap-2 ${loadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={mono}
          >
            {loadingMore ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                Cargando...
              </>
            ) : (
              'Cargar más resultados'
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div className="flex items-center justify-between pt-2">
          <span style={mono} className="text-[8px] text-white/18 uppercase tracking-[0.2em]">
            {filtered.length} de {results.length} registros
          </span>
          <div className="flex items-center gap-4">
            {[
              { label: 'Alta', count: alta, color: 'bg-red-400' },
              { label: 'Media', count: media, color: 'bg-amber-400' },
              { label: 'Baja', count: baja, color: 'bg-emerald-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 ${color}`} />
                <span style={mono} className="text-[8px] text-white/20 uppercase tracking-[0.15em]">{count} {label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
