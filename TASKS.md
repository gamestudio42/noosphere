# TASKS

## NOW

- Register Noosphere in the studio catalog: `gs42.json` and a 1200×750 cover are in place; the site
  picks them up on its next build.

## NEXT

- Measure the glow on a discrete GPU and on a real 4K screen (only the Intel iGPU was measured).
  Particles still come from the 2D renderer (ROADMAP phase 2).
- Native-speaker review of the Spanish, French and German catalogs in `i18n/`.
- Fixed simulation timestep (ROADMAP phase 4).
- Playtest the campaign with people: the balance numbers come from a scripted player only.

## BLOCKED

- Touch testing on real phones: no device in the loop yet, so `pointer` handling is only exercised
  with synthetic events.

## DONE

- Campaign with five chapters, objectives and per-chapter saves; holds forgive dips under 5 s.
- Ripples, screen shake and hero moments for new hybrid blends.
- Spatial grid and affinity table for physics; audio suspended when nothing is audible.
- Music in A minor pentatonic on an 84 BPM pulse, with an adaptive score.
- Pause menu with settings, keyboard play and fullscreen.
- Five languages, an opt-in colour-blind palette and an installable offline PWA; strict TypeScript.
- Focus as a resource, doubts as threats, hybrids with traits and affinities.
- HUD, nine insights, extinction screen, PNG portrait export, reduced motion.
- Static build published to GitHub Pages by CI, with pull request previews.
- AGPL-3.0 licence, README, screenshots, CI, Pages, Prettier and documentation standardised with the
  studio's other games.
