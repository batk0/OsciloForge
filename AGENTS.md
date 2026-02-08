# OscilloForge - Agent Development Guidelines

This document contains guidelines for agentic coding agents working on the OscilloForge waveform editor project.

## Communication Guidelines

Be laconic when describing completed work. Avoid unnecessary explanations, summaries, or filler text. Get straight to the point.

## Git and GitHub Workflow

Use subagents for git and GitHub operations when:
- Creating branches for new features
- Analyzing branch history before creating PRs
- Reviewing complex changes across multiple files
- Checking git status and comparing branches

The `task` tool with `subagent_type: 'git'` should be used for all git commands and GitHub CLI operations.

## Build, Test, and Lint Commands

### Available Commands
- `npm start` - Start the Electron application
- `npm test` - Run all tests using Vitest
- `npm run lint` - Run ESLint on src/ and spec/
- `npm run lint:fix` - Run ESLint with auto-fix

### Running Single Tests
```bash
# Run a specific test file
npx vitest run spec/utils.test.js

# Run tests in watch mode
npx vitest spec/utils.test.js

# Run tests with coverage
npx vitest --coverage
```

### Test Configuration
- **Framework**: Vitest with jsdom environment
- **Coverage**: V8 provider with text, json, and html reporters
- **Test Files**: Located in `spec/` directory with `*.test.js` naming convention

## Project Structure

### Core Architecture
- **Electron Main Process**: `src/main/index.js` - File operations, window management
- **Renderer Process**: `src/renderer/index.js` - Main application logic, UI orchestration
- **Preload Script**: `src/preload/index.js` - Secure IPC bridge between main and renderer

### Module Organization
- `src/renderer/api/utils.js` - Utility functions (math, mouse position)
- `src/renderer/api/canvas-drawer.js` - Canvas rendering and drawing logic
- `src/renderer/api/mouse-handler.js` - Mouse interaction and editing modes
- `src/renderer/api/waveform-generator.js` - Waveform generation algorithms
- `src/renderer/api/ui-manager.js` - UI management and event handling
- `src/renderer/api/state.js` - Centralized application state management

### Testing Structure
- `spec/utils.test.js` - Utility function tests
- `spec/canvas-drawer.test.js` - Canvas rendering tests
- `spec/mouse-handler.test.js` - Mouse interaction tests
- `spec/waveform-generator.test.js` - Waveform generation tests
- `spec/state.test.js` - State management tests
- `spec/ui-manager.test.js` - UI manager tests

## Code Style Guidelines

### JavaScript/ES6+ Standards
- **Module System**: ES6 modules (`import`/`export`) in renderer, CommonJS (`require`) in main/preload
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes with avoidEscape
- **Semicolons**: Always required
- **Line endings**: Unix (LF)
- **Trailing commas**: Never
- **Max empty lines**: 1 (0 at EOF)

### Import Conventions
```javascript
// Node.js built-in modules (main/preload only)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');

// ES6 module imports (renderer)
import { getMousePos } from './utils.js';
import { CanvasDrawer } from './canvas-drawer.js';
```

### Naming Conventions
- **Variables/Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **File Names**: `kebab-case.js` for modules
- **DOM IDs**: `kebab-case` with hyphens

### Code Organization
- **Class-based Components**: Use classes for complex stateful components
- **Functional Programming**: Prefer pure functions for utilities
- **Event Handlers**: Separate into dedicated handler methods
- **Spacing**: Space before blocks, keyword spacing, no multi-spaces
- **Functions**: Named functions have no space before paren, anonymous always does

### Error Handling
```javascript
// Validation with early returns
if (isNaN(amplitude) || amplitude < 0 || amplitude > 1) {
  alert('Amplitude must be between 0 and 1.');
  return;
}

// File operations with error checking
if (buffer.length < 8 || !buffer.slice(0, 8).equals(header)) {
  dialog.showErrorBox('File Read Error', 'Invalid ARB file header.');
  return null;
}
```

### ESLint Rules
- `no-console`: warn
- `no-unused-vars`: error (args after-used, ignore `_` prefix)
- `prefer-const`: error
- `no-var`: error
- `curly`: error (always use braces)
- `brace-style`: 1tbs, no single line
- `prefer-arrow-callback`: warn (allow named functions)
- `no-eval`, `no-implied-eval`, `no-new-func`: error

### Type Patterns
- **Typed Arrays**: Use `Float32Array` for waveform data
- **Buffer Operations**: Use `Buffer` for file I/O
- **DOM Elements**: Query with `getElementById` for performance

## File Format Specifications

### CSV Format
- One numeric value per line
- Values range from -1.0 to 1.0
- Empty lines and whitespace are ignored

### ARB Format (Proprietary)
- **Header**: 8 bytes - `[0x61, 0x72, 0x62, 0x00, 0x00, 0x11, 0x00, 0x00]`
- **Data**: 16-bit signed integers, little-endian
- **Conversion**: `floatValue = (intValue / 2047.0) - 1.0`

## Development Workflow

### Testing Requirements
- **Unit Tests**: Cover all utility functions and class methods
- **Integration Tests**: Test module interactions
- **Mock Dependencies**: Use Vitest mocks for DOM and canvas contexts
- **Coverage**: All new code must be covered by tests
- **Coverage Threshold**: Code coverage must not drop from current levels

### Git Workflow
- **New Features**: Create a new branch when you start working on a new feature
- **Pre-commit**: Run lint and tests before committing (`npm run lint && npm test`)
- **Pull Requests**: Create a pull request after feature is complete
- **Task Tracking**: All new tasks for this project must be tracked in GitHub issues

### State Management
- **Centralized State**: Keep application state in `src/renderer/api/state.js`
- **Immutable Updates**: Use `new Float32Array()` for data copies
- **Constants**: `WAVEFORM_POINTS = 4096`, padding constants in state.js

### Electron Security
- **Context Isolation**: Always enabled (`contextIsolation: true`)
- **Node Integration**: Disabled in renderer (`nodeIntegration: false`)
- **IPC Communication**: Use `contextBridge.exposeInMainWorld`

## UI Guidelines

### Dark Theme Standards
- **Background**: `#333` (main), `#4f4f4f` (toolbar)
- **Text**: `#f0f0f0` (primary), `#ccc` (secondary)
- **Borders**: `#666` (standard), `#777` (controls)
- **Waveform**: `#ff0000` (red, high contrast)

## Performance Considerations

### Waveform Processing
- **Fixed Size**: Always use 4096 points for consistency
- **Typed Arrays**: Use `Float32Array` for efficient operations
- **Lazy Updates**: Only redraw when state changes

### Canvas Optimization
- **View Frustum Culling**: Only draw visible points
- **Batch Operations**: Minimize context switches
- **Memory Management**: Clear and reuse canvas contexts

## Module Dependencies

### Core Dependencies
- `electron` - Desktop application framework
- `canvas` - Canvas API implementation
- `vitest` - Testing framework
- `jsdom` - DOM testing environment

### External Libraries
- Avoid adding new dependencies unless absolutely necessary
- Prefer native browser APIs over third-party libraries
- Check existing patterns before introducing new modules
