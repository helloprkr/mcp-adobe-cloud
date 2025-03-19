/**
 * OAuth 2.0 implementation with PKCE for Adobe APIs
 */
import { AuthConfig, TokenResponse, ApiError } from '../core/types';
import { SecureStorage } from '../utils/secureStorage';
import { generateRandomString, sha256Hash, base64UrlEncode } from '../utils/crypto';

const STORAGE_KEY_PREFIX = 'adobe_mcp_auth';

export class OAuth2PKCE {
  private config: AuthConfig;
  private storage: SecureStorage;
  private codeVerifier: string | null = null;
  
  constructor(config: AuthConfig, storage: SecureStorage) {
    this.config = config;
    this.storage = storage;
  }

  /**
   * Initiate OAuth 2.0 authorization flow with PKCE
   */
  async authorize(): Promise<string> {
    // Generate code verifier and challenge
    this.codeVerifier = generateRandomString(128);
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
    
    // Store code verifier for token exchange
    await this.storage.setItem(`${STORAGE_KEY_PREFIX}_verifier`, this.codeVerifier);
    
    // Construct authorization URL
    const authUrl = new URL(this.config.authorizationEndpoint);
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', this.config.scope.join(' '));
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('state', generateRandomString(32));
    
    return authUrl.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // Retrieve code verifier
    const storedVerifier = await this.storage.getItem(`${STORAGE_KEY_PREFIX}_verifier`);
    const codeVerifier = this.codeVerifier || storedVerifier;
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found. Authorization flow may have been interrupted.');
    }
    
    // Prepare token request
    const tokenRequestBody = new URLSearchParams();
    tokenRequestBody.append('grant_type', 'authorization_code');
    tokenRequestBody.append('client_id', this.config.clientId);
    tokenRequestBody.append('redirect_uri', this.config.redirectUri);
    tokenRequestBody.append('code', code);
    tokenRequestBody.append('code_verifier', codeVerifier);
    
    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequestBody.toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw {
          code: 'token_exchange_failed',
          message: 'Failed to exchange authorization code for tokens',
          details: errorData,
        } as ApiError;
      }
      
      const tokenData = await response.json() as TokenResponse;
      
      // Store tokens securely
      await this.storeTokens(tokenData);
      
      // Clear code verifier
      await this.storage.removeItem(`${STORAGE_KEY_PREFIX}_verifier`);
      this.codeVerifier = null;
      
      return tokenData;
      
    } catch (error) {
      if ((error as ApiError).code) {
        throw error;
      }
      throw {
        code: 'network_error',
        message: 'Network error during token exchange',
        details: { originalError: error },
      } as ApiError;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = await this.storage.getItem(`${STORAGE_KEY_PREFIX}_refresh_token`);
    
    if (!refreshToken) {
      throw {
        code: 'no_refresh_token',
        message: 'No refresh token available',
      } as ApiError;
    }
    
    const refreshEndpoint = this.config.refreshEndpoint || this.config.tokenEndpoint;
    
    const refreshRequestBody = new URLSearchParams();
    refreshRequestBody.append('grant_type', 'refresh_token');
    refreshRequestBody.append('client_id', this.config.clientId);
    refreshRequestBody.append('refresh_token', refreshToken);
    
    try {
      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: refreshRequestBody.toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw {
          code: 'token_refresh_failed',
          message: 'Failed to refresh access token',
          details: errorData,
        } as ApiError;
      }
      
      const tokenData = await response.json() as TokenResponse;
      
      // Store new tokens
      await this.storeTokens(tokenData);
      
      return tokenData;
      
    } catch (error) {
      if ((error as ApiError).code) {
        throw error;
      }
      throw {
        code: 'network_error',
        message: 'Network error during token refresh',
        details: { originalError: error },
      } as ApiError;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string> {
    const accessToken = await this.storage.getItem(`${STORAGE_KEY_PREFIX}_access_token`);
    const expiresAt = await this.storage.getItem(`${STORAGE_KEY_PREFIX}_expires_at`);
    
    if (!accessToken) {
      throw {
        code: 'no_access_token',
        message: 'No access token available',
      } as ApiError;
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAtMs = expiresAt ? parseInt(expiresAt, 10) : 0;
    const isExpired = Date.now() > expiresAtMs - 5 * 60 * 1000;
    
    if (isExpired) {
      const newTokens = await this.refreshToken();
      return newTokens.access_token;
    }
    
    return accessToken;
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(tokenData: TokenResponse): Promise<void> {
    await this.storage.setItem(`${STORAGE_KEY_PREFIX}_access_token`, tokenData.access_token);
    
    if (tokenData.refresh_token) {
      await this.storage.setItem(`${STORAGE_KEY_PREFIX}_refresh_token`, tokenData.refresh_token);
    }
    
    // Calculate and store expiration time
    const expiresAtMs = Date.now() + tokenData.expires_in * 1000;
    await this.storage.setItem(`${STORAGE_KEY_PREFIX}_expires_at`, expiresAtMs.toString());
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = await sha256Hash(verifier);
    return base64UrlEncode(hash);
  }

  /**
   * Clear all authentication data
   */
  async logout(): Promise<void> {
    await this.storage.removeItem(`${STORAGE_KEY_PREFIX}_access_token`);
    await this.storage.removeItem(`${STORAGE_KEY_PREFIX}_refresh_token`);
    await this.storage.removeItem(`${STORAGE_KEY_PREFIX}_expires_at`);
    await this.storage.removeItem(`${STORAGE_KEY_PREFIX}_verifier`);
  }
}