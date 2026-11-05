# Architecture

Noosphere is a single Vite application: one page, one React tree, one canvas.

## Layers

| Layer          | File                          | Responsibility                                                                    |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| Shell          | `App.tsx`                     | Mode (menu / campaign / free), menu and chapter state, extinction, insight toasts |
| Loop and input | `components/Board.tsx`        | `requestAnimationFrame` loop, pointer handling, resize, session stats             |
| Simulation     | `utils/gameLogic.ts`          | Pure state transitions: decay, split, bond, synthesis, damping                    |
| Randomness     | `utils/random.ts`             | Seeded RNG injected into the simulation so a mind is reproducible                 |
| Threats        | `utils/doubts.ts`             | Doubt spawn, targeting and drain                                                  |
| Focus          | `utils/focus.ts`              | Focus pool, costs and regeneration                                                |
| Progression    | `campaign.ts`                 | Five chapters, objectives, completion rules                                       |
| Presentation   | `utils/renderer.ts`           | Canvas 2D drawing and PNG export                                                  |
| Audio          | `utils/audio.ts`              | WebAudio tones, chords, drone, mute state                                         |
| Storage        | `utils/persistence.ts`        | Save and restore per mode in `localStorage`                                       |
| Copy           | `constants.ts`, `insights.ts` | Tuning, archetype traits, affinity matrix, milestones                             |

## Rules that hold the design together

1. **The simulation never touches the DOM.** `utils/gameLogic.ts` receives state and an RNG and returns
   state; rendering, input and storage live outside it. This is what makes `gameLogic.test.ts`
   deterministic.
2. **Randomness is injected, never global.** Code under `utils/` takes the RNG from `utils/random.ts`
   instead of calling `Math.random`, so a test can pin a sequence.
3. **One canvas owns the picture.** Everything the player sees that is not HUD text is drawn in
   `utils/renderer.ts`; the HTML layer only holds controls, panels and cards.
4. **Modes share the simulation.** Campaign and Free Mind differ in rules passed down to `Board`
   (focus cost, doubts), not in a forked simulation.

## Data flow

`App.tsx` picks a mode and hands rules to `Board`. `Board` owns the mutable world, steps it through
`utils/gameLogic.ts` once per frame, draws it with `utils/renderer.ts`, plays cues through
`utils/audio.ts`, reports stats up to the HUD and persists through `utils/persistence.ts` on change.
Campaign objectives are evaluated after each step from the same world state.
