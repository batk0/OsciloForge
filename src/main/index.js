const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

app.setName('OscilloForge');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

   mainWindow.loadFile(path.join(__dirname, '..', '..', 'index.html'));
}

async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'CSV', extensions: ['csv'] },
            { name: 'ARB', extensions: ['arb'] }
        ]
    });
    if (canceled) {
        return;
    }

    const filePath = filePaths[0];
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.csv') {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content;
    } else if (extension === '.arb') {
        const buffer = fs.readFileSync(filePath);
        const header = Buffer.from([0x61, 0x72, 0x62, 0x00, 0x00, 0x11, 0x00, 0x00]);
        
        if (buffer.length < 8 || !buffer.slice(0, 8).equals(header)) {
            dialog.showErrorBox('File Read Error', 'Invalid ARB file header.');
            return null;
        }

        const floatData = [];
        for (let i = 8; i < buffer.length; i += 2) {
            const intValue = buffer.readInt16LE(i);
            const floatValue = (intValue / 2047.0) - 1.0;
            floatData.push(floatValue);
        }
        return floatData.join('\n');
    }
    
    return null; // Should not happen if filters are used correctly
}

async function handleFileSave(event, data) {
    const { canceled, filePath } = await dialog.showSaveDialog({
        filters: [
            { name: 'CSV', extensions: ['csv'] },
            { name: 'ARB', extensions: ['arb'] }
        ]
    });

    if (canceled) {
        return;
    }

    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.csv') {
        fs.writeFileSync(filePath, data);
    } else if (extension === '.arb') {
        const floatValues = data.split('\n').map(s => parseFloat(s.trim()));
        
        const header = Buffer.from([0x61, 0x72, 0x62, 0x00, 0x00, 0x11, 0x00, 0x00]);
        const dataBuffer = Buffer.alloc(floatValues.length * 2);

        for (let i = 0; i < floatValues.length; i++) {
            const floatValue = floatValues[i];
            const intValue = Math.round((floatValue + 1.0) * 2047);
            dataBuffer.writeInt16LE(intValue, i * 2);
        }

        const finalBuffer = Buffer.concat([header, dataBuffer]);
        fs.writeFileSync(filePath, finalBuffer);
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
  app.quit();
});
