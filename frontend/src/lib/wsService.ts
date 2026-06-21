import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL;

export type WsMessageCallback = (data: unknown) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WsMessageCallback[] = [];

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.ws = new WebSocket(WS_URL);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Trigger global toast if the message is a HIGH urgency result
        if (message?.tipo === 'RESULTADO_TRIAJE' && message?.data?.nivel_urgencia === 'Alta') {
          toast.error('¡Alerta! Nuevo paciente requiere atención inmediata (Urgencia Alta)', {
            style: {
              borderRadius: '4px',
              background: '#0d0b09',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px'
            },
            icon: '🚨',
            duration: 6000
          });
        }

        this.callbacks.forEach(cb => cb(message));
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    this.ws.onclose = () => {
      console.log('WS Disconnected. Reconnecting in 3s...');
      setTimeout(() => this.connect(), 3000);
    };
  }

  onMessage(callback: WsMessageCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.onclose = null; // Prevent auto-reconnect
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
