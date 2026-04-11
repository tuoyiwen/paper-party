"""Map a paper to its literature landscape using Claude."""

from __future__ import annotations

import json
import re
import uuid

import anthropic

from ..models import LiteratureReference, PartyAnalysis, ResearchQuestion, Table
from .semantic_scholar import enrich_references, search_top_tier_papers


def _extract_json(text: str) -> dict:
    """Extract JSON from a response that may contain markdown fences or extra text."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try removing markdown code fences
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding the first { ... } block
    start = text.find("{")
    if start != -1:
        # Find matching closing brace
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start:i + 1])
                    except json.JSONDecodeError:
                        break

    raise ValueError(f"Could not extract valid JSON from response: {text[:200]}...")

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
2. Each table should have 3-8 key references. Be COMPREHENSIVE — extract references from ALL sections:
   - Introduction (foundational references that frame the problem)
   - Theoretical Background / Literature Review (core theoretical papers)
   - Discussion (papers compared to, built upon, or challenged)
   - Conclusion (suggested future directions and related work)
3. One table should represent the direct conversation the uploaded paper participates in.
4. Other tables should represent adjacent but distinct debates that connect to the broad question.
5. Make the "key_debate" vivid — frame it as an actual intellectual tension, not just a topic.
6. The references MUST be REAL papers cited in the text. Extract EXACT author names and paper titles as they appear in the reference list.
7. For each reference, include the EXACT year of publication.
8. "consensus" should describe what the papers at this table fundamentally agree on.
9. "differences" should describe the specific disagreements, methodological divides, or conflicting evidence.
10. Return ONLY valid JSON, no markdown code fences.

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
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text

    # Parse JSON from response — handle markdown fences and extra text
    data = _extract_json(response_text)

    # Build structured result
    tables = []
    for t in data["tables"]:
        ref_dicts = t["references"]

        # Enrich references with Semantic Scholar data
        if s2_api_key:
            ref_dicts = await enrich_references(ref_dicts, s2_api_key)

            # Replace non-top-tier refs with top-tier papers on the same topic
            top_tier_refs = [r for r in ref_dicts if r.get("is_top_tier")]
            non_top_tier = [r for r in ref_dicts if not r.get("is_top_tier")]

            if non_top_tier:
                # Search for top-tier replacements for this table's topic
                replacements = await search_top_tier_papers(
                    t["topic"], s2_api_key, max_results=len(non_top_tier)
                )
                for repl in replacements:
                    authors = repl.get("authors", [])
                    author_names = [a.get("name", "") for a in authors[:3]]
                    author_str = ", ".join(author_names)
                    if len(authors) > 3:
                        author_str += " et al."

                    tldr_text = ""
                    if repl.get("tldr") and repl["tldr"].get("text"):
                        tldr_text = repl["tldr"]["text"]

                    top_tier_refs.append({
                        "title": repl.get("title", ""),
                        "authors": author_str,
                        "authors_full": author_str,
                        "year": repl.get("year"),
                        "key_argument": tldr_text or repl.get("abstract", "")[:200],
                        "stance": "extends",
                        "summary": repl.get("abstract", "")[:300] if repl.get("abstract") else "",
                        "abstract": repl.get("abstract", ""),
                        "citation_count": repl.get("citationCount", 0),
                        "url": repl.get("url", ""),
                        "s2_id": repl.get("paperId", ""),
                        "tldr": tldr_text,
                        "journal": repl.get("_journal", ""),
                        "is_top_tier": True,
                    })

                ref_dicts = top_tier_refs if top_tier_refs else ref_dicts

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
                journal=r.get("journal"),
                is_top_tier=r.get("is_top_tier"),
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
