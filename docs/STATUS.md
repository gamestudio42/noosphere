# Project status

Record of what is implemented, how it was verified, and what is knowingly missing. The player-facing
overview is the [README](../README.md); open work is tracked in [TASKS.md](../TASKS.md), the plan in
[ROADMAP.md](../ROADMAP.md) and the architecture in [overview.md](architecture/overview.md).

## What works

- **Simulation** (`utils/gameLogic.ts`): ideas decay, split, bond and synthesize into hybrids; four
  archetypes with traits (decay, growth, sociability, gravity, inertia) and an affinity matrix that
  draws or repels neighbours. Pure apart from the injected seeded RNG in `utils/random.ts`.
- **Focus** (`components/FocusBar.tsx`): planting, stimulating and feeding spend focus; it
  regenerates over time and faster with living hybrids; denied actions shake the bar and play a cue.
- **Doubts** (`utils/doubts.ts`): drift in from the edges, latch onto the nearest idea and drain it;
  Logic ideas dissolve them, well-connected webs resist, clicking banishes one for focus.
- **Campaign** (`campaign.ts`, five chapters): unlocks Logic, Chaos, doubts, Feeling and Instinct one
  at a time, with counting objectives and hold objectives that must stay met for a fixed time
  (`holdSeconds`; dips shorter than 5 s are forgiven). Progress is saved per chapter; extinction
  retries the current chapter keeping finished objectives. `campaign.test.ts` covers chapter
  transitions and objective bookkeeping.
- **Free Mind**: the original sandbox with every archetype, no focus cost and no doubts.
- **Presentation** (`utils/renderer.ts`): Canvas 2D drawing, trails that fade with `destination-out`,
  synapses that sway per connection, hybrid halo, PNG portrait export via `toBlob`, and
  `prefers-reduced-motion` respected (no trails, sway or particles).
- **Audio** (`utils/audio.ts`): WebAudio tones, chords and an ambient drone that swells with the
  mind; the mute state is remembered locally, and the audio context is suspended on the menu, while
  muted and in a hidden tab.
- **Performance**: pair forces come from a uniform grid and a blend-mask affinity table, so physics
  for a full mind (150 ideas) costs about 0.5 ms per frame headless; look-alike synapses are stroked
  in one path per colour; the canvas pixel ratio is capped at 2.
- **Persistence** (`utils/persistence.ts`): each mode keeps its own save (`noosphere:mind:v2:<mode>`),
  campaign progress has its own key, and an older v1 save loads as the sandbox.
- **Insights** (`insights.ts`): nine milestones, shown as toasts during a session alongside objective
  toasts.

## How it is verified

- `npm run check` — TypeScript, ESLint and 36 Vitest tests across five files (game logic, stats,
  focus, doubts, campaign). Green locally and in CI.
- `npm run build` — static build in `dist/`, green locally and in CI.
- `npm run e2e` — one Playwright smoke test: the menu renders, Free Mind starts, planting three ideas
  raises IDEAS to at least 3 and the page logs no errors.
- `npm run format:check` — Prettier with the studio settings (`singleQuote`, `printWidth` 100,
  `trailingComma: all`).
- CI (`.github/workflows/pages.yml`) runs type check, lint, tests, build and e2e on every push and
  pull request, then publishes `dist/` to `gh-pages`; pull requests get a preview.
- Campaign balance: a headless run of the whole campaign with a scripted player (8 seeds, 15 min cap
  per chapter, 2026-11-06). Chapters 1, 2 and 4 clear in under a minute, Doubt in 1.7 to 8.3 min on
  every seed, and Instinct on 5 of 8 seeds (median about 6 min). Not yet confirmed with human
  players.
- Played manually in Chromium at 1440×900: menu, a sandbox that grew to 50 ideas and 36 hybrids,
  campaign chapter 1 objectives, PNG export, mute and back to menu with the mind restored.

## What is missing

See [ROADMAP.md](../ROADMAP.md). The honest short list: WebGL renderer with bloom, a shape per
archetype (also fixes colour blindness), hybrid birth as a hero moment, keyboard play and settings,
music locked to a scale, installable offline PWA, translations and a fixed simulation timestep. GPU
cost of the renderer has not been measured on real hardware.
