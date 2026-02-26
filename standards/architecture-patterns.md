# Architecture Patterns & Design Decisions

## Frontend Architecture

### Architecture Style
- **Clean Architecture** + **Domain-Driven Design (DDD)**

### Folder Structure

Vite + TanStack Router Structure with Clean Architecture + DDD:

```
├── src/
│   ├── main.tsx                     # React entry point
│   ├── router.tsx                   # TanStack Router config
│   ├── routeTree.gen.ts             # Auto-generated (DO NOT EDIT)
│   ├── globals.css                  # Global styles + Tailwind
│   │
│   ├── routes/                      # TanStack Router file-based routing
│   │   ├── __root.tsx               # Root layout (providers)
│   │   ├── index.tsx                # Home redirect
│   │   ├── _auth.tsx                # Public layout (pathless)
│   │   ├── _auth/
│   │   │   └── login.tsx            # /login
│   │   ├── _app.tsx                 # Protected layout (pathless)
│   │   └── _app/
│   │       ├── dashboard.tsx        # /dashboard
│   │       ├── sales/
│   │       │   ├── quotes.tsx       # /sales/quotes
│   │       │   └── invoices.tsx     # /sales/invoices
│   │       └── inventory/
│   │           └── products.tsx     # /inventory/products
│   │
│   ├── modules/                     # Business modules following DDD
│   │   ├── sales/                   # Sales module
│   │   │   ├── quotes/              # Quote domain
│   │   │   │   ├── cart/            # Shopping cart feature
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── repositories/
│   │   │   │   │   │   ├── services/
│   │   │   │   │   │   └── types/
│   │   │   │   │   ├── application/
│   │   │   │   │   │   ├── use-cases/
│   │   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── store/
│   │   │   │   │   ├── infrastructure/
│   │   │   │   │   │   ├── repositories/
│   │   │   │   │   │   ├── api/
│   │   │   │   │   │   └── adapters/
│   │   │   │   │   └── presentation/
│   │   │   │   │       └── components/
│   │   │   │   └── products/        # Products feature
│   │   │   └── billing/             # Billing domain
│   │   ├── inventory/               # Inventory module
│   │   └── users/                   # User module
│   │
│   ├── shared/
│   │   ├── components/              # Reusable UI components
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── hooks/                   # Shared hooks
│   │   ├── lib/                     # Utilities (utils.ts, api-client.ts)
│   │   ├── types/                   # Common TypeScript types
│   │   └── constants/               # App constants
│   │
│   ├── app/                         # Global configuration
│   │   ├── providers/               # React context providers
│   │   └── store/                   # Global Zustand stores
│   │
│   └── infrastructure/              # Global external services
│       ├── api/                     # API configuration
│       ├── storage/                 # IndexedDB, localStorage
│       └── pwa/                     # PWA configuration
│
├── public/                          # Static assets and PWA manifest
├── index.html                       # Vite entry point
└── vite.config.ts                   # Vite + TanStack Router plugin config
```

### TanStack Router Conventions

| Prefix | Effect | Example |
|--------|--------|---------|
| `_` | Pathless layout (no URL segment) | `_app.tsx` → layout only |
| `.` | Flat routing (nested without folders) | `orders.$id.tsx` → `/orders/:id` |
| `-` | Ignored by router (colocated files) | `-components/` |
| `$` | Dynamic parameter | `$orderId.tsx` → `:orderId` |

### Core Principles

#### Clean Architecture First
Strict separation of:
- **Domain layer** - Business entities, repositories interfaces, domain services, and types
- **Application layer** - Use cases, hooks, and state management (Zustand stores)
- **Infrastructure layer** - Repository implementations, API clients, and adapters
- **Presentation layer** - UI components in `presentation/`, routes in `routes/`

#### Domain-Driven Design
Business logic drives architecture decisions. Organize by business modules and domains, not technical layers.

#### Component Composition
Build complex UIs from simple, reusable components.

#### Type Safety
Leverage TypeScript for compile-time safety and developer experience.

#### Performance by Design
- Lazy loading (automatic with TanStack Router)
- Memoization
- Bundle optimization

#### Accessibility as Standard
WCAG 2.1 AA compliance in all components.

#### Test-Driven Development
Unit tests for all use cases and components.

#### Progressive Web App
Offline-first approach with service workers.

#### Minimal and Functional
Only build what's explicitly requested, nothing more.

#### User-Centered Design
Start with user needs and work backward to implementation.

#### MCP Shadcn Available
Use MCP to install Shadcn components instead of creating manually.

### Framework Selection Rules

**Default**: Always use Vite + TanStack Router with TypeScript.

**Microfrontends**:
- **DEFAULT**: Vite + Single-SPA (`vite-plugin-single-spa` + `single-spa-react`) para todos los módulos de negocio
- **EXCEPCIÓN**: Vite + Module Federation SOLO para módulos transversales/compartidos explícitamente marcados por el ingeniero

**Reasoning**:
- Single-SPA proporciona aislamiento completo (CSS, JS, lifecycle), mejor hot reload, y error boundaries built-in
- Module Federation solo se usa cuando hay necesidad explícita de compartir código entre MFEs
- Ver `vite-config-standard.md` para configuración detallada

## Backend Architecture

### Architecture Style
- **Clean Architecture** + **Domain-Driven Design (DDD)** + **Microservices**

### Technology Stack
- **.NET 10** with **C# Minimal API**
- **Entity Framework Core** with **PostgreSQL 18+**
- **UUID (Guid)** primary keys mandatory
- **linq2db**, **DynamicLinq**, **LinqKit** for advanced queries
- **FluentValidation** for validation
- **xUnit** for testing
- **Scalar** for API documentation (NO Swagger)
- **QuestPDF** for PDF generation

### Folder Structure

.NET Solution Structure with Clean Architecture + DDD + Microservices:

```
├── src/
│   ├── Services/                          # Microservices
│   │   ├── Sales/                        # Sales domain microservice
│   │   │   ├── Sales.API/                # Minimal API project
│   │   │   │   ├── Program.cs            # Application entry point
│   │   │   │   ├── appsettings.json
│   │   │   │   ├── Endpoints/            # Minimal API endpoints
│   │   │   │   │   ├── UserEndpoints.cs
│   │   │   │   │   └── QuoteEndpoints.cs
│   │   │   │   ├── Filters/
│   │   │   │   ├── Middleware/
│   │   │   │   └── Sales.API.csproj
│   │   │   │
│   │   │   ├── Sales.Application/        # Application layer
│   │   │   │   ├── Quotes/               # Bounded context
│   │   │   │   │   ├── Commands/
│   │   │   │   │   │   ├── CreateQuoteCommand.cs
│   │   │   │   │   │   └── CreateQuoteCommandHandler.cs
│   │   │   │   │   ├── Queries/
│   │   │   │   │   │   ├── GetQuoteByIdQuery.cs
│   │   │   │   │   │   └── GetQuoteByIdQueryHandler.cs
│   │   │   │   │   ├── DTOs/
│   │   │   │   │   │   └── QuoteResponseDto.cs
│   │   │   │   │   ├── Validators/       # FluentValidation
│   │   │   │   │   │   └── CreateQuoteCommandValidator.cs
│   │   │   │   │   └── Interfaces/       # Repository interfaces
│   │   │   │   │       └── IQuoteRepository.cs
│   │   │   │   └── Sales.Application.csproj
│   │   │   │
│   │   │   ├── Sales.Domain/             # Domain layer
│   │   │   │   ├── Quotes/               # Bounded context
│   │   │   │   │   ├── Entities/
│   │   │   │   │   │   └── QuoteEntity.cs
│   │   │   │   │   ├── ValueObjects/
│   │   │   │   │   │   ├── QuoteNumber.cs
│   │   │   │   │   │   └── Money.cs
│   │   │   │   │   ├── Aggregates/
│   │   │   │   │   │   └── QuoteAggregate.cs
│   │   │   │   │   ├── Events/
│   │   │   │   │   │   └── QuoteCreatedEvent.cs
│   │   │   │   │   └── Services/         # Domain services
│   │   │   │   │       └── QuotePricingService.cs
│   │   │   │   └── Sales.Domain.csproj
│   │   │   │
│   │   │   └── Sales.Infrastructure/     # Infrastructure layer
│   │   │       ├── Data/
│   │   │       │   ├── ApplicationDbContext.cs
│   │   │       │   ├── Configurations/   # EF Core configurations
│   │   │       │   │   ├── QuoteConfiguration.cs
│   │   │       │   │   └── UserConfiguration.cs
│   │   │       │   └── Migrations/       # EF Core migrations
│   │   │       ├── Repositories/         # Repository implementations
│   │   │       │   └── QuoteRepository.cs
│   │   │       ├── Services/             # External service adapters
│   │   │       │   └── EmailService.cs
│   │   │       └── Sales.Infrastructure.csproj
│   │   │
│   │   ├── Inventory/                    # Inventory microservice (independent DB)
│   │   │   ├── Inventory.API/
│   │   │   ├── Inventory.Application/
│   │   │   ├── Inventory.Domain/
│   │   │   └── Inventory.Infrastructure/
│   │   │       └── Data/                 # Separate PostgreSQL DB
│   │   │           └── InventoryDbContext.cs
│   │   │
│   │   └── Users/                        # Users microservice (independent DB)
│   │       ├── Users.API/
│   │       ├── Users.Application/
│   │       ├── Users.Domain/
│   │       └── Users.Infrastructure/
│   │           └── Data/                 # Separate PostgreSQL DB
│   │               └── UsersDbContext.cs
│   │
│   └── Shared/                           # Shared libraries
│       ├── Shared.Domain/                # Shared domain concepts
│       │   ├── Base/
│       │   │   ├── AggregateRoot.cs
│       │   │   ├── Entity.cs
│       │   │   ├── ValueObject.cs
│       │   │   └── DomainEvent.cs
│       │   ├── Interfaces/
│       │   │   ├── IRepository.cs
│       │   │   └── IUnitOfWork.cs
│       │   └── Shared.Domain.csproj
│       │
│       ├── Shared.Infrastructure/        # Shared infrastructure
│       │   ├── Data/
│       │   │   ├── BaseRepository.cs
│       │   │   └── UnitOfWork.cs
│       │   ├── Filters/
│       │   │   └── ValidationFilter.cs
│       │   ├── Middleware/
│       │   │   ├── ExceptionHandlingMiddleware.cs
│       │   │   └── LoggingMiddleware.cs
│       │   └── Shared.Infrastructure.csproj
│       │
│       └── Shared.Common/                # Common utilities
│           ├── Extensions/
│           │   ├── StringExtensions.cs
│           │   └── GuidExtensions.cs
│           ├── Helpers/
│           │   └── DateTimeHelper.cs
│           ├── Constants/
│           │   └── ErrorMessages.cs
│           └── Shared.Common.csproj
│
├── tests/                                # Test projects
│   ├── Sales.UnitTests/
│   │   ├── Domain/
│   │   ├── Application/
│   │   └── Sales.UnitTests.csproj
│   ├── Sales.IntegrationTests/
│   │   ├── Repositories/
│   │   ├── API/
│   │   └── Sales.IntegrationTests.csproj
│   ├── Inventory.UnitTests/
│   └── Users.UnitTests/
│
├── docker/                               # Docker configurations (Production only)
│   ├── docker-compose.yml
│   └── Dockerfiles/
│       ├── Sales.Dockerfile
│       ├── Inventory.Dockerfile
│       └── Users.Dockerfile
│
└── YourSolution.sln                      # Solution file
```

### Microservices Communication Patterns

#### 1. Synchronous Communication (REST)
```csharp
// HTTP client for inter-service communication
public class InventoryServiceClient
{
    private readonly HttpClient _httpClient;

    public InventoryServiceClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ProductAvailabilityDto> CheckProductAvailabilityAsync(
        Guid productId, 
        CancellationToken cancellationToken)
    {
        var response = await _httpClient.GetAsync(
            $"/api/products/{productId}/availability", 
            cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ProductAvailabilityDto>(cancellationToken);
    }
}
```

#### 2. Asynchronous Communication (Message Broker)
- **RabbitMQ** or **Azure Service Bus** for event-driven architecture
- Each microservice publishes domain events
- Other services subscribe to relevant events

#### 3. gRPC for High-Performance Communication
- Use for internal high-throughput service-to-service calls
- Protocol Buffers for efficient serialization

### Database per Microservice Pattern

**Key Principles:**
- Each microservice has its own PostgreSQL database (v18+)
- No direct database access between services
- Data consistency via eventual consistency and sagas
- Each database uses UUID (Guid) primary keys

**Connection String Pattern:**
```json
{
  "ConnectionStrings": {
    "SalesDb": "Host=localhost;Database=sales_db;Username=admin;Password=***",
    "InventoryDb": "Host=localhost;Database=inventory_db;Username=admin;Password=***",
    "UsersDb": "Host=localhost;Database=users_db;Username=admin;Password=***"
  }
}
```

### Core Backend Principles

#### Clean Architecture Layers
1. **Domain Layer** - Business entities, value objects, domain services (no dependencies)
2. **Application Layer** - Commands, queries, validators, interfaces (depends on Domain)
3. **Infrastructure Layer** - EF Core, repositories, external services (depends on Application)
4. **Presentation Layer** - Minimal API endpoints (depends on Application)

#### UUID Primary Keys
```csharp
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}
```

#### Entity Framework Core Configuration
```csharp
public class QuoteConfiguration : IEntityTypeConfiguration<QuoteEntity>
{
    public void Configure(EntityTypeBuilder<QuoteEntity> builder)
    {
        builder.ToTable("Quotes");
        builder.HasKey(q => q.Id);
        
        builder.Property(q => q.Id)
            .HasColumnType("uuid")
            .IsRequired();
        
        builder.OwnsOne(q => q.QuoteNumber, qn =>
        {
            qn.Property(n => n.Value)
                .HasColumnName("QuoteNumber")
                .HasMaxLength(50)
                .IsRequired();
        });
    }
}
```

#### Test-Driven Development
- Write xUnit tests before or alongside implementation
- Use EF Core InMemory for fast unit tests
- Use PostgreSQL 18+ Test Containers for integration tests
- Mock external dependencies

#### FluentValidation Usage
```csharp
public class CreateQuoteCommandValidator : AbstractValidator<CreateQuoteCommand>
{
    public CreateQuoteCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .WithMessage("Customer ID is required");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("At least one item is required");
    }
}
```

#### Scalar API Documentation
Register Scalar instead of Swagger in Program.cs:
```csharp
app.MapScalarApiReference();  // NOT app.UseSwagger()
```

## Summary

### Frontend
- **Bundler**: Vite 5+
- **Router**: TanStack Router (file-based, type-safe)
- **Framework**: React 18+ with TypeScript (strict mode)
- **Architecture**: Clean Architecture + DDD
- **State**: Zustand (client) + TanStack Query (server)
- **UI**: shadcn/ui + Radix UI + TailwindCSS v4
- **Testing**: Vitest + React Testing Library
- **Validation**: Zod + React Hook Form

### Backend
- **Framework**: .NET 10 with C# Minimal API
- **Architecture**: Clean Architecture + DDD + Microservices
- **Database**: PostgreSQL 18+ (one per microservice)
- **ORM**: Entity Framework Core + linq2db + DynamicLinq + LinqKit
- **Validation**: FluentValidation
- **Testing**: xUnit + EF Core InMemory + PostgreSQL 18+ Test Containers
- **Documentation**: Scalar (NO Swagger)
- **Primary Keys**: UUID (Guid) mandatory
- **PDF Generation**: QuestPDF

### Key Principles
1. **Clean Architecture** - Strict layer separation in both frontend and backend
2. **Domain-Driven Design** - Business logic drives all decisions
3. **Test-Driven Development** - Tests before/alongside implementation
4. **Database per Microservice** - Complete isolation between services
5. **Type Safety** - TypeScript (frontend) and C# (backend) strong typing
6. **Docker for Production** - Local development without containers