# Luminary

Luminary is an AI-powered learning experience that combines a conversational teacher, generated explanations, voice synthesis, and animated visual teaching aids in a browser-first classroom.

At a high level, a learner asks what they want to study, Luminary explains concepts in natural language, and the board can render generated Manim animations for visual understanding. The project also includes WebSpatial/Apple Vision Pro support for multi-window spatial scenes.

## What This Project Is

Luminary is built as a multi-service system:

- `frontend/`: React + Vite app with classroom UI, spatial scenes, teacher panel, chat/text controls, and board playback.
- `backend/`: Flask API for lesson generation, summaries, student responses, voice synthesis, and proxying/caching Manim renders.
- `manim/`: Node/Express render service that generates Manim code, executes renders, and serves video outputs.
- `3d-main/`: separate 3D playground/assets package (contains models and an independent Vite app).

The current primary classroom experience in `frontend/src/App.tsx` is driven by an ElevenLabs conversational agent + client tools (`start_lesson`, `render_animation`) and a board/history UI.

## Important Work Completed

The codebase already implements the core demo pipeline end-to-end:

1. Lesson/classroom session initiation
- User starts from greeting flow and enters a classroom state.
- Subject/topic context is tracked and shown in the UI.

2. AI-generated visual teaching flow
- Frontend can request board animation renders from backend (`/render-manim`).
- Backend proxies to the render service and caches returned MP4 locally.

3. Voice + teacher interaction
- ElevenLabs conversation integration in the frontend (`@elevenlabs/react`).
- The app tracks speaking state and reflects it in teacher UI behaviors.

4. Generated educational metadata
- Backend `/summarize` endpoint creates short concept summaries and key points for topic history/cards.

5. Structured lesson generation APIs
- Backend `/generate-lesson` returns 5-segment lessons with board actions and optional `manimScript`.
- Includes deterministic fallback lesson if LLM generation fails.

6. Student interruption / follow-up support
- Backend `/student-response` returns typed responses (`question`, `confusion`, `acknowledgment`) and board updates.

7. Performance and reliability work
- File-based cache for lessons, audio, and videos in `backend/cache/`.
- Graceful fallback behavior in multiple API paths to preserve demo continuity.

8. Spatial (visionOS/WebSpatial) scene wiring
- Multi-window scene behavior (teacher/topics/notes) through WebSpatial + `BroadcastChannel` synchronization.
- `dev:avp`, `build:avp`, and runtime hooks for AVP-specific workflows.

## Architecture

```text
Frontend (React/Vite)
  -> POST /generate-lesson
  -> POST /render-manim
  -> POST /synthesize-voice
  -> POST /student-response
  -> POST /summarize

Backend (Flask)
  -> Gemini (lesson/summary/response generation)
  -> ElevenLabs (text-to-speech)
  -> Manim API service /generate (video rendering)
  -> local cache (audio/video/lessons)

Manim Service (Node/Express)
  -> Generate Manim code (LLM + fallback)
  -> Execute Manim render
  -> Serve /videos/*.mp4
```

## Repository Map

```text
.
├── frontend/                # Main UI app (React 19 + Vite + TS)
│   ├── src/App.tsx          # Current main classroom entry flow
│   ├── src/components/      # Classroom UI, board, teacher, notes, spatial pieces
│   ├── src/scenes/          # Teacher/Topics/Notes scene views
│   ├── src/lib/api.ts       # Backend API client
│   └── package.json
├── backend/
│   ├── app.py               # Flask API server
│   ├── requirements.txt
│   └── cache/               # Generated cache files (runtime)
├── manim/
│   ├── server.ts            # Express API for generation + rendering
│   ├── generator.ts         # Code generation/fallback logic
│   ├── executor.ts          # Render execution wrapper
│   └── Dockerfile
├── 3d-main/                 # Separate model/3D workspace
├── tunnel.sh                # Cloudflare quick tunnels helper
├── PRD.md                   # Product requirements
└── ClassroomAI_Handoff.md   # Build/handoff notes
```

## API Surface (Backend)

All endpoints are served by `backend/app.py`:

- `POST /generate-lesson`
  - Input: `{ "subject": string, "topic": string }`
  - Output: structured 5-segment lesson JSON.

- `POST /render-manim`
  - Input: `{ "script": string, "duration"?: number }`
  - Output: `video/mp4` stream.

- `POST /synthesize-voice`
  - Input: `{ "text": string }`
  - Output: `audio/mpeg` stream.

- `POST /student-response`
  - Input: transcript + lesson context.
  - Output: JSON teacher reply + board update.

- `POST /summarize`
  - Input: `{ "text": string }`
  - Output: `{ summary, keyPoints[] }`.

- `GET /health`
  - Output: service health JSON.

## Environment Variables

### Backend (`backend/.env`)

```bash
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
MANIM_API_URL=http://localhost:3001
RENDER_API_SECRET=            # optional; required if Manim server auth is enabled
PORT=3002
```

### Frontend (`frontend/.env.local`)

```bash
VITE_BACKEND_URL=http://localhost:3002
VITE_ELEVENLABS_AGENT_ID=...
XR_DEV_SERVER=http://localhost:5174/webspatial/avp/
```

### Manim (`manim/.env`)

Typical values based on server behavior:

```bash
PORT=3001
VIDEO_OUTPUT_DIR=/app/public/videos
RENDER_API_SECRET=            # optional, but must match backend if set
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3002
ANTHROPIC_API_KEY=...         # used by manim code generation path
```

## Local Development

## 1) Start backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Default local URL: `http://localhost:3002`

## 2) Start Manim API

```bash
cd manim
npm install
npm run dev
```

Default local URL: `http://localhost:3001`

## 3) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

## 4) Optional: AVP/WebSpatial dev flow

```bash
cd frontend
npm run dev:avp
npm run run:avp
```

## Tunnel Helper

Use `tunnel.sh` if you need quick public URLs for local services:

```bash
./tunnel.sh            # backend + manim
./tunnel.sh --no-manim # backend only
```

This script updates:
- `frontend/.env.local` -> `VITE_BACKEND_URL`
- `backend/.env` -> `MANIM_API_URL`

## Caching Behavior

Backend caches generated artifacts under `backend/cache/`:

- `cache/lessons/` lesson JSON + summaries
- `cache/audio/` ElevenLabs MP3s
- `cache/video/` rendered MP4s

Keys are MD5 hashes of request inputs, so repeated runs become much faster and more stable during demos.

## Notes on Current State

- The repo contains both a newer `App.tsx`-driven classroom and older route/page-based files (`HomePage`, `ClassroomPage`, `useLesson`) that are still present.
- `3d-main/` is a separate 3D/model workspace and not required for the default frontend app startup.
- Some docs in the repo describe earlier snapshots of the stack; this README reflects the current source layout and scripts.

## Troubleshooting

- Backend boots but features fail:
  - Verify `GEMINI_API_KEY` and `ELEVENLABS_API_KEY` are set correctly.

- Animation requests fail:
  - Ensure `MANIM_API_URL` is reachable from backend.
  - If Manim auth is enabled, set matching `RENDER_API_SECRET` in backend and manim env.

- No voice conversation in UI:
  - Check `VITE_ELEVENLABS_AGENT_ID`.
  - Confirm microphone permission in browser.

- CORS issues:
  - Update `ALLOWED_ORIGINS` in manim service env.

## Why Luminary Matters

Luminary demonstrates a practical pattern for AI education products:
- conversational tutoring,
- generated visual instruction,
- multimodal reinforcement (voice + board + summaries),
- and deployment paths from desktop web to spatial computing experiences.
