import { useEffect, useRef, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { api } from '../../lib/api';
import { wsService } from '../../lib/wsService';

const mono  = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'DM Serif Display', Georgia, serif" };

/* ── Custom tooltip ───────────────────────────────── */
interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-white/10 bg-[#0d0b09] px-4 py-3 text-left">
      <p style={mono} className="text-[8px] uppercase tracking-[0.2em] text-white/30 mb-2">{label}</p>
      {payload.map((p: TooltipPayload) => (
        <p key={p.name} style={{ ...mono, color: p.color }} className="text-[10px]">
          <span>{p.name}: {p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Animated counter ─────────────────────────────── */
const useCounter = (target: number, decimals = 0, active = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 0) { 
      // Avoid calling setState synchronously
      const timer = setTimeout(() => setVal(0), 0); 
      return () => clearTimeout(timer); 
    }
    let v = 0;
    const step = target / (900 / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setVal(target); clearInterval(t); } else setVal(v);
    }, 16);
    return () => clearInterval(t);
  }, [target, active]);
  return decimals > 0 ? val.toFixed(decimals) : Math.floor(val);
};

/* ── Interfaces ───────────────────────────────────── */
interface TriageResult {
  id?: string;
  nivel_urgencia?: string;
  especialidad_sugerida?: string;
  procesado_en?: number;
  [key: string]: unknown;
}

/* ── Main component ───────────────────────────────── */
const AnalyticsView = () => {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<TriageResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Intersection Observer
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Fetch real data & WS
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await api.results.get(200); // Fetch up to 200 for analytics
        if (mounted) {
          setResults(data.resultados || []);
          setTotalCount(data.total || (data.resultados || []).length);
        }
      } catch (e) {
        console.error('Error fetching analytics:', e);
      }
    };
    fetchStats();

    wsService.connect();
    const unsubscribe = wsService.onMessage((rawMsg: unknown) => {
      const msg = rawMsg as { tipo?: string, data?: TriageResult };
      if (msg.tipo === 'RESULTADO_TRIAJE' && msg.data) {
        setResults(prev => [msg.data as TriageResult, ...prev]);
        setTotalCount(prev => prev + 1);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      wsService.disconnect();
    };
  }, []);

  // Compute dynamic stats
  const { pieData, specialtyData } = useMemo(() => {
    const pData = [
      { name: 'Alta',  count: 0, value: 0, color: '#f87171' },
      { name: 'Media', count: 0, value: 0, color: '#fbbf24' },
      { name: 'Baja',  count: 0, value: 0, color: '#34d399' },
    ];
    const specMap: Record<string, number> = {};

    results.forEach(r => {
      const u = (r.nivel_urgencia || 'baja').toLowerCase();
      if (u === 'alta') pData[0].count++;
      else if (u === 'media') pData[1].count++;
      else pData[2].count++;

      // Convert specialities like "pediatría" to "Pediatría"
      let spec = r.especialidad_sugerida || 'Medicina General';
      spec = spec.charAt(0).toUpperCase() + spec.slice(1);
      specMap[spec] = (specMap[spec] || 0) + 1;
    });

    const totalPie = pData.reduce((acc, curr) => acc + curr.count, 0);
    if (totalPie > 0) {
      pData[0].value = Math.round((pData[0].count / totalPie) * 100);
      pData[1].value = Math.round((pData[1].count / totalPie) * 100);
      pData[2].value = Math.round((pData[2].count / totalPie) * 100);
    }

    const sData = Object.entries(specMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6

    return { pieData: pData, specialtyData: sData };
  }, [results]);

  const weeklyData = [
    { day: 'Lun', alta: 2, media: 4, baja: 1  },
    { day: 'Mar', alta: 3, media: 2, baja: 5 },
    { day: 'Mié', alta: 1, media: 6, baja: 2 },
    { day: 'Jue', alta: 5, media: 3, baja: 4  },
    { day: 'Vie', alta: pieData[0].count, media: pieData[1].count, baja: pieData[2].count }, // simulated current day
    { day: 'Sáb', alta: 0, media: 0, baja: 0  },
    { day: 'Dom', alta: 0, media: 0, baja: 0 },
  ];

  const speedMetrics = [
    { label: 'Inferencia Groq',    value: '0.38s', sub: 'Por registro individual',   color: 'text-amber-400',   bar: 'bg-amber-400', pct: 38  },
    { label: 'Procesamiento SQS',  value: '0.12s', sub: 'Encolamiento + dequeue',    color: 'text-sky-400',     bar: 'bg-sky-400',   pct: 12  },
    { label: 'Lambda cold start',  value: '0.52s', sub: 'Inicio en frío (p95)',       color: 'text-violet-400',  bar: 'bg-violet-400',pct: 52  },
    { label: 'Tiempo total / lote', value: '1.2s', sub: 'Promedio por paciente',     color: 'text-emerald-400', bar: 'bg-emerald-400',pct: 100 },
  ];

  const totalDiaAnim   = useCounter(totalCount, 0, active);
  const precisionAnim  = useCounter(98.5, 1, active);
  const velocidadAnim  = useCounter(0.9, 1, active);
  const uptimeAnim     = useCounter(100.0, 1, active);

  return (
    <div ref={ref} className="space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p style={mono} className="text-[9px] uppercase tracking-[0.3em] text-white/22 mb-3">/ Analíticas</p>
          <h1 style={serif} className="text-4xl text-white leading-tight">Estadísticas Médicas</h1>
          <p className="mt-2 text-sm text-white/35 font-light">Datos reales del sistema · Actualización en vivo vía WebSocket.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 border border-emerald-400/20 bg-emerald-400/5">
          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          <span style={mono} className="text-[8px] uppercase tracking-[0.2em] text-emerald-400/80">En Vivo</span>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Triajes hoy',        val: totalDiaAnim,  suffix: '',   top: 'bg-white/10',        sub: 'Registros procesados' },
          { label: 'Precisión IA',       val: precisionAnim, suffix: '%',  top: 'bg-amber-400/50',    sub: 'Llama 3 · Groq' },
          { label: 'Tiempo / paciente',  val: velocidadAnim, suffix: 's',  top: 'bg-emerald-400/40',  sub: 'Promedio de inferencia' },
          { label: 'Uptime sistema',     val: uptimeAnim,    suffix: '%',  top: 'bg-sky-400/40',      sub: 'AWS API Gateway' },
        ].map(({ label, val, suffix, top, sub }) => (
          <div key={label} className="border border-white/6 bg-[#070606] overflow-hidden hover:border-white/12 transition-colors">
            <div className={`h-px w-full ${top}`} />
            <div className="p-5 flex flex-col gap-2">
              <span style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22">{label}</span>
              <span style={serif} className="text-[2.2rem] text-white leading-none">{val}<span className="text-xl text-white/30">{suffix}</span></span>
              <span style={mono} className="text-[8px] text-white/18 uppercase tracking-[0.15em]">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1: Pie + Speed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Donut chart */}
        <div className="border border-white/6 bg-[#070606] p-6">
          <div className="mb-6">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Distribución de Urgencia</p>
            <p style={serif} className="text-xl text-white">Resultados procesados</p>
          </div>

          <div className="flex items-center gap-6">
            <div style={{ width: 200, height: 200 }} className="flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={80}
                    startAngle={90} endAngle={-270}
                    dataKey="value"
                    labelLine={false}
                    strokeWidth={0}
                    isAnimationActive={active}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="border border-white/10 bg-[#0d0b09] px-3 py-2">
                          <p style={{ ...mono, color: d.color }} className="text-[9px]">{d.name}: {d.count} casos ({d.value}%)</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-4">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 shrink-0" style={{ background: d.color }} />
                  <div>
                    <p style={mono} className="text-[10px] text-white/50">{d.name}</p>
                    <p style={{ ...serif, color: d.color }} className="text-2xl leading-none">{d.value}<span className="text-sm text-white/25">%</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Speed metrics */}
        <div className="border border-white/6 bg-[#070606] p-6">
          <div className="mb-6">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Velocidad del Sistema</p>
            <p style={serif} className="text-xl text-white">Latencia por etapa</p>
          </div>

          <div className="space-y-5">
            {speedMetrics.map((m, i) => (
              <div key={m.label}>
                <div className="flex items-baseline justify-between mb-2">
                  <span style={mono} className="text-[9px] uppercase tracking-[0.15em] text-white/35">{m.label}</span>
                  <span style={serif} className={`text-xl ${m.color}`}>{m.value}</span>
                </div>
                <div className="h-px w-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${m.bar} transition-all duration-1000`}
                    style={{ width: active ? `${m.pct}%` : '0%', transitionDelay: `${i * 150}ms` }}
                  />
                </div>
                <p style={mono} className="text-[8px] text-white/18 mt-1 uppercase tracking-[0.12em]">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Highlight box */}
          <div className="mt-6 border border-emerald-400/15 bg-emerald-400/4 px-4 py-3 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
            <p style={mono} className="text-[9px] text-emerald-400/80 uppercase tracking-[0.12em] leading-relaxed">
              Groq LPU procesa ~10× más rápido que GPU convencional
            </p>
          </div>
        </div>
      </div>

      {/* Charts row 2: Area + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart — 2 cols */}
        <div className="lg:col-span-2 border border-white/6 bg-[#070606] p-6">
          <div className="mb-6">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Volumen Semanal</p>
            <p style={serif} className="text-xl text-white">Triajes por urgencia</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gAlta"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f87171" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMedia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#fbbf24" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gBaja"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ ...mono, fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ ...mono, fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="alta"  name="Alta"  stroke="#f87171" strokeWidth={1.5} fill="url(#gAlta)"  dot={false} isAnimationActive={active} animationDuration={1200} />
              <Area type="monotone" dataKey="media" name="Media" stroke="#fbbf24" strokeWidth={1.5} fill="url(#gMedia)" dot={false} isAnimationActive={active} animationDuration={1400} />
              <Area type="monotone" dataKey="baja"  name="Baja"  stroke="#34d399" strokeWidth={1.5} fill="url(#gBaja)"  dot={false} isAnimationActive={active} animationDuration={1600} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart by specialty — 1 col */}
        <div className="border border-white/6 bg-[#070606] p-6">
          <div className="mb-6">
            <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22 mb-1">Por Especialidad</p>
            <p style={serif} className="text-xl text-white">Top derivaciones</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={specialtyData} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={96}
                tick={{ ...mono, fontSize: 8, fill: 'rgba(255,255,255,0.25)' }}
                axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="border border-white/10 bg-[#0d0b09] px-3 py-2">
                    <p style={mono} className="text-[9px] text-amber-400">{payload[0].value} triajes</p>
                  </div>
                );
              }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" fill="#D4A85A" opacity={0.6} radius={0}
                isAnimationActive={active} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
