import * as fs from "https://deno.land/std@v0.31.0/fs/mod.ts";
import * as stdPath from "https://deno.land/std@v0.31.0/path/mod.ts";
import * as extraPath from "https://denopkg.com/ekaragodin/deno_extra@v1.0.1/path/mod.ts";

const path = {
  ...stdPath,
  ...extraPath
};

export { fs, path };
