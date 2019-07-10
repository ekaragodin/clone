# clone

A simple utility for the convenient clone.

## Install

```bash
deno install clone https://denopkg.com/ekaragodin/clone/clone.ts --allow-all
```

> By default scripts are installed at $HOME/.deno/bin and that directory must be added to the path manually. See more in Deno [docs](https://deno.land/manual.html#installingexecutablescripts).

## Usage

```bash
clone https://github.com/denoland/deno.git
```

This command creates the directory `github.com/denoland` at `~/src` directory. Then it clones the repository at this directory and opens the cloned repository in your editor.

## Configure

We use environment variables for configuration.

- `$EDITOR` - a path to an editor to open cloned repository.
- `$SRC_DIR` - a path to a root directory for sources.

## License

MIT © [Evgenii Karagodin](https://ekaragodin.com)
