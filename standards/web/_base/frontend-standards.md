---
title: Frontend Development Standards
platform: web
load_when: "Any web UI implementation — components, hooks, forms, state, testing."
updated: 2026-06
---

# Frontend Development Standards

## Summary

This document defines the frontend development standards for enterprise applications using **Vite** as the bundler, **TanStack Router** for type-safe routing, **Zustand** for global state, and **Clean Architecture** with a modular structure ready for microfrontends.

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Technology Stack](#2-technology-stack)
3. [Routing Conventions](#3-routing-conventions)
4. [File Organization](#4-file-organization)
5. [Component Standards](#5-component-standards)
6. [State Patterns](#6-state-patterns)
7. [Testing Standards](#7-testing-standards)
8. [Accessibility](#8-accessibility)
9. [Performance](#9-performance)
10. [Security](#10-security)
11. [Error Handling](#11-error-handling)
12. [Progressive Web App](#12-progressive-web-app)
13. [Language Standards](#13-language-standards)
14. [General Considerations](#14-general-considerations)
15. [Base Configuration](#15-base-configuration)
16. [Implementation Checklist](#16-implementation-checklist)

---

## 1. Architecture Principles

### 1.1 Clean Architecture Implementation

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

| Layer | Responsibility | Contents |
|------|-----------------|-----------|
| **Domain** | Pure business rules | Entities, value objects, repository interfaces |
| **Application** | Use case orchestration | Use cases, hooks, Zustand stores |
| **Infrastructure** | External implementations | API clients, concrete repositories, adapters |
| **Presentation** | User interface | React components, pages, styles |

### 1.2 Dependency Rules

- Inner layers **must NOT know about** outer layers
- Dependencies point inward (from outer to inner)
- Use dependency inversion for external concerns
- The domain layer imports nothing from other layers

---

## 2. Technology Stack

### 2.1 Core Technologies

| Category | Technology | Version | Notes |
|-----------|------------|---------|-------|
| **Bundler** | Vite | 7+ | Build tool and dev server |
| **Framework** | React | 19+ | Functional components and hooks |
| **Router** | TanStack Router | 1+ | File-based routing with type-safety |
| **Language** | TypeScript | 5+ | Strict mode, no `any` |
| **Styling** | TailwindCSS | 4+ | Utility-first CSS |
| **Components** | shadcn/ui + Radix UI | - | Component foundation |
| **State** | Zustand | 5+ | Global state per feature |
| **Data Fetching** | TanStack Query | 5+ | Cache and synchronization |

### 2.2 Framework Selection Rules

The frontend stack is the same across every track; what changes is **composition**. Pick the track by need — see [`frontend-architecture.md`](frontend-architecture.md) for the full decision tree (this document does not redefine it).

| Scenario | Choice | Reason |
|---|---|---|
| **SPA** | Vite + TanStack Router | Best DX, type-safety, single deployable for one cohesive app |<!-- when:web=spa -->
| **Microfrontends — homogeneous React** | Module Federation 2.0 (`@module-federation/enhanced`) | 2026 de-facto standard: singleton sharing, end-to-end typing, license-gated runtime composition |<!-- when:web=mf -->
| **Microfrontends — mixed frameworks / hard isolation** | Single-SPA | Framework-agnostic orchestration, isolated lifecycle (bootstrap/mount/unmount), CSS isolation |<!-- when:web=single-spa -->
| **Both** | Single-SPA + Module Federation | Single-SPA orchestrates apps; Module Federation shares code between them |<!-- when:web=single-spa --><!-- when:web=mf -->

<!-- when:web=mf,single-spa -->
### 2.3 Microfrontends

<!-- when:web=mf -->
This platform uses **Module Federation 2.0** (`@module-federation/enhanced`, + `@module-federation/vite`) — homogeneous React, a single shell with products as router layouts and capabilities as remote MFEs, and license-gated runtime composition.
<!-- /when -->
<!-- when:web=single-spa -->
This platform uses **Single-SPA** (`vite-plugin-single-spa` + `single-spa-react`) — a framework-agnostic orchestrator with isolated per-module lifecycle (bootstrap/mount/unmount) and CSS isolation.
<!-- /when -->

See [`frontend-architecture.md`](frontend-architecture.md) for the web-architecture decision and its backend implications.
<!-- /when -->

### 2.4 Development Tools

| Tool | Purpose |
|-------------|-----------|
| **Vite** | Build system and dev server |
| **Vitest** | Unit and integration testing |
| **React Testing Library** | Component testing |
| **MSW** | API mocking for tests |
| **ESLint + Prettier** | Code quality and formatting |
| **TypeScript** | Type checking |

---

## 3. Routing Conventions

TanStack Router uses special prefixes in file names to define behaviors.

### 3.1 `_` (Underscore) Prefix - Pathless Layout Routes

**Purpose:** Group routes under a shared layout **WITHOUT adding segments to the URL**.

#### ❌ The Problem (without `_`)

```
routes/
├── __root.tsx
├── auth/
│   └── login.tsx          → URL: /auth/login ❌
├── app/
│   ├── dashboard.tsx      → URL: /app/dashboard ❌
│   └── orders.tsx         → URL: /app/orders ❌
```

**Result:** URLs include the folder name, which is undesirable.

#### ✅ The Solution (with `_`)

```
routes/
├── __root.tsx
├── _auth.tsx              → Adds NOTHING to the URL (layout only)
├── _auth/
│   └── login.tsx          → URL: /login ✅
│
├── _app.tsx               → Adds NOTHING to the URL (layout only)
├── _app/
│   ├── dashboard.tsx      → URL: /dashboard ✅
│   └── orders.tsx         → URL: /orders ✅
```

#### Implementation Example

```typescript
// routes/_app.tsx - Protected layout
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

### 3.2 `.` (Dot) Prefix - Flat Routing

**Purpose:** Define nested routes **without creating folders**.

```
routes/
├── orders.tsx              → /orders (layout)
├── orders.index.tsx        → /orders
├── orders.$orderId.tsx     → /orders/:orderId
├── orders.$orderId.edit.tsx → /orders/:orderId/edit
```

#### When to use `.` vs Folders?

| Scenario | Recommendation |
|-----------|---------------|
| Few nested routes (2-3) | Flat with `.` |
| Many nested routes (4+) | Folders |
| Routes with colocated components | Folders with `-components/` |

### 3.3 `-` (Hyphen) Prefix - Ignore Files

**Purpose:** Exclude files/folders from route generation for code colocation.

```
routes/
├── orders/
│   ├── $orderId.tsx             → /orders/:orderId ✅
│   ├── -components/             → ❌ Ignored by the router
│   │   └── OrderHeader.tsx
│   └── -hooks/                  → ❌ Ignored by the router
│       └── useOrderCalculations.ts
```

### 3.4 `$` (Dollar) Prefix - Dynamic Parameters

```typescript
// routes/_app/orders/$orderId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/orders/$orderId')({
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams(); // Automatically typed
  return <div>Order: {orderId}</div>;
}
```

### 3.5 Prefix Summary

| Prefix | Name | Effect on URL | Primary Use |
|---------|--------|---------------|---------------|
| `_` | Pathless | **Does not appear** | Layouts without a path |
| `.` | Flat | Creates nesting | Avoid folders |
| `-` | Ignore | **Generates no route** | Code colocation |
| `$` | Dynamic | Captures value | URL parameters |
| `__` | Root | Root of the tree | Only `__root.tsx` |

---

## 4. File Organization

### 4.1 Enterprise Structure (Module/Domain/Feature)

```
src/
├── main.tsx                        # React entry point
├── router.tsx                      # TanStack Router config
├── routeTree.gen.ts                # Auto-generated (DO NOT EDIT)
├── globals.css                     # Global styles + Tailwind
│
├── routes/                         # 🛣️ Route definitions ONLY
│   ├── __root.tsx                  # Root layout (providers)
│   ├── index.tsx                   # Initial redirect
│   ├── _auth.tsx                   # Public layout
│   ├── _auth/
│   │   └── login.tsx
│   ├── _app.tsx                    # Protected layout
│   └── _app/
│       ├── dashboard.tsx
│       ├── sales/
│       │   ├── quotes.tsx
│       │   └── invoices.tsx
│       └── inventory/
│           └── products.tsx
│
├── modules/                        # 🏢 Business logic per module
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
├── shared/                         # 🔄 Reusable code
│   ├── components/
│   │   └── ui/                     # shadcn/ui
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts                # cn(), formatters
│   │   ├── api-client.ts           # Axios/fetch config
│   │   └── env.ts                  # Typed environment variables
│   ├── types/
│   │   └── common.types.ts
│   └── constants/
│
├── app/                            # 🎯 Global configuration
│   ├── store/                      # Global store (if needed)
│   ├── providers/                  # Context providers
│   │   ├── ThemeProvider.tsx
│   │   └── QueryProvider.tsx
│   └── config/
│
├── infrastructure/                 # 🔌 Global external services
│   ├── api/                        # API configuration
│   ├── storage/                    # IndexedDB, localStorage
│   └── pwa/                        # PWA configuration
│
├── assets/                         # 📁 Static resources
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

### 4.2 Folder Hierarchy

```
MODULE (business module)
└── DOMAIN (functional area)
    └── FEATURE (specific functionality)
        ├── domain/          # Business rules
        ├── application/     # Use cases and state
        ├── infrastructure/  # External implementations
        └── presentation/    # UI
```

### 4.3 Import Organization

```typescript
// 1. External libraries
import React from 'react';
import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules (by layer, from inner to outer)
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

## 5. Component Standards

### 5.1 Component Strategy

| Priority | Action |
|-----------|--------|
| **1. If it doesn't exist** | Ask the user: [1] Use shadcn directly, [2] Create the component |
| **3. Shadcn fallback** | Only use the Shadcn MCP registry if the user chooses option [1] |

> **Benefit:** 90% fewer bugs by using existing components vs. building them manually.

### 5.2 Component Structure

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

### 5.3 Naming Conventions

| Element | Convention | Example |
|----------|------------|---------|
| Components | PascalCase | `OrderCard.tsx` |
| Files | kebab-case | `order-card.tsx` |
| data-testid | kebab-case | `data-testid="order-card"` |
| Props/functions | camelCase | `onSubmit`, `isLoading` |
| Constants | SCREAMING_SNAKE | `MAX_ITEMS` |

### 5.4 Props Guidelines

- Always define TypeScript interfaces for props
- Use optional props with sensible defaults
- Include `className` for style overrides
- Add `data-testid` for testing
- Document complex props with JSDoc

---

## 6. State Patterns

### 6.1 Zustand Store Structure

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
  
  // Actions (delegate to use cases)
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

### 6.2 When to Use Each State Type

| Type | When to Use | Tool |
|------|-------------|-------------|
| **Server State** | API data, cache | TanStack Query |
| **Global Client State** | Auth, theme, cart | Zustand |
| **Local Component State** | Forms, UI toggles | useState/useReducer |
| **URL State** | Filters, pagination | TanStack Router search params |

### 6.3 TanStack Query Integration

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

## 7. Testing Standards

### 7.1 Testing Strategy

| Type | Coverage | Tool | What to Test |
|------|-----------|-------------|-------------|
| **Unit** | High | Vitest | Entities, use cases, utilities |
| **Integration** | Medium | Vitest + MSW | Feature workflows, API integration |
| **Component** | Medium | React Testing Library | User interactions, accessibility |
| **E2E** | Low | Playwright | Critical user journeys |

### 7.2 Test Structure

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
      'Quantity must be greater than 0'
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
    item: { id: '1', name: 'Test Product', quantity: 2, price: 100 },
    onRemove: vi.fn(),
  };

  it('should render correctly with default props', () => {
    render(<CartItem {...defaultProps} />);
    
    expect(screen.getByTestId('cart-item')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should handle remove action', async () => {
    const user = userEvent.setup();
    render(<CartItem {...defaultProps} />);
    
    await user.click(screen.getByRole('button', { name: /remove/i }));
    
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

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-----------|----------------|
| Semantic elements | Use semantic HTML (`<nav>`, `<main>`, `<article>`) |
| Heading hierarchy | A single `<h1>`, headings in descending order |
| Keyboard navigation | All interactive elements reachable with Tab |
| Screen readers | Descriptive labels, ARIA roles when necessary |
| Color contrast | Minimum 4.5:1 for normal text |

### 8.2 ARIA Implementation

```typescript
// ✅ Correct - semantic HTML first
<button onClick={handleSubmit}>Save</button>

// ✅ Correct - ARIA when necessary
<div 
  role="tabpanel" 
  aria-labelledby="tab-1"
  aria-expanded={isOpen}
>
  {content}
</div>

// ❌ Incorrect - unnecessary ARIA
<button role="button" aria-label="button">Save</button>
```

---

## 9. Performance

### 9.1 Bundle Optimization

| Strategy | Implementation |
|------------|----------------|
| Code splitting | By route (automatic with TanStack Router) |
| Lazy loading | `React.lazy()` for non-critical components |
| Tree shaking | Specific imports, no barrel exports in shared |
| Bundle budget | 500KB total maximum |

### 9.2 Runtime Performance

```typescript
// ✅ React.memo for expensive components
export const ExpensiveList = memo<ListProps>(({ items }) => {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});

// ✅ useMemo for expensive computations
const sortedItems = useMemo(() => 
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// ✅ useCallback for handlers passed to children
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

### 9.3 Loading Performance

- Image optimization and lazy loading
- Skeleton screens for loading states
- Prefetch critical resources
- Virtual scrolling for large lists

---

## 10. Security

### 10.1 Client-Side Security

| Risk | Mitigation |
|--------|------------|
| Exposed API keys | Never in frontend code; use server-side environment variables |
| XSS | Input sanitization, do not use `dangerouslySetInnerHTML` |
| Sensitive data | Do not store in localStorage without encryption |

### 10.2 Authentication

```typescript
// Secure token handling
const useAuthStore = create<AuthState>((set) => ({
  token: null,
  
  setToken: (token: string) => {
    // Store in memory, not localStorage
    set({ token });
  },
  
  logout: () => {
    set({ token: null });
    // Clear any sensitive data
  },
}));
```

---

## 11. Error Handling

### 11.1 Error Boundaries per Feature

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
    console.error('Error captured:', error, errorInfo);
    // Send to logging service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <p className="text-gray-600">
            Please reload the page
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 11.2 API Error Handling

```typescript
// shared/lib/api-client.ts
import axios, { AxiosError } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    const message = error.response?.data?.message || 'Connection error';
    
    // User-friendly message
    return Promise.reject(new Error(message));
  }
);
```

---

## 12. Progressive Web App

### 12.1 PWA Features

| Feature | Implementation |
|---------|----------------|
| Service Worker | Caching and offline support |
| Web App Manifest | Installability |
| Push Notifications | When necessary |
| Background Sync | Synchronization when the connection is restored |

### 12.2 Offline Strategy

| Resource Type | Strategy |
|-----------------|------------|
| Static assets | Cache-first |
| Dynamic data | Network-first with fallback |
| Offline pages | Pre-cached fallback |
| Forms | Queue and sync when online |

---

## 13. Language Standards

### 13.1 User-facing text follows the product locale

User-facing text (labels, buttons, messages, validation errors, emails, notifications) must **not be hardcoded** in components. Route it through the internationalization (i18n) layer so the rendered language is the product's configured locale — a configuration choice, never a value baked into code. Application code, identifiers, comments, commits, logs, and documentation are **always English**.

> Example snippets in these standards use English strings for readability. In a real project every user-facing string comes from the i18n catalog (message keys), so switching or adding a locale never touches component code.

#### ✅ Correct — strings come from the i18n layer; code in English
```typescript
<Button>{t('actions.save')}</Button>
toast.success(t('messages.saved'));
throw new BadRequestException(t('errors.userCreateFailed'));
```

#### ❌ Wrong — user-facing text hardcoded in a component
```typescript
<Button>Save changes</Button>          // not translatable; bypasses i18n
toast.error('Could not save');         // belongs in the message catalog
```

### 13.2 Message catalog (i18n)

Centralize user-facing strings as message keys resolved by the i18n layer for the active locale:

```typescript
// shared/i18n/messages.ts  — keys are English; values come from the active locale catalog
export const messageKeys = {
  actions: { save: 'actions.save', delete: 'actions.delete' },
  messages: { saved: 'messages.saved', deleted: 'messages.deleted' },
  errors: { generic: 'errors.generic', notFound: 'errors.notFound', unauthorized: 'errors.unauthorized' },
} as const;
```

---

## 14. General Considerations

### 14.1 Package Manager

**Rule:** Use `pnpm` as the default package manager, but respect the existing manager in already-started projects.

| Scenario | Action | Reason |
|-----------|--------|-------|
| New project | Use `pnpm` | Better performance and dependency handling |
| Project with `package-lock.json` | Continue with `npm` | Avoid lockfile conflicts |
| Project with `yarn.lock` | Continue with `yarn` | Avoid lockfile conflicts |
| Project with `pnpm-lock.yaml` | Continue with `pnpm` | Already configured |

#### How to Identify the Current Manager

```bash
ls -la | grep -E "package-lock|yarn.lock|pnpm-lock"
```

| File found | Manager to use |
|--------------------|---------------|
| `package-lock.json` | `npm` |
| `yarn.lock` | `yarn` |
| `pnpm-lock.yaml` | `pnpm` |
| None | `pnpm` (new project) |

#### Equivalent Commands

| Action | pnpm | npm | yarn |
|--------|------|-----|------|
| Install | `pnpm install` | `npm install` | `yarn` |
| Add dep | `pnpm add <pkg>` | `npm install <pkg>` | `yarn add <pkg>` |
| Add dev | `pnpm add -D <pkg>` | `npm install -D <pkg>` | `yarn add -D <pkg>` |
| Run script | `pnpm <script>` | `npm run <script>` | `yarn <script>` |
| Remove | `pnpm remove <pkg>` | `npm uninstall <pkg>` | `yarn remove <pkg>` |

> **⚠️ Important:** Never mix package managers within the same project.

---

## 15. Base Configuration

### 15.1 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    // TanStack Router MUST come first
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

See [`frontend-architecture.md`](frontend-architecture.md) and the chosen web-track standard for build configuration details.

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
        <p className="mt-4">Page not found</p>
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

## 16. Implementation Checklist

### Initial Setup

- [ ] Install dependencies: `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/react-query`
- [ ] Create `vite.config.ts` with the TanStackRouterVite plugin (FIRST)
- [ ] Create `src/router.tsx` with the router configuration
- [ ] Create `src/main.tsx` with RouterProvider
- [ ] Create `src/routes/__root.tsx`
- [ ] Configure path aliases in `tsconfig.json`
- [ ] Add `routeTree.gen.ts` to `.prettierignore` and `.eslintignore`
- [ ] Configure Vitest

### Route Structure

- [ ] Create pathless layouts (`_auth.tsx`, `_app.tsx`)
- [ ] Implement authentication guards in `beforeLoad`
- [ ] Use `$param` for dynamic routes
- [ ] Use `-` for colocation folders
- [ ] Verify that URLs are correct

### Architecture

- [ ] Organize modules following Module/Domain/Feature
- [ ] Implement Clean Architecture layers per feature
- [ ] Configure Zustand stores per feature
- [ ] Configure TanStack Query for server state
- [ ] Create barrel exports (`index.ts`) per feature

### Quality

- [ ] Configure Vitest with coverage
- [ ] Add unit tests for use cases
- [ ] Add component tests
- [ ] Verify accessibility (axe)
- [ ] Validate that user-facing text comes from the i18n catalog

---

## References

- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
