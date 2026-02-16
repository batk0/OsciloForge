# OscilloForge - Agent Development Guidelines

This document provides context and guidelines for coding agents working on the OscilloForge waveform editor.

## Build, Test, and Lint Commands

- **Run App**: `npm start` (Starts Electron)
- **Test**: `npm test` (Runs Vitest)
- **Lint**: `npm run lint` (Checks src/ and spec/)
- **Lint Fix**: `npm run lint:fix` (Auto-fixes issues)

### Running Specific Tests
```bash
# Run a specific test file
npx vitest run spec/utils.test.js

# Run tests in watch mode
npx vitest spec/utils.test.js

# Run tests with coverage
npx vitest --coverage
```

## Project Structure

### Architecture
- **Main Process**: `src/main/index.js` (CommonJS) - File I/O, window management.
- **Renderer**: `src/renderer/index.js` (ESM) - UI logic, canvas drawing.
- **Preload**: `src/preload/index.js` (CommonJS) - Secure IPC bridge.
- **State**: `src/renderer/api/state.js` - Centralized app state.

### Key Modules (src/renderer/api/)
- `canvas-drawer.js`: Rendering logic (View frustum culling, batch ops).
- `mouse-handler.js`: Interaction logic and editing modes.
- `waveform-generator.js`: Waveform generation algorithms.
- `ui-manager.js`: DOM event handling and orchestration.
- `utils.js`: Pure utility functions.

### Testing (spec/)
- **Framework**: Vitest with `jsdom` environment.
- **Structure**: `spec/*.test.js` files correspond to source modules.
- **Coverage**: Maintain high coverage; use mocks for DOM/Canvas interactions.

## Code Style & Conventions

### JavaScript Standards
- **Indentation**: 2 spaces (no tabs).
- **Quotes**: Single quotes (`'`) with `avoidEscape: true`.
- **Semicolons**: Always required.
- **Trailing Commas**: Never.
- **Braces**: `1tbs` style. Always use braces, even for single-line blocks.
- **Spacing**: Space before/after keywords, before blocks. No multi-spaces.

### Imports
- **Renderer (ESM)**: Use explicit extensions.
  ```javascript
  import { CanvasDrawer } from './canvas-drawer.js';
  ```
- **Main/Preload (CJS)**:
  ```javascript
  const { app } = require('electron');
  ```

### Naming
- **Variables/Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.js`
- **DOM IDs**: `kebab-case`

### Error Handling
- Validate inputs early and return.
- Use `console.error` for dev logging; user-facing errors via alerts/dialogs.
```javascript
if (value < 0) {
  console.error('Invalid value');
  return;
}
```

### ESLint Highlights
- `no-console`: warn.
- `no-unused-vars`: error (args: 'after-used', ignore `_` prefix).
- `prefer-const`: error.
- `no-var`: error.
- `eqeqeq`: strict equality implied.

## Domain Specifications

### Waveform Data
- **Format**: `Float32Array` fixed at **4096 points**.
- **Range**: Normalized -1.0 to 1.0.
- **ARB File**: Header `[0x61, 0x72, 0x62, 0x00, 0x00, 0x11, 0x00, 0x00]`, data as 16-bit signed little-endian integers.
- **CSV**: One float value per line.

### UI & Theme
- **Dark Mode**: Background `#333`, Toolbar `#4f4f4f`.
- **Text**: Primary `#f0f0f0`. No dedicated secondary color; reuse primary.
- **Waveform**: `#ff0000` (Red) for high contrast.

## Workflow Guidelines

### Git & GitHub
- Use `task` tool with `git-ops` subagent for git operations.
- Create feature branches for changes.
- **Verification**: Always run `npm run lint && npm test` before committing.
- **Commits**: Use Conventional Commits (e.g., `feat: ...`, `fix: ...`).

### Agent Behavior
- **Conciseness**: Be laconic. Output only necessary information.
- **Safety**: Do not update git config or run destructive commands without request.
- **Dependencies**: Do not introduce new dependencies; use existing libraries (Canvas, Electron, Vitest).
- **Context**: Read surrounding code to ensure changes are idiomatic.
