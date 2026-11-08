import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const remote = "https://example.invalid/owner/repo.git";

export function run(command: string, args: string[], options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  timeout?: number;
} = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 30_000,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

export function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "clone-fixture-"));
  const source = join(root, "origin repo");
  const cwd = join(root, "outside checkout");
  const sources = join(root, "sources with spaces");
  const dest = join(sources, "example.invalid/owner/repo");
  const editor = join(root, "recording editor.mjs");
  const record = join(root, "editor.jsonl");
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: root,
    SRC_DIR: sources,
    EDITOR: `"${process.execPath}" "${editor}" --wait`,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: `url.${pathToFileURL(source).href}.insteadOf`,
    GIT_CONFIG_VALUE_0: remote,
    GIT_ALLOW_PROTOCOL: "file",
    GIT_TERMINAL_PROMPT: "0",
  };
  try {
    mkdirSync(cwd);
    mkdirSync(source);
    writeFileSync(join(source, "README.md"), "Local clone fixture\n");
    for (const args of [
      ["init", "--quiet", source],
      ["-C", source, "add", "README.md"],
      ["-C", source, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "Fixture"],
    ]) {
      const result = run("git", args, { env });
      assert.equal(result.status, 0, result.stderr);
    }
    writeFileSync(editor, `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(record)}, JSON.stringify(process.argv.slice(2)) + "\\n");\n`);
    return {
      root, cwd, sources, dest, editor, record, env,
      cleanup: () => rmSync(root, { recursive: true, force: true }),
    };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

export function verifyClone(command: string, args: string[] = [], env: NodeJS.ProcessEnv = {}) {
  const fixture = createFixture();
  try {
    for (let invocation = 0; invocation < 2; invocation++) {
      const result = run(command, [...args, remote], { cwd: fixture.cwd, env: { ...env, ...fixture.env } });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Done\.\n$/);
      assert.match(result.stdout, invocation === 0 ? /Clone '/ : /already exist\./);
    }
    assert.equal(readFileSync(join(fixture.dest, "README.md"), "utf8"), "Local clone fixture\n");
    assert.deepEqual(readFileSync(fixture.record, "utf8").trim().split("\n").map(line => JSON.parse(line)), [
      ["--wait", fixture.dest], ["--wait", fixture.dest],
    ]);
  } finally {
    fixture.cleanup();
  }
}
