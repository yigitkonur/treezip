# treezip

Compressed directory trees for AI prompts. Zero dependencies.

`tree` output is verbose — `treezip` compresses it using brace grouping, directory collapsing, and truncation so you can fit more codebase structure into fewer tokens.

## Install

```bash
npm install -g treezip
```

Or run directly:

```bash
npx treezip ./my-project
```

## Before / After

**`tree` (43 lines):**

```
my-project/
├── docs
│   ├── api-reference.md
│   ├── contributing.md
│   └── getting-started.md
├── package.json
├── public
│   └── images
│       ├── avatar.png
│       ├── background.png
│       ├── badge.png
│       ├── banner.png
│       ├── feature.png
│       ├── hero.png
│       ├── icon.png
│       ├── logo.png
│       ├── pattern.png
│       ├── placeholder.png
│       └── screenshot.png
├── README.md
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Modal.tsx
│   │   └── Sidebar.tsx
│   ├── hooks
│   │   ├── useApi.ts
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── index.ts
│   └── utils
│       ├── api.ts
│       ├── auth.ts
│       ├── format.ts
│       └── validate.ts
├── tests
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   ├── Header.test.tsx
│   ├── Modal.test.tsx
│   ├── setup.ts
│   └── Sidebar.test.tsx
└── tsconfig.json
```

**`treezip` (17 lines):**

```
my-project/
├── {.gitignore,README.md,package.json,tsconfig.json}
├── docs/{api-reference,contributing,getting-started}.md
├── public/images/{avatar,background,badge,banner,feature,...}.png
├── src/
│   ├── {App.tsx,index.ts}
│   ├── components/{Button,Card,Header,Modal,Sidebar}.tsx
│   ├── hooks/{useApi,useAuth,useTheme}.ts
│   └── utils/{api,auth,format,validate}.ts
└── tests/
    ├── setup.ts
    └── {Button,Card,Header,Modal,Sidebar}.test.tsx
```

**60% fewer lines.** Same information. Every brace group decompresses to exactly one file per entry.

## How it works

| Pattern | Meaning | Example |
|---|---|---|
| `{a,b,c}.ext` | Siblings sharing an extension | `{Button,Card,Modal}.tsx` |
| `{a.x,b.y}` | Siblings with different extensions | `{README.md,tsconfig.json}` |
| `dir/{stems}.ext` | All files in dir share an extension | `utils/{api,auth,format}.ts` |
| `dir/file` | Single-child directory collapsed | `scripts/build.sh` |
| `{a,b,...}.ext` | Truncated group (more files exist) | `images/{logo,hero,...}.png` |

### Compression rules

1. **Mixed directories** (files + subdirs): all files grouped into one `{...}` set
2. **Files-only directories**: grouped by shared extension (compound-aware: `.test.ts`, `.config.js`)
3. **Inline collapse**: directories that compress to a single item shown inline
4. **Single-child chain**: `a/b/c.txt` when each level has one child
5. **Truncation**: groups with >8 items show the first 5 + `...`

### Default ignores

`node_modules`, `.git`, `.DS_Store`, `__pycache__`, `.pnpm`

## Output header

Every output includes a self-documenting header:

```
# COMPRESSED FILE TREE — AI READ GUIDE
# {a,b,c}.ext  → siblings sharing extension   | scripts/f.js → collapsed single-child dir
# {...}.ext     → truncated list (more exist)  | decompress: expand braces × each entry = 1 path
```

This lets LLMs interpret the format without extra instructions.

## Programmatic API

```ts
import { scan, compress, render, countNodes } from "treezip";

const tree = scan("./my-project");
const compressed = compress(tree);
const { dirs, files } = countNodes(tree);
const output = render("my-project/", compressed);
console.log(output);
```

## License

MIT
