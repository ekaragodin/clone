import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getHelpText } from "../dist/mod.js";
import { run, verifyClone } from "../dist/test-support/fixture.js";

const repo = fileURLToPath(new URL("..", import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "clone-install-"));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "Run this check with npm run test:install");
const npxCli = join(dirname(npmCli), "npx-cli.js");
const env = {
  ...process.env,
  npm_config_cache: join(temp, "npm-cache"),
  npm_config_userconfig: join(temp, "user.npmrc"),
  npm_config_globalconfig: join(temp, "global.npmrc"),
  npm_config_update_notifier: "false",
};
writeFileSync(env.npm_config_userconfig, "");
writeFileSync(env.npm_config_globalconfig, "");

function npm(args, options = {}) {
  const result = run(process.execPath, [npmCli, ...args], {
    cwd: temp, env, timeout: 120_000, ...options,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function checkHelp(command, args = [], options = {}) {
  const result = run(command, [...args, "--help"], { cwd: temp, env, ...options });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trimEnd(), getHelpText());
  assert.equal(result.stderr, "");
}

try {
  const [packed] = JSON.parse(npm(["pack", repo, "--json", "--ignore-scripts", "--pack-destination", temp]));
  assert.deepEqual(packed.files.map(file => file.path).sort(), [
    "LICENSE", "README.md", "dist/clone.js", "dist/mod.d.ts", "dist/mod.js", "package.json",
  ]);
  const tarball = join(temp, packed.filename);
  const prefix = join(temp, "global");
  npm(["install", "--global", "--prefix", prefix, "--ignore-scripts", "--no-audit", "--no-fund", tarball]);
  const executable = join(prefix, "bin/clone");
  checkHelp(executable);
  verifyClone(executable);
  const installed = join(prefix, "lib/node_modules/@ekaragodin/clone");
  assert.throws(() => readFileSync(join(installed, "node_modules/typescript/package.json")));
  const consumer = join(temp, "consumer");
  mkdirSync(consumer);
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
  npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], { cwd: consumer });
  const library = run(process.execPath, ["--input-type=module", "-e",
    'const { prepareDestPath } = await import("@ekaragodin/clone"); process.stdout.write(prepareDestPath("/src", "https://example.invalid/owner/repo.git"));',
  ], { cwd: consumer, env });
  assert.equal(library.status, 0, library.stderr);
  assert.equal(library.stdout, "/src/example.invalid/owner/repo");
  assert.equal(library.stderr, "");
  console.log("Packed global installation and library import passed.");

  const npxEnv = { ...env, npm_config_cache: join(temp, "npx-cache") };
  const npxArgs = [npxCli, "--yes", "--offline", "--package", tarball, "clone"];
  checkHelp(process.execPath, npxArgs, { env: npxEnv });
  verifyClone(process.execPath, npxArgs, npxEnv);
  console.log("npx execution from an isolated cache passed.");

  const gitSource = join(temp, "git-source");
  mkdirSync(gitSource);
  for (const file of ["package.json", "package-lock.json", "tsconfig.json", "clone.ts", "mod.ts", "test.ts", "cli.test.ts", "test-support", "README.md", "LICENSE", ".gitignore"]) {
    cpSync(join(repo, file), join(gitSource, file), { recursive: true });
  }
  const gitEnv = { ...env, HOME: temp, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
  for (const args of [
    ["init", "--quiet", gitSource],
    ["-C", gitSource, "add", "."],
    ["-C", gitSource, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "Candidate source"],
  ]) {
    const result = run("git", args, { env: gitEnv });
    assert.equal(result.status, 0, result.stderr);
  }
  const gitConsumer = join(temp, "git-consumer");
  mkdirSync(gitConsumer);
  writeFileSync(join(gitConsumer, "package.json"), JSON.stringify({ private: true }));
  npm(["install", "--no-audit", "--no-fund", `git+${pathToFileURL(gitSource).href}`], { cwd: gitConsumer, env: gitEnv });
  checkHelp(join(gitConsumer, "node_modules/.bin/clone"));
  verifyClone(join(gitConsumer, "node_modules/.bin/clone"));
  console.log("Direct Git-source installation and preparation passed.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
