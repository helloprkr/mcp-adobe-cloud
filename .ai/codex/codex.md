# AI Codex

## Usage

- Review: @codex.md (silent load, no output)
- Update: @learn.md
- File paths: Always use absolute paths from project root

## Errors

E000:

- Context: [Relevant project area or file]
- Error: [Precise description]
- Correction: [Exact fix]
- Prevention: [Specific strategy]
- Related: [IDs of related errors/learnings]

E001:

- Context: File path suggestions
- Error: Relative path used instead of absolute
- Correction: Use absolute paths from project root
- Prevention: Always prefix paths with '/'
- Related: None

E002:

- Context: '/src/index.ts'
- Error: Suggested CommonJS import syntax
- Correction: Use ES module import syntax
- Prevention: Verify `"type": "module"` in '/package.json' or '.mjs' extension
- Related: L002

## Learnings

L009:

- Context: /Sources/SnipShot/SnipShotApp.swift
- Insight: SwiftUI app architecture with window styling and custom commands
- Application: Use WindowGroup with frame constraints and hidden title bar for Mac apps
- Impact: Creates a more professional looking Mac application without unnecessary window chrome
- Related: L010, L011, L012

L010:

- Context: /Sources/SnipShot/Views
- Insight: SnipShot uses a modular view architecture with separate files for mockup and snippet features
- Application: Separate functional areas into distinct SwiftUI view files with shared model access
- Impact: Improves code organization and maintainability while allowing feature-specific customization
- Related: L009, L011

L011:

- Context: /Sources/SnipShot/Models/ProjectModel.swift
- Insight: SwiftUI app uses ObservableObject for state management across views
- Application: Create centralized data models with @Published properties for state that needs to be shared
- Impact: Ensures consistent state across different views and simplifies data persistence
- Related: L009, L010

L012:

- Context: /Sources/SnipShot/Managers/ExportManager.swift
- Insight: SnipShot implements a dedicated manager for export functionality
- Application: Use specific manager classes to encapsulate complex functionality separate from UI code
- Impact: Better separation of concerns and more testable code structure
- Related: L009, L010, L011

L007:

- Context: /apps/www/src/pro/components/user-dropdown.tsx
- Insight: UserDropdown component uses useLogout hook and handles loading state
- Application: Implement logout functionality with loading indicator in user-related components
- Impact: Improved user experience with visual feedback during logout process
- Related: L008, L005

L008:

- Context: /apps/www/src/pro/components/user-dropdown.tsx
- Insight: Component uses 'use client' directive for client-side rendering
- Application: Use 'use client' directive for components that require client-side interactivity
- Impact: Proper integration with Next.js 13+ server components architecture
- Related: L007

L000:

- Context: [Relevant project area or file]
- Insight: [Concise description]
- Application: [How to apply this knowledge]
- Impact: [Potential effects on project]
- Related: [IDs of related errors/learnings]

L001:

- Context: @codex.md usage
- Insight: @codex.md is for context, not for direct modification
- Application: Use @codex.md for silent loading and context only; execute subsequent commands separately
- Impact: Improved accuracy in responding to user intentions
- Related: None

L002:

- Context: Project architecture
- Insight: Repository pattern for data access
- Application: '/src' is root, '/src/auth' for authentication, '/src/database' for data access
- Impact: Organized code structure, separation of concerns
- Related: None

L004:

- Context: /remoteCode-app.swift and overall architecture
- Insight: RemoteCode uses a multi-layer architecture with managers for different responsibilities
- Application: Maintain separation of concerns with dedicated manager classes for environment, LLM, security, and containers
- Impact: Modular architecture enables easier maintenance and extensibility
- Related: L003

L005:

- Context: /00.00_REMOTE-APP-DOCS/meta-perspective.txt
- Insight: RemoteCode implements a multi-layered meta-perspective approach to software design
- Application: Consider technical, social, cultural, economic, and philosophical implications when designing features
- Impact: Creates a more robust and comprehensive product that works across multiple conceptual layers
- Related: L004

L006:

- Context: /diagrams/remoteCode-architecture.d2
- Insight: Visual representation of architecture enhances understanding of complex systems
- Application: Use D2 language to create diagrams of system components and their relationships
- Impact: Improves documentation and helps identify architectural patterns and dependencies
- Related: L004
