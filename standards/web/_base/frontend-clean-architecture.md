---
title: Frontend Clean Architecture & DDD
platform: web
load_when: "Applying Clean Architecture and DDD tactical patterns inside the React frontend — the dependency rule at the edge, value objects, anti-corruption at the API boundary, and enforcing layer boundaries with lint."
updated: 2026-07
---

# Frontend Clean Architecture & DDD

> **Intent.** [`../../core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md) is the shared foundation; this doc is its **frontend translation** — the same dependency rule and DDD building blocks, adapted to React and the browser. It does **not** redefine the folder layout: the module/domain/feature structure and the per-feature `domain` / `application` / `infrastructure` / `presentation` layering live in [`frontend-standards.md`](frontend-standards.md) §4. This is a **faithful adaptation, not a blind copy** of the backend's four projects into four frontend folders.

## The dependency rule on the frontend: React lives at the edge

Robert C. Martin's dependency rule holds on the frontend, with the caveat *"you can't escape the framework, so isolate it"*: **React, TanStack Router/Query, Zustand, and the HTTP client are the outermost adapters — never the core.** Pure domain logic (entities, value objects, use-case functions) **MUST** be testable with no DOM, no `fetch`, no framework runtime — the same property that lets the backend domain be tested without EF Core or a broker.

| Clean Architecture layer | Frontend responsibility | Concrete artifacts |
|---|---|---|
| **Domain** (innermost) | Business concepts + invariants, framework-agnostic | Entities, **value objects** (`Slug`, `Money`, `Email`), pure domain functions, the Zod schema as the client mirror. **Zero** React / fetch / store imports. |
| **Application / use-cases** | Orchestrate the domain; declare **ports** (interfaces) | Use-case functions, port interfaces (gateways/repositories), input/output DTOs, view-model mappers. |
| **Infrastructure / adapters** | Implement ports; talk to the outside | The HTTP client, **TanStack Query hooks**, **Zustand stores**, `localStorage`, wire-DTO ↔ domain mappers (the anti-corruption layer). |
| **Presentation / UI** (outermost) | Render state, dispatch intents | Thin React components, page/route components, TanStack Router loaders. |

## When to add the Clean/Hexagonal core (don't over-engineer)

- **Thin feature (most CRUD screens):** a component + a TanStack Query hook + a Zod schema is enough. Do **NOT** erect `domain` / `application` / `infrastructure` sub-layers where there are no real invariants.
- **Rich feature (conflict rules, money/pricing logic, complex multi-step validation):** add the full core in the feature's `domain` / `application` folders — value objects, pure domain functions, and use-cases depending on **port interfaces**, with the Query hook / API client as the adapter that implements the port. Inject adapters via React Context (the frontend's lightweight DI) so the core is unit-tested with mock adapters.

> The per-feature layering in [`frontend-standards.md`](frontend-standards.md) §4 is a **ceiling, not a floor** — a feature uses as much of it as its complexity warrants.

## DDD tactical patterns on the frontend

- **Value objects (TypeScript):** private constructor + `static create(): Result<VO>`, **immutable**, **structural equality**, validation in the factory (return a `Result`; don't throw for expected invalidity). `Slug`, `Money`, phone, `Email` are canonical — they encode the same invariants as their backend counterparts.
- **Client mirror, server-authoritative:** the backend is the **source of truth**. The frontend domain layer (value objects + Zod schemas) is a **UX mirror** for instant feedback and expressive types; a server `400/422` is always final. Co-locate the Zod schema in the feature's `domain`, derive the TS type from it, and use it both for form validation and to **parse API responses at the adapter boundary**.
- **Anti-corruption layer:** the feature's `infrastructure/api` maps wire DTOs ↔ frontend domain, so a backend contract change is absorbed in **one mapper**, not scattered across components. This is the frontend expression of the ACL in [`../../core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md).
- **Frontend feature boundaries mirror backend bounded contexts.** Align a frontend module/domain to the backend module that owns that data so ownership is unambiguous end-to-end — see [`../../core/platform-architecture.md`](../../core/platform-architecture.md).

## Where the libraries live (non-negotiable)

- **HTTP client** → `shared/lib` (the single connection to the outside world: base URL, auth interceptors). Configured once.
- **TanStack Query** → the feature's `infrastructure/api`. It is the **server-state adapter** — it owns cache, refetch and invalidation. **Never mirror server data into Zustand.**
- **Zustand** → the feature's `application/store` for **client-only** state (wizard step, unsaved draft, view state); a couple of global stores (`auth`, `app-settings`) live in `app/`.
- **TanStack Router** routes/loaders → `routes/` (config) + thin route components; loaders delegate to use-cases / query hooks.
- **Validation** → a Zod schema in the feature's `domain` (the client mirror); value objects encapsulate invariants; the server error is authoritative.

## Enforcing the dependency rule (there is no compiler boundary — you lint it)

The frontend has no project/assembly boundary like the backend's separate `.csproj` files, so the dependency rule **MUST** be enforced with tooling, in CI:

- **MUST** configure **`eslint-plugin-import` → `import/no-restricted-paths`** to encode the layer arrows: `domain` may not import from `application` / `infrastructure` / `presentation`; `presentation` may not import from `infrastructure` directly; and **no feature may import another feature's internals** — cross-feature composition happens **upward**, in shared route/layout code, mirroring how backend contexts integrate via events, not direct references. This gate runs in CI and fails the build on a violated arrow.
- **SHOULD** expose each feature through a barrel (`index.ts`) as its **public API** and make deep imports into a feature's internals a lint error — the frontend equivalent of the backend's `internal` encapsulation / `*.PublicApi` facade.
- **MAY** assert the dependency graph in CI with **`dependency-cruiser`** as a defense-in-depth check beyond ESLint.

## Sources

- Clean Architecture — Robert C. Martin: <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- bulletproof-react — project structure + `import/no-restricted-paths`: <https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md>
- Khalil Stemmler — Value Objects / Entities in TypeScript DDD: <https://khalilstemmler.com/articles/typescript-value-object/>
- Alex Kondov — Clean Architecture in React: <https://alexkondov.com/full-stack-tao-clean-architecture-react/>
