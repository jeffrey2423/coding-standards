# Vite Config - Estándar Microfrontends

Guía de configuración estándar para microfrontends usando Single-SPA (default) y Module Federation (solo módulos compartidos).

---

## REGLA CRÍTICA: Single-SPA vs Module Federation

| Tipo de Módulo | Tecnología | Cuándo Usar |
|----------------|------------|-------------|
| **MFE Estándar** | **Single-SPA** | ✅ DEFAULT - Todos los módulos de negocio (finance, hr, inventory, etc.) |
| **Módulo Transversal** | **Module Federation** | ⚠️ SOLO cuando el ingeniero define explícitamente que debe ser compartido |

### ¿Cuándo usar Module Federation?

Module Federation **SOLO** se usa para módulos que:
1. Son **transversales** (usados por múltiples MFEs)
2. El ingeniero los marca **explícitamente** como "federable"
3. Ejemplos: Componentes compartidos, utilidades comunes, design system

### ¿Cuándo usar Single-SPA?

Single-SPA es el **DEFAULT** para:
1. Todos los módulos de negocio (finance, hr, inventory, sales, etc.)
2. Cualquier MFE que no sea explícitamente marcado como federable
3. Widgets independientes

---

## Dependencias Requeridas

### Para MFE Single-SPA (DEFAULT)

```bash
# Core Single-SPA
npm install single-spa-react

# Vite Plugin (configura automáticamente entry points, externals, CSS)
npm install vite-plugin-single-spa --save-dev

# React (obligatorio)
npm install react react-dom
npm install @types/react @types/react-dom --save-dev

# Común
npm install @vitejs/plugin-react --save-dev
```

### Para Módulo Federable (SOLO si explícitamente requerido)

```bash
# Module Federation
npm install @module-federation/vite --save-dev

# TanStack Router (si aplica)
npm install @tanstack/react-router

# Común
npm install @vitejs/plugin-react --save-dev
```

---

## 1. Single-SPA (DEFAULT para todos los MFEs)

### 1.1 Configuración Vite (vite.config.ts)

```typescript
// modules/{module-name}/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

export default defineConfig({
  plugins: [
    react(),
    vitePluginSingleSpa({
      serverPort: 3001,                    // Puerto único por módulo
      spaEntryPoints: 'src/spa.tsx',       // Entry point Single-SPA
      cssStrategy: 'singleMife',           // CSS se inyecta/remueve en mount/unmount
      projectId: '{module-name}-module',   // ID único del proyecto
    }),
  ],
  server: {
    port: 3001,
    cors: true,
  },
  base: '/{module-name}/',                 // Prefijo de rutas
});
```

### 1.2 Entry Point Single-SPA (src/spa.tsx)

```typescript
// modules/{module-name}/src/spa.tsx
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import { cssLifecycleFactory } from 'vite-plugin-single-spa/ex';
import App from './App';

// Props que el App Shell puede pasar al MFE
export interface CustomProps {
  i18n?: unknown;
  eventBus?: unknown;
  authContext?: unknown;
}

// Error boundary para errores en el MFE
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Error en módulo
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}

// Crear lifecycles con single-spa-react
const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: App,
  errorBoundary: (err: Error) => <ErrorFallback error={err} />,
  // CRÍTICO: Especificar el contenedor del App Shell donde se montará el MFE
  domElementGetter: () => document.getElementById('single-spa-application')!,
});

// CSS lifecycle - inyecta CSS al montar, lo remueve al desmontar
const cssLc = cssLifecycleFactory('spa');

// ⚠️ REGLA CRÍTICA: domElementGetter
// -------------------------------------
// El App Shell de principal provee un contenedor específico donde se montan los MFEs:
//   <div id="single-spa-application">
//
// Sin domElementGetter:
//   - single-spa-react crea un <div> nuevo al final del <body>
//   - El MFE se renderiza FUERA del layout del App Shell
//   - El usuario NO verá el MFE aunque esté montado correctamente
//
// Con domElementGetter:
//   - El MFE se monta dentro del contenedor del App Shell
//   - Se integra correctamente con el layout (navegación, estilos)
//   - El usuario ve el MFE en la ubicación correcta
//
// TODOS los MFEs Single-SPA deben incluir esta configuración.

// Exportar lifecycles combinados (CSS + React)
export const bootstrap = [cssLc.bootstrap, lifecycles.bootstrap];
export const mount = [cssLc.mount, lifecycles.mount];
export const unmount = [cssLc.unmount, lifecycles.unmount];
```

### 1.3 Standalone Development (src/main.tsx)

```typescript
// modules/{module-name}/src/main.tsx
// Para desarrollo standalone (sin App Shell)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 1.4 App Shell - Registro de MFEs Single-SPA

```typescript
// app-shell/src/microfrontends/register.ts
import { registerApplication, start } from 'single-spa';

// Registrar cada MFE
registerApplication({
  name: 'finance',
  app: () => System.import('http://localhost:3001/finance/spa.js'),
  activeWhen: ['/finance'],
  customProps: {
    i18n: i18nInstance,
    eventBus: eventBus,
    authContext: authStore.getState(),
  },
});

registerApplication({
  name: 'inventory',
  app: () => System.import('http://localhost:3002/inventory/spa.js'),
  activeWhen: ['/inventory'],
  customProps: {
    i18n: i18nInstance,
    eventBus: eventBus,
    authContext: authStore.getState(),
  },
});

registerApplication({
  name: 'hr',
  app: () => System.import('http://localhost:3003/hr/spa.js'),
  activeWhen: ['/hr'],
  customProps: {
    i18n: i18nInstance,
    eventBus: eventBus,
    authContext: authStore.getState(),
  },
});

// Iniciar Single-SPA
start();
```

### 1.5 Import Map (index.html del App Shell)

```html
<!-- app-shell/index.html -->
<script type="systemjs-importmap">
{
  "imports": {
    "react": "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
    "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js",
    "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@6/lib/system/single-spa.min.js"
  }
}
</script>
<script src="https://cdn.jsdelivr.net/npm/systemjs@6/dist/system.min.js"></script>
```

---

## 2. Module Federation (SOLO para módulos transversales explícitos)

> ⚠️ **IMPORTANTE**: Solo usar Module Federation cuando el ingeniero defina explícitamente que un módulo debe ser compartido/federable.

### 2.1 Exponer un Módulo Federable (Remote)

```typescript
// shared-components/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'sharedComponents',            // Nombre único del módulo federable
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button.tsx',
        './Modal': './src/components/Modal.tsx',
        './DataTable': './src/components/DataTable.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' }
      },
    }),
  ],
  server: {
    port: 3010,
    strictPort: true,
    cors: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
```

### 2.2 Consumir Módulo Federable desde un MFE

```typescript
// modules/finance/vite.config.ts (MFE que consume módulos federables)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vitePluginSingleSpa from 'vite-plugin-single-spa';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    vitePluginSingleSpa({
      serverPort: 3001,
      spaEntryPoints: 'src/spa.tsx',
      cssStrategy: 'singleMife',
      projectId: 'finance-module',
    }),
    // Solo agregar federation si necesita consumir módulos compartidos
    federation({
      name: 'finance',
      remotes: {
        sharedComponents: {
          type: 'module',
          name: 'sharedComponents',
          entry: 'http://localhost:3010/remoteEntry.js',
          entryGlobalName: 'sharedComponents',
        },
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
      },
    }),
  ],
  server: {
    port: 3001,
    cors: true,
  },
  base: '/finance/',
});
```

### 2.3 Tipos para Módulos Federables

```typescript
// types/remotes.d.ts
declare module 'sharedComponents/Button' {
  const Button: React.ComponentType<ButtonProps>;
  export default Button;
}

declare module 'sharedComponents/Modal' {
  const Modal: React.ComponentType<ModalProps>;
  export default Modal;
}

declare module 'sharedComponents/DataTable' {
  const DataTable: React.ComponentType<DataTableProps>;
  export default DataTable;
}
```

---

## 3. Convención de Puertos

| Módulo | Puerto | Tipo | Descripción |
|--------|--------|------|-------------|
| app-shell | 3000 | Host | Orquestador Single-SPA |
| finance | 3001 | Single-SPA | Módulo Finanzas |
| inventory | 3002 | Single-SPA | Módulo Inventario |
| hr | 3003 | Single-SPA | Módulo RRHH |
| crm | 3004 | Single-SPA | Módulo CRM |
| pos | 3005 | Single-SPA | Módulo POS |
| shared-components | 3010 | Federation | Componentes compartidos (federable) |
| shared-utils | 3011 | Federation | Utilidades compartidas (federable) |

---

## 4. Routing con TanStack Router

### 4.1 Router del MFE (Single-SPA)

> ⚠️ **IMPORTANTE:** Todas las rutas deben tener prefijo único que coincida con `base` en vite.config.ts

```typescript
// modules/finance/src/router.tsx
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './routes/dashboard';
import AccountsIndex from './routes/accounts.index';
import AccountDetail from './routes/accounts.$id';

// Root route con layout
const rootRoute = createRootRoute({
  component: MainLayout,
});

// Ruta índice - redirige al dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/finance/dashboard' });
  },
});

// Dashboard
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/finance/dashboard',
  component: Dashboard,
});

// Cuentas - listado
const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/finance/accounts',
  component: AccountsIndex,
});

// Cuentas - detalle
const accountDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/finance/accounts/$id',
  component: AccountDetail,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  accountsRoute,
  accountDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### 4.2 Convención de Prefijos de Rutas

| Módulo | Puerto | Base (vite.config) | Prefijo Rutas |
|--------|--------|---------------------|---------------|
| app-shell | 3000 | `/` | `/` |
| finance | 3001 | `/finance/` | `/finance/*` |
| inventory | 3002 | `/inventory/` | `/inventory/*` |
| hr | 3003 | `/hr/` | `/hr/*` |

---

## 5. Shared Dependencies (para ambos)

```typescript
shared: {
  // SIEMPRE singleton para React
  react: { singleton: true, requiredVersion: '^18.3.1' },
  'react-dom': { singleton: true, requiredVersion: '^18.3.1' },

  // Router y Query
  '@tanstack/react-router': { singleton: true },
  '@tanstack/react-query': { singleton: true },

  // State management
  'zustand': { singleton: true },

  // i18n
  'react-i18next': { singleton: true },
  'i18next': { singleton: true },
}
```

---

## 6. Checklist de Configuración

### MFE Single-SPA (DEFAULT)

- [ ] `vite-plugin-single-spa` instalado y configurado
- [ ] `single-spa-react` instalado
- [ ] `src/spa.tsx` con lifecycles exportados
- [ ] `cssLifecycleFactory` configurado para CSS isolation
- [ ] `errorBoundary` implementado
- [ ] **`domElementGetter` apuntando a `#single-spa-application`** ⚠️ CRÍTICO
- [ ] Puerto único configurado
- [ ] `base` configurado con prefijo (ej: `/finance/`)
- [ ] Todas las rutas usan el prefijo
- [ ] `cors: true` en server
- [ ] `src/main.tsx` para desarrollo standalone

### Módulo Federable (SOLO si explícitamente requerido)

- [ ] `@module-federation/vite` instalado
- [ ] `name` único en federation config
- [ ] `filename: 'remoteEntry.js'`
- [ ] `exposes` con componentes/utilidades a compartir
- [ ] `shared` con React y dependencias como singleton
- [ ] Puerto único (rango 3010+)
- [ ] `cors: true` en server
- [ ] `modulePreload: false` en build
- [ ] `cssCodeSplit: false` en build
- [ ] Tipos declarados en consumidores

### App Shell

- [ ] `single-spa` instalado
- [ ] Import map con React y dependencias compartidas
- [ ] `registerApplication` para cada MFE
- [ ] `start()` llamado después de registrar
- [ ] `customProps` con contexto compartido (i18n, auth, eventBus)
- [ ] **Contenedor `<div id="single-spa-application">` en el layout** ⚠️ CRÍTICO para MFEs

---

## 7. Beneficios de Single-SPA como Default

| Aspecto | Single-SPA | Module Federation |
|---------|------------|-------------------|
| **Aislamiento** | ✅ Completo (CSS, JS, lifecycle) | ⚠️ Parcial |
| **Hot Reload** | ✅ Funciona bien | ⚠️ Problemas conocidos |
| **CSS Isolation** | ✅ `cssLifecycleFactory` automático | ⚠️ Manual |
| **Error Boundaries** | ✅ Built-in | ⚠️ Manual |
| **Mount/Unmount** | ✅ Lifecycle completo | ⚠️ Solo lazy load |
| **Complejidad** | ✅ Baja | ⚠️ Alta |
| **Sharing código** | ⚠️ Via import maps | ✅ Nativo |

---

## 8. Referencias

- [Single-SPA Documentation](https://single-spa.js.org/)
- [single-spa-react](https://single-spa.js.org/docs/ecosystem-react/)
- [vite-plugin-single-spa](https://github.com/nickt/vite-plugin-single-spa)
- [Module Federation](https://module-federation.io/)
- [Vite Documentation](https://vitejs.dev/)
