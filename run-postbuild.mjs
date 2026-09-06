import fs from "node:fs";

const source = fs.readFileSync("postbuild.mjs", "utf8");
const fixed = source.replace(
  'await navigator.clipboard.writeText(`${payload.text}\\n${payload.url}`);',
  'await navigator.clipboard.writeText(payload.text + "\\n" + payload.url);'
);

const runtimePath = ".postbuild-runtime.mjs";
fs.writeFileSync(runtimePath, fixed, "utf8");
try {
  await import(`./${runtimePath}?v=${Date.now()}`);
} finally {
  fs.rmSync(runtimePath, { force: true });
}
