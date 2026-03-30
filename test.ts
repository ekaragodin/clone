import { assertEquals, assertRejects } from "jsr:@std/assert@1.0.19";
import {
  clone,
  type CommandRunner,
  expandHomeDir,
  openEditor,
  prepareDestPath,
} from "./mod.ts";

Deno.test("prepareDestPath supports https and ssh remotes", function () {
  assertEquals(
    prepareDestPath("/src", "https://github.com/denoland/deno.git"),
    "/src/github.com/denoland/deno",
  );
  assertEquals(
    prepareDestPath("/src", "git@github.com:denoland/deno.git"),
    "/src/github.com/denoland/deno",
  );
});

Deno.test("expandHomeDir expands a leading tilde", function () {
  assertEquals(expandHomeDir("~/src", "/Users/tester"), "/Users/tester/src");
  assertEquals(expandHomeDir("~", "/Users/tester"), "/Users/tester");
  assertEquals(expandHomeDir("/tmp/src", "/Users/tester"), "/tmp/src");
});

Deno.test("clone invokes git clone when destination is not cloned yet", async function () {
  const dest = await Deno.makeTempDir();
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
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test("clone skips git clone when repository already exists", async function () {
  const dest = await Deno.makeTempDir();
  let invocationCount = 0;

  const runner: CommandRunner = () => {
    invocationCount += 1;
    return Promise.resolve(true);
  };

  try {
    await Deno.mkdir(`${dest}/.git`);
    await clone("https://github.com/denoland/deno.git", dest, runner);
    assertEquals(invocationCount, 0);
  } finally {
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test("clone throws when git clone fails", async function () {
  const dest = await Deno.makeTempDir();

  try {
    await assertRejects(
      () =>
        clone(
          "https://github.com/denoland/deno.git",
          dest,
          () => Promise.resolve(false),
        ),
      Error,
      "Failed to clone.",
    );
  } finally {
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test("openEditor invokes the configured editor", async function () {
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

Deno.test("openEditor supports editor arguments from EDITOR", async function () {
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

Deno.test("openEditor supports quoted executable paths", async function () {
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

Deno.test("openEditor throws when the editor command fails", async function () {
  await assertRejects(
    () => openEditor("code", "/tmp/project", () => Promise.resolve(false)),
    Error,
    "Failed to open editor.",
  );
});
