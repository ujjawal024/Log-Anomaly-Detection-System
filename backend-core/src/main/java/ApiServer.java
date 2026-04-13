import io.javalin.Javalin;
import io.javalin.websocket.WsContext;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;

public class ApiServer {
    private final Javalin app;
    private final Set<WsContext> activeSessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper mapper = new ObjectMapper();
    public final Set<String> blockedIPs = Collections.newSetFromMap(new ConcurrentHashMap<>());
    public int bruteForceThreshold = 5;

    public ApiServer(int port, AnomalyDetector detector) {
        // Initialize the Javalin server
        app = Javalin.create(config -> {
            // Enable CORS for all origins
            config.plugins.enableCors(cors -> {
                cors.add(it -> it.anyHost());
            });
        }).start(port);

        // Standard REST GET route at /api/alerts
        app.get("/api/alerts", ctx -> {
            ctx.json("[]"); // Returns empty array as placeholder for future database
        });

        // Add an IP to the blocked list (firewall simulation)
        app.post("/api/block/{ip}", ctx -> {
            String ip = ctx.pathParam("ip");
            blockedIPs.add(ip);
            System.out.println("[Firewall] IP Blocked: " + ip);
            ctx.json("{\"success\":true}");
        });

        // Set backend configuration dynamically
        app.post("/api/settings", ctx -> {
            try {
                String body = ctx.body();
                // Simple parsing without complex structure since we know what to expect
                if (body.contains("\"bruteForceThreshold\"")) {
                    String[] parts = body.split("\"bruteForceThreshold\"\\s*:\\s*");
                    if (parts.length > 1) {
                        String val = parts[1].split(",")[0].replaceAll("[^0-9]", "");
                        if (!val.isEmpty()) bruteForceThreshold = Integer.parseInt(val);
                    }
                }
                System.out.println("[Settings] Brute force threshold updated to: " + bruteForceThreshold);
                ctx.json("{\"success\":true}");
            } catch (Exception e) {
                ctx.status(400).json("{\"success\":false}");
            }
        });

        // Dynamic log file upload processing
        app.post("/api/upload", ctx -> {
            try {
                String logContent = ctx.body();
                if (logContent == null || logContent.isEmpty()) {
                    ctx.status(400).result("No content");
                    return;
                }
                
                String[] lines = logContent.split("\\r?\\n");
                LogParser parser = new LogParser();
                List<LogEntry> newLogs = new ArrayList<>();
                for (String line : lines) {
                    LogEntry entry = parser.parseLine(line);
                    if (entry != null && !blockedIPs.contains(entry.getIpAddress())) {
                        newLogs.add(entry);
                        
                        // Blast normal logs dynamically to dashboard
                        Alert normalTraffic = new Alert(
                                entry.getTimestamp(),
                                entry.getIpAddress(),
                                entry.getEventType() + " (" + entry.getStatus() + ")",
                                "Normal",
                                "File Upload - User: " + entry.getUsername() + " performed " + entry.getEventType()
                        );
                        broadcastAlert(normalTraffic);
                    }
                }

                // Temporary override of detector threshold if supported, or just let it detect
                List<Alert> alerts = detector.detectAnomalies(newLogs, bruteForceThreshold);
                for (Alert a : alerts) {
                    if (!blockedIPs.contains(a.getIpAddress())) {
                        broadcastAlert(a);
                    }
                }
                
                ctx.json("{\"logsProcessed\":" + newLogs.size() + ",\"alertsDetected\":" + alerts.size() + "}");
            } catch (Exception e) {
                ctx.status(500).result(e.getMessage());
            }
        });

        // WebSocket endpoint at /ws/alerts
        app.ws("/ws/alerts", ws -> {
            ws.onConnect(ctx -> {
                System.out.println("[WS] Client connected: " + ctx.getSessionId());
                activeSessions.add(ctx);
            });

            ws.onClose(ctx -> {
                System.out.println("[WS] Client disconnected: " + ctx.getSessionId());
                activeSessions.remove(ctx);
            });

            ws.onError(ctx -> {
                System.err.println("[WS] Error with client: " + ctx.getSessionId() + " - " + ctx.error());
                activeSessions.remove(ctx);
            });
        });
    }

    /**
     * Serializes an Alert object to JSON and pushes it to all active WebSocket clients.
     */
    public void broadcastAlert(Alert alert) {
        if (activeSessions.isEmpty()) {
            return; // No connected clients to receive the alert
        }

        try {
            String jsonAlert = mapper.writeValueAsString(alert);
            for (WsContext session : activeSessions) {
                if (session.session.isOpen()) {
                    session.send(jsonAlert);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to serialize or broadcast alert: " + e.getMessage());
        }
    }

    public void stop() {
        if (app != null) {
            app.stop();
        }
    }
}
