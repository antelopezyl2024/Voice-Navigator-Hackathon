import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
from groq import Groq
import os

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

import rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading RAG indexes (this may take a few minutes on first run)...")
    rag.load_indexes()
    print("All indexes ready.")
    yield


app = FastAPI(title="VoiceNavigator RAG API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve extracted images as static files at /images/<filename>
app.mount("/images", StaticFiles(directory=str(rag.IMAGES_DIR)), name="images")


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    question: str
    image_urls: List[str] = []
    source_pages: List[int] = []
    source_docs: List[str] = []


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")
    try:
        transcription = groq_client.audio.transcriptions.create(
            file=(file.filename or "audio.m4a", audio_bytes),
            model="whisper-large-v3",
            response_format="text",
            language="en",
            temperature=0.0,
            prompt="DMV, California driver handbook, traffic signs, speed limit, BAC, blood alcohol, right-of-way, food security, FAO, SOFI, undernourishment, malnutrition, ESG, CO2, carbon emissions, World Bank, GDP",
        )
        text = transcription if isinstance(transcription, str) else transcription.text
        text = text.strip()
        print(f"Transcribed: '{text}'")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "food_chunks": len(rag.food_chunks),
        "dmv_chunks": len(rag.dmv_chunks),
        "food_images": sum(len(v) for v in rag.food_page_images.values()),
        "dmv_images": sum(len(v) for v in rag.dmv_page_images.values()),
    }


@app.post("/query/food", response_model=QueryResponse)
def query_food(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if rag.food_index is None:
        raise HTTPException(status_code=503, detail="Food Security index not loaded")
    answer, image_filenames, source_pages, source_docs = rag.query_rag(
        rag.food_index, rag.food_chunks, rag.food_chunk_pages, rag.food_page_images, req.question,
        chunk_sources=rag.food_chunk_sources
    )
    image_urls = [f"/images/{fn}" for fn in image_filenames]
    return QueryResponse(answer=answer, question=req.question, image_urls=image_urls,
                         source_pages=[p+1 for p in source_pages], source_docs=source_docs)


@app.post("/query/dmv", response_model=QueryResponse)
def query_dmv(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if rag.dmv_index is None:
        raise HTTPException(status_code=503, detail="DMV index not loaded")
    answer, image_filenames, source_pages, source_docs = rag.query_rag(
        rag.dmv_index, rag.dmv_chunks, rag.dmv_chunk_pages, rag.dmv_page_images, req.question,
        chunk_sources=rag.dmv_chunk_sources
    )
    image_urls = [f"/images/{fn}" for fn in image_filenames]
    return QueryResponse(answer=answer, question=req.question, image_urls=image_urls,
                         source_pages=[p+1 for p in source_pages], source_docs=source_docs)
