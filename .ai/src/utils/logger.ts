/**
 * Logging utility for the MCP Adobe Cloud application
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamps: boolean;
  destination: 'console' | 'file' | 'remote' | 'custom';
  customHandler?: (level: LogLevel, message: string, ...args: any[]) => void;
  remoteUrl?: string;
  filePath?: string;
}

/**
 * Logger implementation
 */
class Logger {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    enableTimestamps: true,
    destination: 'console'
  };

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Internal logging implementation
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Skip if level is below configured level
    if (level < this.config.level) {
      return;
    }

    // Format the message
    let formattedMessage = message;

    // Add timestamp if enabled
    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }

    // Add prefix if configured
    if (this.config.prefix) {
      formattedMessage = `[${this.config.prefix}] ${formattedMessage}`;
    }

    // Add log level
    const levelLabels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    formattedMessage = `[${levelLabels[level]}] ${formattedMessage}`;

    // Log to the configured destination
    switch (this.config.destination) {
      case 'console':
        this.logToConsole(level, formattedMessage, ...args);
        break;
      case 'file':
        this.logToFile(level, formattedMessage, ...args);
        break;
      case 'remote':
        this.logToRemote(level, formattedMessage, ...args);
        break;
      case 'custom':
        if (this.config.customHandler) {
          this.config.customHandler(level, formattedMessage, ...args);
        }
        break;
    }
  }

  /**
   * Log to console
   */
  private logToConsole(level: LogLevel, message: string, ...args: any[]): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message, ...args);
        break;
      case LogLevel.INFO:
        console.info(message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(message, ...args);
        break;
    }
  }

  /**
   * Log to file
   */
  private logToFile(level: LogLevel, message: string, ...args: any[]): void {
    // In a browser environment, file logging isn't directly possible
    // In Node.js, we could use fs.appendFile
    // For simplicity, we'll just log to console if file logging isn't available
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const fs = require('fs');
        const logLine = `${message} ${args.map(arg => JSON.stringify(arg)).join(' ')}\n`;
        fs.appendFileSync(this.config.filePath || 'mcp-adobe-cloud.log', logLine);
      } catch (error) {
        console.error('Failed to write to log file:', error);
        this.logToConsole(level, message, ...args);
      }
    } else {
      // Fall back to console in browser environment
      this.logToConsole(level, message, ...args);
    }
  }

  /**
   * Log to remote endpoint
   */
  private logToRemote(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.config.remoteUrl) {
      this.logToConsole(level, message, ...args);
      return;
    }

    // Prepare log data
    const logData = {
      level: LogLevel[level],
      message,
      timestamp: new Date().toISOString(),
      details: args.length > 0 ? args : undefined
    };

    // Send log data to remote endpoint
    try {
      fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      }).catch(error => {
        // Fall back to console if remote logging fails
        console.error('Failed to send log to remote endpoint:', error);
        this.logToConsole(level, message, ...args);
      });
    } catch (error) {
      // Fall back to console if fetch isn't available
      console.error('Failed to send log to remote endpoint:', error);
      this.logToConsole(level, message, ...args);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();