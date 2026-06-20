---
title: Microservice Anatomy
platform: backend
track: distributed-architecture
load_when: "Designing or implementing a microservice — its project layout, layers, and event model."
updated: 2026-06
---

# Microservice Anatomy

Every microservice follows the **same** internal structure. Structural consistency lets the team move between services without relearning conventions, and lets operations use one toolset for all. Implements [`core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md).

## The decisions

- **DB-per-service (real).** Each bounded context owns its database. **No other service touches it** — access is via API or events only. A shared DB is a distributed monolith.
- **Clean Architecture + DDD inside** each service (four layers, strict inward dependency rule).
- **Async by default** between services; sync only when the caller needs the answer now (see [`event-driven.md`](event-driven.md)).
- **Public, versioned contracts** at the edge (see [`public-api-facade.md`](public-api-facade.md)).

## Standard solution layout (5 projects)

```
src/
├── {Context}.Domain/             # aggregates, value objects, domain events — zero framework refs
├── {Context}.Application/        # use cases (commands/queries), DTOs, port interfaces
├── {Context}.Infrastructure/     # EF Core, repositories, outbox, consumers, ACL
├── {Context}.Api/                # Minimal API endpoints
└── {Context}.IntegrationEvents/  # published language — distributable package (NuGet)
    ├── V1/
    └── V2/
```

`IntegrationEvents` is the **only** project that crosses the context boundary; publish it as a versioned package so other services/adapters consume it.

### Dependency rule

- `Domain` → depends on nothing.
- `Application` → Domain.
- `Infrastructure` → Application + Domain (implements Application's interfaces).
- `Api` → Application.
- `IntegrationEvents` → primitives only.

> Swapping the DB engine, broker, or HTTP framework must touch **only Infrastructure**. The domain never finds out.

## Layer rules

**Presentation (Api).** Validates request format, authenticates (JWT + tenant claim), maps HTTP → Command/Query, returns the serialized result. **No business logic, no DB access, no calls to other services.**
- Path: `/api/v{version}/{context}/{resource}`; standard HTTP verbs/status; errors as Problem Details (RFC 9457).
- Reads headers: `Authorization: Bearer`, `Idempotency-Key`, `X-Correlation-Id`.

**Application.** CQRS use cases that **orchestrate**, never decide. A command handler: load aggregate → invoke its behavior → persist via Unit of Work → let domain events dispatch. Declares ports (`I{Aggregate}Repository`, `IUnitOfWork`, `IIntegrationEventOutbox`, `ITenantContext`). Holds the handler that **translates domain events → integration events**.

**Domain.** Pure language. Aggregates guard invariants and expose behavior (`Confirm()`, not setters); emit domain events; reference other aggregates by ID. Value objects validate on construction. Every invariant has a unit test including the violation case.

**Infrastructure.** Repository impls (one per aggregate root, load the whole aggregate, no `IQueryable` leaking out), ORM mappings, the **transactional outbox**, inbound **consumers** (idempotent), and the **Anticorruption Layer** that translates other contexts' models.

## Mediation / messaging (2026)

Per the [open-source-only policy](../technology-stack.md), use **Wolverine** (MIT) — it provides command/query mediation, the message bus, and the transactional Outbox in one package. Do **not** use the now-commercial MediatR/MassTransit. The `Mediator` source-generator or hand-rolled dispatch are also fine. The **pattern** (CQRS, domain-vs-integration events, outbox) matters, not the library.

## Domain events vs integration events

| Aspect | Domain Event | Integration Event |
|---|---|---|
| Location | Domain layer | `IntegrationEvents` package |
| Audience | Inside the service | Other services + third parties |
| Language | Ubiquitous, internal | Public, versioned |
| Persistence | In memory | Outbox + broker |
| Versioning | none | strict (`V1`, `V2`, backward-compatible) |
| Example | `OrderConfirmedDomainEvent` | `OrderConfirmedV1` |

Explicit translation between them protects the domain: the internal model can evolve freely without breaking external consumers.

## Request flow

```
HTTP → JWT/tenant extracted → endpoint maps to Command → handler loads aggregate
   → aggregate applies rules + emits domain event → persist (aggregate + outbox row, one tx)
   → commit → domain event dispatched in-memory → translated to IntegrationEvent V1
   → (background) outbox worker publishes to broker → other services consume idempotently
```

## Naming

| Thing | Convention | Example |
|---|---|---|
| Bounded context | singular | `Catalog`, `Sales` |
| Aggregate | singular | `Order`, `Product` |
| Value object | descriptive | `Money`, `Sku` |
| Domain event | past + `DomainEvent` | `OrderConfirmedDomainEvent` |
| Integration event | past + version | `OrderConfirmedV1` |
| Command | imperative + `Command` | `ConfirmOrderCommand` |
| Query | `Get…Query` | `GetOrderByIdQuery` |

## Vertical slices

Clean Architecture layering and **Vertical Slice** organization combine well: keep the layer boundaries, but organize Application code by feature/use-case slice (command + handler + validator + DTO together) rather than by technical folder. This keeps related code cohesive and is the common 2026 default for new services.

## Anti-patterns

- Anemic CRUD-only service (no domain behavior) → it's a table with an API, not a microservice.
- Joins across service DBs → breaks DB-per-service; the context boundaries are probably wrong.
- Business rules in validators/endpoints → rules live in the domain.
- Long synchronous HTTP chains `A→B→C→D` → any link down tumbles the chain; go async.
- Shipping business code inside the `IntegrationEvents` package → it must contain only contracts.
- Forgetting idempotency in consumers → at-least-once delivery duplicates effects.
