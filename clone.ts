#!/usr/bin/env deno --allow-env --allow-read --allow-write --allow-run
import { ensureDirSync } from "https://deno.land/std/fs/mod.ts";
import { prepareDestPath, clone, openEditor } from "./mod.ts";
const { args, exit, env } = Deno;
import { untildify } from "https://denopkg.com/ekaragodin/deno_extra/path/mod.ts";

async function main() {
  try {
    const { EDITOR: editor, SRC_DIR: root = "~/src" } = env();
    const [, source] = args;

    if (!source) {
      throw new Error("You must specify a repository to clone.");
    }

    const dest = prepareDestPath(untildify(root), source);

    ensureDirSync(dest);
    await clone(source, dest);
    await openEditor(editor, dest);

    console.log("Done.");
  } catch (e) {
    console.log(`Error: ${e.message}`);
    exit(1);
  }
}

main();
