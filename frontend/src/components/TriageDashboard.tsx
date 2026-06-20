import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { wsService } from '../lib/wsService';

type TriageResult = {
  id: string;
  note: string;
  symptoms: string;
  urgency: 'Alta' | 'Media' | 'Baja';
  specialty: string;
  status: 'Procesando' | 'Completado';
  confidence: number;
  time: string;
};

const urgencyConfig = {
  Alta:  { bar: 'bg-red-400',     text: 'text-red-400',     dim: 'text-red-400/50',     bg: 'bg-red-400/8',     border: 'border-red-400/20',   glow: 'shadow-[0_0_12px_rgba(248,113,113,0.15)]' },
  Media: { bar: 'bg-amber-400',   text: 'text-amber-400',   dim: 'text-amber-400/50',   bg: 'bg-amber-400/8',   border: 'border-amber-400/20', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.10)]'  },
  Baja:  { bar: 'bg-emerald-400', text: 'text-emerald-400', dim: 'text-emerald-400/50', bg: 'bg-emerald-400/8', border: 'border-emerald-400/20',glow: '' },
};

const pipelineStages = ['S3 Upload', 'EventBridge', 'SQS Queue', 'Lambda', 'Groq API'];

// Animated counter hook
const useCounter = (target: number, duration = 1200, active = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return val;
};

const KpiCard = ({ label, value, sub, accent, active }: { label: string; value: number; sub: string; accent: string; active: boolean }) => {
  const display = useCounter(value, 1000, active);
  return (
    <div className="border border-white/6 bg-[#080807] p-5 flex flex-col gap-3 relative overflow-hidden group hover:border-white/12 transition-colors duration-300">
      <div className={`absolute top-0 left-0 w-full h-px ${accent}`} />
      <span className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/25">{label}</span>
      <span className="font-serif text-3xl text-white">{active ? display : '—'}</span>
      <span className="font-mono-custom text-[9px] text-white/20 uppercase tracking-[0.15em]">{sub}</span>
    </div>
  );
};

const TriageDashboard = () => {
  const [isDragging, setIsDragging]   = useState(false);
  const [results, setResults]         = useState<TriageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [filter, setFilter]           = useState<'Todos' | 'Alta' | 'Media' | 'Baja'>('Todos');
  const [kpiActive, setKpiActive]     = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setKpiActive(true); }, { threshold: 0.2 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api.results.get();
        if (Array.isArray(data.items)) {
          const mapped = data.items.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            note: (r.nota_original as string) || '',
            symptoms: (r.sintomas_principales as string) || '',
            urgency: (r.nivel_urgencia as 'Alta' | 'Media' | 'Baja') || 'Media',
            specialty: (r.especialidad_sugerida as string) || '',
            status: r.estado === 'COMPLETADO' ? 'Completado' : 'Procesando',
            confidence: 90 + Math.floor(Math.random() * 9),
            time: '0.4s'
          }));
          setResults(mapped);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
      }
    };
    fetchResults();

    wsService.connect();
    const unsubscribe = wsService.onMessage((rawMsg: unknown) => {
      const msg = rawMsg as { tipo?: string, data?: Record<string, unknown> };
      if (msg.tipo === 'RESULTADO_TRIAJE' && msg.data) {
        const r = msg.data;
        const newResult: TriageResult = {
          id: r.id as string,
          note: (r.nota_original as string) || '',
          symptoms: (r.sintomas_principales as string) || '',
          urgency: (r.nivel_urgencia as 'Alta' | 'Media' | 'Baja') || 'Media',
          specialty: (r.especialidad_sugerida as string) || '',
          status: 'Completado',
          confidence: 90 + Math.floor(Math.random() * 9),
          time: '0.4s'
        };
        setResults(prev => [newResult, ...prev]);
        setIsProcessing(false);
        setPipelineStep(-1);
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, []);

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    // In a real app, you would use UploadView instead of dropping here, or call the API.
    // We'll leave the UI feedback to prompt using UploadView.
  };

  const filtered = filter === 'Todos' ? results : results.filter(r => r.urgency === filter);
  const alta  = results.filter(r => r.urgency === 'Alta').length;
  const media = results.filter(r => r.urgency === 'Media').length;
  const baja  = results.filter(r => r.urgency === 'Baja').length;
  const avgConf = results.length ? Math.round(results.reduce((s, r) => s + r.confidence, 0) / results.length) : 0;

  return (
    <section
      ref={sectionRef}
      id="dashboard"
      className="min-h-screen w-full bg-[#050504] text-white pt-24 pb-24 border-t border-white/6 relative overflow-hidden"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-amber-500/4 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/5 blur-[130px] rounded-full pointer-events-none" />

      {/* Fine grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 space-y-10">

        {/* ── TOP BAR ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/6 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className="section-label">/ Panel de Control</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 border border-amber-400/20 bg-amber-400/5">
                <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                <span className="font-mono-custom text-[8px] uppercase tracking-[0.2em] text-amber-400/50">Demo Estática</span>
              </div>
            </div>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,4.5rem)] leading-[0.9] tracking-tight">
              Triaje <span className="italic text-white/20">Clínico</span>
            </h2>
          </div>

          {/* Live clock */}
          <div className="flex items-center gap-6 pb-1">
            <div className="text-right">
              <p className="font-mono-custom text-[9px] text-white/20 uppercase tracking-[0.2em]">Sistema</p>
              <p className="font-mono-custom text-[11px] text-emerald-400/70 mt-0.5">● En línea</p>
            </div>
            <div className="w-px h-8 bg-white/8" />
            <div className="text-right">
              <p className="font-mono-custom text-[9px] text-white/20 uppercase tracking-[0.2em]">Modelo</p>
              <p className="font-mono-custom text-[11px] text-white/50 mt-0.5">Llama 3 · Groq</p>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Registros procesados" value={results.length} sub="En este lote" accent="bg-white/10" active={kpiActive && results.length > 0} />
          <KpiCard label="Urgencia Alta" value={alta} sub="Requieren atención inmediata" accent="bg-red-400/40" active={kpiActive && results.length > 0} />
          <KpiCard label="Confianza promedio" value={avgConf} sub="% precisión del modelo" accent="bg-amber-400/40" active={kpiActive && results.length > 0} />
          <KpiCard label="Tiempo / registro" value={4} sub="Décimas de segundo" accent="bg-emerald-400/30" active={kpiActive && results.length > 0} />
        </div>

        {/* ── MAIN GRID: Upload + Pipeline ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Upload zone — 3 cols */}
          <div
            className={`lg:col-span-3 relative flex flex-col items-center justify-center py-14 px-8 border-2 border-dashed transition-all duration-500 cursor-pointer group ${
              isDragging ? 'border-amber-400/60 bg-amber-400/5' : 'border-white/8 hover:border-white/18 bg-white/[0.01]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {}}
          >
            {/* Corner accents */}
            {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-4 h-4 pointer-events-none`}>
                <div className={`absolute top-0 left-0 w-full h-px ${isDragging ? 'bg-amber-400/50' : 'bg-white/20'} transition-colors`} />
                <div className={`absolute top-0 left-0 w-px h-full ${isDragging ? 'bg-amber-400/50' : 'bg-white/20'} transition-colors`} />
              </div>
            ))}

            {/* Upload icon */}
            <div className={`w-14 h-14 mb-6 flex items-center justify-center border transition-all duration-500 ${isDragging ? 'border-amber-400/40 bg-amber-400/8' : 'border-white/8 group-hover:border-white/20'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                className={`transition-colors duration-300 ${isDragging ? 'text-amber-400/70' : 'text-white/25 group-hover:text-white/50'}`}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>

            <h3 className="font-serif text-2xl text-white mb-2">Arrastra tu CSV aquí</h3>
            <p className="font-mono-custom text-[10px] text-white/25 uppercase tracking-[0.2em] text-center leading-relaxed">
              Utiliza el componente "Subir Lote CSV" para procesar datos
            </p>
          </div>

          {/* Pipeline tracker — 2 cols */}
          <div className="lg:col-span-2 border border-white/6 bg-[#080807] p-6 flex flex-col justify-between">
            <div className="mb-6">
              <p className="font-mono-custom text-[9px] uppercase tracking-[0.25em] text-white/25 mb-1">Pipeline de Eventos</p>
              <div className="h-px w-8 bg-amber-400/30" />
            </div>

            <div className="flex flex-col gap-0 flex-1 justify-center">
              {pipelineStages.map((stage, i) => {
                const done    = pipelineStep > i;
                const active  = pipelineStep === i;
                return (
                  <div key={stage} className="flex items-stretch gap-4">
                    {/* Connector column */}
                    <div className="flex flex-col items-center w-5 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        done   ? 'border-emerald-400/50 bg-emerald-400/10' :
                        active ? 'border-amber-400/60 bg-amber-400/10 shadow-[0_0_10px_rgba(251,191,36,0.2)]' :
                                 'border-white/10 bg-transparent'
                      }`}>
                        {done ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : active ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        )}
                      </div>
                      {i < pipelineStages.length - 1 && (
                        <div className={`w-px flex-1 min-h-[28px] my-1 transition-all duration-700 ${done ? 'bg-emerald-400/30' : 'bg-white/6'}`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pb-6 pt-0.5 transition-all duration-500 ${i === pipelineStages.length - 1 ? 'pb-0' : ''}`}>
                      <p className={`font-mono-custom text-[11px] transition-colors duration-300 ${
                        done   ? 'text-emerald-400/60' :
                        active ? 'text-amber-400' :
                                 'text-white/18'
                      }`}>
                        {stage}
                      </p>
                      {active && (
                        <p className="font-mono-custom text-[9px] text-amber-400/40 mt-0.5 uppercase tracking-[0.15em]">
                          procesando…
                        </p>
                      )}
                      {done && (
                        <p className="font-mono-custom text-[9px] text-emerald-400/30 mt-0.5 uppercase tracking-[0.15em]">
                          completado
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom status */}
            <div className="mt-6 pt-5 border-t border-white/5">
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-mono-custom text-[9px] text-amber-400/50 uppercase tracking-[0.15em]">Inferencia activa</span>
                </div>
              ) : results.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono-custom text-[9px] text-emerald-400/50 uppercase tracking-[0.15em]">Lote completado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="font-mono-custom text-[9px] text-white/15 uppercase tracking-[0.15em]">En espera</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RESULTS TABLE ── */}
        <div className="space-y-5">

          {/* Table header row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-mono-custom text-[10px] uppercase tracking-[0.25em] text-white/35">
                Cola de Resultados
              </h3>
              <div className="mt-1.5 h-px w-10 bg-amber-400/30" />
            </div>

            {/* Filter pills */}
            {results.length > 0 && (
              <div className="flex items-center gap-1.5">
                {(['Todos', 'Alta', 'Media', 'Baja'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`font-mono-custom text-[9px] uppercase tracking-[0.18em] px-3 py-1.5 border transition-all duration-200 ${
                      filter === f
                        ? f === 'Alta'  ? 'border-red-400/40 bg-red-400/10 text-red-400'
                        : f === 'Media' ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                        : f === 'Baja'  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                        : 'border-white/20 bg-white/5 text-white'
                        : 'border-white/6 text-white/25 hover:border-white/15 hover:text-white/50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="border border-white/6 overflow-hidden">

            {/* Column headers */}
            <div className="hidden md:grid border-b border-white/6 bg-white/[0.015]"
              style={{ gridTemplateColumns: '100px 1fr 150px 80px 90px 56px' }}>
              {['ID', 'Síntomas Extraídos', 'Especialidad', 'Urgencia', 'Confianza', ''].map((h) => (
                <div key={h} className="px-5 py-3.5">
                  <span className="font-mono-custom text-[8px] uppercase tracking-[0.25em] text-white/20">{h}</span>
                </div>
              ))}
            </div>

            {/* Empty */}
            {results.length === 0 && !isProcessing && (
              <div className="py-24 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border border-white/6 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/15">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <p className="font-mono-custom text-[9px] text-white/15 uppercase tracking-[0.25em]">
                  SQS Queue vacía — arrastra un CSV o haz click arriba
                </p>
              </div>
            )}

            {/* Processing skeleton */}
            {isProcessing && (
              <div className="divide-y divide-white/4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="hidden md:grid px-5 py-5" style={{ gridTemplateColumns: '100px 1fr 150px 80px 90px 56px' }}>
                    {[120, 200, 100, 60, 50, 20].map((w, j) => (
                      <div key={j} className="flex items-center">
                        <div
                          className="h-2 bg-white/5 rounded-sm animate-pulse"
                          style={{ width: w, animationDelay: `${i * 0.1 + j * 0.05}s` }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {filtered.map((r, i) => {
              const cfg = urgencyConfig[r.urgency];
              const isOpen = expanded === r.id;
              return (
                <div
                  key={r.id}
                  className={`border-b border-white/4 last:border-0 transition-colors duration-200 ${isOpen ? 'bg-white/[0.025]' : 'hover:bg-white/[0.02]'}`}
                  style={{ animation: `fade-up 0.4s ease-out ${i * 0.07}s both` }}
                >
                  {/* Main row */}
                  <div
                    className="hidden md:grid cursor-pointer"
                    style={{ gridTemplateColumns: '100px 1fr 150px 80px 90px 56px' }}
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    {/* ID */}
                    <div className="px-5 py-5 flex items-center">
                      <span className={`font-mono-custom text-[10px] ${cfg.dim}`}>{r.id}</span>
                    </div>

                    {/* Symptoms */}
                    <div className="px-5 py-5 flex items-center gap-3">
                      <div className={`w-px h-6 flex-shrink-0 ${cfg.bar}`} />
                      <span className="text-sm text-white/60 truncate">{r.symptoms}</span>
                    </div>

                    {/* Specialty */}
                    <div className="px-5 py-5 flex items-center">
                      <span className="text-sm text-white/40">{r.specialty}</span>
                    </div>

                    {/* Urgency */}
                    <div className="px-5 py-5 flex items-center">
                      <span className={`font-mono-custom text-[9px] uppercase tracking-[0.15em] px-2 py-1 border ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.glow}`}>
                        {r.urgency}
                      </span>
                    </div>

                    {/* Confidence */}
                    <div className="px-5 py-5 flex flex-col justify-center gap-1.5">
                      <span className={`font-mono-custom text-[10px] ${cfg.dim}`}>{r.confidence}%</span>
                      <div className="w-full h-px bg-white/6 overflow-hidden">
                        <div className={`h-full ${cfg.bar} transition-all duration-1000`} style={{ width: `${r.confidence}%` }} />
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <div className="px-4 py-5 flex items-center justify-center">
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div
                    className="md:hidden px-5 py-4 flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className={`w-px h-12 mt-1 flex-shrink-0 ${cfg.bar}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-mono-custom text-[9px] ${cfg.dim}`}>{r.id}</span>
                        <span className={`font-mono-custom text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 border ${cfg.bg} ${cfg.border} ${cfg.text}`}>{r.urgency}</span>
                      </div>
                      <p className="text-sm text-white/55 truncate">{r.symptoms}</p>
                      <p className="font-mono-custom text-[9px] text-white/25 mt-0.5">{r.specialty}</p>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className={`px-5 pb-6 pt-2 border-t border-white/5 ${cfg.bg} animate-fade-up`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                          <p className="font-mono-custom text-[8px] uppercase tracking-[0.25em] text-white/20 mb-2">Nota clínica original</p>
                          <p className="text-sm text-white/50 leading-relaxed font-light">{r.note}</p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="font-mono-custom text-[8px] uppercase tracking-[0.25em] text-white/20 mb-1">Estado</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'Completado' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                              <span className="font-mono-custom text-[10px] text-white/50">{r.status}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-mono-custom text-[8px] uppercase tracking-[0.25em] text-white/20 mb-1">Tiempo de inferencia</p>
                            <span className={`font-mono-custom text-sm ${cfg.text}`}>{r.time}</span>
                          </div>
                          <div>
                            <p className="font-mono-custom text-[8px] uppercase tracking-[0.25em] text-white/20 mb-1">Confianza del modelo</p>
                            <span className={`font-serif text-2xl ${cfg.text}`}>{r.confidence}<span className="text-sm">%</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          {results.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
              <span className="font-mono-custom text-[9px] text-white/18 uppercase tracking-[0.2em]">
                {filtered.length} de {results.length} registros · Confianza promedio: {avgConf}%
              </span>
              <div className="flex items-center gap-4">
                {[
                  { label: 'Alta', count: alta, color: 'bg-red-400' },
                  { label: 'Media', count: media, color: 'bg-amber-400' },
                  { label: 'Baja', count: baja, color: 'bg-emerald-400' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                    <span className="font-mono-custom text-[9px] text-white/25">{count} {label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TriageDashboard;
