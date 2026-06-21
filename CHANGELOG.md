# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.5.1] - 2026-06

### Docs
- Added a **"Why this exists"** section to the README that states the package's core principle: architectural decisions are made once at install time and the installed docs commit to them, so AI agents read one consistent source of truth instead of re-opening settled decisions.

## [2.5.0] - 2026-06

### Added
- **Decision-aware installs.** The installer now commits the documents to the architecture chosen at install time, so AI agents reading them don't diverge back to options the user didn't pick. Source docs wrap option-specific content in conditional markers — block `<!-- when:arch=monolith -->…<!-- /when -->` and inline `| row |<!-- when:web=spa -->` — and the installer strips the content for any non-selected path (markers are HTML comments, invisible when rendered). Conditions support `arch`/`web`/`backend`/`mobile`, comma-OR, `!=`, and nesting.

### Changed
- Authored the decision-bearing meta docs (`platform-architecture.md`, `choosing-distributed-architecture.md`, `frontend-architecture.md`, `frontend-standards.md` §2.2–2.3) with conditional markers: a microservices + Module Federation install no longer carries "start with a monolith / SPA" guidance, decision trees for unchosen tracks, or comparison rows for paths not installed. A monolith + SPA install likewise drops the microservices/MFE material.
- Documented the conditional-content convention in `CONTRIBUTING.md`.

## [2.4.0] - 2026-06

### Fixed
- **Clean pruning of decision tables (closes #12).** When a partial install pruned a cross-reference, it could leave orphaned phrasing — most visibly the web-track table's "Combined" row reading "both docs above" after the rows it pointed to were removed. The `Combined` row now links to **both** tracks it combines, so it prunes cleanly when either is absent. Decision tables now prune to the user's selection with no dangling references.

### Changed
- Installer pruning also removes a **section heading left empty** after its content was pruned (in addition to the existing empty-table and blank-line cleanup), so partial installs never show a bare heading with nothing under it.
- Documented the cross-reference authoring convention in `CONTRIBUTING.md`: cross-doc links go on their own self-contained line, never as relative references ("above"/"below"), so pruning stays clean.

## [2.3.1] - 2026-06

### Fixed
- `backend-standards.md` cited Problem Details as **RFC 7807** while `public-api-facade.md` and `microservice-anatomy.md` use **RFC 9457** (which obsoletes 7807). Unified `backend-standards.md` to RFC 9457 so the Problem Details reference is consistent across the package.

## [2.3.0] - 2026-06

### Added
- **Self-contained installs.** The installer now prunes cross-references to standards that weren't selected: any line linking to a non-installed `.md` is removed, and tables left without data rows are dropped. A partial install no longer carries broken links or pointers to standards that aren't present.

### Changed
- **`frontend-standards.md` §13 is now locale-agnostic.** Replaced the "user-facing text must be Spanish" mandate with an i18n-based rule: user-facing text follows the product's configured locale via the i18n layer; code, identifiers, comments, and docs are always English. Examples use English message keys.
- Translated the remaining Spanish string literals in `frontend-standards.md` to English — the standards documentation is now fully English throughout.

## [2.2.1] - 2026-06

### Docs
- Refresh mobile stack versions to current 2026 releases. **Flutter** 3.27 → **3.44** (Dart floor 3.6 → 3.8). **React Native** 0.77 → **0.85** (New Architecture assumed stable), **Expo** SDK 53 → **56**, React **19.2**. Noted that **Expo Router forked from React Navigation in SDK 56** (don't import `@react-navigation/*` in app code) and that Expo package versions should be pinned via `npx expo install`. Architecture and library choices were already current — only versions changed.
- Translated all remaining Spanish string literals in the mobile docs (Flutter, React Native) to English — the standards documents are now fully English reference material.

## [2.2.0] - 2026-06

### Added
- **`core/platform-architecture.md`** — north-star end-to-end model: a bounded context is a **vertical slice** (microfrontend + optional BFF + microservice) owned by one team, with frontend and backend boundaries aligned on the same seam.
- **`backend/architecture/monolith-standard.md`** — the modular monolith as a first-class starting point (Clean Architecture + DDD in one deployable) with an explicit path to extract microservices. New selectable arch id `monolith`.
- Installer: **combined web track** — Single-SPA and Module Federation are no longer mutually exclusive. New `--web=single-spa+mf` (aliases: `mf` = Module Federation, `microfrontends` = `mf`, `combined` = `single-spa+mf`). Interactive selection is now a need-driven two-step flow.

### Changed
- **Microfrontend doctrine reconciled across the whole package** (evidence-based, 2026): **Module Federation** is the default for homogeneous React; **Single-SPA** orchestrates mixed frameworks / hard isolation; the two combine. `web/_base/frontend-architecture.md` is the single source of truth — a decision tree plus each track's backend implications.
- `frontend-standards.md` §2.2/§2.3 rewritten to match (removed the contradictory "Single-SPA is the default for all microfrontends" rule); fixed a duplicate section number (→ §2.4) and a dead link to the removed `vite-config-standard.md`; updated versions (React 19, Vite 7, Zustand 5).
- `frontend-standards.md` **fully translated to English** (user-facing UI string literals stay Spanish per the language rule). The package documentation is now English throughout.
- `bff-standard.md` expanded: BFF scoping **per client type** and **per microfrontend / vertical slice**, owned by the frontend team.
- Repositioned the monolith decision in `choosing-distributed-architecture.md` to link the new standard; cross-linked the platform-architecture map across frontend and backend docs.

## [2.1.1] - 2026-06

### Docs
- Refresh the Quick Start installer sample: include `BFF` in the architecture options and correct the copied-file count (14 → 19) to reflect the BFF standard and decision map.

## [2.1.0] - 2026-06

### Added
- **Backend for Frontend (BFF) standard** (`backend/architecture/bff-standard.md`) — opt-in distributed-architecture doc positioning the BFF as a selectable, client-specific aggregation layer, with explicit boundaries against the API Gateway, the Public API Facade, and microservices.
- **Distributed-architecture decision map** (`backend/architecture/choosing-distributed-architecture.md`) — a "what to pick & when" entry point (modular monolith vs microservices; gateway vs public facade vs BFF). Always installed with `--backend`.
- Installer: `bff` selectable architecture id (opt-in, in `--all` / interactive defaults).
- Automated GitHub Releases: when `package.json`'s version changes, the publish workflow creates the `vX.Y.Z` tag and a release with notes from `CHANGELOG.md`.
- Dependabot config keeping GitHub Actions and npm dependencies current, with auto-merge for passing patch/minor updates (major bumps flagged for manual review).
- `CODEOWNERS` requesting the maintainer as reviewer on every PR.
- Branch protection on `main` (PR-only, CI-gated, force-push/deletion blocked) documented in the README.

### Changed
- `public-api-facade.md` now explicitly separates the **API Gateway** (foundational infrastructure) from the **Public API Facade** (opt-in, for third parties), so they are not conflated.
- `frontend-architecture.md` documents where cross-context composition belongs (frontend stitching vs a server-side BFF).
- Bumped `actions/checkout` to v7 and `actions/setup-node` to v6.

## [2.0.1] - 2026-06

### Added
- npm package metadata (`author`, `repository`, `homepage`, `bugs`) so the npm page links back to the GitHub repo.

### Docs
- Open-source community files: LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates, CI workflow, and README badges.

## [2.0.0] - 2026-06

### Added
- **Interactive installer** (`@clack/prompts`) — pick standards by platform and architecture.
- Non-interactive flags: `--backend`, `--web=<track>`, `--mobile=<fw,...>`, `--arch=...`, `--all`, `--yes`.
- Generated `coding-standards/INDEX.md` listing the active standards with load triggers and precedence.
- Idempotent upgrades: a manifest tracks installed files; re-runs clean previous installs (including the v1 flat layout) and prune empty folders without touching the user's own files.
- 15 new standards enriched with verified 2026 practices: Clean Architecture/DDD, coding conventions, testing strategy, AI collaboration (AGENTS.md), microservice anatomy, multi-tenancy (RLS / PostgreSQL 18), event-driven (outbox / sagas), public API facade (OpenAPI 3.1 / Standard Webhooks / RFC 9457), shared-vs-owned, per-track technology stacks, frontend architecture, Module Federation 2.0 and Single-SPA tracks.
- `load_when` front-matter on every standard for on-demand loading by AI agents.

### Changed
- Reorganized the flat `standards/` library into selectable `core / backend / web / mobile` packs.
- Single-SPA and Module Federation are now separate, mutually-exclusive web tracks (plus a plain SPA track) — no forced default.
- Enforced an **open-source-only policy**: replaced the now-commercial MediatR / MassTransit / AutoMapper and the revenue-gated QuestPDF with Wolverine, Mapperly and PdfSharp/MigraDoc.

### Migration
- Running v2 over a v1 install automatically removes the old flat files and writes the new nested layout. No manual cleanup needed.

## [1.0.0] - 2026-02

### Added
- Initial release: flat library of coding standards copied wholesale into `coding-standards/`.

[2.5.1]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.5.1
[2.5.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.5.0
[2.4.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.4.0
[2.3.1]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.3.1
[2.3.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.3.0
[2.2.1]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.2.1
[2.2.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.2.0
[2.1.1]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.1.1
[2.1.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.1.0
[2.0.1]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.0.1
[2.0.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.0.0
[1.0.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v1.0.0
