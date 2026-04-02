import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class LogParser {
    // Legacy format
    private static final Pattern LEGACY_PATTERN = Pattern.compile(
            "^\\[(?<ts>[^\\]]+)]\\s+IP=(?<ip>\\S+)\\s+USER=(?<user>\\S+)\\s+EVENT=(?<event>\\S+)\\s+STATUS=(?<status>\\S+)\\s*$"
    );

    // Common IPs
    private static final Pattern IP_PATTERN = Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b");
    
    // Fallback timestamp: [YYYY-MM-DD HH:mm:ss] or YYYY-MM-DD HH:mm:ss or similar
    private static final Pattern TS_PATTERN = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2}\\b");

    private StringBuilder currentBlock = new StringBuilder();
    private boolean insideQuotes = false;

    public LogEntry parseLine(String line) {
        if (line == null) return null;
        
        String trimmed = line.trim();
        if (currentBlock.length() == 0 && trimmed.isEmpty()) return null;

        if (currentBlock.length() > 0) currentBlock.append("\n");
        currentBlock.append(line);
        
        int quoteCount = countQuotes(line);
        if (quoteCount % 2 != 0) insideQuotes = !insideQuotes;
        
        if (insideQuotes) return null;
        
        String fullRow = currentBlock.toString().trim();
        currentBlock.setLength(0);
        
        if (fullRow.isEmpty() || fullRow.startsWith("Keywords")) return null;
        
        // Strategy 1: Legacy Match
        if (fullRow.startsWith("[")) {
            Matcher m = LEGACY_PATTERN.matcher(fullRow);
            if (m.matches()) {
                return new LogEntry(m.group("ts"), m.group("ip"), m.group("user"), m.group("event"), m.group("status"));
            }
        }
        
        // Strategy 2: Windows Event Viewer TSV
        if (fullRow.contains("\t")) {
            String[] parts = fullRow.split("\t");
            if (parts.length >= 5) {
                String keywords = parts[0].trim();
                String ts = parts[1].trim();
                String eventType = parts[4].trim();
                String status = keywords.toLowerCase().contains("success") ? "SUCCESS" : "FAILED";
                if (ts.length() >= 19 && ts.charAt(2) == '-' && ts.charAt(5) == '-') {
                    ts = ts.substring(6, 10) + "-" + ts.substring(3, 5) + "-" + ts.substring(0, 2) + " " + ts.substring(11);
                }
                String user = "unknown";
                String ip = "unknown";

                Matcher mUser = Pattern.compile("Account Name:\\s*([^\\s]+)").matcher(fullRow);
                while (mUser.find()) {
                    String found = mUser.group(1).trim();
                    if (!found.equals("-") && !found.equalsIgnoreCase("SYSTEM")) user = found;
                }
                if (user.endsWith("$")) user = user.substring(0, user.length() - 1);

                Matcher mIp = Pattern.compile("Source Network Address:\\s*([^\\s\"]+)").matcher(fullRow);
                if (mIp.find()) {
                    String found = mIp.group(1).trim();
                    if (!found.equals("-") && !found.equals("::1") && !found.equals("127.0.0.1")) ip = found;
                }
                
                if (ip.endsWith("\"")) ip = ip.substring(0, ip.length() - 1);
                if (user.endsWith("\"")) user = user.substring(0, user.length() - 1);
                
                return new LogEntry(ts, ip, user, eventType, status);
            }
        }
        
        // Strategy 3: JSON Match
        if (fullRow.startsWith("{") && fullRow.endsWith("}")) {
            String ip = extractJsonValue(fullRow, "ip", "client_ip", "src_ip");
            String ts = extractJsonValue(fullRow, "timestamp", "time", "date");
            String user = extractJsonValue(fullRow, "user", "username", "account");
            String eventMatch = extractJsonValue(fullRow, "event", "action", "type");
            String status = extractJsonValue(fullRow, "status", "result", "outcome");
            
            if (!ip.equals("unknown") || !ts.equals("unknown") || !user.equals("unknown")) {
                if (ts.equals("unknown")) ts = extractRegex(fullRow, TS_PATTERN, "unknown");
                return new LogEntry(ts, ip, user, eventMatch, status);
            }
        }
        
        // Strategy 4: Key-Value Match (Splunk/CEF)
        if (fullRow.contains("=") && !fullRow.startsWith("{")) {
            String ip = extractRegex(fullRow, "(?i)(?:ip|clientip|src_ip)=([^\\s,]+)", "unknown");
            String ts = extractRegex(fullRow, "(?i)(?:time|ts|timestamp)=([^\\s,]+)", "unknown");
            String user = extractRegex(fullRow, "(?i)(?:user|username|account)=([^\\s,]+)", "unknown");
            String eventMatch = extractRegex(fullRow, "(?i)(?:event|action|type)=([^\\s,]+)", "unknown");
            String status = extractRegex(fullRow, "(?i)(?:status|result)=([^\\s,]+)", "unknown");
            
            if (ts.equals("unknown")) ts = extractRegex(fullRow, TS_PATTERN, "unknown");

            if (!ip.equals("unknown") || !user.equals("unknown") || !eventMatch.equals("unknown")) {
                return new LogEntry(ts, ip, user, eventMatch, status);
            }
        }
        
        // Strategy 5: Heuristic Regex Fallback
        String ip = extractRegex(fullRow, IP_PATTERN, "unknown");
        String ts = extractRegex(fullRow, TS_PATTERN, "unknown");
        
        // Guess Status
        String lFullRow = fullRow.toLowerCase();
        String status = "UNKNOWN";
        if (lFullRow.contains("success") || lFullRow.contains("200 ") || lFullRow.contains("accepted")) status = "SUCCESS";
        else if (lFullRow.contains("fail") || lFullRow.contains("error") || lFullRow.contains("invalid") || lFullRow.contains("401 ") || lFullRow.contains("403 ")) status = "FAILED";
        
        // Guess User (User X, user=X, for X)
        String user = extractRegex(fullRow, "(?i)(?:user|for|account)\\s*[:=]?\\s*([a-zA-Z0-9_.-]+)", "unknown");
        if (user.equalsIgnoreCase("unknown") && lFullRow.contains("root")) user = "root";
        if (user.equalsIgnoreCase("unknown") && lFullRow.contains("admin")) user = "admin";
        
        // Guess Event Type
        String event = "UNKNOWN";
        if (lFullRow.contains("login") || lFullRow.contains("session") || lFullRow.contains("auth")) event = "AUTH";
        else if (lFullRow.contains("query") || lFullRow.contains("select") || lFullRow.contains("sql")) event = "DATABASE";
        else if (lFullRow.contains("get /") || lFullRow.contains("post /")) event = "HTTP_REQUEST";
        
        return new LogEntry(ts, ip, user, event, status);
    }
    
    private String extractJsonValue(String json, String... keys) {
        for (String key : keys) {
            Matcher m = Pattern.compile("(?i)\"" + key + "\"\\s*:\\s*\"([^\"]+)\"").matcher(json);
            if (m.find()) return m.group(1);
            m = Pattern.compile("(?i)\"" + key + "\"\\s*:\\s*([0-9]+)").matcher(json);
            if (m.find()) return m.group(1);
        }
        return "unknown";
    }

    private String extractRegex(String text, String regex, String def) {
        Matcher m = Pattern.compile(regex).matcher(text);
        if (m.find()) return m.group(m.groupCount() > 0 ? 1 : 0);
        return def;
    }

    private String extractRegex(String text, Pattern pattern, String def) {
        Matcher m = pattern.matcher(text);
        if (m.find()) return m.group(m.groupCount() > 0 ? 1 : 0);
        return def;
    }

    private int countQuotes(String s) {
        int count = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '"') count++;
        }
        return count;
    }
}
