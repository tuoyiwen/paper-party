"""Paper Party — Upload a paper. Discover the conversations. Join the table."""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from .models import (
    DialogueMessage,
    DialogueRequest,
    DialogueResponse,
    PartyAnalysis,
    PositionAnalysis,
    PositionRequest,
)
from .services.paper_parser import extract_text_from_pdf
from .services.literature_mapper import analyze_paper
from fastapi.responses import Response

from .services.dialogue_engine import (
    chat_at_table, analyze_position, organize_transcript,
    organize_bilingual_summary, generate_landscape_lr, generate_position_lr,
)
from .services.podcast_generator import generate_podcast

load_dotenv()

app = FastAPI(
    title="Paper Party",
    description="Upload a paper. Discover the conversations. Join the table.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://paper-party.vercel.app",
        "https://paper-party-git-main-tuoyiwens-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File-based persistence for party data
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
PARTIES_FILE = DATA_DIR / "parties.json"

parties: dict[str, PartyAnalysis] = {}


def _load_parties():
    """Load parties from disk on startup."""
    global parties
    if PARTIES_FILE.exists():
        try:
            raw = json.loads(PARTIES_FILE.read_text(encoding="utf-8"))
            parties = {k: PartyAnalysis(**v) for k, v in raw.items()}
        except Exception:
            parties = {}


def _save_parties():
    """Save parties to disk."""
    raw = {k: json.loads(v.model_dump_json()) for k, v in parties.items()}
    PARTIES_FILE.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")


_load_parties()


def _get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
    return key


def _get_s2_api_key() -> str | None:
    return os.getenv("S2_API_KEY")


def _get_openai_api_key() -> str:
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured (needed for podcast TTS)")
    return key


@app.get("/")
async def root():
    return {"message": "Welcome to Paper Party 🎉", "version": "0.1.0"}


@app.post("/api/papers/upload", response_model=PartyAnalysis)
async def upload_paper(file: UploadFile):
    """Upload a PDF paper and get the full party analysis."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Parse PDF
    parsed = extract_text_from_pdf(pdf_bytes)

    # Analyze with Claude + enrich with Semantic Scholar
    api_key = _get_api_key()
    s2_api_key = _get_s2_api_key()
    party = await analyze_paper(
        title=parsed["title"],
        abstract=parsed["abstract"],
        full_text=parsed["full_text"],
        api_key=api_key,
        s2_api_key=s2_api_key,
    )

    # Store for later dialogue (persist to disk)
    party_id = f"party-{uuid.uuid4().hex[:8]}"
    parties[party_id] = party
    _save_parties()

    return party


@app.post("/api/tables/{table_id}/dialogue", response_model=DialogueResponse)
async def dialogue_at_table(table_id: str, request: DialogueRequest):
    """Have a conversation at a specific table."""
    # Find the table across all parties
    table = None
    for party in parties.values():
        for t in party.tables:
            if t.id == table_id:
                table = t
                break
        if table:
            break

    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    api_key = _get_api_key()
    response = await chat_at_table(
        table=table,
        user_message=request.user_message,
        history=request.history,
        api_key=api_key,
    )

    return response


class TranscriptRequest(BaseModel):
    table_name: str
    table_topic: str
    messages: list[DialogueMessage]


class TranscriptResponse(BaseModel):
    markdown: str


@app.post("/api/transcript", response_model=TranscriptResponse)
async def generate_transcript(request: TranscriptRequest):
    """Generate an AI-organized transcript of a table discussion."""
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages to organize")

    api_key = _get_api_key()
    markdown = await organize_transcript(
        table_name=request.table_name,
        table_topic=request.table_topic,
        messages=request.messages,
        api_key=api_key,
    )

    return TranscriptResponse(markdown=markdown)


@app.post("/api/bilingual-summary", response_model=TranscriptResponse)
async def generate_bilingual_summary(request: TranscriptRequest):
    """Generate a bilingual (EN/CN) summary of a table discussion."""
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages to summarize")

    api_key = _get_api_key()
    markdown = await organize_bilingual_summary(
        table_name=request.table_name,
        table_topic=request.table_topic,
        messages=request.messages,
        api_key=api_key,
    )

    return TranscriptResponse(markdown=markdown)


@app.post("/api/podcast")
async def generate_podcast_audio(request: TranscriptRequest):
    """Generate a podcast-style audio from a table discussion."""
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages to convert")

    api_key = _get_api_key()
    openai_key = _get_openai_api_key()

    audio_bytes = await generate_podcast(
        table_name=request.table_name,
        table_topic=request.table_topic,
        messages=request.messages,
        anthropic_api_key=api_key,
        openai_api_key=openai_key,
    )

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={"Content-Disposition": f'attachment; filename="{request.table_name}_podcast.wav"'},
    )


@app.post("/api/literature-review/landscape", response_model=TranscriptResponse)
async def lr_landscape():
    """Generate a landscape literature review from the party analysis."""
    if not parties:
        raise HTTPException(status_code=400, detail="No paper analyzed yet")

    party = list(parties.values())[-1]
    api_key = _get_api_key()
    markdown = await generate_landscape_lr(party=party, api_key=api_key)
    return TranscriptResponse(markdown=markdown)


class PositionLRRequest(BaseModel):
    user_question: str
    discussions: str = ""


@app.post("/api/literature-review/position", response_model=TranscriptResponse)
async def lr_position(request: PositionLRRequest):
    """Generate a position literature review motivating the user's research question."""
    if not parties:
        raise HTTPException(status_code=400, detail="No paper analyzed yet")

    party = list(parties.values())[-1]
    api_key = _get_api_key()
    markdown = await generate_position_lr(
        party=party,
        user_question=request.user_question,
        discussions_text=request.discussions,
        api_key=api_key,
    )
    return TranscriptResponse(markdown=markdown)


@app.post("/api/position", response_model=PositionAnalysis)
async def analyze_my_position(request: PositionRequest):
    """Analyze where the user's viewpoint sits in the literature."""
    if not parties:
        raise HTTPException(status_code=400, detail="No paper analyzed yet")

    # Use the most recent party
    party = list(parties.values())[-1]
    api_key = _get_api_key()

    result = await analyze_position(
        party=party,
        user_viewpoint=request.user_viewpoint,
        api_key=api_key,
    )

    return result
