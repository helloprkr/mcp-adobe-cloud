/**
 * Adobe API client with retry functionality and type safety
 */
import { ApiClientOptions, RetryConfig, ApiResponse, ApiError } from './types';
import { logger } from '../utils/logger';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 5000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryConfig: RetryConfig;
  private headers: Record<string, string>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout || 30000;
    this.retryConfig = options.retryConfig || DEFAULT_RETRY_CONFIG;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
  }

  /**
   * Set authorization header
   */
  setAuthorizationHeader(token: string, tokenType: string = 'Bearer'): void {
    this.headers['Authorization'] = `${tokenType} ${token}`;
  }

  /**
   * Execute HTTP request with retries
   */
  async request<T>(
    method: string,
    path: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    let attempt = 0;
    let lastError: Error | undefined;
    let lastResponse: Response | undefined;

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${normalizedPath}`;
    
    const requestHeaders = {
      ...this.headers,
      ...customHeaders,
    };

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        // Prepare request options
        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
          // Only include body for non-GET requests with data
          ...(method !== 'GET' && data ? { body: JSON.stringify(data) } : {}),
        };

        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        requestOptions.signal = controller.signal;

        // Execute request
        const response = await fetch(url, requestOptions);
        lastResponse = response;
        clearTimeout(timeoutId);

        // Handle successful response
        if (response.ok) {
          // Handle empty responses
          if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return { data: {} as T };
          }
          
          // Parse JSON response
          const responseData = await response.json();
          return { data: responseData as T };
        }

        // Check if we should retry based on status code
        if (this.retryConfig.retryableStatusCodes.includes(response.status) && 
            attempt < this.retryConfig.maxRetries) {
          attempt++;
          
          // Calculate backoff delay with exponential increase and jitter
          const delay = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelayMs
          ) * (0.8 + Math.random() * 0.4); // Add 20% jitter
          
          logger.warn(
            `Request to ${url} failed with status ${response.status}. Retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Non-retryable error, parse error response
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        // Return typed error response
        return {
          error: {
            code: `http_${response.status}`,
            message: errorData.message || response.statusText,
            details: errorData,
          },
        };

      } catch (error) {
        lastError = error as Error;
        
        // Handle network errors, aborts, and timeouts
        const isTimeout = error instanceof DOMException && error.name === 'AbortError';
        const isNetworkError = error instanceof TypeError && error.message.includes('network');
        
        if ((isTimeout || isNetworkError) && attempt < this.retryConfig.maxRetries) {
          attempt++;
          
          // Calculate backoff delay
          const delay = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelayMs
          );
          
          logger.warn(
            `Network error or timeout when calling ${url}. Retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Non-retryable error
        return {
          error: {
            code: isTimeout ? 'request_timeout' : 'network_error',
            message: error.message,
            details: { originalError: error },
          },
        };
      }
    }

    // If we exhaust all retries
    if (lastResponse) {
      // Return the last response error
      let errorData: any;
      try {
        errorData = await lastResponse.json();
      } catch {
        errorData = { message: lastResponse.statusText };
      }
      
      return {
        error: {
          code: `http_${lastResponse.status}`,
          message: `Request failed after ${this.retryConfig.maxRetries} retries: ${errorData.message || lastResponse.statusText}`,
          details: errorData,
        },
      };
    }

    // Return the last caught error
    return {
      error: {
        code: 'max_retries_exceeded',
        message: `Request failed after ${this.retryConfig.maxRetries} retries: ${lastError?.message || 'Unknown error'}`,
        details: { originalError: lastError },
      },
    };
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T>(path: string, queryParams?: Record<string, string>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const queryString = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';
    return this.request<T>('GET', `${path}${queryString}`, undefined, headers);
  }

  async post<T>(path: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, headers);
  }

  async put<T>(path: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, headers);
  }

  async patch<T>(path: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, headers);
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, headers);
  }
}