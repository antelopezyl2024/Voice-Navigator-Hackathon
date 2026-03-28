package org.example.voicenavigator.model;
import java.util.List;
import java.util.Map;

public class QueryResponse {
    private boolean success;
    private String intent; //market_api / food_rag / dmv_rag
    private String query; //the user’s original query
    private String answerText;
    private List<Map<String, Object>> data; //structured data used for charts or lists
    private List<Map<String, Object>> sources; //source information, used for RAG responses
    private Map<String, Object> chart; //chart configuration
    private String error; //error message or details

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }

    public List<Map<String, Object>> getSources() {
        return sources;
    }

    public void setSources(List<Map<String, Object>> sources) {
        this.sources = sources;
    }

    public Map<String, Object> getChart() {
        return chart;
    }

    public void setChart(Map<String, Object> chart) {
        this.chart = chart;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
