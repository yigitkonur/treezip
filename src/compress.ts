import type { TreeNode } from "./scanner.js";

const MAX_GROUP_ITEMS = 8;
const TRUNCATED_SHOW = 5;

// ── Compressed output types ──────────────────────────────────────────

export type CompressedItem =
  | { kind: "file"; name: string }
  | { kind: "brace-group"; stems: string[]; ext: string; truncated: boolean }
  | { kind: "dir"; name: string; children: CompressedItem[] }
  | { kind: "inline-dir"; prefix: string; item: CompressedItem };

// ── Public API ───────────────────────────────────────────────────────

export function compress(node: TreeNode): CompressedItem[] {
  if (!node.isDir) return [{ kind: "file", name: node.name }];
  return compressChildren(node);
}

// ── Core logic ───────────────────────────────────────────────────────

function compressChildren(node: TreeNode): CompressedItem[] {
  const files = node.children.filter((c) => !c.isDir);
  const dirs = node.children.filter((c) => c.isDir);

  const hasFiles = files.length > 0;
  const hasDirs = dirs.length > 0;

  // Recursively compress each subdir first
  const compressedDirs = dirs.map((d) => compressDir(d));

  if (hasFiles && hasDirs) {
    // Rule 1 — Mixed directory: group ALL files into one brace group
    const fileItems: CompressedItem[] =
      files.length >= 2
        ? [makeBraceGroupFullNames(files.map((f) => f.name))]
        : [{ kind: "file", name: files[0].name }];
    return [...fileItems, ...compressedDirs];
  }

  if (hasFiles && !hasDirs) {
    // Rule 2 — Files-only directory: group by extension
    return groupByExtension(files.map((f) => f.name));
  }

  // Dirs only
  return compressedDirs;
}

/** Compress a single directory node, applying inline/single-child collapse */
function compressDir(node: TreeNode): CompressedItem {
  // Rule 4 — Single-child chain collapse
  const chain: string[] = [node.name];
  let current = node;
  while (current.children.length === 1) {
    const only = current.children[0];
    if (only.isDir) {
      chain.push(only.name);
      current = only;
    } else {
      // Single file child → full chain collapse
      return {
        kind: "inline-dir",
        prefix: chain.join("/"),
        item: { kind: "file", name: only.name },
      };
    }
  }

  const chainPrefix = chain.join("/");
  const children = compressChildren(current);

  // Rule 3 — Inline collapse: if files-only dir compresses to 1 item
  const onlyFiles = current.children.every((c) => !c.isDir);
  if (onlyFiles && children.length === 1) {
    return { kind: "inline-dir", prefix: chainPrefix, item: children[0] };
  }

  return { kind: "dir", name: chainPrefix, children };
}

// ── Extension-based grouping (Rule 2) ────────────────────────────────

function getExtensionCandidates(filename: string): string[] {
  const parts = filename.split(".");
  if (parts.length <= 1) return []; // no extension (e.g., LICENSE, gitignore)
  const candidates: string[] = [];
  // Longest first: .test.ts before .ts
  for (let i = 1; i < parts.length; i++) {
    candidates.push("." + parts.slice(i).join("."));
  }
  candidates.reverse(); // longest first
  return candidates;
}

function getStem(filename: string, ext: string): string {
  return filename.slice(0, filename.length - ext.length);
}

function groupByExtension(filenames: string[]): CompressedItem[] {
  // Build extension → files mapping
  const extToFiles = new Map<string, string[]>();
  for (const f of filenames) {
    for (const ext of getExtensionCandidates(f)) {
      if (!extToFiles.has(ext)) extToFiles.set(ext, []);
      extToFiles.get(ext)!.push(f);
    }
  }

  // Sort by extension length (longest first) for greedy assignment
  const sortedExts = [...extToFiles.entries()]
    .filter(([, files]) => files.length >= 2)
    .sort((a, b) => b[0].length - a[0].length);

  const assigned = new Set<string>();
  const groups: { ext: string; files: string[] }[] = [];

  for (const [ext, extFiles] of sortedExts) {
    const unassigned = extFiles.filter((f) => !assigned.has(f));
    if (unassigned.length >= 2) {
      groups.push({ ext, files: unassigned.sort() });
      for (const f of unassigned) assigned.add(f);
    }
  }

  // Remaining files are standalones
  const standalones = filenames.filter((f) => !assigned.has(f)).sort();

  const result: CompressedItem[] = [];

  // Standalones first
  if (standalones.length >= 2) {
    result.push(makeBraceGroupFullNames(standalones));
  } else if (standalones.length === 1) {
    result.push({ kind: "file", name: standalones[0] });
  }

  // Then extension groups (sorted by extension alphabetically)
  groups.sort((a, b) => a.ext.localeCompare(b.ext));
  for (const g of groups) {
    const stems = g.files.map((f) => getStem(f, g.ext));
    const truncated = stems.length > MAX_GROUP_ITEMS;
    result.push({
      kind: "brace-group",
      stems: truncated ? stems.slice(0, TRUNCATED_SHOW) : stems,
      ext: g.ext,
      truncated,
    });
  }

  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────

function makeBraceGroupFullNames(names: string[]): CompressedItem {
  const sorted = [...names].sort();
  const truncated = sorted.length > MAX_GROUP_ITEMS;
  return {
    kind: "brace-group",
    stems: truncated ? sorted.slice(0, TRUNCATED_SHOW) : sorted,
    ext: "",
    truncated,
  };
}
