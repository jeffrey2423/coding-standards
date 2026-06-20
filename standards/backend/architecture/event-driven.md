---
title: Event-Driven Communication
platform: backend
track: distributed-architecture
load_when: "Coordinating microservices — outbox, idempotency, sagas, and correlation."
updated: 2026-06
---

# Event-Driven Communication

Microservices communicate by **asynchronous events** through a broker. Synchronous HTTP is reserved for when the caller needs the answer now.

> **The rule:** async when you can, sync when it hurts not to. Most microservice pain comes from abusing synchronous HTTP chains.

## Why async by default

| Sync HTTP chain `A→B→C→D` | Events via broker |
|---|---|
| Temporal coupling — D down ⇒ A fails | B/C/D can be down without affecting A |
| Availability = product of each link | Broker absorbs spikes + retries |
| Latency = sum of the chain | Consumers process at their own pace |

**Use sync** only for "need it now" reads: validate stock before closing a sale, authenticate, check entitlement. If unsure, **start async** — converting async→sync later is easier than untangling broken chains.

## Transactional Outbox (mandatory)

Persisting the aggregate and publishing the event must be **atomic**. The integration event is written to an `outbox_messages` table **in the same transaction** as the aggregate change; a background worker publishes it to the broker.

```sql
BEGIN;
  UPDATE orders SET status = 'confirmed' WHERE id = '…';
  INSERT INTO outbox_messages (id, message_type, body, occurred_at)
  VALUES ('…', 'OrderConfirmedV1', '{…}', now());
COMMIT;
```

Guarantees:
- DB fails before commit → nothing persisted, nothing published.
- Broker fails after commit → event stays in outbox, retried.
- **Never** any drift between persisted aggregate and published event. Eliminates the need for distributed transactions (2PC).

**Implementation:** use **Wolverine** (MIT) — it provides the Outbox natively. Avoid the now-commercial MediatR/MassTransit per the [open-source-only policy](../technology-stack.md). The pattern is what matters.

## Idempotency (mandatory)

The outbox + broker give **at-least-once** delivery, so the same event can arrive twice. Every consumer **MUST** be idempotent.

```sql
CREATE TABLE processed_messages (
  message_id UUID PRIMARY KEY,
  event_type VARCHAR(100),
  tenant_id  UUID,
  processed_at TIMESTAMPTZ
);
```

The consumer inserts `message_id` into `processed_messages` **in the same transaction** as the domain change; if `message_id` already exists, it skips. (Alternative for high volume: dedupe on a natural key — "`OrderClosedV1` for `order_id=X` processes once".)

## Sagas / process managers

A business process spanning multiple contexts is a **saga**, not an HTTP chain. The saga reacts to integration events, emits commands, persists its state, and uses **compensations** (not distributed rollback) on failure.

```
on OrderConfirmedV1   → ReserveStockCommand        (state: AWAITING_STOCK)
on StockReservedV1    → IssueInvoiceCommand         (state: AWAITING_INVOICE)
on InvoiceIssuedV1    → … COMPLETED
on StockInsufficientV1→ CancelOrderCommand          (compensation)
on InvoiceFailedV1    → ReleaseStockCommand + CancelOrderCommand
```

A compensation is a **new business fact** ("order cancelled"), not a DB undo — the events happened and consumers reacted.

## Correlation ID

Every message and request carries a `CorrelationId` propagated end-to-end. With **OpenTelemetry**, the `traceparent` header does this automatically, giving a distributed trace across async hops. Without it, debugging async flows is impossible.

## Integration event shape

```json
{
  "eventId": "evt_abc123",
  "eventType": "OrderConfirmedV1",
  "tenantId": "tenant_042",
  "occurredAt": "2026-05-15T14:32:11Z",
  "correlationId": "corr_xyz",
  "data": { "orderId": "ord_001", "total": 125000, "currency": "COP" }
}
```

Required: `eventId` (idempotency), `eventType` (versioned), `tenantId`, `occurredAt` (when it happened, not when published), `correlationId`, `data`.

> Consider the **CloudEvents 1.0** envelope (`id`/`source`/`type`/`specversion`) for cross-system event formatting; it's the CNCF standard and complements broker-internal events.

## Conventions

- **MUST** name events in the past tense with an explicit version: `OrderConfirmedV1`. Events are facts, not commands.
- **MUST** include `tenantId` in every event.
- **MUST** freeze a version's contract once published; breaking change ⇒ new version; both coexist during deprecation.
- **SHOULD** publish events for **business-significant state transitions**, not every property change. If unsure, don't publish — adding events later is easier than retiring them.
- **SHOULD NOT** dump the internal aggregate state into an event — design the event for its consumers.

## Sync calls (when necessary)

When you must call synchronously, call the other service's **public API** (never its DB). Apply: retries with exponential backoff, short timeout (≤ 5s), **circuit breaker**, propagate `X-Correlation-Id`, `Idempotency-Key` on idempotent POSTs. Use **Microsoft.Extensions.Resilience (Polly v8)**.

## Broker is internal

The broker (RabbitMQ/Kafka) is for **internal** service-to-service traffic only. External integrators receive **webhooks**, not broker access — see [`public-api-facade.md`](public-api-facade.md).

## Anti-patterns

- Long sync HTTP chains; events disguised as commands (`PleaseReserveStockEvent`); events without `tenantId`; non-idempotent consumers; per-property events; events leaking internal models; missing correlation ID.
