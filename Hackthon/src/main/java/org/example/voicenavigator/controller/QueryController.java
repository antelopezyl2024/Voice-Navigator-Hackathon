package org.example.voicenavigator.controller;

import org.example.voicenavigator.service.IntentService;
import org.example.voicenavigator.service.MarketService;
import org.example.voicenavigator.model.QueryRequest;
import org.example.voicenavigator.model.QueryResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class QueryController {

    private final IntentService intentService;
    private final MarketService marketService;

    public QueryController(IntentService intentService, MarketService marketService) {
        this.intentService = intentService;
        this.marketService = marketService;
    }

    @PostMapping("/query")
    public QueryResponse query(@RequestBody QueryRequest request) {
        String text = request.getText();
        String intent = intentService.classifyIntent(text);

        if ("market_api".equals(intent)) {
            return marketService.handleMarketQuery(text);
        }

        QueryResponse response = new QueryResponse();
        response.setSuccess(false);
        response.setIntent(intent);
        response.setQuery(text);
        response.setAnswerText(null);
        response.setData(java.util.Collections.emptyList());
        response.setSources(java.util.Collections.emptyList());
        response.setChart(null);
        response.setError("Only market_api is supported in phase 1.");
        return response;
    }
}
