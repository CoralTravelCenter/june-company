import fs from "node:fs";
import path from "node:path";
import Typograf from "typograf";

import {r, writeIfChanged} from "./_utils.mjs";

const MARKUP_DIR = r("src/markup");
const CHECK_ONLY = process.argv.includes("--check");

const tp = new Typograf({
  locale: ["ru", "en-US"],
});

function listHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function typografHtml(html) {
  return tp.execute(html);
}

function run() {
  const files = listHtmlFiles(MARKUP_DIR);
  let changed = 0;

  for (const file of files) {
    const prev = fs.readFileSync(file, "utf8");
    const next = typografHtml(prev);

    if (prev === next) continue;

    changed++;
    const rel = path.relative(process.cwd(), file);

    if (CHECK_ONLY) {
      console.log(`[typograf] would update: ${rel}`);
      continue;
    }

    writeIfChanged(file, next, `[typograf] updated: ${rel}`);
  }

  if (CHECK_ONLY && changed > 0) {
    process.exitCode = 1;
  }

  console.log(`[typograf] done. changed=${changed}/${files.length}`);
}

run();
