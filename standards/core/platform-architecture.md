---
title: Platform Architecture — End-to-End Vertical Slices
platform: core
load_when: "Designing how frontend and backend fit together — mapping microfrontends, BFFs, gateway and microservices into cohesive, team-owned vertical slices."
updated: 2026-06
---

# Platform Architecture — End-to-End Vertical Slices

This is the **north-star** map: how every layer of the platform fits together. The other standards specify each layer in depth; this one shows how they compose so the whole stays cohesive.

> **The organizing principle:** a **bounded context** is a **vertical slice** owned end-to-end by **one team** — its microfrontend, its (optional) BFF, and its microservice(s). Domain = team = slice. Get this alignment right and ownership is obvious; get it wrong and modularization becomes a cross-team dependency nightmare.

## The end-to-end picture

```
        ┌───────────────────────────────────────────────────────┐
        │  SHELL                                                 │
        │  Module Federation: single shell, products = layouts,  │
        │                     capabilities = remote MFEs         │
        │  Single-SPA: thin root orchestrating independent apps  │
        └───────────────┬───────────────────────────────────────┘
   each capability / app = a VERTICAL SLICE owned by one team
        ┌──────────┐      ┌──────────┐      ┌──────────┐
        │  MFE A   │      │  MFE B   │      │  MFE C   │      frontend (UI)
        ├──────────┤      ├──────────┤      ├──────────┤
        │  BFF A   │      │  BFF B   │      │  BFF C   │      BFF per slice — aggregate + shape
        └────┬─────┘      └────┬─────┘      └────┬─────┘      (owned by the FE team, NO domain logic)
   ═════════╪═════════════════╪═════════════════╪═════════   API GATEWAY
            │                  │                  │           (foundational: TLS, JWT/tenant, routing, rate-limit)
        ┌───▼──────┐      ┌───▼──────┐      ┌───▼──────┐
        │ service A│      │ service B│      │ service C│      microservices (DB-per-service)
        └──────────┘      └──────────┘      └──────────┘
         context A          context B          context C      bounded contexts
                    └──── events / sagas between contexts ────┘
   ─────────────── PUBLIC API FACADE (opt-in — only for third-party integrators) ───────────────
```

## The layers, and where each is specified

| Layer | Role | Owned by | Standard |
|---|---|---|---|
| **Shell** | Composes microfrontends (single shell + layouts, or orchestrator) | Platform/host team | [`web/_base/frontend-architecture.md`](../web/_base/frontend-architecture.md) |
| **Microfrontend** | One slice's UI | The slice's team | the chosen web track |
| **BFF** | Aggregates + reshapes that slice's services into its view model | The slice's **frontend** team | [`backend/architecture/bff-standard.md`](../backend/architecture/bff-standard.md) |
| **API Gateway** | Single inbound entry: auth, tenant, routing, rate-limit | Platform team (shared) | [`backend/architecture/public-api-facade.md`](../backend/architecture/public-api-facade.md), [`shared-vs-owned.md`](../backend/architecture/shared-vs-owned.md) |
| **Microservice** | Domain logic + data for one context | The slice's **backend** team | [`backend/architecture/microservice-anatomy.md`](../backend/architecture/microservice-anatomy.md) |
| **Public API Facade** | Versioned product for external integrators | Platform team | [`backend/architecture/public-api-facade.md`](../backend/architecture/public-api-facade.md) |

## How the pieces relate (the rules that keep it cohesive)

- **Boundaries must align.** The "billing" microfrontend talks to billing services; the "catalog" microfrontend to catalog services. If frontend and backend boundaries diverge, you get unclear ownership and cross-team coupling. The bounded context is the single seam both sides share.
- **The BFF belongs to the microfrontend, not the service tier.** It is a frontend-team-owned edge that shapes data for *its* UI. It holds **no business rules** (those live in the microservice) and owns **no database**. It shields the UI from backend churn: a downstream change touches the BFF, not the MFE.
- **The gateway is foundational; BFFs sit behind it.** The gateway authenticates once and routes; a request reaching a BFF or service is already authenticated. BFFs are internal services behind the gateway, not a second public edge.
- **Services talk to each other by events, not through BFFs.** Cross-context coordination is async (sagas/events) at the service tier — see [`event-driven.md`](../backend/architecture/event-driven.md). A BFF aggregates **reads** for a screen; it never becomes a hub for service-to-service business flow.
- **Start as a modular monolith.** Before slices exist, one well-bounded deployable is the right call. Split a context into its own slice when a real force (independent scaling, team autonomy) appears. See [`monolith-standard.md`](../backend/architecture/monolith-standard.md) and the [decision map](../backend/architecture/choosing-distributed-architecture.md).

## Scaling the model by frontend track

| Track | Slice composition |
|---|---|
| **SPA** | One slice (or a few), one team. Often no BFF; talk to the gateway directly. The whole "platform" may be a modular monolith. |
| **Module Federation** | Each **capability** (remote MFE) is a slice with its team, its optional BFF, and its context's microservice(s). The shell composes them; a thin shell service serves the license/manifest. |
| **Single-SPA** | Each **app** is a slice, commonly with **its own BFF**. The root orchestrates; frameworks may differ per app. |
| **Combined** | Single-SPA orchestrates the apps; Module Federation shares code across slices. BFF-per-slice unchanged. |

## Anti-patterns

- **Misaligned boundaries** — a microfrontend that needs five teams' services for one screen. The slice is drawn wrong; redraw it on the bounded context.
- **A BFF with business rules** — it has quietly become a microservice without a domain. Push logic down.
- **A shared "BFF" for every client** — that is just the API gateway with extra steps. A BFF is per experience/slice.
- **Microfrontend split without backend split** — independent UI deploys that all hit one shared backend monolith reintroduce the coupling microfrontends were meant to remove.
- **Adopting the whole stack on day one** — shell + remotes + per-slice BFFs + microservices for a one-team product. Start monolith-first; grow into slices.
