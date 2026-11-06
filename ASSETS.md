# Assets — authorship, license and provenance

| Asset                                          | Location                                                           | Author / origin | License           |
| ---------------------------------------------- | ------------------------------------------------------------------ | --------------- | ----------------- |
| Ideas, hybrids, doubts, synapses, trails, glow | Drawn procedurally in `utils/renderer.ts` and `utils/gameLogic.ts` | Original        | AGPL-3.0-or-later |
| Sounds: notes, cues, drone and adaptive score  | Synthesized at runtime with WebAudio in `utils/audio.ts`           | Original        | AGPL-3.0-or-later |
| Emblem and favicon                             | `public/icon.svg`                                                  | Original        | AGPL-3.0-or-later |
| "Play in the browser" button                   | `docs/screenshots/play.svg`                                        | Original        | AGPL-3.0-or-later |
| Documentation screenshots                      | `docs/screenshots/*.jpg`, captured from this build with Playwright | Original        | AGPL-3.0-or-later |
| Typeface Space Grotesk                         | Loaded at runtime from Google Fonts in `index.html` (not shipped)  | Florian Karsten | SIL OFL 1.1       |

No art, audio, UI layout, font files or code from other games were used. Third-party code is limited
to npm dependencies: React (MIT), React DOM (MIT), Vite (MIT), Tailwind CSS (MIT), lucide-react
(ISC), Vitest (MIT), Playwright (Apache-2.0), TypeScript (Apache-2.0), ESLint (MIT) and Prettier
(MIT).

The typeface is fetched from `fonts.googleapis.com` at load time, so a fully offline build needs it
self-hosted first — see [TASKS.md](TASKS.md).
