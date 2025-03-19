"""Model Context Protocol server for Adobe Creative Cloud applications."""

import os
import sys
import json
import argparse
import logging
from typing import Dict, Any, List, Optional

try:
    from mcp import Server, Capability, Request, Response
except ImportError:
    print("MCP SDK not found. Please install it using: pip install mcp")
    sys.exit(1)

from . import config
from . import auth
from .connections.lightroom import LightroomConnection, LightroomError
from .connections.premiere import PremiereConnection, PremiereError
from .connections.after_effects import AfterEffectsConnection, AfterEffectsError
from .connections.aero import AeroConnection, AeroError

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("adobe-mcp")

class AdobeMCPServer:
    """MCP Server for Adobe Creative Cloud applications."""
    
    def __init__(self, host: str = None, port: int = None):
        """Initialize the MCP server for Adobe applications."""
        self.host = host or config.MCP_HOST
        self.port = port or config.MCP_PORT
        self.server = Server(host=self.host, port=self.port)
        
        # Initialize connections to Adobe applications
        self.lightroom = LightroomConnection()
        self.premiere = PremiereConnection()
        self.after_effects = AfterEffectsConnection()
        self.aero = AeroConnection()
        
        # Register capabilities
        self._register_capabilities()
        
        logger.info(f"MCP server initialized on {self.host}:{self.port}")
    
    def _register_capabilities(self):
        """Register all capabilities with the MCP server."""
        # Authentication capabilities
        self.server.capability(
            "adobe_authenticate",
            self.adobe_authenticate,
            description="Authenticate with Adobe Creative Cloud"
        )
        
        # Lightroom capabilities
        self.server.capability(
            "lightroom_list_catalogs",
            self.lightroom_list_catalogs,
            description="List available Lightroom catalogs"
        )
        self.server.capability(
            "lightroom_get_assets",
            self.lightroom_get_assets,
            description="Get assets from a Lightroom catalog"
        )
        self.server.capability(
            "lightroom_get_asset",
            self.lightroom_get_asset,
            description="Get metadata for a specific Lightroom asset"
        )
        self.server.capability(
            "lightroom_apply_preset",
            self.lightroom_apply_preset,
            description="Apply a preset to a Lightroom asset"
        )
        
        # Premiere Pro capabilities (theoretical)
        self.server.capability(
            "premiere_open_project",
            self.premiere_open_project,
            description="Open a Premiere Pro project"
        )
        self.server.capability(
            "premiere_get_project_info",
            self.premiere_get_project_info,
            description="Get information about the current Premiere Pro project"
        )
        self.server.capability(
            "premiere_export_sequence",
            self.premiere_export_sequence,
            description="Export a sequence from the current Premiere Pro project"
        )
        
        # After Effects capabilities (theoretical)
        self.server.capability(
            "after_effects_open_project",
            self.after_effects_open_project,
            description="Open an After Effects project"
        )
        self.server.capability(
            "after_effects_get_project_info",
            self.after_effects_get_project_info,
            description="Get information about the current After Effects project"
        )
        self.server.capability(
            "after_effects_render_composition",
            self.after_effects_render_composition,
            description="Render a composition from the current After Effects project"
        )
        self.server.capability(
            "after_effects_create_text_layer",
            self.after_effects_create_text_layer,
            description="Create a text layer in an After Effects composition"
        )
        
        # Adobe Aero capabilities (exploratory)
        self.server.capability(
            "aero_list_projects",
            self.aero_list_projects,
            description="List Adobe Aero projects (exploratory)"
        )
        self.server.capability(
            "aero_get_project",
            self.aero_get_project,
            description="Get details of a specific Adobe Aero project (exploratory)"
        )
        self.server.capability(
            "aero_get_creative_cloud_assets",
            self.aero_get_creative_cloud_assets,
            description="Get Creative Cloud assets that could be used in Aero (exploratory)"
        )
    
    # Authentication capability
    async def adobe_authenticate(self, request: Request) -> Response:
        """Authenticate with Adobe Creative Cloud."""
        try:
            token_data = auth.authenticate()
            if token_data and "access_token" in token_data:
                return {"success": True, "message": "Successfully authenticated with Adobe"}
            else:
                return {"success": False, "message": "Authentication failed"}
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return {"success": False, "message": f"Authentication error: {str(e)}"}
    
    # Lightroom capabilities
    async def lightroom_list_catalogs(self, request: Request) -> Response:
        """List available Lightroom catalogs."""
        try:
            catalogs = self.lightroom.get_catalogs()
            return {"success": True, "catalogs": catalogs}
        except LightroomError as e:
            logger.error(f"Lightroom error: {e}")
            return {"success": False, "message": f"Lightroom error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def lightroom_get_assets(self, request: Request) -> Response:
        """Get assets from a Lightroom catalog."""
        try:
            catalog_id = request.get("catalog_id")
            limit = request.get("limit", 20)
            offset = request.get("offset", 0)
            
            if not catalog_id:
                return {"success": False, "message": "Missing catalog_id parameter"}
            
            assets = self.lightroom.get_assets(catalog_id, limit, offset)
            return {"success": True, "assets": assets}
        except LightroomError as e:
            logger.error(f"Lightroom error: {e}")
            return {"success": False, "message": f"Lightroom error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def lightroom_get_asset(self, request: Request) -> Response:
        """Get metadata for a specific Lightroom asset."""
        try:
            catalog_id = request.get("catalog_id")
            asset_id = request.get("asset_id")
            
            if not catalog_id or not asset_id:
                return {"success": False, "message": "Missing catalog_id or asset_id parameter"}
            
            asset = self.lightroom.get_asset(catalog_id, asset_id)
            return {"success": True, "asset": asset}
        except LightroomError as e:
            logger.error(f"Lightroom error: {e}")
            return {"success": False, "message": f"Lightroom error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def lightroom_apply_preset(self, request: Request) -> Response:
        """Apply a preset to a Lightroom asset."""
        try:
            catalog_id = request.get("catalog_id")
            asset_id = request.get("asset_id")
            preset_id = request.get("preset_id")
            
            if not catalog_id or not asset_id or not preset_id:
                return {"success": False, "message": "Missing catalog_id, asset_id, or preset_id parameter"}
            
            result = self.lightroom.apply_preset(catalog_id, asset_id, preset_id)
            return {"success": True, "result": result}
        except LightroomError as e:
            logger.error(f"Lightroom error: {e}")
            return {"success": False, "message": f"Lightroom error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    # Premiere Pro capabilities (theoretical)
    async def premiere_open_project(self, request: Request) -> Response:
        """Open a Premiere Pro project."""
        try:
            project_path = request.get("project_path")
            
            if not project_path:
                return {"success": False, "message": "Missing project_path parameter"}
            
            result = self.premiere.open_project(project_path)
            return {"success": True, "result": result}
        except PremiereError as e:
            logger.error(f"Premiere Pro error: {e}")
            return {"success": False, "message": f"Premiere Pro error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def premiere_get_project_info(self, request: Request) -> Response:
        """Get information about the current Premiere Pro project."""
        try:
            result = self.premiere.get_project_info()
            return {"success": True, "project_info": result}
        except PremiereError as e:
            logger.error(f"Premiere Pro error: {e}")
            return {"success": False, "message": f"Premiere Pro error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def premiere_export_sequence(self, request: Request) -> Response:
        """Export a sequence from the current Premiere Pro project."""
        try:
            sequence_name = request.get("sequence_name")
            output_path = request.get("output_path")
            preset = request.get("preset")
            
            if not sequence_name or not output_path:
                return {"success": False, "message": "Missing sequence_name or output_path parameter"}
            
            result = self.premiere.export_sequence(sequence_name, output_path, preset)
            return {"success": True, "result": result}
        except PremiereError as e:
            logger.error(f"Premiere Pro error: {e}")
            return {"success": False, "message": f"Premiere Pro error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    # After Effects capabilities (theoretical)
    async def after_effects_open_project(self, request: Request) -> Response:
        """Open an After Effects project."""
        try:
            project_path = request.get("project_path")
            
            if not project_path:
                return {"success": False, "message": "Missing project_path parameter"}
            
            result = self.after_effects.open_project(project_path)
            return {"success": True, "result": result}
        except AfterEffectsError as e:
            logger.error(f"After Effects error: {e}")
            return {"success": False, "message": f"After Effects error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def after_effects_get_project_info(self, request: Request) -> Response:
        """Get information about the current After Effects project."""
        try:
            result = self.after_effects.get_project_info()
            return {"success": True, "project_info": result}
        except AfterEffectsError as e:
            logger.error(f"After Effects error: {e}")
            return {"success": False, "message": f"After Effects error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def after_effects_render_composition(self, request: Request) -> Response:
        """Render a composition from the current After Effects project."""
        try:
            comp_name = request.get("comp_name")
            output_path = request.get("output_path")
            render_settings = request.get("render_settings")
            output_module = request.get("output_module")
            
            if not comp_name or not output_path:
                return {"success": False, "message": "Missing comp_name or output_path parameter"}
            
            result = self.after_effects.render_composition(
                comp_name, output_path, render_settings, output_module
            )
            return {"success": True, "result": result}
        except AfterEffectsError as e:
            logger.error(f"After Effects error: {e}")
            return {"success": False, "message": f"After Effects error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def after_effects_create_text_layer(self, request: Request) -> Response:
        """Create a text layer in an After Effects composition."""
        try:
            comp_name = request.get("comp_name")
            text_content = request.get("text_content")
            position = request.get("position")
            duration = request.get("duration")
            
            if not comp_name or not text_content:
                return {"success": False, "message": "Missing comp_name or text_content parameter"}
            
            result = self.after_effects.create_text_layer(
                comp_name, text_content, position, duration
            )
            return {"success": True, "result": result}
        except AfterEffectsError as e:
            logger.error(f"After Effects error: {e}")
            return {"success": False, "message": f"After Effects error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    # Adobe Aero capabilities (exploratory)
    async def aero_list_projects(self, request: Request) -> Response:
        """List Adobe Aero projects (exploratory)."""
        try:
            result = self.aero.list_projects()
            return {"success": True, "result": result}
        except AeroError as e:
            logger.error(f"Adobe Aero error: {e}")
            return {"success": False, "message": f"Adobe Aero error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def aero_get_project(self, request: Request) -> Response:
        """Get details of a specific Adobe Aero project (exploratory)."""
        try:
            project_id = request.get("project_id")
            
            if not project_id:
                return {"success": False, "message": "Missing project_id parameter"}
            
            result = self.aero.get_project(project_id)
            return {"success": True, "result": result}
        except AeroError as e:
            logger.error(f"Adobe Aero error: {e}")
            return {"success": False, "message": f"Adobe Aero error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    async def aero_get_creative_cloud_assets(self, request: Request) -> Response:
        """Get Creative Cloud assets that could be used in Aero (exploratory)."""
        try:
            result = self.aero.get_creative_cloud_assets()
            return {"success": True, "result": result}
        except AeroError as e:
            logger.error(f"Adobe Aero error: {e}")
            return {"success": False, "message": f"Adobe Aero error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    def run(self):
        """Run the MCP server."""
        logger.info("Starting Adobe MCP Server...")
        self.server.run()

def main():
    """Main entry point for the MCP server."""
    parser = argparse.ArgumentParser(description="Adobe MCP Server")
    parser.add_argument("--host", help="Host to bind the server to", default=config.MCP_HOST)
    parser.add_argument("--port", help="Port to bind the server to", type=int, default=config.MCP_PORT)
    parser.add_argument("--debug", help="Enable debug logging", action="store_true")
    
    args = parser.parse_args()
    
    if args.debug:
        logger.setLevel(logging.DEBUG)
    
    server = AdobeMCPServer(host=args.host, port=args.port)
    server.run()

if __name__ == "__main__":
    main() 