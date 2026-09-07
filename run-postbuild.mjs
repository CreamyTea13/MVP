import fs from "node:fs";

await import('./postbuild.mjs');

const indexNowKey = "bb07bc1aac3124e31ea838541931a21b";
fs.writeFileSync(`dist/${indexNowKey}.txt`, `${indexNowKey}\n`, "utf8");
