import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AnomalyDetector {
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<Alert> detectAnomalies(List<LogEntry> logs, int bruteForceThreshold) {
        List<Alert> alerts = new ArrayList<>();

        // Rule 1: Failed Login Detection (Brute Force)
        Map<String, Integer> failedByIp = new HashMap<>();
        for (LogEntry e : logs) {
            if (isFailedLogin(e)) {
                failedByIp.put(e.getIpAddress(), failedByIp.getOrDefault(e.getIpAddress(), 0) + 1);
            }
        }
        for (Map.Entry<String, Integer> entry : failedByIp.entrySet()) {
            if (entry.getValue() >= bruteForceThreshold) {
                alerts.add(new Alert(
                        "",
                        entry.getKey(),
                        "Brute Force",
                        "High",
                        "Multiple failed login attempts (" + entry.getValue() + ")"
                ));
            }
        }

        // Rule 2: Suspicious IP Activity (> 10 entries)
        Map<String, Integer> countByIp = new HashMap<>();
        for (LogEntry e : logs) {
            countByIp.put(e.getIpAddress(), countByIp.getOrDefault(e.getIpAddress(), 0) + 1);
        }
        for (Map.Entry<String, Integer> entry : countByIp.entrySet()) {
            if (entry.getValue() > 10) {
                alerts.add(new Alert(
                        "",
                        entry.getKey(),
                        "Suspicious Activity",
                        "Medium",
                        "High activity from IP (" + entry.getValue() + " log entries)"
                ));
            }
        }

        // Rule 3: Unusual Login Time (00:00–05:00)
        for (LogEntry e : logs) {
            if (isLoginEvent(e) && isUnusualLoginTime(e.getTimestamp())) {
                alerts.add(new Alert(
                        e.getTimestamp(),
                        e.getIpAddress(),
                        "Unusual Login Time",
                        "Low",
                        "Login activity detected during unusual hours (00:00–05:00)"
                ));
            }
        }

        return alerts;
    }

    private boolean isFailedLogin(LogEntry e) {
        if (e == null) return false;
        return "LOGIN".equalsIgnoreCase(e.getEventType()) && "FAILED".equalsIgnoreCase(e.getStatus());
    }

    private boolean isLoginEvent(LogEntry e) {
        if (e == null) return false;
        return "LOGIN".equalsIgnoreCase(e.getEventType());
    }

    private boolean isUnusualLoginTime(String timestamp) {
        if (timestamp == null) return false;
        try {
            LocalDateTime dt = LocalDateTime.parse(timestamp.trim(), TS_FORMAT);
            int hour = dt.getHour();
            return hour >= 0 && hour <= 5;
        } catch (DateTimeParseException ex) {
            return false;
        }
    }
}

