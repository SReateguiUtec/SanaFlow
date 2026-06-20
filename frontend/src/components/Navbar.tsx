import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    if (!isLanding) {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isLanding
          ? 'bg-[#05050595] backdrop-blur-xl border-b border-white/8'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (isLanding) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/');
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }
          }}
        >
          <img src="/favicon.svg" alt="SanaFlow Icon" className="w-6 h-6" />
          <span className="font-serif text-white text-lg tracking-tight">SanaFlow</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {[
            { label: 'El Problema', id: 'problema' },
            { label: 'Arquitectura', id: 'arquitectura' },
            { label: 'Resiliencia', id: 'resiliencia' },
            { label: 'Demo', id: 'dashboard' },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="font-mono-custom text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/90 transition-colors duration-300"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Auth + Demo CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className={`font-mono-custom text-[11px] uppercase tracking-[0.2em] px-4 py-2.5 text-white/50 hover:text-white transition-colors duration-300 ${
              location.pathname === '/login' ? 'text-white' : ''
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => navigate('/register')}
            className={`font-mono-custom text-[11px] uppercase tracking-[0.2em] px-5 py-2.5 border transition-all duration-300 ${
              location.pathname === '/register'
                ? 'border-amber-400 bg-amber-400 text-black'
                : 'border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-black'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-px bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#050505] border-t border-white/8 px-6 py-6 flex flex-col gap-5">
          {[
            { label: 'El Problema', id: 'problema' },
            { label: 'Arquitectura', id: 'arquitectura' },
            { label: 'Resiliencia', id: 'resiliencia' },
            { label: 'Demo', id: 'dashboard' },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="font-mono-custom text-[11px] uppercase tracking-[0.2em] text-white/60 hover:text-amber-400 transition-colors text-left"
            >
              {link.label}
            </button>
          ))}
          <div className="h-px bg-white/6" />
          <button
            onClick={() => { navigate('/login'); setMenuOpen(false); }}
            className="font-mono-custom text-[11px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors text-left"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { navigate('/register'); setMenuOpen(false); }}
            className="font-mono-custom text-[11px] uppercase tracking-[0.2em] text-amber-400 hover:text-amber-300 transition-colors text-left"
          >
            Registrarse →
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
