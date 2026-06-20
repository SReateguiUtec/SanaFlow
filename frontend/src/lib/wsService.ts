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
