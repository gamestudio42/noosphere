# Language

English covers the whole game project. A repository note that asks for
another authoring language does not override this rule.

- Write source code, identifiers, comments, and docstrings in English.
- Write commit messages and technical pull-request descriptions in English.
- Write design documents in English: GDD, specification, architecture,
  roadmap, and decisions. The file without a suffix is the original
  (`README.md`, `docs/GDD.md`).
- A translation may sit beside that file: `README.pt-BR.md`,
  `README.es.md`, `README.fr.md`, `README.de.md`, and the same suffix
  on a design document. Do not create a translation without the English
  file. In the same change that edits the English file, update every
  translation that already exists. A stale translation is not delivered.
  If a locale could not be updated, name it in the delivery report and
  say why.
- Respond to the user in their preferred language.
- Write new player-facing strings in English. In the same change, add
  `pt-BR`, `es`, `fr`, and `de` through the repository translation
  workflow (Godot CSV/PO, or the web project's i18n files). Do not
  replace an English source string with a translation.
- Preserve existing translated strings.
- Follow the repository's translation file layout. The source language
  stays English.
