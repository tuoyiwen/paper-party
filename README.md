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

- 🔍 **Party Overview** — See all discussion tables, consensus, and differences at a glance
- 💬 **Multi-paper Dialogue** — Chat with literature as if you're sitting at a table with the authors
- 📍 **Position Analysis** — Map your research question in the existing literature landscape
- 🧠 **Mind Map** — Visual overview of the research landscape
- 📝 **Literature Review Export** — APA-formatted landscape LR and position LR
- 🌐 **Bilingual Summary** — English/Chinese dual-language discussion report
- 🎙️ **Podcast Export** — Convert discussions to audio with different voices per speaker *(coming soon)*
- 📊 **AI Transcript** — AI-organized discussion summary
- 📚 **Browsing History** — Re-enter previous parties without re-uploading

## Who Is This For?

**Researchers** — Turn the overwhelming process of literature review into a structured conversation. Upload an academic paper that contains literature citations, and Paper Party will map the conversations happening across those references. See the big picture, find your niche, and generate a draft LR in minutes.

**Content Creators** — Paper Party can provide insights for those who create educational content, podcasts, or newsletters about research trends. By uploading a review or research paper, you can quickly map the key debates and different perspectives in a field, giving you the narrative structure of a topic.

> **Note:** Paper Party works best with academic papers (PDFs) that contain literature citations — e.g., journal articles, conference papers, or review papers. The AI relies on the references within the paper to discover and organize the discussion tables.

## Live Demo

**https://paper-party.vercel.app**

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Python, FastAPI, pdfplumber
- **AI**: OpenRouter (Qwen3.6-plus by default — swappable via `OPENROUTER_MODEL`)
- **Data Enrichment**: Semantic Scholar API
- **Deployment**: Vercel (frontend) + Railway (backend)

## Local Development

> This section is for developers who want to run Paper Party locally.

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure your API keys
python -m uvicorn app.main:app
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `localhost:8000`.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for paper analysis and dialogue |
| `OPENROUTER_MODEL` | Optional | Override default model (`qwen/qwen3.6-plus`) |
| `S2_API_KEY` | Optional | Semantic Scholar API key for paper enrichment |
| `OPENAI_API_KEY` | Optional | OpenAI API key for podcast TTS |

## License

MIT
