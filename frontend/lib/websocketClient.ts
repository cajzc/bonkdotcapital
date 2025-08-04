import type { WebSocketMessage } from '../types/backend';

const WS_BASE_URL = 'ws://localhost:8080/api/v1';

type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();
  private handlers: Map<string, WebSocketEventHandler[]> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(room: string): WebSocket | null {
    if (this.connections.has(room)) {
      return this.connections.get(room)!;
    }

    try {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/${room}`);
      
      ws.onopen = () => {
        console.log(`WebSocket connected to room: ${room}`);
        this.connections.set(room, ws);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(room, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected from room: ${room}`);
        this.connections.delete(room);
        this.scheduleReconnect(room);
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for room ${room}:`, error);
      };

      return ws;
    } catch (error) {
      console.error(`Failed to connect to WebSocket for room ${room}:`, error);
      return null;
    }
  }

  subscribe(room: string, handler: WebSocketEventHandler): () => void {
    // Ensure connection exists
    if (!this.connections.has(room)) {
      this.connect(room);
    }

    // Add handler
    if (!this.handlers.has(room)) {
      this.handlers.set(room, []);
    }
    this.handlers.get(room)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(room);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        // If no more handlers, close connection
        if (handlers.length === 0) {
          this.disconnect(room);
        }
      }
    };
  }

  private handleMessage(room: string, message: WebSocketMessage) {
    const handlers = this.handlers.get(room);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  private scheduleReconnect(room: string) {
    if (this.reconnectTimeouts.has(room)) {
      return; // Already scheduled
    }
    
    const timeout = setTimeout(() => {
      this.reconnectTimeouts.delete(room);
      
      // Only reconnect if there are still handlers for this room
      if (this.handlers.has(room) && this.handlers.get(room)!.length > 0) {
        console.log(`Attempting to reconnect to room: ${room}`);
        this.connect(room);
      }
    }, this.reconnectDelay);
    
    this.reconnectTimeouts.set(room, timeout);
  }

  disconnect(room: string) {
    const ws = this.connections.get(room);
    if (ws) {
      ws.close();
      this.connections.delete(room);
    }
    
    this.handlers.delete(room);
    
    const timeout = this.reconnectTimeouts.get(room);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(room);
    }
  }

  disconnectAll() {
    for (const room of this.connections.keys()) {
      this.disconnect(room);
    }
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;