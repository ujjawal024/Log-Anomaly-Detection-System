import java.util.List;

public class Main {

    public static void main(String[] args) {
        System.out.println("Starting Log Anomaly Detection Server...");
        
        // Create AnomalyDetector instance
        AnomalyDetector detector = new AnomalyDetector();
        
        // Start Javalin HTTP/WS Server on port 8080
        ApiServer apiServer = new ApiServer(8080, detector);
        System.out.println("ApiServer started on http://localhost:8080");

        // Start background mock traffic generator
        MockGenerator mockGenerator = new MockGenerator(apiServer, detector);
        Thread mockThread = new Thread(mockGenerator);
        mockThread.setDaemon(true);
        mockThread.start();

        // Optional legacy log processing via command-line arguments
        if (args.length > 0) {
            String filePath = args[0];
            System.out.println("Processing local file: " + filePath);
            LogParser parser = new LogParser();
            LogService service = new LogService(parser);

            List<LogEntry> logs = service.processFile(filePath);
            List<Alert> alerts = detector.detectAnomalies(logs, 5);

            System.out.println("Total Logs: " + logs.size());
            System.out.println("Alerts Detected: " + alerts.size());
            System.out.println();

            for (Alert a : alerts) {
                System.out.print(a.toString());
                System.out.println();
                apiServer.broadcastAlert(a);
            }
        } else {
            System.out.println("No local file provided. Running in Real-time Mock Mode only.");
        }
    }
}

