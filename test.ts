import { assertEquals } from "https://deno.land/std@v0.39.0/testing/asserts.ts";
import { prepareDestPath } from "./mod.ts";

Deno.test(function testPrepareDestPath() {
  assertEquals(
    prepareDestPath("/src", "https://github.com/denoland/deno.git"),
    "/src/github.com/denoland/deno"
  );
  assertEquals(
    prepareDestPath("/src", "git@github.com:denoland/deno.git"),
    "/src/github.com/denoland/deno"
  );
});
