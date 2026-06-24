---
title: Deployment & Environments
platform: backend
track: distributed-architecture
load_when: "Taking a system from laptop to production — deployment topology, release strategy, migrations, secrets, dev/prod parity, and infrastructure-as-code."
updated: 2026-06
---

# Deployment & Environments

A system is only as good as the path that carries it from a developer's laptop to production. This doc is about that path: how the workload is physically laid out, how it ships without dropping traffic, how the schema changes, where secrets live, and how to guarantee that "it worked on my machine" actually means something.

> **The governing idea — separate the logical contract from the physical deployment.** The architecture decides ownership and boundaries (which module/service owns what data, which talks to which). *How many machines, instances, or clusters those boundaries map onto is a deployment decision* that can — and at small scale, should — collapse without weakening the contract. Conflating the two is what makes systems needlessly expensive to run early.

<!-- when:arch=anatomy,events,api,bff,shared,multitenancy -->
## Logical vs physical separation

The microservices rule is "each service owns its data; no other service touches its tables." That is a **logical** guarantee about ownership — it does **not** require one physical database server per service.

| | Logical contract (fixed) | Physical layout (a deployment choice) |
|---|---|---|
| What it protects | Ownership, no cross-service queries, independent migrations | Cost, blast radius, independent scaling/failover |
| Early-stage default | Always enforced | **Consolidate**: separate logical databases on one shared instance |
| At scale | Unchanged | Promote a hot service to its own instance |

- **MUST** give each service its own database, own connection string, own DB role, own migration history, and **MUST NOT** ever issue a cross-database query — even when the databases share an instance. This keeps the contract real.
- **SHOULD** start with **separate logical databases on a single shared managed instance** rather than one instance per service. A database is a hard boundary in most engines; per-database roles enforce ownership; cost drops from `N×` the managed-instance floor to `1×`.
- **SHOULD** treat **promotion to a dedicated instance** as an operational move — a connection-string change plus a data copy, with **no application code change**. Promote only when a specific service's load justifies it (Rule of Three, not speculation).
- **SHOULD NOT** reach for "one schema per service in one database" as the consolidation strategy when "separate databases on one instance" is available: the latter gives a harder boundary and clean per-service migration histories at the same cost.

<!-- when:arch=multitenancy -->
> The same principle drives multi-tenant data: pooled rows isolated by a key are the logical default; a dedicated database per tenant is a physical escape valve reached only on demand. **Routing to a physical location is a value, not a service** — when everything is pooled there is nothing to route, so do not build a routing catalog, a routing service, or a read-model for routing until the first physical split actually exists.
<!-- /when -->
<!-- /when -->

<!-- when:arch=monolith -->
## Deployment topology — a single deployable

A modular monolith ships as **one deployable artifact** with strictly enforced internal boundaries — the organizational benefits of clear ownership without the operational cost of inter-service networking. Keep the deployment as simple as the architecture allows.

- **MUST** deploy the whole application as **one artifact** (a single container image), with **one database** and **one migration history**. In-module communication is in-process (method calls, an in-process event bus), not network hops.
- **SHOULD** run on the **simplest substrate that meets the SLA**: a single container on a PaaS / managed app platform, or one `Deployment` on a cluster you already operate. A monolith does **not** need a service mesh, a broker, or per-service infrastructure — adopt those only if and when a module is extracted.
- **MUST** extract a module into its own service only on a **concrete force** — independent scaling, a different deploy cadence, fault isolation, or team ownership — not as a maturity milestone. See [`monolith-standard.md`](monolith-standard.md) for the extraction seam and [`choosing-distributed-architecture.md`](choosing-distributed-architecture.md) for the decision.
- **SHOULD** lean on **feature flags** (see *Release strategy* below) as the primary safe-deploy lever: because you cannot deploy modules independently, flags are how you ship a change without releasing it to everyone at once.
<!-- /when -->

## Migrations

Schema changes must ship safely while old and new code run side by side — during a rolling update, a blue-green transition window, or async event processing, both versions are live at once.

- **MUST** apply migrations as a **dedicated pre-rollout step** (a CI/CD job or a Kubernetes `Job` / init step), **not** from application startup code. Startup migration races across replicas and offers no rollback control. Self-contained **migration bundles** (a compiled migrator artifact) are the portable way to do this.
- **MUST** write migrations **expand-contract** (backward-compatible): add the new shape, deploy code that writes both, backfill, then remove the old shape in a later release. Rolling/blue-green deploys and async events mean the old and new code run simultaneously.
- **SHOULD** express database features the ORM does not model — row-level security policies, roles, grants, partitions, triggers — as **idempotent raw SQL inside the migration**, so the security posture is versioned with the schema, not applied by hand.
- **MUST** keep **one migration history per service**, applied independently of the others and tolerant of rolling, out-of-order deploys.<!-- when:arch=anatomy,events,api,bff,shared,multitenancy -->
- **SHOULD** require **no migration to onboard a new tenant** under the pooled model (a new tenant is new rows). If onboarding needs a migration, you have drifted into schema-per-tenant — a decision to make explicitly, not by accident.<!-- when:arch=multitenancy -->

## Release strategy & graceful shutdown

A deployment can be "up" and still be failing: dropping in-flight requests, losing queued messages, or double-processing background work. Zero downtime is about *how* the new version replaces the old, not just whether the new pods are healthy.

- **SHOULD** pick a **zero-downtime release strategy** to match the workload:

| Strategy | Use when | Cost |
|---|---|---|
| **Rolling update** | Default for orchestrators; stateless or backward-compatible workloads | None extra — `maxUnavailable: 0`, `maxSurge: 1` preserves capacity |
| **Blue-green** | Highest-criticality components; instant switch and instant rollback | Temporarily double the infrastructure |
| **Canary** | High-risk changes you want to expose to a slice of traffic first | Needs traffic-splitting + metric gating |

- **MUST** implement **graceful shutdown**: on `SIGTERM`, stop accepting new connections, let in-flight requests finish, and finish or relinquish background work (message consumers, scheduled jobs) before exit. Honor the platform's `preStop` hook and termination grace period. Without this, a deploy that is "up" still emits intermittent `5xx` at the edge and drops work mid-flight.
- **SHOULD** **decouple deploy from release with feature flags**: ship code dark and enable it progressively, so a deploy is reversible without a redeploy and a bad change is a flag flip away from off.
- **SHOULD** define **health probes** (liveness, readiness, startup) so the platform only routes traffic to instances that are actually ready, and restarts the ones that are wedged.

## Secrets management

There are two unrelated secret problems. Treating them as one is the most common mistake.

| | Infrastructure / app secrets | Runtime per-customer secrets |
|---|---|---|
| Examples | DB connection strings, signing keys, OAuth client secrets, third-party API tokens | A customer's own credentials for an external service they connect (BYOM-style) |
| Cardinality | Few, static per environment | Many, dynamic, written at runtime |
| Owner | The deploy pipeline | The owning service, at runtime |
| Right tool | A secret manager → injected into the platform | **Envelope encryption** in the owning service's database |

- **MUST NOT** commit secrets to git in any form — no `.env` files, no values baked into images, no secrets in manifests. This includes "encrypted later" placeholders.
- **MUST** store infrastructure/app secrets in a **secret manager** and deliver them into the runtime via a **sync operator** (e.g. an operator that materializes them into native platform secrets and reloads the workload) or a mounting driver. Application code reads them as environment/volume and never knows their origin.
- **MUST** handle **runtime per-customer secrets as application data, not deploy secrets.** The owning service encrypts them (authenticated encryption such as AES-GCM) in its own store, using a **master/data-encryption key held in the secret manager** (envelope encryption). The secret manager holds *the key that encrypts*, not thousands of per-customer entries — this scales and keeps the blast radius small.
- **SHOULD** use local-developer secret stores (the platform's user-secrets mechanism, or injected dev parameters) for the inner loop — never a shared committed file.
- **SHOULD** rotate via the manager + operator (re-sync, reload) rather than redeploying images.

## Dev/prod parity — three layers, three tools

"Works on my machine" is only meaningful if *my machine runs what production runs.* But forcing the full production substrate into the daily edit loop destroys developer velocity. Resolve the tension by recognizing **three distinct layers**, each with its own tool and its own scope:

| Layer | Purpose | Scope | Runs in the inner loop? |
|---|---|---|---|
| **Infrastructure (day-0)** | Provision the substrate | Cluster, managed databases, network, DNS, CDN, IAM, secret-manager bootstrap | No — cloud only |
| **Application packaging** | Deploy the workload(s) | The deployable(s) + migration job, config, secret wiring (and gateway / broker / operators when distributed) | **Yes — the identical artifact** |
| **Inner dev loop** | Write & debug fast | The code running alongside local infra containers | Yes — local only |

- **MUST** keep **one canonical packaging artifact** (e.g. a single set of Helm charts) as the source of truth for deployment, used **identically** in local parity and in production — only per-environment value files differ. The artifact you smoke-test locally must be **bit-for-bit** the one you ship.
- **MUST NOT** maintain a separate, parallel set of production manifests, or auto-generate deploy manifests from the inner-loop orchestrator. Either creates a second source of truth that silently drifts.
- **SHOULD** quarantine the **only legitimate local↔prod divergence in the infrastructure layer** (managed database vs in-cluster container; real DNS/CDN vs localhost). The application-packaging layer — where most deployment bugs actually live — stays identical across environments.
<!-- when:arch=anatomy,events,api,bff,shared,multitenancy -->
- **SHOULD** adopt a **hybrid parity model**: a fast inner-loop orchestrator for daily coding **plus** a **local cluster** (e.g. a lightweight Kubernetes distribution running in containers) that runs the **same application-packaging artifacts** as a **pre-deploy parity gate**, validating the full deploy mechanics — migration job, secret operator, gateway, health probes, and inter-service networking — not just the service binaries.
<!-- /when -->
<!-- when:arch=monolith -->
- **SHOULD** keep monolith parity lightweight: run the **identical container image** locally (a local runtime / compose) with local infra containers. A full local cluster is **optional** — reach for it only if you deploy to Kubernetes and want probe/manifest parity too.
<!-- /when -->

## Infrastructure as Code (IaC)

- **MUST** define cloud infrastructure as **versioned code** (a declarative IaC tool), reviewed and reproducible — not click-ops in a console. Day-0 infra that lives only in someone's memory is an outage waiting to happen.
- **MUST** keep the **IaC/provisioning layer separate from the application-deployment layer.** Provisioning answers "does this exist before any app?" (cluster, databases, network, DNS); application packaging answers "is this a workload on the platform?" Mixing them couples concerns that change at different rates.
- **SHOULD NOT** run the IaC/provisioning layer locally — provisioning targets the cloud only; local environments use disposable local infra (containers), never the IaC layer.

## The relicensing trap (OSS hygiene)

Several formerly-open-source infrastructure tools have **relicensed to source-available/revenue-gated terms** (e.g. BSL). Under an open-source-only policy this is disqualifying, and the trap is subtle: the tool is still "free to download," the brand is unchanged, and the restriction only bites later.

- **MUST** verify the **current** license of every infrastructure dependency before adopting it — not its historical reputation.
- **SHOULD** prefer the **community fork under a foundation** when a popular tool relicenses; these forks are typically drop-in, OSI-approved, and foundation-governed. Track the fork's release cadence and divergence.
- **SHOULD** record the license decision (chosen tool, rejected alternative, reason) so it is not re-litigated or accidentally reversed.

## Anti-patterns

- **`Database.Migrate()` at app startup** across multiple replicas — migration races and no rollback path.
- **Deploying without graceful shutdown** — the process exits on `SIGTERM` mid-request, dropping in-flight work and emitting edge `5xx` even though the new version is "healthy."
- **Coupling deploy to release** (no feature flags) — every change is all-or-nothing in production, so rollback means a redeploy under pressure.
- **A single `.env` file as the deployment secret story** — secrets in git, no rotation, no audit.
- **Storing many per-customer runtime secrets as deploy secrets** — wrong tool, wrong lifecycle; use envelope encryption in the owning service.
- **Two sources of deployment truth** (parallel prod manifests, or generated-vs-handwritten manifests) — they drift and "tested locally" stops meaning anything.
- **Click-ops infrastructure** — unversioned, unreproducible, un-reviewable.
- **Adopting an infra tool on reputation without checking its current license** — the relicensing trap.
<!-- when:arch=monolith -->
- **Standing up a service mesh, broker, or local Kubernetes cluster for a single monolith** — operational cost for distribution you do not have yet; a container is enough.
<!-- /when -->
<!-- when:arch=anatomy,events,api,bff,shared,multitenancy -->
- **One managed database instance per service from day one** at tiny scale — pays `N×` the floor cost for isolation you do not yet need, when logical databases on one instance preserve the contract.
<!-- /when -->
<!-- when:arch=multitenancy -->
- **Building tenant/location routing infrastructure while everything is still pooled** — there is nothing to route; the catalog, service, and read-model are speculative complexity.
<!-- /when -->

## Sources

- The Twelve-Factor App — Dev/prod parity & Config — https://12factor.net/dev-prod-parity
- The Twelve-Factor App — Disposability (fast startup & graceful shutdown) — https://12factor.net/disposability
- Kubernetes — Pod lifecycle & termination (SIGTERM, preStop, grace period) — https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination
- AWS SaaS Lens — Silo, pool, and bridge models — https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html
- Microsoft — Database-per-service & schema management in microservices — https://learn.microsoft.com/en-us/azure/architecture/microservices/design/data-considerations
- Kubernetes — Secrets & the External Secrets/operator pattern — https://kubernetes.io/docs/concepts/configuration/secret/
- OpenTofu (MPL 2.0, Linux Foundation / CNCF) — https://opentofu.org/
- OpenBao (MPL 2.0, Linux Foundation) — https://openbao.org/
