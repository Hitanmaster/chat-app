import { WebSocketMessage } from "@shared/schema";

type MessageHandler = (data: any) => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10; // Increased from 5
  private reconnectTimeout: number = 1000;
  private userId: number | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private messageQueue: Array<{type: string, payload: any}> = [];
  private pingInterval: number | null = null;
  private authConfirmed: boolean = false;

  constructor() {
    console.log('SocketClient initialized');
    
    // Handle page visibility changes to reconnect when the tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.userId && !this.connected && !this.connecting) {
        console.log('Page became visible, reconnecting WebSocket...');
        this.connect(this.userId);
      }
    });
  }
  
  connect(userId: number) {
    if (this.connected) {
      console.log('WebSocket already connected, not connecting again');
      return;
    }
    
    if (this.connecting) {
      console.log('WebSocket connection already in progress, not connecting again');
      return;
    }
    
    this.connecting = true;
    this.userId = userId;
    this.authConfirmed = false;
    
    console.log(`Connecting WebSocket for user ${userId}...`);
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log(`WebSocket URL: ${wsUrl}`);
      
      this.socket = new WebSocket(wsUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout, closing socket...');
          this.socket.close();
        }
      }, 10000); // 10 second timeout
      
      this.socket.onopen = () => {
        console.log('WebSocket connection opened');
        clearTimeout(connectionTimeout);
        this.reconnectAttempts = 0;
        this.connected = true;
        this.connecting = false;
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
        
        // Authenticate with the server
        this.send('auth', { userId });
        
        // Set a timeout for authentication confirmation
        setTimeout(() => {
          if (!this.authConfirmed) {
            console.log('Authentication confirmation timeout, reconnecting...');
            this.reconnect();
          }
        }, 5000); // 5 second timeout for auth confirmation
      };
      
      this.socket.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed. Clean: ${event.wasClean}, Code: ${event.code}`);
        clearTimeout(connectionTimeout);
        this.stopPingInterval();
        this.connected = false;
        this.connecting = false;
        this.authConfirmed = false;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          // Try to reconnect
          this.reconnect();
        } else {
          console.log(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connecting = false;
        // Don't set connected to false here, let onclose handle that
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connecting = false;
      
      // Try to reconnect
      this.reconnect();
    }
  }
  
  private startPingInterval() {
    // Clear any existing interval
    this.stopPingInterval();
    
    // Start a new ping interval
    this.pingInterval = window.setInterval(() => {
      this.sendPing();
    }, 30000); // Every 30 seconds
  }
  
  private stopPingInterval() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private sendPing() {
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
      console.log('Sending ping...');
      this.send('ping', { timestamp: new Date().toISOString() });
    }
  }
  
  private reconnect() {
    this.reconnectAttempts++;
    const timeout = Math.min(30000, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1)); // Exponential backoff with max 30s
    console.log(`Attempting to reconnect in ${timeout}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.userId && !this.connected && !this.connecting) {
        this.connect(this.userId);
      }
    }, timeout);
  }
  
  disconnect() {
    console.log('Disconnecting WebSocket...');
    this.stopPingInterval();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.connecting = false;
      this.userId = null;
      this.authConfirmed = false;
      // Clear message queue
      this.messageQueue = [];
    }
  }
  
  send(type: string, payload: any) {
    console.log(`Sending WebSocket message: ${type}`, payload);
    
    // If we're not connected, queue up the message
    if (!this.connected) {
      console.log(`WebSocket not connected, queueing message: ${type}`);
      this.messageQueue.push({type, payload});
      
      // Attempt to reconnect if we have a userId
      if (this.userId && !this.connecting && this.socket?.readyState !== WebSocket.CONNECTING) {
        this.connect(this.userId);
      }
      return;
    }
    
    // Send the message if connected
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        const message: WebSocketMessage = { type, payload };
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending WebSocket message:`, error);
        this.messageQueue.push({type, payload});
        // Connection might be broken, try to reconnect
        this.reconnect();
      }
    } else {
      console.error(`Cannot send message, WebSocket state: ${this.socket?.readyState}`);
      this.messageQueue.push({type, payload});
      // Socket state is not open, try to reconnect
      if (this.userId && !this.connecting) {
        this.reconnect();
      }
    }
  }
  
  private processQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`);
      
      // Take a copy of the queue and clear the original
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      
      // Process each message with a small delay between them
      queue.forEach(({type, payload}, index) => {
        setTimeout(() => {
          this.send(type, payload);
        }, index * 100); // 100ms delay between messages
      });
    }
  }
  
  on(type: string, handler: MessageHandler) {
    console.log(`Registering handler for message type: ${type}`);
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      console.log(`Unregistering handler for message type: ${type}`);
      const handlersForType = this.handlers.get(type);
      if (handlersForType) {
        handlersForType.delete(handler);
      }
    };
  }
  
  private handleMessage(message: WebSocketMessage) {
    const { type, payload } = message;
    console.log(`Handling WebSocket message: ${type}`, payload);
    
    // Special handling for certain message types
    switch (type) {
      case 'connection_established':
        console.log('Connection established with server');
        // If we have a userId and haven't sent auth yet, do it now
        if (this.userId && !this.authConfirmed) {
          this.send('auth', { userId: this.userId });
        }
        break;
        
      case 'auth_confirmed':
        console.log('Authentication confirmed by server');
        this.authConfirmed = true;
        // Process any queued messages now that we're authenticated
        this.processQueue();
        break;
        
      case 'auth_error':
        console.error('Authentication error:', payload.error);
        // Don't attempt to reconnect on auth errors - it will likely keep failing
        this.connected = false;
        this.connecting = false;
        break;
        
      case 'pong':
        console.log('Received pong from server');
        break;
        
      case 'error':
        console.error('Received error from server:', payload.error);
        break;
    }
    
    // Dispatch to registered handlers
    const handlersForType = this.handlers.get(type);
    
    if (handlersForType && handlersForType.size > 0) {
      console.log(`Found ${handlersForType.size} handlers for message type: ${type}`);
      handlersForType.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in handler for ${type}:`, error);
        }
      });
    } else {
      console.log(`No handlers registered for message type: ${type}`);
    }
  }
  
  isConnected(): boolean {
    return this.connected && this.authConfirmed;
  }
}

// Create singleton instance
export const socketClient = new SocketClient();
