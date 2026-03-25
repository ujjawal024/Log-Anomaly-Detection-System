import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

public class Main {

    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java Main <logFilePath>");
            return;
        }

        String filePath = args[0];

        LogParser parser = new LogParser();
        LogService service = new LogService(parser);
        AnomalyDetector detector = new AnomalyDetector();

        List<LogEntry> logs = service.processFile(filePath);
        List<Alert> alerts = detector.detectAnomalies(logs);

        System.out.println("Total Logs: " + logs.size());
        System.out.println("Alerts Detected: " + alerts.size());
        System.out.println();

        for (Alert a : alerts) {
            System.out.print(a.toString());
            System.out.println();
        }

        // Optional JSON output for frontend integration
        try {
            writeAlertsJson(alerts, "alerts.json");
        } catch (Exception e) {
            System.out.println("Failed to write alerts.json: " + e.getMessage());
        }
    }

    private static void writeAlertsJson(List<Alert> alerts, String outPath) throws IOException {
        try (FileWriter fw = new FileWriter(outPath)) {
            fw.write("[\n");
            for (int i = 0; i < alerts.size(); i++) {
                Alert a = alerts.get(i);
                fw.write("  {\n");
                fw.write("    \"ipAddress\": \"" + escapeJson(a.getIpAddress()) + "\",\n");
                fw.write("    \"type\": \"" + escapeJson(a.getType()) + "\",\n");
                fw.write("    \"severity\": \"" + escapeJson(a.getSeverity()) + "\"\n");
                fw.write("  }" + (i < alerts.size() - 1 ? "," : "") + "\n");
            }
            fw.write("]\n");
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

