# I Built NovelPilot with Gemma 4 — An AI Writing Room That Turns One Prompt into a Story Pipeline

- Live demo: https://novelpilot.vercel.app
- GitHub repo: https://github.com/dorakingx/novelpilot

## Introduction

NovelPilot is not another AI story generator. It is a Gemma-powered writing room: nine specialized agents transform one prompt into a story bible, cast, world, plot, chapter outline, prose draft, editing report, continuity audit, foreshadowing tracker, and publishing package.

Live demo: https://novelpilot.vercel.app  
GitHub: https://github.com/dorakingx/novelpilot

Gemma acts as the **structural memory and reasoning layer** for the entire novel creation process — not a single completion call.

## Architecture

```
Prompt
→ Premise Architect
→ Character Director
→ World Builder
→ Plot Strategist
→ Chapter Architect
→ Prose Writer
→ Style Editor
→ Continuity Detective
→ Publisher Agent
```

Each step receives the accumulated Story Bible and previous structured outputs.

## How to try it

1. Open the live demo.
2. Click **Run Judge Demo**.
3. Watch the nine-agent pipeline complete.
4. Check the Foreshadowing Tracker and Continuity Detective.
5. Export the full demo markdown.

## What I built

The UI starts as a simple prompt launcher. Once the user begins, it transforms into an agent workspace where the writing room runs step by step. When all agents complete, NovelPilot **automatically transitions** into a finished novel reader. The user can read the story in the browser and download it as a PDF using the browser’s Save as PDF flow.

NovelPilot is a Next.js web app where judges and writers can:

1. Enter one story prompt (or click **Run Judge Demo** for an instant sci-fi mystery).
2. Watch a vertical **agent timeline** run nine steps sequentially.
3. Explore outputs in a **story bible**, **foreshadowing tracker**, **manuscript preview**, and **continuity detective** panel.
4. Click **Read Finished Novel** or wait for the automatic reader transition.
5. **Download PDF** via browser Save as PDF.
6. Export a **full demo markdown** file for hackathon or DEV submission.

The MVP generates a complete story bible, plot, three-chapter outline, **chapter 1 draft**, style editor notes, structured continuity report, and publisher marketing copy.

## Why I built it

I wanted to show what happens when you treat creative writing as **production workflow**, not chat.

Real writing rooms have roles: premise, cast, world, plot, outline, draft, edit, continuity, publish. NovelPilot mirrors that with agents — so users (and judges) see *how* the story was built, not just the final text.

## Why Gemma 4

NovelPilot uses Gemma 4 through a provider-agnostic API layer (`GEMMA_API_KEY`, `GEMMA_API_URL`, `GEMMA_MODEL`). The default OpenRouter model is `google/gemma-4-31b-it` — pick a currently available Gemma 4 model from OpenRouter if that ID changes. The model is used for:

- **Structured JSON** per agent (loglines, character sheets, foreshadowing items, continuity issues).
- **Long-context chaining** — each agent receives the story bible and prior agent outputs.
- **Reasoning-heavy tasks** — foreshadowing payoff planning and continuity audits with evidence and suggested fixes.

Without structured outputs, the UI could not render a Foreshadowing Tracker or a severity-ranked Continuity Detective. Gemma 4 is the engine behind that reasoning — not a single completion call.

## Agent workflow

1. **Premise Architect** — logline, theme, conflict, hook  
2. **Character Director** — protagonist, antagonist, supporting cast  
3. **World Builder** — setting, rules, atmosphere, symbols  
4. **Plot Strategist** — acts, twists, foreshadowing seeds  
5. **Chapter Architect** — chapter list + **foreshadowing tracker**  
6. **Prose Writer** — chapter 1 literary fiction (not a summary)  
7. **Style Editor** — strengths, pacing, revision suggestions  
8. **Continuity Detective** — issues with category, severity, evidence, fix  
9. **Publisher Agent** — titles, logline, tagline, social post  

The client orchestrates the pipeline: one HTTP request per agent, visible progress, stop/regenerate support.

## Demo walkthrough

**For hackathon judges (under 60 seconds):**

1. Open the **live Vercel deployment** (link at top of this post).  
2. Click **Run Judge Demo**.  
3. Watch the timeline fill: Premise Architect → … → Publisher Agent.  
4. NovelPilot **automatically opens** the finished novel reader.  
5. Open **Foreshadowing Tracker** or **Continuity Detective** via Back to Workspace.  
6. **Download PDF** — use your browser’s Save as PDF option.  
7. **Export Full Demo Markdown** — one file for submission.

No demo video — the live app is the demo.

No API key required in demo mode — curated outputs prove the UX; add `GEMMA_API_KEY` for live Gemma 4.

## Technical architecture

- **Next.js App Router** + TypeScript + Tailwind + shadcn/ui  
- **Client state** — `useStoryProject` hook, no database  
- **`POST /api/generate-agent`** — runs one agent server-side  
- **`lib/gemma.ts`** — swappable LLM client; mock fallback without API key  
- **`lib/agents.ts`** — merge agent JSON into `StoryBible` and `ProjectReports`  

Human-in-the-loop: **Approve**, **Regenerate**, **Edit Output** (JSON modal) per completed agent.

## Mock mode and live Gemma mode

| Mode | When | Behavior |
|------|------|----------|
| Demo | No `GEMMA_API_KEY` | Curated EN/JA sample JSON per agent |
| Live | API key set | Real Gemma 4 via OpenRouter (`GEMMA_MODEL=google/gemma-4-31b-it`) |

A banner at the top makes the mode obvious to judges.

## Continuity Detective

Legacy continuity tools list vague warnings. NovelPilot’s Continuity Detective returns:

```json
{
  "category": "foreshadowing",
  "severity": "high",
  "issue": "...",
  "evidence": "...",
  "suggestedFix": "..."
}
```

Plus `overallDiagnosis`, `missingPayoffs`, and linked unresolved foreshadowing items.

## Foreshadowing Tracker

The Chapter Architect emits a structured tracker:

```json
{
  "item": "The cracked silver watch",
  "introducedIn": "Chapter 1",
  "status": "unresolved",
  "suggestedPayoff": "...",
  "payoffChapter": "Chapter 3",
  "emotionalPurpose": "..."
}
```

This is the differentiator: NovelPilot understands **story structure**, not just text generation.

## What I learned

- **Structured outputs beat prose** for multi-step creative pipelines.  
- **One agent per API call** keeps the timeline honest and debuggable.  
- **Judge Demo** matters as much as the tech — zero-setup path wins hackathons.  
- Gemma 4 shines when the task is *reasoning across context*, not a single paragraph.

## Future work

- Draft all chapters, not only chapter 1  
- SSE streaming per agent  
- Project persistence  
- Genre-specific prompt packs  

---

**Try it:**

- Live demo: https://novelpilot.vercel.app  
- GitHub: [github.com/dorakingx/novelpilot](https://github.com/dorakingx/novelpilot)

**Tagline for posts:** *One prompt. Nine agents. Gemma 4 as your writing room's reasoning engine.*
