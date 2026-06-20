---
title: Backend for Frontend (BFF)
platform: backend
track: distributed-architecture
load_when: "One client experience (web shell, mobile app, partner) must aggregate or reshape data from multiple bounded contexts, and client-side composition has become too chatty or leaks too much backend shape into the UI."
updated: 2026-06
---

# Backend for Frontend (BFF)

> **Choose this when** a single client experience needs to **compose multiple bounded contexts** for its screens and doing it in the browser is too chatty, too coupled, or leaks too much backend shape into the UI.
> **Don't choose this when** each screen maps to one context (the purist microfront ↔ context model handles it via the gateway), or when light read-only stitching in the frontend (parallel TanStack Query calls) is enough.
> **Alternative:** the shared [API Gateway](public-api-facade.md) for routing/auth, or client-side composition in the [microfrontend shell](../../web/microfrontends/module-federation-standard.md). A BFF is an **opt-in addition** to those, never a replacement for them.

A BFF is a **thin, client-specific** backend that aggregates and adapts calls to microservices on behalf of **one** experience. It is owned by (or co-owned with) that experience's frontend team and exists to serve **that** UI's view model — nothing else.

## What a BFF is NOT

Confusing these is the whole reason this doc exists (see [`choosing-distributed-architecture.md`](choosing-distributed-architecture.md)).

| Not… | Because |
|---|---|
| the **API Gateway** | the gateway is shared infra for **all** clients (one entry, central auth/rate-limit — see [`shared-vs-owned.md`](shared-vs-owned.md)). A BFF is **per experience** and shapes responses to one UI. |
| the **Public API Facade** | the facade is a versioned **product for third parties**. A BFF is internal plumbing for your own UI and can change as fast as the UI does. |
| a **microservice** | it owns **no domain data and no business rules**. If it starts guarding invariants, the boundary is wrong — that logic belongs in the owning context. |

## Responsibilities

- **Aggregation** — fan out to several services' public APIs and assemble one response for a screen.
- **Adaptation** — reshape domain DTOs into the exact view model the UI wants (field selection, renaming, unit/format normalization). The UI stops knowing the internal shapes.
- **Client-specific concerns** — session/token exchange for that client, pagination merging, response trimming for mobile bandwidth, BFF-side read caching of composed views.
- **One BFF per experience that diverges** — web shell, native mobile, partner portal. If two clients want the same thing, they share one; the moment their needs fork, split.

## Rules

- **MUST NOT** contain business rules or own a database. It orchestrates; the domain decides (mirrors the Application-layer rule in [`microservice-anatomy.md`](microservice-anatomy.md)).
- **MUST** call services through their **public API**, never their database (same boundary as sync calls in [`event-driven.md`](event-driven.md)).
- **MUST** apply resilience on every downstream call: short timeout (≤ 5s), retries with backoff, **circuit breaker**, propagate `X-Correlation-Id`. Use **Microsoft.Extensions.Resilience (Polly v8)**.
- **MUST** be tenant-aware — forward the tenant claim; never aggregate across tenants.
- **SHOULD** prefer parallel fan-out over sequential calls, and async events over sync where the screen can tolerate it — a BFF must not become a long synchronous chain.
- **SHOULD** treat its own endpoints as the UI's private contract: version them loosely, evolve them with the UI, and keep them out of the public facade.

## Relationship to microfrontends

In the [Module Federation model](../../web/microfrontends/module-federation-standard.md) the shell already composes capabilities client-side and asks the backend which remotes a tenant is licensed for. That covers most composition. Add a BFF **only** when server-side aggregation is clearly better:

| Situation | Resolve in |
|---|---|
| One capability ↔ one context | The capability's API via the gateway |
| Shell stitches a few read models | Frontend (parallel queries) |
| A screen needs heavy cross-context aggregation, or mobile needs a trimmed/merged payload | **BFF** |

## Stack (2026)

Per the [open-source-only policy](../technology-stack.md):

- **Thin .NET 10 Minimal API** is the default BFF — a small project that calls downstream services and maps results. Reuse the resilience and OpenAPI conventions from [`backend-standards.md`](../backend-standards.md).
- **YARP 2.x** when the BFF is mostly routing/transforming with little custom aggregation (it can also be the gateway; keep the *roles* separate even if co-located).
- **GraphQL** (e.g. Hot Chocolate) is a valid aggregation alternative when many clients need flexible field selection over the same composed graph — but it's still a BFF concern, not domain logic.

## Anti-patterns

- **The God-BFF** — one shared BFF for every client that accretes logic until it's a distributed monolith's hub. That's a gateway with delusions; split per experience or push logic down.
- **Business rules in the BFF** — validation/decisions belong in the owning context; the BFF only orchestrates and reshapes.
- **A BFF that touches service databases** — breaks DB-per-service; call the public API.
- **Long sync chains inside the BFF** — `BFF → A → B → C`; any link down fails the screen. Fan out in parallel, cache, or go async.
- **Promoting BFF endpoints into the public API** — third parties then depend on UI-shaped, fast-changing contracts. Keep the [public facade](public-api-facade.md) separate.
