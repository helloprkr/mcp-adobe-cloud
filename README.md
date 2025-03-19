# Model Context Protocol for Adobe Creative Cloud

A framework for integrating Model Context Protocol (MCP) with Adobe software applications, including Lightroom, Premiere Pro, After Effects, and Aero.

## Overview

This project provides an MCP server implementation that enables AI assistants to interact with Adobe Creative Cloud applications. The primary goal is to connect large language models (LLMs) with Adobe's creative tools, allowing for automation, content generation, and enhanced workflows.

## Integration Status

| Application | Status | Integration Method |
|-------------|--------|-------------------|
| Lightroom | ✅ Functional | RESTful API |
| Premiere Pro | 🔄 Theoretical | JavaScript/ExtendScript |
| After Effects | 🔄 Theoretical | JavaScript/ExtendScript |
| Adobe Aero | 🔍 Exploratory | Limited API options |

## Features

- **Lightroom Integration**: Utilize Lightroom's public RESTful API for asset management and editing
  - List assets in catalogs
  - Retrieve metadata
  - Apply presets
  - Perform basic editing operations

- **Premiere Pro & After Effects**: Theoretical integration via ExtendScript/JavaScript
  - Execute scripts within the applications
  - Monitor execution status
  - Perform basic editing and rendering operations

- **Authentication**: OAuth 2.0 implementation for Adobe services with secure token management

## Getting Started

### Prerequisites

- Python 3.8+
- Adobe Creative Cloud subscription
- Adobe Developer account with API access
- MCP SDK

### Installation

```bash
# Clone the repository
git clone https://github.com/helloprkr/mcp-adobe-cloud.git
cd mcp-adobe-cloud

# Install dependencies
pip install -e .
```

### Configuration

1. Create a `.env` file in the project root with your Adobe API credentials:

```
ADOBE_CLIENT_ID=your_client_id
ADOBE_CLIENT_SECRET=your_client_secret
ADOBE_REDIRECT_URI=http://localhost:8000/callback
```

2. Run the authentication flow to get your access token:

```bash
python -m adobe_mcp.auth
```

### Running the MCP Server

```bash
python -m adobe_mcp.server
```

## Development Roadmap

- Enhance Lightroom integration with additional API endpoints
- Explore ExtendScript automation for Premiere Pro and After Effects
- Investigate potential integration options for Adobe Aero as APIs become available
- Implement comprehensive error handling and logging
- Expand test coverage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
