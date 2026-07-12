# Gyan Challenge – Presenter Edition

A full-screen, presenter-controlled quiz platform for live spiritual quiz competitions on a projector.
Built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

Audience members never touch this app — it is designed to run on the presenter's laptop, plugged into a
projector, while teams answer verbally and the presenter drives every screen.

## ✨ Design

- **Distinct pages per round.** The top nav (Home / Round 1–4 / Scoreboard) and the dashboard's round
  buttons switch straight to that screen with a smooth fade/slide transition — nothing to scroll through,
  each round is its own full-screen page, the way a presenter clicking through slides would expect.
- Glassmorphism cards over a warm saffron/marigold/brass night-mode background, with an original
  hand-built SVG mandala watermark and Om (ॐ) accents on the dashboard and nav for a temple-like feel.
- Signature **Diya Flame** ring timer (a flickering oil-lamp flame that burns down as the clock counts)
- Marigold-petal confetti bursts on correct answers and the winner celebration
- Cinzel display type for ceremonial headings, Poppins for scores/timers, Inter for body text
- All sound effects are synthesized in the browser with the Web Audio API — no audio files required,
  and it works fully offline

## 🏆 Scoring rules

- **Round 1 (Multiple Choice):** the presenter picks which team is answering, then taps the option
  the team called out. The tap instantly checks it — green glow + chime for correct, red glow + buzz
  for wrong — and awards **+10 for a correct answer, +0 for a wrong one**, automatically.
- **Round 2 (Bhajan Tune):** teams listen to the tune and call out their guess; the presenter clicks
  **Reveal Bhajan Name** to show the answer, then taps whichever team got it right to award that
  track's points (editable per-tune in Manage Data, 15 by default) — fully presenter-judged, since
  telling bhajans apart isn't a fixed right/wrong the app can check on its own.
- Rounds 3 and 4 keep their own scoring flows (topic discussion has no points by itself; Round 4's
  judge panel auto-totals Knowledge/Confidence/Presentation/Communication/Answer Quality).

## 🎵 Pre-loading your bhajan tunes

Open **Manage Data → Round 2 · Bhajans** on the dashboard. For each of your 6–7 tunes, type the bhajan
name, singer, hint, and points, then click **Upload Audio File** to attach the actual audio clip —
it's stored right alongside the tune (the same way Round 1 questions are stored) and will still be
there the next time you open the browser, so you can build your whole playlist before the event and
just hit Play/Reveal/Award live on stage. Very large files will show a heads-up, since a browser's
local storage has a size limit — trimming clips to ~20–30 seconds keeps things comfortably under it.

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) on the presenter's laptop, then press **F**
or click **Full Screen** before the event starts, and mirror/extend the display to the projector.

### Build for deployment

```bash
npm run build
```

This outputs a static site into `dist/`. You can:
- Open it via any static file server (`npx serve dist`), or
- Deploy the `dist/` folder directly to Vercel, Netlify, or any static host

All game data (teams, scores, questions) is stored in the browser's `localStorage`, so nothing needs a
backend or database — it works from a single laptop with no internet connection during the event.

## 🕹️ Presenter keyboard shortcuts

| Key | Action |
|---|---|
| → | Next question / tune / step |
| ← | Previous question |
| Space | Reveal answer |
| T | Start timer |
| P | Pause timer |
| F | Toggle full screen |
| S | Open / close scoreboard |
| W | Jump to spin wheel |
| A | Play / pause audio |
| Esc | Exit full screen |

These also appear in-app via the **?** icon in the top bar.

## 📋 Managing questions & teams

From the Dashboard, click **Manage Data** to:
- Edit team names and colors
- Import Round 1 questions from a CSV (download the template provided) or a full JSON question bank
- Edit the event name and subtitle

The full question bank lives at `src/data/questionBank.json` if you'd like to edit it directly before
building. Its shape:

```json
{
  "round1": [{ "id": "", "question": "", "options": ["", "", "", ""], "correctIndex": 0, "explanation": "", "category": "", "difficulty": "medium", "points": 10 }],
  "round2": [{ "id": "", "audioUrl": "", "bhajanName": "", "singer": "", "hint": "", "image": "", "points": 15 }],
  "round3": [{ "id": "", "label": "", "isArrivalTopic": false, "color": "#FF6B1A" }],
  "round4": [{ "id": "", "topic": "" }]
}
```

Bhajan audio: leave `audioUrl` empty and use the in-app **Attach audio file** button during the round to
load an MP3/WAV from the presenter's laptop for that session, or fill in `audioUrl` with a path/URL ahead
of time.

## 🏆 Rounds

1. **Multiple Choice Challenge** – one question at a time, 30/45/60s countdown, reveal with confetti, award points per team.
2. **Bhajan Tune Challenge** – built-in audio player (play/pause/replay), reveal the bhajan name, optional image.
3. **Spin Wheel Challenge** – animated topic wheel with a 2-minute discussion timer; a dedicated "Arrival Topic" segment triggers an on-the-spot presentation prompt.
4. **Team Presentation** – 5-minute timer plus a judge score panel (Knowledge, Confidence, Presentation, Communication, Answer Quality) with automatic total calculation.

Scores from every round roll up into the **Scoreboard**, with animated ranking changes and a full winner
celebration sequence.

## 🛠️ Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 3 · Framer Motion · Zustand (state + localStorage persistence) ·
canvas-confetti · lucide-react
