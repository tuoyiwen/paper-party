"""Dialogue engine — have conversations with literature tables."""

from __future__ import annotations

from ..models import (
    DialogueMessage,
    DialogueResponse,
    PositionAnalysis,
    AlignmentItem,
    PartyAnalysis,
    Table,
)
from .llm_client import chat_completion
import json
import re


def _extract_json(text: str) -> dict:
    """Extract JSON from a response that may contain markdown fences or extra text."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    start = text.find("{")
    if start != -1:
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

    raise ValueError(f"Could not extract JSON: {text[:200]}...")

TABLE_DIALOGUE_SYSTEM = """You are simulating a scholarly discussion at a table in an academic "party" (学术舞会).

This table is called "{table_name}" and the discussion topic is: {table_topic}

The key debate at this table: {key_debate}

Consensus at this table: {consensus}

Key differences: {differences}

The following scholars/papers are sitting at this table:
{references_description}

YOUR ROLE:
- You simulate the perspectives of the papers at this table.
- When the user shares a viewpoint, different papers should respond from their established positions.
- Each paper's response should be prefixed with their citation (e.g. "Smith et al. (2023):").
- Papers can agree, disagree, ask for clarification, or build on the user's point.
- Keep the tone scholarly but engaging — like a lively academic dinner conversation.
- Be specific: reference actual findings, methods, or theoretical frameworks from the papers.
- If the user asks a question, have the most relevant paper(s) answer.
- Responses should feel like a real multi-party conversation, not a lecture.
- Keep each paper's response to 2-4 sentences to maintain conversational flow.
- Respond in the SAME LANGUAGE the user uses (if they write in Chinese, respond in Chinese).
"""

POSITION_ANALYSIS_SYSTEM = """You are an expert academic positioning analyst. A researcher has been exploring a literature landscape (an academic "party") and wants to understand where their viewpoint fits.

Here is the full party analysis:
{party_json}

The researcher's viewpoint:
"{user_viewpoint}"

Analyze where this viewpoint sits in the literature. Return a JSON object:

{{
  "position_summary": "A clear paragraph explaining where this viewpoint sits in the broader conversation",
  "alignment": [
    {{
      "table_name": "name of the table",
      "relationship": "aligned | partially aligned | in tension | novel",
      "explanation": "How the viewpoint relates to this table's discussion"
    }}
  ],
  "gaps_and_opportunities": ["gap1", "gap2"],
  "suggested_next_readings": ["reading1", "reading2"]
}}

Respond in the SAME LANGUAGE as the user's viewpoint. Return ONLY valid JSON.
"""


def _build_references_description(table: Table) -> str:
    parts = []
    for ref in table.references:
        desc = (
            f"- {ref.authors} ({ref.year or 'n.d.'}): \"{ref.title}\"\n"
            f"  Stance: {ref.stance}\n"
            f"  Key argument: {ref.key_argument}\n"
            f"  Summary: {ref.summary}"
        )
        # Add real abstract from Semantic Scholar if available
        if ref.abstract:
            desc += f"\n  Real abstract: {ref.abstract[:500]}"
        if ref.tldr:
            desc += f"\n  TL;DR: {ref.tldr}"
        parts.append(desc)
    return "\n\n".join(parts)


async def chat_at_table(
    table: Table,
    user_message: str,
    history: list[DialogueMessage],
    api_key: str,
) -> DialogueResponse:
    """Have a conversation at a specific table."""
    system_prompt = TABLE_DIALOGUE_SYSTEM.format(
        table_name=table.name,
        table_topic=table.topic,
        key_debate=table.key_debate,
        consensus=table.consensus or "Not yet identified",
        differences=table.differences or "Not yet identified",
        references_description=_build_references_description(table),
    )

    # Build message history
    messages = []
    for msg in history:
        if msg.role == "user":
            messages.append({"role": "user", "content": msg.content})
        else:
            messages.append({"role": "assistant", "content": msg.content})

    messages.append({"role": "user", "content": user_message})

    response_text = await chat_completion(
        messages=messages,
        api_key=api_key,
        system=system_prompt,
        max_tokens=2048,
    )

    # Parse multi-speaker response into individual messages
    dialogue_messages = _parse_multi_speaker_response(response_text)

    return DialogueResponse(messages=dialogue_messages)


def _parse_multi_speaker_response(text: str) -> list[DialogueMessage]:
    """Parse a response that may contain multiple speaker turns."""
    messages = []
    current_speaker = None
    current_lines: list[str] = []

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue

        # Check if line starts with a citation pattern like "Author et al. (2023):"
        if ":" in line and ("et al." in line.split(":")[0] or "(" in line.split(":")[0]):
            # Save previous speaker's message
            if current_speaker and current_lines:
                messages.append(DialogueMessage(
                    role=current_speaker,
                    content="\n".join(current_lines),
                ))
            colon_idx = line.index(":")
            current_speaker = line[:colon_idx].strip()
            remaining = line[colon_idx + 1:].strip()
            current_lines = [remaining] if remaining else []
        else:
            current_lines.append(line)

    # Don't forget the last speaker
    if current_speaker and current_lines:
        messages.append(DialogueMessage(
            role=current_speaker,
            content="\n".join(current_lines),
        ))

    # Fallback: if parsing didn't work, return as single message
    if not messages:
        messages.append(DialogueMessage(
            role="table",
            content=text,
        ))

    return messages


async def analyze_position(
    party: PartyAnalysis,
    user_viewpoint: str,
    api_key: str,
) -> PositionAnalysis:
    """Analyze where the user's viewpoint sits in the literature."""
    party_json = party.model_dump_json(indent=2)

    prompt = POSITION_ANALYSIS_SYSTEM.format(
        party_json=party_json,
        user_viewpoint=user_viewpoint,
    )

    response_text = await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        max_tokens=2048,
    )

    data = _extract_json(response_text)

    return PositionAnalysis(
        position_summary=data["position_summary"],
        alignment=[AlignmentItem(**a) for a in data["alignment"]],
        gaps_and_opportunities=data["gaps_and_opportunities"],
        suggested_next_readings=data["suggested_next_readings"],
    )


TRANSCRIPT_PROMPT = """You are organizing a scholarly discussion transcript from an academic "party" (学术舞会).

Table: "{table_name}"
Topic: {table_topic}

Below is the raw conversation. Please organize it into a clean, well-structured markdown document with:

1. **Discussion Summary** — A brief paragraph summarizing the key points discussed
2. **Key Insights** — Bullet points of the most important insights that emerged
3. **Points of Agreement** — Where the user and literature agreed
4. **Points of Tension** — Where disagreements or debates arose
5. **Open Questions** — Questions that remain unresolved
6. **Full Transcript** — The complete conversation, cleaned up and formatted nicely

Respond in the SAME LANGUAGE as the conversation. Use markdown formatting.

RAW CONVERSATION:
{conversation}
"""


async def organize_transcript(
    table_name: str,
    table_topic: str,
    messages: list[DialogueMessage],
    api_key: str,
) -> str:
    """Organize a chat transcript into a structured markdown document."""
    conversation = ""
    for msg in messages:
        if msg.role == "user":
            conversation += f"\n**You:** {msg.content}\n"
        else:
            conversation += f"\n**{msg.role}:** {msg.content}\n"

    prompt = TRANSCRIPT_PROMPT.format(
        table_name=table_name,
        table_topic=table_topic,
        conversation=conversation,
    )

    return await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        max_tokens=3000,
    )


BILINGUAL_PROMPT = """You are organizing a scholarly discussion transcript into a bilingual (English + Chinese) summary report.

Table: "{table_name}"
Topic: {table_topic}

Create a professional bilingual summary with BOTH English and Chinese for each section. Format as markdown with this structure:

# Discussion Summary / 讨论摘要

[English summary paragraph]

[中文摘要段落]

# Key Insights / 关键洞察

- [English insight 1] / [中文洞察 1]
- [English insight 2] / [中文洞察 2]
...

# Your Arguments vs Literature / 你的观点 vs 文献回应

| Your Point / 你的观点 | Literature Response / 文献回应 |
|---|---|
| [English] / [中文] | [English] / [中文] |
...

# Points of Agreement / 共识

- [English] / [中文]
...

# Points of Tension / 分歧

- [English] / [中文]
...

# Open Questions / 未解决问题

- [English] / [中文]
...

# Suggested Next Steps / 建议的下一步

- [English] / [中文]
...

RAW CONVERSATION:
{conversation}
"""


async def organize_bilingual_summary(
    table_name: str,
    table_topic: str,
    messages: list[DialogueMessage],
    api_key: str,
) -> str:
    """Organize a chat into a bilingual (EN/CN) structured summary."""
    conversation = ""
    for msg in messages:
        if msg.role == "user":
            conversation += f"\n**You:** {msg.content}\n"
        else:
            conversation += f"\n**{msg.role}:** {msg.content}\n"

    prompt = BILINGUAL_PROMPT.format(
        table_name=table_name,
        table_topic=table_topic,
        conversation=conversation,
    )

    return await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        max_tokens=4000,
    )


LANDSCAPE_LR_PROMPT = """You are an academic writing assistant. Generate a Literature Review section based on the following research landscape analysis.

Party Theme (Broad Research Question): {broad_question}

Tables (Literature Streams):
{tables_description}

Write a well-structured literature review in academic style that:
1. Opens with the broad research question and why it matters
2. Organizes by the discussion tables/themes (each table = a subsection)
3. For each table, synthesizes the consensus, differences, and key debates
4. References all papers using APA 7th edition format: Author(s) (Year)
5. Shows how the different streams connect to each other
6. Concludes with identified gaps in the literature

Use proper academic tone. ALL citations must be in APA format.
Respond in the SAME LANGUAGE as the party theme.
"""

POSITION_LR_PROMPT = """You are an academic writing assistant. A researcher wants a literature review that motivates their specific research question.

Broad Research Theme: {broad_question}

The researcher's research question: "{user_question}"

Literature Landscape:
{tables_description}

User's discussions at various tables:
{discussions}

Write a focused literature review that:
1. Opens by introducing the broad field
2. Strategically organizes the literature to BUILD TOWARD the researcher's specific question
3. Each section should progressively narrow toward the gap that the researcher's question addresses
4. Explicitly highlight what is MISSING in the current literature that the researcher's question would fill
5. End with a clear statement of the research gap and why the researcher's question is important
6. ALL citations must be in APA 7th edition format: Author(s) (Year)
7. Use the insights from the researcher's discussions to inform the narrative

Use proper academic tone. This should read like a real journal paper's literature review.
Respond in the SAME LANGUAGE as the user's research question.
"""


def _build_tables_description_for_lr(party: PartyAnalysis) -> str:
    parts = []
    for table in party.tables:
        refs_str = ""
        for ref in table.references:
            authors = ref.authors_full or ref.authors
            year = ref.year or "n.d."
            refs_str += f"  - {authors} ({year}). {ref.title}."
            if ref.journal:
                refs_str += f" {ref.journal}."
            refs_str += f" Stance: {ref.stance}. {ref.summary}\n"

        parts.append(
            f"### {table.name}\n"
            f"Topic: {table.topic}\n"
            f"Key Debate: {table.key_debate}\n"
            f"Consensus: {table.consensus or 'N/A'}\n"
            f"Differences: {table.differences or 'N/A'}\n"
            f"References:\n{refs_str}"
        )
    return "\n\n".join(parts)


async def generate_landscape_lr(
    party: PartyAnalysis,
    api_key: str,
) -> str:
    """Generate a landscape-style literature review from the party analysis."""
    prompt = LANDSCAPE_LR_PROMPT.format(
        broad_question=party.broad_question.question,
        tables_description=_build_tables_description_for_lr(party),
    )

    return await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        max_tokens=4000,
    )


async def generate_position_lr(
    party: PartyAnalysis,
    user_question: str,
    discussions_text: str,
    api_key: str,
) -> str:
    """Generate a position-style literature review motivating user's research question."""
    prompt = POSITION_LR_PROMPT.format(
        broad_question=party.broad_question.question,
        user_question=user_question,
        tables_description=_build_tables_description_for_lr(party),
        discussions=discussions_text or "No discussions yet.",
    )

    return await chat_completion(
        messages=[{"role": "user", "content": prompt}],
        api_key=api_key,
        max_tokens=4000,
    )
