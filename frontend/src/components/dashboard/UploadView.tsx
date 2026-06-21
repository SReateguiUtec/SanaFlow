import { useState } from 'react';
import { api } from '../../lib/api';

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'DM Serif Display', Georgia, serif" };

const pipelineStages = [
  { label: 'S3 Upload',    desc: 'Archivo enviado al bucket privado' },
  { label: 'EventBridge',  desc: 'Evento disparado automáticamente'  },
  { label: 'SQS Queue',    desc: 'Registros encolados para proceso'  },
  { label: 'Lambda',       desc: 'Worker serverless consumiendo cola'  },
  { label: 'Groq API',     desc: 'Inferencia Llama 3 completada'    },
];

const UploadView = () => {
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [done, setDone]               = useState(false);
  const [fileName, setFileName]       = useState('');
  const [error, setError]             = useState('');
  const [inputMode, setInputMode]     = useState<'file' | 'text'>('file');
  const [manualText, setManualText]   = useState('');

  const submitText = async () => {
    if (!manualText.trim()) return;
    setFileName('Entrada Manual');
    setIsUploading(true);
    setDone(false);
    setPipelineStep(0);
    setError('');

    try {
      let notas: string[] = [];
      try {
        const data = JSON.parse(manualText);
        notas = data.notas || data.notes || [];
      } catch {
        const lines = manualText.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 0 && lines[0].toLowerCase().includes('nota_clinica')) {
          lines.shift();
        }
        notas = lines.map(l => l.replace(/^["']|["']$/g, ''));
      }

      if (!notas.length) {
        throw new Error('No se encontraron notas en el texto');
      }

      setPipelineStep(2);
      await api.upload.sendNotes(notas);

      setIsUploading(false);
      setDone(true);
      setPipelineStep(pipelineStages.length);
      setManualText('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el texto');
      setIsUploading(false);
      setPipelineStep(-1);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setIsUploading(true);
    setDone(false);
    setPipelineStep(0);
    setError('');

    try {
      const text = await file.text();
      let notas: string[] = [];

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        notas = data.notas || data.notes || [];
      } else {
        // Simple CSV parsing
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 0 && lines[0].toLowerCase().includes('nota_clinica')) {
          lines.shift();
        }
        // Remove quotes if present
        notas = lines.map(l => l.replace(/^["']|["']$/g, ''));
      }

      if (!notas.length) {
        throw new Error('No se encontraron notas en el archivo');
      }

      setPipelineStep(2); // SQS Queue step
      await api.upload.sendNotes(notas);

      setIsUploading(false);
      setDone(true);
      setPipelineStep(pipelineStages.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
      setIsUploading(false);
      setPipelineStep(-1);
    }
  };

  const handleClick = () => {
    if (isUploading) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) processFile(file);
    };
    input.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files?.length) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const reset = () => { setDone(false); setFileName(''); setPipelineStep(-1); setError(''); };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <p style={mono} className="text-[9px] uppercase tracking-[0.3em] text-white/22 mb-3">/ Cargar Notas</p>
        <h1 style={serif} className="text-4xl text-white leading-tight">Subir Lote CSV</h1>
        <p className="mt-2 text-sm text-white/35 font-light">
          El archivo se procesa automáticamente a través del pipeline serverless.
        </p>
      </div>

      {/* Input Mode Toggle */}
      {!done && (
        <div className="flex items-center gap-6 border-b border-white/10 pb-4">
          <button 
            onClick={() => setInputMode('file')}
            className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${inputMode === 'file' ? 'text-amber-400' : 'text-white/40 hover:text-white/70'}`}
          >
            Subir Archivo
          </button>
          <button 
            onClick={() => setInputMode('text')}
            className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${inputMode === 'text' ? 'text-amber-400' : 'text-white/40 hover:text-white/70'}`}
          >
            Pegar Texto
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!done ? (
        inputMode === 'file' ? (
          <div
            className={`relative border-2 border-dashed transition-all duration-400 cursor-pointer ${
              isDragging ? 'border-amber-400/60 bg-amber-400/4' : isUploading ? 'border-white/10 cursor-default' : 'border-white/10 hover:border-white/22'
            }`}
            style={{ minHeight: 240 }}
            onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={handleClick}
          >
          {/* Corner accents */}
          {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-5 h-5 pointer-events-none`}>
              <div className={`absolute top-0 left-0 w-full h-px transition-colors ${isDragging ? 'bg-amber-400/50' : 'bg-white/15'}`} />
              <div className={`absolute top-0 left-0 w-px h-full transition-colors ${isDragging ? 'bg-amber-400/50' : 'bg-white/15'}`} />
            </div>
          ))}

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 py-12">
            {isUploading ? (
              <>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-amber-400/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p style={mono} className="text-[11px] uppercase tracking-[0.2em] text-amber-400/70">
                  Procesando {fileName}…
                </p>
              </>
            ) : (
              <>
                <div className={`w-14 h-14 border flex items-center justify-center transition-all duration-300 ${isDragging ? 'border-amber-400/40 bg-amber-400/8' : 'border-white/8'}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
                    className={`transition-colors ${isDragging ? 'text-amber-400/70' : 'text-white/22'}`}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p style={serif} className="text-xl text-white mb-1">Arrastra tu CSV aquí</p>
                  <p style={mono} className="text-[9px] uppercase tracking-[0.2em] text-white/22">
                    o haz click para seleccionar archivo · .csv / .json
                  </p>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-400 max-w-sm text-center bg-red-400/10 px-3 py-1.5 border border-red-400/20">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        ) : (
          <div className="relative flex flex-col gap-4 border border-white/10 bg-[#070606] p-5">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              disabled={isUploading}
              placeholder="Pega aquí tus notas clínicas (una por línea)...&#10;&#10;Ejemplo:&#10;Paciente masculino de 50 años con dolor de cabeza intenso...&#10;Niño de 8 años con fiebre y malestar..."
              className="w-full h-48 bg-transparent text-white/70 text-sm font-light resize-none focus:outline-none placeholder:text-white/20"
            />
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-1.5 border border-red-400/20">
                {error}
              </p>
            )}
            <div className="flex justify-end border-t border-white/5 pt-4">
              <button
                onClick={submitText}
                disabled={isUploading || !manualText.trim()}
                className="px-5 py-2.5 border border-amber-400/30 bg-amber-400/10 text-amber-400 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Procesando...' : 'Procesar Texto'}
              </button>
            </div>
          </div>
        )
      ) : (
        /* Success state */
        <div className="border border-emerald-400/20 bg-emerald-400/4 p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-12 h-12 border border-emerald-400/30 bg-emerald-400/8 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p style={serif} className="text-2xl text-white mb-1">Lote procesado</p>
            <p style={mono} className="text-[10px] uppercase tracking-[0.2em] text-white/30">{fileName} — encolado en SQS exitosamente</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
            </svg>
            <span style={mono} className="text-[10px] uppercase tracking-[0.2em]">Subir otro lote</span>
          </button>
        </div>
      )}

      {/* Pipeline tracker */}
      <div className="border border-white/6 bg-[#070606]">
        <div className="px-6 py-4 border-b border-white/5">
          <p style={mono} className="text-[8px] uppercase tracking-[0.3em] text-white/22">Pipeline de Procesamiento</p>
        </div>
        <div className="px-6 py-5 flex items-stretch gap-0 overflow-x-auto">
          {pipelineStages.map((stage, i) => {
            const isDone    = done || (isUploading && pipelineStep > i);
            const isActive  = isUploading && pipelineStep === i;
            return (
              <div key={stage.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-2 text-center w-28">
                  {/* Step circle */}
                  <div className={`w-8 h-8 border flex items-center justify-center transition-all duration-500 ${
                    isDone   ? 'border-emerald-400/40 bg-emerald-400/8' :
                    isActive ? 'border-amber-400/60 bg-amber-400/8 shadow-[0_0_12px_rgba(251,191,36,0.15)]' :
                               'border-white/8'
                  }`}>
                    {isDone ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : isActive ? (
                      <div className="w-2 h-2 bg-amber-400 animate-pulse" />
                    ) : (
                      <span style={mono} className="text-[9px] text-white/15">{i + 1}</span>
                    )}
                  </div>
                  <p style={mono} className={`text-[9px] uppercase tracking-[0.15em] leading-snug transition-colors ${
                    isDone ? 'text-emerald-400/60' : isActive ? 'text-amber-400' : 'text-white/18'
                  }`}>{stage.label}</p>
                  <p style={mono} className="text-[8px] text-white/14 leading-tight hidden sm:block">
                    {isDone ? stage.desc : isActive ? 'En progreso…' : '—'}
                  </p>
                </div>
                {/* Connector */}
                {i < pipelineStages.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-all duration-700 min-w-[16px] ${
                    isDone ? 'bg-emerald-400/30' : 'bg-white/6'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Format info */}
      <div className="border border-white/6 bg-[#070606] p-6 flex gap-5">
        <div className="w-8 h-8 border border-amber-400/20 bg-amber-400/6 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/70">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div>
          <p style={mono} className="text-[9px] uppercase tracking-[0.2em] text-amber-400/60 mb-2">Formato requerido</p>
          <p className="text-sm text-white/40 leading-relaxed font-light mb-3">
            El CSV debe incluir una columna <code className="text-amber-400/60 text-xs px-1 py-0.5 bg-amber-400/6 border border-amber-400/15">nota_clinica</code>.
            Cada fila representa un registro. El pipeline procesará el lote completo de forma asíncrona.
          </p>
          <div className="border border-white/6 bg-black/30 p-3">
            <p style={mono} className="text-[10px] text-white/30 leading-relaxed">
              nota_clinica<br/>
              <span className="text-white/18">"Paciente masculino, 45 años, dolor torácico..."</span><br/>
              <span className="text-white/18">"Mujer de 28 años, fiebre 38.5°C, tos seca..."</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;
