import { useEffect, useRef } from 'react';

const steps = [
  {
    num: '01',
    tag: 'Ingesta',
    title: 'AWS S3',
    desc: 'El usuario sube un lote CSV desde el frontend hacia un bucket privado en AWS S3.',
    color: 'text-sky-400',
    borderColor: 'border-sky-400/20',
    bgColor: 'bg-sky-400/5',
  },
  {
    num: '02',
    tag: 'Trigger',
    title: 'EventBridge',
    desc: 'S3 dispara un evento automático que notifica la llegada del nuevo archivo al bus de eventos.',
    color: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    bgColor: 'bg-amber-400/5',
  },
  {
    num: '03',
    tag: 'Cola',
    title: 'AWS SQS',
    desc: 'Los registros se encolan para garantizar un procesamiento ordenado, resiliente y sin pérdida.',
    color: 'text-orange-400',
    borderColor: 'border-orange-400/20',
    bgColor: 'bg-orange-400/5',
  },
  {
    num: '04',
    tag: 'Cómputo',
    title: 'Lambda',
    desc: 'Una función Serverless consume la cola por lotes y orquesta la llamada a la IA generativa.',
    color: 'text-violet-400',
    borderColor: 'border-violet-400/20',
    bgColor: 'bg-violet-400/5',
  },
  {
    num: '05',
    tag: 'Inferencia',
    title: 'Groq API',
    desc: 'Inferencia ultrarrápida con Llama 3 para clasificar urgencia y extraer síntomas clave.',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-400/20',
    bgColor: 'bg-emerald-400/5',
  },
];

const ArchitectureSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.arch-item').forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="arquitectura"
      ref={sectionRef}
      className="w-full bg-[#040403] text-white py-28 px-8 md:px-16 lg:px-24 border-t border-white/6 relative overflow-hidden"
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/4 blur-[120px] rounded-full pointer-events-none" />

      {/* Section Number */}
      <div className="absolute top-10 right-10 font-mono-custom text-[80px] font-bold text-white/3 leading-none select-none">02</div>

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-20 arch-item transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
          <span className="section-label">/ Arquitectura</span>
          <h2 className="font-serif text-[clamp(2.8rem,6vw,7rem)] leading-[0.92] tracking-tight mt-8">
            100% <span className="italic text-white/25">Serverless</span>
          </h2>
          <p className="mt-6 text-white/40 max-w-lg leading-relaxed font-light">
            Diseñado para escalar de 1 a 1,000,000 de registros sin aprovisionar un solo servidor. Flujo completamente orientado a eventos.
          </p>
        </div>

        {/* Flow steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(10%+28px)] right-[calc(10%+28px)] h-px bg-gradient-to-r from-sky-400/20 via-violet-400/20 to-emerald-400/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`arch-item relative transition-all duration-700 ${step.borderColor} border ${step.bgColor} p-6 hover:scale-[1.02] cursor-default`}
                style={{ opacity: 0, transform: 'translateY(20px)' }}
              >
                {/* Step number */}
                <div className="flex items-center gap-3 mb-6">
                  <span className={`font-mono-custom text-[10px] ${step.color} opacity-60 tracking-[0.2em]`}>
                    {step.num}
                  </span>
                  <div className={`flex-1 h-px ${step.bgColor} border-0`} style={{ background: 'currentColor', opacity: 0.1 }} />
                </div>

                {/* Tag */}
                <p className={`font-mono-custom text-[9px] uppercase tracking-[0.25em] ${step.color} opacity-50 mb-2`}>
                  {step.tag}
                </p>

                {/* Title */}
                <h4 className="font-serif text-xl text-white mb-4">{step.title}</h4>

                {/* Description */}
                <p className="text-xs text-white/40 leading-relaxed font-light">{step.desc}</p>

                {/* Arrow connector (desktop, except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-[9px] top-[44px] w-4 h-4 items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 bg-white/20 rotate-45 border-r border-t border-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="arch-item mt-14 pt-10 border-t border-white/6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(20px)' }}>
          <p className="font-mono-custom text-[10px] text-white/25 uppercase tracking-[0.2em]">
            Cada paso es independiente y escalable horizontalmente
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {['S3', 'EventBridge', 'SQS', 'Lambda', 'Groq', 'WebSockets'].map((service) => (
              <span key={service} className="font-mono-custom text-[9px] text-white/20 uppercase tracking-widest">{service}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
