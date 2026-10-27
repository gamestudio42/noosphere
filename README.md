# Noosphere

An interactive generative ecosystem of ideas. Plant thoughts, pay attention to
them and watch them grow, bond, merge into hybrids and fade when forgotten.

## How to play

- **Click** empty space to plant an idea of the selected archetype.
- **Hover** (or hold a finger on) an idea to feed it with attention.
- **Click** an idea to give it a burst of energy.
- Ideas split when they have enough energy and die when they run out.
- Nearby ideas may bond. When ideas carrying different archetypes bond, they
  give birth to a **hybrid** that blends their colour, sound and behaviour.
- Unlock the eight **insights**. When every idea dies, the mind is forgotten
  and you can plant a new one.

The mind is saved in your browser, so you can close the tab and come back.

### Archetypes

| Archetype | Behaviour |
| --- | --- |
| Logic | Fades slowly and builds stable structures |
| Feeling | Bonds easily with everything nearby |
| Chaos | Multiplies fast, burns out fast |
| Instinct | Heavy and slow, pulls other ideas in |

Each pair of archetypes also has an affinity that draws them together or
pushes them apart (see `AFFINITY` in `constants.ts`).

## Development

Requires Node.js 22+.

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck + lint + tests
npm run build      # static build in dist/
```

### Project layout

- `utils/gameLogic.ts`: the simulation (pure apart from the swappable RNG in `utils/random.ts`)
- `utils/renderer.ts`: canvas drawing and PNG export
- `utils/audio.ts`: Web Audio tones, chords and the ambient drone
- `utils/persistence.ts`: saving and restoring the mind in local storage
- `components/Board.tsx`: the animation loop, input and session stats
- `constants.ts` and `insights.ts`: tuning, archetypes and milestones
