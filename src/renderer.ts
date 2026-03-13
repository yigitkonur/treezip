import type { CompressedItem } from "./compress.js";

const PIPE = "│   ";
const TEE = "├── ";
const ELBOW = "└── ";
const SPACE = "    ";

export function render(
  rootName: string,
  items: CompressedItem[],
): string {
  const lines: string[] = [rootName];
  renderItems(items, "", lines);
  return lines.join("\n");
}

function renderItems(
  items: CompressedItem[],
  prefix: string,
  lines: string[],
): void {
  for (let i = 0; i < items.length; i++) {
    const isLast = i === items.length - 1;
    const connector = isLast ? ELBOW : TEE;
    const childPrefix = prefix + (isLast ? SPACE : PIPE);
    const item = items[i];

    switch (item.kind) {
      case "file":
        lines.push(`${prefix}${connector}${item.name}`);
        break;

      case "brace-group":
        lines.push(`${prefix}${connector}${formatBraceGroup(item.stems, item.ext, item.truncated)}`);
        break;

      case "inline-dir":
        lines.push(`${prefix}${connector}${item.prefix}/${formatInlineItem(item.item)}`);
        break;

      case "dir":
        lines.push(`${prefix}${connector}${item.name}/`);
        renderItems(item.children, childPrefix, lines);
        break;
    }
  }
}

function formatBraceGroup(
  stems: string[],
  ext: string,
  truncated: boolean,
): string {
  const inner = truncated ? [...stems, "..."].join(",") : stems.join(",");
  return `{${inner}}${ext}`;
}

function formatInlineItem(item: CompressedItem): string {
  switch (item.kind) {
    case "file":
      return item.name;
    case "brace-group":
      return formatBraceGroup(item.stems, item.ext, item.truncated);
    default:
      return "?";
  }
}
