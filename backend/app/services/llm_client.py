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
    json_mode: bool = False,
) -> str:
    """Call OpenRouter chat completions and return the assistant text.

    messages: list of {"role": "user" | "assistant", "content": str}
    system: optional system prompt, prepended as a system message
    json_mode: if True, ask the model to return a JSON object
    """
    full_messages: list[dict] = []
    if system:
        full_messages.append({"role": "system", "content": system})
    full_messages.extend(messages)

    body: dict = {
        "model": _model(),
        "messages": full_messages,
        "max_tokens": max_tokens,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://paper-party.vercel.app",
                "X-Title": "Paper Party",
            },
            json=body,
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
        choice = data["choices"][0]
        # Warn loudly if the model was cut off — that guarantees broken JSON.
        if choice.get("finish_reason") == "length":
            print(
                f"[WARN] OpenRouter finish_reason=length — output was truncated at max_tokens={max_tokens}. "
                "Consider raising max_tokens."
            )
        return choice["message"]["content"]
