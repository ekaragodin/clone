# clone

[![CI](https://github.com/ekaragodin/clone/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/ekaragodin/clone/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ekaragodin/clone.svg)](https://github.com/ekaragodin/clone)

Clone repositories into an organized source directory and open your editor.
Requires Node.js 24 or newer and Git. Supports macOS and Linux.

## Usage

```bash
clone https://github.com/denoland/deno.git
```

This creates `~/src/github.com/denoland/deno`, clones the repository there, and
opens it in `$EDITOR` when configured. If the repository already exists, it
opens it without cloning again.

HTTPS and SSH remotes are supported:

```bash
clone git@github.com:denoland/deno.git
clone --help
```

## Install

After the first npm release, install globally:

```bash
npm install --global @ekaragodin/clone
clone https://github.com/denoland/deno.git
```

Or run without a global installation:

```bash
npx @ekaragodin/clone https://github.com/denoland/deno.git
```

The package contains compiled JavaScript; consumers do not need TypeScript or a
build step. Until the first registry release, build from a checkout:

```bash
git clone https://github.com/ekaragodin/clone.git
cd clone
npm ci
npm install --global .
```

Use a revision containing the Node.js migration if it has not reached the
default branch yet. Some npm versions inherit global installation settings
while preparing Git dependencies, so use the checkout workflow above rather
than a direct global installation from a Git URL.

When replacing an older Deno installation, check `command -v clone` to see which
executable your shell resolves. Remove the previous installation with
`deno uninstall --global clone` before using npm's command, and ensure npm's
global bin directory (`$(npm prefix --global)/bin`) is in `PATH`.

## Configure

Use environment variables:

- `$EDITOR`: editor executable, optionally with arguments, such as `zed --wait`.
  Quote executable paths containing spaces.
- `$SRC_DIR`: root directory for sources; defaults to `~/src`.

For example:

```bash
export SRC_DIR="$HOME/Code"
export EDITOR='zed --wait'
clone https://github.com/denoland/deno.git
```

Editor commands support quotes and escapes. They run directly, without shell
expansion, pipes, or command substitution.

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:install
```

`npm ci` builds the project through `prepare`. `npm test` rebuilds and runs
Node's test runner. Tests clone a local fixture without external Git hosts.
Installation checks pack the candidate, install it under temporary npm prefixes,
run it through npx with an isolated cache, import its public library entry, and
install directly from a disposable Git source repository into a local consumer.
They leave your global installation untouched.

The library helpers are available through the package's ESM entry point:

```js
import { prepareDestPath } from "@ekaragodin/clone";
```

## Release

Confirm npm scope access and the package version before the first release.
After all development checks pass, inspect the artifact and publish it:

```bash
npm run build
npm pack --dry-run
npm publish --dry-run
npm publish --access public
```

The `prepare` hook builds before packing and publication. After publication,
verify global installation and npx execution against the released version
using a clean prefix and cache. Registry publication is a manual step.

## License

MIT © [Evgenii Karagodin](https://ekaragodin.com)
