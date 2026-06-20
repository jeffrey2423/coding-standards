---
title: React Native Development Standards
platform: mobile
track: react-native
load_when: "Building a React Native app — Expo, Zustand, Expo Router, NativeWind."
updated: 2026-06
---

# Mobile React Native Development Standards

> **Note**: For shared architectural principles (Clean Architecture, DDD), refer to [`../../core/clean-architecture-ddd.md`](../../core/clean-architecture-ddd.md). For design system (colors, typography, UX), refer to [`../../web/_base/design-system-ux.md`](../../web/_base/design-system-ux.md). React Native shares the same core architecture philosophy as the web frontend standards in [`../../web/_base/frontend-standards.md`](../../web/_base/frontend-standards.md) — adapted for native mobile.

---

## Technology Stack

### Core Technologies

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| **Framework** | React Native | 0.77+ | New Architecture default (Fabric + TurboModules) |
| **Platform** | Expo | SDK 53+ | Managed workflow with EAS Build |
| **Language** | TypeScript | 5+ | Strict mode, no `any` |
| **Router** | Expo Router | 4+ | File-based, type-safe, deep-link ready |
| **State (client)** | Zustand | 5+ | Same as frontend standards |
| **State (server)** | TanStack Query | 5+ | Same as frontend standards |
| **Styling** | NativeWind | 4+ | TailwindCSS utility classes for RN |
| **Components** | `@rn-primitives` | Latest | Headless accessible RN primitives |
| **HTTP** | Axios | Latest | With interceptors |
| **Validation** | Zod | 3+ | Same as frontend standards |
| **Forms** | React Hook Form | 7+ | Same as frontend standards |
| **Storage** | MMKV | 3+ | Sync key-value, 10x faster than AsyncStorage |
| **Secure Storage** | `expo-secure-store` | Latest | Keychain / Keystore backed |
| **Testing** | Jest + RNTL | Latest | Unit, component, integration |

### Development Tools

| Tool | Purpose |
|------|---------|
| Expo CLI | Project management and dev server |
| EAS CLI | Cloud builds and OTA updates |
| Expo DevTools | Inspector and debugger |
| Flipper (optional) | Native debugging |
| ESLint + Prettier | Same config as frontend |
| `expo-doctor` | Dependency health checks |

---

## Architecture

### Style: Clean Architecture + DDD + Feature-First

Identical philosophy to the frontend and backend standards. Business logic drives every decision. Dependencies always point inward.

```
┌──────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                   │
│      Screens, native components, Expo Router          │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                    │
│      Use cases, Zustand stores, TanStack Query hooks  │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                  │
│      Repository implementations, APIs, MMKV           │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                       │
│      Entities, value objects, repository interfaces   │
└──────────────────────────────────────────────────────┘
```

### Folder Structure

```
├── app/                              # Expo Router file-based routing
│   ├── _layout.tsx                  # Root layout (providers)
│   ├── index.tsx                    # Entry redirect
│   ├── (auth)/                      # Public route group
│   │   ├── _layout.tsx
│   │   └── login.tsx                # /login
│   └── (app)/                       # Protected route group
│       ├── _layout.tsx              # Tab / stack navigator
│       ├── dashboard.tsx
│       ├── sales/
│       │   ├── quotes/
│       │   │   ├── index.tsx        # /sales/quotes
│       │   │   └── cart.tsx         # /sales/quotes/cart
│       │   └── invoices.tsx
│       └── inventory/
│           └── products.tsx
│
├── modules/                         # Business modules (DDD)
│   ├── sales/
│   │   ├── quotes/
│   │   │   ├── cart/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── cart-item.ts
│   │   │   │   │   ├── repositories/
│   │   │   │   │   │   └── i-cart-repository.ts
│   │   │   │   │   ├── value-objects/
│   │   │   │   │   │   └── quantity.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── cart.types.ts
│   │   │   │   ├── application/
│   │   │   │   │   ├── use-cases/
│   │   │   │   │   │   ├── add-to-cart.ts
│   │   │   │   │   │   └── remove-from-cart.ts
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-cart.ts
│   │   │   │   │   │   └── use-cart-mutations.ts
│   │   │   │   │   └── store/
│   │   │   │   │       └── cart.store.ts
│   │   │   │   ├── infrastructure/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   │   └── cart-repository.ts
│   │   │   │   │   ├── api/
│   │   │   │   │   │   └── cart.api.ts
│   │   │   │   │   └── storage/
│   │   │   │   │       └── cart-storage.ts
│   │   │   │   └── presentation/
│   │   │   │       ├── screens/
│   │   │   │       │   └── cart-screen.tsx
│   │   │   │       └── components/
│   │   │   │           ├── cart-list.tsx
│   │   │   │           └── cart-item.tsx
│   │   │   └── products/
│   │   └── billing/
│   ├── inventory/
│   └── users/
│
├── shared/
│   ├── components/                  # Reusable native components
│   │   ├── ui/                      # Primitive wrappers
│   │   │   ├── button.tsx
│   │   │   ├── text.tsx
│   │   │   └── text-input.tsx
│   │   ├── feedback/
│   │   │   ├── skeleton.tsx
│   │   │   └── error-view.tsx
│   │   └── layout/
│   │       ├── screen.tsx           # Safe-area aware screen wrapper
│   │       └── stack.tsx
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   └── use-app-state.ts
│   ├── lib/
│   │   ├── api-client.ts            # Axios instance
│   │   ├── storage.ts               # MMKV wrapper
│   │   └── env.ts                   # Typed env variables
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── types/
│   │   └── common.types.ts
│   └── constants/
│       └── messages.ts              # Spanish UI strings
│
├── infrastructure/
│   ├── api/
│   │   └── http-client.ts
│   └── storage/
│       ├── mmkv-client.ts
│       └── secure-storage.ts
│
├── assets/
│   ├── fonts/
│   │   ├── Inter_18pt-Light.ttf
│   │   ├── Inter_18pt-Regular.ttf
│   │   └── Inter_18pt-Bold.ttf
│   └── images/
│       └── logos/
│
├── __tests__/
│   └── modules/
│       └── sales/
├── jest.config.ts
├── app.config.ts                    # Expo dynamic config
├── tailwind.config.ts               # NativeWind config
└── tsconfig.json                    # Strict mode
```

### Expo Router Conventions

Expo Router follows the same prefix system as TanStack Router (used in the frontend standards):

| Prefix | Effect | Example |
|--------|--------|---------|
| `(group)` | Route group — no URL segment, shared layout | `(auth)/_layout.tsx` |
| `[param]` | Dynamic segment | `[orderId].tsx` → `/:orderId` |
| `[...rest]` | Catch-all | `[...unmatched].tsx` |
| `+not-found.tsx` | 404 screen | App-level not found |
| `_layout.tsx` | Nested layout for a directory | Stack, Tabs, Drawer |

---

## Domain Layer

### Entities

Entities are plain TypeScript objects. Use `readonly` everywhere.

```typescript
// modules/sales/quotes/cart/domain/entities/cart-item.ts
export interface CartItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

// Domain logic as pure functions — no classes required
export const getCartItemTotal = (item: CartItem): number =>
  item.quantity * item.unitPrice;

export const isCartItemValid = (item: CartItem): boolean =>
  item.quantity > 0 && item.unitPrice > 0;
```

### Value Objects

Value objects validate invariants at construction time. Use a `Result` discriminated union — never throw.

```typescript
// shared/types/result.types.ts
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export const ok  = <T>(data: T): Result<T>  => ({ success: true, data });
export const err = <E>(error: E): Result<never, E> => ({ success: false, error });
```

```typescript
// modules/sales/quotes/cart/domain/value-objects/quantity.ts
import { Result, ok, err } from '@/shared/types/result.types';

export type QuantityError = 'INVALID_QUANTITY';

export interface Quantity {
  readonly value: number;
}

export const createQuantity = (input: number): Result<Quantity, QuantityError> => {
  if (!Number.isInteger(input) || input < 1) {
    return err('INVALID_QUANTITY');
  }
  return ok({ value: input });
};
```

### Repository Interfaces

```typescript
// modules/sales/quotes/cart/domain/repositories/i-cart-repository.ts
import type { CartItem } from '../entities/cart-item';
import type { Result } from '@/shared/types/result.types';

export type CartFailure =
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'NOT_FOUND'; id: string }
  | { type: 'INVALID_QUANTITY' }
  | { type: 'CART_LIMIT_EXCEEDED'; maxItems: number };

export interface ICartRepository {
  getCartItems(): Promise<Result<CartItem[], CartFailure>>;
  addItem(productId: string, quantity: number): Promise<Result<CartItem, CartFailure>>;
  removeItem(itemId: string): Promise<Result<void, CartFailure>>;
  clearCart(): Promise<Result<void, CartFailure>>;
}
```

### Zod Schemas (Shared Domain + Infrastructure)

Define Zod schemas alongside the domain types. They serve as both validation and the single source of truth for external data shapes.

```typescript
// modules/sales/quotes/cart/domain/types/cart.types.ts
import { z } from 'zod';

export const CartItemSchema = z.object({
  id:          z.string().uuid(),
  productId:   z.string().uuid(),
  productName: z.string().min(1),
  quantity:    z.number().int().positive(),
  unitPrice:   z.number().positive(),
});

export type CartItemDto = z.infer<typeof CartItemSchema>;

export const CartResponseSchema = z.object({
  items: z.array(CartItemSchema),
  updatedAt: z.string().datetime(),
});
```

---

## Application Layer

### Use Cases

Each use case is a single function. One file per use case.

```typescript
// modules/sales/quotes/cart/application/use-cases/add-to-cart.ts
import type { ICartRepository, CartFailure } from '../../domain/repositories/i-cart-repository';
import { createQuantity } from '../../domain/value-objects/quantity';
import type { CartItem } from '../../domain/entities/cart-item';
import { err, type Result } from '@/shared/types/result.types';

export const addToCartUseCase = (repository: ICartRepository) =>
  async (
    productId: string,
    quantity: number,
  ): Promise<Result<CartItem, CartFailure>> => {
    const quantityResult = createQuantity(quantity);

    if (!quantityResult.success) {
      return err<CartFailure>({ type: 'INVALID_QUANTITY' });
    }

    return repository.addItem(productId, quantityResult.data.value);
  };
```

### Zustand Store

Same pattern as frontend standards. Stores delegate to use cases.

```typescript
// modules/sales/quotes/cart/application/store/cart.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CartItem } from '../../domain/entities/cart-item';
import { addToCartUseCase } from '../use-cases/add-to-cart';
import { removeFromCartUseCase } from '../use-cases/remove-from-cart';
import { cartRepository } from '../../infrastructure/repositories/cart-repository';
import { mapCartFailureToMessage } from '../mappers/cart-failure.mapper';

const addToCart    = addToCartUseCase(cartRepository);
const removeFromCart = removeFromCartUseCase(cartRepository);

interface CartState {
  items:   CartItem[];
  loading: boolean;
  error:   string | null;
  addItem:    (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set) => ({
      items:   [],
      loading: false,
      error:   null,

      addItem: async (productId, quantity) => {
        set({ loading: true, error: null });
        const result = await addToCart(productId, quantity);
        if (result.success) {
          set((s) => ({ items: [...s.items, result.data], loading: false }));
        } else {
          set({ error: mapCartFailureToMessage(result.error), loading: false });
        }
      },

      removeItem: async (itemId) => {
        set({ loading: true, error: null });
        const result = await removeFromCart(itemId);
        if (result.success) {
          set((s) => ({
            items: s.items.filter((i) => i.id !== itemId),
            loading: false,
          }));
        } else {
          set({ error: mapCartFailureToMessage(result.error), loading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'cartStore' },
  ),
);
```

### TanStack Query Hooks

Use TanStack Query for server state, Zustand for client/UI state.

```typescript
// modules/sales/quotes/cart/application/hooks/use-cart.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../infrastructure/api/cart.api';
import { CartItemSchema } from '../../domain/types/cart.types';
import { z } from 'zod';

export const cartKeys = {
  all:    ['cart'] as const,
  items:  () => [...cartKeys.all, 'items'] as const,
  item:   (id: string) => [...cartKeys.items(), id] as const,
};

export const useCartItems = () =>
  useQuery({
    queryKey: cartKeys.items(),
    queryFn: async () => {
      const data = await cartApi.getCartItems();
      return z.array(CartItemSchema).parse(data);
    },
    staleTime: 30_000,
  });

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.addItem(productId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.items() }),
  });
};
```

---

## Infrastructure Layer

### HTTP Client

```typescript
// infrastructure/api/http-client.ts
import axios, { AxiosError } from 'axios';
import { secureStorage } from '../storage/secure-storage';

export const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      await secureStorage.clearToken();
      // Emit an event or use an auth store to navigate to login
    }
    const message = error.response?.data?.message ?? 'Error de conexión';
    return Promise.reject(new Error(message));
  },
);
```

### Repository Implementation

```typescript
// modules/sales/quotes/cart/infrastructure/repositories/cart-repository.ts
import { cartApi } from '../api/cart.api';
import { cartStorage } from '../storage/cart-storage';
import type { ICartRepository, CartFailure } from '../../domain/repositories/i-cart-repository';
import type { CartItem } from '../../domain/entities/cart-item';
import { ok, err, type Result } from '@/shared/types/result.types';
import { CartItemSchema } from '../../domain/types/cart.types';
import { z } from 'zod';

export const cartRepository: ICartRepository = {
  async getCartItems(): Promise<Result<CartItem[], CartFailure>> {
    try {
      const cached = cartStorage.getAll();
      if (cached.length > 0) return ok(cached);

      const data = await cartApi.getCartItems();
      const items = z.array(CartItemSchema).parse(data);
      cartStorage.saveAll(items);
      return ok(items);
    } catch (e) {
      return err({ type: 'NETWORK_ERROR', message: (e as Error).message });
    }
  },

  async addItem(productId, quantity): Promise<Result<CartItem, CartFailure>> {
    try {
      const data = await cartApi.addItem(productId, quantity);
      const item = CartItemSchema.parse(data);
      cartStorage.saveItem(item);
      return ok(item);
    } catch (e) {
      return err({ type: 'NETWORK_ERROR', message: (e as Error).message });
    }
  },

  async removeItem(itemId): Promise<Result<void, CartFailure>> {
    try {
      await cartApi.removeItem(itemId);
      cartStorage.deleteItem(itemId);
      return ok(undefined);
    } catch (e) {
      return err({ type: 'NETWORK_ERROR', message: (e as Error).message });
    }
  },

  async clearCart(): Promise<Result<void, CartFailure>> {
    try {
      await cartApi.clearCart();
      cartStorage.clearAll();
      return ok(undefined);
    } catch (e) {
      return err({ type: 'NETWORK_ERROR', message: (e as Error).message });
    }
  },
};
```

### MMKV Storage Wrapper

```typescript
// infrastructure/storage/mmkv-client.ts
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'app-storage' });

export const mmkvStorage = {
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void  => storage.set(key, value),
  delete:    (key: string): void                  => storage.delete(key),
  contains:  (key: string): boolean               => storage.contains(key),

  getJson: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  setJson: <T>(key: string, value: T): void =>
    storage.set(key, JSON.stringify(value)),
};
```

### Secure Storage

```typescript
// infrastructure/storage/secure-storage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const secureStorage = {
  getToken: (): Promise<string | null> =>
    SecureStore.getItemAsync(TOKEN_KEY),

  setToken: (token: string): Promise<void> =>
    SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    }),

  clearToken: (): Promise<void> =>
    SecureStore.deleteItemAsync(TOKEN_KEY),
};
```

---

## Presentation Layer

### Screens

Screens are thin. They connect stores/hooks to components and handle navigation.

```typescript
// modules/sales/quotes/cart/presentation/screens/cart-screen.tsx
import React from 'react';
import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../application/store/cart.store';
import { CartItemComponent } from '../components/cart-item';
import { Screen } from '@/shared/components/layout/screen';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { Skeleton } from '@/shared/components/feedback/skeleton';
import { MESSAGES } from '@/shared/constants/messages';

export function CartScreen() {
  const router  = useRouter();
  const items   = useCartStore((s) => s.items);
  const loading = useCartStore((s) => s.loading);
  const error   = useCartStore((s) => s.error);
  const removeItem = useCartStore((s) => s.removeItem);

  if (loading) return <Skeleton rows={4} />;

  if (error) {
    return (
      <Screen>
        <Text className="text-red-500">{error}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItemComponent
            item={item}
            onRemove={() => removeItem(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text className="text-slate-500 text-center mt-8">
            {MESSAGES.CART.EMPTY}
          </Text>
        }
      />
      <Button
        onPress={() => router.push('/sales/checkout')}
        disabled={items.length === 0}
      >
        {MESSAGES.CART.CHECKOUT}
      </Button>
    </Screen>
  );
}
```

### Shared UI Primitives

Wrap native primitives with your design system. Never use raw `Text` or `TouchableOpacity` outside of `shared/components/ui/`.

```typescript
// shared/components/ui/text.tsx
import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'label' | 'caption';
}

const variantClassMap: Record<NonNullable<AppTextProps['variant']>, string> = {
  h1:        'text-4xl font-bold text-slate-900 dark:text-slate-50',
  h2:        'text-3xl font-bold text-slate-900 dark:text-slate-50',
  h3:        'text-2xl font-semibold text-slate-900 dark:text-slate-50',
  body:      'text-base font-normal text-slate-700 dark:text-slate-300',
  bodySmall: 'text-sm font-normal text-slate-700 dark:text-slate-300',
  label:     'text-sm font-medium text-slate-700 dark:text-slate-300',
  caption:   'text-xs font-light text-slate-500 dark:text-slate-400',
};

export function Text({
  variant = 'body',
  className,
  ...props
}: AppTextProps) {
  return (
    <RNText
      className={`${variantClassMap[variant]} ${className ?? ''}`}
      {...props}
    />
  );
}
```

```typescript
// shared/components/ui/button.tsx
import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { Text } from './text';

interface ButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: string;
}

const variantMap = {
  primary:   'bg-primary-500 active:bg-primary-600 rounded-lg px-4 py-3',
  secondary: 'bg-slate-200 dark:bg-slate-700 active:bg-slate-300 rounded-lg px-4 py-3',
  ghost:     'active:bg-slate-100 dark:active:bg-slate-800 rounded-lg px-4 py-3',
};

const textVariantMap = {
  primary:   'text-white font-semibold text-base',
  secondary: 'text-slate-900 dark:text-slate-100 font-medium text-sm',
  ghost:     'text-slate-700 dark:text-slate-300 font-normal text-base',
};

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  return (
    <Pressable
      className={`${variantMap[variant]} ${props.disabled ? 'opacity-50' : ''} ${className ?? ''}`}
      accessibilityRole="button"
      accessibilityLabel={children}
      {...props}
    >
      <Text className={textVariantMap[variant]}>{children}</Text>
    </Pressable>
  );
}
```

### Safe-Area Screen Wrapper

```typescript
// shared/components/layout/screen.tsx
import React from 'react';
import { type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
}

export function Screen({ children, className, ...props }: ScreenProps) {
  return (
    <SafeAreaView
      className={`flex-1 bg-white dark:bg-slate-950 px-4 ${className ?? ''}`}
      edges={['top', 'bottom']}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
```

---

## Navigation (Expo Router)

### Root Layout — Providers

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/theme/theme-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Light':   require('@/assets/fonts/Inter_18pt-Light.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Bold':    require('@/assets/fonts/Inter_18pt-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### Auth Guard Layout

```typescript
// app/(app)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '@/modules/users/authentication/login/application/store/auth.store';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard"  options={{ title: 'Inicio' }} />
      <Tabs.Screen name="sales"      options={{ title: 'Ventas' }} />
      <Tabs.Screen name="inventory"  options={{ title: 'Inventario' }} />
    </Tabs>
  );
}
```

---

## Design System

Mirrors the shared design tokens from `technical-preferences-ux.md`. NativeWind is configured once and consumed everywhere with className strings.

### NativeWind + Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './modules/**/*.{ts,tsx}', './shared/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff8ff',
          100: '#dbf0ff',
          200: '#bfe3ff',
          300: '#93d2ff',
          400: '#60b6ff',
          500: '#0E79FD', // Main brand color
          600: '#0b6ae6',
          700: '#0959c2',
          800: '#0e4a9e',
          900: '#123f80',
          950: '#11274d',
        },
        secondary: {
          50:  '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#b4b4b4',
          500: '#9a9a9a',
          600: '#818181',
          700: '#6a6a6a',
          800: '#5a5a5a',
          900: '#4e4e4e',
          950: '#000000', // Main secondary color
        },
        tertiary: {
          700: '#154ca9', // Main tertiary color
        },
      },
      fontFamily: {
        'inter-light':   ['Inter-Light'],
        'inter':         ['Inter-Regular'],
        'inter-bold':    ['Inter-Bold'],
      },
    },
  },
};

export default config;
```

### Color Constants (non-NativeWind contexts)

```typescript
// shared/theme/colors.ts
export const Colors = {
  primary500:   '#0E79FD',
  primary400:   '#60B6FF',
  tertiary700:  '#154CA9',
  secondary950: '#000000',

  backgroundLight: '#FFFFFF',
  surfaceLight:    '#F8FAFC',
  borderLight:     '#E2E8F0',

  backgroundDark:  '#020617',
  surfaceDark:     '#0F172A',
  borderDark:      '#334155',

  success: '#22C55E',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#06B6D4',
} as const;
```

---

## Testing Standards

### Strategy

| Type | Tool | Coverage Target | What to Test |
|------|------|-----------------|--------------|
| **Unit** | Jest | > 80% | Entities, value objects, use cases, stores |
| **Component** | React Native Testing Library | Medium | Key UI interactions and accessibility |
| **Integration** | Jest + MSW | Medium | Full feature flows with mocked API |
| **E2E** | Maestro | Low | Critical user journeys on device |

### Jest Config

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset:       'jest-expo',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'modules/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
};

export default config;
```

### Unit Test — Use Case

```typescript
// __tests__/modules/sales/quotes/cart/application/use-cases/add-to-cart.test.ts
import { addToCartUseCase } from '@/modules/sales/quotes/cart/application/use-cases/add-to-cart';
import type { ICartRepository } from '@/modules/sales/quotes/cart/domain/repositories/i-cart-repository';
import type { CartItem } from '@/modules/sales/quotes/cart/domain/entities/cart-item';

const mockItem: CartItem = {
  id: 'item-1',
  productId: 'prod-1',
  productName: 'Producto Test',
  quantity: 2,
  unitPrice: 50,
};

const mockRepository: ICartRepository = {
  getCartItems: jest.fn(),
  addItem:      jest.fn().mockResolvedValue({ success: true, data: mockItem }),
  removeItem:   jest.fn(),
  clearCart:    jest.fn(),
};

describe('addToCartUseCase', () => {
  const addToCart = addToCartUseCase(mockRepository);

  it('returns the added item when quantity is valid', async () => {
    const result = await addToCart('prod-1', 2);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(mockItem);
    expect(mockRepository.addItem).toHaveBeenCalledWith('prod-1', 2);
  });

  it('returns INVALID_QUANTITY failure when quantity is 0', async () => {
    const result = await addToCart('prod-1', 0);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.type).toBe('INVALID_QUANTITY');
    expect(mockRepository.addItem).not.toHaveBeenCalled();
  });

  it('returns INVALID_QUANTITY failure for negative values', async () => {
    const result = await addToCart('prod-1', -3);
    expect(result.success).toBe(false);
  });
});
```

### Component Test — React Native Testing Library

```typescript
// __tests__/modules/sales/quotes/cart/presentation/components/cart-item.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CartItemComponent } from '@/modules/sales/quotes/cart/presentation/components/cart-item';
import type { CartItem } from '@/modules/sales/quotes/cart/domain/entities/cart-item';

const mockItem: CartItem = {
  id: '1',
  productId: 'p1',
  productName: 'Producto Test',
  quantity: 2,
  unitPrice: 50,
};

describe('CartItemComponent', () => {
  it('renders product name and total price', () => {
    render(<CartItemComponent item={mockItem} onRemove={jest.fn()} />);
    expect(screen.getByText('Producto Test')).toBeTruthy();
    expect(screen.getByText('$100.00')).toBeTruthy();
  });

  it('calls onRemove with the item id when delete is pressed', () => {
    const onRemove = jest.fn();
    render(<CartItemComponent item={mockItem} onRemove={onRemove} />);
    fireEvent.press(screen.getByAccessibilityHint('Eliminar del carrito'));
    expect(onRemove).toHaveBeenCalledWith('1');
  });
});
```

---

## Error Handling

### Global Error Boundary

React Native does not support class `ErrorBoundary` for native crashes. Use `expo-error-reporter` and a React error boundary for JS errors.

```typescript
// shared/components/feedback/error-boundary.tsx
import React, { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/shared/components/ui/text';
import { Button } from '@/shared/components/ui/button';

interface Props   { children: ReactNode; }
interface State   { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log to Sentry / Crashlytics
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-6 bg-white dark:bg-slate-950">
          <Text variant="h3" className="text-center mb-2">Algo salió mal</Text>
          <Text variant="body" className="text-center text-slate-500 mb-6">
            Por favor, intenta recargar la aplicación.
          </Text>
          <Button onPress={() => this.setState({ hasError: false })}>
            Reintentar
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}
```

### User-Visible Error Messages

Map domain failures to Spanish strings in a dedicated mapper. Never expose raw error messages to the UI.

```typescript
// modules/sales/quotes/cart/application/mappers/cart-failure.mapper.ts
import type { CartFailure } from '../../domain/repositories/i-cart-repository';
import { MESSAGES } from '@/shared/constants/messages';

export const mapCartFailureToMessage = (failure: CartFailure): string => {
  switch (failure.type) {
    case 'INVALID_QUANTITY':
      return 'La cantidad debe ser mayor a cero';
    case 'NOT_FOUND':
      return `El artículo ${failure.id} no fue encontrado`;
    case 'CART_LIMIT_EXCEEDED':
      return `El carrito no puede tener más de ${failure.maxItems} artículos`;
    case 'NETWORK_ERROR':
      return MESSAGES.ERROR.GENERIC;
  }
};
```

---

## Security Standards

| Concern | Solution |
|---------|---------|
| Token storage | `expo-secure-store` (Keychain / AES Keystore) |
| General storage | `react-native-mmkv` (encrypted instance) |
| Certificate pinning | `react-native-ssl-pinning` or OkHttp config |
| Screenshot prevention | `expo-screen-capture` — `preventScreenCaptureAsync()` |
| Root / jailbreak detection | `jail-monkey` |
| API keys | `EXPO_PUBLIC_*` only for non-sensitive; sensitive secrets stay server-side |
| Obfuscation | ProGuard (Android) + Hermes bytecode |

---

## Performance Standards

| Strategy | Implementation |
|----------|---------------|
| List virtualization | Always `FlatList` or `FlashList` — never `ScrollView` with map |
| Image caching | `expo-image` (built-in disk + memory cache) |
| State granularity | Zustand selectors: `useStore((s) => s.specificField)` |
| Re-render audit | React DevTools Profiler + `why-did-you-render` in dev |
| Bundle size | `npx expo-optimize` + dynamic imports for heavy screens |
| JS thread | Offload heavy work with `react-native-worklets-core` or `expo-task-manager` |
| Startup | Defer non-critical logic after first frame with `InteractionManager.runAfterInteractions` |
| Hermes | Always enabled (default in Expo SDK 50+) |

---

## Localization

All user-visible text must be in Spanish. Code, logs, comments, and git commits stay in English — identical to the frontend and backend standards.

```typescript
// shared/constants/messages.ts
export const MESSAGES = {
  ERROR: {
    GENERIC:        'Ha ocurrido un error. Por favor, intenta de nuevo.',
    NOT_FOUND:      'El recurso solicitado no fue encontrado.',
    UNAUTHORIZED:   'No tienes permisos para realizar esta acción.',
    NETWORK:        'Sin conexión. Verifica tu red e intenta de nuevo.',
  },
  LOADING: {
    DEFAULT:   'Cargando...',
    SAVING:    'Guardando...',
    PROCESSING: 'Procesando...',
  },
  CART: {
    EMPTY:    'Tu carrito está vacío.',
    CHECKOUT: 'Finalizar compra',
    REMOVE:   'Eliminar del carrito',
    ADD:      'Agregar al carrito',
  },
  AUTH: {
    LOGIN:   'Iniciar sesión',
    LOGOUT:  'Cerrar sesión',
  },
} as const;
```

For multi-language support, use `i18next` + `react-i18next` with `.json` resource files organized by locale.

---

## Expo Configuration

```typescript
// app.config.ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name:   'YourApp',
  slug:   'your-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/logos/icon.png',
  userInterfaceStyle: 'automatic', // Supports dark mode
  splash: {
    image:           './assets/images/logos/splash.png',
    resizeMode:      'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yourcompany.yourapp',
    infoPlist: {
      NSCameraUsageDescription: 'Se usa para escanear códigos de barras.',
    },
  },
  android: {
    package:       'com.yourcompany.yourapp',
    adaptiveIcon: {
      foregroundImage: './assets/images/logos/adaptive-icon.png',
      backgroundColor: '#0E79FD',
    },
    permissions: ['CAMERA'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    ['expo-screen-orientation', { initialOrientation: 'PORTRAIT' }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: { projectId: 'your-eas-project-id' },
  },
};

export default config;
```

---

## package.json Reference

```json
{
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~4.0.0",
    "expo-font": "~12.0.0",
    "expo-splash-screen": "~0.27.0",
    "expo-secure-store": "~13.0.0",
    "expo-image": "~2.0.0",
    "expo-screen-capture": "~5.0.0",
    "react": "18.3.1",
    "react-native": "0.77.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-mmkv": "^3.1.0",
    "nativewind": "^4.1.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.62.0",
    "axios": "^1.7.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "~5.3.0",
    "eslint": "^8.57.0",
    "eslint-config-expo": "~8.0.0",
    "prettier": "^3.3.0",
    "jest": "^29.7.0",
    "jest-expo": "~53.0.0",
    "@testing-library/react-native": "^12.7.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## Implementation Checklist

### Project Setup
- [ ] `expo-doctor` passes with zero warnings
- [ ] TypeScript strict mode enabled in `tsconfig.json`
- [ ] NativeWind configured with `tailwind.config.ts` and brand colors matching `technical-preferences-ux.md`
- [ ] Inter font assets loaded in `app/_layout.tsx`
- [ ] `QueryClientProvider` and `SafeAreaProvider` in root layout
- [ ] `ErrorBoundary` wrapping the navigator in `app/_layout.tsx`
- [ ] `expo-secure-store` for token storage
- [ ] MMKV for general storage
- [ ] Auth guard in `app/(app)/_layout.tsx`
- [ ] Typed Expo Router routes enabled (`experiments.typedRoutes: true`)
- [ ] EAS project configured with `eas.json`

### Per Feature
- [ ] Domain entity with `readonly` fields
- [ ] Value object returning `Result<T, E>` — never throws
- [ ] Repository interface in domain layer
- [ ] Use case(s) as pure functions, injected repository
- [ ] Zustand store delegating to use cases
- [ ] TanStack Query hooks for server state
- [ ] Repository implementation with Zod parsing on all API responses
- [ ] Domain failure mapper to Spanish strings
- [ ] Screen using selectors (`useStore((s) => s.field)`)
- [ ] Shared `Screen`, `Text`, `Button` primitives — no raw RN components in screens
- [ ] Unit tests for use cases and value objects
- [ ] Component tests for key user interactions

### Quality
- [ ] `eslint` and `prettier` return zero warnings
- [ ] No `any` types anywhere
- [ ] No raw `console.log` in production code
- [ ] `FlatList` or `FlashList` for every dynamic list
- [ ] `accessibilityRole` and `accessibilityLabel` on all interactive elements
- [ ] All user-visible strings in `MESSAGES` constants (Spanish)
- [ ] No API keys or secrets in client code
