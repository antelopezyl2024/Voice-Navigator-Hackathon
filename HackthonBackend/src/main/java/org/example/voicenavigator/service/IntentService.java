package org.example.voicenavigator.service;
import org.springframework.stereotype.Service;

@Service
public class IntentService {

    public String classifyIntent(String text) {
        if (text == null || text.isBlank()) {
            return "unknown";
        }

        String q = text.toLowerCase();

        if (q.contains("gdp") || q.contains("co2") || q.contains("carbon") ||
                q.contains("agri") || q.contains("agricultural") || q.contains("land")) {
            return "market_api";
        }

        if (q.contains("food") || q.contains("hunger") || q.contains("malnutrition")) {
            return "food_rag";
        }

        if (q.contains("dmv") || q.contains("bac") || q.contains("sign") || q.contains("license")) {
            return "dmv_rag";
        }

        return "unknown";
    }
}
