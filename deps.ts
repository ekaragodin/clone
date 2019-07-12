import * as fs from "https://deno.land/std/fs/mod.ts";
import * as stdPath from "https://deno.land/std/fs/path.ts";
import * as extraPath from "https://denopkg.com/ekaragodin/deno_extra/path/mod.ts";

const path = {
  ...stdPath,
  ...extraPath
};

export { fs, path };
