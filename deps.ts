import * as fs from "https://deno.land/std@0.62.0/fs/mod.ts";
import * as stdPath from "https://deno.land/std@0.62.0/path/mod.ts";
import * as extraPath from "https://denopkg.com/ekaragodin/deno_extra@v1.2.0/path/mod.ts";

const path = {
  ...stdPath,
  ...extraPath,
};

export { fs, path };
