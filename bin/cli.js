#!/usr/bin/env node

// Interactive installer for the coding-standards library.
// Lets the user pick exactly the standards their project needs (by platform /
// architecture) and copies only those into ./coding-standards, then generates
// an INDEX.md so AI coding agents know which standards are active.

const fs = require("fs");
const path = require("path");

const STANDARDS_DIR = path.join(__dirname, "..", "standards");
const TARGET_DIR = path.join(process.cwd(), "coding-standards");
const MANIFEST = path.join(TARGET_DIR, ".standards-manifest.json");

// The exact flat file set shipped by v1.x. Used to clean up a v1 install on
// upgrade without touching the user's own root-level files.
const LEGACY_V1_FILES = new Set([
  "architecture-patterns.md",
  "backend-standards.md",
  "database-conventions.md",
  "frontend-standards.md",
  "mobile-flutter-standards.md",
  "mobile-react-native-standards.md",
  "technical-preferences-ux.md",
  "technology-stack.md",
  "vite-config-standard.md",
]);

// ── Selectable architecture docs (backend, opt-in) ───────────────────────────
const ARCH_DOCS = [
  { id: "anatomy", file: "microservice-anatomy.md", label: "Microservice anatomy (layers, events)" },
  { id: "multitenancy", file: "multitenancy.md", label: "Multi-tenancy (RLS, tenant catalog)" },
  { id: "events", file: "event-driven.md", label: "Event-driven (outbox, sagas)" },
  { id: "api", file: "public-api-facade.md", label: "Public API facade (gateway, webhooks)" },
  { id: "bff", file: "bff-standard.md", label: "Backend for Frontend (BFF)" },
  { id: "shared", file: "shared-vs-owned.md", label: "Shared vs owned components" },
];

// ── Resolve which directories/files to copy from a selection ─────────────────
function resolveSources(sel) {
  const sources = []; // { from: absolute path, to: relative path under coding-standards }

  // core is always included
  sources.push({ dir: "core" });

  if (sel.backend) {
    // base backend docs
    for (const f of ["backend-standards.md", "technology-stack.md", "database-conventions.md"]) {
      sources.push({ file: path.join("backend", f) });
    }
    // always-included distributed-architecture decision guide (the "what to pick & when" map)
    sources.push({ file: path.join("backend", "architecture", "choosing-distributed-architecture.md") });
    // opt-in architecture docs
    for (const a of ARCH_DOCS) {
      if (sel.arch.includes(a.id)) {
        sources.push({ file: path.join("backend", "architecture", a.file) });
      }
    }
  }

  if (sel.web) {
    sources.push({ dir: path.join("web", "_base") });
    sources.push({ dir: path.join("web", sel.web) }); // spa | single-spa | microfrontends
  }

  for (const fw of sel.mobile) {
    sources.push({ dir: path.join("mobile", fw) }); // flutter | react-native
  }

  return sources;
}

// ── Copy helpers ─────────────────────────────────────────────────────────────
function listMarkdown(absDir) {
  const out = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(abs));
    else if (entry.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

function copyFile(absFrom) {
  const rel = path.relative(STANDARDS_DIR, absFrom);
  const dest = path.join(TARGET_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(absFrom, dest);
  return rel.split(path.sep).join("/");
}

function copySources(sources) {
  const copied = [];
  for (const s of sources) {
    if (s.dir) {
      const abs = path.join(STANDARDS_DIR, s.dir);
      if (!fs.existsSync(abs)) continue;
      for (const f of listMarkdown(abs)) copied.push(copyFile(f));
    } else if (s.file) {
      const abs = path.join(STANDARDS_DIR, s.file);
      if (!fs.existsSync(abs)) continue;
      copied.push(copyFile(abs));
    }
  }
  return [...new Set(copied)].sort();
}

// ── Upgrade / re-run cleanup ─────────────────────────────────────────────────
// Remove files this installer created on a previous run (tracked in the
// manifest) plus any v1 flat-layout leftovers, so upgrading from v1 or changing
// the selection never leaves stale, contradictory standards behind. Files the
// installer doesn't own are never touched.
function cleanPreviousInstall() {
  if (!fs.existsSync(TARGET_DIR)) return { removed: 0, legacy: 0 };
  let removed = 0;
  let legacy = 0;

  // 1. Files tracked by a previous v2 run.
  if (fs.existsSync(MANIFEST)) {
    try {
      const prev = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
      for (const rel of prev.files || []) {
        const abs = path.join(TARGET_DIR, rel);
        if (fs.existsSync(abs)) { fs.rmSync(abs); removed++; }
      }
    } catch {
      /* corrupt manifest — fall through to legacy detection */
    }
  }

  // 2. v1 leftovers: remove only the exact flat files v1 shipped — never the
  //    user's own root-level markdown.
  for (const entry of fs.readdirSync(TARGET_DIR, { withFileTypes: true })) {
    if (entry.isFile() && LEGACY_V1_FILES.has(entry.name)) {
      fs.rmSync(path.join(TARGET_DIR, entry.name));
      legacy++;
    }
  }

  pruneEmptyDirs(TARGET_DIR);
  return { removed, legacy };
}

function pruneEmptyDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sub = path.join(dir, entry.name);
    pruneEmptyDirs(sub);
    if (fs.readdirSync(sub).length === 0) fs.rmdirSync(sub);
  }
}

function writeManifest(copied, sel) {
  const data = {
    version: require("../package.json").version,
    selection: describeSelection(sel),
    files: copied,
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(data, null, 2) + "\n");
}

// ── Front-matter parsing for INDEX generation ────────────────────────────────
function readFrontMatter(relPath) {
  const abs = path.join(TARGET_DIR, relPath);
  const text = fs.readFileSync(abs, "utf8");
  const m = text.match(/^---\s*([\s\S]*?)\s*---/);
  const fm = { title: "", load_when: "" };
  if (m) {
    for (const line of m[1].split("\n")) {
      const t = line.match(/^title:\s*(.+)$/);
      const l = line.match(/^load_when:\s*"?(.+?)"?\s*$/);
      if (t) fm.title = t[1].trim();
      if (l) fm.load_when = l[1].trim();
    }
  }
  if (!fm.title) {
    // fall back to first H1 or filename
    const h1 = text.match(/^#\s+(.+)$/m);
    fm.title = h1 ? h1[1].trim() : path.basename(relPath, ".md");
  }
  return fm;
}

function generateIndex(copied, sel) {
  const lines = [];
  lines.push("# Coding Standards — Active Set");
  lines.push("");
  lines.push("> Generated by `@jeffrey2423/coding-standards`. These are the standards active in THIS project.");
  lines.push("> AI agents: read this first, then load a standard on demand per its **Load when** trigger.");
  lines.push("");
  lines.push(`Selection: ${describeSelection(sel)}`);
  lines.push("");
  lines.push("| Standard | File | Load when |");
  lines.push("|---|---|---|");
  for (const rel of copied) {
    const fm = readFrontMatter(rel);
    const lw = fm.load_when || "—";
    lines.push(`| ${fm.title} | \`${rel}\` | ${lw} |`);
  }
  lines.push("");
  lines.push("## Precedence");
  lines.push("");
  lines.push("- A more specific platform/track doc overrides a general one.");
  lines.push("- `MUST` overrides `SHOULD`. Surface real conflicts to the user instead of guessing.");
  lines.push("");
  fs.writeFileSync(path.join(TARGET_DIR, "INDEX.md"), lines.join("\n"));
}

function describeSelection(sel) {
  const parts = [];
  if (sel.backend) parts.push(`backend (arch: ${sel.arch.length ? sel.arch.join(", ") : "none"})`);
  if (sel.web) parts.push(`web/${sel.web}`);
  if (sel.mobile.length) parts.push(`mobile/${sel.mobile.join("+")}`);
  return parts.length ? parts.join("; ") : "core only";
}

// ── Flag parsing (non-interactive mode) ──────────────────────────────────────
function parseFlags(argv) {
  const flags = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, v] = arg.slice(2).split("=");
    flags[k] = v === undefined ? true : v;
  }
  return flags;
}

function selectionFromFlags(flags) {
  const all = flags.all === true;
  const sel = { backend: false, web: null, mobile: [], arch: [] };

  if (all) {
    sel.backend = true;
    sel.web = "microfrontends";
    sel.mobile = ["flutter", "react-native"];
    sel.arch = ARCH_DOCS.map((a) => a.id);
    return sel;
  }

  if (flags.backend) sel.backend = true;
  if (typeof flags.web === "string") sel.web = flags.web;
  else if (flags.web === true) sel.web = "spa";
  if (typeof flags.mobile === "string") sel.mobile = flags.mobile.split(",").map((s) => s.trim());

  if (sel.backend) {
    if (flags["no-arch"]) sel.arch = [];
    else if (typeof flags.arch === "string" && flags.arch !== "all") {
      sel.arch = flags.arch.split(",").map((s) => s.trim()).filter((id) => ARCH_DOCS.some((a) => a.id === id));
    } else {
      sel.arch = ARCH_DOCS.map((a) => a.id); // default: all
    }
  }
  return sel;
}

function hasPlatformFlag(flags) {
  return flags.all || flags.backend || flags.web !== undefined || flags.mobile !== undefined;
}

// ── Interactive mode (@clack/prompts) ────────────────────────────────────────
async function interactive() {
  const p = await import("@clack/prompts");
  p.intro("📐 coding-standards — pick what your project needs");

  const platforms = await p.multiselect({
    message: "What are you building? (space to toggle, enter to confirm)",
    options: [
      { value: "backend", label: "Backend / API (.NET)" },
      { value: "web", label: "Frontend Web" },
      { value: "mobile", label: "Mobile" },
    ],
    required: false,
  });
  if (p.isCancel(platforms)) cancel(p);

  const sel = { backend: false, web: null, mobile: [], arch: [] };
  sel.backend = platforms.includes("backend");

  if (platforms.includes("web")) {
    const web = await p.select({
      message: "Web architecture:",
      options: [
        { value: "spa", label: "SPA (single deployable)", hint: "default" },
        { value: "single-spa", label: "Single-SPA", hint: "mixed frameworks / hard isolation" },
        { value: "microfrontends", label: "Microfrontends (Module Federation)", hint: "license-gated, multi-product" },
      ],
      initialValue: "spa",
    });
    if (p.isCancel(web)) cancel(p);
    sel.web = web;
  }

  if (platforms.includes("mobile")) {
    const mobile = await p.multiselect({
      message: "Mobile framework:",
      options: [
        { value: "flutter", label: "Flutter" },
        { value: "react-native", label: "React Native" },
      ],
      required: true,
    });
    if (p.isCancel(mobile)) cancel(p);
    sel.mobile = mobile;
  }

  if (sel.backend) {
    const arch = await p.multiselect({
      message: "Backend — distributed architecture standards (opt-in):",
      options: ARCH_DOCS.map((a) => ({ value: a.id, label: a.label })),
      initialValues: ARCH_DOCS.map((a) => a.id),
      required: false,
    });
    if (p.isCancel(arch)) cancel(p);
    sel.arch = arch;
  }

  return sel;
}

function cancel(p) {
  p.cancel("Cancelled — nothing was written.");
  process.exit(0);
}

// ── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
coding-standards — copy modern, AI-ready coding standards into your project.

Usage:
  npx @jeffrey2423/coding-standards              interactive
  npx @jeffrey2423/coding-standards [flags]      non-interactive

Flags:
  --backend                 include .NET backend standards
  --web[=track]             include web standards (track: spa | single-spa | microfrontends; default spa)
  --mobile=flutter,react-native   include mobile standards (comma-separated)
  --arch=a,b,... | --no-arch      backend architecture docs (default: all). ids: ${ARCH_DOCS.map((a) => a.id).join(", ")}
  --all                     include everything
  --yes, -y                 run non-interactively with whatever flags are given
  --help, -h                show this help

Examples:
  npx @jeffrey2423/coding-standards --backend --web=microfrontends
  npx @jeffrey2423/coding-standards --mobile=flutter --yes
  npx @jeffrey2423/coding-standards --all
`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const flags = parseFlags(argv);

  if (flags.help || argv.includes("-h")) {
    printHelp();
    return;
  }

  let sel;
  const nonInteractive = hasPlatformFlag(flags) || flags.yes || argv.includes("-y");
  if (nonInteractive) {
    sel = selectionFromFlags(flags);
  } else {
    sel = await interactive();
  }

  const sources = resolveSources(sel);
  const upgrading = fs.existsSync(TARGET_DIR);
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Idempotent: clear what we previously owned (and any v1 leftovers) first.
  const { removed, legacy } = cleanPreviousInstall();
  if (upgrading && (removed || legacy)) {
    const note = legacy ? ` (incl. ${legacy} from a previous flat-layout v1 install)` : "";
    console.log(`Existing install detected — removed ${removed + legacy} stale file(s)${note}.`);
  }

  const copied = copySources(sources);
  generateIndex(copied, sel);
  writeManifest(copied, sel);

  console.log(`\n✓ Copied ${copied.length} standard files to coding-standards/`);
  console.log(`✓ Generated coding-standards/INDEX.md  (selection: ${describeSelection(sel)})`);
  console.log("\nNext: point your AI agent at coding-standards/INDEX.md (e.g. from AGENTS.md).");
}

main().catch((err) => {
  console.error("\n✗ Installation failed:", err.message);
  process.exit(1);
});
