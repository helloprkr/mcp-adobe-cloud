/**
 * Core type definitions for Adobe Creative Cloud MCP integration
 */

// Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  metadata?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Capability interfaces
export interface AdobeAppCapability {
  name: string;
  version: string;
  apiVersion: string;
  supportsAutomation: boolean;
  supportsExtensions: boolean;
  endpoints?: Record<string, EndpointInfo>;
}

export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  requiresAuth: boolean;
  rateLimit?: {
    maxRequests: number;
    timeWindowMs: number;
  };
}

// Authentication types
export interface AuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  refreshEndpoint?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// API Client interfaces
export interface ApiClientOptions {
  baseUrl: string;
  timeout?: number;
  retryConfig?: RetryConfig;
  headers?: Record<string, string>;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

// Application-specific types
export enum AdobeAppType {
  LIGHTROOM = 'lightroom',
  PHOTOSHOP = 'photoshop',
  PREMIERE_PRO = 'premiere_pro',
  AFTER_EFFECTS = 'after_effects',
  ILLUSTRATOR = 'illustrator',
  AERO = 'aero',
}

// Communication channel types
export interface MessagePayload {
  type: string;
  data: Record<string, any>;
  requestId?: string;
  timestamp: number;
}

export interface CommunicationChannel {
  send(message: MessagePayload): Promise<void>;
  receive(handler: (message: MessagePayload) => Promise<void>): void;
  close(): Promise<void>;
}

// Model context protocol types
export interface ModelContextRequest {
  appType: AdobeAppType;
  operation: string;
  parameters: Record<string, any>;
  context?: Record<string, any>;
  metadata?: {
    source: string;
    timestamp: number;
    requestId: string;
  };
}

export interface ModelContextResponse {
  success: boolean;
  result?: any;
  error?: ApiError;
  metadata?: {
    executionTimeMs: number;
    responseId: string;
  };
}