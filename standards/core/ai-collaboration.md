---
title: AI Collaboration Standard
platform: all
load_when: "Always. How AI coding agents should consume and apply this standards library."
updated: 2026-06
---

# AI Collaboration Standard

This library is designed to be read by **AI coding agents** (Claude Code, Cursor, Copilot, etc.) as much as by humans. This document defines how an agent loads, prioritizes, and applies these standards.

## How to read this library

1. **Start at the index.** The installed `coding-standards/INDEX.md` lists only the standards active in *this* project, each with a one-line "load when" trigger. Read it first.
2. **Load on demand.** Don't load every file. Pull the standard that matches the task (e.g. UI work → `web/_base/frontend-standards.md`; an event handler → `backend/architecture/event-driven.md`). Each file's front-matter has a `load_when` hint.
3. **Respect precedence.** When rules appear to conflict: a more specific platform/track doc overrides a general one, and `MUST` overrides `SHOULD`. Surface the conflict to the user rather than guessing.

## How rules are written (and how to obey them)

This library uses RFC 2119 keywords. Treat them literally:

- **MUST / MUST NOT** — hard constraint. Never violate without explicit user approval.
- **SHOULD / SHOULD NOT** — strong default. Deviate only with a stated reason.
- **MAY** — discretionary.

Rules are imperative bullets, often paired with **DO / DON'T** examples. Pattern-match to the examples — they encode the intent more precisely than prose.

## Agent guardrails

- **MUST NOT** introduce a dependency, framework, or pattern that contradicts the project's active standards. If the task seems to require one, ask first.
- **MUST** follow the [language rule](coding-conventions.md): code/comments/logs in English, user-facing text routed through i18n to the product's configured locale.
- **MUST** write tests per [`testing-strategy.md`](testing-strategy.md) and never claim untested code is tested.
- **MUST** place code where the architecture dictates (see [`clean-architecture-ddd.md`](clean-architecture-ddd.md)) instead of inventing new top-level structure.
- **MUST** verify that any file, symbol, version, or flag named in a standard still exists in the codebase before acting on it — standards can drift from code.
- **SHOULD** prefer the smallest change that satisfies the request; do not add speculative abstractions or modules.
- **SHOULD** cite the standard and section that drove a decision when explaining your work (e.g. "per `event-driven.md` → Idempotency").

## Keeping standards agent-friendly (for authors)

When editing or adding a standard:

- **MUST** give every file YAML front-matter: `title`, `platform`/`track`, `load_when`, `updated`.
- **MUST** state rules as imperative MUST/SHOULD bullets, not narrative paragraphs.
- **SHOULD** include at least one DO/DON'T or good/bad code pair per non-trivial rule.
- **SHOULD** keep each file focused on one topic and reasonably short — agents pay tokens for everything they load.
- **SHOULD NOT** hardcode volatile facts (exact patch versions, file lists) the agent can read from source; date-stamp instead and review.
- **MUST NOT** duplicate a rule across files — link to the single source of truth.

## Relationship to AGENTS.md / CLAUDE.md

The cross-vendor convention in 2026 is a root **`AGENTS.md`** as the single instruction file, with tool-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/`) acting as thin pointers to it. A project using this library SHOULD add a root `AGENTS.md` whose body points the agent to `coding-standards/INDEX.md` as the standards source of truth.

```md
<!-- AGENTS.md -->
# Project agent instructions
Coding standards live in `coding-standards/`. Read `coding-standards/INDEX.md`
first and load standards on demand per their `load_when` triggers.
```

## References

- AGENTS.md convention — https://agents.md
- Anthropic — Claude Code best practices — https://www.anthropic.com/engineering/claude-code-best-practices
- RFC 2119 (requirement keywords) — https://www.rfc-editor.org/rfc/rfc2119
