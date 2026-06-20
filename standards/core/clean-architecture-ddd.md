---
title: Clean Architecture & Domain-Driven Design
platform: all
load_when: "Always. The architectural foundation every other standard assumes."
updated: 2026-06
---

# Clean Architecture & Domain-Driven Design

This is the architectural foundation shared by **every** platform in this library (backend, web, mobile). Platform docs build on these rules; they never contradict them.

## The dependency rule

Dependencies point **inward**, toward the domain. Inner layers know nothing about outer layers.

```
Presentation  →  Application  →  Domain  ←  Infrastructure
   (UI/API)       (use cases)    (rules)     (DB, HTTP, SDKs)
```

- **Domain** depends on **nothing**. No framework, no ORM, no HTTP, no UI library. Pure language constructs, testable in isolation.
- **Application** depends only on Domain. Orchestrates use cases; declares interfaces it needs.
- **Infrastructure** depends on Application + Domain — it *implements* the interfaces Application declares (dependency inversion).
- **Presentation** depends on Application. Translates external input (HTTP request, UI event) into use-case calls.

> **The litmus test:** you must be able to swap the database, message broker, HTTP framework or UI library by touching **only Infrastructure/Presentation**. If a domain change is forced by a tech change, the dependency rule is broken.

## Layer responsibilities

| Layer | Owns | MUST NOT |
|---|---|---|
| **Domain** | Entities, value objects, aggregates, domain events, invariants, domain services | Reference any framework or I/O |
| **Application** | Use cases (commands/queries), DTOs, port interfaces, orchestration | Contain business rules or touch I/O directly |
| **Infrastructure** | Repository impls, ORM mappings, API clients, external SDKs | Contain business rules |
| **Presentation** | Endpoints/components, routing, (de)serialization, auth checks | Contain business rules or access data directly |

## DDD building blocks

- **Aggregate** — a cluster of objects treated as one unit, with a **root** that guards invariants. Loaded and persisted atomically. References other aggregates **by ID**, never by direct object reference.
- **Entity** — has identity that persists across changes.
- **Value Object** — immutable, defined by its attributes (`Money`, `Email`, `Sku`). Validates on construction.
- **Domain Event** — an immutable fact, named in the past tense (`OrderConfirmed`), emitted by an aggregate when something business-relevant happens.
- **Domain Service** — a domain operation that doesn't belong to a single entity.
- **Repository** — one per aggregate root; loads/saves the whole aggregate; exposes use-case methods, not raw query builders.

## Core rules

- **MUST** keep business rules in the Domain. Validators check **format**; the domain enforces **rules**.

  | Format (validator) | Rule (domain) |
  |---|---|
  | "SKU is required, max 50 chars" | "an order with no lines cannot be confirmed" |
  | "email has valid shape" | "a cancelled order cannot be confirmed again" |

- **MUST** expose behavior, not setters. Aggregates have methods (`confirm()`, `cancel()`), not public mutable state.
- **MUST** organize code by **business module / domain / feature**, not by technical layer at the top level.
- **MUST** keep aggregates small. If an aggregate has dozens of sub-entities, it is probably several aggregates linked by ID.
- **SHOULD** protect the domain from external models with an **Anticorruption Layer** when consuming another context's data.
- **SHOULD NOT** build anemic models (only getters/setters + a CRUD service). If the domain has no behavior, it is a table with an API on top, not a domain.

## Why this matters for AI-assisted development

A consistent, layered structure lets an AI agent (and a human) predict **where** code goes without re-reading the whole repo: a rule → Domain; an orchestration → Application; a DB detail → Infrastructure; an endpoint/screen → Presentation. The structure is the map.

## Platform specifics

- Backend layering & microservice anatomy → [`backend/architecture/microservice-anatomy.md`](../backend/architecture/microservice-anatomy.md)
- Web layering & folders → [`web/_base/frontend-architecture.md`](../web/_base/frontend-architecture.md)
- Mobile layering → `mobile/<framework>/` standards
