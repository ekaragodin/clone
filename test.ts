import { deepStrictEqual as assertEquals, rejects as assertRejects } from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  clone,
  type CommandRunner,
  expandHomeDir,
  getHelpText,
  openEditor,
  prepareDestPath,
} from "./mod.js";

test("prepareDestPath supports https and ssh remotes", function () {
  assertEquals(
    prepareDestPath("/src", "https://github.com/denoland/deno.git"),
    "/src/github.com/denoland/deno",
  );
  assertEquals(
    prepareDestPath("/src", "git@github.com:denoland/deno.git"),
    "/src/github.com/denoland/deno",
  );
});

test("expandHomeDir expands a leading tilde", function () {
  assertEquals(expandHomeDir("~/src", "/Users/tester"), "/Users/tester/src");
  assertEquals(expandHomeDir("~", "/Users/tester"), "/Users/tester");
  assertEquals(expandHomeDir("/tmp/src", "/Users/tester"), "/tmp/src");
});

test("getHelpText returns basic usage and example", function () {
  assertEquals(
    getHelpText(),
    [
      "A simple utility for the convenient clone.",
      "",
      "Usage: clone <repository>",
      "",
      "Example: clone https://github.com/denoland/deno.git",
    ].join("\n"),
  );
});

test("clone invokes git clone when destination is not cloned yet", async function () {
  const dest = await mkdtemp(join(tmpdir(), "clone-test-"));
  let received:
    | {
      command: string;
      args: string[];
    }
    | undefined;

  const runner: CommandRunner = (command, args) => {
    received = { command, args };
    return Promise.resolve(true);
  };

  try {
    await clone("https://github.com/denoland/deno.git", dest, runner);

    assertEquals(received, {
      command: "git",
      args: ["clone", "https://github.com/denoland/deno.git", dest],
    });
  } finally {
    await rm(dest, { recursive: true });
  }
});

test("clone skips git clone when repository already exists", async function () {
  const dest = await mkdtemp(join(tmpdir(), "clone-test-"));
  let invocationCount = 0;

  const runner: CommandRunner = () => {
    invocationCount += 1;
    return Promise.resolve(true);
  };

  try {
    await mkdir(`${dest}/.git`);
    await clone("https://github.com/denoland/deno.git", dest, runner);
    assertEquals(invocationCount, 0);
  } finally {
    await rm(dest, { recursive: true });
  }
});

test("clone throws when git clone fails", async function () {
  const dest = await mkdtemp(join(tmpdir(), "clone-test-"));

  try {
    await assertRejects(
      () =>
        clone(
          "https://github.com/denoland/deno.git",
          dest,
          () => Promise.resolve(false),
        ),
      { message: "Failed to clone." },
    );
  } finally {
    await rm(dest, { recursive: true });
  }
});

test("openEditor invokes the configured editor", async function () {
  let received:
    | {
      command: string;
      args: string[];
    }
    | undefined;

  const runner: CommandRunner = (command, args) => {
    received = { command, args };
    return Promise.resolve(true);
  };

  await openEditor("code", "/tmp/project", runner);

  assertEquals(received, {
    command: "code",
    args: ["/tmp/project"],
  });
});

test("openEditor supports editor arguments from EDITOR", async function () {
  let received:
    | {
      command: string;
      args: string[];
    }
    | undefined;

  const runner: CommandRunner = (command, args) => {
    received = { command, args };
    return Promise.resolve(true);
  };

  await openEditor("zed --wait", "/tmp/project", runner);

  assertEquals(received, {
    command: "zed",
    args: ["--wait", "/tmp/project"],
  });
});

test("openEditor supports quoted executable paths", async function () {
  let received:
    | {
      command: string;
      args: string[];
    }
    | undefined;

  const runner: CommandRunner = (command, args) => {
    received = { command, args };
    return Promise.resolve(true);
  };

  await openEditor(
    '"/Applications/Zed Preview.app/Contents/MacOS/zed" --wait',
    "/tmp/project",
    runner,
  );

  assertEquals(received, {
    command: "/Applications/Zed Preview.app/Contents/MacOS/zed",
    args: ["--wait", "/tmp/project"],
  });
});

test("openEditor throws when the editor command fails", async function () {
  await assertRejects(
    () => openEditor("code", "/tmp/project", () => Promise.resolve(false)),
    { message: "Failed to open editor." },
  );
});


test("expandHomeDir preserves a tilde when HOME is absent", () => {
  assertEquals(expandHomeDir("~/src"), "~/src");
});

test("clone recognizes a .git file", async () => {
  const { writeFile } = await import("node:fs/promises");
  const dest = await mkdtemp(join(tmpdir(), "clone-test-"));
  try {
    await writeFile(join(dest, ".git"), "gitdir: elsewhere");
    await clone("https://example.invalid/repo.git", dest, () => {
      throw new Error("Git must not run");
    });
  } finally {
    await rm(dest, { recursive: true });
  }
});

for (const editor of ["", "   ", '""']) {
  test(`openEditor skips an empty executable: ${JSON.stringify(editor)}`, async () => {
    await openEditor(editor, "/tmp/project", () => {
      throw new Error("Editor must not run");
    });
  });
}

for (const [editor, message] of [
  ['"unterminated', "Environment variable 'EDITOR' has an unterminated quote."],
  ["editor\\", "Environment variable 'EDITOR' ends with an escape."],
]) {
  test(`openEditor rejects invalid command: ${JSON.stringify(editor)}`, async () => {
    await assertRejects(() => openEditor(editor, "/tmp/project"), { message });
  });
}

test("openEditor passes shell syntax and spaces as literal arguments", async () => {
  let received: string[] = [];
  await openEditor('editor "$(whoami)" ";" ""', "/tmp/project with spaces", (_command, args) => {
    received = args;
    return Promise.resolve(true);
  });
  assertEquals(received, ["$(whoami)", ";", "", "/tmp/project with spaces"]);
});

test("the real runner succeeds on zero exit", async () => {
  await openEditor(`"${process.execPath}" -e 'process.exit(0)'`, "/tmp/project");
});

for (const script of ['process.exit(7)', 'process.kill(process.pid, "SIGTERM")']) {
  test(`the real runner rejects unsuccessful termination: ${script}`, async () => {
    await assertRejects(
      () => openEditor(`"${process.execPath}" -e '${script}'`, "/tmp/project"),
      { message: "Failed to open editor." },
    );
  });
}

test("the real runner reports a missing executable", async () => {
  const dest = await mkdtemp(join(tmpdir(), "clone-test-"));
  try {
    await assertRejects(() => openEditor(`"${join(dest, "missing-editor")}"`, dest), { code: "ENOENT" });
  } finally {
    await rm(dest, { recursive: true });
  }
});
