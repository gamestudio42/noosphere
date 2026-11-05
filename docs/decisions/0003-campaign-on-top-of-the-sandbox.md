# 0003 — Campaign on top of the sandbox

- Status: accepted
- Date: 2026-11-05

## Context

The sandbox alone was judged "a toy, not a game" in the roadmap assessment: planting was free and
nothing gave the player a goal.

## Decision

Keep one simulation and add a campaign layer (`campaign.ts`) that unlocks archetypes and mechanics
across five chapters through objectives, with its own saved progress. Free Mind passes different
rules to the same core.

## Consequences

- No forked simulation: a mechanic fixed for the campaign is fixed for Free Mind too.
- Objectives must be expressible against the world state after each step, which rules out objectives
  that depend on hidden history.
- Extinction retries the current chapter instead of restarting the campaign, which keeps the loss
  meaningful without punishing the player twice.
