# RemoteCode Architecture Blueprint

## Overview

RemoteCode is a comprehensive remote development system enabling iPhone to Mac Mini coding workflows. It features a multi-layered architecture that separates concerns across specialized manager classes to maintain modularity and extensibility.

## Core Architecture Components

1. **RemoteCodeMacApp**
   - Main entry point for macOS application
   - Coordinates environment, connection, and LLM managers
   - Provides UI interface and command menu integration

2. **DevEnvironmentManager**
   - Handles setup and configuration of development tools
   - Manages SSH server configuration
   - Provides tooling installation (git, neovim, tmux, node, etc.)
   - Tracks project workspaces and configurations

3. **SecurityManager**
   - Implements secure device pairing with key generation
   - Manages authentication tokens and validation
   - Enforces encryption for all communications
   - Provides secure storage for credentials

4. **LLM Integration**
   - **LLMManager**: Coordinates between local and API-based LLMs
   - **LocalLLMManager**: Handles on-device models for privacy
   - **APILLMManager**: Integrates with cloud-based LLM services
   - Supports code completion, explanation, and refactoring

5. **ContainerManager**
   - Manages Docker environments for development
   - Provides templates for common development setups
   - Handles container lifecycle (creation, starting, stopping)
   - Monitors resource usage and performance

## Technical Implementation

### Security Model

- Key-based authentication with secure pairing mechanism
- Transport-level encryption for all communications
- Local storage of sensitive information using Keychain
- Device binding to prevent unauthorized access

### LLM Integration

```swift
// LLM provider selection
enum LLMProvider: String {
    case local
    case api
    case hybrid
}

// Main LLM management
class LLMManager {
    var defaultProvider: LLMProvider
    var localLLMManager: LocalLLMManager
    var apiLLMManager: APILLMManager
    
    func generateText(prompt: String,
                     systemPrompt: String? = nil,
                     temperature: Double = 0.7,
                     maxTokens: Int = 1024,
                     stopWords: [String] = [],
                     forcedProvider: LLMProvider? = nil,
                     onProgress: ((String) -> Void)? = nil,
                     completion: @escaping (Result<String, Error>) -> Void)
}
```

### Container Management

```swift
// Container definition
struct ContainerTemplate {
    let id: UUID
    let name: String
    let description: String
    let image: String
    let ports: [PortMapping]
    let volumes: [VolumeMapping]
    let environmentVariables: [EnvironmentVariable]
}

// Container runtime
class ContainerManager {
    func startContainer(template: ContainerTemplate) -> RunningContainer?
    func stopContainer(id: String)
    func getContainerLogs(id: String) -> String
}
```

## Development Guidelines

1. **Modularity**: Each manager should have single responsibility
2. **Error Handling**: Implement robust error handling and graceful degradation
3. **Performance**: Optimize for mobile environments with limited resources
4. **Security**: Prioritize end-to-end security for all communications
5. **User Experience**: Focus on minimizing latency and providing responsive feedback

## MCP Rules for RemoteCode

When working with RemoteCode, follow these Model Context Protocol rules:

1. Keep security and connectivity classes separate from UI components
2. Use Swift's Result type for all asynchronous operations
3. Implement dedicated manager classes for distinct responsibilities
4. Maintain the existing architecture pattern of central coordinators
5. Follow Swift naming conventions and access control best practices

## Implementation Checklist

- [ ] Core macOS app structure
- [ ] Secure pairing mechanism between devices
- [ ] Local LLM integration with Ollama, llama.cpp, and MLX
- [ ] Container management with Docker
- [ ] Editor integration with syntax highlighting
- [ ] Mobile-optimized UI for iPhone client
- [ ] Offline capabilities with local-first approach
- [ ] Documentation and onboarding experience 