import { exists } from "jsr:@std/fs@1.0.23";
import * as path from "jsr:@std/path@1.1.4";

export type CommandRunner = (
  command: string,
  args: string[],
) => Promise<boolean>;

const runCommand: CommandRunner = async (command, args) => {
  const child = new Deno.Command(command, { args }).spawn();
  const { success } = await child.status;

  return success;
};

export function getHelpText() {
  return [
    "A simple utility for the convenient clone.",
    "",
    "Usage: clone <repository>",
    "",
    "Example: clone https://github.com/denoland/deno.git",
  ].join("\n");
}

function parseCommandLine(input: string) {
  const parts: string[] = [];
  let current = "";
  let quote: '"' | "'" | undefined;
  let escaping = false;
  let tokenStarted = false;

  const pushCurrent = () => {
    if (!tokenStarted) {
      return;
    }

    parts.push(current);
    current = "";
    tokenStarted = false;
  };

  for (const char of input) {
    if (escaping) {
      current += char;
      tokenStarted = true;
      escaping = false;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = undefined;
        continue;
      }

      if (quote === '"' && char === "\\") {
        escaping = true;
        tokenStarted = true;
        continue;
      }

      current += char;
      tokenStarted = true;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      tokenStarted = true;
      continue;
    }

    if (/\s/.test(char)) {
      pushCurrent();
      continue;
    }

    if (char === "\\") {
      escaping = true;
      tokenStarted = true;
      continue;
    }

    current += char;
    tokenStarted = true;
  }

  if (escaping) {
    throw new Error("Environment variable 'EDITOR' ends with an escape.");
  }

  if (quote) {
    throw new Error("Environment variable 'EDITOR' has an unterminated quote.");
  }

  pushCurrent();

  return parts;
}

export function expandHomeDir(input: string, homeDir?: string) {
  if (!homeDir) {
    return input;
  }

  if (input === "~") {
    return homeDir;
  }

  if (input.startsWith("~/")) {
    return path.join(homeDir, input.slice(2));
  }

  return input;
}

export function prepareDestPath(destDir: string, source: string) {
  const { hostname, pathname } = new URL(source, "ssh://");
  const [, , sshHostname = "", sshPathname = ""] =
    pathname.match(/^\/(\w+)@(.*):(.*)$/) || [];

  return path.join(
    destDir,
    sshHostname || hostname,
    (sshPathname || pathname).replace(/\.git$/, ""),
  );
}

export async function clone(
  source: string,
  dest: string,
  runner: CommandRunner = runCommand,
) {
  const isCloned = await exists(path.join(dest, ".git"));

  if (isCloned) {
    console.log(`Repository '${source}' already exist.`);
    return;
  }

  console.log(`Clone '${source}' into '${dest}'...`);

  if (!await runner("git", ["clone", source, dest])) {
    throw new Error("Failed to clone.");
  }
}

export async function openEditor(
  editor: string,
  dest: string,
  runner: CommandRunner = runCommand,
) {
  if (!editor.trim()) {
    console.log("Environment variable 'EDITOR' is empty.");
    return;
  }

  const [command, ...editorArgs] = parseCommandLine(editor);

  if (!command) {
    console.log("Environment variable 'EDITOR' is empty.");
    return;
  }

  console.log(`Open '${dest}' in '${editor}'...`);

  if (!await runner(command, [...editorArgs, dest])) {
    throw new Error("Failed to open editor.");
  }
}
