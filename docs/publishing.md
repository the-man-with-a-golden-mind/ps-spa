# Publishing Readiness

`ps-spa` is now structured for a clean npm release.

## Release Target

The first-class public artifact is the npm package:

- it exposes the `ps-spa` CLI
- it ships the PureScript framework sources in `src`
- generated apps consume those sources from `node_modules/ps-spa/src/**/*.purs`

This is intentionally different from a separate PureScript registry release.
The npm package is the release path for `0.1.x`.

## Ready

- `package.json` is public, licensed, and has npm publish metadata
- `scripts/ps-spa.mjs` has a proper executable shebang
- `ps-spa new` scaffolds apps against `node_modules/ps-spa`, not this monorepo layout
- the package includes the CLI, docs, sources, and supporting scripts through the `files` whitelist
- release metadata is checked by `node scripts/release-check.mjs`
- `prepublishOnly` runs the release check automatically

## Remaining Practical Check

The last release step should still be run in a healthy environment:

1. `npm run release:check`
2. `npm pack --dry-run`
3. `npm publish --access public`

In this workspace, `npm pack --dry-run` could not be verified because the local `npm/node` installation is broken.
That is an environment problem, not a package-structure problem.

## Not Included In This Release

- a separate PureScript registry package flow
- CI-driven publish automation
- signed release provenance beyond standard npm publish config
