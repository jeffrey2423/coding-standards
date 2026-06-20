---
title: Public API Facade
platform: backend
track: distributed-architecture
load_when: "Exposing the platform to external consumers — gateway, contracts, webhooks, auth, versioning."
updated: 2026-06
---

# Public API Facade

The public layer of a platform. **Contracts are the product**: OpenAPI for sync, AsyncAPI for events. Their versioning discipline is what makes a platform (vs an app) — third parties depend on them.

> **Two separate decisions live in this doc — don't conflate them** (see [`choosing-distributed-architecture.md`](choosing-distributed-architecture.md)):
> - **API Gateway** — *foundational infrastructure.* Present as soon as you have more than one service a client must reach. Not optional in a distributed system.
> - **Public API Facade** (the product: portal, webhooks, public versioned contracts) — *opt-in.* You build this **only when third parties integrate** with the platform. If your only consumer is your own UI, you need the gateway, not the facade product.
>
> Neither of these is a **Backend for Frontend** — that's a per-client aggregation layer; see [`bff-standard.md`](bff-standard.md).

## Pieces

- **API Gateway** — single entry point for inbound HTTP (`api.org.com`).
- **Microservices** — each owns its OpenAPI + AsyncAPI, exposed via the gateway.
- **Webhook Dispatcher** — delivers events to external subscribers.
- **Identity Provider** — issues JWTs.
- **Developer Portal** — aggregated docs, sandbox, credential & subscription management.

## Two channels

| | REST API | Webhooks |
|---|---|---|
| Direction | consumer → platform | platform → consumer |
| Model | synchronous | asynchronous |
| Contract | **OpenAPI 3.1** | **AsyncAPI 3.0** |
| Versioning | `/v1/`, `/v2/` | `EventV1`, `EventV2` |
| Auth | JWT (`Authorization`) | HMAC signature |
| Idempotency | `Idempotency-Key` | `eventId` |

## API Gateway

Creates the illusion of one platform over many services: routing by path, central JWT auth, rate limiting, observability, version routing, single public URL.

- **2026 default for .NET: YARP 2.x** (first-class reverse proxy). Use Kong/Envoy for polyglot estates; Azure APIM / AWS API Gateway when you need a managed portal/quotas.
- **MUST** authenticate at the gateway; downstream services trust that a request that arrived is authenticated.

## OpenAPI (.NET 10)

- **MUST** use the built-in `Microsoft.AspNetCore.OpenApi` (`AddOpenApi()`), which emits **OpenAPI 3.1** by default at `/openapi/{document}.json`. Swashbuckle is no longer in the default templates.
- **MUST** serve a docs UI with **Scalar** (`app.MapScalarApiReference()`) — **Development only**.
- **SHOULD** lint the spec with **Spectral** in CI and generate client SDKs from it at build time (`IOpenApiDocumentProvider`).
- Each microservice owns its OpenAPI; the portal aggregates them (like Stripe/Twilio/Shopify: monolithic docs outside, N independent APIs inside).

## Errors — Problem Details (RFC 9457)

All endpoints return errors as `application/problem+json` per **RFC 9457** (which obsoletes RFC 7807). .NET's `Results.Problem`/`ProblemDetails` aligns.

```json
{
  "type": "https://api.org.com/errors/sku-duplicate",
  "title": "Duplicate SKU",
  "status": 409,
  "detail": "A product with SKU 'ABC123' already exists in this tenant",
  "instance": "/api/v1/catalog/products",
  "traceId": "…"
}
```

## Versioning & deprecation

- **MUST NOT** make breaking changes within a published version. Breaking change ⇒ new version; both coexist during deprecation (typically 6–12 months).
- **Non-breaking (same version):** add optional fields, new endpoints, new enum values (carefully), better error messages.
- **Breaking (new version):** remove/rename fields, change types, make an optional field required, change semantics, remove endpoints.
- **MUST** design consumers as **tolerant readers** (ignore unknown fields, tolerate missing optionals).
- **SHOULD** signal end-of-life with the `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers + a public changelog.

## Authentication (OAuth 2.1)

- Machine-to-machine integrators use the **`client_credentials`** grant; prefer **`private_key_jwt`** over shared secrets.
- JWT carries **identity** (`sub`, `tenant_id`, `scope`), short TTL, asymmetric keys (RS/ES) with JWKS rotation, validated `aud`/`iss`/`exp`.
- The `tenant_id` claim scopes the integrator to its tenant — it cannot push data to another.
- **SHOULD** use sender-constrained tokens (**DPoP**, RFC 9449) or **mTLS** (RFC 8705) on high-value APIs.

Scopes are per API + action: `catalog:read`, `catalog:write`, `sales:write`, …

## Webhooks (Standard Webhooks)

Follow the **Standard Webhooks** baseline:

- **MUST** sign every payload with **HMAC-SHA256**; send `webhook-id`, `webhook-timestamp`, `webhook-signature` headers; support versioned signatures for key rotation.
- **MUST** deliver at-least-once with exponential-backoff retries (e.g. 1m, 5m, 15m, 1h, 6h, 24h) then dead-letter + notify.
- **MUST** treat consumers as idempotent (dedupe on `eventId`); ack fast with 2xx.
- **MUST** reject on signature mismatch or stale timestamp (replay protection).

AsyncAPI 3.0 documents the event contracts; the broker stays internal (see [`event-driven.md`](event-driven.md)).

## Your own UI uses the public API

The platform's own UI/PWA **MUST** consume the **same** public contracts as external integrators — **no private APIs**. This forces contract quality, guarantees parity, removes duplication, and surfaces problems via dogfooding (Stripe/Twilio/Shopify do this).

## Standard headers

| Header | Purpose |
|---|---|
| `Authorization: Bearer <JWT>` | auth |
| `Idempotency-Key: <uuid>` | idempotent POSTs |
| `X-Correlation-Id: <uuid>` | distributed tracing |
| `webhook-signature` | webhook HMAC (Standard Webhooks) |

## Adding a microservice doesn't break consumers

New context ⇒ create the service + its OpenAPI, add a gateway route, publish docs (+ AsyncAPI if it emits events). Existing services and integrators are unaffected. That non-disruption is the mark of a well-designed facade.

## Sources

- .NET 10 OpenAPI — https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi?view=aspnetcore-10.0
- Problem Details RFC 9457 — https://www.rfc-editor.org/rfc/rfc9457
- Standard Webhooks — https://www.standardwebhooks.com/
- Sunset header RFC 8594 — https://www.rfc-editor.org/rfc/rfc8594
- YARP — https://microsoft.github.io/reverse-proxy/
