# Coding Standards & Architecture Guide

Centralized repository of coding standards, architectural patterns, and technical conventions for building enterprise-scale applications. Enforces **Clean Architecture**, **Domain-Driven Design (DDD)**, and **microservices patterns** across all platforms.

## Quick Start

Copy all coding standards into any project:

```bash
npx @jeffrey2423/coding-standards
```

This creates a `coding-standards/` folder with all standard documents.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Standards by Platform](#standards-by-platform)
- [Database Conventions](#database-conventions)
- [Design System & UX](#design-system--ux)
- [Key Principles](#key-principles)
- [Document Index](#document-index)

## Technology Stack

### Frontend (Web)

| Category | Technology | Version |
|----------|-----------|---------|
| Bundler | Vite | 7+ |
| Framework | React | 18+ |
| Language | TypeScript | 5+ (strict mode) |
| Routing | TanStack Router | 1+ (file-based) |
| Client State | Zustand | 5+ |
| Server State | TanStack Query | 5+ |
| UI Components | shadcn/ui + Radix UI | Latest |
| Styling | TailwindCSS | v4 |
| Forms | React Hook Form + Zod | Latest |
| Testing | Vitest + React Testing Library + MSW | Latest |

### Backend

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | .NET | 10 |
| Language | C# | Latest (Minimal API) |
| Primary ORM | Entity Framework Core | 10 |
| Performance ORM | linq2db | Latest |
| Database | PostgreSQL | 18+ (mandatory) |
| Validation | FluentValidation | Latest |
| Testing | xUnit | Latest |
| API Docs | Scalar | Latest (NOT Swagger) |

### Mobile

| Platform | Framework | State | Navigation | Styling |
|----------|-----------|-------|------------|---------|
| Flutter | Flutter SDK | Riverpod 3+ | GoRouter 14+ | Material Design 3 |
| React Native | Expo SDK 53+ | Zustand | Expo Router 4+ | NativeWind 4+ (Tailwind) |

### Microfrontends

| Pattern | Usage |
|---------|-------|
| **Single-SPA** | **DEFAULT** for all business modules |
| Module Federation | ONLY for explicitly shared/transversal modules |

## Architecture Overview

All platforms follow **Clean Architecture + DDD** with strict layer separation:

```
Domain Layer          → Entities, Value Objects, Aggregates, Domain Events
    ↑
Application Layer     → Commands, Queries, Handlers, DTOs, Validators
    ↑
Infrastructure Layer  → Repositories, ORM, External Services, API Clients
    ↑
Presentation Layer    → UI Components, Routes, Pages, Endpoints
```

### Frontend Folder Structure

```
src/
├── routes/              # TanStack Router (route definitions only)
├── modules/             # Business logic (Module/Domain/Feature)
│   └── sales/           #   MODULE
│       └── quotes/      #     DOMAIN
│           └── cart/    #       FEATURE (domain/application/infrastructure/presentation)
├── shared/              # Reusable components, hooks, types
├── app/                 # Global config, providers, stores
├── infrastructure/      # External services (API, storage, PWA)
├── assets/              # Static resources
└── styles/              # Global styles
```

### Backend Project Structure (per Microservice)

```
Service.Domain/          # Entities, Value Objects, Domain Events
Service.Application/     # Use Cases, DTOs, Validators, Interfaces
Service.Infrastructure/  # EF Core, Repositories, External Services
Service.API/             # Minimal API Endpoints
Service.Tests/           # xUnit Tests
```

## Standards by Platform

### Frontend Standards

- **Language Rule**: ALL user-visible text in **Spanish**, code/logs/comments in English
- TanStack Router with file-based routing conventions (`_` pathless layouts, `$` dynamic params)
- State split: Zustand (global client) / TanStack Query (server) / useState (local)
- Component naming: PascalCase files, kebab-case `data-testid`
- WCAG 2.1 AA accessibility compliance
- Testing: Unit (use cases) → Integration (features) → Component (RTL) → E2E (critical paths)

### Backend Standards

- **Critical**: Always use `DateTimeOffset` for timestamps (NEVER `DateTime`)
- Minimal API pattern with endpoint grouping
- Multi-ORM strategy: EF Core (CRUD) / linq2db (performance) / DynamicLinq (runtime filters)
- UUID (Guid) primary keys for all entities
- Database per Microservice pattern
- TDD with xUnit, InMemory for unit tests, TestContainers for integration

### Mobile Standards

Both Flutter and React Native follow Clean Architecture + DDD + Feature-First organization with platform-specific tooling.

## Database Conventions

**PostgreSQL** is the mandatory database engine. Key conventions:

| Element | C# Convention | PostgreSQL Convention | Example |
|---------|--------------|----------------------|---------|
| Tables | PascalCase | snake_case | `OrderItems` → `order_items` |
| Columns | PascalCase | snake_case | `CreatedAt` → `created_at` |
| Foreign Keys | `{Entity}ID` | `{entity}_id` | `WarehouseID` → `warehouse_id` |
| Primary Keys | `Guid` | `uuid` | `DEFAULT uuidv7()` |
| Indexes | - | `ix_{table}_{cols}` | `ix_orders_created_at` |
| Unique | - | `uk_{table}_{cols}` | `uk_users_email` |
| Projections | `{PREFIX}_{Entity}Prj` | `{prefix}_{table}_prj` | `AUTH_UserPrj` → `auth_users_prj` |

EF Core handles automatic snake_case conversion via `SnakeCaseNamingConvention` — no manual `[Column]` or `[Table]` attributes needed.

## Design System & UX

### Colors

| Role | Value | Usage |
|------|-------|-------|
| Primary | `#0E79FD` | Brand blue, main actions |
| Secondary | `#000000` | Brand elements only (NOT backgrounds) |
| Tertiary | `#154CA9` | Dark blue accents |
| Neutrals | Tailwind `slate` scale | Backgrounds, borders, text |

### Typography

- **Font**: Inter (Light 300, Regular 400, Bold 700)
- **Scale**: Tailwind typography utilities (h1–h6, body, interactive)

### Performance Targets

| Metric | Target |
|--------|--------|
| Initial Bundle | < 500KB gzipped |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |

### Icons & Loading

- Primary icons: **Heroicons**
- Secondary icons: Font Awesome 6.5+
- Loading states: `react-loading-skeleton` v3.4.0

## Key Principles

1. **Clean Architecture** — Strict layer separation with dependency inversion across all platforms
2. **Domain-Driven Design** — Business logic organized by bounded contexts drives architecture
3. **Test-Driven Development** — Tests alongside implementation, >80% coverage required
4. **Type Safety** — TypeScript strict mode (frontend), C# (backend), Dart (Flutter)
5. **Database per Microservice** — Complete data isolation between services
6. **UUID Primary Keys** — All entities use UUIDs for distributed system compatibility
7. **Spanish UI / English Code** — User-facing content in Spanish, codebase in English
8. **Single-SPA Default** — Microfrontends use Single-SPA; Module Federation only for explicit sharing
9. **Accessibility First** — WCAG 2.1 AA, 4.5:1 contrast, 44px touch targets, keyboard navigation

## Document Index

| Document | Description |
|----------|-------------|
| [technology-stack.md](standards/technology-stack.md) | Complete technology stack with versions and rationale |
| [architecture-patterns.md](standards/architecture-patterns.md) | Frontend and backend architectural patterns |
| [backend-standards.md](standards/backend-standards.md) | .NET backend development standards and conventions |
| [frontend-standards.md](standards/frontend-standards.md) | React/TypeScript frontend standards and folder structure |
| [database-conventions.md](standards/database-conventions.md) | PostgreSQL naming conventions and EF Core mapping |
| [vite-config-standard.md](standards/vite-config-standard.md) | Microfrontend configuration (Single-SPA & Module Federation) |
| [technical-preferences-ux.md](standards/technical-preferences-ux.md) | Design system, colors, typography, UX guidelines |
| [mobile-flutter-standards.md](standards/mobile-flutter-standards.md) | Flutter mobile development standards |
| [mobile-react-native-standards.md](standards/mobile-react-native-standards.md) | React Native mobile development standards |
