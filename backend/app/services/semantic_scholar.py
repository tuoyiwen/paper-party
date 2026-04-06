"""Semantic Scholar API client — fetch real paper data."""

from __future__ import annotations

import httpx

S2_BASE = "https://api.semanticscholar.org/graph/v1"


async def search_paper(
    title: str,
    api_key: str,
    fields: str = "title,abstract,authors,year,citationCount,url,externalIds",
) -> dict | None:
    """Search for a paper by title and return its metadata."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{S2_BASE}/paper/search",
            params={"query": title, "limit": 1, "fields": fields},
            headers={"x-api-key": api_key},
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if not data.get("data"):
            return None
        return data["data"][0]


async def get_paper_details(
    paper_id: str,
    api_key: str,
    fields: str = "title,abstract,authors,year,citationCount,url,externalIds,tldr",
) -> dict | None:
    """Get detailed info for a specific paper by Semantic Scholar ID."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{S2_BASE}/paper/{paper_id}",
            params={"fields": fields},
            headers={"x-api-key": api_key},
        )
        if resp.status_code != 200:
            return None
        return resp.json()


async def enrich_references(
    references: list[dict],
    api_key: str,
) -> list[dict]:
    """Enrich a list of references with real data from Semantic Scholar.

    Each reference should have at least a 'title' and 'authors' field.
    Returns the same list with added fields: abstract, year, citation_count, url, s2_id.
    """
    enriched = []
    for ref in references:
        title = ref.get("title", "")
        if not title:
            enriched.append(ref)
            continue

        paper = await search_paper(title, api_key)
        if paper:
            ref["abstract"] = paper.get("abstract") or ref.get("abstract", "")
            ref["year"] = paper.get("year") or ref.get("year")
            ref["citation_count"] = paper.get("citationCount", 0)
            ref["url"] = paper.get("url", "")
            ref["s2_id"] = paper.get("paperId", "")
            # Use real authors if available
            authors = paper.get("authors", [])
            if authors:
                author_names = [a.get("name", "") for a in authors[:3]]
                if len(authors) > 3:
                    ref["authors_full"] = ", ".join(author_names) + " et al."
                else:
                    ref["authors_full"] = ", ".join(author_names)
            tldr = paper.get("tldr")
            if tldr and tldr.get("text"):
                ref["tldr"] = tldr["text"]
        enriched.append(ref)

    return enriched
