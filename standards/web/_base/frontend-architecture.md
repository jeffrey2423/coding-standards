---
title: Frontend Architecture
platform: web
load_when: "Any web work — defines folder structure, routing conventions, and how to pick a web track."
updated: 2026-06
---

# Frontend Architecture

Applies to every web track (SPA, Single-SPA, Module Federation). Implements [`core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md) on the frontend.

## Choosing a web track

These are **independent options**, not a default-plus-exceptions. Pick by need:

| Track | Choose when | Doc |
|---|---|---|
| **SPA** | One cohesive app, single deployable | [`web/spa/spa-standard.md`](../spa/spa-standard.md) |
| **Single-SPA** | Independently-deployed modules, possibly **mixed frameworks**, hard lifecycle isolation | [`web/single-spa/single-spa-standard.md`](../single-spa/single-spa-standard.md) |
| **Module Federation** | Homogeneous React, capabilities reused across products, **license-gated runtime composition** | [`web/microfrontends/module-federation-standard.md`](../microfrontends/module-federation-standard.md) |

Default to **SPA** until a concrete need justifies microfrontend complexity. Don't adopt it speculatively.

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
