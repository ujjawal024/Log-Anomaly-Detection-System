import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class LogService {
    private final LogParser parser;

    public LogService(LogParser parser) {
        this.parser = parser;
    }

    public List<LogEntry> processFile(String filePath) {
        List<LogEntry> logs = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;
            while ((line = br.readLine()) != null) {
                try {
                    LogEntry entry = parser.parseLine(line);
                    if (entry != null) {
                        logs.add(entry);
                    }
                } catch (Exception ignored) {
                    // skip malformed line
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + e.getMessage(), e);
        }

        return logs;
    }
}

