# Profile: web-game

Use this profile at the root of a GameStudio42 game repository whose
client renders with React or Phaser.

The normal layout is a pnpm workspace: `apps/*` for clients and
`packages/*` for the simulation and shared code. React or Phaser is
declared on the app package, not on the root `package.json`.

## Detection signals

- `react` or `phaser` in `dependencies`, `devDependencies`, or
  `peerDependencies` of the root `package.json`, or of a package named
  by `pnpm-workspace.yaml` (or by the `workspaces` field)
- A package outside that list does not count
- Vite or Three alone does not select this profile

## What to read in the live tree

1. `pnpm-workspace.yaml` and the root `package.json` scripts (`dev`,
   `check`, `build`)
2. The repository `AGENTS.md`, and `docs/AGENTS.md` when it exists
3. When they exist: `docs/GDD.md`, `docs/SPECIFICATION.md`,
   `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`,
   and `docs/decisions/`
4. The app under `apps/` that you will change, and its bundler config
5. README deploy notes (ZIP layout, `game_id`, host URL)
6. The host contract if this repo documents the GameStudio42 game server
7. When `snap/snapcraft.yaml` exists, that file and `rules/web/snap.md`

## Write locations

- Game rules stay in the simulation package the repository already
  uses. The React app or the Phaser scenes under `apps/` send commands
  and read state.
- `apps/desktop` and `snap/` load the web build. They do not grow a
  second simulation.
- Build output and `node_modules` are not source. Do not commit them
  unless the repository already tracks a deliberate publish folder.

## Validation

When the root `package.json` has a `check` script, run it before
claiming the work is done. Compiling is not done. Run the project's
build from the repository root. The artifact must contain `index.html`
at its root and must load under the published base path.
`gs42-standards validate --profile web-game` checks that the root
`package.json` exists and has a `build` script. It does not run the
build.
