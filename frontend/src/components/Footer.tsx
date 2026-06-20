const Footer = () => {
  return (
    <footer className="w-full bg-[#030302] border-t border-white/6 relative overflow-hidden">

      {/* Top divider with amber accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-10">

        {/* Left: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 bg-amber-400/60 rounded-full" />
            </div>
            <span className="font-serif text-white text-lg tracking-tight">SanaFlow</span>
          </div>
          <p className="font-mono-custom text-[10px] text-white/20 uppercase tracking-[0.2em] leading-relaxed max-w-xs">
            Priorización clínica con IA Generativa<br />y Arquitectura Serverless en AWS.
          </p>
        </div>

        {/* Center: Stack */}
        <div className="flex flex-col gap-3">
          <span className="font-mono-custom text-[9px] text-white/15 uppercase tracking-[0.25em]">Stack</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {['AWS S3', 'EventBridge', 'SQS', 'Lambda', 'Groq / Llama 3', 'React', 'Vite'].map((tech) => (
              <span key={tech} className="font-mono-custom text-[10px] text-white/30 hover:text-amber-400/60 transition-colors cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Copyright + GitHub */}
        <div className="flex items-center gap-6">
          <p className="font-mono-custom text-[9px] text-white/15 uppercase tracking-[0.15em] text-right max-w-[220px]">
            © {new Date().getFullYear()} SanaFlow — Hackathon Cloud Computing
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/20 hover:text-white/70 transition-colors duration-300 flex-shrink-0"
            aria-label="Repositorio GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
