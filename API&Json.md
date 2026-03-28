APIs
  -POST /api/query

Json:
  Sample:
  -request:
      {
        "text": "Show world GDP graph"
      }

  -response:
      {
        "success": true,
        "intent": "market_api",
        "query": "Show world GDP graph",
        "answerText": "Here is the GDP trend.",
        "data": [
          {"x": "2020", "y": -2.9},
          {"x": "2021", "y": 6.3}
          ],
        "sources": [],
        "chart": {
          "type": "line"
        },
        "error": null
      }

Field Notes:
  success: whether the request was successful
  intent: market_api / food_rag / dmv_rag
  query: the user’s original query
  answerText: the text answer displayed to the user
  data: structured data used for charts or lists
  sources: source information, used for RAG responses
  chart: chart configuration
  error: error message or details
