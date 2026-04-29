# Log Anomaly Detection System (LADS)

> A real-time Security Operations Center (SOC) style desktop application for monitoring, detecting, and reporting on log-based security anomalies.

---

## Overview

LADS is a full-stack desktop application built with **Electron** (frontend) and **Java/Javalin** (backend). It ingests system logs from multiple formats, applies a rule-based anomaly detection engine, and streams security alerts to a live SOC-style dashboard over WebSocket — all packaged as a standalone Windows `.exe`.

---

## Features

- **Real-time Dashboard** — Live counters, Chart.js graphs (line, bar, doughnut), and a terminal-style log feed
- **Multi-format Log Parsing** — Supports Legacy, Windows Event Viewer TSV, JSON, Key=Value (Splunk/CEF), and heuristic fallback
- **Anomaly Detection Engine** — 3 built-in rules: Brute Force, High Activity, Unusual Login Time
- **WebSocket Live Streaming** — Backend pushes alerts to the frontend instantly with no polling
- **IP Blocking** — Firewall simulation; blocked IPs are filtered from future alerts
- **PDF Report Generation** — Structured 3-page A4 report with cover, executive summary, and data tables
- **CSV Export** — RFC 4180 compliant alert export
- **Dark / Light Mode** — CSS custom property token-based theming (no color inversion hack)
- **Settings Panel** — Configurable detection thresholds synced to the Java backend at runtime
- **Standalone .exe** — Auto-starts the Java backend, no terminal or Maven needed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron v28 |
| Frontend | HTML5, Vanilla JavaScript, Tailwind CSS |
| Charts | Chart.js |
| Backend server | Java 17 + Javalin 5 (Jetty) |
| Serialization | Jackson Databind |
| Build (Java) | Apache Maven 3.9 + maven-shade-plugin |
| Build (Electron) | electron-builder 24 |
| IPC | Electron contextBridge |

---

## Project Structure

```
Log-Anomaly-Detection-System/
├── main.js                  Electron main process
├── preload.js               IPC bridge (contextBridge)
├── index.html               App shell HTML
├── package.json             npm + electron-builder config
│
├── js/
│   └── app.js               All frontend logic (~1500 lines)
│
├── styles/
│   └── main.css             CSS + custom property theme system
│
├── backend-core/            Java Maven project
│   ├── pom.xml
│   └── src/main/java/
│       ├── Main.java
│       ├── ApiServer.java
│       ├── AnomalyDetector.java
│       ├── LogParser.java
│       ├── LogService.java
│       ├── MockGenerator.java
│       ├── Alert.java
│       └── LogEntry.java
│
├── build/
│   └── icon.png
│
├── dist/                    Build output (generated)
│   ├── Log Anomaly Detection System Setup 1.0.0.exe
│   └── Log Anomaly Detection System 1.0.0.exe
│
├── WALKTHROUGH.txt          Full project walkthrough
└── PIPELINE.txt             Detailed working pipeline
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Java JDK 17+](https://adoptium.net/)
- [Apache Maven 3.9+](https://maven.apache.org/)

### Run in Development

**Step 1 — Start the Java backend:**
```bash
cd backend-core
mvn exec:java -Dexec.mainClass=Main
```

**Step 2 — Start the Electron frontend** (in a new terminal):
```bash
npm install
npm start
```

The app will open with the Java backend already running on `http://localhost:8080`.

---

## Build the Windows .exe

### One-command build (recommended):
```bash
npm run build:win
```

This will:
1. Build a fat JAR with all Java dependencies (`mvn package`)
2. Package Electron + JAR into installer and portable exe

### Output files in `dist/`:

| File | Type | Size |
|------|------|------|
| `Log Anomaly Detection System Setup 1.0.0.exe` | NSIS Installer | ~79.7 MB |
| `Log Anomaly Detection System 1.0.0.exe` | Portable exe | ~79.5 MB |

> **Note:** The target machine must have **Java 17+** installed. The app shows a friendly error dialog if Java is not found.

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Windows .exe (Electron)          │
│                                         │
│  Renderer (Chromium) ←──IPC──► Main.js  │
│       app.js                    │       │
│       index.html                │       │
│       Chart.js                  │       │
│                                 │       │
│                         spawns java -jar│
└─────────────────────────────────┼───────┘
                                  │ WebSocket ws://localhost:8080/ws/alerts
                                  │ HTTP REST  http://localhost:8080/api/...
┌─────────────────────────────────▼───────┐
│        Java Backend (Javalin + Jetty)    │
│                                         │
│  MockGenerator (every 3s)               │
│  ├─ 90% normal traffic                  │
│  └─ 10% brute force simulation          │
│             ↓                           │
│  AnomalyDetector                        │
│  ├─ Rule 1: Brute Force (≥N fails/IP)   │
│  ├─ Rule 2: High Activity (>10/IP)      │
│  └─ Rule 3: Unusual Login Time (0–5AM)  │
│             ↓                           │
│  broadcastAlert() → WebSocket → UI      │
└─────────────────────────────────────────┘
```

---

## Backend REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | Returns alert list (placeholder) |
| `POST` | `/api/upload` | Upload raw log file text for parsing |
| `POST` | `/api/block/{ip}` | Add IP to blocked list |
| `POST` | `/api/settings` | Update detection thresholds |
| `WS` | `/ws/alerts` | WebSocket stream of live alerts |

---

## Anomaly Detection Rules

| Rule | Condition | Severity |
|------|-----------|---------|
| **Brute Force** | ≥ N failed LOGIN attempts from same IP (configurable, default: 5) | High / Critical |
| **High Activity** | > 10 total log entries from same IP in one batch | Medium / Warning |
| **Unusual Login Time** | LOGIN event between 00:00 and 05:59 AM | Low / Normal |

---

## Log Format Support

The parser tries 5 strategies in order per line:

1. **Legacy** — `[TIMESTAMP] IP=x USER=y EVENT=z STATUS=w`
2. **Windows Event Viewer** — Tab-separated TSV export from Windows Event Viewer
3. **JSON** — `{"ip":"...", "timestamp":"...", "event":"..."}`
4. **Key=Value** — Splunk / CEF format: `ip=x time=y user=z`
5. **Heuristic Fallback** — Regex extraction of IP, timestamp, and keyword-based guessing

---

## UI Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Live stat counters, 3 real-time charts, terminal log feed |
| **Upload Logs** | Drag-and-drop log file upload |
| **Alerts** | Searchable, filterable alert table with detail modal |
| **Reports** | PDF and CSV export |
| **Suspicious IPs** | Flagged IPs table + bar chart |
| **Settings** | Detection thresholds and rule toggles |

---

## Theme

The app supports **dark mode** (default) and **light mode** via CSS custom property tokens.

Toggle with the moon/sun icon in the top-right header.

---

## License

LADS — © 2025
