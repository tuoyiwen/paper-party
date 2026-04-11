"""LLM client — thin wrapper around OpenRouter's OpenAI-compatible API.

We route all LLM traffic through OpenRouter so we can swap models without
rewriting the services. Default model is Qwen3.6-plus; override via env var
OPENROUTER_MODEL if needed.
"""

from __future__ import annotations

import os

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "qwen/qwen3.6-plus"


def _model() -> str:
    return os.getenv("OPENROUTER_MODEL") or DEFAULT_MODEL


async def chat_completion(
    messages: list[dict],
    api_key: str,
    system: str | None = None,
    max_tokens: int = 2048,
) -> str:
    """Call OpenRouter chat completions and return the assistant text.

    messages: list of {"role": "user" | "assistant", "content": str}
    system: optional system prompt, prepended as a system message
    """
    full_messages: list[dict] = []
    if system:
        full_messages.append({"role": "system", "content": system})
    full_messages.extend(messages)

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://paper-party.vercel.app",
                "X-Title": "Paper Party",
            },
            json={
                "model": _model(),
                "messages": full_messages,
                "max_tokens": max_tokens,
            },
        )
        if response.status_code != 200:
            # Surface OpenRouter's error body so the frontend / logs tell us
            # exactly what's wrong (bad key, wrong model id, rate limit, etc).
            raise RuntimeError(
                f"OpenRouter returned {response.status_code}: {response.text[:500]}"
            )
        data = response.json()
        if "choices" not in data or not data["choices"]:
            raise RuntimeError(f"OpenRouter returned unexpected payload: {str(data)[:500]}")
        return data["choices"][0]["message"]["content"]
