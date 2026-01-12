# GEMINI Project: waveform

## Project Overview

This project is a simple desktop waveform editor built with Electron. It allows users to open, view, edit, and save waveform data. The waveform is visualized on an HTML canvas, and the data is imported from and exported to CSV files.

The application is structured as a standard Electron project:
- **Main Process (`main.js`):** Manages the application lifecycle, creates the browser window, and handles native desktop interactions like opening and saving files using Electron's `dialog` and Node.js's `fs` module.
- **Renderer Process (`renderer.js`):** Controls the user interface (`index.html`). It handles user input (button clicks, mouse drawing, zoom sliders) and renders the waveform on the canvas.
- **Preload Script (`preload.js`):** Acts as a bridge between the main and renderer processes to securely expose Node.js functionality to the frontend via the `contextBridge`.

## Building and Running

### Prerequisites
- Node.js and npm must be installed.

### Installation
To install the dependencies, run the following command in your terminal:
```bash
npm install
```

### Running the Application
To start the application, run:
```bash
npm start
```
This will launch the Waveform Editor window.

### Testing
There are no automated tests configured for this project. The `test` script in `package.json` is a placeholder.

## Development Conventions

- **Code Style:** The JavaScript code follows standard conventions, using `const` and `let` for variable declarations.
- **IPC:** Inter-Process Communication between the main and renderer processes is handled via `ipcMain.handle` and `window.electronAPI` exposed through the `preload.js` script. This is a secure way to handle IPC in modern Electron applications.
- **File Handling:** The application works with CSV files. The main process reads and writes files, and the renderer process parses and serializes the data.
