#!/usr/bin/env node

import { resolve } from "node:path";
import { scan, countNodes } from "./scanner.js";
import { compress } from "./compress.js";
import { render } from "./renderer.js";

const HEADER = `# COMPRESSED FILE TREE — AI READ GUIDE
# {a,b,c}.ext  → siblings sharing extension   | scripts/f.js → collapsed single-child dir
# {...}.ext     → truncated list (more exist)  | decompress: expand braces × each entry = 1 path
#`;

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: treezip [directory]");
    console.log("  Outputs a compressed, AI-optimized directory tree.");
    process.exit(0);
  }

  const target = args.find((a) => !a.startsWith("-")) ?? ".";
  const rootPath = resolve(target);

  const tree = scan(rootPath);
  const compressed = compress(tree);
  const { dirs, files } = countNodes(tree);

  // Use the original argument (or .) as the display root name, with trailing /
  const displayRoot = target.replace(/\/$/, "") + "/";

  const body = render(displayRoot, compressed);

  console.log(HEADER);
  console.log(body);
  console.log(`\n${dirs} directories, ${files} files`);
}

main();
