# Paper Party 🎉

**Upload a paper. Discover the conversations. Join the table.**

Paper Party reimagines literature review as attending an academic party. Each research domain is a party with a theme, and within it, different **tables** represent distinct literature streams debating sub-topics.

> *"Your Introduction must identify what ongoing theoretical conversation you are joining, what's missing in this conversation, what you're bringing to the party, and why it's relevant and important."*
> — Pollock (2021)

## The Problem

Effective literature review is not about piling up papers — it's about understanding the state of the art so it can motivate your own work. But when reading literature, it's hard to see:

- What conversations are actually happening in a field?
- What are scholars debating?
- Where do they agree, and where do they disagree?
- Where does my own research idea fit in?

## How Paper Party Solves This

| Step | What Happens |
|---|---|
| 📄 **Upload** | Upload a research paper (PDF) |
| 🔍 **Discover** | AI extracts references from the introduction, theoretical background, and discussion sections, then organizes them into discussion tables with consensus and differences |
| 💬 **Dialogue** | Join any table and debate with the literature — share your viewpoint and let the papers argue back |
| 📍 **Position** | Enter your research question and AI maps where it sits in the literature landscape |
| 📝 **Literature Review** | Two types: (1) a landscape LR that surveys the field, and (2) a position LR that builds toward and motivates YOUR specific research question |

## Features

### Core (Free)
- Upload and analyze research papers (PDF)
- Party Overview — see all discussion tables, consensus, and differences
- Join tables and dialogue with the literature
- Export raw chat history
- Browsing history with re-entry

### Pro
- **AI Transcript** — AI-organized discussion summary
- **Bilingual Summary** — English/Chinese dual-language report
- **Podcast Export** — Convert discussions to audio with different voices per speaker
- **Mind Map** — Visual overview of the literature landscape
- **Position Analysis** — Map your research question in the literature
- **Literature Review Export** — APA-formatted landscape LR and position LR
- Unlimited uploads and dialogue rounds

## Who Is This For?

**Researchers** — Turn the overwhelming process of literature review into a structured conversation. See the big picture, find your niche, and generate a draft LR in minutes.

**Content Creators** — Map the key debates and perspectives in any field. Get the narrative structure of a topic, ready to turn into educational content, podcasts, or newsletters.

## Live Demo

**https://paper-party.vercel.app**

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Python, FastAPI, pdfplumber
- **AI**: Claude API (paper analysis, dialogue, LR generation)
- **Data Enrichment**: Semantic Scholar API
- **Deployment**: Vercel (frontend) + Railway (backend)

## Getting Started (Local Development)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
python -m uvicorn app.main:app
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `localhost:8000`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `S2_API_KEY` | Optional | Semantic Scholar API key for paper enrichment |
| `OPENAI_API_KEY` | Optional | OpenAI API key for podcast TTS |

## License

MIT
