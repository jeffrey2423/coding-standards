---
title: Single-Page Application (SPA) Standard
platform: web
track: spa
load_when: "Building one cohesive web application that ships as a single deployable — no microfrontends, no runtime composition."
updated: 2026-06
---

# Single-Page Application (SPA) Standard

> **Choose this track** for a single, cohesive app deployed as one unit. It's the default for most products. Only move to [Single-SPA](../single-spa/single-spa-standard.md) or [Module Federation](../microfrontends/module-federation-standard.md) when you have a real need for independently-deployed modules — don't adopt microfrontend complexity speculatively.

A monolithic SPA still follows the same Clean Architecture + DDD folder structure and conventions as every web track. See [`frontend-architecture.md`](../_base/frontend-architecture.md) and [`frontend-standards.md`](../_base/frontend-standards.md) for the shared rules; this document only states what is specific to the single-deployable case.

## Core rules

- **MUST** ship as a single Vite build; no `remoteEntry`/federation, no SystemJS import maps.
- **MUST** use TanStack Router file-based routing with pathless layouts for auth/app boundaries.
- **MUST** code-split per route (automatic with TanStack Router) to keep the initial bundle < 500KB gzipped.
- **SHOULD** organize by business module/domain/feature, not by technical layer.
- **SHOULD** lazy-load heavy, rarely-used routes and features.

## Vite config (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
  build: { target: 'esnext' },
});
```

## When to graduate to microfrontends

Adopt a microfrontend track only when **at least one** is true:

- Independent teams need to deploy modules on **separate release cadences**.
- A capability is **reused across multiple products** with different layouts.
- You need to **enable/disable modules per tenant/license at runtime** (→ Module Federation).
- You must integrate modules built with **different frameworks** (→ Single-SPA).

Until then, a well-structured SPA is faster to build, debug and deploy.

## References

- TanStack Router — https://tanstack.com/router
- Vite — https://vite.dev/
