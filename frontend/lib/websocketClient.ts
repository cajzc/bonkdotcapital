// WebSocket client for real-time updates from the BonkDotCapital backend

import { Platform } from 'react-native';
import type { WebSocketMessage } from '../types/backend';

// Use different WebSocket URLs based on environment and platform
const getWsBaseUrl = () => {
  if (!__DEV__) {
    // Production WebSocket URL - Update this with your actual AWS deployment URL
    return 'wss://your-aws-domain.com/api/v1/ws';
    // Examples:
    // return 'wss://api.bonkdotcapital.com/api/v1/ws';
    // return 'ws://your-ec2-public-ip:8080/api/v1/ws';
    // return 'wss://your-alb-dns-name.us-east-1.elb.amazonaws.com/api/v1/ws';
  }
  
  if (Platform.OS === 'android') {
    // For physical Android devices, use your computer's network IP
    // For Android emulator, use 10.0.2.2
    return 'ws://192.168.1.111:8080/api/v1/ws';
  } else {
    // For iOS simulator, web, or other platforms
    return 'ws://localhost:8080/api/v1/ws';
  }
};

const WS_BASE_URL = getWsBaseUrl();

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimeouts: Map<string, any> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(room: string): void {
    if (this.connections.has(room)) {
      return; // Already connected to this room
    }

    try {
      const ws = new WebSocket(`${WS_BASE_URL}/${room}`);
      
      ws.onopen = () => {
        console.log(`WebSocket connected to room: ${room}`);
        this.connections.set(room, ws);
        
        // Clear any existing reconnect timeout
        const timeout = this.reconnectTimeouts.get(room);
        if (timeout) {
          clearTimeout(timeout);
          this.reconnectTimeouts.delete(room);
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(room, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected from room: ${room}`, event.code, event.reason);
        this.connections.delete(room);
        
        // Attempt to reconnect after a delay
        if (!event.wasClean) {
          this.scheduleReconnect(room, 0);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for room ${room}:`, error);
      };

    } catch (error) {
      console.error(`Failed to connect to WebSocket room ${room}:`, error);
    }
  }

  private scheduleReconnect(room: string, attemptCount: number): void {
    if (attemptCount >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for room: ${room}`);
      return;
    }

    const timeout = setTimeout(() => {
      console.log(`Attempting to reconnect to room: ${room} (attempt ${attemptCount + 1})`);
      this.connect(room);
    }, this.reconnectDelay * Math.pow(1.5, attemptCount));

    this.reconnectTimeouts.set(room, timeout);
  }

  disconnect(room: string): void {
    const ws = this.connections.get(room);
    if (ws) {
      ws.close(1000, 'Client disconnect');
      this.connections.delete(room);
    }

    // Clear any pending reconnect timeout
    const timeout = this.reconnectTimeouts.get(room);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(room);
    }

    // Clear subscribers for this room
    this.subscribers.delete(room);
  }

  subscribe(room: string, handler: MessageHandler): () => void {
    // Ensure we're connected to the room
    this.connect(room);

    // Add the handler to subscribers
    if (!this.subscribers.has(room)) {
      this.subscribers.set(room, new Set());
    }
    this.subscribers.get(room)!.add(handler);

    // Return unsubscribe function
    return () => {
      const roomSubscribers = this.subscribers.get(room);
      if (roomSubscribers) {
        roomSubscribers.delete(handler);
        
        // If no more subscribers for this room, disconnect
        if (roomSubscribers.size === 0) {
          this.disconnect(room);
        }
      }
    };
  }

  private handleMessage(room: string, message: WebSocketMessage): void {
    const roomSubscribers = this.subscribers.get(room);
    if (roomSubscribers) {
      roomSubscribers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  // Send a message to a specific room
  send(room: string, message: any): void {
    const ws = this.connections.get(room);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message to room ${room}: not connected`);
    }
  }

  // Disconnect from all rooms
  disconnectAll(): void {
    for (const room of this.connections.keys()) {
      this.disconnect(room);
    }
  }

  // Check if connected to a room
  isConnected(room: string): boolean {
    const ws = this.connections.get(room);
    return ws !== undefined && ws.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();