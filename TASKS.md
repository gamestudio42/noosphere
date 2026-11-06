# TASKS

## NOW

- Register Noosphere in the studio catalog: `gs42.json` and a 1200×750 cover are in place; the site
  picks them up on its next build.

## NEXT

- WebGL renderer (PixiJS or custom shaders) with bloom, a layered neural background and thousands of
  particles (ROADMAP phase 2).
- A shape per archetype as well as a colour, which also fixes colour blindness (ROADMAP phase 2).
  Tried as square, circle, star and triangle and reverted: the mind reads better as circles for
  now.
- Keyboard play, pause menu, settings (volume, quality) and fullscreen (ROADMAP phase 4).
- Installable offline PWA; self-host Space Grotesk so the build no longer needs Google Fonts.
- Portuguese strings and a locale switch (ROADMAP phase 4).
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
- Focus as a resource, doubts as threats, hybrids with traits and affinities.
- HUD, nine insights, extinction screen, PNG portrait export, reduced motion.
- Static build published to GitHub Pages by CI, with pull request previews.
- AGPL-3.0 licence, README, screenshots, CI, Pages, Prettier and documentation standardised with the
  studio's other games.
