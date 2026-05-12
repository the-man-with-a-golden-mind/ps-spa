# Publishing Readiness

`ps-spa` is now shaped as two publishable surfaces:

- an npm package for the CLI and scaffolding workflow
- a PureScript library package with Registry-oriented metadata in [`spago.yaml`](../spago.yaml)

## Library Shape

The PureScript library boundary is now explicit:

- PureScript sources live in `src/**/*.purs`
- PureScript tests live in `test/**/*.purs`
- [`spago.dhall`](../spago.dhall) still supports the current legacy local toolchain in this repo
- [`spago.yaml`](../spago.yaml) defines the package name, dependencies, test entrypoint, and `publish` metadata expected by modern Spago / Registry workflows

The important `spago.yaml` metadata now includes:

- `package.name: ps-spa`
- `publish.version`
- `publish.license`
- `publish.location.githubOwner`
- `publish.location.githubRepo`

This follows the modern Spago / Registry model documented by the official Spago README: [purescript/spago](https://github.com/purescript/spago).

## npm / CLI Artifact

The npm package is still the operational CLI release:

- it exposes the `ps-spa` binary
- it ships the PureScript framework sources in `src`
- scaffolded apps can consume those sources from `node_modules/ps-spa/src/**/*.purs`
- scaffolded apps also consume the Vite plugin from `ps-spa/scripts/vite-plugin.mjs`

## Ready

- `package.json` is public, licensed, and has npm publish metadata
- `scripts/ps-spa.mjs` has a proper executable shebang
- `ps-spa new` scaffolds apps against the installed package instead of this monorepo layout
- the npm package `files` whitelist includes `src`, `scripts`, `spago.dhall`, and `spago.yaml`
- release metadata is checked by `node scripts/release-check.mjs`
- `prepublishOnly` runs the release check automatically

## Remaining Practical Checks

For npm:

1. `npm run release:check`
2. `npm pack --dry-run`
3. `npm publish --access public`

For a PureScript Registry release:

1. use a modern Spago environment with `spago publish`
2. verify the `spago.yaml` build plan and version bounds in that environment
3. publish the library package through the Registry flow

In this workspace, the local installed `spago` is still legacy `0.20.x`, so the Registry flow could not be executed end-to-end here.
That is a local tooling limitation, not a missing package boundary in the repo.

## Still Separate Concerns

- npm CLI release and PureScript Registry release are related, but not the same artifact
- consumer app scaffolding can stay npm-first even when the library is also published to the Registry
- CI-driven publish automation and authenticated Registry ownership operations are still future work
