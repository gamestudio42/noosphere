# Browser games

The repository is a game that happens to render with React or Phaser.
Simulation state does not live in render state or in a scene.

A GameStudio42 game is a pnpm workspace. Clients live under `apps/`.
The simulation lives in its own package (often `packages/simulation`,
`packages/sim`, `packages/kernel`, `packages/core`, or
`packages/world`). Read the repository `AGENTS.md` to see which
package that is. Do not copy paths from another title.

## Read first

- `pnpm-workspace.yaml` and the root `package.json` scripts
- The repository `AGENTS.md`, and `docs/AGENTS.md` when it exists
- The simulation package the repository names
- The app under `apps/` you will change, and its bundler config
- How the current build addresses assets (relative paths or a `base`)

## Rules

- The simulation package is pure TypeScript: no DOM, no Node APIs, no
  wall-clock time, and no `Math.random`. That boundary holds when the
  repository names the package, even if ESLint does not yet cover
  every file. Do not weaken a lint rule that already enforces it.
- React components never contain the game rules. They send commands
  and read state. Do not advance the rules inside render or in an
  effect that runs because the parent re-rendered.
- A Phaser scene does not contain the game rules either. It sends
  commands and reads state.
- The renderer never mutates simulation state.
- Numbers live in the content or balance package the repository
  already uses. Do not add a magic gameplay number in the client.
- Follow the component and folder layout already in the repository.
- Player input goes through the project's input path. Do not bind a
  second global key listener beside the one the game already owns.
- No secrets, admin tokens, or private API hosts in client code. The
  bundle is public.
- Dependencies: prefer what the workspace already has. Do not add a
  state library, physics library, or UI kit for one screen.
- New player-facing strings are written in English. In the same
  change, add `pt-BR`, `es`, `fr`, and `de` in the client i18n.
  A stale translation is not a finished change.
- Deterministic replays, seeds, or daily challenges use the project's
  existing RNG, in a deterministic order.

## Scope

A feature lands in the app and the simulation package that play it.
Do not rebuild the shell, router, or menu chrome unless the task is
about that chrome.
