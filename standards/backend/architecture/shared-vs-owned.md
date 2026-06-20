---
title: Shared vs Owned Components
platform: backend
track: distributed-architecture
load_when: "Deciding whether a new component belongs to a microservice or is shared platform infrastructure."
updated: 2026-06
---

# Shared vs Owned Components

A platform has two kinds of components. Confusing them blurs ownership and makes operations harder.

> **The rule:** each microservice owns its **data** and **domain logic**. **Transport, coordination, and identity** are shared platform infrastructure.

When you see a component, ask:
- Stores **business domain data**? → owned by a microservice.
- Runs **business logic**? → owned by a microservice.
- Only **transports** things between services? → shared.
- Only **coordinates** access/identity across services? → shared.

## Owned by each microservice

Its transactional database (including enterprise silo DBs); its tables (aggregates, `outbox_messages`, `processed_messages`, projections); its code (the 5 projects); its HTTP endpoints; its event consumers; its **queues and exchanges within** the shared broker; its CI/CD pipeline; its emitted telemetry.

> The broker **cluster** is shared, but each service owns its queues/exchanges inside it — like a shared office building where each company has its own offices.

## Shared platform infrastructure

| Component | Why shared |
|---|---|
| **Broker** (RabbitMQ/Kafka) | exists so producers/consumers meet without knowing each other |
| **API Gateway** | unifies the entry point; one place for auth/rate-limit |
| **Webhook Dispatcher** | connects internal events to external subscribers |
| **Identity Provider** | identity must be single platform-wide (SSO) |
| **Tenant Catalog** | tenant routing must be consistent platform-wide |
| **Redis (cross-cutting cache)** | caches transversal data (tenant routing, IdP keys) |
| **Observability stack** | value is correlating all services in one place |
| **DB engine (infra)** | the *engine* can be shared; the *logical DB* is owned |
| **Orchestration cluster** (K8s) | shared by nature |

These exist once, operated by the platform team; every service uses them, none "owns" them.

## Deciding for a new component

1. Stores/processes **domain data** of one context? → **owned**.
2. Cross-cutting transport/coordination/identity? → **shared**.
3. Needs **consistent state across services**? → **shared**.
4. Each service would evolve it differently? → **owned**.
5. Would N copies be redundant/harmful? → **shared**.

Examples: push notifications → shared (transport); PDF generation → likely shared; payment processing → probably an owned `Payments` microservice (it has domain logic); full-text search → owned if one context needs it, shared (with separate indices) if many.

## Why it matters

Clear ownership (who fixes what), boundary discipline (domain teams don't touch shared infra; the platform team doesn't write business logic), clean scaling decisions (per-service vs cluster), a clean cost model (shared = fixed/amortized; owned = scales with services), and fast team onboarding.

## Anti-patterns

- Shared DB between microservices → distributed monolith.
- A service with its own broker/IdP → breaks the purpose of shared coordination/identity.
- Private cache for transversal data → invalidation becomes impossible.
- Domain data living in "shared infrastructure" → it's a mis-named microservice.
