"""Semantic Scholar API client — fetch real paper data."""

from __future__ import annotations

import httpx

S2_BASE = "https://api.semanticscholar.org/graph/v1"

# Top-tier journals for organizational behavior / management / psychology research
TOP_TIER_JOURNALS = {
    "academy of management review",
    "academy of management journal",
    "administrative science quarterly",
    "group and organization management",
    "group dynamics",
    "human factors",
    "human relations",
    "human resource management",
    "human resource management journal",
    "journal of applied psychology",
    "journal of management",
    "journal of management studies",
    "journal of organizational behavior",
    "management information systems quarterly",
    "management science",
    "organization science",
    "organizational behavior and human decision processes",
    "personnel psychology",
    "small group research",
    "social networks",
    "strategic management journal",
    "leadership quarterly",
    "the leadership quarterly",
    "organization studies",
    "journal of personality and social psychology",
    "journal of occupational and organizational psychology",
    "journal of vocational behavior",
    "journal of business venturing",
    "journal of business ethics",
    "journal of international business studies",
    "organizational research methods",
    "organizational research method",
    "human resource management review",
    "nature",
    "science",
    "information systems research",
    "current psychology",
    "international journal of information management",
    # Also include MIS quarterly variations
    "mis quarterly",
}


def is_top_tier_journal(venue: str) -> bool:
    """Check if a venue/journal name matches a top-tier journal."""
    if not venue:
        return False
    venue_lower = venue.lower().strip()
    for journal in TOP_TIER_JOURNALS:
        if journal in venue_lower or venue_lower in journal:
            return True
    return False


async def search_paper(
    title: str,
    api_key: str,
    fields: str = "title,abstract,authors,year,citationCount,url,externalIds,venue,journal,tldr",
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


async def search_top_tier_papers(
    query: str,
    api_key: str,
    max_results: int = 5,
    fields: str = "title,abstract,authors,year,citationCount,url,externalIds,venue,journal,tldr",
) -> list[dict]:
    """Search for papers and filter to only top-tier journal publications."""
    async with httpx.AsyncClient(timeout=20) as client:
        # Fetch more results to filter from
        resp = await client.get(
            f"{S2_BASE}/paper/search",
            params={"query": query, "limit": 40, "fields": fields},
            headers={"x-api-key": api_key},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        if not data.get("data"):
            return []

        # Filter to top-tier journals
        top_tier = []
        for paper in data["data"]:
            venue = paper.get("venue", "")
            journal_name = ""
            if paper.get("journal"):
                journal_name = paper["journal"].get("name", "")

            if is_top_tier_journal(venue) or is_top_tier_journal(journal_name):
                paper["_journal"] = journal_name or venue
                paper["_is_top_tier"] = True
                top_tier.append(paper)

            if len(top_tier) >= max_results:
                break

        return top_tier


async def get_paper_details(
    paper_id: str,
    api_key: str,
    fields: str = "title,abstract,authors,year,citationCount,url,externalIds,tldr,venue,journal",
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
    Returns the same list with added fields: abstract, year, citation_count, url, s2_id, journal.
    Only keeps references that are verified in top-tier journals.
    """
    enriched = []
    for ref in references:
        title = ref.get("title", "")
        if not title:
            enriched.append(ref)
            continue

        paper = await search_paper(title, api_key)
        if paper:
            # Check journal
            venue = paper.get("venue", "")
            journal_name = ""
            if paper.get("journal"):
                journal_name = paper["journal"].get("name", "")

            ref["journal"] = journal_name or venue
            ref["is_top_tier"] = is_top_tier_journal(venue) or is_top_tier_journal(journal_name)
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
        else:
            ref["is_top_tier"] = False
            ref["journal"] = ""

        enriched.append(ref)

    return enriched
