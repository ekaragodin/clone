import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { getHelpText } from "./mod.js";
import { createFixture, remote, run, verifyClone } from "./test-support/fixture.js";

const cli = fileURLToPath(new URL("./clone.js", import.meta.url));

test("clone --help prints help and exits successfully without side effects", () => {
  const fixture = createFixture();
  try {
    const result = run(process.execPath, [cli, remote, "--help"], {
      cwd: fixture.cwd,
      env: { ...fixture.env, PATH: "", EDITOR: "missing-editor" },
    });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trimEnd(), getHelpText());
    assert.equal(result.stderr, "");
    assert.equal(existsSync(fixture.sources), false);
  } finally {
    fixture.cleanup();
  }
});

test("missing repository reports the existing error", () => {
  const result = run(process.execPath, [cli]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "Error: You must specify a repository to clone.\n");
});

test("CLI clones a local fixture and reopens it on the second invocation", () => {
  verifyClone(process.execPath, [cli]);
});

test("CLI ignores extra positional arguments and skips an unset editor", () => {
  const fixture = createFixture();
  try {
    const result = run(process.execPath, [cli, remote, "ignored"], {
      cwd: fixture.cwd, env: { ...fixture.env, EDITOR: "" },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(fixture.record), false);
    assert.equal(readFileSync(join(fixture.dest, "README.md"), "utf8"), "Local clone fixture\n");
  } finally {
    fixture.cleanup();
  }
});

test("clone failure never launches the editor", () => {
  const fixture = createFixture();
  try {
    const result = run(process.execPath, [cli, remote], {
      cwd: fixture.cwd,
      env: { ...fixture.env, GIT_CONFIG_KEY_0: `url.file://${fixture.root}/absent.insteadOf` },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Error: Failed to clone\./);
    assert.equal(existsSync(fixture.record), false);
    assert.doesNotMatch(result.stdout, /Done\./);
  } finally {
    fixture.cleanup();
  }
});

test("filesystem errors prevent Git and editor execution", () => {
  const fixture = createFixture();
  try {
    writeFileSync(fixture.sources, "not a directory");
    const result = run(process.execPath, [cli, remote], fixture);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^Error: /);
    assert.equal(result.stdout, "");
    assert.equal(existsSync(fixture.record), false);
  } finally {
    fixture.cleanup();
  }
});

test("the real editor runner inherits stdin and stdout", () => {
  const fixture = createFixture();
  try {
    writeFileSync(fixture.editor, `import { readFileSync } from "node:fs";\nprocess.stdout.write("Editor received: " + readFileSync(0, "utf8"));\n`);
    const result = run(process.execPath, [cli, remote], { ...fixture, input: "hello\n" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Editor received: hello\nDone\.\n$/);
  } finally {
    fixture.cleanup();
  }
});
