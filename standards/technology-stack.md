# Technology Stack

## Frontend Stack

### Bundler & Dev Server
- **Vite 7+** with TypeScript
  - Default bundler for all frontend projects
  - Native ES modules for fast development
  - Optimized for Module Federation (microfrontends)
  - HMR (Hot Module Replacement) instantáneo

### Router
- **TanStack Router 1+** (file-based routing)
  - Type-safe routing with auto-generated route tree
  - File-based routing with special prefixes (`_`, `.`, `-`, `$`)
  - Automatic code-splitting per route
  - Integrated with TanStack Query

### State Management
- **Zustand 5+** (client state)
  - Feature-based stores following DDD patterns
  - Prepared for microfrontends (singleton stores)
- **TanStack Query 5+** (server state)
  - Cache and synchronization
  - Optimistic updates

### UI Framework & Styling
- **shadcn/ui** (component library)
- **Radix UI** (primitives)
- **TailwindCSS v4** (styling)

### Architecture
- **Clean Architecture** + **Domain-Driven Design (DDD)**
- **Module/Domain/Feature** structure for enterprise scale

### Testing
- **Vitest** (test runner - native Vite integration)
- **React Testing Library** (component testing)
- **MSW** (Mock Service Worker - API mocking)

### Forms & Validation
- **React Hook Form** (form management)
- **Zod** (schema validation)

### HTTP Client
- **Axios** with interceptors

### Progressive Web App (PWA)
- **vite-plugin-pwa** (PWA plugin for Vite)
- **Workbox** (service worker library)

## Microfrontends Configuration

### Module Federation Shared Dependencies

Para evitar dependencias duplicadas entre microfrontends:

```typescript
// vite.config.ts - Host y cada Remote
import { federation } from '@module-federation/vite';

federation({
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
    '@tanstack/react-router': { singleton: true, requiredVersion: '^1.95.0' },
    '@tanstack/react-query': { singleton: true, requiredVersion: '^5.62.0' },
    zustand: { singleton: true, requiredVersion: '^5.0.0' },
  },
})
```

| Configuración | Propósito |
|---------------|-----------|
| `singleton: true` | Garantiza una sola instancia en runtime |
| `requiredVersion: '^x.x.0'` | Rango semver para flexibilidad sin romper compatibilidad |

## Core Principles

### Clean Architecture First
Strict separation of:
- Domain layer
- Application layer
- Infrastructure layer
- Presentation layer

### Domain-Driven Design
Business logic drives architecture decisions

### Component Composition
Build complex UIs from simple, reusable components

### Type Safety
Leverage TypeScript for compile-time safety and developer experience

### Performance by Design
- Lazy loading (automatic with TanStack Router)
- Memoization
- Bundle optimization
- Singleton shared dependencies for microfrontends

### Accessibility as Standard
WCAG 2.1 AA compliance in all components

### Test-Driven Development
Unit tests for all use cases and components

### Progressive Web App
Offline-first approach with service workers

### Minimal and Functional
Only build what's explicitly requested, nothing more

### User-Centered Design
Start with user needs and work backward to implementation

### MCP Shadcn Available
Use MCP to install Shadcn components instead of creating manually

## Backend Stack

### Core Framework & Language
- **.NET 10**
- **C# Minimal API** - Lightweight and modern API approach
- **Entity Framework Core 10** - ORM for data access (matches .NET 10 version)
- **FluentValidation** - Validation for models and DTOs
- **linq2db** - Ultra-lightweight, high-performance ORM for complex optimized queries
- **DynamicLinq** - Dynamic query construction from strings (runtime filters)
- **LinqKit** - Composable and reusable LINQ expressions with type safety

### ORM Strategy & When to Use Each Tool

#### Entity Framework Core 10 (Primary ORM)
**Use for:**
- Standard CRUD operations
- DDD entities with tracking (Aggregate Roots, Domain Events)
- Simple to moderate queries
- Queries that participate in aggregate lifecycle
- Navigation properties and relationships
- Change tracking scenarios

#### linq2db
**Ultra-lightweight ORM for maximum performance and SQL control**

✔ **Use when:**
- Need highly optimized complex queries
- Advanced subqueries and complex projections
- Multiple joins with dynamic conditions
- Queries that EF Core cannot translate efficiently
- Endpoints require extreme performance:
  - Dashboards
  - Analytics
  - Fast transactional reports
  - High data volumes
- Microservice requires pure queries without tracking (linq2db operates naturally without tracking → faster)
- EF Core generates inefficient SQL and you need alternatives without changing stack
- Want SQL nearly as efficient as hand-written, but without explicit SQL

🚫 **Do NOT use when:**
- Need complete DDD entities (aggregate roots, tracking, events)
- Query participates in aggregate lifecycle
- Only need simple filters or trivial pagination

#### DynamicLinq
**Dynamic query generation from strings for runtime filters**

✔ **Use when:**
- Microservice offers dynamic filter system:
  - Example: `?filter=Age > 30 AND Country == "CO"`
  - Example: `?sort=Name desc`
- Building simplified OData-style API without using OData
- Generic queries over tables
- Variable column searches
- Data explorers or configurable grids
- Want to avoid manually generating Expression Trees (DynamicLinq is much simpler)

🚫 **Do NOT use when:**
- Filters are fully controlled in code
- Don't want to interpret expressions at runtime
- Require strict security (DynamicLinq requires sanitization)
- Need maximum performance (use LinqKit or linq2db instead)

#### LinqKit
**Composable dynamic predicates with type safety**

✔ **Use when:**
- Have complex business rules in queries
- Composable predicates example:
  ```csharp
  IsActive
  RequiresApproval
  BelongsToOrganization(user.OrgId)
  ```
- Want dynamic filters with type safety (no strings → expressions)
- Combine multiple expressions in a single `Where()`:
  - Especially useful in DDD repositories with:
    - Multiple criteria
    - Conditional searches
    - Reusable queries
- Need EF Core to translate the resulting expression (LinqKit is 100% compatible with EF Core)
- Want to enhance EF Core when it fails to compose complex expressions

🚫 **Do NOT use when:**
- Filters are extremely simple
- Query is highly dynamic and text-based (use DynamicLinq)
- Need maximum performance (use linq2db)

### Architecture & Design Patterns
- **TDD (Test-Driven Development)** - Test-driven development approach
- **DDD (Domain-Driven Design)** - Domain-oriented design
- **Clean Architecture** - Clean architecture with layer separation
- **Microservices** - Distributed services architecture
- **REST API** - Primary communication protocol

### Database & Data Management
- **PostgreSQL 18+** - Primary relational database (mandatory)
- **Database per Microservice** - Each microservice has its own isolated database
- **Primary Keys UUID** - Universal unique identifiers for all entities
- **EF Core 10 Migrations** - Entity Framework migrations package for schema version control

### Testing
- **xUnit** - Unit and integration testing framework
- **EF Core 10 InMemory** - In-memory database for fast tests
- **PostgreSQL 18+ Test Containers** - PostgreSQL containers for real integration tests

### Additional Libraries
- **QuestPDF** - PDF document generation
- **DynamicLinq** - Dynamic LINQ query construction
- **LinqKit** - LINQ expression composition

### API Documentation
- **Scalar** - Modern API documentation (DO NOT use Swagger)

### Infrastructure & DevOps
- **Docker Ready** - Containerized applications ready for deployment (production only)
- **Local Development** - Without Docker, direct execution with dotnet CLI
- **Multiculture** - Support for internationalization (i18n) and localization (l10n)

## Backend Core Principles

### Clean Architecture First
Strict separation of:
- Domain layer (Entities, Value Objects, Aggregates, Domain Services)
- Application layer (Commands, Queries, DTOs, Interfaces)
- Infrastructure layer (Repositories, EF Core, External Services)
- Presentation layer (Minimal API Endpoints)

### Domain-Driven Design
Business logic drives architecture decisions

### Test-Driven Development
- Write tests before or alongside implementation
- xUnit for all backend tests
- High test coverage requirement

### Microservices Isolation
- Each service is independent
- Own PostgreSQL 18+ database per service
- No shared databases between services

### UUID Primary Keys
All entities must use UUIDs (Guid in C#) as primary keys for distributed system compatibility

### Type Safety
Leverage C# strong typing for compile-time safety

### Security by Design
Implement security at every layer

### Docker for Production Only
- Development: dotnet run locally
- Production: Docker containers

## Version Summary

### Frontend
| Technology | Version | Notes |
|------------|---------|-------|
| Vite | 6+ | Bundler, optimized for Module Federation |
| React | 18+ | Functional components, hooks |
| TypeScript | 5+ | Strict mode enabled |
| TanStack Router | 1+ | File-based, type-safe routing |
| TanStack Query | 5+ | Server state management |
| Zustand | 5+ | Client state management |
| TailwindCSS | 4+ | Utility-first CSS |
| Vitest | Latest | Native Vite test runner |

### Backend
| Technology | Version | Notes |
|------------|---------|-------|
| .NET | 10 | LTS |
| Entity Framework Core | 10 | Matches .NET version |
| PostgreSQL | 18+ | Mandatory, one per microservice |
| xUnit | Latest | Testing framework |