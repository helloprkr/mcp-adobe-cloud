/**
 * Cryptographic utility functions for PKCE and secure operations
 */

/**
 * Generate a random string of the specified length
 */
export function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  // Use Crypto API if available, otherwise fall back to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }
  
  // Fallback to Math.random (less secure)
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return result;
}

/**
 * Calculate SHA-256 hash of a string (returns Uint8Array)
 */
export async function sha256Hash(message: string): Promise<Uint8Array> {
  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Hash the data
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert ArrayBuffer to Uint8Array
    return new Uint8Array(hashBuffer);
  }
  
  // For Node.js environments
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Use Node.js crypto module
    try {
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(message);
      
      return new Uint8Array(hash.digest());
    } catch (error) {
      throw new Error('Failed to load Node.js crypto module: ' + error);
    }
  }
  
  throw new Error('No suitable crypto implementation available');
}

/**
 * Base64URL encode a Uint8Array
 */
export function base64UrlEncode(data: Uint8Array): string {
  // Convert Uint8Array to string
  const base64String = btoa(
    Array.from(data)
      .map(byte => String.fromCharCode(byte))
      .join('')
  );
  
  // Make base64 string URL-safe
  return base64String
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode to Uint8Array
 */
export function base64UrlDecode(input: string): Uint8Array {
  // Restore to standard base64
  const base64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Pad with = if needed
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  
  // Decode base64 to binary string
  const binaryString = atob(padded);
  
  // Convert to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}