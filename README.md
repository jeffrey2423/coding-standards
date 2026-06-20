# Coding Standards & Architecture Guide

[![npm version](https://img.shields.io/npm/v/@jeffrey2423/coding-standards.svg)](https://www.npmjs.com/package/@jeffrey2423/coding-standards)
[![npm downloads](https://img.shields.io/npm/dm/@jeffrey2423/coding-standards.svg)](https://www.npmjs.com/package/@jeffrey2423/coding-standards)
[![CI](https://github.com/jeffrey2423/coding-standards/actions/workflows/ci.yml/badge.svg)](https://github.com/jeffrey2423/coding-standards/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/@jeffrey2423/coding-standards.svg)](https://www.npmjs.com/package/@jeffrey2423/coding-standards)
[![license: MIT](https://img.shields.io/npm/l/@jeffrey2423/coding-standards.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/)

Modern, **AI-ready** coding standards, architectural patterns and technical conventions for building enterprise-scale, greenfield applications. Enforces **Clean Architecture**, **Domain-Driven Design (DDD)** and modern **microservices / microfrontends** patterns across backend, web and mobile.

Designed to be consumed by **AI coding agents** (Claude Code, Cursor, Copilot) as much as by humans: every document carries `load_when` front-matter, and the installer generates an `INDEX.md` telling the agent exactly which standards are active.

## Quick Start

Pick exactly the standards your project needs — interactively:

```bash
npx @jeffrey2423/coding-standards
```

```
? What are you building?        ◉ Backend / API (.NET)   ◉ Frontend Web   ◯ Mobile
? Web architecture:             ● Microfrontends (Module Federation)
? Backend — distributed arch:   ◉ Multi-tenancy  ◉ Event-driven  ◉ Public API facade ...
✓ Copied 14 files to coding-standards/
✓ Generated coding-standards/INDEX.md
```

Or non-interactively (great for CI and AI agents):

```bash
npx @jeffrey2423/coding-standards --backend --web=microfrontends      # selective
npx @jeffrey2423/coding-standards --mobile=flutter,react-native --yes # mobile only
npx @jeffrey2423/coding-standards --all                               # everything
npx @jeffrey2423/coding-standards --help
```

Only the selected standards are copied into `coding-standards/`, plus an `INDEX.md` that lists them with load triggers and precedence rules.

### Updating

Re-run the installer any time — it's idempotent. It tracks the files it created in `coding-standards/.standards-manifest.json` and, on each run, removes its previously-installed files (and any leftovers from the flat **v1** layout) before writing the new selection, then prunes empty folders. Your own files in `coding-standards/` are never touched. So upgrading v1 → v2, or changing your selection, leaves no stale or contradictory standards behind.

## How it works

Standards are organized into **independent packs** selected at install time:

| Pack | Selection | What you get |
|---|---|---|
| **core** | always | Clean Architecture + DDD, coding conventions, testing strategy, AI collaboration |
| **backend** | `--backend` | .NET standards, tech stack, DB conventions + opt-in architecture docs |
| **web** | `--web=<track>` | shared web standards + **one** track: `spa` · `single-spa` · `microfrontends` |
| **mobile** | `--mobile=<fw,...>` | `flutter` and/or `react-native` |

**Single-SPA and Module Federation microfrontends are separate, mutually-exclusive tracks** — pick by need, no forced default.

## Repository structure

```
standards/
├── core/                       # always installed
│   ├── clean-architecture-ddd.md
│   ├── coding-conventions.md
│   ├── testing-strategy.md
│   └── ai-collaboration.md
├── backend/
│   ├── backend-standards.md
│   ├── technology-stack.md
│   ├── database-conventions.md
│   └── architecture/           # opt-in distributed-architecture docs
│       ├── microservice-anatomy.md
│       ├── multitenancy.md
│       ├── event-driven.md
│       ├── public-api-facade.md
│       └── shared-vs-owned.md
├── web/
│   ├── _base/                  # frontend architecture, stack, design system
│   ├── spa/                    #   ── pick one web track ──
│   ├── single-spa/
│   └── microfrontends/
└── mobile/
    ├── flutter/
    └── react-native/
```

## Technology stack (2026)

### Backend
.NET 10 (LTS) · C# 14 Minimal API · EF Core 10 (+ linq2db / Dynamic.Core / LinqKit) · **PostgreSQL 18** (`uuidv7()`, RLS) · FluentValidation · built-in OpenAPI 3.1 + **Scalar** · **.NET Aspire 13** · **YARP** · **Wolverine** · xUnit + Testcontainers · OpenTelemetry · PdfSharp/MigraDoc.

> **100% open source** — permissive licenses only (MIT / Apache-2.0 / BSD / PostgreSQL). The now-commercial **MediatR / MassTransit / AutoMapper** and the revenue-gated **QuestPDF** are **excluded** and replaced by **Wolverine**, **Mapperly** and **PdfSharp/MigraDoc**. See `backend/technology-stack.md`.

### Web
Vite 7 · React 19 · TypeScript strict · TanStack Router + Query · Zustand 5 · shadcn/ui + Radix · TailwindCSS v4 · React Hook Form + Zod · Vitest + RTL + MSW. Microfrontends via **Module Federation 2.0** (`@module-federation/enhanced`, dynamic license-gated remotes) or **Single-SPA**.

### Mobile
Flutter (Riverpod 3 · GoRouter · Material 3) · React Native (Expo SDK 53+ · Zustand · Expo Router · NativeWind 4).

## Architecture highlights

- **Clean Architecture + DDD** everywhere; strict inward dependency rule.
- **Multi-tenancy**: hybrid bridge model — pooled + PostgreSQL RLS by default, selective silo, central tenant catalog.
- **Event-driven**: transactional Outbox, idempotent consumers, sagas with compensation, correlation IDs.
- **Public API facade**: contracts as product — OpenAPI 3.1 + AsyncAPI 3.0, Standard Webhooks (HMAC), OAuth 2.1, Problem Details (RFC 9457), rigorous versioning. Your own UI uses the public API — no private APIs.
- **Microfrontends**: products as router layouts, capabilities as remote MFEs, enabled per license without redeploy.

## Key principles

1. **Clean Architecture** — strict layer separation with dependency inversion.
2. **Domain-Driven Design** — bounded contexts drive the architecture.
3. **Test-Driven Development** — tests alongside implementation, ≥80% on domain/application.
4. **Type safety** — TypeScript strict, C#, sound Dart null safety.
5. **Database per microservice** — complete data isolation.
6. **UUID (uuidv7) primary keys** — distributed-system friendly.
7. **Spanish UI / English code** — user-facing text in Spanish, codebase in English.
8. **Contracts are the product** — public, versioned, backward-compatible.
9. **Accessibility first** — WCAG 2.1 AA.
10. **AI-ready** — every standard is loadable on demand via `INDEX.md` and `load_when` front-matter.
11. **Open source only** — every dependency uses a permissive OSS license; no commercial or revenue-gated libraries.

## Using with AI agents

Add a root `AGENTS.md` pointing your agent at the installed index:

```md
# Project agent instructions
Coding standards live in `coding-standards/`. Read `coding-standards/INDEX.md`
first, then load standards on demand per their `load_when` triggers.
```

See `core/ai-collaboration.md` for the full agent protocol.

## Contributing & governance

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md).

**How changes land.** The `main` branch is protected:

- Every change goes through a **pull request** — no direct pushes, maintainer included.
- **CI must pass** (`Installer smoke test` on Node 18 / 20 / 22) before a PR can merge.
- Force-pushes and deletion of `main` are blocked.
- **Releases are automated** — bump `version` in `package.json`, merge to `main`, and the
  workflow publishes to npm and opens the matching `vX.Y.Z` GitHub Release (notes from
  `CHANGELOG.md`).
- Dependency updates come via Dependabot; patch/minor bumps auto-merge once CI is green,
  major bumps wait for manual review.

To contribute: branch from `main`, commit with
[Conventional Commits](https://www.conventionalcommits.org/), open a PR, and make sure CI
is green.

## License

[MIT](LICENSE) © Jeffrey Rios
