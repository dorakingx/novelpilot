# NovelPilot

A Gemma 4-powered AI writing agent that turns one prompt into a complete story creation pipeline.

## Features

- Nine specialized agents run sequentially: concept, characters, worldbuilding, plot, chapter outline, drafting, editing, continuity, and publishing
- One story prompt drives the full novel creation workflow
- English and Japanese output
- Mock mode for UI testing without an API key
- Export story bible, manuscript, continuity report, and full project JSON

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and set your Gemma API credentials for live generation:

```env
GEMMA_API_KEY=your_key_here
GEMMA_API_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMMA_MODEL=gemma-4-31b-it
```

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run start` — start the production server
