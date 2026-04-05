"""Parse PDF papers into structured text."""

from __future__ import annotations

import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_bytes: bytes) -> dict:
    """Extract title, abstract, and full text from a PDF.

    Returns a dict with keys: title, abstract, full_text.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    full_text_parts: list[str] = []
    for page in doc:
        full_text_parts.append(page.get_text())

    full_text = "\n".join(full_text_parts)

    # Heuristic title extraction: first non-empty line, usually largest font
    title = _extract_title(doc)
    abstract = _extract_abstract(full_text)

    doc.close()
    return {
        "title": title,
        "abstract": abstract,
        "full_text": full_text,
    }


def _extract_title(doc: fitz.Document) -> str:
    """Extract title from first page using font size heuristic."""
    if len(doc) == 0:
        return "Untitled"

    first_page = doc[0]
    blocks = first_page.get_text("dict")["blocks"]

    max_size = 0
    title_text = ""

    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span["size"] > max_size and span["text"].strip():
                    max_size = span["size"]
                    title_text = span["text"].strip()

    return title_text or "Untitled"


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
