/**
 * Log Anomaly Detection System - Main Application
 * SOC-style dashboard with Electron
 */

// ============ STATE ============
const state = {
  currentPage: 'dashboard',
  theme: 'dark',
  notifications: [],
  alerts: [],
  suspiciousIPs: [],
  stats: {
    totalLogs: 0,
    totalAlerts: 0,
    failedLogins: 0,
    uniqueIPs: 0
  },
  mockAlerts: [],
  mockSuspiciousIPs: [],
  uploadedFiles: [],
  downloadHistory: [],
  charts: {}
};

// ============ MOCK DATA ============
function initMockData() {
  state.mockAlerts = [
    { id: 1, timestamp: '2025-03-03 14:32:18', ip: '192.168.1.105', username: 'admin', eventType: 'Failed Login', severity: 'critical', status: 'Active' },
    { id: 2, timestamp: '2025-03-03 14:28:45', ip: '10.0.0.22', username: 'user1', eventType: 'Brute Force', severity: 'critical', status: 'Active' },
    { id: 3, timestamp: '2025-03-03 14:15:33', ip: '172.16.0.88', username: 'guest', eventType: 'Suspicious Activity', severity: 'warning', status: 'Acknowledged' },
    { id: 4, timestamp: '2025-03-03 13:58:12', ip: '192.168.1.42', username: 'svc_account', eventType: 'Multiple Failed Logins', severity: 'warning', status: 'Active' },
    { id: 5, timestamp: '2025-03-03 13:45:00', ip: '10.0.0.15', username: 'admin', eventType: 'Unusual Access', severity: 'normal', status: 'Resolved' },
    { id: 6, timestamp: '2025-03-03 13:22:55', ip: '203.0.113.50', username: 'unknown', eventType: 'Port Scan', severity: 'critical', status: 'Active' },
    { id: 7, timestamp: '2025-03-03 12:59:41', ip: '192.168.1.200', username: 'developer', eventType: 'Failed Login', severity: 'normal', status: 'Resolved' },
    { id: 8, timestamp: '2025-03-03 12:30:15', ip: '172.16.0.100', username: 'root', eventType: 'Privilege Escalation Attempt', severity: 'critical', status: 'Active' }
  ];

  state.mockSuspiciousIPs = [
    { ip: '192.168.1.105', attempts: 156, lastSeen: '2025-03-03 14:32:18', riskLevel: 'critical' },
    { ip: '203.0.113.50', attempts: 89, lastSeen: '2025-03-03 13:22:55', riskLevel: 'critical' },
    { ip: '10.0.0.22', attempts: 67, lastSeen: '2025-03-03 14:28:45', riskLevel: 'warning' },
    { ip: '172.16.0.88', attempts: 34, lastSeen: '2025-03-03 14:15:33', riskLevel: 'warning' },
    { ip: '192.168.1.42', attempts: 23, lastSeen: '2025-03-03 13:58:12', riskLevel: 'normal' }
  ];
}

// ============ ROUTING ============
const pageTitles = {
  dashboard: 'Dashboard',
  upload: 'Upload Logs',
  alerts: 'Alerts',
  reports: 'Reports',
  'suspicious-ips': 'Suspicious IPs',
  settings: 'Settings'
};

function navigateTo(page) {
  state.currentPage = page;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  document.getElementById('page-title').textContent = pageTitles[page];
  renderPage(page);
}

function renderPage(page) {
  const container = document.getElementById('page-content');
  container.innerHTML = '';
  container.classList.add('animate-fade-in');

  switch (page) {
    case 'dashboard': renderDashboard(container); break;
    case 'upload': renderUpload(container); break;
    case 'alerts': renderAlerts(container); break;
    case 'reports': renderReports(container); break;
    case 'suspicious-ips': renderSuspiciousIPs(container); break;
    case 'settings': renderSettings(container); break;
    default: renderDashboard(container);
  }
}

// ============ DASHBOARD ============
function renderDashboard(container) {
  const html = `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-slate-400 font-medium">Total Logs Processed</p>
              <p class="text-3xl font-bold text-slate-100 mt-1 counter-value" data-value="${state.stats.totalLogs}">${formatNumber(state.stats.totalLogs)}</p>
            </div>
            <span class="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-slate-400 font-medium">Total Alerts Detected</p>
              <p class="text-3xl font-bold text-slate-100 mt-1 counter-value" data-value="${state.stats.totalAlerts}">${formatNumber(state.stats.totalAlerts)}</p>
            </div>
            <span class="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-slate-400 font-medium">Failed Login Attempts</p>
              <p class="text-3xl font-bold text-slate-100 mt-1 counter-value" data-value="${state.stats.failedLogins}">${formatNumber(state.stats.failedLogins)}</p>
            </div>
            <span class="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
          </div>
        </div>
        <div class="stat-card">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-slate-400 font-medium">Unique IP Addresses</p>
              <p class="text-3xl font-bold text-slate-100 mt-1 counter-value" data-value="${state.stats.uniqueIPs}">${formatNumber(state.stats.uniqueIPs)}</p>
            </div>
            <span class="w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></span>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 class="text-lg font-semibold text-slate-100 mb-4">Failed Login Attempts Over Time</h3>
          <div class="chart-container">
            <canvas id="lineChart"></canvas>
          </div>
        </div>
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 class="text-lg font-semibold text-slate-100 mb-4">Alerts by Type</h3>
          <div class="chart-container">
            <canvas id="barChart"></canvas>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 class="text-lg font-semibold text-slate-100 mb-4">Event Distribution</h3>
          <div class="chart-container">
            <canvas id="pieChart"></canvas>
          </div>
        </div>
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 class="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>
          <div class="terminal-log h-64 overflow-y-auto">
            ${state.mockAlerts.slice(0, 50).map(a => `<div class="log-line">[${a.timestamp || new Date().toISOString()}] ${a.eventType || 'Unknown'} - ${a.ip || a.ipAddress || 'Unknown IP'}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
  initDashboardCharts();
  animateCounters();
  // Removed overriding getStats and getRecentLogs to preserve live WebSocket data.
}

function animateCounters() {
  document.querySelectorAll('.counter-value').forEach(el => {
    const target = parseInt(el.dataset.value) || 0;
    let current = 0;
    const duration = 800;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = formatNumber(Math.round(target));
        clearInterval(timer);
      } else {
        el.textContent = formatNumber(Math.round(current));
      }
    }, 16);
  });
}

function generateMockLogLines(count) {
  const events = ['LOGIN_FAILED', 'LOGIN_SUCCESS', 'AUTH_ERROR', 'ACCESS_DENIED', 'SESSION_START', 'LOGOUT'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const event = events[Math.floor(Math.random() * events.length)];
    const time = new Date(Date.now() - i * 300000).toISOString();
    html += `<div class="log-line">[${time}] ${event} - 192.168.1.${100 + i}</div>`;
  }
  return html;
}

function updateDynamicCharts() {
  if (state.currentPage === 'dashboard') {
    if (state.charts.barChart) {
      const typeCounts = {};
      state.mockAlerts.forEach(a => {
        const type = a.eventType || 'Unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      const sortedTypes = Object.keys(typeCounts).sort((a,b) => typeCounts[b] - typeCounts[a]).slice(0, 5);
      state.charts.barChart.data.labels = sortedTypes;
      state.charts.barChart.data.datasets[0].data = sortedTypes.map(t => typeCounts[t]);
      state.charts.barChart.update();
    }
    if (state.charts.pieChart) {
      let success = 0, failed = 0, unknown = 0;
      state.mockAlerts.forEach(a => {
        const t = (a.eventType || '').toLowerCase();
        if (t.includes('success') || t.includes('normal')) success++;
        else if (t.includes('fail') || t.includes('error') || t.includes('denied') || t.includes('brute')) failed++;
        else unknown++;
      });
      state.charts.pieChart.data.datasets[0].data = [success, failed, unknown];
      state.charts.pieChart.update();
    }
    if (state.charts.lineChart) {
      const recentFails = state.mockAlerts.slice(0, 50).filter(a => (a.eventType||'').toLowerCase().includes('fail')).length;
      state.charts.lineChart.data.datasets[0].data.shift();
      state.charts.lineChart.data.datasets[0].data.push(recentFails);
      state.charts.lineChart.update();
    }
  } else if (state.currentPage === 'suspicious-ips') {
    if (state.charts.ipChart) {
      const topIPs = [...state.mockSuspiciousIPs].sort((a,b) => b.attempts - a.attempts).slice(0, 5);
      state.charts.ipChart.data.labels = topIPs.map(ip => ip.ip.split('.').pop());
      state.charts.ipChart.data.datasets[0].data = topIPs.map(ip => ip.attempts);
      state.charts.ipChart.update();
    }
  }
}

function initDashboardCharts() {
  if (state.charts.lineChart) state.charts.lineChart.destroy();
  if (state.charts.barChart) state.charts.barChart.destroy();
  if (state.charts.pieChart) state.charts.pieChart.destroy();

  const lineCtx = document.getElementById('lineChart');
  if (lineCtx) {
    state.charts.lineChart = new Chart(lineCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['-6m', '-5m', '-4m', '-3m', '-2m', '-1m', 'Now'],
        datasets: [{
          label: 'Failed Logins Trend',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(71, 85, 105, 0.3)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { color: 'rgba(71, 85, 105, 0.3)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    state.charts.barChart = new Chart(barCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Count',
          data: [],
          backgroundColor: ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'].map(c => c + 'cc')
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(71, 85, 105, 0.3)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } }
        }
      }
    });
  }

  const pieCtx = document.getElementById('pieChart');
  if (pieCtx) {
    state.charts.pieChart = new Chart(pieCtx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Success', 'Failed', 'Unknown'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#22c55e', '#f43f5e', '#64748b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
      }
    });
  }
  
  updateDynamicCharts();
}

// ============ UPLOAD PAGE ============
function renderUpload(container) {
  const html = `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="upload-zone" id="upload-zone">
        <input type="file" id="file-input" class="hidden" accept=".log,.txt,.csv" multiple>
        <div class="space-y-4">
          <svg class="w-16 h-16 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <div>
            <p class="text-lg font-medium text-slate-200">Drag and drop your log files here</p>
            <p class="text-sm text-slate-400 mt-1">or click to browse (supports .log, .txt, .csv)</p>
          </div>
          <button type="button" id="browse-btn" class="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
            Browse Files
          </button>
        </div>
      </div>

      <div id="file-preview" class="hidden">
        <h3 class="text-lg font-semibold text-slate-100 mb-3">Selected Files</h3>
        <div id="file-list" class="space-y-2 mb-4"></div>
      </div>

      <div id="upload-error" class="hidden p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
        <p id="error-message"></p>
      </div>

      <div id="upload-progress" class="hidden">
        <div class="flex justify-between text-sm text-slate-400 mb-2">
          <span>Analyzing...</span>
          <span id="progress-text">0%</span>
        </div>
        <div class="progress-bar">
          <div id="progress-fill" class="progress-fill w-0"></div>
        </div>
      </div>

      <button id="start-analysis" class="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2" disabled>
        <svg id="analysis-spinner" class="hidden w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Start Analysis
      </button>
    </div>
  `;
  container.innerHTML = html;
  initUploadHandlers();
}

function initUploadHandlers() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const startBtn = document.getElementById('start-analysis');
  const filePreview = document.getElementById('file-preview');
  const fileList = document.getElementById('file-list');
  const uploadError = document.getElementById('upload-error');
  const uploadProgress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const analysisSpinner = document.getElementById('analysis-spinner');

  const handleFiles = (files) => {
    if (!files.length) return;
    state.uploadedFiles = Array.from(files);
    fileList.innerHTML = state.uploadedFiles.map(f => `
      <div class="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
        <div class="font-mono text-sm">
          <span class="text-slate-200">${f.name}</span>
          <span class="text-slate-500 ml-2">(${formatFileSize(f.size)})</span>
        </div>
        <span class="text-xs text-slate-400">${f.type || 'text/plain'}</span>
      </div>
    `).join('');
    filePreview.classList.remove('hidden');
    startBtn.disabled = false;
    uploadError.classList.add('hidden');
  };

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  browseBtn.addEventListener('click', () => fileInput.click());
  zone.addEventListener('click', (e) => { if (!fileInput.contains(e.target) && !browseBtn.contains(e.target)) fileInput.click(); });
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  startBtn.addEventListener('click', async function() {
    if (!state.uploadedFiles || state.uploadedFiles.length === 0) return;
    startBtn.disabled = true;
    analysisSpinner.classList.remove('hidden');
    uploadProgress.classList.remove('hidden');
    uploadError.classList.add('hidden');
    progressFill.style.width = '10%';
    progressText.textContent = '10%';

    try {
      if (API.uploadLogFile) {
        progressFill.style.width = '30%';
        progressText.textContent = '30%';
        var result = await API.uploadLogFile(state.uploadedFiles[0]);
        progressFill.style.width = '80%';
        progressText.textContent = '80%';
        if (result && result.alertsDetected !== undefined) {
          state.stats.totalLogs = (state.stats.totalLogs || 0) + (result.logsProcessed || 0);
          state.stats.totalAlerts = (state.stats.totalAlerts || 0) + (result.alertsDetected || 0);
          state.mockAlerts = [];
          if (API.getAlerts) {
            state.mockAlerts = await fetchWithFallback(function() { return API.getAlerts(); }, []);
          }
          showNotification('Analysis complete! ' + (result.alertsDetected || 0) + ' new alerts detected.', 'success');
          navigateTo('alerts');
        }
      } else {
        for (var i = 30; i <= 100; i += 20) {
          await new Promise(function(r) { setTimeout(r, 150); });
          progressFill.style.width = i + '%';
          progressText.textContent = i + '%';
        }
        showNotification('Analysis complete! (Backend not connected)', 'info');
        navigateTo('alerts');
      }
    } catch (err) {
      uploadError.classList.remove('hidden');
      document.getElementById('error-message').textContent = err.message || 'Upload failed';
      showNotification('Upload failed: ' + err.message, 'error');
    }
    analysisSpinner.classList.add('hidden');
    uploadProgress.classList.add('hidden');
    progressFill.style.width = '0%';
    startBtn.disabled = false;
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============ ALERTS PAGE ============
function renderAlerts(container) {
  const html = `
    <div class="space-y-6">
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div class="flex gap-3 flex-wrap">
          <input type="text" id="alert-search" placeholder="Search..." class="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg w-48 focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
          <input type="text" id="ip-search" placeholder="IP address" class="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg w-36 font-mono focus:ring-2 focus:ring-cyan-500">
          <input type="text" id="username-search" placeholder="Username" class="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg w-32 focus:ring-2 focus:ring-cyan-500">
          <select id="event-type-filter" class="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500">
            <option value="">All Event Types</option>
            <option value="Failed Login">Failed Login</option>
            <option value="Brute Force">Brute Force</option>
            <option value="Port Scan">Port Scan</option>
            <option value="Suspicious Activity">Suspicious Activity</option>
            <option value="Privilege Escalation Attempt">Privilege Escalation</option>
          </select>
          <select id="severity-filter" class="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="normal">Normal</option>
          </select>
          <input type="date" id="date-filter" class="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500">
        </div>
      </div>

      <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="cursor-pointer hover:text-cyan-400 select-none" id="sort-timestamp" data-sort-dir="desc">Timestamp ↕</th>
                <th>IP Address</th>
                <th>Username</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="alerts-tbody">
              ${renderAlertsRows(state.mockAlerts)}
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-slate-700">
          <p class="text-sm text-slate-400" id="alerts-pagination-info">Showing 1-8 of 8</p>
          <div class="flex gap-2" id="alerts-pagination"></div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
  // Directly initialize tables using the preserved WebSocket state
  initAlertsHandlers();
}

function renderAlertsRows(alerts) {
  return alerts.map(function(a) {
    var id = a.id || a._id;
    var ip = a.ip || a.ipAddress || '';
    var ts = a.timestamp || '';
    var user = a.username || '';
    var evt = a.eventType || '';
    var sev = a.severity || 'normal';
    var status = a.status || 'Active';
    return '<tr class="cursor-pointer hover:bg-slate-700/30" data-alert-id="' + id + '" data-alert=\'' + JSON.stringify(a).replace(/'/g, "\\'") + '\'>' +
      '<td class="font-mono text-slate-300">' + ts + '</td>' +
      '<td class="font-mono text-cyan-400">' + ip + '</td>' +
      '<td>' + user + '</td>' +
      '<td>' + evt + '</td>' +
      '<td><span class="px-2 py-1 rounded text-xs font-medium severity-' + sev + '">' + sev + '</span></td>' +
      '<td>' + status + '</td>' +
      '<td><button class="text-cyan-400 hover:text-cyan-300 text-sm view-alert-btn">View</button></td>' +
    '</tr>';
  }).join('');
}

function initAlertsHandlers() {
  const search = document.getElementById('alert-search');
  const ipSearch = document.getElementById('ip-search');
  const usernameSearch = document.getElementById('username-search');
  const eventTypeFilter = document.getElementById('event-type-filter');
  const severityFilter = document.getElementById('severity-filter');
  const dateFilter = document.getElementById('date-filter');
  const tbody = document.getElementById('alerts-tbody');

  const filterAlerts = () => {
    const term = (search?.value || '').toLowerCase();
    const ip = (ipSearch?.value || '').trim();
    const username = (usernameSearch?.value || '').toLowerCase();
    const eventType = eventTypeFilter?.value || '';
    const severity = severityFilter?.value || '';
    const date = dateFilter?.value || '';

    var filtered = state.mockAlerts.filter(function(a) {
      var aIp = a.ip || a.ipAddress || '';
      var aUser = (a.username || '').toLowerCase();
      var aEvt = (a.eventType || '').toLowerCase();
      var matchSearch = !term || aIp.indexOf(term) >= 0 || aUser.indexOf(term) >= 0 || aEvt.indexOf(term) >= 0;
      var matchIP = !ip || aIp.indexOf(ip) >= 0;
      var matchUsername = !username || aUser.indexOf(username) >= 0;
      var matchEventType = !eventType || (a.eventType || '') === eventType;
      var matchSeverity = !severity || (a.severity || '') === severity;
      var matchDate = !date || (a.timestamp || '').indexOf(date) === 0;
      return matchSearch && matchIP && matchUsername && matchEventType && matchSeverity && matchDate;
    });
    tbody.innerHTML = renderAlertsRows(filtered);
    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.alertId;
        const alert = state.mockAlerts.find(a => a.id == id);
        if (alert) openAlertModal(alert);
      });
    });
  };

  [search, ipSearch, usernameSearch, eventTypeFilter, severityFilter, dateFilter].forEach(el => {
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', filterAlerts);
  });

  tbody.querySelectorAll('tr').forEach(function(row) {
    row.addEventListener('click', function(e) {
      if (e.target.classList.contains('view-alert-btn')) return;
      var alertData = row.dataset.alert;
      var alert = alertData ? JSON.parse(alertData) : state.mockAlerts.find(function(a) { return (a.id || a._id) == row.dataset.alertId; });
      if (alert) openAlertModal(alert);
    });
  });
  tbody.querySelectorAll('.view-alert-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var row = btn.closest('tr');
      var alertData = row.dataset.alert;
      var alert = alertData ? JSON.parse(alertData) : state.mockAlerts.find(function(a) { return (a.id || a._id) == row.dataset.alertId; });
      if (alert) openAlertModal(alert);
    });
  });

  if (state.searchQuery) {
    if (search) search.value = state.searchQuery;
    filterAlerts();
  }

  const sortHeader = document.getElementById('sort-timestamp');
  if (sortHeader) {
    sortHeader.addEventListener('click', () => {
      const dir = sortHeader.dataset.sortDir === 'desc' ? 'asc' : 'desc';
      sortHeader.dataset.sortDir = dir;
      sortHeader.textContent = dir === 'desc' ? 'Timestamp ↓' : 'Timestamp ↑';
      state.mockAlerts.sort((a, b) => {
        const d = new Date(a.timestamp) - new Date(b.timestamp);
        return dir === 'desc' ? -d : d;
      });
      filterAlerts();
    });
  }
}

function openAlertModal(alert) {
  var modal = document.getElementById('alert-modal');
  var body = document.getElementById('modal-body');
  var ip = alert.ip || alert.ipAddress || '';
  
  body.innerHTML = '<pre class="text-slate-300 whitespace-pre-wrap">Timestamp: ' + (alert.timestamp || '') +
    '\nIP Address: ' + ip +
    '\nUsername: ' + (alert.username || '') +
    '\nEvent Type: ' + (alert.eventType || '') +
    '\nSeverity: ' + (alert.severity || '') +
    '\nStatus: ' + (alert.status || 'Active') +
    '\n\nRaw Log Entry:\n' + (alert.rawLog || ('[' + (alert.timestamp || '') + '] attempt from ' + ip)) + '</pre>' +
    '<div class="mt-6 flex gap-4 border-t border-slate-700 pt-4">' +
    '  <button id="resolve-alert-btn" class="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">Resolve</button>' +
    '  <button id="block-ip-btn" class="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Block IP</button>' +
    '</div>';
    
  modal.classList.remove('hidden');

  const resolveBtn = document.getElementById('resolve-alert-btn');
  const blockBtn = document.getElementById('block-ip-btn');

  if (resolveBtn) resolveBtn.onclick = () => {
    alert.status = 'Resolved';
    if (API.resolveAlert) API.resolveAlert(alert.id);
    modal.classList.add('hidden');
    showNotification('Alert resolved manually', 'success');
    if (state.currentPage === 'alerts') renderAlerts(document.getElementById('page-content'));
  };

  if (blockBtn) blockBtn.onclick = () => {
    if (API.blockIP) API.blockIP(ip);
    alert.status = 'Resolved (Blocked)';
    modal.classList.add('hidden');
    showNotification('IP ' + ip + ' blocked successfully via Java firewall', 'error');
    if (state.currentPage === 'alerts') renderAlerts(document.getElementById('page-content'));
  };
}

function renderSuspiciousIPRows(ips) {
  if (!ips || ips.length === 0) return '<tr><td colspan="4" class="text-center text-slate-500 py-4">No IPs found</td></tr>';
  return ips.map(ip => `
    <tr>
      <td class="font-mono text-cyan-400">${ip.ip}</td>
      <td>${ip.attempts}</td>
      <td class="font-mono text-slate-400">${ip.lastSeen}</td>
      <td><span class="px-2 py-1 rounded text-xs font-medium severity-${ip.riskLevel}">${ip.riskLevel}</span></td>
    </tr>
  `).join('');
}

// ============ SUSPICIOUS IPS ============
function renderSuspiciousIPs(container) {
  const html = `
    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div class="p-4 border-b border-slate-700">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-slate-100">Suspicious IP Addresses</h3>
              <input type="text" id="suspicious-ip-search" placeholder="Filter IPs..." class="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 text-slate-200">
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Attempts</th>
                  <th>Last Seen</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody id="suspicious-ips-tbody">
                ${renderSuspiciousIPRows(state.mockSuspiciousIPs)}
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <h3 class="font-semibold text-slate-100 mb-4">Attempts by IP</h3>
          <div class="chart-container" style="height: 250px;">
            <canvas id="ipChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
  
  const searchInput = document.getElementById('suspicious-ip-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      const tbody = document.getElementById('suspicious-ips-tbody');
      if (tbody) {
        const filtered = state.mockSuspiciousIPs.filter(ip => ip.ip.toLowerCase().indexOf(term) >= 0);
        tbody.innerHTML = renderSuspiciousIPRows(filtered);
      }
    });
  }

  // Use preserved WebSocket state without erasing
  initSuspiciousIPChart(container);
}

function initSuspiciousIPChart(container) {
  if (state.charts.ipChart) state.charts.ipChart.destroy();
  var ipCtx = (container && container.querySelector) ? container.querySelector('#ipChart') : document.getElementById('ipChart');
  if (ipCtx && typeof Chart !== 'undefined') {
    state.charts.ipChart = new Chart(ipCtx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Attempts',
          data: [],
          backgroundColor: ['#f43f5e', '#f43f5e', '#f97316', '#f97316', '#22c55e']
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(71, 85, 105, 0.3)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
    updateDynamicCharts();
  }
}

// ============ REPORTS ============
function renderReports(container) {
  const html = `
    <div class="space-y-6 max-w-4xl">
      <div class="flex flex-wrap gap-4">
        <button id="export-pdf" class="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Generate PDF
        </button>
        <button id="export-csv" class="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-lg font-medium transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export CSV
        </button>
      </div>

      <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 class="font-semibold text-slate-100 mb-4">Report Preview</h3>
        <div class="terminal-log h-64 overflow-y-auto font-mono text-sm">
          <div class="text-slate-400">=== LOG ANOMALY DETECTION REPORT ===</div>
          <div class="text-slate-400">Generated: ${new Date().toISOString()}</div>
          <div class="text-slate-400">---</div>
          <div>Total Logs: ${state.stats.totalLogs}</div>
          <div>Alerts: ${state.stats.totalAlerts}</div>
          <div>Failed Logins: ${state.stats.failedLogins}</div>
          <div>Unique IPs: ${state.stats.uniqueIPs}</div>
          <div class="text-slate-400">---</div>
          <div class="text-slate-400">Top Suspicious IPs:</div>
          ${state.mockSuspiciousIPs.slice(0, 5).map(ip => `<div>  ${ip.ip} - ${ip.attempts} attempts</div>`).join('')}
        </div>
      </div>

      <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 class="font-semibold text-slate-100 mb-4">Download History</h3>
        <div class="space-y-2">
          ${state.downloadHistory.length === 0 ? '<div class="text-slate-500 text-sm italic">No downloads yet.</div>' : ''}
          ${state.downloadHistory.map(item => `
          <div class="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <span class="font-mono text-sm text-slate-300">${item.filename}</span>
            <span class="text-xs text-slate-500">${item.time}</span>
          </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;

  document.getElementById('export-pdf').addEventListener('click', async function() {
    try {
      showNotification('Generating report PDF…', 'info');
      const reportHtml = buildReportHtml();

      if (window.electronAPI && window.electronAPI.printReportHtml) {
        // Ask main process to open a hidden window, inject html, and printToPDF
        const base64 = await window.electronAPI.printReportHtml(reportHtml);
        if (!base64) throw new Error('PDF generation failed in main process');

        const saveResult = await window.electronAPI.saveFileDialog('LADS_Report_' + new Date().toISOString().slice(0,10) + '.pdf');
        if (!saveResult.canceled && saveResult.filePath) {
          const res = await window.electronAPI.saveBlobToFile(saveResult.filePath, base64);
          showNotification(res.success ? 'Report PDF saved!' : 'Save failed', res.success ? 'success' : 'error');
          if (res.success) {
            state.downloadHistory.unshift({ filename: saveResult.filePath.split(/[\\\/]/).pop(), time: new Date().toLocaleTimeString() });
            if (state.currentPage === 'reports') renderReports(document.getElementById('page-content'));
          }
        }
      } else {
        // Fallback: open in a new browser tab / print dialog
        const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const win  = window.open(url, '_blank');
        if (win) {
          win.onload = () => { win.print(); };
          showNotification('Report opened for printing', 'success');
        } else {
          showNotification('Pop-up blocked — could not open report', 'error');
        }
        state.downloadHistory.unshift({ filename: 'report.pdf', time: new Date().toLocaleTimeString() });
        if (state.currentPage === 'reports') renderReports(document.getElementById('page-content'));
      }
    } catch (err) {
      showNotification('PDF export failed: ' + err.message, 'error');
      console.error('PDF export error:', err);
    }
  });

  document.getElementById('export-csv').addEventListener('click', async function() {
    try {
      // BUG-02 fix: RFC 4180 CSV escaping — wrap every field in quotes, double any internal quotes
      const csvEscape = (val) => '"' + String(val == null ? '' : val).replace(/"/g, '""') + '"';

      const rows = [['Timestamp', 'IP', 'Event Type', 'Severity', 'Status']];
      state.mockAlerts.forEach(a => rows.push([a.timestamp, a.ip, a.eventType, a.severity, a.status]));

      // BUG-01 fix: use '\n' (real newline), not '\\n' (literal backslash-n)
      const csvStr = rows.map(r => r.map(csvEscape).join(',')).join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      
      if (window.electronAPI && window.electronAPI.saveFileDialog) {
         var reader = new FileReader();
         reader.onload = function() {
           var base64 = reader.result.split(',')[1];
           window.electronAPI.saveFileDialog('alerts_export.csv').then(function(r) {
             if (!r.canceled && r.filePath && window.electronAPI.saveBlobToFile) {
               window.electronAPI.saveBlobToFile(r.filePath, base64).then(function(res) {
                 showNotification(res.success ? 'CSV saved successfully!' : 'Save failed', res.success ? 'success' : 'error');
                 if (res.success) {
                   state.downloadHistory.unshift({ filename: r.filePath.split(/[\\\\/]/).pop(), time: new Date().toLocaleTimeString() });
                   if (state.currentPage === 'reports') renderReports(document.getElementById('page-content'));
                 }
               });
             }
           });
         };
         reader.readAsDataURL(blob);
      } else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'alerts_export.csv';
        a.click();
        showNotification('CSV downloaded natively', 'success');
        state.downloadHistory.unshift({ filename: 'alerts_export.csv', time: new Date().toLocaleTimeString() });
        if (state.currentPage === 'reports') renderReports(document.getElementById('page-content'));
      }
    } catch (err) {
      showNotification('CSV export failed: ' + err.message, 'error');
    }
  });
}

// ============ SETTINGS ============
function renderSettings(container) {
  const html = `
    <div class="max-w-2xl space-y-6 settings-page">
      <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 class="font-semibold text-slate-100 mb-4">Detection Thresholds</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-2">Failed Login Attempt Threshold</label>
            <input type="number" value="5" min="1" max="100" class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500">
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2">Anomaly Detection Time Window (minutes)</label>
            <input type="number" value="15" min="1" max="120" class="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500">
          </div>
        </div>
      </div>

      <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 class="font-semibold text-slate-100 mb-4">Detection Rules</h3>
        <div class="space-y-3">
          <label class="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer">
            <span>Brute Force Detection</span>
            <div class="toggle-switch active" data-rule="brute-force"></div>
          </label>
          <label class="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer">
            <span>Port Scan Detection</span>
            <div class="toggle-switch active" data-rule="port-scan"></div>
          </label>
          <label class="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer">
            <span>Privilege Escalation Detection</span>
            <div class="toggle-switch active" data-rule="priv-escalation"></div>
          </label>
        </div>
      </div>

    </div>
    </div>
  `;
  container.innerHTML = html;

  const performSave = function() {
    var inputs = document.querySelectorAll('.settings-page input[type="number"]');
    var bf = document.querySelector('[data-rule="brute-force"]');
    var ps = document.querySelector('[data-rule="port-scan"]');
    var pe = document.querySelector('[data-rule="priv-escalation"]');
    var s = {
      bruteForceThreshold: parseInt((inputs[0] && inputs[0].value) || 5, 10),
      timeWindowMinutes: parseInt((inputs[1] && inputs[1].value) || 15, 10),
      bruteForceEnabled: bf ? bf.classList.contains('active') : true,
      portScanEnabled: ps ? ps.classList.contains('active') : true,
      privilegeEscalationEnabled: pe ? pe.classList.contains('active') : true
    };
    if (API.saveSettings) {
      API.saveSettings(s).then(function() { showNotification('Settings saved & propagated to Java!', 'success'); }).catch(function() {});
    }
  };

  document.querySelectorAll('.toggle-switch').forEach(function(toggle) {
    var parent = toggle.closest('label') || toggle.parentElement;
    (parent || toggle).addEventListener('click', function(e) {
      if (e.target.tagName === 'INPUT') return;
      toggle.classList.toggle('active');
      performSave();
    });
  });

  document.querySelectorAll('.settings-page input[type="number"]').forEach(function(input) {
    input.addEventListener('change', performSave);
  });
  if (API.getSettings) {
    fetchWithFallback(API.getSettings, function() { return {}; }).then(function(s) {
      var inputs = document.querySelectorAll('.settings-page input[type="number"]');
      if (inputs.length > 0 && s.failedLoginThreshold != null) inputs[0].value = s.failedLoginThreshold;
      if (inputs.length > 1 && s.timeWindowMinutes != null) inputs[1].value = s.timeWindowMinutes;
      var t = document.querySelector('[data-rule="brute-force"]');
      if (t) t.classList.toggle('active', s.bruteForceEnabled !== false);
      t = document.querySelector('[data-rule="port-scan"]');
      if (t) t.classList.toggle('active', s.portScanEnabled !== false);
      t = document.querySelector('[data-rule="priv-escalation"]');
      if (t) t.classList.toggle('active', s.privilegeEscalationEnabled !== false);
    });
  }
}

// ============ NOTIFICATIONS ============
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container');
  const id = Date.now();
  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
  };
  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-lg border ${colors[type]} animate-fade-in shadow-lg`;
  toast.textContent = message;
  toast.id = `toast-${id}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============ REPORT HTML BUILDER ============
function buildReportHtml() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const criticalCount = state.mockAlerts.filter(a => a.severity === 'critical').length;
  const warningCount  = state.mockAlerts.filter(a => a.severity === 'warning').length;
  const resolvedCount = state.mockAlerts.filter(a => a.status === 'Resolved' || a.status === 'Resolved (Blocked)').length;

  const sevColor = { critical: '#ef4444', warning: '#f59e0b', normal: '#22c55e' };
  const sevBg    = { critical: '#fef2f2', warning: '#fffbeb', normal: '#f0fdf4' };
  const sevText  = { critical: '#991b1b', warning: '#92400e', normal: '#14532d' };

  const alertRows = state.mockAlerts.slice(0, 50).map(a => {
    const sev = a.severity || 'normal';
    return `
      <tr>
        <td style="font-family:monospace;font-size:11px;padding:7px 10px;border-bottom:1px solid #e2e8f0;">${a.timestamp || ''}</td>
        <td style="font-family:monospace;color:#0284c7;padding:7px 10px;border-bottom:1px solid #e2e8f0;">${a.ip || a.ipAddress || ''}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${a.username || ''}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${a.eventType || ''}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;
            background:${sevBg[sev]};color:${sevText[sev]};border:1px solid ${sevColor[sev]}40;">
            ${sev.charAt(0).toUpperCase() + sev.slice(1)}
          </span>
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">${a.status || 'Active'}</td>
      </tr>`;
  }).join('');

  const ipRows = state.mockSuspiciousIPs.slice(0, 20).map(ip => {
    const rl = ip.riskLevel || 'normal';
    return `
      <tr>
        <td style="font-family:monospace;color:#0284c7;padding:7px 10px;border-bottom:1px solid #e2e8f0;">${ip.ip}</td>
        <td style="font-weight:700;padding:7px 10px;border-bottom:1px solid #e2e8f0;">${ip.attempts}</td>
        <td style="font-family:monospace;font-size:11px;padding:7px 10px;border-bottom:1px solid #e2e8f0;">${ip.lastSeen}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;
            background:${sevBg[rl]};color:${sevText[rl]};border:1px solid ${sevColor[rl]}40;">
            ${rl.charAt(0).toUpperCase() + rl.slice(1)}
          </span>
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LADS Security Report — ${dateStr}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #ffffff; color: #0f172a; font-size: 13px; line-height: 1.6; }
    @page { size: A4; margin: 0; }

    /* ── Cover Page ── */
    .cover {
      width: 210mm; height: 297mm;
      background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0e7490 100%);
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 60px 56px; page-break-after: always;
    }
    .cover-logo { display: flex; align-items: center; gap: 14px; }
    .cover-logo-icon {
      width: 52px; height: 52px; background: rgba(6,182,212,0.25); border: 1px solid rgba(6,182,212,0.5);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
    }
    .cover-logo-icon svg { width: 30px; height: 30px; stroke: #22d3ee; fill: none; }
    .cover-logo-text { color: #f1f5f9; }
    .cover-logo-text h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .cover-logo-text p  { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .cover-main { }
    .cover-tag {
      display: inline-block; background: rgba(6,182,212,0.2); border: 1px solid rgba(6,182,212,0.4);
      color: #22d3ee; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
      padding: 6px 14px; border-radius: 6px; margin-bottom: 24px;
    }
    .cover-main h2 { font-size: 42px; font-weight: 800; color: #f1f5f9; line-height: 1.15; margin-bottom: 14px; }
    .cover-main h2 span { color: #22d3ee; }
    .cover-main p  { font-size: 15px; color: #94a3b8; max-width: 400px; }
    .cover-footer { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; display: flex; justify-content: space-between; }
    .cover-footer span { color: #64748b; font-size: 12px; }
    .cover-footer strong { color: #94a3b8; }
    .cover-stat-row { display: flex; gap: 28px; margin-top: 40px; }
    .cover-stat {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 20px 24px; flex: 1;
    }
    .cover-stat .val { font-size: 32px; font-weight: 800; color: #f1f5f9; }
    .cover-stat .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }

    /* ── Body Pages ── */
    .page { width: 210mm; padding: 40px 48px; page-break-after: always; }
    .page:last-child { page-break-after: auto; }

    .section-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
      padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;
    }
    .section-header .dot { width: 10px; height: 10px; border-radius: 50%; background: #0e7490; flex-shrink: 0; }
    .section-header h3 { font-size: 17px; font-weight: 700; color: #0f172a; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;
    }
    .page-header .brand { font-size: 13px; font-weight: 700; color: #0e7490; }
    .page-header .meta  { font-size: 11px; color: #94a3b8; }

    /* Summary cards */
    .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }
    .stat-box {
      border-radius: 12px; padding: 18px 16px;
      border: 1px solid #e2e8f0; background: #f8fafc;
    }
    .stat-box .num { font-size: 28px; font-weight: 800; }
    .stat-box .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 4px; }
    .stat-box.red   { background:#fef2f2; border-color:#fecaca; } .stat-box.red   .num { color:#991b1b; }
    .stat-box.amber { background:#fffbeb; border-color:#fde68a; } .stat-box.amber .num { color:#92400e; }
    .stat-box.green { background:#f0fdf4; border-color:#bbf7d0; } .stat-box.green .num { color:#14532d; }
    .stat-box.blue  { background:#eff6ff; border-color:#bfdbfe; } .stat-box.blue  .num { color:#1e40af; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f1f5f9; }
    thead th { padding: 9px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; border-bottom: 2px solid #e2e8f0; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    tbody tr:hover td { background: #f0f9ff; }

    /* Conclusion box */
    .conclusion {
      margin-top: 30px; padding: 20px 24px;
      background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px;
    }
    .conclusion h4 { font-size: 14px; font-weight: 700; color: #0c4a6e; margin-bottom: 8px; }
    .conclusion p  { font-size: 12px; color: #075985; line-height: 1.7; }
    .conclusion ul { font-size: 12px; color: #075985; padding-left: 18px; margin-top: 8px; line-height: 2; }

    /* Footer bar */
    .footer-bar {
      margin-top: 40px; padding-top: 14px; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;
    }
  </style>
</head>
<body>

<!-- ══════ COVER PAGE ══════ -->
<div class="cover">
  <div class="cover-logo">
    <div class="cover-logo-icon">
      <svg viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
    </div>
    <div class="cover-logo-text">
      <h1>LADS</h1>
      <p>Log Anomaly Detection System</p>
    </div>
  </div>

  <div class="cover-main">
    <div class="cover-tag">Security Report</div>
    <h2>Log Anomaly<br>Detection <span>Report</span></h2>
    <p>Comprehensive analysis of system logs, security events, and anomaly detections for the reporting period.</p>

    <div class="cover-stat-row">
      <div class="cover-stat">
        <div class="val">${state.stats.totalLogs.toLocaleString()}</div>
        <div class="lbl">Total Logs</div>
      </div>
      <div class="cover-stat">
        <div class="val">${state.mockAlerts.length}</div>
        <div class="lbl">Alerts</div>
      </div>
      <div class="cover-stat">
        <div class="val">${criticalCount}</div>
        <div class="lbl">Critical</div>
      </div>
      <div class="cover-stat">
        <div class="val">${state.stats.uniqueIPs}</div>
        <div class="lbl">Unique IPs</div>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <span>Generated: <strong>${dateStr} at ${timeStr}</strong></span>
    <span>Classification: <strong>INTERNAL USE ONLY</strong></span>
  </div>
</div>

<!-- ══════ PAGE 2: EXECUTIVE SUMMARY ══════ -->
<div class="page">
  <div class="page-header">
    <span class="brand">LADS · Log Anomaly Detection System</span>
    <span class="meta">Report Date: ${dateStr}</span>
  </div>

  <div class="section-header"><div class="dot"></div><h3>Executive Summary</h3></div>

  <div class="stat-grid">
    <div class="stat-box blue">
      <div class="num">${state.stats.totalLogs.toLocaleString()}</div>
      <div class="lbl">Total Logs Processed</div>
    </div>
    <div class="stat-box red">
      <div class="num">${criticalCount}</div>
      <div class="lbl">Critical Alerts</div>
    </div>
    <div class="stat-box amber">
      <div class="num">${warningCount}</div>
      <div class="lbl">Warning Alerts</div>
    </div>
    <div class="stat-box green">
      <div class="num">${resolvedCount}</div>
      <div class="lbl">Resolved Events</div>
    </div>
  </div>

  <div class="stat-grid" style="margin-bottom:0;">
    <div class="stat-box">
      <div class="num" style="color:#0e7490;">${state.stats.totalAlerts}</div>
      <div class="lbl">Total Alerts Detected</div>
    </div>
    <div class="stat-box red">
      <div class="num">${state.stats.failedLogins}</div>
      <div class="lbl">Failed Login Attempts</div>
    </div>
    <div class="stat-box blue">
      <div class="num">${state.stats.uniqueIPs}</div>
      <div class="lbl">Unique IPs Tracked</div>
    </div>
    <div class="stat-box">
      <div class="num" style="color:#0e7490;">${state.mockSuspiciousIPs.length}</div>
      <div class="lbl">Suspicious IPs Flagged</div>
    </div>
  </div>

  <div class="conclusion" style="margin-top:28px;">
    <h4>Analysis Summary</h4>
    <p>
      During the reporting period, the LADS engine processed
      <strong>${state.stats.totalLogs.toLocaleString()} log entries</strong> and detected
      <strong>${state.mockAlerts.length} security events</strong> of varying severity.
      A total of <strong>${criticalCount} critical</strong> and <strong>${warningCount} warning</strong> alerts
      were raised. <strong>${state.mockSuspiciousIPs.length} IP addresses</strong> exhibited suspicious behaviour
      and have been flagged for review. <strong>${resolvedCount} events</strong> have been resolved or blocked.
    </p>
    <ul>
      <li>Brute-force and failed-login patterns were the dominant threat vectors.</li>
      <li>Real-time WebSocket telemetry was active throughout the monitoring window.</li>
      <li>Recommend immediate investigation of all remaining <em>Active</em> critical alerts.</li>
    </ul>
  </div>

  <div class="footer-bar">
    <span>LADS — Log Anomaly Detection System</span>
    <span>Page 1 of 2</span>
  </div>
</div>

<!-- ══════ PAGE 3: ALERTS TABLE ══════ -->
<div class="page">
  <div class="page-header">
    <span class="brand">LADS · Log Anomaly Detection System</span>
    <span class="meta">Report Date: ${dateStr}</span>
  </div>

  <div class="section-header"><div class="dot"></div><h3>Security Alerts (Top ${Math.min(state.mockAlerts.length, 50)})</h3></div>

  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>IP Address</th>
        <th>Username</th>
        <th>Event Type</th>
        <th>Severity</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${alertRows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px;">No alerts recorded</td></tr>'}
    </tbody>
  </table>

  <div style="margin-top:32px;">
    <div class="section-header"><div class="dot"></div><h3>Suspicious IP Addresses (Top ${Math.min(state.mockSuspiciousIPs.length, 20)})</h3></div>
    <table>
      <thead>
        <tr>
          <th>IP Address</th>
          <th>Attempts</th>
          <th>Last Seen</th>
          <th>Risk Level</th>
        </tr>
      </thead>
      <tbody>
        ${ipRows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">No suspicious IPs recorded</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer-bar">
    <span>LADS — Log Anomaly Detection System</span>
    <span>Page 2 of 2 · CONFIDENTIAL</span>
  </div>
</div>

</body>
</html>`;
}

// ============ UTILITIES ============
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============ API HELPERS ============
window.API = window.API || {};

async function fetchWithFallback(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    console.warn('API error, using fallback:', e.message);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

// ============ WEBSOCKET ============
function initWebSocket() {
  const ws = new WebSocket('ws://localhost:8080/ws/alerts');
  
  ws.onopen = () => {
    console.log('Connected to backend WebSocket');
    showNotification('Connected to live backend', 'success');
  };
  
  ws.onmessage = (event) => {
    try {
      const bAlert = JSON.parse(event.data);
      const severities = { 'High': 'critical', 'Medium': 'warning', 'Low': 'normal' };
      const severity = severities[bAlert.severity] || bAlert.severity || 'normal';
      
      const alert = {
        id: Date.now() + Math.random(),
        timestamp: bAlert.timestamp || new Date().toISOString(),
        ip: bAlert.ipAddress || 'unknown',
        username: 'unknown',
        eventType: bAlert.type || 'Unknown Event',
        severity: severity,
        status: 'Active',
        rawLog: bAlert.description || ''
      };
      
      state.mockAlerts.unshift(alert);
      state.stats.totalAlerts++;
      
      const isFailed = alert.eventType.toLowerCase().includes('failed') || alert.eventType.toLowerCase().includes('brute');
      if (isFailed) state.stats.failedLogins++;
      
      const ipMatch = state.mockSuspiciousIPs.find(i => i.ip === alert.ip);
      if (ipMatch) {
        ipMatch.attempts++;
        ipMatch.lastSeen = alert.timestamp;
        if (alert.severity === 'critical') ipMatch.riskLevel = 'critical';
      } else {
        if (alert.ip && alert.ip !== 'unknown') {
          state.mockSuspiciousIPs.unshift({
            ip: alert.ip,
            attempts: 1,
            lastSeen: alert.timestamp,
            riskLevel: alert.severity
          });
          state.stats.uniqueIPs++;
        }
      }
      
      const notifLevel = alert.severity === 'critical' ? 'error' : (alert.severity === 'warning' ? 'warning' : 'info');
      if (alert.severity === 'critical' || alert.severity === 'warning') {
        showNotification(`New Alert: ${alert.eventType} from ${alert.ip}`, notifLevel);
        const badge = document.getElementById('notification-badge');
        if (badge) {
          badge.textContent = parseInt(badge.textContent || 0) + 1;
          badge.classList.remove('hidden');
        }
      }
      
      if (state.currentPage === 'dashboard') {
        const counters = document.querySelectorAll('.counter-value');
        if (counters.length >= 4) {
          counters[1].dataset.value = state.stats.totalAlerts;
          counters[1].textContent = formatNumber(state.stats.totalAlerts);
          counters[2].dataset.value = state.stats.failedLogins;
          counters[2].textContent = formatNumber(state.stats.failedLogins);
          counters[3].dataset.value = state.stats.uniqueIPs;
          counters[3].textContent = formatNumber(state.stats.uniqueIPs);
        }
        const terminal = document.querySelector('.terminal-log');
        if (terminal) {
          const div = document.createElement('div');
          div.className = 'log-line';
          div.textContent = `[${alert.timestamp}] ${alert.eventType} - ${alert.ip}`;
          terminal.prepend(div);
        }
      } else if (state.currentPage === 'alerts') {
        const searchBox = document.getElementById('alert-search');
        if (searchBox) {
          // Simply trigger the existing filter logic which will safely redraw and re-bind rows
          searchBox.dispatchEvent(new Event('input'));
        }
      } else if (state.currentPage === 'suspicious-ips') {
        const searchInput = document.getElementById('suspicious-ip-search');
        if (searchInput) {
          searchInput.dispatchEvent(new Event('input'));
        }
      }
      
      updateDynamicCharts();
      
      // Badge logic was moved to early breakout logic
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  };
  
  ws.onerror = (e) => console.error('WebSocket Error:', e);
  ws.onclose = () => {
    console.log('WebSocket disconnected. Reconnecting in 5s...');
    setTimeout(initWebSocket, 5000);
  };
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initMockData();
  initWebSocket();

  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  // Global theme toggle — uses html.light for proper CSS-variable-based theming
  const themeToggleGlobal = document.getElementById('theme-toggle-global');
  if (themeToggleGlobal) {
    themeToggleGlobal.addEventListener('click', () => {
      const html = document.documentElement;
      const isLight = html.classList.toggle('light');
      state.theme = isLight ? 'light' : 'dark';
      // Keep Tailwind dark class in sync so its dark: utilities stay consistent
      if (isLight) {
        html.classList.remove('dark');
      } else {
        html.classList.add('dark');
      }
      // Swap the icon visibility manually
      const moonIcon = themeToggleGlobal.querySelector('svg:first-child');
      const sunIcon  = themeToggleGlobal.querySelector('svg:last-child');
      if (moonIcon && sunIcon) {
        moonIcon.style.display = isLight ? 'block' : 'none';
        sunIcon.style.display  = isLight ? 'none'  : 'block';
      }
      showNotification(isLight ? 'Light mode enabled' : 'Dark mode enabled', 'info');
    });
  }

  // Sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    const icon = document.querySelector('#sidebar-toggle svg');
    icon.innerHTML = document.getElementById('sidebar').classList.contains('collapsed')
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>';
  });

  // Reset notification badge
  document.getElementById('notification-btn').addEventListener('click', () => {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = '';
      badge.classList.add('hidden');
    }
    navigateTo('alerts');
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('alert-modal').classList.add('hidden');
  });
  document.getElementById('alert-modal').addEventListener('click', (e) => {
    if (e.target.id === 'alert-modal') document.getElementById('alert-modal').classList.add('hidden');
  });

  // Current time
  function updateTime() {
    document.getElementById('current-time').textContent = new Date().toLocaleTimeString();
  }
  updateTime();
  setInterval(updateTime, 1000);

  // Simulate live alert
  setTimeout(() => {
    showNotification('New critical alert: Failed login from 192.168.1.105', 'warning');
  }, 3000);

  // Global search removed - using isolated search inputs per page.

  // Show notification badge
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = '3';
    badge.classList.remove('hidden');
  }

  // Initial page load
  navigateTo('dashboard');
});
