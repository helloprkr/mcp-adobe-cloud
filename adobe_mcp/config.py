"""Configuration settings for Adobe MCP."""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Adobe API credentials
ADOBE_CLIENT_ID = os.getenv("ADOBE_CLIENT_ID")
ADOBE_CLIENT_SECRET = os.getenv("ADOBE_CLIENT_SECRET")
ADOBE_REDIRECT_URI = os.getenv("ADOBE_REDIRECT_URI", "http://localhost:8000/callback")

# Lightroom API settings
LIGHTROOM_BASE_URL = "https://lightroom.adobe.io"
LIGHTROOM_API_VERSION = "v2"

# Adobe IMS Authentication endpoints
ADOBE_IMS_URL = "https://ims-na1.adobelogin.com"
ADOBE_AUTH_URL = f"{ADOBE_IMS_URL}/ims/authorize/v2"
ADOBE_TOKEN_URL = f"{ADOBE_IMS_URL}/ims/token/v3"

# MCP Server settings
MCP_HOST = os.getenv("MCP_HOST", "localhost")
MCP_PORT = int(os.getenv("MCP_PORT", "8080"))

# Default timeout for API requests (in seconds)
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30")) 