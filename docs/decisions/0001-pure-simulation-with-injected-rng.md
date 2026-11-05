# 0001 — Pure simulation with an injected RNG

- Status: accepted
- Date: 2026-11-05

## Context

The mind has to behave the same way from the same seed, otherwise the Vitest suite cannot assert
anything and a bug cannot be reproduced from a saved mind.

## Decision

All simulation code lives in `utils/gameLogic.ts` as functions that take state and return state.
Randomness comes from `utils/random.ts` and is passed in; `Math.random` is never called inside the
simulation.

## Consequences

- Tests pin a seed and assert exact outcomes (`utils/gameLogic.test.ts`, `utils/stats.test.ts`).
- Renderer, audio, storage and React state stay outside the simulation, so they can change without
  breaking determinism.
- A future worker-based or fixed-timestep loop can reuse the same functions unchanged.
