import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const mono  = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'DM Serif Display', Georgia, serif" };

/* ── Data ─────────────────────────────────────────── */
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
  { id: 'TRJ-038', specialty: 'Oftalmología',      urgency: 'Alta'  as const, time: 'hace 31 min', confidence: 96 },
  { id: 'TRJ-037', specialty: 'Alergología',       urgency: 'Media' as const, time: 'hace 45 min', confidence: 89 },
];

const specialtyBreakdown = [
  { name: 'Medicina General',   count: 67, pct: 100 },
  { name: 'Cardiología',        count: 42, pct: 63  },
  { name: 'Gastroenterología',  count: 31, pct: 46  },
  { name: 'Neurología',         count: 28, pct: 42  },
  { name: 'Alergología',        count: 19, pct: 28  },
  { name: 'Oftalmología',       count: 14, pct: 21  },
];

// Heatmap: 6 days × 8 time slots
const heatHours = ['00–03', '03–06', '06–09', '09–12', '12–15', '15–18', '18–21', '21–24'];
const heatDays  = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const heatData  = [
  [1,0,2,8,6,5,3,1],
  [0,1,3,9,7,4,2,0],
  [2,0,4,12,10,6,3,1],
  [1,2,5,15,11,8,4,2],
  [0,1,3,10,8,5,3,1],
  [1,0,1,4,3,2,2,1],
  [0,0,1,3,2,2,1,0],
];
const heatMax = 15;

const criticalAlerts = [
  { id: 'TRJ-042', msg: 'Dolor torácico agudo — derivación urgente a UCI',     time: '11:42', type: 'alta'  },
  { id: 'TRJ-038', msg: 'Pérdida de visión súbita — protocolo FAST activado',  time: '10:21', type: 'alta'  },
  { id: 'TRJ-036', msg: 'Disnea progresiva con antecedente cardíaco conocido', time: '09:12', type: 'alta'  },
];

const pipelineServices = [
  { name: 'AWS S3',       ok: true,  latency: '12ms'  },
  { name: 'EventBridge',  ok: true,  latency: '4ms'   },
  { name: 'SQS',          ok: true,  latency: '8ms'   },
  { name: 'Lambda',       ok: true,  latency: '520ms' },
  { name: 'Groq API',     ok: true,  latency: '380ms' },
];

const urgencyDot:  Record<string,string> = { Alta: 'bg-red-400',     Media: 'bg-amber-400',   Baja: 'bg-emerald-400' };
const urgencyText: Record<string,string> = { Alta: 'text-red-400',   Media: 'text-amber-400', Baja: 'text-emerald-400' };

/* ── Counter hook ─────────────────────────────────── */
const useCounter = (target: number, duration = 1000, active = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let v = 0; const step = target / (duration / 16);
    const t = setInterval(() => { v += step; if (v >= target) { setVal(target); clearInterval(t); } else setVal(Math.floor(v)); }, 16);
    return () => clearInterval(t);
  }, [target, duration, active]);
  return val;
};

/* ── KPI card ─────────────────────────────────────── */
const KpiCard = ({ label, value, suffix = '', sub, topColor, delay, active }: {
  label: string; value: number; suffix?: string; sub: string; topColor: string; delay: number; active: boolean;
}) => {
  const n = useCounter(value, 900 + delay, active);
  return (
    <div className="border border-white/6 bg-[#070606] flex flex-col overflow-hidden hover:border-white/12 transition-colors duration-300">
      <div className={`h-px w-full ${topColor}`} />
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <span style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22">{label}</span>
        <span style={serif} className="text-[2.2rem] text-white leading-none">
          {active ? n : '—'}<span className="text-lg text-white/30">{suffix}</span>
        </span>
        <span style={mono} className="text-[8px] text-white/18 uppercase tracking-[0.15em] mt-auto">{sub}</span>
      </div>
    </div>
  );
};

/* ── Heat cell ────────────────────────────────────── */
const HeatCell = ({ value, active }: { value: number; active: boolean }) => {
  const intensity = value / heatMax;
  const opacity = active ? (value === 0 ? 0.04 : 0.1 + intensity * 0.75) : 0.04;
  return (
    <div
      className="aspect-square transition-all duration-700 cursor-default hover:ring-1 hover:ring-amber-400/30"
      style={{ background: `rgba(212,168,90,${opacity})` }}
      title={`${value} triajes`}
    />
  );
};

/* ── Main ─────────────────────────────────────────── */
const OverviewView = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const maxTotal = Math.max(...barData.map(d => d.alta + d.media + d.baja));

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const totalProcesado = barData.reduce((s, d) => s + d.alta + d.media + d.baja, 0);
  const totalAlta      = barData.reduce((s, d) => s + d.alta, 0);

  return (
    <div ref={ref} className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p style={mono} className="text-[9px] uppercase tracking-[0.3em] text-white/22 mb-3">/ Resumen Clínico</p>
          <h1 style={serif} className="text-4xl text-white leading-tight">Vista General</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard/upload')}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-amber-400/30 bg-amber-400/6 text-amber-400 hover:bg-amber-400/12 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <span style={mono} className="text-[10px] uppercase tracking-[0.2em]">Cargar Lote</span>
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Procesado"   value={totalProcesado} sub="Notas clínicas"              topColor="bg-white/10"        delay={0}   active={active} />
        <KpiCard label="Urgencias Altas"   value={totalAlta}      sub="Requieren atención inmediata" topColor="bg-red-400/50"      delay={80}  active={active} />
        <KpiCard label="Precisión IA"      value={97} suffix="%"  sub="Promedio Llama 3 · Groq"      topColor="bg-amber-400/50"   delay={160} active={active} />
        <KpiCard label="Tiempo / registro" value={4}  suffix="s"  sub="Décimas de segundo"           topColor="bg-emerald-400/40" delay={240} active={active} />
      </div>

      {/* ── Chart + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Stacked bar chart */}
        <div className="lg:col-span-2 border border-white/6 bg-[#070606] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div>
              <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-0.5">Actividad Semanal</p>
              <p style={serif} className="text-lg text-white">Registros por urgencia</p>
            </div>
            <div className="flex items-center gap-4">
              {[['Alta','bg-red-400'],['Media','bg-amber-400'],['Baja','bg-emerald-400']].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 ${c}`} />
                  <span style={mono} className="text-[8px] uppercase tracking-[0.15em] text-white/25">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 flex-1 min-h-[160px]">
            {barData.map((d, i) => {
              const total = d.alta + d.media + d.baja;
              const hov = hoveredBar === i;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 cursor-default relative h-full"
                  onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                  {hov && (
                    <div className="absolute bottom-full mb-2 border border-white/10 bg-[#0d0b09] px-3 py-2 text-left z-10 whitespace-nowrap">
                      <p style={mono} className="text-[8px] text-white/35 mb-1">{d.label}</p>
                      <p style={mono} className="text-[9px] text-red-400">Alta: {d.alta}</p>
                      <p style={mono} className="text-[9px] text-amber-400">Media: {d.media}</p>
                      <p style={mono} className="text-[9px] text-emerald-400">Baja: {d.baja}</p>
                    </div>
                  )}
                  <div className="w-full flex flex-col-reverse gap-px overflow-hidden transition-all duration-700"
                    style={{ height: active ? `${(total / maxTotal) * 100}%` : '0%' }}>
                    <div className={`w-full transition-colors ${hov ? 'bg-red-400' : 'bg-red-400/70'}`} style={{ height: `${(d.alta/total)*100}%` }} />
                    <div className={`w-full transition-colors ${hov ? 'bg-amber-400' : 'bg-amber-400/60'}`} style={{ height: `${(d.media/total)*100}%` }} />
                    <div className={`w-full transition-colors ${hov ? 'bg-emerald-400' : 'bg-emerald-400/50'}`} style={{ height: `${(d.baja/total)*100}%` }} />
                  </div>
                  <span style={mono} className={`text-[7px] uppercase tracking-[0.1em] ${hov ? 'text-white/50' : 'text-white/15'} flex-shrink-0 mt-1`}>
                    {d.label.split(' ')[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="border border-white/6 bg-[#070606] flex flex-col">
          <div className="px-5 py-4 border-b border-white/5">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-0.5">Actividad Reciente</p>
            <p style={serif} className="text-lg text-white">Últimos triajes</p>
          </div>
          <div className="flex-1 divide-y divide-white/4 overflow-y-auto">
            {recentActivity.map((item) => (
              <div key={item.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span style={mono} className={`text-[10px] ${urgencyText[item.urgency]}`}>{item.id}</span>
                  <span style={mono} className="text-[8px] text-white/18">{item.time}</span>
                </div>
                <p className="text-sm text-white/50 mb-2">{item.specialty}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${urgencyDot[item.urgency]}`} />
                    <span style={mono} className={`text-[8px] uppercase tracking-[0.12em] ${urgencyText[item.urgency]} opacity-60`}>{item.urgency}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-px bg-white/6 overflow-hidden">
                      <div className={`h-full ${urgencyDot[item.urgency]} transition-all duration-1000`}
                        style={{ width: active ? `${item.confidence}%` : '0%' }} />
                    </div>
                    <span style={mono} className="text-[8px] text-white/20">{item.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/5">
            <button onClick={() => navigate('/dashboard/history')} style={mono}
              className="text-[9px] uppercase tracking-[0.2em] text-amber-400/50 hover:text-amber-400 transition-colors">
              Ver historial completo →
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 3: Heatmap + Specialties + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Heatmap de horas pico */}
        <div className="border border-white/6 bg-[#070606] p-5">
          <div className="mb-4">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-0.5">Horas Pico</p>
            <p style={serif} className="text-lg text-white">Volumen por franja horaria</p>
          </div>

          {/* Hour labels */}
          <div className="grid gap-1" style={{ gridTemplateColumns: '16px repeat(8, 1fr)' }}>
            <div />
            {heatHours.map(h => (
              <span key={h} style={mono} className="text-[6px] text-white/18 text-center leading-none">{h.split('–')[0]}</span>
            ))}

            {heatData.map((row, di) => (
              <>
                <span key={`d-${di}`} style={mono} className="text-[7px] text-white/25 flex items-center">{heatDays[di]}</span>
                {row.map((val, hi) => (
                  <HeatCell key={`${di}-${hi}`} value={val} active={active} />
                ))}
              </>
            ))}
          </div>

          {/* Scale */}
          <div className="mt-3 flex items-center gap-2">
            <span style={mono} className="text-[7px] text-white/18">Menos</span>
            <div className="flex gap-0.5">
              {[0.05, 0.2, 0.4, 0.6, 0.85].map((o, i) => (
                <div key={i} className="w-3 h-3" style={{ background: `rgba(212,168,90,${o})` }} />
              ))}
            </div>
            <span style={mono} className="text-[7px] text-white/18">Más</span>
          </div>
        </div>

        {/* Especialidades */}
        <div className="border border-white/6 bg-[#070606] p-5">
          <div className="mb-4">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-0.5">Derivaciones</p>
            <p style={serif} className="text-lg text-white">Por especialidad</p>
          </div>
          <div className="space-y-3">
            {specialtyBreakdown.map((s, i) => (
              <div key={s.name}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span style={mono} className="text-[9px] text-white/40 truncate mr-2">{s.name}</span>
                  <span style={mono} className="text-[10px] text-amber-400/70 flex-shrink-0">{s.count}</span>
                </div>
                <div className="h-px w-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-amber-400/50 transition-all duration-1000"
                    style={{ width: active ? `${s.pct}%` : '0%', transitionDelay: `${i * 80}ms` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/5">
            <button onClick={() => navigate('/dashboard/analytics')} style={mono}
              className="text-[9px] uppercase tracking-[0.2em] text-amber-400/50 hover:text-amber-400 transition-colors">
              Ver analíticas →
            </button>
          </div>
        </div>

        {/* Alertas críticas */}
        <div className="border border-red-400/12 bg-red-400/[0.03] flex flex-col">
          <div className="px-5 py-4 border-b border-red-400/10 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
            <div>
              <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-red-400/50 mb-0.5">Alertas Activas</p>
              <p style={serif} className="text-lg text-white">Urgencias críticas</p>
            </div>
          </div>
          <div className="flex-1 divide-y divide-red-400/8">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="px-5 py-4 hover:bg-red-400/[0.04] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span style={mono} className="text-[9px] text-red-400/70">{alert.id}</span>
                  <span style={mono} className="text-[8px] text-white/18">{alert.time}</span>
                </div>
                <p className="text-xs text-white/45 leading-relaxed">{alert.msg}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-red-400/10">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-red-400/60" />
              <span style={mono} className="text-[8px] text-red-400/40 uppercase tracking-[0.15em]">
                {criticalAlerts.length} casos requieren atención
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pipeline status ── */}
      <div className="border border-white/6 bg-[#070606] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-0.5">Estado del Pipeline</p>
          <p className="text-sm text-white/40">Todos los servicios operando con normalidad</p>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          {pipelineServices.map(({ name, ok, latency }) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <div>
                <span style={mono} className="text-[8px] uppercase tracking-[0.15em] text-white/25 block">{name}</span>
                <span style={mono} className="text-[7px] text-white/15">{latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default OverviewView;
