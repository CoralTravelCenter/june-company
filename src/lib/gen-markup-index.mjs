import path from "node:path";
import fs from "node:fs";
import chokidar from "chokidar";
import posthtml from "posthtml";
import posthtmlInclude from "posthtml-include";

import {absEq, ensureDir, existsFile, r, readBlocks, writeIfChanged} from "./_utils.mjs";

const WATCH = process.argv.includes("--watch");

const ORDER_FILE = r("src/order.json");

const MARKUP_DIR = r("src/markup");
const OUT_FILE = path.join(MARKUP_DIR, "index.js");

async function buildHtml(htmlFile) {
  const source = fs.readFileSync(htmlFile, "utf8");
  const result = await posthtml([
    posthtmlInclude({
      root: path.dirname(htmlFile),
      encoding: "utf-8",
    }),
  ]).process(source);

  return result.html.trim();
}

async function generate() {
  ensureDir(MARKUP_DIR);

  const blocks = readBlocks(ORDER_FILE);
  const present = [];

  for (const key of blocks) {
    const htmlFile = path.join(MARKUP_DIR, `${key}.html`);
    if (existsFile(htmlFile)) present.push(key);
  }

  if (present.length === 0) {
    writeIfChanged(OUT_FILE, "export default [];\n", "[gen-markup] updated (empty)");
    return;
  }

  const entries = await Promise.all(
    present.map(async (key) => {
      const htmlFile = path.join(MARKUP_DIR, `${key}.html`);
      const html = await buildHtml(htmlFile);
      return `{ key: ${JSON.stringify(key)}, html: ${JSON.stringify(html)} }`;
    })
  );

  writeIfChanged(OUT_FILE, `export default [${entries.join(", ")}];\n`, "[gen-markup] updated");
}

// once
generate().catch((error) => {
  console.error("[gen-markup] failed:", error);
  process.exitCode = 1;
});

// watch
if (WATCH) {
  let t = null;
  const schedule = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      generate().catch((error) => {
        console.error("[gen-markup] failed:", error);
      });
    }, 80);
  };

  chokidar
    .watch([ORDER_FILE, MARKUP_DIR], {
      ignoreInitial: true,
      awaitWriteFinish: {stabilityThreshold: 120, pollInterval: 30},
    })
    .on("change", (filePath) => {
      if (absEq(filePath, OUT_FILE)) return; // анти-луп
      schedule();
    })
    .on("add", schedule)
    .on("unlink", schedule)
    .on("addDir", schedule)
    .on("unlinkDir", schedule);
}
