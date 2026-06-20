import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'DM Serif Display', Georgia, serif" };

const barData = [
  { label: 'Jun 14', alta: 8,  media: 12, baja: 5  },
  { label: 'Jun 15', alta: 14, media: 9,  baja: 8  },
  { label: 'Jun 16', alta: 6,  media: 15, baja: 11 },
  { label: 'Jun 17', alta: 18, media: 7,  baja: 6  },
  { label: 'Jun 18', alta: 11, media: 13, baja: 9  },
  { label: 'Jun 19', alta: 20, media: 10, baja: 7  },
  { label: 'Jun 20', alta: 9,  media: 16, baja: 13 },
];

const recentActivity = [
  { id: 'TRJ-042', specialty: 'Cardiología',       urgency: 'Alta'  as const, time: 'hace 3 min',  confidence: 97 },
  { id: 'TRJ-041', specialty: 'Medicina General',  urgency: 'Baja'  as const, time: 'hace 8 min',  confidence: 91 },
  { id: 'TRJ-040', specialty: 'Gastroenterología', urgency: 'Media' as const, time: 'hace 15 min', confidence: 88 },
  { id: 'TRJ-039', specialty: 'Neurología',        urgency: 'Alta'  as const, time: 'hace 22 min', confidence: 95 },
];

const urgencyDot: Record<string, string> = {
  Alta:  'bg-red-400',
  Media: 'bg-amber-400',
  Baja:  'bg-emerald-400',
};
const urgencyText: Record<string, string> = {
  Alta:  'text-red-400',
  Media: 'text-amber-400',
  Baja:  'text-emerald-400',
};

const useCounter = (target: number, duration = 1000, active = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration, active]);
  return val;
};

const KpiCard = ({ label, value, suffix = '', sub, topColor, delay, active }: {
  label: string; value: number; suffix?: string; sub: string; topColor: string; delay: number; active: boolean;
}) => {
  const n = useCounter(value, 900 + delay, active);
  return (
    <div
      className="border border-white/6 bg-[#070606] flex flex-col overflow-hidden relative group hover:border-white/12 transition-colors duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`h-px w-full ${topColor}`} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <span style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22">{label}</span>
        <span style={serif} className="text-[2.4rem] text-white leading-none">
          {active ? n : '—'}<span className="text-xl text-white/30">{suffix}</span>
        </span>
        <span style={mono} className="text-[9px] text-white/20 uppercase tracking-[0.15em] mt-auto">{sub}</span>
      </div>
    </div>
  );
};

const OverviewView = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const maxTotal = Math.max(...barData.map(d => d.alta + d.media + d.baja));

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const totalProcesado = barData.reduce((s, d) => s + d.alta + d.media + d.baja, 0);
  const totalAlta = barData.reduce((s, d) => s + d.alta, 0);

  return (
    <div ref={ref} className="space-y-6">

      {/* Page header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p style={mono} className="text-[9px] uppercase tracking-[0.3em] text-white/22 mb-3">/ Resumen Clínico</p>
          <h1 style={serif} className="text-4xl text-white leading-tight">
            Vista General
          </h1>
        </div>
        <button
          onClick={() => navigate('/dashboard/upload')}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-amber-400/30 bg-amber-400/6 text-amber-400 hover:bg-amber-400/12 transition-colors duration-200"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <span style={mono} className="text-[10px] uppercase tracking-[0.2em]">Cargar Lote</span>
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Procesado"    value={totalProcesado} sub="Notas clínicas"          topColor="bg-white/10"        delay={0}   active={active} />
        <KpiCard label="Urgencias Altas"    value={totalAlta}      sub="Requieren atención inmediata" topColor="bg-red-400/50"  delay={80}  active={active} />
        <KpiCard label="Precisión IA"       value={97}  suffix="%" sub="Promedio Llama 3 · Groq"  topColor="bg-amber-400/50"   delay={160} active={active} />
        <KpiCard label="Tiempo / registro"  value={4}   suffix="s" sub="Décimas de segundo"        topColor="bg-emerald-400/40" delay={240} active={active} />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart — 2 cols */}
        <div className="lg:col-span-2 border border-white/6 bg-[#070606] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Actividad Semanal</p>
              <p style={serif} className="text-lg text-white">Registros por urgencia</p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4">
              {[['Alta', 'bg-red-400'], ['Media', 'bg-amber-400'], ['Baja', 'bg-emerald-400']].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 ${c}`} />
                  <span style={mono} className="text-[8px] uppercase tracking-[0.15em] text-white/25">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-2 h-44">
            {barData.map((d, i) => {
              const total = d.alta + d.media + d.baja;
              const hovered = hoveredBar === i;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 cursor-default group"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {hovered && (
                    <div className="absolute mb-1 border border-white/10 bg-[#0a0908] px-3 py-2 text-left pointer-events-none z-10 -translate-y-full mb-2" style={{ marginBottom: `${(total / maxTotal) * 176 + 24}px` }}>
                      <p style={mono} className="text-[8px] text-white/40 uppercase tracking-[0.15em] mb-1">{d.label}</p>
                      <p style={mono} className="text-[9px] text-red-400">Alta: {d.alta}</p>
                      <p style={mono} className="text-[9px] text-amber-400">Media: {d.media}</p>
                      <p style={mono} className="text-[9px] text-emerald-400">Baja: {d.baja}</p>
                    </div>
                  )}

                  {/* Stacked bar */}
                  <div
                    className="w-full flex flex-col-reverse gap-px transition-all duration-700 ease-out overflow-hidden"
                    style={{ height: active ? `${(total / maxTotal) * 160}px` : '0px' }}
                  >
                    <div className={`w-full bg-red-400/70 ${hovered ? 'bg-red-400' : ''} transition-colors`}
                      style={{ height: `${(d.alta / total) * 100}%`, transitionDelay: `${i * 60}ms` }} />
                    <div className={`w-full bg-amber-400/60 ${hovered ? 'bg-amber-400' : ''} transition-colors`}
                      style={{ height: `${(d.media / total) * 100}%` }} />
                    <div className={`w-full bg-emerald-400/50 ${hovered ? 'bg-emerald-400' : ''} transition-colors`}
                      style={{ height: `${(d.baja / total) * 100}%` }} />
                  </div>

                  <span style={mono} className={`text-[7px] uppercase tracking-[0.1em] transition-colors ${hovered ? 'text-white/50' : 'text-white/15'}`}>
                    {d.label.split(' ')[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity — 1 col */}
        <div className="border border-white/6 bg-[#070606] flex flex-col">
          <div className="px-5 py-5 border-b border-white/5">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Actividad Reciente</p>
            <p style={serif} className="text-lg text-white">Últimos triajes</p>
          </div>
          <div className="flex-1 divide-y divide-white/4">
            {recentActivity.map((item) => (
              <div key={item.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span style={mono} className={`text-[10px] ${urgencyText[item.urgency]}`}>{item.id}</span>
                  <span style={mono} className="text-[8px] text-white/18 uppercase tracking-[0.1em]">{item.time}</span>
                </div>
                <p className="text-sm text-white/50 mb-2">{item.specialty}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${urgencyDot[item.urgency]}`} />
                    <span style={mono} className={`text-[8px] uppercase tracking-[0.15em] ${urgencyText[item.urgency]} opacity-60`}>
                      {item.urgency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-px bg-white/6 overflow-hidden">
                      <div
                        className={`h-full ${urgencyDot[item.urgency]} transition-all duration-1000`}
                        style={{ width: active ? `${item.confidence}%` : '0%' }}
                      />
                    </div>
                    <span style={mono} className="text-[8px] text-white/20">{item.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-white/5">
            <button
              onClick={() => navigate('/dashboard/history')}
              style={mono}
              className="text-[9px] uppercase tracking-[0.2em] text-amber-400/50 hover:text-amber-400 transition-colors"
            >
              Ver historial completo →
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline status strip */}
      <div className="border border-white/6 bg-[#070606] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Estado del Pipeline</p>
          <p className="text-sm text-white/50">Todos los servicios operando con normalidad</p>
        </div>
        <div className="flex items-center gap-6">
          {[
            { name: 'S3', ok: true },
            { name: 'EventBridge', ok: true },
            { name: 'SQS', ok: true },
            { name: 'Lambda', ok: true },
            { name: 'Groq API', ok: true },
          ].map(({ name, ok }) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className={`w-1 h-1 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span style={mono} className="text-[8px] uppercase tracking-[0.15em] text-white/25">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
