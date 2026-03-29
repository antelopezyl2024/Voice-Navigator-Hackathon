package org.example.voicenavigator.service;
import org.example.voicenavigator.model.QueryResponse;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class MarketService {

    private final RestTemplate restTemplate;

    public MarketService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public QueryResponse handleMarketQuery(String query) {
        QueryResponse response = new QueryResponse();
        response.setSuccess(true);
        response.setIntent("market_api");
        response.setQuery(query);

        try {
            String indicator = resolveIndicator(query);
            String url = "https://api.worldbank.org/v2/country/WLD/indicator/"
                    + indicator + "?format=json&per_page=100";

            Object raw = restTemplate.getForObject(url, Object.class);

            List<Map<String, Object>> chartData = extractChartData(raw);

            response.setAnswerText("Here is the result.");
            response.setData(chartData);

            Map<String, Object> chart = new HashMap<>();
            chart.put("type", "line");
            chart.put("xLabel", "Year");
            chart.put("yLabel", "Value");
            response.setChart(chart);

            Map<String, Object> source = new HashMap<>();
            source.put("name", "World Bank API");
            source.put("type", "api");
            response.setSources(List.of(source));

            response.setError(null);

        } catch (Exception e) {
            response.setSuccess(false);
            response.setAnswerText(null);
            response.setData(Collections.emptyList());
            response.setSources(Collections.emptyList());
            response.setChart(null);
            response.setError(e.getMessage());
        }

        return response;
    }

    private String resolveIndicator(String query) {
        String q = query.toLowerCase();

        if (q.contains("gdp")) {
            return "NY.GDP.MKTP.KD.ZG";
        }
        if (q.contains("co2") || q.contains("carbon")) {
            return "EN.GHG.CO2.AG.MT.CE.AR5";
        }
        if (q.contains("agri") || q.contains("agricultural") || q.contains("land")) {
            return "AG.LND.AGRI.ZS";
        }

        return "NY.GDP.MKTP.KD.ZG";
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractChartData(Object raw) {
        List<Map<String, Object>> result = new ArrayList<>();

        if (!(raw instanceof List<?> rawList) || rawList.size() < 2) {
            return result;
        }

        Object dataPart = rawList.get(1);
        if (!(dataPart instanceof List<?> entries)) {
            return result;
        }

        for (Object entryObj : entries) {
            if (!(entryObj instanceof Map<?, ?> entry)) {
                continue;
            }

            Object date = entry.get("date");
            Object value = entry.get("value");

            if (date != null && value != null) {
                Map<String, Object> point = new HashMap<>();
                point.put("x", date.toString());
                point.put("y", value);
                result.add(point);
            }
        }

        Collections.reverse(result);
        return result;
    }
}
