"""Authentication module for Adobe API services.

This module handles OAuth 2.0 authentication with Adobe Identity Management System (IMS).
"""

import time
import webbrowser
import json
import os
from urllib.parse import urlencode
import http.server
import socketserver
import threading
import base64

import httpx

from . import config

class AuthError(Exception):
    """Exception raised for authentication errors."""
    pass

def generate_code_verifier():
    """Generate a code verifier for PKCE."""
    import secrets
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

def generate_code_challenge(verifier):
    """Generate a code challenge from the verifier."""
    import hashlib
    challenge_bytes = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler for OAuth callback."""
    
    code = None
    
    def do_GET(self):
        """Handle GET request to callback URL."""
        from urllib.parse import parse_qs, urlparse
        
        query = parse_qs(urlparse(self.path).query)
        if 'code' in query:
            CallbackHandler.code = query['code'][0]
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"<html><body><h1>Authentication successful!</h1><p>You can close this window now.</p></body></html>")
        else:
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"<html><body><h1>Authentication failed!</h1><p>No authorization code received.</p></body></html>")
    
    def log_message(self, format, *args):
        """Suppress server logs."""
        return

def get_authorization_code():
    """Get authorization code through browser flow."""
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Start callback server
    server = socketserver.TCPServer(("localhost", 8000), CallbackHandler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    # Build authorization URL
    params = {
        "client_id": config.ADOBE_CLIENT_ID,
        "redirect_uri": config.ADOBE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid,AdobeID,creative_sdk,lr_partner_apis",
        "code_challenge_method": "S256",
        "code_challenge": code_challenge,
    }
    auth_url = f"{config.ADOBE_AUTH_URL}?{urlencode(params)}"
    
    # Open browser for user authentication
    print(f"Opening browser for authentication...")
    webbrowser.open(auth_url)
    
    # Wait for callback
    print("Waiting for authentication callback...")
    timeout = 300  # 5 minutes
    start_time = time.time()
    
    while CallbackHandler.code is None:
        if time.time() - start_time > timeout:
            server.shutdown()
            raise AuthError("Authentication timed out after 5 minutes")
        time.sleep(1)
    
    # Shutdown server
    server.shutdown()
    
    return CallbackHandler.code, code_verifier

def get_access_token(auth_code, code_verifier):
    """Exchange authorization code for access token."""
    data = {
        "grant_type": "authorization_code",
        "client_id": config.ADOBE_CLIENT_ID,
        "client_secret": config.ADOBE_CLIENT_SECRET,
        "code": auth_code,
        "redirect_uri": config.ADOBE_REDIRECT_URI,
        "code_verifier": code_verifier,
    }
    
    client = httpx.Client(timeout=config.REQUEST_TIMEOUT)
    response = client.post(config.ADOBE_TOKEN_URL, data=data)
    
    if response.status_code != 200:
        raise AuthError(f"Failed to get access token: {response.text}")
    
    return response.json()

def refresh_access_token(refresh_token):
    """Refresh an expired access token."""
    data = {
        "grant_type": "refresh_token",
        "client_id": config.ADOBE_CLIENT_ID,
        "client_secret": config.ADOBE_CLIENT_SECRET,
        "refresh_token": refresh_token,
    }
    
    client = httpx.Client(timeout=config.REQUEST_TIMEOUT)
    response = client.post(config.ADOBE_TOKEN_URL, data=data)
    
    if response.status_code != 200:
        raise AuthError(f"Failed to refresh access token: {response.text}")
    
    return response.json()

def save_tokens(token_data):
    """Save tokens to a file for later use."""
    tokens_dir = os.path.expanduser("~/.adobe_mcp")
    os.makedirs(tokens_dir, exist_ok=True)
    
    token_file = os.path.join(tokens_dir, "tokens.json")
    token_data["timestamp"] = int(time.time())
    
    with open(token_file, "w") as f:
        json.dump(token_data, f)
    
    print(f"Tokens saved to {token_file}")
    return token_data

def load_tokens():
    """Load tokens from file, refreshing if necessary."""
    token_file = os.path.expanduser("~/.adobe_mcp/tokens.json")
    
    if not os.path.exists(token_file):
        return None
    
    with open(token_file, "r") as f:
        token_data = json.load(f)
    
    # Check if access token is expired (tokens typically last 24 hours)
    expires_in = token_data.get("expires_in", 86400)  # Default 24 hours
    timestamp = token_data.get("timestamp", 0)
    current_time = int(time.time())
    
    if current_time - timestamp > expires_in - 300:  # Refresh 5 minutes before expiry
        try:
            refresh_token = token_data.get("refresh_token")
            if refresh_token:
                new_token_data = refresh_access_token(refresh_token)
                # Make sure we keep the refresh token if it's not in the response
                if "refresh_token" not in new_token_data and "refresh_token" in token_data:
                    new_token_data["refresh_token"] = token_data["refresh_token"]
                return save_tokens(new_token_data)
        except AuthError as e:
            print(f"Error refreshing token: {e}")
            return None
    
    return token_data

def get_authorization_header():
    """Get the authorization header for API requests."""
    token_data = load_tokens()
    
    if not token_data or "access_token" not in token_data:
        return None
    
    return f"Bearer {token_data['access_token']}"

def authenticate():
    """Main authentication function to get Adobe API access."""
    # Check if we already have valid tokens
    tokens = load_tokens()
    if tokens and "access_token" in tokens:
        print("Using existing access token")
        return tokens
    
    # Otherwise, start the authentication flow
    try:
        auth_code, code_verifier = get_authorization_code()
        token_data = get_access_token(auth_code, code_verifier)
        return save_tokens(token_data)
    except AuthError as e:
        print(f"Authentication error: {e}")
        return None

if __name__ == "__main__":
    """Run the authentication flow directly if this module is executed."""
    print("Starting Adobe authentication flow...")
    result = authenticate()
    if result:
        print("Authentication successful!")
        print(f"Access token: {result['access_token'][:10]}...")
    else:
        print("Authentication failed!") 