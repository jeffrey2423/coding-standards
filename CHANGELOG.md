# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[2.0.1]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.0.1
[2.0.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v2.0.0
[1.0.0]: https://github.com/jeffrey2423/coding-standards/releases/tag/v1.0.0
