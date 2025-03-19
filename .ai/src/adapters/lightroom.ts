/**
 * Lightroom API adapter
 */
import { ApiClient } from '../core/apiClient';
import { ApiResponse, AdobeAppType } from '../core/types';
import { logger } from '../utils/logger';

// Lightroom API endpoints
const API_BASE_URL = 'https://lr.adobe.io';
const API_VERSION = 'v2';

// Lightroom specific types
export interface LightroomAsset {
  id: string;
  importSource: {
    fileName: string;
    importedOnDevice: string;
    importedBy: string;
    importTimestamp: number;
  };
  payload: {
    captureDate: string;
    dimensions: {
      width: number;
      height: number;
    };
    fileSize: number;
    fileFormat: string;
    colorLabels?: string[];
    rating?: number;
    title?: string;
    caption?: string;
    keywords?: string[];
  };
  links: {
    self: string;
    thumbnail2x?: string;
  };
}

export interface LightroomCollection {
  id: string;
  type: 'collection' | 'collection_set';
  subtype?: string;
  name: string;
  parent?: string;
  created: number;
  updated: number;
  payloadCount?: number;
}

export interface LightroomPreset {
  id: string;
  name: string;
  type: string;
  subtype: string;
  value: Record<string, any>;
  created: number;
  updated: number;
}

export class LightroomAdapter {
  private client: ApiClient;
  private accountId: string | null = null;
  private catalogId: string | null = null;

  constructor(accessToken: string) {
    this.client = new ApiClient({
      baseUrl: API_BASE_URL,
      headers: {
        'X-API-Key': process.env.ADOBE_API_KEY || '',
      },
    });
    
    this.client.setAuthorizationHeader(accessToken);
  }

  /**
   * Set account and catalog IDs for API calls
   */
  initializeSession(accountId: string, catalogId: string): void {
    this.accountId = accountId;
    this.catalogId = catalogId;
    logger.info(`Initialized Lightroom session for account ${accountId}, catalog ${catalogId}`);
  }

  /**
   * Get user account information
   */
  async getUserAccount(): Promise<ApiResponse<any>> {
    return this.client.get(`/api/${API_VERSION}/account`);
  }

  /**
   * Get all catalogs for the current user
   */
  async getCatalogs(): Promise<ApiResponse<{ resources: any[] }>> {
    if (!this.accountId) {
      return {
        error: {
          code: 'missing_account_id',
          message: 'Account ID must be set before calling this endpoint',
        }
      };
    }
    
    return this.client.get(`/api/${API_VERSION}/accounts/${this.accountId}/catalogs`);
  }

  /**
   * Get assets from a catalog
   */
  async getAssets(
    params: { 
      limit?: number; 
      subtype?: string; 
      orderBy?: string; 
      name?: string;
      capture?: string;
    } = {}
  ): Promise<ApiResponse<{ resources: LightroomAsset[] }>> {
    if (!this.accountId || !this.catalogId) {
      return {
        error: {
          code: 'missing_ids',
          message: 'Account ID and Catalog ID must be set before calling this endpoint',
        }
      };
    }
    
    const queryParams: Record<string, string> = {};
    
    // Add optional parameters
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.subtype) queryParams.subtype = params.subtype;
    if (params.orderBy) queryParams.order_by = params.orderBy;
    if (params.name) queryParams.name = params.name;
    if (params.capture) queryParams.capture = params.capture;
    
    return this.client.get(
      `/api/${API_VERSION}/catalogs/${this.catalogId}/assets`,
      queryParams
    );
  }

  /**
   * Get a specific asset
   */
  async getAsset(assetId: string): Promise<ApiResponse<LightroomAsset>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }
    
    return this.client.get(`/api/${API_VERSION}/catalogs/${this.catalogId}/assets/${assetId}`);
  }

  /**
   * Get collections from a catalog
   */
  async getCollections(): Promise<ApiResponse<{ resources: LightroomCollection[] }>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }
    
    return this.client.get(`/api/${API_VERSION}/catalogs/${this.catalogId}/collections`);
  }

  /**
   * Get assets in a collection
   */
  async getCollectionAssets(
    collectionId: string,
    params: { limit?: number; offset?: number } = {}
  ): Promise<ApiResponse<{ resources: LightroomAsset[] }>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }
    
    const queryParams: Record<string, string> = {};
    
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.offset) queryParams.offset = params.offset.toString();
    
    return this.client.get(
      `/api/${API_VERSION}/catalogs/${this.catalogId}/collections/${collectionId}/assets`,
      queryParams
    );
  }

  /**
   * Update asset metadata
   */
  async updateAssetMetadata(
    assetId: string, 
    metadata: { 
      title?: string; 
      caption?: string; 
      rating?: number; 
      colorLabels?: string[];
      keywords?: string[];
    }
  ): Promise<ApiResponse<void>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }

    return this.client.put(
      `/api/${API_VERSION}/catalogs/${this.catalogId}/assets/${assetId}`,
      { payload: metadata }
    );
  }

  /**
   * Create a new collection
   */
  async createCollection(
    name: string,
    parentId?: string
  ): Promise<ApiResponse<LightroomCollection>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }

    const payload: any = {
      subtype: 'collection',
      name,
    };

    if (parentId) {
      payload.parent = parentId;
    }

    return this.client.post(
      `/api/${API_VERSION}/catalogs/${this.catalogId}/collections`,
      payload
    );
  }

  /**
   * Add assets to a collection
   */
  async addAssetsToCollection(
    collectionId: string,
    assetIds: string[]
  ): Promise<ApiResponse<void>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }

    return this.client.put(
      `/api/${API_VERSION}/catalogs/${this.catalogId}/collections/${collectionId}/assets`,
      { resources: assetIds.map(id => ({ id })) }
    );
  }

  /**
   * Get presets
   */
  async getPresets(): Promise<ApiResponse<{ resources: LightroomPreset[] }>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }

    return this.client.get(`/api/${API_VERSION}/catalogs/${this.catalogId}/presets`);
  }

  /**
   * Apply a preset to an asset
   */
  async applyPresetToAsset(
    assetId: string,
    presetId: string
  ): Promise<ApiResponse<void>> {
    if (!this.catalogId) {
      return {
        error: {
          code: 'missing_catalog_id',
          message: 'Catalog ID must be set before calling this endpoint',
        }
      };
    }

    return this.client.post(
      `/api/${API_VERSION}/catalogs/${this.catalogId}/assets/${assetId}/presets/${presetId}`
    );
  }

  /**
   * Get app type
   */
  getAppType(): AdobeAppType {
    return AdobeAppType.LIGHTROOM;
  }
}