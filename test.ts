#!/usr/bin/env -S deno --allow-all

import { test, runIfMain } from "https://deno.land/std@v0.31.0/testing/mod.ts";
import { assertEquals } from "https://deno.land/std@v0.31.0/testing/asserts.ts";
import { prepareDestPath } from "./mod.ts";

test(function testPrepareDestPath() {
  assertEquals(
    prepareDestPath("/src", "https://github.com/denoland/deno.git"),
    "/src/github.com/denoland/deno"
  );
  assertEquals(
    prepareDestPath("/src", "git@github.com:denoland/deno.git"),
    "/src/github.com/denoland/deno"
  );
});

runIfMain(import.meta);
