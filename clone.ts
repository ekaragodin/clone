#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-run
import { ensureDirSync } from "jsr:@std/fs@1.0.23";
import {
  clone,
  expandHomeDir,
  getHelpText,
  openEditor,
  prepareDestPath,
} from "./mod.ts";
const { args, exit, env } = Deno;

async function main() {
  try {
    if (args.includes("--help")) {
      console.log(getHelpText());
      return;
    }

    const editor = env.get("EDITOR");
    const root = env.get("SRC_DIR") || "~/src";
    const [source] = args;

    if (!source) {
      throw new Error("You must specify a repository to clone.");
    }

    const dest = prepareDestPath(
      expandHomeDir(root, env.get("HOME") ?? undefined),
      source,
    );

    ensureDirSync(dest);
    await clone(source, dest);
    if (editor) {
      await openEditor(editor, dest);
    }

    console.log("Done.");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Error: ${message}`);
    exit(1);
  }
}

main();
