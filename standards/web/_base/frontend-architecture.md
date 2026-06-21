---
title: Frontend Architecture
platform: web
load_when: "Any web work — defines folder structure, routing conventions, and how to pick a web track."
updated: 2026-06
---

# Frontend Architecture

Applies to the web track selected at install. Implements [`core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md) on the frontend.

## Web architecture

<!-- when:web=spa -->
Microfrontend complexity is real — adopt distribution only when a concrete force (multiple teams, independent deploy) demands it. Industry adoption of microfrontends had a "reality check": most teams that backed out had adopted them speculatively.
<!-- /when -->

| Track | Choose when | Doc |
|---|---|---|
| **SPA** | One cohesive app, single deployable, single/few teams | [`web/spa/spa-standard.md`](../spa/spa-standard.md) |
| **Module Federation** | **Homogeneous React**, capabilities reused across products, **license-gated runtime composition**. The 2026 de-facto standard for scalable React MFEs. | [`web/microfrontends/module-federation-standard.md`](../microfrontends/module-federation-standard.md) |
| **Single-SPA** | **Mixed frameworks** or hard per-module lifecycle/CSS isolation; a dedicated top-level orchestrator | [`web/single-spa/single-spa-standard.md`](../single-spa/single-spa-standard.md) |
| **Combined** | Single-SPA orchestrates independently-deployed apps **and** Module Federation shares code/modules between them | [`single-spa-standard.md`](../single-spa/single-spa-standard.md) + [`module-federation-standard.md`](../microfrontends/module-federation-standard.md) |

<!-- when:web=single-spa -->
> **Single-SPA and Module Federation are not mutually exclusive.** Single-SPA orchestrates *which app/route is active*; Module Federation shares *code/modules at runtime*. A large platform can use Single-SPA as the shell and Module Federation for cross-app sharing.
<!-- /when -->

### How each track meets the backend

The frontend track decides **how the UI is composed**; the backend decides **who owns the data and logic**. They meet at the **bounded context**: a domain is a **vertical slice** owned end-to-end by one team — microfrontend + (optional) BFF + microservice(s). See [`core/platform-architecture.md`](../../core/platform-architecture.md) for the full end-to-end model.

| Track | Typical backend | BFF |
|---|---|---|
| **SPA** | Modular monolith, or a few microservices behind a gateway | Usually none (one per client type only if web **and** mobile diverge) |<!-- when:web=spa -->
| **Module Federation** | Microservices per context; each capability is a team's vertical slice | **BFF per capability** (optional); a thin shell service for the license/manifest endpoint |<!-- when:web=mf -->
| **Single-SPA** | Microservices per context | **BFF per app** (the natural fit) |<!-- when:web=single-spa -->

Each module/feature calls **its own context's** API through the shared gateway. When one screen must aggregate **several** contexts, stitch read-only data in the frontend (parallel TanStack Query calls); reach for a server-side [Backend for Frontend](../../backend/architecture/bff-standard.md) only when that stitching gets chatty or leaks too much backend shape into the UI.

## Folder structure

Organize by **business module → domain → feature**, with Clean Architecture layers inside each feature:

```
src/
├── main.tsx                 # entry point
├── routes/                  # TanStack Router (route definitions only)
│   ├── __root.tsx           # root layout (providers)
│   ├── _auth.tsx            # pathless public layout
│   └── _app.tsx             # pathless protected layout
├── modules/                 # business logic
│   └── sales/               #   MODULE
│       └── quotes/          #     DOMAIN
│           └── cart/        #       FEATURE
│               ├── domain/          # entities, repo interfaces, types
│               ├── application/     # use-cases, hooks, store
│               ├── infrastructure/  # repo impls, api, adapters
│               └── presentation/    # components
├── shared/                  # reusable components, hooks, lib, types
├── app/                     # global providers + stores
├── infrastructure/          # global services (api, storage, pwa)
└── styles/                  # global styles
```

## TanStack Router conventions

| Prefix | Effect | Example |
|---|---|---|
| `_` | Pathless layout (no URL segment) | `_app.tsx` |
| `.` | Flat routing | `orders.$id.tsx` → `/orders/:id` |
| `-` | Ignored by router (colocated files) | `-components/` |
| `$` | Dynamic parameter | `$orderId.tsx` → `:orderId` |

## Core rules

- **MUST** keep `routes/` for route definitions only; business logic lives in `modules/`.
- **MUST** split state by ownership: **Zustand** (global client) / **TanStack Query** (server) / `useState` (local).
- **MUST** keep `routeTree.gen.ts` untouched (auto-generated).
- **MUST** meet WCAG 2.1 AA in every component.
- **SHOULD** lazy-load routes (automatic with TanStack Router `autoCodeSplitting`).
- **SHOULD** build complex UI by composing small reusable components.

## State management split

| State | Tool | Example |
|---|---|---|
| Server data (fetch/cache/sync) | TanStack Query | product list, order detail |
| Global client state | Zustand | auth session, theme, cart |
| Local UI state | `useState`/`useReducer` | modal open, form field focus |

See [`frontend-standards.md`](frontend-standards.md) for detailed component, form, and testing rules.
