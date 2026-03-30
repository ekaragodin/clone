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
  if (!editor) {
    console.log("Environment variable 'EDITOR' is empty.");
    return;
  }

  console.log(`Open '${dest}' in '${editor}'...`);

  if (!await runner(editor, [dest])) {
    throw new Error("Failed to open editor.");
  }
}
