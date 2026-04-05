# Paper Party

**Upload a paper. Discover the conversations. Join the table.**

Paper Party reimagines literature review as attending an academic party (学术舞会). Each research domain is a party with a theme, and within it, different **tables** represent distinct literature streams debating sub-topics.

## How It Works

1. **Upload** — Drop a research paper (PDF)
2. **Discover** — AI analyzes the paper and maps the literature landscape:
   - Identifies the **broad research question** (the party theme)
   - Extracts **discussion tables** — distinct literature streams, each with key papers and their stances
   - Shows where **your paper contributes** to the conversation
3. **Dialogue** — Join any table and have a multi-party conversation with the literature. Papers respond from their established positions — they can agree, challenge, or build on your ideas.
4. **Position** — Share your own viewpoint and see where it sits across the literature landscape. Discover gaps, tensions, and opportunities.

## Architecture

```
backend/          Python FastAPI
  app/
    main.py       API endpoints
    models.py     Data models (Paper, Table, Dialogue, Position)
    services/
      paper_parser.py        PDF parsing (PyMuPDF)
      literature_mapper.py   AI-powered literature analysis
      dialogue_engine.py     Multi-paper dialogue simulation
frontend/         React + TypeScript + Vite + Tailwind CSS
  src/
    components/
      PaperUpload.tsx     Drag-and-drop PDF upload
      PartyView.tsx       Party overview with all tables
      TableDialogue.tsx   Chat interface at a table
      PositionPanel.tsx   Map your position in the literature
```

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `localhost:8000`.

## Tech Stack

- **Backend**: Python, FastAPI, PyMuPDF, Anthropic Claude API
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Claude for paper analysis, literature mapping, and dialogue simulation
