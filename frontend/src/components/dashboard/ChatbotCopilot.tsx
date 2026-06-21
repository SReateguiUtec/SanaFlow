import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export default function ChatbotCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: 'assistant', content: 'Hola Doctor, soy el Copiloto de SanaFlow. ¿En qué le puedo asistir con los casos de triaje de hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Eres el Copiloto de SanaFlow, un asistente médico inteligente diseñado para ayudar a doctores y enfermeras a priorizar y entender diagnósticos médicos en base a notas clínicas. Eres profesional, conciso y preciso.' },
            ...messages,
            userMsg
          ]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Sin respuesta');
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error de conexión con el modelo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-400 text-black flex items-center justify-center transition-transform hover:scale-110 shadow-xl ${open ? 'scale-0' : 'scale-100'}`}
        style={{ zIndex: 50 }}
      >
        <MessageSquare size={24} />
      </button>

      {/* Ventana de chat */}
      <div
        className={`fixed bottom-6 right-6 w-[350px] h-[500px] bg-[#0a0a0a] border border-white/10 flex flex-col transition-all duration-300 shadow-2xl ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        style={{ zIndex: 50 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400" />
            <span style={mono} className="text-white text-xs uppercase tracking-widest">SanaFlow Copilot</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'bg-amber-400 text-black' : 'bg-white/5 text-white/90 border border-white/10'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-4 py-3 bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400/50 animate-ping" />
                <div className="w-1.5 h-1.5 bg-amber-400/50 animate-ping" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-amber-400/50 animate-ping" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10 flex gap-2 bg-[#050505]">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre triage..."
            className="flex-1 bg-transparent border border-white/10 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-amber-400/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 flex items-center justify-center bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
