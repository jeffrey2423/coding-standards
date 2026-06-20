---
title: Coding Conventions
platform: all
load_when: "Always. Cross-cutting naming, language, and git conventions."
updated: 2026-06
---

# Coding Conventions

Cross-cutting conventions that apply to every platform. Platform docs may add specifics but never contradict these.

## Language rule

- **MUST** write all **code, identifiers, comments, logs, commit messages and technical docs in English**.
- **MUST** write all **user-visible text in Spanish** (UI labels, validation messages shown to users, emails). Use i18n/l10n resources — never hardcode user-facing strings in components.
- **Rationale:** English code keeps the codebase universally maintainable; Spanish UI serves the product's users.

## Naming

| Element | Convention | Example |
|---|---|---|
| C# types / methods | PascalCase | `OrderService`, `ConfirmOrder` |
| C# locals / params | camelCase | `orderId` |
| TS/JS components | PascalCase file & symbol | `OrderCard.tsx` |
| TS/JS variables / functions | camelCase | `useOrderCart` |
| TS/JS constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Dart classes | PascalCase | `OrderRepository` |
| `data-testid` | kebab-case | `order-card-submit` |
| Files (non-component) | kebab-case | `api-client.ts` |
| Folders | kebab-case | `use-cases/` |

Database naming (snake_case, FKs, PKs) is defined in [`backend/database-conventions.md`](../backend/database-conventions.md).

## Type safety

- **MUST** enable TypeScript `strict` mode (web/React Native) — no implicit `any`.
- **MUST** use nullable reference types and treat warnings as errors where the team config allows (C#).
- **MUST** use sound null safety (Dart).
- **SHOULD** model illegal states as unrepresentable (discriminated unions, value objects) rather than runtime checks.

## Git & commits

- **MUST** use Conventional Commits: `type(scope): summary` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`).
- **MUST NOT** commit secrets, `.env` files, or generated artifacts. Honor `.gitignore`.
- **SHOULD** keep commits small and scoped to one logical change.
- **SHOULD** branch off the default branch for any non-trivial change; never force-push shared branches.

## Comments

- **MUST** explain *why*, not *what*. The code already says what it does.
- **MUST NOT** leave commented-out code in commits.
- **SHOULD** match the comment density of surrounding code.

## Dependency licensing (open-source only)

- **MUST** use only dependencies under **permissive OSS licenses**: MIT, Apache-2.0, BSD, ISC, PostgreSQL License.
- **MUST NOT** introduce **source-available / revenue-gated** libraries (e.g. MediatR, AutoMapper, MassTransit, QuestPDF), **network-copyleft** licenses (AGPL, e.g. iText), or **commercial SDKs** (Syncfusion, Aspose, IronPDF).
- **MUST** verify a dependency's license **before** adding it. For **open-core** projects, confirm the piece you use is the OSS core, not a commercial add-on.
- **SHOULD** prefer a well-maintained OSS option over a feature-richer non-OSS one. Per-platform approved replacements live in each track's technology-stack doc.

## Security baseline

- **MUST** validate and sanitize all external input at the boundary.
- **MUST** keep secrets in configuration/secret managers, never in source.
- **MUST** use parameterized queries / ORM — never string-concatenated SQL.
- **SHOULD** apply least privilege everywhere (DB roles, API scopes, tokens).
