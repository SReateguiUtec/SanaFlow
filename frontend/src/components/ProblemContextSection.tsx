import { useEffect, useRef } from 'react';

const stats = [
  { value: '45m+', label: 'Tiempo perdido en clasificación manual por lote', accent: false },
  { value: '30%', label: 'Derivaciones erróneas por fatiga del personal médico', accent: false },
  { value: '0ms', label: 'Latencia añadida con nuestra arquitectura serverless', accent: true },
];

const ProblemContextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-item').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, i * 120);
            });
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
      id="problema"
      ref={sectionRef}
      className="w-full bg-[#060503] text-white py-28 px-8 md:px-16 lg:px-24 border-t border-white/6 relative overflow-hidden"
    >
      {/* Warm ambient glow */}
      <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-amber-500/4 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-red-900/6 blur-[100px] rounded-full pointer-events-none" />

      {/* Section Number */}
      <div className="absolute top-10 right-10 font-mono-custom text-[80px] font-bold text-white/3 leading-none select-none">01</div>

      <div className="max-w-7xl mx-auto">

        {/* Top row: label + headline */}
        <div className="mb-20">
          <div className="reveal-item mb-8 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
            <span className="section-label">/ El Problema</span>
          </div>
          <h2 className="reveal-item font-serif text-[clamp(2.8rem,6vw,7rem)] leading-[0.92] tracking-tight transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
            El cuello de botella<br />
            <span className="text-white/25">en el triaje</span>{' '}
            <span className="italic text-amber-400/80">clínico</span>
          </h2>
        </div>

        {/* Body: two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: Description */}
          <div className="reveal-item space-y-8 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
            <p className="text-white/50 text-lg leading-[1.8] font-light max-w-lg">
              Los centros de salud acumulan <strong className="text-white/80 font-medium">miles de registros médicos</strong> y notas de doctores no estructuradas diariamente. Categorizarlas manualmente para priorizar la atención o derivar a especialidades es lento, ineficiente y{' '}
              <strong className="text-red-400/80 font-medium">cuesta vidas</strong>.
            </p>

            {/* Solution callout */}
            <div className="border-l-2 border-amber-400/30 pl-6 space-y-3">
              <p className="font-mono-custom text-[10px] uppercase tracking-[0.25em] text-amber-400/60">La Solución</p>
              <p className="text-white/70 leading-relaxed">
                <strong className="text-white">Llama 3 vía Groq</strong> extrae instantáneamente Síntomas, Nivel de Urgencia y Especialidad Sugerida — con precisión sobrehumana y latencia de milisegundos.
              </p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="reveal-item space-y-0 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`py-8 flex items-start gap-8 ${i < stats.length - 1 ? 'border-b border-white/6' : ''}`}
              >
                <span className={`font-serif text-[clamp(2.5rem,4vw,4rem)] leading-none tracking-tight flex-shrink-0 ${stat.accent ? 'text-amber-400' : 'text-white'}`}>
                  {stat.value}
                </span>
                <p className="text-white/40 text-sm leading-relaxed mt-2 font-light">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemContextSection;
