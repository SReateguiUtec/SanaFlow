import { useEffect, useRef } from 'react';

const logLines = [
  { text: '[ERROR] Groq API — 429 Too Many Requests', color: 'text-red-400' },
  { text: '> Capturando excepción 429 Too Many Requests...', color: 'text-white/50' },
  { text: '> Extendiendo Visibility Timeout en SQS...', color: 'text-amber-400/80' },
  { text: '> Mensaje devuelto a la cola de forma segura.', color: 'text-white/50' },
  { text: '> Reintento programado en 30s.', color: 'text-white/50' },
  { text: '✓ CERO pérdida de datos clínicos.', color: 'text-emerald-400' },
];

const guarantees = [
  'Visibility Timeout configurable por tipo de error.',
  'Dead Letter Queues (DLQ) para análisis forense.',
  'Preservación absoluta de datos clínicos sensibles.',
];

const ResilienceSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.res-item').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0) translateX(0)';
              }, i * 150);
            });

            // Animate log lines
            if (logRef.current) {
              logRef.current.querySelectorAll('.log-line').forEach((el, i) => {
                setTimeout(() => {
                  (el as HTMLElement).style.opacity = '1';
                  (el as HTMLElement).style.transform = 'translateX(0)';
                }, 400 + i * 180);
              });
            }
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="resiliencia"
      ref={sectionRef}
      className="w-full bg-[#060503] text-white py-28 px-8 md:px-16 lg:px-24 border-t border-white/6 relative overflow-hidden"
    >
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-violet-500/4 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/3 blur-[100px] rounded-full pointer-events-none" />

      {/* Section Number */}
      <div className="absolute top-10 right-10 font-mono-custom text-[80px] font-bold text-white/3 leading-none select-none">03</div>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-20 res-item transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
          <span className="section-label">/ Tolerancia a Fallos</span>
          <h2 className="font-serif text-[clamp(2.8rem,6vw,7rem)] leading-[0.92] tracking-tight mt-8">
            Resiliencia ante <br />
            <span className="italic text-white/25">límites de API</span>
          </h2>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: Terminal */}
          <div className="res-item transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
            <div
              ref={logRef}
              className="border border-white/8 bg-[#030302] p-6 md:p-8"
            >
              {/* Terminal header bar */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/6">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
                <span className="ml-3 font-mono-custom text-[9px] text-white/20 uppercase tracking-[0.2em]">
                  sanaflow — lambda-processor
                </span>
              </div>

              {/* Log output */}
              <div className="space-y-2.5">
                {logLines.map((line, i) => (
                  <p
                    key={i}
                    className={`log-line font-mono-custom text-[11px] leading-relaxed transition-all duration-500 ${line.color}`}
                    style={{ opacity: 0, transform: 'translateX(-10px)' }}
                  >
                    {line.text}
                  </p>
                ))}
              </div>

              {/* Blinking cursor */}
              <div className="mt-4 flex items-center gap-1">
                <span className="font-mono-custom text-[11px] text-white/20">$</span>
                <span className="inline-block w-2 h-3.5 bg-amber-400/40 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right: Description + guarantees */}
          <div className="space-y-10">
            <div className="res-item transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
              <p className="text-white/50 text-lg leading-[1.8] font-light">
                Las APIs de LLMs tienen límites estrictos de tasa. Nuestra arquitectura{' '}
                <strong className="text-white/80 font-medium">intercepta errores automáticamente</strong>{' '}
                y devuelve el lote a AWS SQS para reintento garantizado — sin pérdida de ningún registro clínico.
              </p>
            </div>

            <div className="res-item space-y-0 border border-white/6 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
              <div className="px-6 py-4 border-b border-white/6">
                <span className="font-mono-custom text-[9px] text-white/25 uppercase tracking-[0.25em]">Garantías del Sistema</span>
              </div>
              {guarantees.map((g, i) => (
                <div key={i} className={`px-6 py-5 flex items-start gap-4 ${i < guarantees.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 mt-1.5 flex-shrink-0" />
                  <p className="text-white/55 text-sm leading-relaxed">{g}</p>
                </div>
              ))}
            </div>

            {/* Key metric */}
            <div className="res-item transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-6xl text-emerald-400">0%</span>
                <span className="font-mono-custom text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
                  Tasa de pérdida de datos bajo fallo de API
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResilienceSection;
