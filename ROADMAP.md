# Roadmap

Goal: premium indie polish. Every interaction resolved, visuals and sound
cohesive, and a game that holds attention, not just a toy.

## Assessment (2026-10)

| Area          | Score | Notes                                                                                                          |
| ------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| Engineering   | 7/10  | Tests, CI, frame-rate independent physics, saves. Missing a fixed timestep.                                    |
| Game design   | 3/10  | A toy, not a game: planting is free and unlimited, no goals, threats or progression beyond 8 one-off insights. |
| Onboarding    | 2/10  | The intro drops you into an empty screen. Hybrids and affinities are never taught.                             |
| Visuals       | 5/10  | Pretty but generic Canvas 2D glow circles. No real bloom, depth, living background or hero moments.            |
| Game feel     | 3/10  | No screen shake, slow motion or birth animations. Weak click feedback.                                         |
| Audio         | 4/10  | Loose oscillators, not locked to a scale or pulse. No adaptive music.                                          |
| UI            | 4/10  | No pause menu, settings, fullscreen or keyboard shortcuts.                                                     |
| Accessibility | 3/10  | Archetypes differ by colour only. Not keyboard playable. Reduced motion handled.                               |
| Content       | 3/10  | 4 archetypes, 8 insights, one mode.                                                                            |
| Platform      | 4/10  | No PWA/offline, touch untested, English only.                                                                  |

## Phase 1: make it a game

- [x] **Focus** as a resource: planting, stimulating and feeding ideas spend it, it regenerates over time and faster with living hybrids.
- [x] **Doubts**: threats that drift in, latch onto ideas and drain them. Click to banish them; Logic ideas slowly dissolve them; well connected ideas resist.
- [x] **Chapters** with objectives that unlock archetypes and mechanics one at a time, teaching the game by playing it.
- [x] Campaign progress saved; extinction retries the current chapter.
- [x] **Free mode**: the original sandbox, no focus cost and no doubts.

## Phase 2: visuals and game feel

- [ ] WebGL renderer (PixiJS or custom shaders) with bloom, layered neural background and thousands of particles.
- [x] Hybrid birth as a hero moment: brief slow motion, shockwave, subtle zoom.
- [ ] A shape per archetype as well as a colour (also fixes colour blindness).
- [x] Screen shake and stronger click feedback.

## Phase 3: audio

- [ ] Every note locked to a scale and a pulse so the mind plays music.
- [ ] Adaptive score: layers enter as the mind grows, tension when it is dying or under attack.

## Phase 4: product

- [ ] Pause menu and settings (volume, quality, accessibility), keyboard shortcuts, fullscreen.
- [ ] Installable offline PWA, real touch testing, Portuguese and English.
- [ ] More insights, cross-session stats, e2e tests.
- [ ] Fixed simulation timestep.
- [x] Spatial hashing for pair forces.
