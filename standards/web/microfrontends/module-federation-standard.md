---
title: Module Federation Microfrontends Standard
platform: web
track: microfrontends
load_when: "Building a homogeneous (all-React) multi-product web platform where capabilities are reused across products and modules are enabled/disabled per license without redeploy."
updated: 2026-06
---

# Module Federation Microfrontends Standard

> **Choose this track when** the whole frontend is a **homogeneous React stack** and you want: efficient sharing of singleton dependencies, end-to-end TypeScript typing across module boundaries, native code-splitting, and **runtime composition driven by the backend** (per-tenant licensing). If you must mix frameworks or need hard per-module lifecycle isolation, use the [Single-SPA track](../single-spa/single-spa-standard.md) instead.

This standard uses **Module Federation 2.0** (`@module-federation/enhanced`), whose runtime is decoupled from the bundler into a standalone SDK. That decoupling is what makes **dynamic, license-gated remote loading** possible: the host asks the backend which remotes to load and registers them at runtime.

## The two axes

A multi-product platform has two **independent** dimensions. Conflating them is the classic mistake.

|              | Capability 1 | Capability 2 | Capability 3 | Capability 4 |
|--------------|:---:|:---:|:---:|:---:|
| **Product A** | ✅ | ✅ |   |   |
| **Product B** | ✅ |   | ✅ |   |
| **Product C** |   | ✅ |   |   |
| **Product D** |   |   |   | ✅ |

- **Capabilities** (horizontal) = **remote MFEs**. Built, deployed and versioned independently. Written **once**, reused across products.
- **Products** (vertical) = **router layouts inside the single shell**. They compose capabilities and pass them props. Creating a new product = adding a folder with a `route.tsx`, not a new app.

## Core rules

- **MUST** use a **single shell, single router, single session**. Never nest a shell inside a shell.
- **MUST** model products as **route layouts** in the shell; model capabilities as **remote MFEs**.
- **MUST** keep capabilities **product-agnostic**: a remote receives typed props and adapts; it never knows which product hosts it.
- **MUST** declare shared singletons (`react`, `react-dom`, router, query client, UI kit, contracts) with `singleton: true` and a `requiredVersion`. Symmetric config between shell and every remote.
- **MUST** decide which remotes load from a **backend manifest endpoint** keyed by tenant/license — the frontend never hardcodes that decision.
- **MUST** guard products and capabilities with declarative two-level license guards (`beforeLoad`).
- **MUST** version the shared `@org/contracts` package semantically; a breaking prop change is a new major.
- **SHOULD** wrap remote loading in `Suspense` + an `ErrorBoundary` with an offline fallback (CDN failure is a real risk).
- **SHOULD NOT** create "private" props or events the contracts package doesn't describe — that breaks parity and typing.

## Stack (2026)

| Concern | Choice |
|---|---|
| Federation | **Module Federation 2.0** — `@module-federation/enhanced` (runtime SDK + `mf-manifest.json`) |
| Bundler | Vite 7+ (`@module-federation/vite`) or Rspack (`@module-federation/rsbuild-plugin`) |
| Framework | React 19 + TypeScript strict |
| Router | TanStack Router 1+ (typed nested layouts) |
| Server state | TanStack Query 5+ (singleton) |
| Shared packages | `@org/contracts` (types/props), `@org/ui-kit` (design system), `@org/license` (entitlements) |

## Architecture in three layers

```
SHELL (single host)
  • boots, fetches license + dynamic manifest
  • defines product layouts, owns global routing + guards
        │  Module Federation 2.0 runtime (registerRemotes / loadRemote)
        ▼
CAPABILITY MFEs (remotes, deployed independently)
  mfe-capacidad-1   mfe-capacidad-2   mfe-capacidad-3 ...
        │  build-time imports
        ▼
SHARED PACKAGES (npm, singleton at runtime)
  @org/contracts   @org/ui-kit   @org/license
```

## Products as router layouts

```tsx
// shell/src/routes/producto-a/route.tsx
export const Route = createFileRoute('/producto-a')({
  beforeLoad: () => requireProduct('producto-a'),   // product-level license guard
  component: () => (
    <div className="producto-a-layout">
      <ProductoAHeader />
      <ProductoASidebar />
      <main><Outlet /></main>                        {/* a capability renders here */}
    </div>
  ),
});
```

```tsx
// shell/src/routes/producto-a/capacidad-1.tsx
import { loadRemote } from '@module-federation/enhanced/runtime';
const Capacidad1 = lazy(() => loadRemote('mfe_capacidad_1/View'));

export const Route = createFileRoute('/producto-a/capacidad-1')({
  beforeLoad: () => requireFeature('capacidad-1'),   // capability-level guard
  component: () => (
    <Suspense fallback={<CapabilitySkeleton />}>
      <Capacidad1 mode="producto-a" showExtraContext />
    </Suspense>
  ),
});
```

The remote consumes typed props from `@org/contracts` and adapts — it has no knowledge of the host product:

```tsx
// mfe-capacidad-1/src/View.tsx
import type { Capacidad1Props } from '@org/contracts';
export default function View({ mode, showExtraContext, onAction }: Capacidad1Props) {
  // same component, behavior adapts to `mode`
}
```

## Dynamic, license-gated loading (the differentiator)

On boot the shell asks the backend which remotes this tenant is licensed for, then registers them with the MF 2.0 runtime. Unlicensed bundles are **never downloaded**.

```
GET /api/mf-manifest?tenant=cliente-123
{
  "products":  ["producto-a", "producto-c"],
  "features":  ["capacidad-1", "capacidad-2"],
  "remotes": {
    "mfe_capacidad_1": "https://cdn.org.com/cap1/2.4.1/mf-manifest.json",
    "mfe_capacidad_2": "https://cdn.org.com/cap2/1.8.0/mf-manifest.json"
  }
}
```

```ts
// shell/src/bootstrap.ts
import { init, registerRemotes } from '@module-federation/enhanced/runtime';

const manifest = await fetch(`/api/mf-manifest?tenant=${tenantId}`).then(r => r.json());

init({
  name: 'shell',
  remotes: [],
  shared: {
    react: { singleton: true, requiredVersion: '^19.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  },
});

registerRemotes(
  Object.entries(manifest.remotes).map(([name, entry]) => ({ name, entry })),
);
```

**Commercial implication:** selling a new module to a tenant = flipping a backend flag. The next session's manifest includes the remote and the UI exposes it. **No redeploy, no client update.**

## Static shell config (build-time remotes that are always present)

```ts
// shell/vite.config.ts
import { federation } from '@module-federation/vite';
export default defineConfig({
  plugins: [react(), federation({
    name: 'shell',
    remotes: {
      mfe_capacidad_1: 'mfe_capacidad_1@/remotes/cap1/mf-manifest.json',
    },
    shared: {
      react:                    { singleton: true, requiredVersion: '^19.0.0' },
      'react-dom':              { singleton: true, requiredVersion: '^19.0.0' },
      '@tanstack/react-router': { singleton: true },
      '@tanstack/react-query':  { singleton: true },
      '@org/ui-kit':            { singleton: true },
      '@org/contracts':         { singleton: true },
    },
  })],
});
```

Remote config exposes its view and **mirrors** the `shared` block (must be symmetric, or dependencies duplicate at runtime):

```ts
// mfe-capacidad-1/vite.config.ts
federation({
  name: 'mfe_capacidad_1',
  filename: 'remoteEntry.js',
  exposes: { './View': './src/View.tsx' },
  shared: { /* same singleton block as the shell */ },
});
```

## Contract typing & version-skew safety

Module Federation 2.0 can download a remote's **TypeScript types at build time** (`dts`). Treat exposed modules as **public APIs**: add optional props with defaults, never rename/remove props consumers rely on. If the host downloads remote types, a breaking contract change becomes a **build error** instead of a runtime crash.

- **MUST** run contract tests in CI between shell and remotes.
- **SHOULD** deprecate props with a window before removal; bump `@org/contracts` major on breaking change.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Version skew between shell and a remote | Semver `@org/contracts`; MF 2.0 `dts` build-time types; contract tests in CI |
| Duplicate React/router instances | `singleton: true` + `requiredVersion` on both sides; symmetric `shared` |
| CDN serving remotes goes down | Service Worker caching + offline fallback in `ErrorBoundary` |
| CSS collisions between MFEs | CSS Modules / per-MFE prefix; shared design tokens via `@org/ui-kit` |
| Uncontrolled `ui-kit` growth | Allow duplication first; promote to the kit only after a pattern is validated in 2+ MFEs |

## The checkpoint that proves the design

The critical moment is introducing the **second product**: if it requires modifying any capability MFE, the prop contract is wrong and must be fixed before continuing. A well-designed contract makes the 20th product as easy as the first.

## Metrics of success

- **Zero functional duplication** — a business rule changes in exactly one place.
- **Bundle proportional to license** — a single-product tenant never downloads the full catalog.
- **Independent deploy** — a capability fix reaches production without redeploying the others (< 15 min).
- **License activation without redeploy** — a new module is live in the next session.
- **INP < 100ms** on critical interactions; resilient during CDN/connectivity loss.

## References

- Module Federation 2.0 — https://module-federation.io/blog/announcement.html
- Runtime API (`init`, `registerRemotes`, `loadRemote`) — https://module-federation.io/guide/runtime/runtime-api
- `@module-federation/vite` — https://module-federation.io/
- TanStack Router — https://tanstack.com/router
