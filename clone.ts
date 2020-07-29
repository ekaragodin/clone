#!/usr/bin/env -S deno run --unstable --allow-env --allow-read --allow-write --allow-run
import { fs, path } from "./deps.ts";
import { prepareDestPath, clone, openEditor } from "./mod.ts";
const { args, exit, env } = Deno;

async function main() {
  try {
    const editor = env.get("EDITOR");
    const root = env.get("SRC_DIR") || "~/src";
    const [source] = args;

    if (!source) {
      throw new Error("You must specify a repository to clone.");
    }

    const dest = prepareDestPath(path.untildify(root), source);

    fs.ensureDirSync(dest);
    await clone(source, dest);
    if (editor) {
      await openEditor(editor, dest);
    }

    console.log("Done.");
  } catch (e) {
    console.log(`Error: ${e.message}`);
    exit(1);
  }
}

main();
