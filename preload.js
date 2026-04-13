const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),
  saveBlobToFile: (filePath, base64Data) => ipcRenderer.invoke('save-blob-to-file', filePath, base64Data)
});

contextBridge.exposeInMainWorld('API', {
  uploadLogFile: (file) => ipcRenderer.invoke('upload-log-file', file.path),
  getAlerts: (filters) => ipcRenderer.invoke('get-alerts', filters),
  getStats: () => ipcRenderer.invoke('get-stats'),
  getSuspiciousIPs: () => ipcRenderer.invoke('get-suspicious-ips'),
  getRecentLogs: () => ipcRenderer.invoke('get-recent-logs'),
  downloadReportPdf: () => ipcRenderer.invoke('download-report-pdf'),
  downloadReportCsv: () => ipcRenderer.invoke('download-report-csv'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  blockIP: (ip) => ipcRenderer.invoke('block-ip', ip),
  resolveAlert: (id) => ipcRenderer.invoke('resolve-alert', id)
});
