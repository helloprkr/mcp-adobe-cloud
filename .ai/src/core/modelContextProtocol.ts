/**
 * Model Context Protocol (MCP) implementation for Adobe Creative Cloud
 */
import { EventEmitter } from 'events';
import { 
  AdobeAppType, 
  ModelContextRequest, 
  ModelContextResponse, 
  CommunicationChannel,
  ApiError
} from './types';
import { logger } from '../utils/logger';

// Request handler type
type RequestHandler = (
  request: ModelContextRequest, 
  context: Record<string, any>
) => Promise<ModelContextResponse>;

/**
 * Main MCP implementation for Adobe Creative Cloud
 */
export class ModelContextProtocol extends EventEmitter {
  private adapters: Map<AdobeAppType, any> = new Map();
  private handlers: Map<string, RequestHandler> = new Map();
  private communicationChannel: CommunicationChannel;
  private contextData: Record<string, any> = {};
  
  constructor(communicationChannel: CommunicationChannel) {
    super();
    this.communicationChannel = communicationChannel;
    
    // Set up communication channel listener
    this.communicationChannel.receive(this.handleIncomingMessage.bind(this));
  }
  
  /**
   * Register an application adapter
   */
  registerAdapter(appType: AdobeAppType, adapter: any): void {
    this.adapters.set(appType, adapter);
    logger.info(`Registered adapter for ${appType}`);
  }
  
  /**
   * Register an operation handler
   */
  registerHandler(
    appType: AdobeAppType, 
    operation: string, 
    handler: RequestHandler
  ): void {
    const key = `${appType}:${operation}`;
    this.handlers.set(key, handler);
    logger.info(`Registered handler for ${key}`);
  }
  
  /**
   * Set context data
   */
  setContext(key: string, value: any): void {
    this.contextData[key] = value;
  }
  
  /**
   * Get context data
   */
  getContext(key: string): any {
    return this.contextData[key];
  }
  
  /**
   * Get all context data
   */
  getAllContext(): Record<string, any> {
    return { ...this.contextData };
  }
  
  /**
   * Get adapter for application type
   */
  getAdapter(appType: AdobeAppType): any {
    const adapter = this.adapters.get(appType);
    if (!adapter) {
      throw new Error(`No adapter registered for ${appType}`);
    }
    return adapter;
  }
  
  /**
   * Execute an operation
   */
  async execute(request: ModelContextRequest): Promise<ModelContextResponse> {
    const startTime = Date.now();
    const { appType, operation, parameters, context = {}, metadata = {} } = request;
    
    // Combine context data
    const mergedContext = {
      ...this.contextData,
      ...context
    };
    
    // Create response metadata
    const responseMetadata = {
      executionTimeMs: 0,
      responseId: `res_${metadata.requestId || Date.now().toString(36)}`,
    };
    
    try {
      // Validate request
      if (!appType) {
        throw {
          code: 'missing_app_type',
          message: 'Application type is required'
        } as ApiError;
      }
      
      if (!operation) {
        throw {
          code: 'missing_operation',
          message: 'Operation is required'
        } as ApiError;
      }
      
      // Check if handler exists
      const handlerKey = `${appType}:${operation}`;
      const handler = this.handlers.get(handlerKey);
      
      if (!handler) {
        throw {
          code: 'operation_not_supported',
          message: `Operation ${operation} is not supported for ${appType}`
        } as ApiError;
      }
      
      // Execute handler
      const result = await handler(request, mergedContext);
      
      // Calculate execution time
      responseMetadata.executionTimeMs = Date.now() - startTime;
      
      // Return successful response
      return {
        success: true,
        result: result.result,
        metadata: {
          ...responseMetadata,
          ...(result.metadata || {})
        }
      };
      
    } catch (error) {
      // Calculate execution time
      responseMetadata.executionTimeMs = Date.now() - startTime;
      
      // Log error
      logger.error(`Error executing ${appType}:${operation}`, error);
      
      // Format error response
      const apiError: ApiError = (error as ApiError).code 
        ? (error as ApiError) 
        : {
            code: 'execution_error',
            message: (error as Error).message || 'Unknown error',
            details: { originalError: error }
          };
      
      // Return error response
      return {
        success: false,
        error: apiError,
        metadata: responseMetadata
      };
    }
  }
  
  /**
   * Handle incoming message from communication channel
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    // Validate message
    if (!message.type || !message.data) {
      logger.warn('Received invalid message', message);
      return;
    }
    
    // Handle different message types
    switch (message.type) {
      case 'request':
        await this.handleRequest(message.data, message.requestId);
        break;
        
      case 'context_update':
        this.handleContextUpdate(message.data);
        break;
        
      default:
        logger.warn(`Unknown message type: ${message.type}`, message);
    }
  }
  
  /**
   * Handle request message
   */
  private async handleRequest(
    request: ModelContextRequest, 
    requestId: string
  ): Promise<void> {
    // Ensure request has metadata
    if (!request.metadata) {
      request.metadata = {
        source: 'external',
        timestamp: Date.now(),
        requestId
      };
    }
    
    // Execute request
    const response = await this.execute(request);
    
    // Send response
    await this.communicationChannel.send({
      type: 'response',
      data: response,
      requestId,
      timestamp: Date.now()
    });
    
    // Emit event
    this.emit('request_processed', { request, response });
  }
  
  /**
   * Handle context update message
   */
  private handleContextUpdate(contextData: Record<string, any>): void {
    // Update context data
    Object.entries(contextData).forEach(([key, value]) => {
      this.setContext(key, value);
    });
    
    // Emit event
    this.emit('context_updated', contextData);
  }
  
  /**
   * Close the protocol
   */
  async close(): Promise<void> {
    await this.communicationChannel.close();
    this.removeAllListeners();
  }
}