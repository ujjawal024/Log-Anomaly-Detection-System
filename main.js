const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// ── Java backend process handle ──────────────────────────────────────────────
let javaProcess = null;

function getJarPath() {
  if (app.isPackaged) {
    // In the packaged .exe the JAR lives in resources/
    return path.join(process.resourcesPath, 'backend-core-fat.jar');
  }
  // During development use the Maven build output
  return path.join(__dirname, 'backend-core', 'target', 'backend-core-fat.jar');
}

function startJavaBackend() {
  const jarPath = getJarPath();

  if (!fs.existsSync(jarPath)) {
    dialog.showErrorBox(
      'Backend Not Found',
      `Could not locate the Java backend JAR:\n${jarPath}\n\n` +
      'Please run: mvn package  inside the backend-core folder, then restart the app.'
    );
    return;
  }

  console.log('[Main] Starting Java backend:', jarPath);
  javaProcess = spawn('java', ['-jar', jarPath], {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  javaProcess.stdout.on('data', d => process.stdout.write(`[Java] ${d}`));
  javaProcess.stderr.on('data', d => process.stderr.write(`[Java] ${d}`));

  javaProcess.on('error', err => {
    if (err.code === 'ENOENT') {
      dialog.showErrorBox(
        'Java Not Installed',
        'Java 17+ is required but was not found in your PATH.\n\n' +
        'Download it free from: https://adoptium.net/'
      );
    } else {
      console.error('[Main] Java process error:', err.message);
    }
  });

  javaProcess.on('close', code => {
    console.log(`[Main] Java process exited (code ${code})`);
    javaProcess = null;
  });
}

function stopJavaBackend() {
  if (javaProcess) {
    console.log('[Main] Stopping Java backend...');
    javaProcess.kill('SIGTERM');
    javaProcess = null;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

let appState = {
  stats: { totalLogs: 0, totalAlerts: 0, failedLogins: 0, uniqueIPs: 0 },
  alerts: [],
  suspiciousIPs: [],
  recentLogs: []
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Only open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer] ${message}`);
  });
}

// Start Java backend, then open the window
app.whenReady().then(() => {
  startJavaBackend();
  // Small delay so Javalin has time to bind port 8080 before the renderer connects
  setTimeout(createWindow, 1500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Kill Java when Electron exits (fixes BUG-17)
app.on('will-quit', () => {
  stopJavaBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


// IPC handlers for file operations
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Log Files', extensions: ['log', 'txt', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'CSV', extensions: ['csv'] }
    ]
  });
  return result;
});

ipcMain.handle('save-blob-to-file', async (event, filePath, base64Data) => {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// === New Log Anomaly IPC Handlers ===

ipcMain.handle('upload-log-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { logsProcessed: 0, alertsDetected: 0 };
    
    // Read recent logs for UI preview visually
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    appState.recentLogs = lines.slice(-50).map(l => l.trim()).filter(l => l);
    
    const logContent = fs.readFileSync(filePath, 'utf-8');
    
    // Send it directly to Javalin!
    const response = await fetch('http://localhost:8080/api/upload', {
      method: 'POST',
      body: logContent,
      headers: { 'Content-Type': 'text/plain' }
    });
    
    if (response.ok) {
      const result = await response.json();
      return result; // returning { logsProcessed, alertsDetected }
    } else {
      console.error('Java server returned error:', response.status);
    }
  } catch (err) {
    console.error('Failed to upload log file to Java server:', err);
  }
  return { logsProcessed: 0, alertsDetected: 0 };
});

ipcMain.handle('get-alerts', (event, filters) => {
  return appState.alerts;
});

ipcMain.handle('get-stats', () => {
  return appState.stats;
});

ipcMain.handle('get-suspicious-ips', () => {
  return appState.suspiciousIPs;
});

ipcMain.handle('get-recent-logs', () => {
  return appState.recentLogs;
});

ipcMain.handle('get-settings', () => {
  return {};
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    await fetch('http://localhost:8080/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    return { success: true };
  } catch (e) {
    console.error('Failed to save settings:', e);
    return { success: false };
  }
});

ipcMain.handle('block-ip', async (event, ip) => {
  try {
    await fetch('http://localhost:8080/api/block/' + encodeURIComponent(ip), { method: 'POST' });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
});

ipcMain.handle('resolve-alert', async (event, id) => {
  // Logic lives purely in frontend UI state, so backend just acknowledges
  return { success: true };
});

ipcMain.handle('print-report-html', async (event, htmlContent) => {
  return new Promise((resolve) => {
    const reportWin = new BrowserWindow({
      width: 1200,
      height: 900,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    reportWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    reportWin.webContents.once('did-finish-load', async () => {
      // Give fonts/layout a moment to settle
      await new Promise(r => setTimeout(r, 800));
      try {
        const pdfData = await reportWin.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          marginsType: 1,
          landscape: false
        });
        resolve(Buffer.from(pdfData).toString('base64'));
      } catch (err) {
        console.error('printToPDF error:', err);
        resolve(null);
      } finally {
        reportWin.destroy();
      }
    });
  });
});



// Mock CSV returning nothing. The frontend typically handles CSV string generation natively in app.js
ipcMain.handle('download-report-csv', async () => {
  return null;
});
