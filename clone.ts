#!/usr/bin/env -S deno --allow-env --allow-read --allow-write --allow-run
import { fs, path } from "./deps.ts";
import { prepareDestPath, clone, openEditor } from "./mod.ts";
const { args, exit, env } = Deno;

async function main() {
  try {
    const { EDITOR: editor, SRC_DIR: root = "~/src" } = env();
    const [source] = args;

    if (!source) {
      throw new Error("You must specify a repository to clone.");
    }

    const dest = prepareDestPath(path.untildify(root), source);

    fs.ensureDirSync(dest);
    await clone(source, dest);
    await openEditor(editor, dest);

    console.log("Done.");
  } catch (e) {
    console.log(`Error: ${e.message}`);
    exit(1);
  }
}

main();
