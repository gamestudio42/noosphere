# 0002 — Canvas 2D renderer

- Status: accepted
- Date: 2026-11-05

## Context

The game draws a few hundred glowing nodes, synapses and particles. A framework would add a runtime
and a scene graph for something that is mostly circles, lines and additive blends.

## Decision

Draw everything with Canvas 2D in `utils/renderer.ts`, using `destination-out` trails over a CSS
background, a per-connection phase for sway, and a PNG export via `toBlob`.

## Consequences

- No engine dependency; the production bundle stays under 300 kB of JavaScript.
- Effects are limited to what Canvas 2D can do: real bloom and thousands of particles need WebGL,
  which is the first item of ROADMAP phase 2 and would replace this file behind the same interface.
