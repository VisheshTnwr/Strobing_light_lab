import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 650,
    title: 'Strobing Light System Controller',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Automatically select the correct USB Serial Port (e.g. COM9 / ESP32 / USB-to-UART bridge)
  session.defaultSession.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    console.log('Available Serial Ports detected by Electron:', portList);

    if (portList && portList.length > 0) {
      // 1. Try finding COM9 specifically
      let targetPort = portList.find((p) => p.portName === 'COM9' || p.portId === 'COM9');

      // 2. If COM9 not found by exact name, look for USB serial chips (CP210x, CH340, FTDI, ESP32)
      if (!targetPort) {
        targetPort = portList.find((p) => {
          const name = (p.displayName || p.portName || '').toLowerCase();
          return (
            name.includes('com9') ||
            name.includes('usb') ||
            name.includes('esp32') ||
            name.includes('cp210') ||
            name.includes('ch340') ||
            name.includes('uart')
          );
        });
      }

      // 3. Fallback to last detected USB port or first port
      if (!targetPort) {
        targetPort = portList[portList.length - 1];
      }

      console.log('Auto-selecting Serial Port:', targetPort);
      callback(targetPort.portId);
    } else {
      callback('');
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial') {
      return true;
    }
    return true;
  });

  session.defaultSession.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') {
      return true;
    }
    return true;
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
