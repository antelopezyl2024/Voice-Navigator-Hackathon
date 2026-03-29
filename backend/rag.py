import os
import pickle
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict, Optional

import fitz  # PyMuPDF
from pdfminer.high_level import extract_pages as pdfminer_extract_pages
from pdfminer.layout import LTTextContainer
from sentence_transformers import SentenceTransformer
import faiss
from groq import Groq

PDF_DIR = Path(__file__).parent.parent

FOOD_PDFS = [
    PDF_DIR / "cc3017en.pdf",
    PDF_DIR / "cd1254en.pdf",
]
DMV_PDFS = [
    PDF_DIR / "8-11-25-DL-600-R6-2025-WWW.pdf",
]

PDF_DISPLAY_NAMES = {
    "cc3017en": "SOFI 2024 Report",
    "cd1254en": "SOFI 2025 Report",
    "8-11-25-DL-600-R6-2025-WWW": "CA Driver's Handbook",
}

CHUNK_SIZE = 150
CHUNK_OVERLAP = 30
MIN_IMAGE_SIZE = 80  # pixels — skip tiny icons/decorations

model = SentenceTransformer("all-MiniLM-L6-v2")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

IMAGES_DIR = Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)


# ── Image extraction ──────────────────────────────────────────────────────────

def extract_pdf_images(pdf_path: Path, prefix: str) -> Dict[int, List[str]]:
    """Extract images from each page. Returns {page_num: [relative_image_filenames]}."""
    page_images: Dict[int, List[str]] = {}
    try:
        doc = fitz.open(str(pdf_path))
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            page_images[page_num] = []
            seen_xrefs = set()
            for img in image_list:
                xref = img[0]
                if xref in seen_xrefs:
                    continue
                seen_xrefs.add(xref)
                try:
                    base_image = doc.extract_image(xref)
                    w, h = base_image.get("width", 0), base_image.get("height", 0)
                    if w < MIN_IMAGE_SIZE or h < MIN_IMAGE_SIZE:
                        continue
                    ext = base_image.get("ext", "png")
                    filename = f"{prefix}_p{page_num}_x{xref}.{ext}"
                    img_path = IMAGES_DIR / filename
                    if not img_path.exists():
                        with open(img_path, "wb") as f:
                            f.write(base_image["image"])
                    page_images[page_num].append(filename)
                except Exception:
                    continue
        doc.close()
        total = sum(len(v) for v in page_images.values())
        print(f"  → {total} images extracted from {pdf_path.name}")
    except Exception as e:
        print(f"  Warning: image extraction failed for {pdf_path.name}: {e}")
    return page_images


# ── Text chunking with page tracking ─────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i: i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 50]


def extract_pages(pdf_path: Path):
    """Yield (page_num, text) for each page using pdfminer."""
    try:
        for page_num, page_layout in enumerate(pdfminer_extract_pages(str(pdf_path))):
            page_text = ""
            for element in page_layout:
                if isinstance(element, LTTextContainer):
                    page_text += element.get_text()
            yield page_num, page_text
    except Exception as e:
        print(f"  Error reading pages from {pdf_path}: {e}")


# ── Index building ────────────────────────────────────────────────────────────

def build_index(pdf_paths: List[Path], name: str) -> Tuple[faiss.IndexFlatL2, List[str], List[int], Dict[int, List[str]], List[str]]:
    """
    Returns:
        index          – FAISS index
        all_chunks     – list of chunk texts
        chunk_pages    – list of page numbers (parallel to all_chunks)
        all_page_imgs  – merged {page_num: [image filenames]}
        chunk_sources  – list of friendly PDF names (parallel to all_chunks)
    """
    all_chunks: List[str] = []
    chunk_pages: List[int] = []
    chunk_sources: List[str] = []
    all_page_imgs: Dict[int, List[str]] = {}
    page_offset = 0

    for pdf_path in pdf_paths:
        if not pdf_path.exists():
            print(f"Warning: {pdf_path} not found, skipping.")
            continue
        print(f"Processing {pdf_path.name}...")
        display_name = PDF_DISPLAY_NAMES.get(pdf_path.stem, pdf_path.stem)

        # Extract images
        prefix = pdf_path.stem.replace(" ", "_")[:20]
        page_imgs = extract_pdf_images(pdf_path, prefix)
        for pg, imgs in page_imgs.items():
            all_page_imgs[pg + page_offset] = imgs

        # Extract text per page
        pdf_chunks_count = 0
        for page_num, page_text in extract_pages(pdf_path):
            chunks = chunk_text(page_text)
            all_chunks.extend(chunks)
            chunk_pages.extend([page_num + page_offset] * len(chunks))
            chunk_sources.extend([display_name] * len(chunks))
            pdf_chunks_count += len(chunks)

        # Update page offset for next PDF
        try:
            doc = fitz.open(str(pdf_path))
            page_offset += len(doc)
            doc.close()
        except Exception:
            page_offset += 200  # fallback

        print(f"  → {pdf_chunks_count} text chunks extracted")

    if not all_chunks:
        raise ValueError("No text could be extracted from PDFs")

    print(f"Generating embeddings for {len(all_chunks)} chunks...")
    embeddings = model.encode(all_chunks, show_progress_bar=True, batch_size=32)
    embeddings = np.array(embeddings, dtype="float32")

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    print(f"FAISS index built: {index.ntotal} vectors (dim={embeddings.shape[1]})")
    return index, all_chunks, chunk_pages, all_page_imgs, chunk_sources


# ── RAG query ─────────────────────────────────────────────────────────────────

def query_rag(
    index: faiss.IndexFlatL2,
    chunks: List[str],
    chunk_pages: List[int],
    page_images: Dict[int, List[str]],
    question: str,
    chunk_sources: Optional[List[str]] = None,
    top_k: int = 8,
) -> Tuple[str, List[str], List[int], List[str]]:
    """Returns (answer_text, list_of_image_filenames, source_pages, source_docs)."""
    q_embedding = model.encode([question], show_progress_bar=False)
    q_embedding = np.array(q_embedding, dtype="float32")

    distances, indices = index.search(q_embedding, top_k)
    valid_indices = [i for i in indices[0] if i < len(chunks)]
    relevant_chunks = [chunks[i] for i in valid_indices]
    relevant_pages = list(dict.fromkeys(chunk_pages[i] for i in valid_indices))
    source_docs = list(dict.fromkeys(
        chunk_sources[i] for i in valid_indices if chunk_sources and i < len(chunk_sources)
    )) if chunk_sources else []

    context = "\n\n---\n\n".join(relevant_chunks)

    prompt = f"""You are a helpful assistant that answers questions based on the provided document excerpts.
Use ONLY the information from the excerpts below. Synthesize a clear, complete answer from the relevant parts.
If the excerpts contain partial information, use all relevant parts to form the best possible answer.
Only say "not available" if the topic is completely absent from the excerpts.

Document excerpts:
{context}

Question: {question}

Answer:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = response.choices[0].message.content

    # Collect images from top-3 most relevant pages (avoid flooding)
    image_filenames: List[str] = []
    for pg in relevant_pages[:3]:
        image_filenames.extend(page_images.get(pg, []))

    return answer, image_filenames, relevant_pages, source_docs


# ── Singletons ────────────────────────────────────────────────────────────────

food_index: Optional[faiss.IndexFlatL2] = None
food_chunks: List[str] = []
food_chunk_pages: List[int] = []
food_page_images: Dict[int, List[str]] = {}
food_chunk_sources: List[str] = []

dmv_index: Optional[faiss.IndexFlatL2] = None
dmv_chunks: List[str] = []
dmv_chunk_pages: List[int] = []
dmv_page_images: Dict[int, List[str]] = {}
dmv_chunk_sources: List[str] = []

CACHE_DIR = Path(__file__).parent / ".cache"


def _save_cache(name: str, index, chunks, chunk_pages, page_images, chunk_sources):
    CACHE_DIR.mkdir(exist_ok=True)
    faiss.write_index(index, str(CACHE_DIR / f"{name}.faiss"))
    with open(CACHE_DIR / f"{name}.pkl", "wb") as f:
        pickle.dump({"chunks": chunks, "chunk_pages": chunk_pages, "page_images": page_images, "chunk_sources": chunk_sources}, f)


def _load_cache(name: str):
    idx_path = CACHE_DIR / f"{name}.faiss"
    pkl_path = CACHE_DIR / f"{name}.pkl"
    if idx_path.exists() and pkl_path.exists():
        index = faiss.read_index(str(idx_path))
        with open(pkl_path, "rb") as f:
            data = pickle.load(f)
        if isinstance(data, list) or "chunk_sources" not in data:
            return None, None, None, None, None
        return index, data["chunks"], data["chunk_pages"], data["page_images"], data["chunk_sources"]
    return None, None, None, None, None


def load_indexes():
    global food_index, food_chunks, food_chunk_pages, food_page_images, food_chunk_sources
    global dmv_index, dmv_chunks, dmv_chunk_pages, dmv_page_images, dmv_chunk_sources

    food_index, food_chunks, food_chunk_pages, food_page_images, food_chunk_sources = _load_cache("food")
    if food_index is None:
        print("Building Food Security index...")
        food_index, food_chunks, food_chunk_pages, food_page_images, food_chunk_sources = build_index(FOOD_PDFS, "food")
        _save_cache("food", food_index, food_chunks, food_chunk_pages, food_page_images, food_chunk_sources)
    else:
        print(f"Loaded Food Security index from cache ({food_index.ntotal} vectors, {sum(len(v) for v in food_page_images.values())} images)")

    dmv_index, dmv_chunks, dmv_chunk_pages, dmv_page_images, dmv_chunk_sources = _load_cache("dmv")
    if dmv_index is None:
        print("Building DMV index...")
        dmv_index, dmv_chunks, dmv_chunk_pages, dmv_page_images, dmv_chunk_sources = build_index(DMV_PDFS, "dmv")
        _save_cache("dmv", dmv_index, dmv_chunks, dmv_chunk_pages, dmv_page_images, dmv_chunk_sources)
    else:
        print(f"Loaded DMV index from cache ({dmv_index.ntotal} vectors, {sum(len(v) for v in dmv_page_images.values())} images)")
