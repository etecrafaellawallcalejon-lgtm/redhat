type EventHandler = (data: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimeout: any = null;
  private isConnecting: boolean = false;

  public connect(token: string) {
    this.token = token;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        console.log('[RedChat WS] Conectado ao servidor');
        this.emit('connected', {});
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event) {
            this.emit(payload.event, payload.data);
          }
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        console.log('[RedChat WS] Conexão encerrada, tentando reconectar em 3s...');
        this.emit('disconnected', {});
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        this.isConnecting = false;
        console.error('[RedChat WS] Erro na conexão:', error);
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, 3000);
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.token = null;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public send(action: string, data: any = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, data }));
    }
  }

  public on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: EventHandler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)!) {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in WS event handler for ${event}`, e);
        }
      }
    }
  }
}

export const wsClient = new WebSocketClient();
