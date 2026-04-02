public class Alert {
    private final String timestamp;
    private final String ipAddress;
    private final String type;
    private final String severity;
    private final String description;

    public Alert(String timestamp, String ipAddress, String type, String severity, String description) {
        this.timestamp = timestamp;
        this.ipAddress = ipAddress;
        this.type = type;
        this.severity = severity;
        this.description = description;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getType() {
        return type;
    }

    public String getSeverity() {
        return severity;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return "[ALERT]\n" +
                "IP: " + ipAddress + "\n" +
                "Type: " + type + "\n" +
                "Severity: " + severity + "\n" +
                "Description: " + description + "\n";
    }
}

