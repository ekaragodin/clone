#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import {
  clone,
  expandHomeDir,
  getHelpText,
  openEditor,
  prepareDestPath,
} from "./mod.js";
const args = process.argv.slice(2);

async function main() {
  try {
    if (args.includes("--help")) {
      console.log(getHelpText());
      return;
    }

    const editor = process.env.EDITOR;
    const root = process.env.SRC_DIR || "~/src";
    const [source] = args;

    if (!source) {
      throw new Error("You must specify a repository to clone.");
    }

    const dest = prepareDestPath(
      expandHomeDir(root, process.env.HOME),
      source,
    );

    await mkdir(dest, { recursive: true });
    await clone(source, dest);
    if (editor) {
      await openEditor(editor, dest);
    }

    console.log("Done.");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

await main();
