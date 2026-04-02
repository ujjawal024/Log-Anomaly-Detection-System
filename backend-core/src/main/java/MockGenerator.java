import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class MockGenerator implements Runnable {
    private final ApiServer apiServer;
    private final AnomalyDetector detector;
    private final Random random;
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final String[] IPS = {"192.168.1.100", "10.0.0.45", "172.16.0.8", "203.0.113.55"};
    private static final String[] USERS = {"admin", "system", "guest", "db_service"};

    public MockGenerator(ApiServer apiServer, AnomalyDetector detector) {
        this.apiServer = apiServer;
        this.detector = detector;
        this.random = new Random();
    }

    @Override
    public void run() {
        System.out.println("[MockGenerator] Started background thread to simulate traffic.");

        while (true) {
            try {
                // Sleep for 3 seconds to simulate live log traffic rate
                Thread.sleep(3000);

                List<LogEntry> simulatedLogs = new ArrayList<>();
                String ts = LocalDateTime.now().format(TS_FORMAT);

                int chance = random.nextInt(100);

                if (chance < 90) {
                    // 90% chance: Normal log entry (e.g., successful login)
                    String ip = IPS[random.nextInt(IPS.length)];
                    String user = USERS[random.nextInt(USERS.length)];
                    simulatedLogs.add(new LogEntry(ts, ip, user, "LOGIN", "SUCCESS"));
                    
                    // Generate a few random normal activities to avoid empty logs
                    for (int i = 0; i < random.nextInt(3); i++) {
                        simulatedLogs.add(new LogEntry(ts, IPS[random.nextInt(IPS.length)], USERS[random.nextInt(USERS.length)], "FILE_ACCESS", "SUCCESS"));
                    }
                } else {
                    // 10% chance: Simulate brute-force attack (e.g., 6 failed logins from same IP/User)
                    String attackIp = "192.168.1." + (200 + random.nextInt(55));
                    String attackUser = "root";
                    
                    System.out.println("[MockGenerator] Triggering Brute Force Attack Simulation from IP: " + attackIp);

                    for (int i = 0; i < 6; i++) {
                        // All rapid succession, same timestamp for simplicity or slight offset
                        String attackTs = LocalDateTime.now().format(TS_FORMAT);
                        simulatedLogs.add(new LogEntry(attackTs, attackIp, attackUser, "LOGIN", "FAILED"));
                    }
                }

                // Broadcast all raw normal traffic to the frontend
                for (LogEntry entry : simulatedLogs) {
                    Alert normalTraffic = new Alert(
                            entry.getTimestamp(),
                            entry.getIpAddress(),
                            entry.getEventType() + " (" + entry.getStatus() + ")",
                            "Normal",
                            "User: " + entry.getUsername() + " performed " + entry.getEventType()
                    );
                    apiServer.broadcastAlert(normalTraffic);
                }

                // Pass generated LogEntry objects directly to the existing AnomalyDetector class
                List<Alert> alerts = detector.detectAnomalies(simulatedLogs);

                // For each detected alert, trigger the broadcast
                if (alerts != null && !alerts.isEmpty()) {
                    for (Alert alert : alerts) {
                        System.out.println("[MockGenerator] Anomaly detected: " + alert.getType() + " - Broadcasting to clients.");
                        apiServer.broadcastAlert(alert);
                    }
                }

            } catch (InterruptedException e) {
                System.out.println("MockGenerator thread interrupted, stopping.");
                break;
            } catch (Exception e) {
                System.err.println("Error in MockGenerator: " + e.getMessage());
            }
        }
    }
}
