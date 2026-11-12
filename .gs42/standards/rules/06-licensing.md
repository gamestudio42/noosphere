# Licensing

The canonical policy is the bilingual
[project submission guide](https://github.com/gamestudio42/.github/blob/main/docs/PROJECT_SUBMISSIONS.md).
This file is the part an agent must follow. It does not replace that
guide, and it does not copy the submission form, contact addresses, or
funding-channel status.

## Preferred defaults for a new project

These defaults apply when a new open-source project is joining the
organization and does not already have a license. They are not one
license for every file.

An existing license is reviewed case by case. MIT, BSD, GPL, and other
open-source licenses may be accepted after that review. The review
weighs the project's goals, community, dependencies, and distribution
channels. Organization owners approve the chosen license and record
the rationale for any exception in the proposal before acceptance.
Joining does not require automatic relicensing.

- Complete games, code, on any platform: `AGPL-3.0-or-later`.
- Game servers and multiplayer infrastructure: `AGPL-3.0-or-later`.
- Engines and frameworks: `Apache-2.0`.
- Libraries and SDKs: `Apache-2.0`.
- Development tools: `Apache-2.0`.
- AI agents for games: `Apache-2.0`.
- 2D/3D assets: `CC-BY-4.0` or `CC-BY-SA-4.0`. Say which one applies.
- Music and sound effects: `CC0-1.0` or `CC-BY-4.0`. Say which one applies.
- Documentation: `CC-BY-4.0`.

Reusable technology stays Apache-2.0 even when it is used online. In a
mixed project, identify the game-server components separately.

AGPL is not limited to web software. A modified version that supports
remote network interaction must offer its Corresponding Source to
those users. That duty does not require a pull request to Game
Studio 42. Commercial use stays allowed, including by third parties.
See the [GNU license FAQ](https://www.gnu.org/licenses/gpl-faq.en.html).

Before a release, check engine, dependency, and distribution-channel
compatibility, including store or console terms, DRM, and
source-delivery duties. A GPL exception does not resolve every
platform conflict. An exception needs a documented rationale and
approval. It does not override a third party's rights.

## Repositories that already exist

- Do not change `LICENSE`, an SPDX notice, or a packaged `license`
  field without explicit authorization.
- Do not relicense existing Game Studio 42 code or assets, including
  MIT where it is already used, to match the defaults above.
- Do not start a license migration. No migration is scheduled or
  automatic. Any future proposal needs its own review and a recorded
  decision.
- Do not relicense a third-party resource to match these defaults.
  Compatibility, attribution, and any proposed change are resolved
  with the rights holder first.
- Keep code, documentation, and artistic-resource licenses explicit
  and separate. In a mixed project, name each component and the
  license that applies to it.
- Include the license text or notice, and a third-party inventory, in
  the place the repository already uses.

## What not to improvise

- Do not transfer a repository, import history into the organization,
  or treat a proposal as accepted. A move happens only after the
  recorded decision, and it preserves authorship, credits, history,
  and the applicable licenses.
- Do not promise a dedicated team, funding, a support deadline, or
  permanent maintenance. Hosting a proposal is not acceptance.
- An idea with no source code is outside this intake. Incubation
  still needs code that reviewers can read. The project need not be
  finished or run in a browser.
- Do not have the organization take a repository that has no named
  maintainer. A maintainer who steps down opens a public handover
  issue. With no successor, the documented status is inactive or
  archived, not a promise of continued support.
- Sponsorship or paid work does not buy acceptance, decision-making
  rights, revenue sharing, or a narrower license. This policy does
  not create a dual license, a payment service, or a hosted
  subscription. An existing free browser game stays free to play.
- Do not share credentials or private data in a proposal. Do not adopt
  OCA licenses or OCA legal agreements. Game Studio 42 is independent
  of OCA.
