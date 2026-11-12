# Snap package

Read this when the repository has `snap/snapcraft.yaml`. The snap
packages the desktop build of the same game. It does not grow a second
simulation.

`snap/snapcraft.yaml` is the recipe. Follow the build the repository
already uses. Do not copy a recipe from another title.

## Layout

- `snap/gui` is the desktop entry and the icon. Snapcraft copies them
  to `meta/gui`.
- `snapcraft upload-metadata` reads the packed snap. It sends the
  title, summary, description, license, and the icon from `meta/gui`.
  It does not send a banner, screenshots, a category, or listing links.
- The Snap Store does not scan the repository, `snap/store/`, or the
  packed snap for listing media. A file is not uploaded because of the
  directory it sits in.
- A banner is uploaded in the listing media. The store recognizes it
  by file name: `banner.jpg` or `banner.png`, aspect ratio 3:1, from
  720×240 to 4320×1440, at most 2 MB. An optional banner icon uses the
  same upload and is named `banner-icon.jpg` or `banner-icon.png`.
- When the project has a banner, the versioned copy lives in
  `snap/store/` under that file name. Do not invent another path. That
  directory is not part of the snap. Do not encode one title's pixel
  size; use the store's current range.
- Screenshots are listing media too. The store does not take them from
  `snap/store/` or from a documentation directory. Upload the files the
  repository already uses. Do not copy them into `snap/store/` so a
  command will notice them.
- Do not commit a built `*.snap`.

## Metadata

- `license` is the SPDX id of the code the snap ships, and it matches
  the repository `LICENSE`. See `rules/06-licensing.md`.
- The listing category is not a key in `snapcraft.yaml`. Set it on the
  listing.
- `website`, `contact`, `source-code`, and `issues` in the recipe ship
  inside the snap. The listing's website, contact, source, and issues
  stay empty until they are set on the store. `upload` and
  `upload-metadata` do not copy them.
- Keep `confinement: strict`. Do not relax confinement so an embedded
  browser sandbox can start. The snap sandbox is the confinement.
- Take the version from the app package with `adopt-info`. Do not keep
  a second version number that can drift.

## Publishing

Continuous integration may build the snap and smoke-test it. Publishing
to the Snap Store, and promoting a channel such as `stable`, is a
separate step. Do not add a store credential or promote a channel
without explicit authorization. `upload-metadata` does not replace that
step, and a later revision upload does not fill listing fields the
first upload left empty.
