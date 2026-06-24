---
title: Web Technology Stack
platform: web
load_when: "Any web work — the approved frontend toolchain and versions."
updated: 2026-06
---

# Web Technology Stack

The approved frontend toolchain. Use these by default; deviations need a stated reason.

| Category | Technology | Version | Notes |
|---|---|---|---|
| Runtime | Node.js | 24 LTS | toolchain runtime; clears Vite 7's 20.19+/22.12+ floor |
| Bundler | Vite | 7+ | native ESM, fast HMR |
| Framework | React | 19 (18+ supported) | functional components + hooks |
| Language | TypeScript | 5+ | `strict` mode mandatory |
| Routing | TanStack Router | 1+ | file-based, type-safe, auto code-splitting |
| Client state | Zustand | 5+ | feature-based stores |
| Server state | TanStack Query | 5+ | cache, sync, optimistic updates |
| UI components | shadcn/ui + Radix UI | latest | install shadcn via MCP, not by hand |
| Styling | TailwindCSS | v4 | utility-first; design tokens from the UI kit |
| Forms | React Hook Form + Zod | latest | schema-driven validation |
| HTTP | Axios | latest | with interceptors |
| Testing | Vitest + React Testing Library + MSW | latest | MSW for API mocking |
| PWA | `vite-plugin-pwa` + Workbox | latest | offline-first where required |

## Rules

- **MUST** use TypeScript `strict`; no implicit `any`.
- **MUST** validate forms with Zod schemas; never trust client input.
- **MUST** keep the initial bundle < 500KB gzipped (see performance targets in [`design-system-ux.md`](design-system-ux.md)).
- **SHOULD** install shadcn/ui components via the MCP integration rather than hand-copying.
- **SHOULD** prefer TanStack Query for all server state instead of bespoke fetch-in-effect logic.

## Microfrontend dependency sharing

When using a microfrontend track, shared dependencies (React, router, query client, Zustand) **MUST** be declared `singleton: true` with a `requiredVersion` to prevent duplicate runtime instances. Track-specific configuration:

- Module Federation → [`web/microfrontends/module-federation-standard.md`](../microfrontends/module-federation-standard.md)
- Single-SPA → [`web/single-spa/single-spa-standard.md`](../single-spa/single-spa-standard.md)
