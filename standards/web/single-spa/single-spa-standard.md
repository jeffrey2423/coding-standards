---
title: Single-SPA Microfrontends Standard
platform: web
track: single-spa
load_when: "Building a web app composed of independently-deployed microfrontends that may use DIFFERENT frameworks, or that require hard runtime isolation (CSS/JS/lifecycle) per module."
updated: 2026-06
---

# Single-SPA Microfrontends Standard

> **Choose this track when** you need to compose microfrontends that are **independently deployed** and possibly built with **different frameworks/versions** (React + Angular + legacy), or when each module must have a **fully isolated lifecycle** (its own bootstrap/mount/unmount, CSS injected and removed on navigation). If your whole frontend is a single homogeneous React stack, prefer the [Module Federation track](../microfrontends/module-federation-standard.md) instead — it shares dependencies more efficiently and gives end-to-end typing.

Single-SPA is a **top-level router/orchestrator**: a thin shell registers applications and decides which one is active for a given route. Each microfrontend exposes `bootstrap`/`mount`/`unmount` lifecycles.

## Core rules

- **MUST** keep the shell free of business logic. The shell only registers apps, owns global providers (auth, i18n, event bus) and passes them as `customProps`.
- **MUST** expose `bootstrap`, `mount`, `unmount` lifecycles from each MFE entry (`src/spa.tsx`).
- **MUST** set `domElementGetter` so the MFE mounts inside the shell container, not at the end of `<body>`.
- **MUST** isolate CSS per MFE via `cssLifecycleFactory` (injected on mount, removed on unmount).
- **MUST** wrap each MFE in an error boundary so one module failing never takes down the shell.
- **MUST** give every MFE a unique route prefix matching its `base` (e.g. `/finance/*`).
- **SHOULD** ship a standalone entry (`src/main.tsx`) so each MFE runs in isolation during development.
- **SHOULD** share singletons (`react`, `react-dom`, router, query client) via an SystemJS import map to avoid duplicate instances.

## Stack (2026)

| Concern | Choice |
|---|---|
| Orchestrator | `single-spa` 6+ |
| React adapter | `single-spa-react` |
| Bundler plugin | `vite-plugin-single-spa` |
| Framework | React 19 (18 still supported) + TypeScript strict |
| Router (per MFE) | TanStack Router 1+ |
| Module loader | SystemJS 6 + import maps |

## MFE entry (`src/spa.tsx`)

```tsx
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import { cssLifecycleFactory } from 'vite-plugin-single-spa/ex';
import App from './App';

// Context the shell injects into every MFE.
export interface ShellProps {
  i18n?: unknown;
  eventBus?: unknown;
  authContext?: unknown;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-red-50">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-xl font-semibold text-red-600">Error en el módulo</h2>
        <p className="mb-4 text-slate-600">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  errorBoundary: (err: Error) => <ErrorFallback error={err} />,
  // CRITICAL: mount inside the shell container, not at the end of <body>.
  domElementGetter: () => document.getElementById('single-spa-application')!,
});

const cssLc = cssLifecycleFactory('spa');

export const bootstrap = [cssLc.bootstrap, lifecycles.bootstrap];
export const mount = [cssLc.mount, lifecycles.mount];
export const unmount = [cssLc.unmount, lifecycles.unmount];
```

> **Why `domElementGetter` is mandatory:** without it, `single-spa-react` creates a fresh `<div>` at the end of `<body>` and the MFE renders *outside* the shell layout — mounted correctly but invisible to the user. The shell must expose `<div id="single-spa-application">` in its layout.

## MFE Vite config (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

export default defineConfig({
  plugins: [
    react(),
    vitePluginSingleSpa({
      serverPort: 3001,                  // unique per module
      spaEntryPoints: 'src/spa.tsx',
      cssStrategy: 'singleMife',         // CSS injected/removed on mount/unmount
      projectId: 'finance-module',
    }),
  ],
  server: { port: 3001, cors: true },
  base: '/finance/',                     // route prefix
});
```

## Shell registration (`app-shell/src/microfrontends/register.ts`)

```ts
import { registerApplication, start } from 'single-spa';

const shared = {
  i18n: i18nInstance,
  eventBus,
  authContext: authStore.getState(),
};

registerApplication({
  name: 'finance',
  app: () => System.import('http://localhost:3001/finance/spa.js'),
  activeWhen: ['/finance'],
  customProps: shared,
});

registerApplication({
  name: 'inventory',
  app: () => System.import('http://localhost:3002/inventory/spa.js'),
  activeWhen: ['/inventory'],
  customProps: shared,
});

start();
```

Shell import map (`app-shell/index.html`) — pins shared singletons:

```html
<script type="systemjs-importmap">
{
  "imports": {
    "react": "https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js",
    "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js",
    "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@6/lib/system/single-spa.min.js"
  }
}
</script>
<script src="https://cdn.jsdelivr.net/npm/systemjs@6/dist/system.min.js"></script>
```

## Port convention

| Module | Port | Role |
|---|---|---|
| app-shell | 3000 | Orchestrator |
| finance | 3001 | MFE |
| inventory | 3002 | MFE |
| hr | 3003 | MFE |
| crm | 3004 | MFE |

## Per-MFE routing (TanStack Router)

Every route MUST carry the module prefix that matches `base`:

```tsx
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/finance/dashboard',
  component: Dashboard,
});
```

## Checklist

**MFE**
- [ ] `vite-plugin-single-spa` + `single-spa-react` installed
- [ ] `src/spa.tsx` exports `bootstrap`/`mount`/`unmount`
- [ ] `cssLifecycleFactory` wired for CSS isolation
- [ ] `errorBoundary` implemented
- [ ] **`domElementGetter` → `#single-spa-application`** ⚠️
- [ ] Unique port + `base` prefix; all routes use the prefix
- [ ] `cors: true`; standalone `src/main.tsx` for dev

**Shell**
- [ ] `single-spa` installed; import map with shared singletons
- [ ] `registerApplication` per MFE + `start()`
- [ ] `customProps` with i18n/auth/eventBus
- [ ] `<div id="single-spa-application">` present in layout ⚠️

## References

- Single-SPA — https://single-spa.js.org/
- single-spa-react — https://single-spa.js.org/docs/ecosystem-react/
- vite-plugin-single-spa — https://github.com/single-spa/vite-plugin-single-spa
