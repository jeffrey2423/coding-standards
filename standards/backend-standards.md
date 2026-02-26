# Backend Development Standards

> **Note**: For architecture patterns and principles (Clean Architecture, DDD, folder structure), see [architecture-patterns.md](./architecture-patterns.md)

## Technology Stack Standards

### Core Technologies
- **.NET 10**: Main framework with C#
- **C# Minimal API**: Lightweight and modern approach for APIs
- **Entity Framework Core 10**: ORM for database operations
- **xUnit**: Unit and integration testing framework
- **FluentValidation**: Validation for DTOs and models

### Framework Standards
- **Default Framework**: .NET 10 with C# Minimal API
- **Database**: PostgreSQL 18+ with Entity Framework Core 10 (mandatory)
- **ORM Extensions**: 
  - **linq2db**: For highly optimized complex queries requiring maximum performance
  - **DynamicLinq**: For runtime dynamic filters from user input or configurable scenarios
  - **LinqKit**: For composable type-safe predicates in DDD repositories with complex business rules
- **Testing**: TDD approach with xUnit and high test coverage
- **Documentation**: Scalar (NO Swagger) auto-generated
- **Primary Keys**: UUID (Guid) for all entities

## CRITICAL: DateTime Type Standards

### ⚠️ Mandatory Rule: Use DateTimeOffset for Timestamps

**ALWAYS use `DateTimeOffset` instead of `DateTime`** for all timestamp fields in entities, DTOs, and database models.

#### Why DateTimeOffset?

- **PostgreSQL Compatibility**: PostgreSQL uses `TIMESTAMP WITH TIME ZONE` which maps correctly to `DateTimeOffset` but NOT to `DateTime`
- **Timezone Awareness**: `DateTimeOffset` preserves timezone information, preventing timezone conversion issues
- **UTC Consistency**: Store all timestamps in UTC for consistency across different timezones
- **Avoiding Bugs**: Using `DateTime` with PostgreSQL causes:
  - Data loss during timezone conversions
  - Inconsistent timestamp comparisons
  - Ambiguous datetime values during DST transitions

#### Correct Usage

```csharp
// ✅ CORRECT - Use DateTimeOffset for timestamps
public class UserEntity : AggregateRoot
{
    public Guid Id { get; private set; }
    public string Email { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; private set; } = DateTimeOffset.UtcNow;
}

// ✅ CORRECT - Use DateOnly for date-only fields
public class ExpenseEntity : AggregateRoot
{
    public Guid Id { get; private set; }
    public decimal Amount { get; private set; }
    public DateOnly ExpenseDate { get; private set; } // Date without time
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
}

// ❌ WRONG - Never use DateTime for timestamp fields
public class UserEntity : AggregateRoot
{
    public DateTime CreatedAt { get; private set; } // ❌ WRONG - causes PostgreSQL issues
    public DateTime UpdatedAt { get; private set; } // ❌ WRONG - causes PostgreSQL issues
}
```

#### Entity Framework Core Configuration

```csharp
public class UserEntityConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("users");

        // DateTimeOffset fields - automatically map to TIMESTAMP WITH TIME ZONE
        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("NOW()"); // PostgreSQL auto-generates UTC timestamp

        builder.Property(u => u.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("NOW()");
    }
}
```

#### Type Selection Guide

| Use Case | Type | Example |
|----------|------|---------|
| Timestamp with timezone | `DateTimeOffset` | `CreatedAt`, `UpdatedAt`, `DeletedAt`, `LastLoginAt` |
| Date only (no time) | `DateOnly` | `BirthDate`, `ExpenseDate`, `DueDate` |
| Time only (no date) | `TimeOnly` | `OpeningTime`, `ClosingTime` |
| Never use | `DateTime` | ❌ Not compatible with PostgreSQL TIMESTAMP WITH TIME ZONE |

#### Best Practices

1. **Always use `DateTimeOffset`** for `CreatedAt`, `UpdatedAt`, and any timestamp field
2. **Always use UTC**: Set values with `DateTimeOffset.UtcNow`
3. **Configure EF Core**: Use `HasDefaultValueSql("NOW()")` for automatic timestamps
4. **DTOs must match**: DTOs also use `DateTimeOffset` (serializes to ISO 8601 with timezone)
5. **Never use `DateTime`** for entity timestamp fields in PostgreSQL projects

### ORM Strategy Guidelines

#### When to Use Entity Framework Core 10
✔ **Primary ORM for:**
- Standard CRUD operations
- DDD entities with tracking (Aggregate Roots, Domain Events)
- Simple to moderate queries
- Navigation properties and relationships
- Change tracking scenarios

#### When to Use linq2db
✔ **Use for maximum performance:**
- Highly optimized complex queries (subqueries, complex projections, multiple joins)
- Queries that EF Core cannot translate efficiently
- High-performance endpoints: dashboards, analytics, reports, high data volumes
- Pure queries without tracking needs
- When EF Core generates inefficient SQL

🚫 **Avoid when:**
- Need complete DDD entities with aggregate lifecycle
- Query participates in domain events or tracking

#### When to Use DynamicLinq
✔ **Use for runtime flexibility:**
- Dynamic filter systems: `?filter=Age > 30 AND Country == "CO"`
- Simplified OData-style APIs
- Configurable grids or data explorers
- Variable column searches

🚫 **Avoid when:**
- Filters are fully controlled in code
- Require strict security (needs sanitization)
- Need maximum performance (use linq2db or LinqKit)

#### When to Use LinqKit
✔ **Use for type-safe composition:**
- Complex business rules in queries with composable predicates
- Dynamic filters with type safety (no strings → expressions)
- DDD repositories with multiple criteria, conditional searches, reusable queries
- Enhance EF Core when composing complex expressions
- 100% compatible with EF Core translation

🚫 **Avoid when:**
- Filters are extremely simple
- Query is highly dynamic and text-based (use DynamicLinq)
- Need maximum raw performance (use linq2db)

### Development Tools
- **dotnet CLI**: Project management, build, test, and restore
- **NuGet**: Package manager
- **EF Core 10 Migrations**: Database schema version control
- **Docker**: For production only
- **Code Analyzers**: Static C# code analysis
- **EditorConfig**: Code formatting standards

## Domain-Driven Design Implementation

### Entity Structure
```csharp
public class UserEntity : AggregateRoot
{
    // Parameterless constructor for EF Core (materialization from DB)
    private UserEntity() : base(Guid.Empty)
    {
        // EF Core needs this to reconstruct the entity from the database
    }

    private UserEntity(
        Guid id,
        EmailValueObject email,
        NameValueObject name) : base(id)
    {
        Email = email;
        Name = name;
    }

    public EmailValueObject Email { get; private set; } = null!;
    public NameValueObject Name { get; private set; } = null!;

    public static UserEntity Create(string email, string name)
    {
        var userEmail = EmailValueObject.Create(email);
        var userName = NameValueObject.Create(name);
        
        var user = new UserEntity(Guid.NewGuid(), userEmail, userName);
        user.AddDomainEvent(new UserCreatedEvent(user.Id));
        
        return user;
    }

    public void UpdateEmail(string newEmail)
    {
        var newEmailVO = EmailValueObject.Create(newEmail);
        if (Email.Equals(newEmailVO)) return;
        
        Email = newEmailVO;
        AddDomainEvent(new UserEmailUpdatedEvent(Id, Email));
    }
}
```

### Value Object Structure
```csharp
public class EmailValueObject : ValueObject
{
    public string Value { get; }

    private EmailValueObject(string value)
    {
        Value = value;
    }

    public static EmailValueObject Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Email cannot be empty", nameof(value));
            
        if (!IsValidEmail(value))
            throw new InvalidEmailException(value);
            
        return new EmailValueObject(value);
    }

    private static bool IsValidEmail(string email)
    {
        // Email validation logic
        return System.Text.RegularExpressions.Regex.IsMatch(
            email, 
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
```

### Repository Pattern
```csharp
// Interface (in Application layer)
public interface IUserRepository
{
    Task<UserEntity> SaveAsync(UserEntity user, CancellationToken cancellationToken = default);
    Task<UserEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserEntity?> FindByEmailAsync(EmailValueObject email, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

// Implementation (in Infrastructure layer)
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserEntity> SaveAsync(UserEntity user, CancellationToken cancellationToken = default)
    {
        var existingUser = await _context.Users.FindAsync(new object[] { user.Id }, cancellationToken);
        
        if (existingUser == null)
            await _context.Users.AddAsync(user, cancellationToken);
        else
            _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<UserEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<UserEntity?> FindByEmailAsync(EmailValueObject email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.Value == email.Value, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await FindByIdAsync(id, cancellationToken);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
```

## Command/Query (CQRS) Standards

### Command Structure
```csharp
public record CreateUserCommand(string Email, string Name);

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email must be valid");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");
    }
}

public class CreateUserCommandHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IValidator<CreateUserCommand> _validator;

    public CreateUserCommandHandler(
        IUserRepository userRepository,
        IValidator<CreateUserCommand> validator)
    {
        _userRepository = userRepository;
        _validator = validator;
    }

    public async Task<UserResponseDto> HandleAsync(
        CreateUserCommand command, 
        CancellationToken cancellationToken = default)
    {
        // 1. Validate command
        await _validator.ValidateAndThrowAsync(command, cancellationToken);

        // 2. Validate business rules
        await ValidateUserDoesNotExistAsync(command.Email, cancellationToken);

        // 3. Create domain entity
        var user = UserEntity.Create(command.Email, command.Name);

        // 4. Persist entity
        var savedUser = await _userRepository.SaveAsync(user, cancellationToken);

        // 5. Return response DTO
        return UserResponseDto.FromEntity(savedUser);
    }

    private async Task ValidateUserDoesNotExistAsync(string email, CancellationToken cancellationToken)
    {
        var emailVO = EmailValueObject.Create(email);
        var existingUser = await _userRepository.FindByEmailAsync(emailVO, cancellationToken);
        if (existingUser != null)
            throw new UserAlreadyExistsException(email);
    }
}
```

### Query Structure
```csharp
public record GetUserByIdQuery(Guid Id);

public class GetUserByIdQueryHandler
{
    private readonly IUserRepository _userRepository;

    public GetUserByIdQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserResponseDto?> HandleAsync(
        GetUserByIdQuery query, 
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.FindByIdAsync(query.Id, cancellationToken);
        return user != null ? UserResponseDto.FromEntity(user) : null;
    }
}
```

### DTO Structure
```csharp
public record UserResponseDto
{
    public Guid Id { get; init; }
    public string Email { get; init; }
    public string Name { get; init; }

    public static UserResponseDto FromEntity(UserEntity user)
    {
        return new UserResponseDto
        {
            Id = user.Id,
            Email = user.Email.Value,
            Name = user.Name.Value
        };
    }
}

```

## Minimal API Standards

### Endpoint Structure
```csharp
// Program.cs or separate endpoint configuration
public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .WithOpenApi();

        group.MapPost("/", CreateUser)
            .WithName("CreateUser")
            .WithSummary("Create a new user")
            .Produces<UserResponseDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapGet("/{id:guid}", GetUserById)
            .WithName("GetUserById")
            .WithSummary("Get user by ID")
            .Produces<UserResponseDto>()
            .Produces(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> CreateUser(
        CreateUserCommand command,
        CreateUserCommandHandler handler,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await handler.HandleAsync(command, cancellationToken);
            return Results.Created($"/api/users/{result.Id}", result);
        }
        catch (ValidationException ex)
        {
            return Results.ValidationProblem(ex.Errors.ToDictionary(
                e => e.PropertyName,
                e => new[] { e.ErrorMessage }));
        }
        catch (UserAlreadyExistsException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
    }

    private static async Task<IResult> GetUserById(
        Guid id,
        GetUserByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.HandleAsync(new GetUserByIdQuery(id), cancellationToken);
        return result != null ? Results.Ok(result) : Results.NotFound();
    }
}
```

## Testing Standards

### Testing Strategy
- **Unit Tests**: Domain entities, value objects, command/query handlers (isolated logic)
- **Integration Tests**: Repository implementations, database operations with EF Core InMemory or Test Containers
- **TDD Approach**: Write tests before or alongside implementation
- **High Coverage**: Aim for >80% code coverage

### Test Structure (xUnit)
```csharp
public class CreateUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IValidator<CreateUserCommand>> _validatorMock;
    private readonly CreateUserCommandHandler _handler;

    public CreateUserCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _validatorMock = new Mock<IValidator<CreateUserCommand>>();
        _handler = new CreateUserCommandHandler(
            _userRepositoryMock.Object,
            _validatorMock.Object);
    }

    [Fact]
    public async Task HandleAsync_WithValidCommand_ShouldCreateUser()
    {
        // Arrange
        var command = new CreateUserCommand("test@example.com", "John Doe");
        _validatorMock
            .Setup(v => v.ValidateAndThrowAsync(command, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _userRepositoryMock
            .Setup(r => r.FindByEmailAsync(It.IsAny<EmailValueObject>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserEntity?)null);
        _userRepositoryMock
            .Setup(r => r.SaveAsync(It.IsAny<UserEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserEntity u, CancellationToken _) => u);

        // Act
        var result = await _handler.HandleAsync(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(command.Email, result.Email);
        Assert.Equal(command.Name, result.Name);
        _userRepositoryMock.Verify(r => r.SaveAsync(It.IsAny<UserEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_WithExistingUser_ShouldThrowException()
    {
        // Arrange
        var command = new CreateUserCommand("test@example.com", "John Doe");
        var existingUser = UserEntity.Create("test@example.com", "Existing User");
        _validatorMock
            .Setup(v => v.ValidateAndThrowAsync(command, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _userRepositoryMock
            .Setup(r => r.FindByEmailAsync(It.IsAny<EmailValueObject>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act & Assert
        await Assert.ThrowsAsync<UserAlreadyExistsException>(() => 
            _handler.HandleAsync(command, CancellationToken.None));
    }
}
```

### Integration Test with EF Core InMemory
```csharp
public class UserRepositoryIntegrationTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly UserRepository _repository;

    public UserRepositoryIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new UserRepository(_context);
    }

    [Fact]
    public async Task SaveAsync_ShouldPersistUser()
    {
        // Arrange
        var user = UserEntity.Create("test@example.com", "John Doe");

        // Act
        var savedUser = await _repository.SaveAsync(user);

        // Assert
        var retrievedUser = await _repository.FindByIdAsync(savedUser.Id);
        Assert.NotNull(retrievedUser);
        Assert.Equal(user.Email.Value, retrievedUser.Email.Value);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
```

## EF Core Configuration Standards

### DbContext Configuration
```csharp
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base(options)
    {
    }

    public DbSet<UserEntity> Users { get; set; }
    public DbSet<QuoteEntity> Quotes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
```

### Entity Configuration
```csharp
public class UserEntityConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("Users");
        
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.Id)
            .HasColumnType("uuid")
            .IsRequired();

        // Configure Value Object as owned entity
        builder.OwnsOne(u => u.Email, email =>
        {
            email.Property(e => e.Value)
                .HasColumnName("Email")
                .HasMaxLength(256)
                .IsRequired();
        });

        builder.OwnsOne(u => u.Name, name =>
        {
            name.Property(n => n.Value)
                .HasColumnName("Name")
                .HasMaxLength(100)
                .IsRequired();
        });

        // Ignore domain events (not persisted)
        builder.Ignore(u => u.DomainEvents);
    }
}
```

## Security Standards

### Authentication & Authorization
- **JWT Tokens**: Proper expiration and refresh token handling
- **RBAC**: Role-based access control
- **Validation**: Input validation on all endpoints (FluentValidation)
- **Rate Limiting**: Throttle public endpoints to prevent abuse
- **Environment**: HTTPS only in production, secrets in env variables

### Data Protection
- Encrypt sensitive data at rest and in transit
- Never commit secrets to repository
- Implement audit logging for critical operations
- OWASP Top 10 compliance
- Regular dependency security audits with `dotnet list package --vulnerable`

## Performance Standards

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling via EF Core 10
- Pagination for large datasets (Skip/Take or cursor-based)
- Avoid N+1 queries with `.Include()` and `.ThenInclude()`
- Query monitoring and slow query logging
- Use `AsNoTracking()` for read-only queries

### Caching Strategy
- **Distributed Cache**: Redis for session data and frequently accessed data
- **Memory Cache**: In-memory caching for configuration
- **TTL Strategy**: Appropriate time-to-live for different data types
- **Invalidation**: Event-driven cache invalidation

## Error Handling

### Exception Hierarchy
- Domain exceptions for business rule violations
- Application exceptions for use case errors
- Infrastructure exceptions for external service failures
- Global exception middleware for API responses

### Error Response Format (Problem Details RFC 7807)
```csharp
public record ProblemDetailsResponse
{
    public int Status { get; init; }
    public string Title { get; init; }
    public string Detail { get; init; }
    public string Instance { get; init; }
    public DateTimeOffset Timestamp { get; init; }
    public Dictionary<string, string[]>? Errors { get; init; }
}

// Example response
{
  "status": 400,
  "title": "Validation Error",
  "detail": "One or more validation errors occurred",
  "instance": "/api/users",
  "timestamp": "2025-11-26T10:30:00Z",
  "errors": {
    "Email": ["Email is required", "Email must be valid"],
    "Name": ["Name is required"]
  }
}
```

### Global Exception Middleware
```csharp
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await HandleValidationExceptionAsync(context, ex);
        }
        catch (DomainException ex)
        {
            await HandleDomainExceptionAsync(context, ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleUnhandledExceptionAsync(context, ex);
        }
    }

    private static Task HandleValidationExceptionAsync(HttpContext context, ValidationException exception)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetailsResponse
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation Error",
            Detail = "One or more validation errors occurred",
            Instance = context.Request.Path,
            Timestamp = DateTimeOffset.UtcNow,
            Errors = exception.Errors.GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
        };

        return context.Response.WriteAsJsonAsync(problemDetails);
    }
}
```

## Security Standards

### Authentication & Authorization
- **JWT Tokens**: Proper expiration and refresh token handling
- **RBAC**: Role-based access control with Authorization Policies
- **Validation**: Input validation on all endpoints (FluentValidation)
- **Rate Limiting**: ASP.NET Core Rate Limiting middleware
- **Environment**: HTTPS only in production, secrets in Azure Key Vault or User Secrets

### Data Protection
- Encrypt sensitive data at rest and in transit
- Never commit secrets to repository
- Implement audit logging for critical operations
- OWASP Top 10 compliance
- Regular dependency security audits with `dotnet list package --vulnerable`

## Performance Standards

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling via EF Core (configured in connection string)
- Pagination for large datasets (Skip/Take or Keyset pagination)
- Avoid N+1 queries with `.Include()` and `.ThenInclude()`
- Query monitoring and slow query logging
- Use `AsNoTracking()` for read-only queries

### Caching Strategy
- **Distributed Cache**: Redis or SQL Server for distributed scenarios
- **Memory Cache**: `IMemoryCache` for single-instance caching
- **TTL Strategy**: Appropriate time-to-live for different data types
- **Invalidation**: Event-driven cache invalidation
- **Response Caching**: Use `[ResponseCache]` attribute for GET endpoints

## Additional Standards

### Logging
- Use `ILogger<T>` for structured logging
- Log levels: Trace, Debug, Information, Warning, Error, Critical
- Include correlation IDs for request tracing
- Never log sensitive information (passwords, tokens, PII)

### API Versioning
- Use URL versioning: `/api/v1/users`
- Support multiple versions simultaneously during migration
- Deprecation notices in response headers

### Health Checks
- Implement `/health` endpoint for liveness
- Implement `/health/ready` for readiness checks
- Include database, cache, and external service checks