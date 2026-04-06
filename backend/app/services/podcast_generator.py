"""Podcast generator — convert table discussions into audio."""

from __future__ import annotations

import anthropic
import httpx
import io
import struct
import wave

from ..models import DialogueMessage


# Voice assignments for different speakers
OPENAI_VOICES = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"]


async def _generate_speech_openai(
    text: str,
    voice: str,
    api_key: str,
) -> bytes:
    """Generate speech using OpenAI TTS API."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "tts-1",
                "input": text,
                "voice": voice,
                "response_format": "wav",
            },
        )
        if resp.status_code != 200:
            raise Exception(f"TTS failed: {resp.status_code} {resp.text[:200]}")
        return resp.content


def _create_silence_wav(duration_ms: int = 500, sample_rate: int = 24000) -> bytes:
    """Create a silent WAV segment."""
    num_samples = int(sample_rate * duration_ms / 1000)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"\x00\x00" * num_samples)
    return buf.getvalue()


def _concat_wav_files(wav_segments: list[bytes]) -> bytes:
    """Concatenate multiple WAV files into one."""
    if not wav_segments:
        return b""

    all_frames = b""
    params = None

    for seg in wav_segments:
        buf = io.BytesIO(seg)
        with wave.open(buf, "rb") as wf:
            if params is None:
                params = wf.getparams()
            all_frames += wf.readframes(wf.getnframes())

    if params is None:
        return b""

    out = io.BytesIO()
    with wave.open(out, "wb") as wf:
        wf.setparams(params)
        wf.writeframes(all_frames)

    return out.getvalue()


async def generate_podcast(
    table_name: str,
    table_topic: str,
    messages: list[DialogueMessage],
    anthropic_api_key: str,
    openai_api_key: str,
) -> bytes:
    """Generate a podcast-style audio from a table discussion.

    First uses Claude to create a podcast script, then converts to audio
    with different voices for each speaker.
    """
    # Step 1: Create podcast script with Claude
    conversation = ""
    for msg in messages:
        if msg.role == "user":
            conversation += f"\nYou: {msg.content}\n"
        else:
            conversation += f"\n{msg.role}: {msg.content}\n"

    script_prompt = f"""Convert this academic discussion into a natural podcast script.
The podcast is called "Paper Party" and is about the table "{table_name}" discussing "{table_topic}".

Rules:
- Keep it conversational and engaging
- Add brief transitions between speakers
- Each speaker segment should be 1-3 sentences
- Start with a brief host introduction
- End with a brief host summary
- Mark each segment with the speaker name like "HOST:", "SPEAKER_1:", etc.
- The user's contributions should be "HOST:"
- Each literature paper should be a different "SPEAKER_N:"
- Keep it under 2 minutes of speaking time (about 300 words total)

CONVERSATION:
{conversation}

Return ONLY the script, no other text."""

    client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": script_prompt}],
    )

    script = response.content[0].text

    # Step 2: Parse script into segments
    segments: list[tuple[str, str]] = []
    current_speaker = "HOST"
    current_text: list[str] = []

    for line in script.split("\n"):
        line = line.strip()
        if not line:
            continue
        if ":" in line and line.split(":")[0].strip().upper() in [
            f"SPEAKER_{i}" for i in range(10)
        ] + ["HOST"]:
            if current_text:
                segments.append((current_speaker, " ".join(current_text)))
            colon_idx = line.index(":")
            current_speaker = line[:colon_idx].strip().upper()
            remaining = line[colon_idx + 1:].strip()
            current_text = [remaining] if remaining else []
        else:
            current_text.append(line)

    if current_text:
        segments.append((current_speaker, " ".join(current_text)))

    # Step 3: Assign voices and generate audio
    speaker_voices: dict[str, str] = {}
    voice_idx = 0

    wav_parts: list[bytes] = []
    silence = _create_silence_wav(600)

    for speaker, text in segments:
        if not text.strip():
            continue

        if speaker not in speaker_voices:
            speaker_voices[speaker] = OPENAI_VOICES[voice_idx % len(OPENAI_VOICES)]
            voice_idx += 1

        voice = speaker_voices[speaker]
        audio = await _generate_speech_openai(text, voice, openai_api_key)
        wav_parts.append(audio)
        wav_parts.append(silence)

    # Step 4: Concatenate all audio
    return _concat_wav_files(wav_parts)
