
public class LogEntry {
    private final String timestamp;
    private final String ipAddress;
    private final String username;
    private final String eventType;
    private final String status;

    public LogEntry(String timestamp, String ipAddress, String username, String eventType, String status) {
        this.timestamp = timestamp;
        this.ipAddress = ipAddress;
        this.username = username;
        this.eventType = eventType;
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUsername() {
        return username;
    }

    public String getEventType() {
        return eventType;
    }

    public String getStatus() {
        return status;
    }

    @Override
    public String toString() {
        return "LogEntry{" +
                "timestamp='" + timestamp + '\'' +
                ", ipAddress='" + ipAddress + '\'' +
                ", username='" + username + '\'' +
                ", eventType='" + eventType + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}
