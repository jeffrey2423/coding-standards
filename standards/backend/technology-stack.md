---
title: Backend Technology Stack
platform: backend
load_when: "Any backend/.NET work — the approved stack, ORM strategy, and 2026 library notes."
updated: 2026-06
---

# Backend Technology Stack

The approved .NET toolchain. Use these by default; deviations need a stated reason.

| Category | Technology | Version | Notes |
|---|---|---|---|
| Runtime | .NET | 10 (LTS, support to Nov 2028) | C# 14 |
| API style | Minimal API | — | endpoint grouping, `TypedResults` |
| Primary ORM | Entity Framework Core | 10 | CRUD, aggregates, tracking, migrations |
| Performance ORM | linq2db | latest | hot-path queries without tracking |
| Runtime filters | System.Linq.Dynamic.Core | latest | string-based dynamic filters (sanitize!) |
| Composable predicates | LinqKit | latest | type-safe predicate composition over EF Core |
| Database | PostgreSQL | 18+ (mandatory) | `uuidv7()` PKs, RLS, partitioning |
| Validation | FluentValidation | latest | format/structural validation |
| API docs | OpenAPI (built-in `Microsoft.AspNetCore.OpenApi`) + **Scalar** | — | 3.1 by default; Scalar UI dev-only; **not** Swagger |
| Orchestration (local + deploy) | .NET Aspire | 13 | service discovery, telemetry, integrations |
| Gateway | YARP | 2.x | first-class .NET reverse proxy |
| Testing | xUnit + Testcontainers | latest | EF InMemory for pure unit only |
| Resilience | Microsoft.Extensions.Resilience (Polly v8) | latest | retries, timeouts, circuit breakers |
| Observability | OpenTelemetry | latest | traces/metrics/logs (Aspire wires it) |
| Mediation & messaging | Wolverine | latest | MIT; CQRS mediation + message bus + Outbox |
| PDF | PdfSharp / MigraDoc | 6+ | MIT; documents (invoices, reports) |

## Open-source-only policy

This stack is **100% open source under permissive licenses**. Every dependency MUST be **MIT, Apache-2.0, BSD, ISC or the PostgreSQL License**.

- **MUST NOT** introduce source-available / revenue-gated libraries — notably **MediatR, AutoMapper, MassTransit** (commercial since 2025–2026) and **QuestPDF** (free only under a revenue cap; never for public-sector or publicly-traded companies).
- **MUST NOT** introduce network-copyleft (AGPL — e.g. **iText**) or commercial PDF/reporting SDKs (**Syncfusion, Aspose, IronPDF**).
- **MUST** verify a dependency's license before adding it. For **open-core** projects (e.g. Wolverine/Marten), confirm you use the **MIT core**, not a commercial add-on.
- Old MIT versions of the now-commercial libraries are archived/unmaintained — don't pin to them for new work.

### Approved OSS replacements

| Instead of (non-OSS) | Use (OSS) | License |
|---|---|---|
| MediatR | **Wolverine** (mediation + bus + Outbox) or the `Mediator` source-generator | MIT |
| MassTransit | **Wolverine** | MIT |
| AutoMapper | **Mapperly** (source-generated) or hand-written mapping | Apache-2.0 |
| QuestPDF | **PdfSharp / MigraDoc**, or **PuppeteerSharp / Playwright** for HTML→PDF | MIT |

## Multi-ORM strategy — when to use each

### EF Core 10 — primary
Use for: standard CRUD, DDD aggregates with tracking and domain events, simple-to-moderate queries, navigation properties, anything in the aggregate lifecycle.

### linq2db — performance
Use for: highly optimized read queries, complex projections/joins EF can't translate well, analytics/dashboards/reports, high-volume endpoints, tracking-free reads.
Do **not** use for: full DDD aggregates with tracking/events, or trivial filters.

### System.Linq.Dynamic.Core — runtime filters
Use for: API-driven dynamic filters/sorts (`?filter=Age > 30 AND Country == "CO"`), configurable grids, data explorers.
Do **not** use when: filters are fixed in code, you need strict security without sanitization, or you need maximum performance (use LinqKit/linq2db).

### LinqKit — composable predicates
Use for: composable business-rule predicates with type safety, combining multiple conditions in one `Where()`, reusable repository queries that still translate through EF Core.
Do **not** use when: filters are trivial, text-based dynamic (use Dynamic.Core), or need max performance (use linq2db).

## Rules

- **MUST** use `DateTimeOffset` for timestamps, never `DateTime`.
- **MUST** use `Guid` (UUID, prefer `uuidv7()` server-side) primary keys for all entities.
- **MUST** document the API with built-in OpenAPI; serve Scalar UI in Development only.
- **MUST** run integration tests against real PostgreSQL via Testcontainers.
- **SHOULD** orchestrate the local dev environment with .NET Aspire.
- **SHOULD** put resilience policies on every outbound HTTP call.
