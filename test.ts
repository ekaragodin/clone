import { assertEquals } from "https://deno.land/std@v0.62.0/testing/asserts.ts";
import { prepareDestPath } from "./mod.ts";

Deno.test("testPrepareDestPath", function () {
  assertEquals(
    prepareDestPath("/src", "https://github.com/denoland/deno.git"),
    "/src/github.com/denoland/deno",
  );
  assertEquals(
    prepareDestPath("/src", "git@github.com:denoland/deno.git"),
    "/src/github.com/denoland/deno",
  );
});
