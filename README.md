# clone

[![CI](https://github.com/ekaragodin/clone/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/ekaragodin/clone/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/ekaragodin/clone.svg)](https://github.com/ekaragodin/clone)

A simple utility for the convenient clone.

## Usage

```bash
clone https://github.com/denoland/deno.git
```

Use `clone --help` to see the basic command format and an example invocation.

This command creates the directory `~/src/github.com/denoland/deno`. Then it
clones the repository into this directory and opens it in your editor.

## Install

```bash
deno install --global --allow-env --allow-read --allow-write --allow-run --force --name clone https://raw.githubusercontent.com/ekaragodin/clone/master/clone.ts
```

> By default scripts are installed at `$HOME/.deno/bin`. See the Deno
> [install command docs](https://docs.deno.com/runtime/reference/cli/install/).

## Configure

We use environment variables for configuration.

- `$EDITOR` - a path to an editor to open cloned repository. Arguments are
  supported too, for example `zed --wait`.
- `$SRC_DIR` - a path to a root directory for sources.

## License

MIT © [Evgenii Karagodin](https://ekaragodin.com)
