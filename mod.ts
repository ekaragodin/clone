import { fs, path } from "./deps.ts";
const { run } = Deno;

export function prepareDestPath(destDir, source) {
  const { protocol, hostname, pathname } = new URL(source);
  const [, sshHostname = ""] = protocol.match(/^git@(.*):$/) || [];

  return path.join(
    destDir,
    sshHostname || hostname,
    pathname.replace(/.git$/, "")
  );
}

export async function clone(source, dest) {
  const isCloned = await fs.exists(path.join(dest, ".git"));

  if (isCloned) {
    console.log(`Repository '${source}' already exist.`);
    return;
  }

  console.log(`Clone '${source}' into '${dest}'...`);

  const clone = run({
    args: ["git", "clone", source, dest]
  });
  const cloneResult = await clone.status();

  if (!cloneResult.success) {
    throw new Error("Failed to clone.");
  }
}

export async function openEditor(editor, dest) {
  if (!editor) {
    console.log("Environment variable 'EDITOR' is empty.");
    return;
  }

  console.log(`Open '${dest}' in '${editor}'...`);

  const open = run({
    args: [editor, dest]
  });
  const openResult = await open.status();

  if (!openResult.success) {
    throw new Error("Failed to open editor.");
  }
}
