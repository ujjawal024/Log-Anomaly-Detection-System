# Core Java Backend (No Frameworks)

This backend demonstrates **60% project completion** core functionality:

- Read a log file
- Parse log entries (regex)
- Run rule-based anomaly detection
- Print alerts + stats
- Optionally write `alerts.json`

## Log format

Each line must match:

```
[2026-03-03 10:15:23] IP=192.168.1.10 USER=admin EVENT=LOGIN STATUS=FAILED
```

## Files (required classes)

Located in `backend-core/src/`:

- `Main.java`
- `LogEntry.java`
- `LogParser.java`
- `LogService.java`
- `AnomalyDetector.java`
- `Alert.java`

## Run (Windows PowerShell)

> If `java`/`javac` are not recognized, restart PowerShell (PATH refresh).

```powershell
cd "c:\Users\UJJAWAL\Desktop\Log Anomaly Detection System\backend-core\src"

# compile
javac -d out *.java

# run using sample log
java -cp out Main "..\sample.log"
```

After running, you should see console output and an `alerts.json` file created in the same folder you ran the command from.

