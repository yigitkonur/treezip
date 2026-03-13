import { readdirSync, statSync, lstatSync } from "node:fs";
import { join } from "node:path";

export interface TreeNode {
  name: string;
  isDir: boolean;
  children: TreeNode[];
}

const DEFAULT_IGNORES = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
  ".Spotlight-V100",
  ".Trashes",
  "__pycache__",
  ".pnpm",
]);

export function scan(rootPath: string, ignores = DEFAULT_IGNORES): TreeNode {
  const stat = statSync(rootPath);
  const name = rootPath.split("/").filter(Boolean).pop() ?? rootPath;

  if (!stat.isDirectory()) {
    return { name, isDir: false, children: [] };
  }

  const entries = readdirSync(rootPath).filter((e) => !ignores.has(e)).sort();

  const files: TreeNode[] = [];
  const dirs: TreeNode[] = [];

  for (const entry of entries) {
    const fullPath = join(rootPath, entry);
    let entryStat;
    try {
      entryStat = lstatSync(fullPath);
    } catch {
      continue;
    }

    // Skip symlinks
    if (entryStat.isSymbolicLink()) continue;

    if (entryStat.isDirectory()) {
      dirs.push(scan(fullPath, ignores));
    } else if (entryStat.isFile()) {
      files.push({ name: entry, isDir: false, children: [] });
    }
  }

  // Files first (alphabetical), then dirs (alphabetical)
  return {
    name,
    isDir: true,
    children: [...files, ...dirs],
  };
}

/** Count total files and directories in a TreeNode (excludes root) */
export function countNodes(node: TreeNode): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;

  function walk(n: TreeNode) {
    for (const child of n.children) {
      if (child.isDir) {
        dirs++;
        walk(child);
      } else {
        files++;
      }
    }
  }

  walk(node);
  return { dirs, files };
}
