"""Map a paper to its literature landscape using Claude."""

from __future__ import annotations

import json
import uuid

import anthropic

from ..models import LiteratureReference, PartyAnalysis, ResearchQuestion, Table
from .semantic_scholar import enrich_references

ANALYSIS_PROMPT = """You are an expert academic research analyst. You are helping a researcher understand the "conversation" happening in the academic literature around a paper they uploaded.

Think of the academic literature as a **party** (学术舞会). The paper belongs to a broad research conversation (the party theme), and within that conversation there are different **tables** (讨论桌) — each table is a distinct literature stream or sub-debate.

Given the following paper, please analyze it and return a JSON object with this exact structure:

{{
  "paper_title": "the paper's title",
  "broad_question": {{
    "question": "The broad research question this literature addresses",
    "description": "A 2-3 sentence explanation of why this question matters",
    "keywords": ["keyword1", "keyword2", ...]
  }},
  "paper_contribution": "A concise summary of what THIS paper specifically contributes to the conversation",
  "tables": [
    {{
      "name": "Short name for this discussion table (e.g. 'The Scalability Debate')",
      "topic": "The specific sub-question this table discusses",
      "description": "What this stream of literature is about and why it matters",
      "key_debate": "The central tension or disagreement at this table",
      "consensus": "What do most papers at this table AGREE on? What is the common ground?",
      "differences": "Where do papers DISAGREE? What are the key points of contention, different methodologies, or conflicting findings?",
      "references": [
        {{
          "title": "Referenced paper title",
          "authors": "Author names",
          "year": "publication year if known",
          "key_argument": "The main argument this paper makes",
          "stance": "supports | challenges | extends | proposes alternative",
          "summary": "2-3 sentence summary of this paper's contribution"
        }}
      ]
    }}
  ]
}}

IMPORTANT RULES:
1. Identify 3-6 distinct tables (literature streams).
2. Each table should have 2-5 key references drawn from the paper's citations.
3. One table should represent the direct conversation the uploaded paper participates in.
4. Other tables should represent adjacent but distinct debates that connect to the broad question.
5. Make the "key_debate" vivid — frame it as an actual intellectual tension, not just a topic.
6. The references should represent REAL papers cited in the text. Extract actual author names and titles when possible.
7. "consensus" should describe what the papers at this table fundamentally agree on.
8. "differences" should describe the specific disagreements, methodological divides, or conflicting evidence.
9. Return ONLY valid JSON, no markdown code fences.

---

PAPER TITLE: {title}

ABSTRACT: {abstract}

FULL TEXT (truncated):
{full_text}
"""


async def analyze_paper(
    title: str,
    abstract: str,
    full_text: str,
    api_key: str,
    s2_api_key: str | None = None,
) -> PartyAnalysis:
    """Analyze a paper and map its literature landscape."""
    # Truncate full text to fit context window
    max_text_len = 80000
    truncated_text = full_text[:max_text_len]

    prompt = ANALYSIS_PROMPT.format(
        title=title,
        abstract=abstract,
        full_text=truncated_text,
    )

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text

    # Parse JSON from response
    data = json.loads(response_text)

    # Build structured result
    tables = []
    for t in data["tables"]:
        ref_dicts = t["references"]

        # Enrich references with Semantic Scholar data
        if s2_api_key:
            ref_dicts = await enrich_references(ref_dicts, s2_api_key)

        refs = [
            LiteratureReference(
                title=r.get("title", ""),
                authors=r.get("authors", ""),
                year=str(r["year"]) if r.get("year") else None,
                key_argument=r.get("key_argument", ""),
                stance=r.get("stance", ""),
                summary=r.get("summary", ""),
                abstract=r.get("abstract"),
                citation_count=r.get("citation_count"),
                url=r.get("url"),
                s2_id=r.get("s2_id"),
                authors_full=r.get("authors_full"),
                tldr=r.get("tldr"),
            )
            for r in ref_dicts
        ]
        tables.append(Table(
            id=f"table-{uuid.uuid4().hex[:8]}",
            name=t["name"],
            topic=t["topic"],
            description=t["description"],
            key_debate=t["key_debate"],
            consensus=t.get("consensus"),
            differences=t.get("differences"),
            references=refs,
        ))

    return PartyAnalysis(
        paper_title=data["paper_title"],
        broad_question=ResearchQuestion(**data["broad_question"]),
        paper_contribution=data["paper_contribution"],
        tables=tables,
    )
