
public class TestParser {
    public static void main(String[] args) {
        LogParser parser = new LogParser();
        
        String[] samples = {
            "Dec 15 10:20:30 SRV01 sshd[123]: Failed password for invalid user admin from 192.168.1.100 port 22 ssh2",
            "{\"timestamp\": \"2026-03-25 10:00:00\", \"ip\": \"10.0.0.1\", \"user\": \"test\", \"event\": \"login\", \"status\": \"Success\"}",
            "time=2026-03-25T12:00:00 ip=172.16.0.5 user=bob event=query status=failed",
            "Audit Success\t25-03-2026 22:18:34\tMicrosoft-Windows-Security-Auditing\t4624\tLogon\t\"An account was successfully logged on.\n\nAccount Name:\tLAPTOP-BATU66HJ$\nSource Network Address:\t192.168.1.15\""
        };
        
        for (String sample : samples) {
            System.out.println("Input: " + sample.replace("\n", " [NEWLINE] "));
            LogEntry entry = null;
            for (String line : sample.split("\n")) {
                entry = parser.parseLine(line);
            }
            System.out.println("Output: " + (entry != null ? entry.toString() : "NULL"));
            System.out.println("---");
        }
    }
}
