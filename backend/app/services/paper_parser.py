"""Parse PDF papers into structured text."""

from __future__ import annotations

import pdfplumber


def extract_text_from_pdf(pdf_bytes: bytes) -> dict:
    """Extract title, abstract, and full text from a PDF.

    Returns a dict with keys: title, abstract, full_text.
    """
    import io

    pdf_file = io.BytesIO(pdf_bytes)
    pdf = pdfplumber.open(pdf_file)

    full_text_parts: list[str] = []
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            full_text_parts.append(text)

    full_text = "\n".join(full_text_parts)

    title = _extract_title(pdf)
    abstract = _extract_abstract(full_text)

    pdf.close()
    return {
        "title": title,
        "abstract": abstract,
        "full_text": full_text,
    }


def _extract_title(pdf: pdfplumber.PDF) -> str:
    """Extract title from first page using font size heuristic."""
    if len(pdf.pages) == 0:
        return "Untitled"

    first_page = pdf.pages[0]
    words = first_page.extract_words(extra_attrs=["size"])

    if not words:
        # Fallback: first line of text
        text = first_page.extract_text()
        if text:
            return text.split("\n")[0].strip()
        return "Untitled"

    # Find the largest font size
    max_size = max(float(w.get("size", 0)) for w in words)

    # Collect words with the largest font size (likely the title)
    title_words = [
        w["text"] for w in words
        if abs(float(w.get("size", 0)) - max_size) < 1.0
    ]

    return " ".join(title_words).strip() or "Untitled"


def _extract_abstract(full_text: str) -> str:
    """Extract abstract section from full text."""
    text_lower = full_text.lower()

    abstract_start = text_lower.find("abstract")
    if abstract_start == -1:
        # Return first 500 chars as fallback
        return full_text[:500].strip()

    # Find end of abstract (next section header or double newline)
    after_abstract = full_text[abstract_start + len("abstract"):]
    # Strip leading whitespace/punctuation
    after_abstract = after_abstract.lstrip(" \n\t.:-–—")

    # Take up to the next section break
    for marker in ["\n\n", "\nIntroduction", "\n1.", "\n1 ", "\nINTRODUCTION", "\nKeywords"]:
        end = after_abstract.find(marker)
        if end != -1:
            return after_abstract[:end].strip()

    return after_abstract[:1000].strip()
