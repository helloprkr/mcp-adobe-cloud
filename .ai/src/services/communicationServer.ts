/**
 * Server implementation for bidirectional communication between LLMs and Adobe applications
 */
import { MessagePayload, CommunicationChannel } from '../core/types';
import { logger } from '../utils/logger';

// Message handlers
type MessageHandler = (message: MessagePayload) => Promise<void>;

/**
 * WebSocket communication channel
 */
export class WebSocketChannel implements CommunicationChannel {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private messageQueue: MessagePayload[] = [];
  private isConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // Start with 1 second
  
  constructor(url: string) {
    this.url = url;
  }
  
  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info(`Connected to WebSocket server at ${this.url}`);
          
          // Send any queued messages
          this.flushQueue();
          
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as MessagePayload;
            this.notifyHandlers(message);
          } catch (error) {
            logger.error('Error parsing WebSocket message', error);
          }
        };
        
        this.ws.onclose = () => {
          this.isConnected = false;
          logger.warn(`WebSocket connection closed`);
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          logger.error('WebSocket error', error);
          if (!this.isConnected) {
            reject(error);
          }
        };
        
      } catch (error) {
        logger.error('Error connecting to WebSocket server', error);
        reject(error);
      }
    });
  }
  
  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    ) * (0.8 + Math.random() * 0.4); // Add 20% jitter
    
    logger.info(`Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        logger.error('Reconnect attempt failed', error);
      });
    }, delay);
  }
  
  /**
   * Send a message
   */
  async send(message: MessagePayload): Promise<void> {
    if (!this.isConnected) {
      // Queue message for later sending
      this.messageQueue.push(message);
      logger.debug(`Queued message (${message.type}) for later sending`);
      
      // Try to connect if not already connecting
      if (this.reconnectAttempts === 0 && !this.reconnectTimeout) {
        this.connect().catch(error => {
          logger.error('Failed to connect when sending message', error);
        });
      }
      
      return;
    }
    
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        logger.debug(`Sent message: ${message.type}`);
      } else {
        // Socket isn't ready, queue the message
        this.messageQueue.push(message);
        logger.debug(`Queued message (${message.type}) - socket not ready`);
      }
    } catch (error) {
      logger.error('Error sending WebSocket message', error);
      throw error;
    }
  }
  
  /**
   * Register a message handler
   */
  receive(handler: MessageHandler): void {
    this.handlers.add(handler);
  }
  
  /**
   * Remove a message handler
   */
  removeHandler(handler: MessageHandler): void {
    this.handlers.delete(handler);
  }
  
  /**
   * Notify all handlers of a message
   */
  private async notifyHandlers(message: MessagePayload): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(message);
      } catch (error) {
        logger.error('Error in message handler', error);
      }
    }
  }
  
  /**
   * Send all queued messages
   */
  private flushQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }
    
    logger.info(`Sending ${this.messageQueue.length} queued messages`);
    
    // Take a copy of the queue and clear it
    const queueCopy = [...this.messageQueue];
    this.messageQueue = [];
    
    // Send all messages
    for (const message of queueCopy) {
      this.send(message).catch(error => {
        logger.error('Error sending queued message', error);
      });
    }
  }
  
  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
    
    this.handlers.clear();
    logger.info('WebSocket connection closed');
  }
}

/**
 * HTTP polling communication channel
 * For environments where WebSockets aren't available
 */
export class HttpPollingChannel implements CommunicationChannel {
  private baseUrl: string;
  private pollInterval: number;
  private clientId: string;
  private handlers: Set<MessageHandler> = new Set();
  private isPolling: boolean = false;
  private pollTimeout: NodeJS.Timeout | null = null;
  private lastMessageId: string | null = null;
  
  constructor(baseUrl: string, options: { clientId?: string; pollInterval?: number } = {}) {
    this.baseUrl = baseUrl;
    this.clientId = options.clientId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.pollInterval = options.pollInterval || 2000; // 2 seconds by default
  }
  
  /**
   * Start polling for messages
   */
  startPolling(): void {
    if (this.isPolling) {
      return;
    }
    
    this.isPolling = true;
    this.poll();
    logger.info(`Started polling at ${this.baseUrl} with interval ${this.pollInterval}ms`);
  }
  
  /**
   * Poll for new messages
   */
  private poll(): void {
    if (!this.isPolling) {
      return;
    }
    
    const url = new URL(`${this.baseUrl}/messages`);
    url.searchParams.append('clientId', this.clientId);
    
    if (this.lastMessageId) {
      url.searchParams.append('since', this.lastMessageId);
    }
    
    fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.messages && Array.isArray(data.messages)) {
          for (const message of data.messages) {
            this.notifyHandlers(message);
            
            // Update last message ID
            if (message.requestId) {
              this.lastMessageId = message.requestId;
            }
          }
        }
      })
      .catch(error => {
        logger.error('Error polling for messages', error);
      })
      .finally(() => {
        // Schedule next poll
        this.pollTimeout = setTimeout(() => this.poll(), this.pollInterval);
      });
  }
  
  /**
   * Send a message
   */
  async send(message: MessagePayload): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.clientId
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      logger.debug(`Sent message: ${message.type}`);
    } catch (error) {
      logger.error('Error sending message', error);
      throw error;
    }
  }
  
  /**
   * Register a message handler
   */
  receive(handler: MessageHandler): void {
    this.handlers.add(handler);
    
    // Start polling if this is the first handler
    if (this.handlers.size === 1 && !this.isPolling) {
      this.startPolling();
    }
  }
  
  /**
   * Notify all handlers of a message
   */
  private async notifyHandlers(message: MessagePayload): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(message);
      } catch (error) {
        logger.error('Error in message handler', error);
      }
    }
  }
  
  /**
   * Close the connection
   */
  async close(): Promise<void> {
    this.isPolling = false;
    
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    
    this.handlers.clear();
    logger.info('HTTP polling stopped');
  }
}

/**
 * Memory-based communication channel for local testing
 */
export class InMemoryChannel implements CommunicationChannel {
  private handlers: Set<MessageHandler> = new Set();
  private otherChannel: InMemoryChannel | null = null;
  
  /**
   * Connect to another channel for two-way communication
   */
  connectTo(otherChannel: InMemoryChannel): void {
    this.otherChannel = otherChannel;
  }
  
  /**
   * Send a message
   */
  async send(message: MessagePayload): Promise<void> {
    if (!this.otherChannel) {
      logger.warn('No connected channel to send message to');
      return;
    }
    
    // Forward message to the other channel
    await this.otherChannel.receiveMessage(message);
  }
  
  /**
   * Receive message from another channel
   */
  async receiveMessage(message: MessagePayload): Promise<void> {
    await this.notifyHandlers(message);
  }
  
  /**
   * Register a message handler
   */
  receive(handler: MessageHandler): void {
    this.handlers.add(handler);
  }
  
  /**
   * Notify all handlers of a message
   */
  private async notifyHandlers(message: MessagePayload): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(message);
      } catch (error) {
        logger.error('Error in message handler', error);
      }
    }
  }
  
  /**
   * Close the connection
   */
  async close(): Promise<void> {
    this.otherChannel = null;
    this.handlers.clear();
  }
}