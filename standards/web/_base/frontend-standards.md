---
title: Frontend Development Standards
platform: web
load_when: "Any web UI implementation — components, hooks, forms, state, testing."
updated: 2026-06
---

# Frontend Development Standards

## Resumen

Este documento define los estándares de desarrollo frontend para aplicaciones empresariales usando **Vite** como bundler, **TanStack Router** para enrutamiento type-safe, **Zustand** para estado global, y **Clean Architecture** con estructura modular preparada para microfrontends.

---

## Tabla de Contenidos

1. [Principios de Arquitectura](#1-principios-de-arquitectura)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Convenciones de Routing](#3-convenciones-de-routing)
4. [Organización de Archivos](#4-organización-de-archivos)
5. [Estándares de Componentes](#5-estándares-de-componentes)
6. [Patrones de Estado](#6-patrones-de-estado)
7. [Estándares de Testing](#7-estándares-de-testing)
8. [Accesibilidad](#8-accesibilidad)
9. [Rendimiento](#9-rendimiento)
10. [Seguridad](#10-seguridad)
11. [Manejo de Errores](#11-manejo-de-errores)
12. [Progressive Web App](#12-progressive-web-app)
13. [Estándares de Idioma](#13-estándares-de-idioma)
14. [Consideraciones Generales](#14-consideraciones-generales)
15. [Configuración Base](#15-configuración-base)
16. [Checklist de Implementación](#16-checklist-de-implementación)

---

## 1. Principios de Arquitectura

### 1.1 Implementación de Clean Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│         React components, pages, UI logic, routes               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│         Use cases, custom hooks, Zustand stores                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                          │
│      API clients, repositories impl, external adapters          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│       Business entities, value objects, business rules          │
└─────────────────────────────────────────────────────────────────┘
```

| Capa | Responsabilidad | Contenido |
|------|-----------------|-----------|
| **Domain** | Reglas de negocio puras | Entities, value objects, interfaces de repositorios |
| **Application** | Orquestación de casos de uso | Use cases, hooks, stores Zustand |
| **Infrastructure** | Implementaciones externas | API clients, repositorios concretos, adapters |
| **Presentation** | Interfaz de usuario | Componentes React, páginas, estilos |

### 1.2 Reglas de Dependencia

- Las capas internas **NO deben conocer** las capas externas
- Las dependencias apuntan hacia adentro (de externo a interno)
- Usar inversión de dependencias para concerns externos
- Domain layer no importa nada de otras capas

---

## 2. Stack Tecnológico

### 2.1 Tecnologías Core

| Categoría | Tecnología | Versión | Notas |
|-----------|------------|---------|-------|
| **Bundler** | Vite | 5+ | Build tool y dev server |
| **Framework** | React | 18+ | Functional components y hooks |
| **Router** | TanStack Router | 1+ | File-based routing con type-safety |
| **Lenguaje** | TypeScript | 5+ | Strict mode, sin `any` |
| **Estilos** | TailwindCSS | 4+ | Utility-first CSS |
| **Componentes** | shadcn/ui + Radix UI | - | Base de componentes |
| **Estado** | Zustand | 4+ | Estado global por feature |
| **Data Fetching** | TanStack Query | 5+ | Cache y sincronización |

### 2.2 Reglas de Selección de Framework

| Escenario | Framework | Razón |
|-----------|-----------|-------|
| **Default** | Vite + TanStack Router | Mejor DX, type-safety, preparado para microfrontends |
| **MFE (Default)** | Vite + Single-SPA | Aislamiento completo, CSS lifecycle, error boundaries built-in |
| **Módulo Federable** | Vite + Module Federation | SOLO para módulos transversales explícitamente marcados |

### 2.3 Regla Crítica: Single-SPA vs Module Federation

> ⚠️ **IMPORTANTE**: Por defecto, todos los microfrontends usan **Single-SPA**. Module Federation se usa **SOLO** cuando el ingeniero define explícitamente que un módulo debe ser compartido/federable.

| Tipo | Tecnología | Uso |
|------|------------|-----|
| **MFE de Negocio** | `vite-plugin-single-spa` + `single-spa-react` | ✅ DEFAULT - finance, hr, inventory, etc. |
| **Módulo Compartido** | `@module-federation/vite` | ⚠️ SOLO cuando explícitamente requerido |

**Dependencias Single-SPA (DEFAULT):**
```bash
npm install single-spa-react
npm install vite-plugin-single-spa --save-dev
```

**Beneficios de Single-SPA:**
- CSS isolation automático via `cssLifecycleFactory`
- Error boundaries built-in
- Lifecycle completo (bootstrap, mount, unmount)
- Mejor hot reload
- Menor complejidad de configuración

Ver `vite-config-standard.md` para configuración detallada.

### 2.3 Herramientas de Desarrollo

| Herramienta | Propósito |
|-------------|-----------|
| **Vite** | Build system y dev server |
| **Vitest** | Unit e integration testing |
| **React Testing Library** | Component testing |
| **MSW** | API mocking para tests |
| **ESLint + Prettier** | Code quality y formatting |
| **TypeScript** | Type checking |

---

## 3. Convenciones de Routing

TanStack Router usa prefijos especiales en nombres de archivo para definir comportamientos.

### 3.1 Prefijo `_` (Underscore) - Pathless Layout Routes

**Propósito:** Agrupar rutas bajo un layout compartido **SIN agregar segmentos a la URL**.

#### ❌ El Problema (sin `_`)

```
routes/
├── __root.tsx
├── auth/
│   └── login.tsx          → URL: /auth/login ❌
├── app/
│   ├── dashboard.tsx      → URL: /app/dashboard ❌
│   └── orders.tsx         → URL: /app/orders ❌
```

**Resultado:** Las URLs incluyen el nombre de la carpeta, lo cual es indeseable.

#### ✅ La Solución (con `_`)

```
routes/
├── __root.tsx
├── _auth.tsx              → NO agrega nada a la URL (solo layout)
├── _auth/
│   └── login.tsx          → URL: /login ✅
│
├── _app.tsx               → NO agrega nada a la URL (solo layout)
├── _app/
│   ├── dashboard.tsx      → URL: /dashboard ✅
│   └── orders.tsx         → URL: /orders ✅
```

#### Ejemplo de Implementación

```typescript
// routes/_app.tsx - Layout protegido
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Sidebar, TopNav } from '@/shared/components/layout';
import { useAuthStore } from '@/modules/users/authentication/login/application/store';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 3.2 Prefijo `.` (Punto) - Flat Routing

**Propósito:** Definir rutas anidadas **sin crear carpetas**.

```
routes/
├── orders.tsx              → /orders (layout)
├── orders.index.tsx        → /orders
├── orders.$orderId.tsx     → /orders/:orderId
├── orders.$orderId.edit.tsx → /orders/:orderId/edit
```

#### ¿Cuándo usar `.` vs Carpetas?

| Escenario | Recomendación |
|-----------|---------------|
| Pocas rutas anidadas (2-3) | Flat con `.` |
| Muchas rutas anidadas (4+) | Carpetas |
| Rutas con componentes colocados | Carpetas con `-components/` |

### 3.3 Prefijo `-` (Guión) - Ignorar Archivos

**Propósito:** Excluir archivos/carpetas de la generación de rutas para colocación de código.

```
routes/
├── orders/
│   ├── $orderId.tsx             → /orders/:orderId ✅
│   ├── -components/             → ❌ Ignorado por el router
│   │   └── OrderHeader.tsx
│   └── -hooks/                  → ❌ Ignorado por el router
│       └── useOrderCalculations.ts
```

### 3.4 Prefijo `$` (Dólar) - Parámetros Dinámicos

```typescript
// routes/_app/orders/$orderId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/orders/$orderId')({
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams(); // Tipado automático
  return <div>Order: {orderId}</div>;
}
```

### 3.5 Resumen de Prefijos

| Prefijo | Nombre | Efecto en URL | Uso Principal |
|---------|--------|---------------|---------------|
| `_` | Pathless | **No aparece** | Layouts sin path |
| `.` | Flat | Crea anidamiento | Evitar carpetas |
| `-` | Ignore | **No genera ruta** | Colocación de código |
| `$` | Dynamic | Captura valor | Parámetros de URL |
| `__` | Root | Raíz del árbol | Solo `__root.tsx` |

---

## 4. Organización de Archivos

### 4.1 Estructura Enterprise (Module/Domain/Feature)

```
src/
├── main.tsx                        # React entry point
├── router.tsx                      # TanStack Router config
├── routeTree.gen.ts                # Auto-generado (NO EDITAR)
├── globals.css                     # Estilos globales + Tailwind
│
├── routes/                         # 🛣️ SOLO definición de rutas
│   ├── __root.tsx                  # Layout raíz (providers)
│   ├── index.tsx                   # Redirect inicial
│   ├── _auth.tsx                   # Layout público
│   ├── _auth/
│   │   └── login.tsx
│   ├── _app.tsx                    # Layout protegido
│   └── _app/
│       ├── dashboard.tsx
│       ├── sales/
│       │   ├── quotes.tsx
│       │   └── invoices.tsx
│       └── inventory/
│           └── products.tsx
│
├── modules/                        # 🏢 Lógica de negocio por módulo
│   ├── sales/                      # MODULE
│   │   ├── quotes/                 # DOMAIN
│   │   │   ├── cart/               # FEATURE
│   │   │   │   ├── domain/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── CartItem.ts
│   │   │   │   │   ├── repositories/      # Interfaces
│   │   │   │   │   │   └── ICartRepository.ts
│   │   │   │   │   ├── services/          # Domain services
│   │   │   │   │   │   └── CartCalculator.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── cart.types.ts
│   │   │   │   ├── application/
│   │   │   │   │   ├── use-cases/
│   │   │   │   │   │   ├── AddToCart.ts
│   │   │   │   │   │   └── RemoveFromCart.ts
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useCart.ts
│   │   │   │   │   └── store/
│   │   │   │   │       └── cart.store.ts
│   │   │   │   ├── infrastructure/
│   │   │   │   │   ├── repositories/      # Implementations
│   │   │   │   │   │   └── CartRepository.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── cart.api.ts
│   │   │   │   │   └── adapters/
│   │   │   │   └── presentation/
│   │   │   │       ├── components/
│   │   │   │       │   ├── CartList.tsx
│   │   │   │       │   └── CartItem.tsx
│   │   │   │       └── pages/
│   │   │   │           └── CartPage.tsx
│   │   │   └── products/           # FEATURE
│   │   │       ├── domain/
│   │   │       ├── application/
│   │   │       ├── infrastructure/
│   │   │       └── presentation/
│   │   └── billing/                # DOMAIN
│   │       ├── invoices/           # FEATURE
│   │       └── reports/            # FEATURE
│   │
│   ├── inventory/                  # MODULE
│   │   ├── products/               # DOMAIN
│   │   │   ├── catalog/            # FEATURE
│   │   │   └── stock/              # FEATURE
│   │   └── warehouses/             # DOMAIN
│   │
│   └── users/                      # MODULE
│       └── authentication/         # DOMAIN
│           ├── login/              # FEATURE
│           └── registration/       # FEATURE
│
├── shared/                         # 🔄 Código reutilizable
│   ├── components/
│   │   └── ui/                     # shadcn/ui
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts                # cn(), formatters
│   │   ├── api-client.ts           # Axios/fetch config
│   │   └── env.ts                  # Variables de entorno tipadas
│   ├── types/
│   │   └── common.types.ts
│   └── constants/
│
├── app/                            # 🎯 Configuración global
│   ├── store/                      # Global store (si necesario)
│   ├── providers/                  # Context providers
│   │   ├── ThemeProvider.tsx
│   │   └── QueryProvider.tsx
│   └── config/
│
├── infrastructure/                 # 🔌 Servicios externos globales
│   ├── api/                        # API configuration
│   ├── storage/                    # IndexedDB, localStorage
│   └── pwa/                        # PWA configuration
│
├── assets/                         # 📁 Recursos estáticos
│   ├── fonts/
│   │   ├── Inter_18pt-Light.ttf
│   │   ├── Inter_18pt-Regular.ttf
│   │   └── Inter_18pt-Bold.ttf
│   └── images/
│       └── logos/
│
└── styles/
    └── globals.css
```

### 4.2 Jerarquía de Carpetas

```
MODULE (módulo de negocio)
└── DOMAIN (área funcional)
    └── FEATURE (funcionalidad específica)
        ├── domain/          # Reglas de negocio
        ├── application/     # Casos de uso y estado
        ├── infrastructure/  # Implementaciones externas
        └── presentation/    # UI
```

### 4.3 Organización de Imports

```typescript
// 1. Librerías externas
import React from 'react';
import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';

// 2. Módulos internos (por capa, de interno a externo)
import { CartItem } from '../domain/entities/CartItem';
import { addToCartUseCase } from '../application/use-cases/AddToCart';
import { cartRepository } from '../infrastructure/repositories/CartRepository';

// 3. Shared
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

// 4. Types
import type { Cart } from '../domain/types/cart.types';
```

---

## 5. Estándares de Componentes

### 5.1 Estrategia de Componentes

| Prioridad | Acción |
|-----------|--------|
| **1. Si no existe** | Preguntar al usuario: [1] Usar shadcn directamente, [2] Crear para componente |
| **3. Shadcn fallback** | Solo usar registro MCP Shadcn si el usuario elige opción [1] |

> **Beneficio:** 90% menos bugs usando componentes existentes vs creación manual.

### 5.2 Estructura de Componentes

```typescript
interface ComponentProps {
  // Required props
  children: React.ReactNode;
  // Optional props with defaults
  className?: string;
  variant?: 'default' | 'secondary';
  'data-testid'?: string;
}

export const Component = memo<ComponentProps>(({
  children,
  className,
  variant = 'default',
  'data-testid': testId = 'component'
}) => {
  return (
    <div 
      className={cn(baseStyles, variantStyles[variant], className)} 
      data-testid={testId}
    >
      {children}
    </div>
  );
});

Component.displayName = 'Component';
```

### 5.3 Convenciones de Nombrado

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes | PascalCase | `OrderCard.tsx` |
| Archivos | kebab-case | `order-card.tsx` |
| data-testid | kebab-case | `data-testid="order-card"` |
| Props/funciones | camelCase | `onSubmit`, `isLoading` |
| Constantes | SCREAMING_SNAKE | `MAX_ITEMS` |

### 5.4 Guidelines de Props

- Siempre definir interfaces TypeScript para props
- Usar props opcionales con defaults sensatos
- Incluir `className` para overrides de estilos
- Agregar `data-testid` para testing
- Documentar props complejas con JSDoc

---

## 6. Patrones de Estado

### 6.1 Estructura de Zustand Store

```typescript
// modules/sales/quotes/cart/application/store/cart.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CartItem } from '../../domain/entities/CartItem';
import { addToCartUseCase } from '../use-cases/AddToCart';
import { removeFromCartUseCase } from '../use-cases/RemoveFromCart';

interface CartState {
  // Domain entities
  items: CartItem[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Actions (delegan a use cases)
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  clearError: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      // Initial state
      items: [],
      loading: false,
      error: null,
      
      // Actions
      addItem: async (productId, quantity) => {
        set({ loading: true, error: null });
        try {
          const newItem = await addToCartUseCase.execute({ productId, quantity });
          set((state) => ({ 
            items: [...state.items, newItem], 
            loading: false 
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },
      
      removeItem: async (itemId) => {
        set({ loading: true, error: null });
        try {
          await removeFromCartUseCase.execute(itemId);
          set((state) => ({
            items: state.items.filter(item => item.id !== itemId),
            loading: false
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },
      
      clearCart: () => set({ items: [] }),
      clearError: () => set({ error: null }),
    }),
    { name: 'cartStore' }
  )
);
```

### 6.2 Cuándo Usar Cada Tipo de Estado

| Tipo | Cuándo Usar | Herramienta |
|------|-------------|-------------|
| **Server State** | Datos del API, cache | TanStack Query |
| **Global Client State** | Auth, theme, cart | Zustand |
| **Local Component State** | Forms, UI toggles | useState/useReducer |
| **URL State** | Filtros, paginación | TanStack Router search params |

### 6.3 Integración con TanStack Query

```typescript
// modules/sales/quotes/products/infrastructure/api/products.api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productRepository } from '../repositories/ProductRepository';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productRepository.getAll(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productRepository.getById(id),
    enabled: !!id,
  });
}
```

---

## 7. Estándares de Testing

### 7.1 Estrategia de Testing

| Tipo | Cobertura | Herramienta | Qué Testear |
|------|-----------|-------------|-------------|
| **Unit** | Alta | Vitest | Entities, use cases, utilities |
| **Integration** | Media | Vitest + MSW | Feature workflows, API integration |
| **Component** | Media | React Testing Library | User interactions, accessibility |
| **E2E** | Baja | Playwright | Critical user journeys |

### 7.2 Estructura de Tests

```typescript
// modules/sales/quotes/cart/application/use-cases/__tests__/AddToCart.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToCartUseCase } from '../AddToCart';
import { mockCartRepository } from '../../__mocks__/cartRepository.mock';

describe('AddToCart UseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add item to cart successfully', async () => {
    const input = { productId: 'prod-1', quantity: 2 };
    
    const result = await addToCartUseCase.execute(input);
    
    expect(result).toMatchObject({
      productId: 'prod-1',
      quantity: 2,
    });
    expect(mockCartRepository.save).toHaveBeenCalledWith(expect.objectContaining(input));
  });

  it('should throw error when quantity is invalid', async () => {
    const input = { productId: 'prod-1', quantity: -1 };
    
    await expect(addToCartUseCase.execute(input)).rejects.toThrow(
      'La cantidad debe ser mayor a 0'
    );
  });
});
```

### 7.3 Component Testing

```typescript
// modules/sales/quotes/cart/presentation/components/__tests__/CartItem.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { CartItem } from '../CartItem';

describe('CartItem', () => {
  const defaultProps = {
    item: { id: '1', name: 'Producto Test', quantity: 2, price: 100 },
    onRemove: vi.fn(),
  };

  it('should render correctly with default props', () => {
    render(<CartItem {...defaultProps} />);
    
    expect(screen.getByTestId('cart-item')).toBeInTheDocument();
    expect(screen.getByText('Producto Test')).toBeInTheDocument();
  });

  it('should handle remove action', async () => {
    const user = userEvent.setup();
    render(<CartItem {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    
    expect(defaultProps.onRemove).toHaveBeenCalledWith('1');
  });

  it('should be accessible', async () => {
    const { container } = render(<CartItem {...defaultProps} />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
});
```

---

## 8. Accesibilidad

### 8.1 Cumplimiento WCAG 2.1 AA

| Requisito | Implementación |
|-----------|----------------|
| Elementos semánticos | Usar HTML semántico (`<nav>`, `<main>`, `<article>`) |
| Jerarquía de headings | Un solo `<h1>`, headings en orden descendente |
| Navegación por teclado | Todos los elementos interactivos accesibles con Tab |
| Screen readers | Labels descriptivos, roles ARIA cuando necesario |
| Contraste de color | Mínimo 4.5:1 para texto normal |

### 8.2 Implementación ARIA

```typescript
// ✅ Correcto - HTML semántico primero
<button onClick={handleSubmit}>Guardar</button>

// ✅ Correcto - ARIA cuando es necesario
<div 
  role="tabpanel" 
  aria-labelledby="tab-1"
  aria-expanded={isOpen}
>
  {content}
</div>

// ❌ Incorrecto - ARIA innecesario
<button role="button" aria-label="button">Guardar</button>
```

---

## 9. Rendimiento

### 9.1 Optimización de Bundle

| Estrategia | Implementación |
|------------|----------------|
| Code splitting | Por ruta (automático con TanStack Router) |
| Lazy loading | `React.lazy()` para componentes no críticos |
| Tree shaking | Imports específicos, no barrel exports en shared |
| Bundle budget | Máximo 500KB total |

### 9.2 Rendimiento en Runtime

```typescript
// ✅ React.memo para componentes costosos
export const ExpensiveList = memo<ListProps>(({ items }) => {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});

// ✅ useMemo para cálculos costosos
const sortedItems = useMemo(() => 
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// ✅ useCallback para handlers pasados a children
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

### 9.3 Loading Performance

- Optimización de imágenes y lazy loading
- Skeleton screens para estados de carga
- Prefetch de recursos críticos
- Virtual scrolling para listas grandes

---

## 10. Seguridad

### 10.1 Seguridad Client-Side

| Riesgo | Mitigación |
|--------|------------|
| API keys expuestas | Nunca en código frontend, usar variables de entorno server-side |
| XSS | Sanitización de inputs, no usar `dangerouslySetInnerHTML` |
| Datos sensibles | No almacenar en localStorage sin encriptar |

### 10.2 Autenticación

```typescript
// Manejo seguro de tokens
const useAuthStore = create<AuthState>((set) => ({
  token: null,
  
  setToken: (token: string) => {
    // Almacenar en memoria, no localStorage
    set({ token });
  },
  
  logout: () => {
    set({ token: null });
    // Limpiar cualquier dato sensible
  },
}));
```

---

## 11. Manejo de Errores

### 11.1 Error Boundaries por Feature

```typescript
// shared/components/feedback/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado:', error, errorInfo);
    // Enviar a servicio de logging
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">
            Algo salió mal
          </h2>
          <p className="text-gray-600">
            Por favor, intenta recargar la página
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 11.2 Manejo de Errores en API

```typescript
// shared/lib/api-client.ts
import axios, { AxiosError } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    const message = error.response?.data?.message || 'Error de conexión';
    
    // Mensaje amigable para el usuario
    return Promise.reject(new Error(message));
  }
);
```

---

## 12. Progressive Web App

### 12.1 Features PWA

| Feature | Implementación |
|---------|----------------|
| Service Worker | Caching y soporte offline |
| Web App Manifest | Instalabilidad |
| Push Notifications | Cuando sea necesario |
| Background Sync | Sincronización al restaurar conexión |

### 12.2 Estrategia Offline

| Tipo de Recurso | Estrategia |
|-----------------|------------|
| Assets estáticos | Cache-first |
| Datos dinámicos | Network-first con fallback |
| Páginas offline | Fallback pre-cacheado |
| Formularios | Queue y sync cuando online |

---

## 13. Estándares de Idioma

### 13.1 Español para Todo Contenido Visible al Usuario

**REGLA CRÍTICA: Todo texto visible al usuario final DEBE estar en español.**

#### ✅ Español Requerido

- Labels de UI, botones, formularios, mensajes, notificaciones
- Respuestas de API, errores de validación, templates de email
- Cualquier texto que el usuario vea (frontend o backend)

#### ✅ Inglés Requerido

- Código (variables, funciones, clases)
- Logs técnicos, comentarios, commits de git
- Documentación técnica para desarrolladores

#### ❌ Nunca Mezclar Idiomas en Texto Visible

```typescript
// ✅ CORRECTO
<Button>Guardar</Button>
toast.success("Datos guardados correctamente");
throw new BadRequestException('No se pudo crear el usuario');

// ❌ INCORRECTO
<Button>Save cambios</Button>
toast.error("Failed al guardar");
throw new BadRequestException('Invalid datos proporcionados');
```

### 13.2 Implementación

```typescript
// shared/constants/messages.ts
export const MESSAGES = {
  SUCCESS: {
    SAVED: 'Datos guardados correctamente',
    DELETED: 'Elemento eliminado correctamente',
    UPDATED: 'Información actualizada',
  },
  ERROR: {
    GENERIC: 'Ha ocurrido un error. Por favor, intenta de nuevo',
    NOT_FOUND: 'El recurso solicitado no fue encontrado',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
    VALIDATION: 'Por favor, verifica los datos ingresados',
  },
  LOADING: {
    DEFAULT: 'Cargando...',
    SAVING: 'Guardando...',
    PROCESSING: 'Procesando...',
  },
} as const;
```

---

## 14. Consideraciones Generales

### 14.1 Gestor de Paquetes

**Regla:** Usar `pnpm` como gestor de paquetes por defecto, pero respetar el gestor existente en proyectos ya iniciados.

| Escenario | Acción | Razón |
|-----------|--------|-------|
| Proyecto nuevo | Usar `pnpm` | Mejor rendimiento y manejo de dependencias |
| Proyecto con `package-lock.json` | Continuar con `npm` | Evitar conflictos de lockfiles |
| Proyecto con `yarn.lock` | Continuar con `yarn` | Evitar conflictos de lockfiles |
| Proyecto con `pnpm-lock.yaml` | Continuar con `pnpm` | Ya está configurado |

#### Cómo Identificar el Gestor Actual

```bash
ls -la | grep -E "package-lock|yarn.lock|pnpm-lock"
```

| Archivo encontrado | Gestor a usar |
|--------------------|---------------|
| `package-lock.json` | `npm` |
| `yarn.lock` | `yarn` |
| `pnpm-lock.yaml` | `pnpm` |
| Ninguno | `pnpm` (proyecto nuevo) |

#### Comandos Equivalentes

| Acción | pnpm | npm | yarn |
|--------|------|-----|------|
| Instalar | `pnpm install` | `npm install` | `yarn` |
| Agregar dep | `pnpm add <pkg>` | `npm install <pkg>` | `yarn add <pkg>` |
| Agregar dev | `pnpm add -D <pkg>` | `npm install -D <pkg>` | `yarn add -D <pkg>` |
| Ejecutar script | `pnpm <script>` | `npm run <script>` | `yarn <script>` |
| Remover | `pnpm remove <pkg>` | `npm uninstall <pkg>` | `yarn remove <pkg>` |

> **⚠️ Importante:** Nunca mezclar gestores de paquetes en un mismo proyecto.

---

## 15. Configuración Base

### 15.1 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    // TanStack Router DEBE ir primero
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      routeFileIgnorePrefix: '-',
    }),
    react(),
    viteTsConfigPaths(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@modules': '/src/modules',
      '@shared': '/src/shared',
      '@app': '/src/app',
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
```

### 15.2 `src/router.tsx`

```typescript
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { routeTree } from './routeTree.gen';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4">Página no encontrada</p>
      </div>
    </div>
  );
}

function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-4">{error.message}</p>
      </div>
    </div>
  );
}

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: ErrorPage,
  });

  return routerWithQueryClient(router, queryClient);
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

### 15.3 `src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { createRouter } from './router';
import './globals.css';

const router = createRouter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

### 15.4 `src/routes/__root.tsx`

```typescript
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
```

### 15.5 `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), viteTsConfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/routeTree.gen.ts',
      ],
    },
  },
});
```

---

## 16. Checklist de Implementación

### Configuración Inicial

- [ ] Instalar dependencias: `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/react-query`
- [ ] Crear `vite.config.ts` con TanStackRouterVite plugin (PRIMERO)
- [ ] Crear `src/router.tsx` con configuración del router
- [ ] Crear `src/main.tsx` con RouterProvider
- [ ] Crear `src/routes/__root.tsx`
- [ ] Configurar path aliases en `tsconfig.json`
- [ ] Agregar `routeTree.gen.ts` a `.prettierignore` y `.eslintignore`
- [ ] Configurar Vitest

### Estructura de Rutas

- [ ] Crear layouts pathless (`_auth.tsx`, `_app.tsx`)
- [ ] Implementar guards de autenticación en `beforeLoad`
- [ ] Usar `$param` para rutas dinámicas
- [ ] Usar `-` para carpetas de colocación
- [ ] Verificar que las URLs sean correctas

### Arquitectura

- [ ] Organizar módulos siguiendo Module/Domain/Feature
- [ ] Implementar capas de Clean Architecture por feature
- [ ] Configurar stores Zustand por feature
- [ ] Configurar TanStack Query para server state
- [ ] Crear barrel exports (`index.ts`) por feature

### Calidad

- [ ] Configurar Vitest con coverage
- [ ] Agregar tests unitarios para use cases
- [ ] Agregar tests de componentes
- [ ] Verificar accesibilidad (axe)
- [ ] Validar textos en español

---

## Referencias

- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
