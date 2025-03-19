"""Lightroom connection module for Adobe MCP.

This module handles API connections to Adobe Lightroom.
"""

import httpx
from .. import config
from .. import auth

class LightroomError(Exception):
    """Exception raised for Lightroom API errors."""
    pass

class LightroomConnection:
    """Connection handler for Adobe Lightroom API."""
    
    def __init__(self):
        """Initialize Lightroom connection."""
        self.base_url = f"{config.LIGHTROOM_BASE_URL}/{config.LIGHTROOM_API_VERSION}"
        self.client = httpx.Client(timeout=config.REQUEST_TIMEOUT)
    
    def get_headers(self):
        """Get request headers with authorization."""
        auth_header = auth.get_authorization_header()
        if not auth_header:
            raise LightroomError("Not authenticated. Run authentication flow first.")
        
        return {
            "Authorization": auth_header,
            "X-API-Key": config.ADOBE_CLIENT_ID,
            "Content-Type": "application/json"
        }
    
    def get_catalogs(self):
        """Get available catalogs."""
        headers = self.get_headers()
        response = self.client.get(f"{self.base_url}/catalog", headers=headers)
        
        if response.status_code != 200:
            raise LightroomError(f"Failed to get catalogs: {response.text}")
        
        return response.json()
    
    def get_catalog(self, catalog_id):
        """Get specific catalog details."""
        headers = self.get_headers()
        response = self.client.get(f"{self.base_url}/catalog/{catalog_id}", headers=headers)
        
        if response.status_code != 200:
            raise LightroomError(f"Failed to get catalog {catalog_id}: {response.text}")
        
        return response.json()
    
    def get_assets(self, catalog_id, limit=20, offset=0):
        """Get assets from a catalog."""
        headers = self.get_headers()
        params = {"limit": limit, "offset": offset}
        
        response = self.client.get(
            f"{self.base_url}/catalogs/{catalog_id}/assets",
            headers=headers,
            params=params
        )
        
        if response.status_code != 200:
            raise LightroomError(f"Failed to get assets: {response.text}")
        
        return response.json()
    
    def get_asset(self, catalog_id, asset_id):
        """Get metadata for a specific asset."""
        headers = self.get_headers()
        response = self.client.get(
            f"{self.base_url}/catalogs/{catalog_id}/assets/{asset_id}",
            headers=headers
        )
        
        if response.status_code != 200:
            raise LightroomError(f"Failed to get asset {asset_id}: {response.text}")
        
        return response.json()
    
    def apply_preset(self, catalog_id, asset_id, preset_id):
        """Apply a preset to an asset."""
        headers = self.get_headers()
        data = {"presetId": preset_id}
        
        # Note: This is a theoretical endpoint, adjust according to actual API
        response = self.client.post(
            f"{self.base_url}/catalogs/{catalog_id}/assets/{asset_id}/presets",
            headers=headers,
            json=data
        )
        
        if response.status_code not in (200, 201):
            raise LightroomError(f"Failed to apply preset: {response.text}")
        
        return response.json()
    
    def create_edit(self, catalog_id, asset_id, edits):
        """Create or update edits for an asset."""
        headers = self.get_headers()
        
        # Note: This is a theoretical endpoint, adjust according to actual API
        response = self.client.post(
            f"{self.base_url}/catalogs/{catalog_id}/assets/{asset_id}/edits",
            headers=headers,
            json=edits
        )
        
        if response.status_code not in (200, 201):
            raise LightroomError(f"Failed to create edit: {response.text}")
        
        return response.json()
    
    def get_rendition(self, catalog_id, asset_id, rendition_type="2048"):
        """Get a rendition of an asset."""
        headers = self.get_headers()
        
        response = self.client.get(
            f"{self.base_url}/catalogs/{catalog_id}/assets/{asset_id}/renditions/{rendition_type}",
            headers=headers
        )
        
        if response.status_code != 200:
            raise LightroomError(f"Failed to get rendition: {response.text}")
        
        return response.content 