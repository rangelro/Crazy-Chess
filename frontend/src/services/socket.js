let ws = null;
import { authService } from './auth';
let connectPromise = null;
let reconnectAttempts = 0;
let lastUrl = null;
const listeners = new Set();
const MAX_RECONNECT_ATTEMPTS = 5;

function obterUrlWebSocketPadrao() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
  }

  return 'ws://localhost:3000';
}

function normalizarMensagem(raw) {
  const acao = raw?.acao || raw?.action || null;
  return {
    ...raw,
    acao,
    action: acao,
  };
}

function notificarListeners(message) {
  listeners.forEach((listener) => {
    try {
      listener(message);
    } catch (error) {
      console.error('Erro em listener de mensagem:', error);
    }
  });
}

export const socketService = {
  connect: (url = null) => {
    const targetUrl = url || lastUrl || obterUrlWebSocketPadrao();
    lastUrl = targetUrl;

    if (ws && ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(ws);
    }

    if (connectPromise) {
      return connectPromise;
    }

    connectPromise = new Promise((resolve, reject) => {
      try {
        ws = new WebSocket(targetUrl);

        ws.onopen = () => {
          console.log('WebSocket conectado');
          reconnectAttempts = 0;
          connectPromise = null;
          const token = authService.token();
          if (token) ws.send(JSON.stringify({ acao: 'AUTENTICAR', token }));
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error('WebSocket erro:', error);
          connectPromise = null;
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const message = normalizarMensagem(JSON.parse(event.data));
            notificarListeners(message);
          } catch (error) {
            console.error('Falha ao processar mensagem WS:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket desconectado');
          connectPromise = null;
          socketService.handleDisconnect();
        };
      } catch (error) {
        connectPromise = null;
        reject(error);
      }
    });

    return connectPromise;
  },

  waitUntilOpen: async (timeout = 8000) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return ws;
    }

    const connect = socketService.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tempo de conexão excedido.')), timeout);
    });

    return Promise.race([connect, timeoutPromise]);
  },

  request: async (acao, data = {}, matcher = () => true, timeout = 8000) => {
    await socketService.waitUntilOpen(timeout);

    return new Promise((resolve, reject) => {
      const unsubscribe = socketService.onMessage((message) => {
        if (!matcher(message)) {
          return;
        }

        clearTimeout(timer);
        unsubscribe();
        resolve(message);
      });

      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error('Tempo de resposta excedido.'));
      }, timeout);

      socketService.send(acao, data);
    });
  },

  send: (acao, data = {}) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ acao, ...data }));
    } else {
      console.warn('WebSocket não está aberto');
    }
  },

  onMessage: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  disconnect: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    connectPromise = null;
  },

  handleDisconnect: () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.pow(2, reconnectAttempts) * 1000;
      console.log(`Reconectando em ${delay}ms...`);
      setTimeout(() => {
        socketService.connect(lastUrl || obterUrlWebSocketPadrao()).catch(() => {
          // Tentará novamente no próximo ciclo de reconexão.
        });
      }, delay);
    }
  },

  isConnected: () => {
    return ws && ws.readyState === WebSocket.OPEN;
  },

  getSocket: () => ws,
};
