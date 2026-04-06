"""Paper Party — Upload a paper. Discover the conversations. Join the table."""

from __future__ import annotations

import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    DialogueRequest,
    DialogueResponse,
    PartyAnalysis,
    PositionAnalysis,
    PositionRequest,
)
from .services.paper_parser import extract_text_from_pdf
from .services.literature_mapper import analyze_paper
from .services.dialogue_engine import chat_at_table, analyze_position

load_dotenv()

app = FastAPI(
    title="Paper Party",
    description="Upload a paper. Discover the conversations. Join the table.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (replace with DB for production)
parties: dict[str, PartyAnalysis] = {}


def _get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
    return key


def _get_s2_api_key() -> str | None:
    return os.getenv("S2_API_KEY")


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

    # Store for later dialogue
    party_id = f"party-{uuid.uuid4().hex[:8]}"
    parties[party_id] = party

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
