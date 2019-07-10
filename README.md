# clone

A simple utility for convenient clone.

## Usage

```bash
clone https://github.com/denoland/deno.git
```

This command creates a directory `github.com/denoland` in the `~/src` directory. Then it clones the repository into this directory and opens cloned repository in your editor.

## Configure

We use environment variables for configuration.

    - `$EDITOR` - a path to an editor to open cloned repository.
    - `$SRC_DIR` - a path to a root directory for sources.

## License

MIT © [Evgenii Karagodin](https://ekaragodin.com)
