"""Data models for Paper Party."""

from __future__ import annotations

from pydantic import BaseModel


class Paper(BaseModel):
    """A parsed academic paper."""
    id: str
    title: str
    authors: list[str]
    abstract: str
    full_text: str


class ResearchQuestion(BaseModel):
    """The broad research question a paper addresses."""
    question: str
    description: str
    keywords: list[str]


class LiteratureReference(BaseModel):
    """A reference/paper sitting at a table."""
    title: str
    authors: str
    year: str | None = None
    key_argument: str
    stance: str  # e.g. "supports", "challenges", "extends", "proposes alternative"
    summary: str


class Table(BaseModel):
    """A discussion table — a literature stream around a sub-topic."""
    id: str
    name: str
    topic: str
    description: str
    key_debate: str
    references: list[LiteratureReference]


class PartyAnalysis(BaseModel):
    """The full 'party' extracted from a paper."""
    paper_title: str
    broad_question: ResearchQuestion
    paper_contribution: str
    tables: list[Table]


class DialogueMessage(BaseModel):
    """A single message in a table dialogue."""
    role: str  # "user" or a reference name like "Smith et al. (2023)"
    content: str


class DialogueRequest(BaseModel):
    """Request to continue dialogue at a table."""
    table_id: str
    user_message: str
    history: list[DialogueMessage] = []


class DialogueResponse(BaseModel):
    """Response from the table dialogue."""
    messages: list[DialogueMessage]


class PositionRequest(BaseModel):
    """Request to evaluate user's position in the literature."""
    user_viewpoint: str


class PositionAnalysis(BaseModel):
    """Analysis of where user's viewpoint sits in the literature."""
    position_summary: str
    alignment: list[AlignmentItem]
    gaps_and_opportunities: list[str]
    suggested_next_readings: list[str]


class AlignmentItem(BaseModel):
    """How the user's view aligns with a particular table/stream."""
    table_name: str
    relationship: str  # "aligned", "partially aligned", "in tension", "novel"
    explanation: str
