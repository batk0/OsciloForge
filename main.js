const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (canceled) {
        return;
    } else {
        const content = fs.readFileSync(filePaths[0], 'utf-8');
        return content;
    }
}

async function handleFileSave(event, data) {
    const { canceled, filePath } = await dialog.showSaveDialog({
        filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (canceled) {
        return;
    } else {
        fs.writeFileSync(filePath, data);
    }
}


app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleFileOpen);
  ipcMain.handle('dialog:saveFile', handleFileSave);
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
