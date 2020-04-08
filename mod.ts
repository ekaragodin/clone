import { fs, path } from "./deps.ts";
const { run } = Deno;

export function prepareDestPath(destDir: string, source: string) {
  const { hostname, pathname } = new URL(source, "ssh://");
  const [, , sshHostname = "", sshPathname = ""] =
    pathname.match(/^\/(\w+)@(.*):(.*)$/) || [];

  return path.join(
    destDir,
    sshHostname || hostname,
    (sshPathname || pathname).replace(/.git$/, "")
  );
}

export async function clone(source: string, dest: string) {
  const isCloned = await fs.exists(path.join(dest, ".git"));

  if (isCloned) {
    console.log(`Repository '${source}' already exist.`);
    return;
  }

  console.log(`Clone '${source}' into '${dest}'...`);

  const clone = run({
    cmd: ["git", "clone", source, dest],
  });
  const cloneResult = await clone.status();

  if (!cloneResult.success) {
    throw new Error("Failed to clone.");
  }
}

export async function openEditor(editor: string, dest: string) {
  if (!editor) {
    console.log("Environment variable 'EDITOR' is empty.");
    return;
  }

  console.log(`Open '${dest}' in '${editor}'...`);

  const open = run({
    cmd: [editor, dest],
  });
  const openResult = await open.status();

  if (!openResult.success) {
    throw new Error("Failed to open editor.");
  }
}
