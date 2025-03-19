/**
 * Secure storage implementation for sensitive data
 */

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory storage (for development only)
 */
export class InMemoryStorage implements SecureStorage {
  private storage: Map<string, string> = new Map();
  
  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }
  
  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    this.storage.clear();
  }
}

/**
 * Browser secure storage implementation
 */
export class BrowserSecureStorage implements SecureStorage {
  // Storage prefix to avoid collisions
  private prefix: string;
  
  constructor(prefix: string = 'adobe_mcp_') {
    this.prefix = prefix;
  }
  
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      console.error('Error reading from secure storage', error);
      return null;
    }
  }
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.error('Error writing to secure storage', error);
      throw error;
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Error removing from secure storage', error);
      throw error;
    }
  }
  
  async clear(): Promise<void> {
    try {
      // Only clear items with our prefix
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing secure storage', error);
      throw error;
    }
  }
}

/**
 * Node.js secure storage implementation
 * Uses keytar for system keychain access
 */
export class NodeSecureStorage implements SecureStorage {
  // We'll need to dynamically import keytar in Node.js environment
  private keytar: any;
  private serviceName: string;
  private accountPrefix: string;
  
  constructor(serviceName: string = 'adobe_mcp', accountPrefix: string = 'mcp_') {
    this.serviceName = serviceName;
    this.accountPrefix = accountPrefix;
  }
  
  // Lazy load the keytar module
  private async getKeytar(): Promise<any> {
    if (!this.keytar) {
      try {
        this.keytar = await import('keytar');
      } catch (error) {
        throw new Error('Failed to load keytar module. Make sure it is installed: npm install keytar');
      }
    }
    return this.keytar;
  }
  
  async getItem(key: string): Promise<string | null> {
    try {
      const keytar = await this.getKeytar();
      return await keytar.getPassword(this.serviceName, this.accountPrefix + key);
    } catch (error) {
      console.error('Error reading from secure storage', error);
      return null;
    }
  }
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      const keytar = await this.getKeytar();
      await keytar.setPassword(this.serviceName, this.accountPrefix + key, value);
    } catch (error) {
      console.error('Error writing to secure storage', error);
      throw error;
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      const keytar = await this.getKeytar();
      await keytar.deletePassword(this.serviceName, this.accountPrefix + key);
    } catch (error) {
      console.error('Error removing from secure storage', error);
      throw error;
    }
  }
  
  async clear(): Promise<void> {
    try {
      const keytar = await this.getKeytar();
      const credentials = await keytar.findCredentials(this.serviceName);
      
      // Delete all credentials with our prefix
      for (const cred of credentials) {
        if (cred.account.startsWith(this.accountPrefix)) {
          await keytar.deletePassword(this.serviceName, cred.account);
        }
      }
    } catch (error) {
      console.error('Error clearing secure storage', error);
      throw error;
    }
  }
}