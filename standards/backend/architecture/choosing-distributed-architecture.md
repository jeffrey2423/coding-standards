---
title: Choosing a Distributed Architecture
platform: backend
track: distributed-architecture
load_when: "Starting a backend platform or deciding which distributed-architecture standards apply — monolith vs microservices, and which edge/integration layer (gateway, public facade, BFF) you actually need."
updated: 2026-06
---

# Choosing a Distributed Architecture

The docs in this folder are **independent options, not a default-plus-exceptions stack**. Pick each by a concrete need — the same discipline the web side applies to its tracks (see [`web/_base/frontend-architecture.md`](../../web/_base/frontend-architecture.md)). Adopting all of it speculatively is the most common and most expensive mistake.

This is the entry point: it tells you **what to choose and when**, then points at the doc that tells you **how**.

## Step 0 — Do you even need microservices?

Distribution buys independent deploy/scale per domain and team autonomy. It costs network failure modes, eventual consistency, and operational overhead. Don't pay it until a concrete force demands it.

| Your situation | Choose | Why |
|---|---|---|
| One team, one cohesive product, no independent-scaling need | **Modular monolith** (Clean Architecture + DDD inside one deployable) | All the boundary discipline, none of the distributed cost. Split out a service later when a real seam appears. |
| Distinct domains with different scaling/availability/team ownership | **Microservices** → [`microservice-anatomy.md`](microservice-anatomy.md) | The boundaries already exist; distribution makes them enforceable. |

> A modular monolith with clean bounded contexts is a **legitimate destination**, not a failure to migrate. Microservices are an option you select, not a maturity badge.

## The edge / integration layer — three distinct concerns

These three are routinely confused into one. They are **different decisions** with different triggers:

| Concern | What it is | Choose when | Doc |
|---|---|---|---|
| **API Gateway** | Single inbound entry point: routing, central JWT auth + tenant, rate-limit, observability | **Foundational** — present as soon as you have >1 service that a client must reach | [`public-api-facade.md`](public-api-facade.md) (§ API Gateway) · [`shared-vs-owned.md`](shared-vs-owned.md) |
| **Public API Facade** | Contracts as a product for **third parties**: OpenAPI/AsyncAPI, developer portal, webhooks, public versioning | **Opt-in** — only when external integrators consume the platform | [`public-api-facade.md`](public-api-facade.md) |
| **Backend for Frontend (BFF)** | Thin, client-specific aggregation/adaptation layer owned by a frontend team | **Opt-in** — only when one experience must compose **multiple** contexts and client-side composition is too chatty | [`bff-standard.md`](bff-standard.md) |

The trap: treating the **Public API Facade** as mandatory (it is not — it's for third parties), or reaching for a **BFF** when a shared **Gateway** plus client-side composition already suffices.

## Front ↔ back boundary — where does cross-domain composition live?

In the purist microfrontend model each microfront pairs with its own context's API through the gateway, so most screens need **no** aggregation tier. When a screen genuinely needs several contexts at once:

| The screen needs… | Put the composition in | Why |
|---|---|---|
| One context | The microfront → its API via the **gateway** | The 1:1 purist model; nothing to add |
| Several contexts, light read-only stitching | The **frontend** (TanStack Query, parallel calls) | No new deployable; see [`microfrontends`](../../web/microfrontends/module-federation-standard.md) |
| Several contexts, heavy aggregation / reshaping / client-specific session | A **BFF** → [`bff-standard.md`](bff-standard.md) | Avoids long chatty sync chains (an [anti-pattern](microservice-anatomy.md)) and keeps the view model server-side |

Service ↔ service communication is a **separate** decision — async by default, sync only when the caller needs the answer now: [`event-driven.md`](event-driven.md).

## The full track — load each on demand

| Doc | Load when |
|---|---|
| [`microservice-anatomy.md`](microservice-anatomy.md) | Designing/implementing a service — layout, layers, event model |
| [`shared-vs-owned.md`](shared-vs-owned.md) | Deciding if a component belongs to a service or is shared platform infra |
| [`event-driven.md`](event-driven.md) | Coordinating services — outbox, idempotency, sagas, correlation |
| [`multitenancy.md`](multitenancy.md) | The platform serves multiple tenants |
| [`public-api-facade.md`](public-api-facade.md) | Exposing the platform (gateway always; public facade only for third parties) |
| [`bff-standard.md`](bff-standard.md) | One client/experience must aggregate multiple contexts server-side |

## Anti-patterns

- **Adopting the whole track speculatively** — microservices + gateway + public facade + BFF on day one for a product with one team and no third parties. Start with the modular monolith; add each piece when its trigger fires.
- **Conflating gateway, public facade, and BFF** — they answer different questions; installing one does not imply the others.
- **A BFF that grows domain logic** — it becomes a distributed monolith's hub. Business rules live in the owning microservice.
- **A "public facade" with no third parties** — that's just your gateway with extra ceremony.
