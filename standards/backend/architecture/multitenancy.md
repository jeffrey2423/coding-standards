---
title: Multi-Tenancy Strategy
platform: backend
track: distributed-architecture
load_when: "Building a multi-tenant SaaS — tenant isolation, RLS, partitioning, and tenant routing."
updated: 2026-06
---

# Multi-Tenancy Strategy

A modern multi-tenant SaaS uses a **hybrid "bridge" model**: pooled by default, siloed selectively. This is the AWS SaaS Lens recommendation and the pattern the industry has converged on.

## The model

- **Pool by default** — standard tenants share one database **per microservice**, isolated by a `tenant_id` column + **Row-Level Security (RLS)**. Cheapest, simplest to operate.
- **Silo selectively** — enterprise/regulated/high-volume tenants are promoted to a dedicated database. A **per-microservice** decision (a tenant can be siloed in Sales, pooled in Catalog).
- **Tenant catalog (control plane)** — a small central DB mapping `tenant_id → connection string` per microservice, enabling dynamic routing.

This keeps DB-per-service intact: Sales never shares a DB with Inventory; within Sales, tenants share until promoted.

## Row-Level Security — the isolation guarantee

Isolation is **structural** (enforced by PostgreSQL), not application-level (a forgotten `WHERE`).

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;            -- owner is constrained too
CREATE POLICY tenant_isolation ON orders
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

### RLS rules (verified against PostgreSQL 18 docs)

- **MUST** run the app under a **non-owner, non-superuser role without `BYPASSRLS`**. Table owners and superusers bypass RLS unless `FORCE ROW LEVEL SECURITY` is set — relying on the app role is cleaner.
- **MUST** include `WITH CHECK`, or a tenant can write rows belonging to another tenant.
- **MUST** set the tenant per unit of work with **`SET LOCAL app.tenant_id = '…'` inside an explicit transaction** so it can't leak across pooled connections.
- **MUST NOT** grant `BYPASSRLS` to the application role, ever.
- **SHOULD** read the GUC safely: `current_setting('app.tenant_id', true)` (missing-ok) to avoid errors when unset.

### EF Core 10 / Npgsql wiring (defense in depth)

- Add an EF Core **global query filter** (`HasQueryFilter(e => e.TenantId == _tenantId)`) for ergonomics **and** keep DB-side RLS as the real guarantee.
- Set the session variable via a `DbConnectionInterceptor` / `SaveChanges` hook using **`SET LOCAL` within a transaction**.
- **PgBouncer transaction pooling**: a plain `SET` leaks across tenants on connection reuse — `SET LOCAL` in a transaction resets at commit and is mandatory in that setup. With DbContext pooling, reset the tenant per scope.
- Silo (DB-per-tenant) in EF Core: swap the **connection string** via an interceptor / `IDbContextFactory`; use `IModelCacheKeyFactory` if per-tenant schemas diverge.

## PostgreSQL 18 features to use (released Sept 2025)

- **`uuidv7()`** — timestamp-ordered UUIDs; far better index locality than v4. **Default PK type for new entities.**
- **Asynchronous I/O** (`io_method`) — up to ~3× faster scans/vacuum.
- **B-tree skip scan** — eases composite-index design (but still lead with `tenant_id`).
- **Virtual generated columns** (now the default) and **`RETURNING OLD/NEW`** for audit trails.
- **OAuth/OAUTHBEARER** auth method in `pg_hba.conf`.

## Partitioning & indexing

- Hash-partition high-volume tables by `tenant_id` to spread load and enable partition pruning on `WHERE tenant_id = …`.
- **MUST** lead every composite index with `tenant_id` (e.g. `(tenant_id, created_at DESC)`); unique constraints must include the partition key.
- Keep partition counts modest (4/8/16) — thousands degrade planning.

```sql
CREATE TABLE orders (
  id UUID NOT NULL DEFAULT uuidv7(),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, id)
) PARTITION BY HASH (tenant_id);

CREATE INDEX ix_orders_tenant_created ON orders (tenant_id, created_at DESC);
```

## Tenant catalog (control plane)

A small, separate DB — the "phone book" that answers *"where does each tenant live?"* It is **not** any microservice's DB; it's shared platform infrastructure (see [`shared-vs-owned.md`](shared-vs-owned.md)).

```sql
CREATE TABLE tenant_connections (
  tenant_id UUID NOT NULL,
  microservice VARCHAR(100) NOT NULL,
  connection_string VARCHAR(500) NOT NULL,
  is_silo BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id, microservice)
);
```

Request flow: extract `tenant_id` from JWT → look up routing (**cache in Redis**, >99% hit) → open connection to the right DB → `SET LOCAL app.tenant_id` → RLS applies automatically.

- **MUST** carry `tenant_id` in the JWT (identity), **not** the connection string (location). Location is resolved server-side; putting it in the JWT leaks infrastructure and breaks on silo promotion.
- **SHOULD** invalidate the Redis routing cache via Pub/Sub when a tenant is moved.

## Promotion pool → silo (operational, not architectural)

Create the silo DB → copy the tenant's rows (logical replication for near-zero downtime) → verify → update the tenant catalog (`is_silo = true`) + invalidate cache → clean the pool. **No code change** — it's a control-plane operation.

## Scaling beyond one node

Reach for **Citus** (first-party in Azure Cosmos DB for PostgreSQL) only after vertical scaling + partitioning are exhausted; shard by `tenant_id` as the distribution column with colocated tables.

## Anti-patterns

- Application-only isolation (no RLS) → one missing `WHERE` leaks data across tenants.
- `BYPASSRLS` on the app role → silently defeats every policy.
- Connection string in the JWT → infra leak + stale routing after promotion.
- Per-microservice routing tables instead of a central catalog → reintroduces distributed coordination.

## Sources

- PostgreSQL 18 release notes — https://www.postgresql.org/docs/18/release-18.html
- PostgreSQL RLS — https://www.postgresql.org/docs/18/ddl-rowsecurity.html
- AWS SaaS Lens (silo/pool/bridge) — https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html
- EF Core multitenancy — https://learn.microsoft.com/en-us/ef/core/miscellaneous/multitenancy
