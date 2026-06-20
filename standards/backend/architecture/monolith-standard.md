---
title: Modular Monolith Standard
platform: backend
track: distributed-architecture
load_when: "Starting a backend, or deliberately choosing one deployable over microservices — building a modular monolith with clean bounded contexts that can split into services later."
updated: 2026-06
---

# Modular Monolith Standard

> **Choose this when** one team (or a few) builds a cohesive product and you do not yet have a concrete force — independent scaling, independent deploy cadence, or separate team ownership per domain — demanding distribution.
> **Don't choose this when** distinct domains genuinely need independent scale/deploy/teams. Then go straight to [microservices](microservice-anatomy.md).
> **It is a destination, not a failure.** A modular monolith with clean bounded contexts is a legitimate, professional architecture — not "microservices you haven't finished yet."

A modular monolith is **one deployable** containing **multiple bounded contexts**, each internally structured with Clean Architecture + DDD ([`core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md)). It keeps all the boundary discipline of microservices and pays none of the distributed-systems cost (network failure modes, eventual consistency, operational sprawl).

## Why start here

- **The boundaries are the hard part; distribution is the easy part later.** If your contexts are clean, extracting one into a service is mechanical. If they are not, microservices just turn a messy monolith into a distributed mess.
- **Most products never need more.** Microfrontend/microservice adoption had a documented "reality check": teams that distributed speculatively paid the cost without the benefit.
- **You can always split.** Going modular-monolith → microservices is a planned extraction. Going distributed-mess → anything is a rewrite.

## Internal structure

Organize by **bounded context**, each a self-contained module with the four Clean Architecture layers — the same layering as a [microservice](microservice-anatomy.md), minus the process boundary.

```
src/
├── Modules/
│   ├── Catalog/                 # bounded context (module)
│   │   ├── Catalog.Domain/          # aggregates, value objects, domain events
│   │   ├── Catalog.Application/     # use cases (CQRS), port interfaces
│   │   ├── Catalog.Infrastructure/  # EF Core, repositories
│   │   └── Catalog.Api/             # endpoints (or internal module facade)
│   ├── Sales/                   # another context — same shape
│   └── Identity/
├── Shared/                      # cross-cutting primitives only (NOT shared domain)
└── Host/                        # composition root: wires modules, one Program.cs
```

## Rules

- **MUST** keep each module's internals private. Other modules call a module only through its **public application interface** (a facade/mediator), never its repositories or `DbContext`.
- **MUST** keep one **logical schema per module** even in a shared database — separate tables, no cross-module foreign keys or joins. This is what makes a later split cheap. (PostgreSQL schemas per module are ideal.)
- **MUST** communicate between modules **in-process via interfaces or an in-memory event bus** (e.g. Wolverine mediation), modeling the same domain-event → handler flow a distributed system would use.
- **SHOULD** treat each module as a future service: if you would publish an integration event across a service boundary, raise the equivalent in-process event now, so extraction later is a transport change, not a redesign.
- **SHOULD NOT** create a shared "Common" domain module that every context depends on — that is the fast path back to a tangled monolith. `Shared` holds only technical primitives.

## When to extract a context into a microservice

Extract one module when a **concrete** force appears — not on principle:

- It needs to **scale independently** (very different load profile).
- It needs an **independent deploy cadence** or a **separate team** owns it.
- It has **different availability/compliance** requirements.

Extraction path: the module already owns its schema and speaks via events, so you (1) give it its own database, (2) replace in-memory events with the broker + [transactional outbox](event-driven.md), (3) put it behind the [gateway](public-api-facade.md), and (4) front it with its own deployable. The domain code barely changes. See the [decision map](choosing-distributed-architecture.md) for the full monolith-vs-microservices call.

## Anti-patterns

- **Distributed monolith** — microservices that share a database or call each other in long synchronous chains. You took the cost of distribution and kept the coupling of a monolith. A modular monolith is strictly better than this.
- **Big ball of mud** — one module, no internal boundaries, everything imports everything. This is the monolith that gives monoliths a bad name; it is not what this standard describes.
- **Premature extraction** — splitting into services before the boundaries have stabilized, then reshuffling responsibilities across the network.
- **Shared domain module** — a "Core"/"Common" project full of business types every module depends on; it couples all contexts and blocks any future split.
