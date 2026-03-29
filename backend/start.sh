#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
echo "Starting VoiceNavigator RAG Backend..."
echo "First run will download the embedding model and process PDFs (~5-10 min)."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
