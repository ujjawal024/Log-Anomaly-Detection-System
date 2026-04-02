import io.javalin.Javalin;
import io.javalin.websocket.WsContext;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class ApiServer {
    private final Javalin app;
    private final Set<WsContext> activeSessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper mapper = new ObjectMapper();

    public ApiServer(int port) {
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
