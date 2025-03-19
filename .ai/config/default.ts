/**
 * Default configuration for MCP Adobe Cloud integration
 */

export default {
  // Auth configuration
  auth: {
    // Base Adobe OAuth endpoints
    authorizationEndpoint: 'https://ims-na1.adobelogin.com/ims/authorize/v2',
    tokenEndpoint: 'https://ims-na1.adobelogin.com/ims/token/v3',
    
    // Application specifics - these should be loaded from environment variables
    clientId: process.env.ADOBE_CLIENT_ID || '',
    redirectUri: process.env.ADOBE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    
    // Required OAuth scopes for different Adobe applications
    scopes: {
      lightroom: [
        'openid',
        'AdobeID',
        'creative_sdk',
        'offline_access',
        'lr_partner_apis'
      ],
      photoshop: [
        'openid',
        'AdobeID',
        'creative_sdk',
        'offline_access'
      ],
      premiere: [
        'openid',
        'AdobeID',
        'creative_sdk',
        'offline_access'
      ]
    }
  },
  
  // API endpoints
  api: {
    lightroom: {
      baseUrl: 'https://lr.adobe.io',
      version: 'v2'
    },
    photoshop: {
      baseUrl: 'https://image.adobe.io',
      version: 'v3'
    }
  },
  
  // Communication configuration
  communication: {
    // WebSocket server for real-time communication
    ws: {
      url: process.env.WS_SERVER_URL || 'ws://localhost:8080',
      reconnectAttempts: 10,
      reconnectDelay: 1000
    },
    
    // HTTP polling fallback
    http: {
      baseUrl: process.env.HTTP_SERVER_URL || 'http://localhost:8080',
      pollInterval: 2000
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableTimestamps: true,
    destination: 'console',
    filePath: './logs/mcp-adobe-cloud.log'
  },
  
  // ExtendScript configuration
  extendScript: {
    // Timeout for ExtendScript operations (in ms)
    timeout: 30000
  },
  
  // Development flags
  development: {
    // Use mock adapters for testing without actual Adobe applications
    useMocks: process.env.USE_MOCKS === 'true' || false,
    
    // Enable verbose debugging
    debug: process.env.DEBUG === 'true' || false
  }
};