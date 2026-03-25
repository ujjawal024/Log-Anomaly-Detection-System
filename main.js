const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

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

  mainWindow.webContents.openDevTools({ mode: 'detach' });
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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

ipcMain.handle('upload-log-file', (event, filePath) => {
  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, 'backend-core', 'src');
    
    // Read recent logs for UI
    try {
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
        appState.recentLogs = lines.slice(-50).map(l => l.trim()).filter(l => l);
      }
    } catch (e) {}

    exec(`java -cp "out" Main "${filePath}"`, { cwd: backendDir }, (error, stdout, stderr) => {
      if (error) {
        console.error('Java Execution Error:', error);
        // It might be compiled differently or missing, we can still attempt to read alerts.json
      }
      
      try {
        const alertsPath = path.join(backendDir, 'alerts.json');
        if (fs.existsSync(alertsPath)) {
          const rawAlerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
          
          let severityMap = {
            'High': 'critical',
            'Medium': 'warning',
            'Low': 'normal'
          };

          // Format alerts
          let newAlerts = rawAlerts.map((a, i) => {
            const sev = severityMap[a.severity] || 'normal';
            return {
              id: Date.now() + i,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              ip: a.ipAddress,
              username: 'unknown',
              eventType: a.type,
              severity: sev,
              status: 'Active',
              rawLog: `[Anomaly Detected] Type: ${a.type}, IP: ${a.ipAddress}`
            };
          });

          // Prepend new alerts
          appState.alerts = [...newAlerts, ...appState.alerts];

          // Compute stats
          appState.stats.totalLogs += appState.recentLogs.length > 0 ? fs.readFileSync(filePath, 'utf-8').split('\n').length : 0;
          appState.stats.totalAlerts += newAlerts.length;
          
          let ipMap = {};
          let failedCount = 0;
          appState.alerts.forEach(a => {
            if (a.eventType.toLowerCase().includes('brute force') || a.eventType.toLowerCase().includes('failed')) {
              failedCount++;
            }
            if (!ipMap[a.ip]) {
              ipMap[a.ip] = { ip: a.ip, attempts: 0, lastSeen: a.timestamp, riskLevel: a.severity };
            }
            ipMap[a.ip].attempts++;
          });
          
          appState.stats.failedLogins = failedCount;
          appState.stats.uniqueIPs = Object.keys(ipMap).length;
          appState.suspiciousIPs = Object.values(ipMap);
          
          resolve({ logsProcessed: appState.stats.totalLogs, alertsDetected: newAlerts.length });
        } else {
          resolve({ logsProcessed: 0, alertsDetected: 0 });
        }
      } catch (err) {
        reject(err.message);
      }
    });
  });
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

ipcMain.handle('save-settings', (event, settings) => {
  return { success: true };
});
